const { verifyToken } = require('../auth/jwt')
const { query } = require('../db/pool')

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const [, token] = header.split(' ')
    if (!token) return res.status(401).json({ message: 'Missing token' })
    const payload = verifyToken(token)

    const rows = await query('SELECT id, name, email, role FROM Users WHERE id = ?', [payload.sub])
    const user = rows[0]
    if (!user) return res.status(401).json({ message: 'Invalid token' })

    req.user = user
    next()
  } catch (e) {
    return res.status(401).json({ message: 'Unauthorized' })
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' })
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' })
    next()
  }
}

module.exports = { requireAuth, requireRole }

