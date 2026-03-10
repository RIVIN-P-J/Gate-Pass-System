let ioRef = null

function attachIO(io) {
  ioRef = io
}

function notifyUser(userId, payload) {
  if (!ioRef) return
  ioRef.to(`user:${userId}`).emit('notify', payload)
}

module.exports = { attachIO, notifyUser }

