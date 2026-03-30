import { useEffect } from 'react'
import { io } from 'socket.io-client'
import toast from 'react-hot-toast'
import { ENV } from '../lib/env'
import { useAuth } from '../store/auth.jsx'

let socket = null

export function useRealtimeNotifications() {
  const { user } = useAuth()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!user || !token) return

    socket = io(ENV.API_BASE_URL, {
      transports: ['websocket'],
      auth: { token },
    })

    socket.on('connect_error', () => {})
    socket.on('notify', (msg) => {
      toast(msg?.title || 'Update received')
    })

    return () => {
      try {
        socket?.disconnect()
      } catch {
        // ignore
      }
      socket = null
    }
  }, [user])
}

