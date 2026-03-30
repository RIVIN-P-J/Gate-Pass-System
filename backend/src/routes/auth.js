const express = require('express')
const bcrypt = require('bcryptjs')
const { z } = require('zod')
const { query } = require('../db/pool')
const { signToken } = require('../auth/jwt')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()

router.post('/signup', async (req, res) => {
  const schema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(['student', 'admin', 'security']).default('student'),
    register_number: z.string().optional(),
    department: z.string().optional(),
    year: z.coerce.number().int().min(1).max(5).optional(),
    parent_name: z.string().min(2).optional(),
    parent_relationship: z.string().min(2).optional(),
    parent_phone: z.string().optional(),
    parent_email: z.string().email().optional(),
    parent_preferred_method: z.enum(['sms', 'email', 'both']).optional(),
  })

  const body = schema.safeParse(req.body)
  if (!body.success) return res.status(400).json({ message: 'Invalid payload', errors: body.error.flatten() })

  const {
    name,
    email,
    password,
    role,
    register_number,
    department,
    year,
    parent_name,
    parent_relationship,
    parent_phone,
    parent_email,
    parent_preferred_method = 'sms',
  } = body.data

  const existing = await query('SELECT id FROM Users WHERE email = ?', [email])
  if (existing.length) return res.status(409).json({ message: 'Email already registered' })

  const hash = await bcrypt.hash(password, 10)
  const result = await query('INSERT INTO Users (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email, hash, role])
  const userId = result.insertId

  if (role === 'student') {
    if (!register_number || !department || !year) {
      return res.status(400).json({ message: 'Student profile fields required' })
    }

    if (!parent_phone && !parent_email) {
      return res.status(400).json({ message: 'At least one parent contact (phone or email) is required' })
    }

    if (!parent_name || !parent_relationship) {
      return res.status(400).json({ message: 'Parent name and relationship are required' })
    }

    try {
      await query(
        'INSERT INTO Students (user_id, register_number, department, year) VALUES (?, ?, ?, ?)',
        [userId, register_number, department, year],
      )
    } catch (e) {
      return res.status(400).json({ message: 'Failed to create student profile (maybe duplicate register number)' })
    }

    const studentRows = await query('SELECT id FROM Students WHERE user_id = ?', [userId])
    const studentId = studentRows[0]?.id

    if (studentId) {
      const preferredMethod = parent_preferred_method || 'sms'
      if (parent_phone) {
        const smsPreferred = preferredMethod === 'sms' ? 'sms' : 'both'
        await query(
          `INSERT INTO ParentContacts
           (student_id, contact_type, contact_value, contact_name, relationship, preferred_method)
           VALUES (?, 'sms', ?, ?, ?, ?)`,
          [studentId, parent_phone, parent_name, parent_relationship, smsPreferred]
        )
      }

      if (parent_email) {
        const emailPreferred = preferredMethod === 'email' ? 'email' : 'both'
        await query(
          `INSERT INTO ParentContacts
           (student_id, contact_type, contact_value, contact_name, relationship, preferred_method)
           VALUES (?, 'email', ?, ?, ?, ?)`,
          [studentId, parent_email, parent_name, parent_relationship, emailPreferred]
        )
      }
    }
  }

  const userRows = await query('SELECT id, name, email, role FROM Users WHERE id = ?', [userId])
  const user = userRows[0]
  const token = signToken(user)
  return res.json({ token, user })
})

router.post('/login', async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
  })
  const body = schema.safeParse(req.body)
  if (!body.success) return res.status(400).json({ message: 'Invalid payload' })

  const { email, password } = body.data
  const rows = await query('SELECT id, name, email, role, password FROM Users WHERE email = ?', [email])
  const user = rows[0]
  if (!user) return res.status(401).json({ message: 'Invalid credentials' })

  const ok = await bcrypt.compare(password, user.password)
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' })

  const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role }
  const token = signToken(safeUser)
  return res.json({ token, user: safeUser })
})

router.get('/me', requireAuth, async (req, res) => {
  return res.json({ user: req.user })
})

module.exports = router

