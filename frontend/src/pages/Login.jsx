import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { MotionButton, MotionDiv } from '../components/Motion'
import { useAuth } from '../store/auth.jsx'

export default function Login() {
  const nav = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setBusy(true)
    try {
      await login({ email, password })
      toast.success('Welcome back!')
      nav('/app', { replace: true })
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="text-3xl font-semibold">Sign in</div>
      <div className="mt-2 text-zinc-300">Access your gatepass dashboard with secure role-based login.</div>

      <form onSubmit={onSubmit} className="mt-7 grid gap-4">
        <div>
          <div className="text-sm text-zinc-300 mb-2">Email</div>
          <MotionDiv whileHover={{ y: -1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@college.edu" />
          </MotionDiv>
        </div>
        <div>
          <div className="text-sm text-zinc-300 mb-2">Password</div>
          <MotionDiv whileHover={{ y: -1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </MotionDiv>
        </div>

        <MotionButton
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="btn-primary py-3"
          disabled={busy}
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </MotionButton>
      </form>

      <MotionDiv
        className="mt-6 rounded-2xl bg-white/5 border border-white/10 p-4 text-sm text-zinc-300"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
        whileHover={{ y: -1 }}
      >
        New here?{' '}
        <Link className="text-brand-300 hover:text-brand-200" to="/signup">
          Create an account
        </Link>
        .
      </MotionDiv>
    </div>
  )
}

