const express = require('express')
const jwt = require('jsonwebtoken')
const { z } = require('zod')
const { query } = require('../db/pool')
const { requireAuth, requireRole } = require('../middleware/auth')

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
    `SELECT g.id, g.reason, g.out_time, g.in_time, g.status,
            s.register_number, s.department, s.year
     FROM GatepassRequests g
     JOIN Students s ON s.id = g.student_id
     WHERE g.id = ?`,
    [decoded.gatepassId],
  )
  const gp = gpRows[0]
  if (!gp) return res.status(404).json({ message: 'Gatepass not found' })
  if (gp.status !== 'approved') return res.status(400).json({ message: 'Gatepass not approved' })

  return res.json({
    gatepass: { id: gp.id, reason: gp.reason, out_time: gp.out_time, in_time: gp.in_time, status: gp.status },
    student: { register_number: gp.register_number, department: gp.department, year: gp.year },
  })
})

router.post('/gatepasses/:id/exit', requireAuth, requireRole('security'), async (req, res) => {
  const id = Number(req.params.id)

  const existing = await query('SELECT id, exit_time, entry_time FROM Logs WHERE gatepass_id = ?', [id])
  if (!existing.length) {
    await query('INSERT INTO Logs (gatepass_id, exit_time) VALUES (?, NOW())', [id])
  } else if (!existing[0].exit_time) {
    await query('UPDATE Logs SET exit_time = NOW() WHERE gatepass_id = ?', [id])
  }

  const gp = await query('SELECT id, reason, out_time, in_time, status FROM GatepassRequests WHERE id = ?', [id])
  return res.json({ gatepass: gp[0] })
})

router.post('/gatepasses/:id/entry', requireAuth, requireRole('security'), async (req, res) => {
  const id = Number(req.params.id)

  const existing = await query('SELECT id, exit_time, entry_time FROM Logs WHERE gatepass_id = ?', [id])
  if (!existing.length) {
    await query('INSERT INTO Logs (gatepass_id, entry_time) VALUES (?, NOW())', [id])
  } else if (!existing[0].entry_time) {
    await query('UPDATE Logs SET entry_time = NOW() WHERE gatepass_id = ?', [id])
  }

  const gp = await query('SELECT id, reason, out_time, in_time, status FROM GatepassRequests WHERE id = ?', [id])
  return res.json({ gatepass: gp[0] })
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

