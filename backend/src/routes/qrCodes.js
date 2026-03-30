const express = require('express')
const jwt = require('jsonwebtoken')
const { query } = require('../db/pool')
const { requireAuth, requireRole } = require('../middleware/auth')

const router = express.Router()

// Generate QR code for student entry
router.get('/student/:gatepassId', requireAuth, requireRole('student'), async (req, res) => {
  const gatepassId = Number(req.params.gatepassId)
  const studentId = await getStudentIdForUser(req.user.id)
  
  if (!studentId) {
    return res.status(400).json({ message: 'Student profile missing' })
  }

  try {
    // Verify gatepass belongs to this student and is approved
    const gatepass = await query(
      `SELECT id, status, out_time, in_time, student_id 
       FROM GatepassRequests 
       WHERE id = ? AND student_id = ?`,
      [gatepassId, studentId]
    )

    if (!gatepass.length) {
      return res.status(404).json({ message: 'Gatepass not found' })
    }

    if (gatepass[0].status !== 'approved') {
      return res.status(400).json({ message: 'Gatepass is not approved' })
    }

    // Check if student has already exited
    const exitLog = await query(
      'SELECT exit_time FROM Logs WHERE gatepass_id = ? AND exit_time IS NOT NULL',
      [gatepassId]
    )

    if (!exitLog.length) {
      return res.status(400).json({ message: 'Student has not exited yet' })
    }

    // Check if student has already entered
    const entryLog = await query(
      'SELECT entry_time FROM Logs WHERE gatepass_id = ? AND entry_time IS NOT NULL',
      [gatepassId]
    )

    if (entryLog.length) {
      return res.status(400).json({ message: 'Student has already entered' })
    }

    // Generate QR code payload for the original gatepass, usable for both exit and entry
    const payload = {
      type: 'gatepass',
      gatepassId: gatepassId,
      studentId: studentId,
      generatedAt: new Date().toISOString()
    }

    // Sign the payload
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2d' })

    return res.json({
      qrToken: token,
      gatepass: {
        id: gatepass[0].id,
        out_time: gatepass[0].out_time,
        in_time: gatepass[0].in_time,
        exit_time: exitLog[0].exit_time
      },
      message: 'QR code generated for entry'
    })

  } catch (error) {
    console.error('Error generating entry QR code:', error)
    return res.status(500).json({ message: 'Failed to generate QR code' })
  }
})

// Verify entry QR code (for security)
router.post('/verify-entry', requireAuth, requireRole('security'), async (req, res) => {
  const { qrToken } = req.body

  if (!qrToken) {
    return res.status(400).json({ message: 'QR token is required' })
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(qrToken, process.env.JWT_SECRET)

    if (decoded?.type !== 'entry' || !decoded?.gatepassId) {
      return res.status(400).json({ message: 'Invalid QR code for entry' })
    }

    const gatepassId = decoded.gatepassId
    const studentId = decoded.studentId

    // Get gatepass details
    const gatepass = await query(
      `SELECT g.id, g.reason, g.out_time, g.in_time, g.status,
              s.register_number, s.department, s.year
       FROM GatepassRequests g
       JOIN Students s ON s.id = g.student_id
       WHERE g.id = ? AND g.student_id = ?`,
      [gatepassId, studentId]
    )

    if (!gatepass.length) {
      return res.status(404).json({ message: 'Gatepass not found' })
    }

    if (gatepass[0].status !== 'approved') {
      return res.status(400).json({ message: 'Gatepass is not approved' })
    }

    // Check if student has exited
    const exitLog = await query(
      'SELECT exit_time FROM Logs WHERE gatepass_id = ? AND exit_time IS NOT NULL',
      [gatepassId]
    )

    if (!exitLog.length) {
      return res.status(400).json({ message: 'Student has not exited yet' })
    }

    // Check if student has already entered
    const entryLog = await query(
      'SELECT entry_time FROM Logs WHERE gatepass_id = ? AND entry_time IS NOT NULL',
      [gatepassId]
    )

    if (entryLog.length) {
      return res.status(400).json({ message: 'Student has already entered' })
    }

    return res.json({
      gatepass: {
        id: gatepass[0].id,
        reason: gatepass[0].reason,
        out_time: gatepass[0].out_time,
        in_time: gatepass[0].in_time,
        status: gatepass[0].status
      },
      student: {
        register_number: gatepass[0].register_number,
        department: gatepass[0].department,
        year: gatepass[0].year
      },
      exit_time: exitLog[0].exit_time
    })

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({ message: 'Invalid or expired QR code' })
    }
    console.error('Error verifying entry QR code:', error)
    return res.status(500).json({ message: 'Failed to verify QR code' })
  }
})

// Helper function to get student ID for user
async function getStudentIdForUser(userId) {
  const rows = await query('SELECT id FROM Students WHERE user_id = ?', [userId])
  return rows[0]?.id
}

module.exports = router
