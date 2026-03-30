const express = require('express')
const { z } = require('zod')
const QRCode = require('qrcode')
const jwt = require('jsonwebtoken')
const { query } = require('../db/pool')
const { requireAuth, requireRole } = require('../middleware/auth')
const notificationService = require('../services/notificationService')
const { checkMonthlyLimit, createNotification } = require('./notifications')

const router = express.Router()

async function getStudentIdForUser(userId) {
  const rows = await query('SELECT id FROM Students WHERE user_id = ?', [userId])
  return rows[0]?.id
}

async function logEmergencyAudit(gatepassId, studentId, eventType, details = null) {
  try {
    await query(
      `INSERT INTO EmergencyRequestAudits
       (gatepass_id, student_id, event_type, details)
       VALUES (?, ?, ?, ?)`,
      [gatepassId, studentId, eventType, details]
    )
  } catch (error) {
    console.error('Error logging emergency audit:', error)
  }
}

router.post('/', requireAuth, requireRole('student'), async (req, res) => {
  const schema = z.object({
    gatepass_type: z.enum(['standard', 'emergency']).optional().default('standard'),
    reason: z.string().min(3),
    out_time: z.string().optional(),
    in_time: z.string().optional(),
    emergency_category: z.enum(['medical', 'family', 'other']).optional(),
    duration_minutes: z.coerce.number().int().min(15).max(720).optional(),
  })
  const body = schema.safeParse(req.body)
  if (!body.success) return res.status(400).json({ message: 'Invalid payload', errors: body.error.flatten() })

  const studentId = await getStudentIdForUser(req.user.id)
  if (!studentId) return res.status(400).json({ message: 'Student profile missing' })

  const { gatepass_type, reason, out_time, in_time, emergency_category, duration_minutes } = body.data
  const now = new Date()
  let outDateTime
  let inDateTime
  let priority = 'standard'
  let autoApproved = false
  let status = 'pending'
  let expectedDuration = null

  if (gatepass_type === 'emergency') {
    if (!emergency_category) {
      return res.status(400).json({ message: 'Emergency category is required' })
    }
    if (!duration_minutes) {
      return res.status(400).json({ message: 'Expected duration is required' })
    }

    const recentEmergency = await query(
      `SELECT COUNT(*) as count
       FROM GatepassRequests
       WHERE student_id = ? AND gatepass_type = 'emergency'
         AND created_at >= (NOW() - INTERVAL 7 DAY)`,
      [studentId]
    )

    if (Number(recentEmergency[0]?.count || 0) >= 3) {
      return res.status(429).json({ message: 'Emergency gatepass limit exceeded. Only 3 emergency requests are allowed per week.' })
    }

    outDateTime = now
    inDateTime = new Date(now.getTime() + duration_minutes * 60000)
    expectedDuration = duration_minutes
    priority = 'high'
    autoApproved = emergency_category === 'medical' || emergency_category === 'family'
    status = autoApproved ? 'approved' : 'pending'
  } else {
    if (!out_time || !in_time) {
      return res.status(400).json({ message: 'OUT and IN times are required for standard requests' })
    }
    outDateTime = new Date(out_time)
    inDateTime = new Date(in_time)

    const errors = []
    if (outDateTime < now) {
      errors.push('OUT time cannot be in the past')
    }
    if (inDateTime <= outDateTime) {
      errors.push('IN time must be later than OUT time')
    }

    const maxFutureDays = 30
    const maxFutureDate = new Date()
    maxFutureDate.setDate(maxFutureDate.getDate() + maxFutureDays)
    if (outDateTime > maxFutureDate) {
      errors.push(`OUT time cannot be more than ${maxFutureDays} days in the future`)
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors })
    }
  }

  const result = await query(
    `INSERT INTO GatepassRequests
     (student_id, reason, gatepass_type, emergency_category, expected_duration_minutes,
      priority, auto_approved, out_time, in_time, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [studentId, reason, gatepass_type, emergency_category || null, expectedDuration,
      priority, autoApproved ? 1 : 0, outDateTime, inDateTime, status]
  )

  const gatepassId = result.insertId

  if (gatepass_type === 'emergency') {
    await logEmergencyAudit(gatepassId, studentId, 'created', `category=${emergency_category}, duration=${duration_minutes}min`)

    const notificationMessage = `Emergency gatepass requested: ${emergency_category.toUpperCase()} (${reason}). ${autoApproved ? 'Auto-approved' : 'Pending admin review.'}`
    createNotification(studentId, gatepassId, 'emergency_request', notificationMessage)
      .catch(err => console.error('Error notifying admins about emergency request:', err))

    notificationService.sendParentNotification(studentId, 'emergency', now)
      .catch(err => console.error('Error sending emergency parent notification:', err))

    if (autoApproved) {
      await logEmergencyAudit(gatepassId, studentId, 'auto_approved', `Auto-approved for ${emergency_category}`)
    }
  }

  // Check monthly limit (async, don't wait for response)
  checkMonthlyLimit(studentId, gatepassId).catch(err => 
    console.error('Error checking monthly limit:', err)
  )

  return res.json({ id: gatepassId, status })
})

router.get('/mine', requireAuth, requireRole('student'), async (req, res) => {
  const studentId = await getStudentIdForUser(req.user.id)
  if (!studentId) return res.status(400).json({ message: 'Student profile missing' })

  const rows = await query(
    'SELECT id, reason, out_time, in_time, status FROM GatepassRequests WHERE student_id = ? ORDER BY id DESC LIMIT 100',
    [studentId],
  )

  const items = await Promise.all(
    rows.map(async (r) => {
      if (r.status !== 'approved') return { ...r, qr_data_url: null }
      const payload = jwt.sign({ gatepassId: r.id, type: 'gatepass' }, process.env.JWT_SECRET, { expiresIn: '2d' })
      const qr_data_url = await QRCode.toDataURL(payload, { margin: 1, width: 256 })
      return { ...r, qr_data_url }
    }),
  )

  return res.json({ items })
})

module.exports = router

