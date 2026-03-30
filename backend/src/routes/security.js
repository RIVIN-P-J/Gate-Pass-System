const express = require('express')
const jwt = require('jsonwebtoken')
const { z } = require('zod')
const { query } = require('../db/pool')
const { requireAuth, requireRole } = require('../middleware/auth')
const { updateStudentStatus } = require('./studentStatus')
const { checkLateReturn } = require('./studentStatus')
const notificationService = require('../services/notificationService')

const router = express.Router()

router.post('/verify', requireAuth, requireRole('security'), async (req, res) => {
  const schema = z.object({ payload: z.string().min(10) })
  const body = schema.safeParse(req.body)
  if (!body.success) return res.status(400).json({ message: 'Invalid payload' })

  let decoded
  try {
    decoded = jwt.verify(body.data.payload, process.env.JWT_SECRET)
  } catch {
    return res.status(400).json({ message: 'Invalid or expired QR' })
  }

  if (decoded?.type !== 'gatepass' || !decoded?.gatepassId) return res.status(400).json({ message: 'Invalid QR payload' })

  const gpRows = await query(
    `SELECT g.id, g.reason, g.out_time, g.in_time, g.status, g.student_id,
            s.register_number, s.department, s.year
     FROM GatepassRequests g
     JOIN Students s ON s.id = g.student_id
     WHERE g.id = ?`,
    [decoded.gatepassId],
  )
  const gp = gpRows[0]
  if (!gp) return res.status(404).json({ message: 'Gatepass not found' })
  if (gp.status !== 'approved') return res.status(400).json({ message: 'Gatepass not approved' })

  const actionTime = new Date()
  const logRows = await query(
    'SELECT id, exit_time, entry_time FROM Logs WHERE gatepass_id = ? ORDER BY id DESC LIMIT 1',
    [decoded.gatepassId]
  )

  let action = null
  let exitTime = null
  let entryTime = null

  if (!logRows.length || !logRows[0].exit_time) {
    action = 'exit'
    if (!logRows.length) {
      await query('INSERT INTO Logs (gatepass_id, exit_time) VALUES (?, ?)', [decoded.gatepassId, actionTime])
    } else {
      await query('UPDATE Logs SET exit_time = ? WHERE gatepass_id = ?', [actionTime, decoded.gatepassId])
    }
    exitTime = actionTime
    entryTime = logRows[0]?.entry_time || null
  } else if (logRows[0].exit_time && !logRows[0].entry_time) {
    action = 'entry'
    await query('UPDATE Logs SET entry_time = ? WHERE gatepass_id = ?', [actionTime, decoded.gatepassId])
    exitTime = logRows[0].exit_time
    entryTime = actionTime
  } else {
    return res.status(400).json({
      message: 'This gatepass cycle is already completed. Student has both exited and entered.',
      code: 'CYCLE_COMPLETED'
    })
  }

  const studentId = gp.student_id
  if (studentId) {
    if (action === 'exit') {
      await updateStudentStatus(studentId, 'OUTSIDE', decoded.gatepassId)
    } else {
      await updateStudentStatus(studentId, 'INSIDE', null)
    }
    notificationService.sendParentNotification(studentId, action, actionTime)
      .catch(err => console.error('Error sending parent notification:', err))
  }

  return res.json({
    action,
    action_time: actionTime,
    gatepass: { id: gp.id, reason: gp.reason, out_time: gp.out_time, in_time: gp.in_time, status: gp.status },
    student: { register_number: gp.register_number, department: gp.department, year: gp.year },
    exit_time: exitTime,
    entry_time: entryTime,
  })
})

router.post('/gatepasses/:id/exit', requireAuth, requireRole('security'), async (req, res) => {
  const id = Number(req.params.id)

  // Check if gatepass exists and is approved
  const gatepass = await query('SELECT id, status, student_id FROM GatepassRequests WHERE id = ?', [id])
  if (!gatepass.length) {
    return res.status(404).json({ message: 'Gatepass not found' })
  }
  if (gatepass[0].status !== 'approved') {
    return res.status(400).json({ message: 'Gatepass is not approved' })
  }

  const existing = await query('SELECT id, exit_time, entry_time FROM Logs WHERE gatepass_id = ?', [id])
  
  // Validation: Check if student has already exited (one exit only)
  if (existing.length > 0 && existing[0].exit_time) {
    return res.status(400).json({ 
      message: 'This QR code has already been used for exit. Each gatepass allows only one exit.',
      code: 'ALREADY_EXITED'
    })
  }
  
  // Validation: Check if student has already completed the cycle (exited and entered)
  if (existing.length > 0 && existing[0].entry_time) {
    return res.status(400).json({ 
      message: 'This gatepass cycle is already completed. Student has both exited and entered.',
      code: 'CYCLE_COMPLETED'
    })
  }

  const actionTime = new Date()

  // Create or update exit record with a consistent timestamp
  if (!existing.length) {
    await query('INSERT INTO Logs (gatepass_id, exit_time) VALUES (?, ?)', [id, actionTime])
  } else {
    await query('UPDATE Logs SET exit_time = ? WHERE gatepass_id = ?', [actionTime, id])
  }

  // Update student status to OUTSIDE when they exit
  const studentId = gatepass[0].student_id || (await query('SELECT student_id FROM GatepassRequests WHERE id = ?', [id]))[0]?.student_id
  if (studentId) {
    await updateStudentStatus(studentId, 'OUTSIDE', id)
    
    // Send parent notification for student exit (async, don't wait for response)
    notificationService.sendParentNotification(studentId, 'exit', actionTime)
      .catch(err => console.error('Error sending parent notification for exit:', err))
  }

  const gp = await query('SELECT id, reason, out_time, in_time, status FROM GatepassRequests WHERE id = ?', [id])
  return res.json({ gatepass: gp[0] })
})

router.post('/gatepasses/:id/entry', requireAuth, requireRole('security'), async (req, res) => {
  const id = Number(req.params.id)

  // Check if gatepass exists and is approved
  const gatepass = await query('SELECT id, status, student_id FROM GatepassRequests WHERE id = ?', [id])
  if (!gatepass.length) {
    return res.status(404).json({ message: 'Gatepass not found' })
  }
  if (gatepass[0].status !== 'approved') {
    return res.status(400).json({ message: 'Gatepass is not approved' })
  }

  const existing = await query('SELECT id, exit_time, entry_time FROM Logs WHERE gatepass_id = ?', [id])
  
  // Validation: Student must exit before entering (proper sequence)
  if (!existing.length) {
    return res.status(400).json({ 
      message: 'Student must exit before entering. No exit record found for this gatepass.',
      code: 'NO_EXIT_RECORD'
    })
  }
  
  if (!existing[0].exit_time) {
    return res.status(400).json({ 
      message: 'Student has not exited yet. Cannot mark entry without exit.',
      code: 'NO_EXIT_TIME'
    })
  }
  
  // Validation: Check if student has already entered (one entry only)
  if (existing[0].entry_time) {
    return res.status(400).json({ 
      message: 'This QR code has already been used for entry. Each gatepass allows only one entry.',
      code: 'ALREADY_ENTERED'
    })
  }

  const actionTime = new Date()

  // Update the entry time with a consistent timestamp
  await query('UPDATE Logs SET entry_time = ? WHERE gatepass_id = ?', [actionTime, id])
  const logId = existing[0].id

  // Check for late return and send notification
  const gatepassDetails = await query(
    'SELECT in_time FROM GatepassRequests WHERE id = ?',
    [id]
  )

  if (gatepassDetails.length > 0) {
    const approvedInTime = new Date(gatepassDetails[0].in_time)
    const actualEntryTime = actionTime
    
    // Check if entry is late (more than 5 minutes after approved time)
    const lateThresholdMinutes = 5
    const lateThreshold = new Date(approvedInTime.getTime() + lateThresholdMinutes * 60000)
    
    if (actualEntryTime > lateThreshold) {
      // Calculate late duration
      const lateMinutes = Math.round((actualEntryTime - approvedInTime) / 60000)
      
      // Send late return notification
      try {
        const { createNotification } = require('./notifications')
        await createNotification(
          studentId || (await query('SELECT student_id FROM GatepassRequests WHERE id = ?', [id]))[0]?.student_id,
          id,
          'late_return',
          `Student is ${lateMinutes} minutes late. Expected: ${approvedInTime.toLocaleString()}, Actual: ${actualEntryTime.toLocaleString()}`
        )
      } catch (notificationError) {
        console.error('Error sending late return notification:', notificationError)
      }
    }
  }

  // Check for late return (async, don't wait for response)
  if (logId) {
    checkLateReturn(logId).catch(err => 
      console.error('Error checking late return:', err)
    )
  }

  // Update student status to INSIDE when they return
  const studentId = gatepass[0].student_id || (await query('SELECT student_id FROM GatepassRequests WHERE id = ?', [id]))[0]?.student_id
  if (studentId) {
    await updateStudentStatus(studentId, 'INSIDE', null)
    
    // Send parent notification for student entry (async, don't wait for response)
    notificationService.sendParentNotification(studentId, 'entry', actionTime)
      .catch(err => console.error('Error sending parent notification for entry:', err))
  }

  const gp = await query('SELECT id, reason, out_time, in_time, status FROM GatepassRequests WHERE id = ?', [id])
  return res.json({ gatepass: gp[0] })
})

// Get log status for a gatepass
router.get('/gatepasses/:id/log-status', requireAuth, requireRole('security'), async (req, res) => {
  const id = Number(req.params.id)

  // First check if gatepass exists and is approved
  const gatepass = await query('SELECT id, status FROM GatepassRequests WHERE id = ?', [id])
  if (!gatepass.length) {
    return res.json({ 
      canExit: false, 
      canEnter: false, 
      status: 'not_found',
      message: 'Gatepass not found',
      log: null
    })
  }
  if (gatepass[0].status !== 'approved') {
    return res.json({ 
      canExit: false, 
      canEnter: false, 
      status: 'not_approved',
      message: 'Gatepass is not approved',
      log: null
    })
  }

  const log = await query(
    'SELECT id, exit_time, entry_time FROM Logs WHERE gatepass_id = ? ORDER BY id DESC LIMIT 1',
    [id]
  )

  if (!log.length) {
    return res.json({ 
      canExit: true, 
      canEnter: false, 
      status: 'not_used',
      message: 'QR code not used yet - ready for first exit',
      log: null
    })
  }

  const currentLog = log[0]
  let canExit = false
  let canEnter = false
  let status = 'unknown'
  let message = ''

  if (!currentLog.exit_time) {
    canExit = true
    canEnter = false
    status = 'pending_exit'
    message = 'QR code ready for exit - no exit recorded yet'
  } else if (currentLog.exit_time && !currentLog.entry_time) {
    canExit = false
    canEnter = true
    status = 'outside'
    message = 'QR code used for exit - ready for entry'
  } else if (currentLog.exit_time && currentLog.entry_time) {
    canExit = false
    canEnter = false
    status = 'completed'
    message = 'QR code fully used - both exit and entry completed'
  }

  return res.json({ 
    canExit, 
    canEnter, 
    status, 
    message,
    log: currentLog
  })
})

router.get('/logs', requireAuth, requireRole('security'), async (req, res) => {
  const rows = await query(
    `SELECT l.id, l.gatepass_id, l.exit_time, l.entry_time,
            s.register_number as student_register_number, s.department as student_department, s.year as student_year
     FROM Logs l
     JOIN GatepassRequests g ON g.id = l.gatepass_id
     JOIN Students s ON s.id = g.student_id
     ORDER BY l.id DESC
     LIMIT 200`,
  )
  return res.json({ items: rows })
})

module.exports = router

