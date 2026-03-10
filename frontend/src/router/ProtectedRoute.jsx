import { Navigate } from 'react-router-dom'
import { useAuth } from '../store/auth.jsx'

export default function ProtectedRoute({ allowRoles, children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen grid place-items-center text-zinc-300">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  if (allowRoles?.length && !allowRoles.includes(user.role)) return <Navigate to="/app" replace />
  return children
}

