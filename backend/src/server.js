require('dotenv').config()
const http = require('http')
const express = require('express')
const cors = require('cors')
const { Server } = require('socket.io')
const { attachIO } = require('./realtime/hub')
const { verifyToken } = require('./auth/jwt')

const authRoutes = require('./routes/auth')
const gatepassRoutes = require('./routes/gatepasses')
const adminRoutes = require('./routes/admin')
const securityRoutes = require('./routes/security')
const { requireAuth, requireRole } = require('./middleware/auth')

const app = express()

const PORT = Number(process.env.PORT || 4000)
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173'

app.use(cors({ origin: CLIENT_ORIGIN, credentials: false }))
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.use('/api/auth', authRoutes)
app.use('/api/gatepasses', gatepassRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/security', securityRoutes)

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    credentials: false,
  },
})

attachIO(io)

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token
    if (!token) return next(new Error('unauthorized'))
    const payload = verifyToken(token)
    socket.user = { id: payload.sub, role: payload.role }
    return next()
  } catch {
    return next(new Error('unauthorized'))
  }
})

io.on('connection', (socket) => {
  socket.join(`user:${socket.user.id}`)
})

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${PORT}`)
})

