const express = require('express')
const { query } = require('../db/pool')
const { requireAuth, requireRole } = require('../middleware/auth')
const { notifyUser } = require('../realtime/hub')

const router = express.Router()

// Get all notifications for admin
router.get('/', requireAuth, requireRole('admin'), async (req, res) => {
  const adminId = req.user.id
  const { unreadOnly, limit = 50 } = req.query
  
  let whereClause = 'WHERE admin_id = ?'
  const params = [adminId]
  
  if (unreadOnly === 'true') {
    whereClause += ' AND is_read = FALSE'
  }
  
  const notifications = await query(
    `SELECT n.id, n.notification_type, n.message, n.notification_time, n.is_read,
            u.name as student_name, s.register_number,
            g.id as gatepass_id, g.reason
     FROM AdminNotifications n
     LEFT JOIN Students s ON s.id = n.student_id
     LEFT JOIN Users u ON u.id = s.user_id
     LEFT JOIN GatepassRequests g ON g.id = n.gatepass_id
     ${whereClause}
     ORDER BY n.notification_time DESC
     LIMIT ?`,
    [...params, Number(limit)]
  )
  
  return res.json(notifications)
})

// Get unread count
router.get('/unread-count', requireAuth, requireRole('admin'), async (req, res) => {
  const adminId = req.user.id
  
  const result = await query(
    'SELECT COUNT(*) as count FROM AdminNotifications WHERE admin_id = ? AND is_read = FALSE',
    [adminId]
  )
  
  return res.json({ count: result[0]?.count || 0 })
})

// Mark notification as read
router.post('/:id/read', requireAuth, requireRole('admin'), async (req, res) => {
  const notificationId = Number(req.params.id)
  const adminId = req.user.id
  
  await query(
    'UPDATE AdminNotifications SET is_read = TRUE WHERE id = ? AND admin_id = ?',
    [notificationId, adminId]
  )
  
  return res.json({ success: true })
})

// Mark all notifications as read
router.post('/mark-all-read', requireAuth, requireRole('admin'), async (req, res) => {
  const adminId = req.user.id
  
  await query(
    'UPDATE AdminNotifications SET is_read = TRUE WHERE admin_id = ?',
    [adminId]
  )
  
  return res.json({ success: true })
})

// Create notification (internal function)
async function createNotification(studentId, gatepassId, notificationType, message) {
  try {
    // Get all admin users
    const admins = await query('SELECT id FROM Users WHERE role = ?', ['admin'])
    
    if (!admins.length) return
    
    // Get student details
    const studentDetails = await query(
      `SELECT u.name, s.register_number 
       FROM Students s 
       JOIN Users u ON u.id = s.user_id 
       WHERE s.id = ?`,
      [studentId]
    )
    
    const student = studentDetails[0]
    if (!student) return
    
    // Create notifications for all admins
    for (const admin of admins) {
      await query(
        `INSERT INTO AdminNotifications (admin_id, student_id, gatepass_id, notification_type, message)
         VALUES (?, ?, ?, ?, ?)`,
        [admin.id, studentId, gatepassId, notificationType, message]
      )
      
      // Send real-time notification
      notifyUser(admin.id, {
        title: 'Student Alert',
        message,
        type: 'notification',
        data: {
          notificationType,
          studentName: student.name,
          registerNumber: student.register_number,
          gatepassId
        }
      })
    }
  } catch (error) {
    console.error('Error creating notification:', error)
  }
}

// Check for late return
async function checkLateReturn(logId) {
  try {
    // Get the log and gatepass details
    const logDetails = await query(
      `SELECT l.gatepass_id, l.entry_time, l.exit_time,
              g.in_time as approved_in_time, g.student_id,
              s.setting_value as grace_minutes
       FROM Logs l
       JOIN GatepassRequests g ON g.id = l.gatepass_id
       JOIN AdminSettings s ON s.setting_key = 'late_return_grace_minutes'
       WHERE l.id = ? AND g.status = 'approved'`,
      [logId]
    )
    
    if (!logDetails.length) return
    
    const log = logDetails[0]
    const graceMinutes = log.grace_minutes || 15
    
    // Calculate if student returned late
    const approvedInTime = new Date(log.approved_in_time)
    const actualInTime = new Date(log.entry_time)
    const lateMinutes = (actualInTime - approvedInTime) / (1000 * 60)
    
    if (lateMinutes > graceMinutes) {
      const message = `Student returned ${Math.round(lateMinutes)} minutes late (grace: ${graceMinutes} min)`
      await createNotification(log.student_id, log.gatepass_id, 'late_return', message)
    }
  } catch (error) {
    console.error('Error checking late return:', error)
  }
}

// Check monthly pass limit
async function checkMonthlyLimit(studentId, gatepassId) {
  try {
    // Get monthly limit setting
    const limitSetting = await query(
      'SELECT setting_value FROM AdminSettings WHERE setting_key = ?',
      ['monthly_pass_limit']
    )
    
    const monthlyLimit = limitSetting[0]?.setting_value || 5
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
    
    // Get or create monthly count
    await query(
      `INSERT INTO StudentMonthlyCounts (student_id, month_year, pass_count)
       VALUES (?, ?, 1)
       ON DUPLICATE KEY UPDATE pass_count = pass_count + 1`,
      [studentId, currentMonth]
    )
    
    // Check if limit exceeded
    const countResult = await query(
      'SELECT pass_count FROM StudentMonthlyCounts WHERE student_id = ? AND month_year = ?',
      [studentId, currentMonth]
    )
    
    const currentCount = countResult[0]?.pass_count || 0
    
    if (currentCount > monthlyLimit) {
      const message = `Student has requested ${currentCount} gatepasses this month (limit: ${monthlyLimit})`
      await createNotification(studentId, gatepassId, 'monthly_limit_exceeded', message)
    }
  } catch (error) {
    console.error('Error checking monthly limit:', error)
  }
}

// Export helper functions
module.exports = router
module.exports.createNotification = createNotification
module.exports.checkLateReturn = checkLateReturn
module.exports.checkMonthlyLimit = checkMonthlyLimit
