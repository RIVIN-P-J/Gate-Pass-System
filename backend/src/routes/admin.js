const express = require('express')
const { query } = require('../db/pool')
const { requireAuth, requireRole } = require('../middleware/auth')
const { notifyUser } = require('../realtime/hub')

const router = express.Router()

router.get('/gatepasses', requireAuth, requireRole('admin'), async (req, res) => {
  const items = await query(
    `SELECT g.id, g.reason, g.out_time, g.in_time, g.status, g.created_at,
            u.id as user_id, u.name as user_name, u.email as user_email,
            s.id as student_id, s.register_number, s.department, s.year
     FROM GatepassRequests g
     JOIN Students s ON s.id = g.student_id
     JOIN Users u ON u.id = s.user_id
     ORDER BY g.id DESC
     LIMIT 300`,
  )

  const shaped = items.map((x) => ({
    id: x.id,
    reason: x.reason,
    out_time: x.out_time,
    in_time: x.in_time,
    status: x.status,
    created_at: x.created_at,
    user: { id: x.user_id, name: x.user_name, email: x.user_email },
    student: { id: x.student_id, register_number: x.register_number, department: x.department, year: x.year },
  }))

  return res.json({ items: shaped })
})

router.post('/gatepasses/:id/approved', requireAuth, requireRole('admin'), async (req, res) => {
  const id = Number(req.params.id)
  await query('UPDATE GatepassRequests SET status = ? WHERE id = ? AND status = ?', ['approved', id, 'pending'])

  const rows = await query(
    `SELECT u.id as user_id
     FROM GatepassRequests g
     JOIN Students s ON s.id = g.student_id
     JOIN Users u ON u.id = s.user_id
     WHERE g.id = ?`,
    [id],
  )
  const userId = rows[0]?.user_id
  if (userId) notifyUser(userId, { title: `Gatepass #${id} approved` })

  return res.json({ ok: true })
})

router.post('/gatepasses/:id/rejected', requireAuth, requireRole('admin'), async (req, res) => {
  const id = Number(req.params.id)
  await query('UPDATE GatepassRequests SET status = ? WHERE id = ? AND status = ?', ['rejected', id, 'pending'])

  const rows = await query(
    `SELECT u.id as user_id
     FROM GatepassRequests g
     JOIN Students s ON s.id = g.student_id
     JOIN Users u ON u.id = s.user_id
     WHERE g.id = ?`,
    [id],
  )
  const userId = rows[0]?.user_id
  if (userId) notifyUser(userId, { title: `Gatepass #${id} rejected` })

  return res.json({ ok: true })
})

router.get('/analytics', requireAuth, requireRole('admin'), async (req, res) => {
  const totalsRows = await query(
    `SELECT
      SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN status='approved' THEN 1 ELSE 0 END) AS approved,
      SUM(CASE WHEN status='rejected' THEN 1 ELSE 0 END) AS rejected
     FROM GatepassRequests`,
  )
  const totals = {
    pending: Number(totalsRows[0]?.pending || 0),
    approved: Number(totalsRows[0]?.approved || 0),
    rejected: Number(totalsRows[0]?.rejected || 0),
  }

  const dailyRows = await query(
    `SELECT DATE(created_at) as day, COUNT(*) as total
     FROM GatepassRequests
     WHERE created_at >= (NOW() - INTERVAL 14 DAY)
     GROUP BY DATE(created_at)
     ORDER BY day ASC`,
  )

  const daily = dailyRows.map((r) => ({ day: String(r.day), total: Number(r.total) }))
  return res.json({ totals, daily })
})

module.exports = router

