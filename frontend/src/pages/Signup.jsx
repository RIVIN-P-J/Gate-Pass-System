import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { MotionButton } from '../components/Motion'
import { MotionDiv } from '../components/Motion'
import { api } from '../lib/api'
import { useAuth } from '../store/auth.jsx'

export default function Signup() {
  const nav = useNavigate()
  const { refreshMe } = useAuth()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    register_number: '',
    department: '',
    year: '1',
  })
  const [busy, setBusy] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setBusy(true)
    try {
      const { data } = await api.post('/auth/signup', form)
      localStorage.setItem('gp_token', data.token)
      await refreshMe()
      toast.success('Account created!')
      nav('/app', { replace: true })
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Signup failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="text-3xl font-semibold">Create account</div>
      <div className="mt-2 text-zinc-300">Students can request gatepasses right away. Admin/Security can be created for demo.</div>

      <form onSubmit={onSubmit} className="mt-7 grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-sm text-zinc-300 mb-2">Name</div>
            <MotionDiv whileHover={{ y: -1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </MotionDiv>
          </div>
          <div>
            <div className="text-sm text-zinc-300 mb-2">Role</div>
            <MotionDiv whileHover={{ y: -1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
              <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="student">Student</option>
                <option value="admin">Admin</option>
                <option value="security">Security</option>
              </select>
            </MotionDiv>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-sm text-zinc-300 mb-2">Email</div>
            <MotionDiv whileHover={{ y: -1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
              <input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </MotionDiv>
          </div>
          <div>
            <div className="text-sm text-zinc-300 mb-2">Password</div>
            <MotionDiv whileHover={{ y: -1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
              <input
                className="input"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </MotionDiv>
          </div>
        </div>

        {form.role === 'student' && (
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="text-sm text-zinc-300 mb-2">Register No.</div>
              <MotionDiv whileHover={{ y: -1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
                <input
                  className="input"
                  value={form.register_number}
                  onChange={(e) => setForm({ ...form, register_number: e.target.value })}
                />
              </MotionDiv>
            </div>
            <div>
              <div className="text-sm text-zinc-300 mb-2">Department</div>
              <MotionDiv whileHover={{ y: -1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
                <input className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
              </MotionDiv>
            </div>
            <div>
              <div className="text-sm text-zinc-300 mb-2">Year</div>
              <MotionDiv whileHover={{ y: -1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
                <select className="input" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })}>
                  {['1', '2', '3', '4'].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </MotionDiv>
            </div>
          </div>
        )}

        <MotionButton whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} className="btn-primary py-3" disabled={busy}>
          {busy ? 'Creating…' : 'Create account'}
        </MotionButton>
      </form>

      <div className="mt-6 text-sm text-zinc-300">
        Already have an account?{' '}
        <Link className="text-brand-300 hover:text-brand-200" to="/login">
          Sign in
        </Link>
        .
      </div>
    </div>
  )
}

