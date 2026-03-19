const express = require('express')
const { query } = require('../db/pool')
const { requireAuth, requireRole } = require('../middleware/auth')

const router = express.Router()

async function getStudentIdForUser(userId) {
  const rows = await query('SELECT id FROM Students WHERE user_id = ?', [userId])
  return rows[0]?.id
}

// Get current student status
router.get('/current', requireAuth, requireRole('student'), async (req, res) => {
  const studentId = await getStudentIdForUser(req.user.id)
  if (!studentId) return res.status(400).json({ message: 'Student profile missing' })

  const status = await query(
    `SELECT ss.status, ss.current_gatepass_id, ss.status_time,
            g.reason, g.out_time, g.in_time
     FROM StudentStatus ss
     LEFT JOIN GatepassRequests g ON g.id = ss.current_gatepass_id
     WHERE ss.student_id = ?
     ORDER BY ss.status_time DESC
     LIMIT 1`,
    [studentId]
  )

  return res.json(status[0] || { status: 'INSIDE', current_gatepass_id: null, status_time: new Date() })
})

// Update student status (internal function)
async function updateStudentStatus(studentId, status, gatepassId = null) {
  // First, get the current status to ensure proper transitions
  const currentStatus = await query(
    'SELECT status FROM StudentStatus WHERE student_id = ? ORDER BY status_time DESC LIMIT 1',
    [studentId]
  )

  const currentStatusValue = currentStatus.length > 0 ? currentStatus[0].status : 'INSIDE'
  
  // Validate status transitions
  const validTransitions = {
    'INSIDE': ['OUTSIDE'],
    'OUTSIDE': ['INSIDE', 'OVERDUE'],
    'OVERDUE': ['INSIDE']
  }

  if (currentStatusValue && !validTransitions[currentStatusValue].includes(status)) {
    console.warn(`Invalid status transition from ${currentStatusValue} to ${status} for student ${studentId}`)
    // Still allow the update but log the warning
  }

  await query(
    `INSERT INTO StudentStatus (student_id, status, current_gatepass_id)
     VALUES (?, ?, ?)`,
    [studentId, status, gatepassId]
  )
}

// Check for overdue students
async function checkOverdueStudents() {
  const overdueStudents = await query(
    `SELECT ss.student_id, ss.current_gatepass_id, g.in_time as expected_return
     FROM StudentStatus ss
     JOIN GatepassRequests g ON g.id = ss.current_gatepass_id
     WHERE ss.status = 'OUTSIDE' 
     AND g.in_time < NOW()`
  )

  for (const student of overdueStudents) {
    await updateStudentStatus(student.student_id, 'OVERDUE', student.current_gatepass_id)
  }
}

module.exports = router
module.exports.updateStudentStatus = updateStudentStatus
module.exports.checkOverdueStudents = checkOverdueStudents
