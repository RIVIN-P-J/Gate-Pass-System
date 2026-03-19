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

// Get admin settings
router.get('/settings', requireAuth, requireRole('admin'), async (req, res) => {
  const settings = await query('SELECT setting_key, setting_value FROM AdminSettings')
  return res.json(settings)
})

// Update admin settings
router.post('/settings', requireAuth, requireRole('admin'), async (req, res) => {
  const { setting_key, setting_value } = req.body
  
  await query(
    'INSERT INTO AdminSettings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
    [setting_key, setting_value, setting_value]
  )
  
  return res.json({ success: true })
})

// Get dashboard statistics
router.get('/stats', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    // Get pending requests count
    const pendingResult = await query(
      'SELECT COUNT(*) as count FROM GatepassRequests WHERE status = ?',
      ['pending']
    )
    const pending = pendingResult[0].count

    // Get approved today count
    const approvedTodayResult = await query(
      `SELECT COUNT(*) as count FROM GatepassRequests 
       WHERE status = ? AND DATE(updated_at) = CURDATE()`,
      ['approved']
    )
    const approvedToday = approvedTodayResult[0].count

    // Get total requests count
    const totalResult = await query(
      'SELECT COUNT(*) as count FROM GatepassRequests'
    )
    const total = totalResult[0].count

    // Get additional stats for future use
    const rejectedResult = await query(
      'SELECT COUNT(*) as count FROM GatepassRequests WHERE status = ?',
      ['rejected']
    )
    const rejected = rejectedResult[0].count

    const completedResult = await query(
      'SELECT COUNT(*) as count FROM GatepassRequests WHERE status = ?',
      ['approved']
    )
    const completed = completedResult[0].count

    return res.json({
      pending,
      approvedToday,
      total,
      rejected,
      completed,
      // Additional useful stats
      todayTotal: pending + approvedToday,
      approvalRate: total > 0 ? Math.round((completed / total) * 100) : 0
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return res.status(500).json({ message: 'Failed to fetch statistics' })
  }
})

module.exports = router

