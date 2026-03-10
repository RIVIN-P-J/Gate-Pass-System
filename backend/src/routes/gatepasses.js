const express = require('express')
const { z } = require('zod')
const QRCode = require('qrcode')
const jwt = require('jsonwebtoken')
const { query } = require('../db/pool')
const { requireAuth, requireRole } = require('../middleware/auth')

const router = express.Router()

async function getStudentIdForUser(userId) {
  const rows = await query('SELECT id FROM Students WHERE user_id = ?', [userId])
  return rows[0]?.id
}

router.post('/', requireAuth, requireRole('student'), async (req, res) => {
  const schema = z.object({
    reason: z.string().min(3),
    out_time: z.string().min(1),
    in_time: z.string().min(1),
  })
  const body = schema.safeParse(req.body)
  if (!body.success) return res.status(400).json({ message: 'Invalid payload' })

  const studentId = await getStudentIdForUser(req.user.id)
  if (!studentId) return res.status(400).json({ message: 'Student profile missing' })

  const { reason, out_time, in_time } = body.data
  const result = await query(
    'INSERT INTO GatepassRequests (student_id, reason, out_time, in_time, status) VALUES (?, ?, ?, ?, ?)',
    [studentId, reason, new Date(out_time), new Date(in_time), 'pending'],
  )
  return res.json({ id: result.insertId })
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

