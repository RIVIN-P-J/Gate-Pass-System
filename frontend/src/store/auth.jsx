import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  async function hydrate() {
    const token = localStorage.getItem('gp_token')
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const { data } = await api.get('/auth/me')
      setUser(data.user)
    } catch {
      localStorage.removeItem('gp_token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    hydrate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function login({ email, password }) {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('gp_token', data.token)
    setUser(data.user)
  }

  function logout() {
    localStorage.removeItem('gp_token')
    setUser(null)
  }

  const value = useMemo(() => ({ user, loading, login, logout, refreshMe: hydrate }), [user, loading])
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

