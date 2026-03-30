const express = require('express')
const { query } = require('../db/pool')
const { requireAuth, requireRole } = require('../middleware/auth')
const notificationService = require('../services/notificationService')

const router = express.Router()

// Get all parent contacts for a student
router.get('/student/:studentId', requireAuth, async (req, res) => {
  const studentId = Number(req.params.studentId)
  const userId = req.user.id

  try {
    // Verify that the user can access this student's contacts
    let allowedStudentId = studentId
    
    if (req.user.role === 'student') {
      // Students can only view their own contacts
      const student = await query('SELECT id FROM Students WHERE user_id = ?', [userId])
      if (!student.length || student[0].id !== studentId) {
        return res.status(403).json({ message: 'Access denied' })
      }
      allowedStudentId = student[0].id
    } else if (req.user.role === 'admin' || req.user.role === 'security') {
      // Admin and security can view any student's contacts
      allowedStudentId = studentId
    }

    const contacts = await query(
      `SELECT id, contact_type, contact_value, contact_name, relationship, 
              is_active, preferred_method, created_at, updated_at
       FROM ParentContacts 
       WHERE student_id = ? 
       ORDER BY created_at DESC`,
      [allowedStudentId]
    )

    return res.json(contacts)
  } catch (error) {
    console.error('Error fetching parent contacts:', error)
    return res.status(500).json({ message: 'Failed to fetch parent contacts' })
  }
})

// Add a new parent contact
router.post('/student/:studentId', requireAuth, async (req, res) => {
  const studentId = Number(req.params.studentId)
  const { contact_type, contact_value, contact_name, relationship, preferred_method = 'both' } = req.body

  // Validation
  if (!contact_type || !contact_value || !contact_name || !relationship) {
    return res.status(400).json({ message: 'All required fields must be provided' })
  }

  if (!['sms', 'email'].includes(contact_type)) {
    return res.status(400).json({ message: 'Invalid contact type' })
  }

  if (!['sms', 'email', 'both'].includes(preferred_method)) {
    return res.status(400).json({ message: 'Invalid preferred method' })
  }

  // Validate contact format
  if (contact_type === 'sms' && !/^[\+]?[1-9][\d]{0,15}$/.test(contact_value)) {
    return res.status(400).json({ message: 'Invalid phone number format' })
  }

  if (contact_type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact_value)) {
    return res.status(400).json({ message: 'Invalid email format' })
  }

  try {
    // Verify access permissions
    if (req.user.role === 'student') {
      const student = await query('SELECT id FROM Students WHERE user_id = ?', [req.user.id])
      if (!student.length || student[0].id !== studentId) {
        return res.status(403).json({ message: 'Access denied' })
      }
    }

    // Check for duplicate contact
    const existing = await query(
      'SELECT id FROM ParentContacts WHERE student_id = ? AND contact_type = ? AND contact_value = ?',
      [studentId, contact_type, contact_value]
    )

    if (existing.length > 0) {
      return res.status(400).json({ message: 'This contact already exists' })
    }

    // Add the contact
    const result = await query(
      `INSERT INTO ParentContacts 
       (student_id, contact_type, contact_value, contact_name, relationship, preferred_method) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [studentId, contact_type, contact_value, contact_name, relationship, preferred_method]
    )

    return res.json({
      id: result.insertId,
      message: 'Parent contact added successfully'
    })

  } catch (error) {
    console.error('Error adding parent contact:', error)
    return res.status(500).json({ message: 'Failed to add parent contact' })
  }
})

// Update a parent contact
router.put('/:contactId', requireAuth, async (req, res) => {
  const contactId = Number(req.params.contactId)
  const { contact_value, contact_name, relationship, preferred_method, is_active } = req.body

  try {
    // Get the contact to verify permissions
    const contact = await query(
      'SELECT student_id FROM ParentContacts WHERE id = ?',
      [contactId]
    )

    if (!contact.length) {
      return res.status(404).json({ message: 'Contact not found' })
    }

    // Verify access permissions
    if (req.user.role === 'student') {
      const student = await query('SELECT id FROM Students WHERE user_id = ?', [req.user.id])
      if (!student.length || student[0].id !== contact[0].student_id) {
        return res.status(403).json({ message: 'Access denied' })
      }
    }

    // Build update query
    const updates = []
    const values = []

    if (contact_value !== undefined) {
      updates.push('contact_value = ?')
      values.push(contact_value)
    }

    if (contact_name !== undefined) {
      updates.push('contact_name = ?')
      values.push(contact_name)
    }

    if (relationship !== undefined) {
      updates.push('relationship = ?')
      values.push(relationship)
    }

    if (preferred_method !== undefined) {
      if (!['sms', 'email', 'both'].includes(preferred_method)) {
        return res.status(400).json({ message: 'Invalid preferred method' })
      }
      updates.push('preferred_method = ?')
      values.push(preferred_method)
    }

    if (is_active !== undefined) {
      updates.push('is_active = ?')
      values.push(is_active)
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' })
    }

    updates.push('updated_at = CURRENT_TIMESTAMP')
    values.push(contactId)

    await query(
      `UPDATE ParentContacts SET ${updates.join(', ')} WHERE id = ?`,
      values
    )

    return res.json({ message: 'Parent contact updated successfully' })

  } catch (error) {
    console.error('Error updating parent contact:', error)
    return res.status(500).json({ message: 'Failed to update parent contact' })
  }
})

// Delete a parent contact
router.delete('/:contactId', requireAuth, async (req, res) => {
  const contactId = Number(req.params.contactId)

  try {
    // Get the contact to verify permissions
    const contact = await query(
      'SELECT student_id FROM ParentContacts WHERE id = ?',
      [contactId]
    )

    if (!contact.length) {
      return res.status(404).json({ message: 'Contact not found' })
    }

    // Verify access permissions
    if (req.user.role === 'student') {
      const student = await query('SELECT id FROM Students WHERE user_id = ?', [req.user.id])
      if (!student.length || student[0].id !== contact[0].student_id) {
        return res.status(403).json({ message: 'Access denied' })
      }
    }

    await query('DELETE FROM ParentContacts WHERE id = ?', [contactId])

    return res.json({ message: 'Parent contact deleted successfully' })

  } catch (error) {
    console.error('Error deleting parent contact:', error)
    return res.status(500).json({ message: 'Failed to delete parent contact' })
  }
})

// Test notification for a student
router.post('/test-notification/:studentId', requireAuth, requireRole('admin'), async (req, res) => {
  const studentId = Number(req.params.studentId)
  const { action = 'exit' } = req.body

  if (!['exit', 'entry'].includes(action)) {
    return res.status(400).json({ message: 'Invalid action' })
  }

  try {
    const result = await notificationService.testNotification(studentId, action)
    return res.json(result)
  } catch (error) {
    console.error('Error testing notification:', error)
    return res.status(500).json({ message: 'Failed to test notification' })
  }
})

// Get notification logs for a student
router.get('/logs/:studentId', requireAuth, async (req, res) => {
  const studentId = Number(req.params.studentId)

  try {
    // Verify access permissions
    let allowedStudentId = studentId
    
    if (req.user.role === 'student') {
      const student = await query('SELECT id FROM Students WHERE user_id = ?', [req.user.id])
      if (!student.length || student[0].id !== studentId) {
        return res.status(403).json({ message: 'Access denied' })
      }
      allowedStudentId = student[0].id
    }

    const logs = await query(
      `SELECT id, action, notification_results, created_at
       FROM ParentNotificationLogs 
       WHERE student_id = ? 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [allowedStudentId]
    )

    return res.json(logs)

  } catch (error) {
    console.error('Error fetching notification logs:', error)
    return res.status(500).json({ message: 'Failed to fetch notification logs' })
  }
})

module.exports = router
