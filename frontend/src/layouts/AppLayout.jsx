import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { useAuth } from '../store/auth.jsx'
import { useTheme } from '../store/theme.jsx'
import { cn } from '../lib/cn'
import GradientBackground from '../components/GradientBackground'

const NavItem = ({ to, label, icon, collapsed }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      cn(
        'group flex items-center gap-3 rounded-2xl px-3 py-2 transition will-change-transform',
        isActive ? 'bg-white/10 border border-white/10' : 'hover:bg-white/5 border border-transparent',
      )
    }
  >
    <div className="grid size-9 place-items-center rounded-xl bg-white/5 border border-white/10 group-hover:bg-white/10">
      <span className="text-zinc-200">{icon}</span>
    </div>
    <motion.div
      className="text-zinc-200 font-medium whitespace-nowrap"
      animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 'auto' }}
      transition={{ duration: 0.2 }}
    >
      {label}
    </motion.div>
  </NavLink>
)

export default function AppLayout() {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const nav = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const roleHome =
    user?.role === 'admin'
      ? '/app/admin'
      : user?.role === 'security'
        ? '/app/security'
        : '/app/student'

  const navItems = useMemo(() => {
    const items = [{ to: roleHome, label: 'Overview', icon: '⟡' }]
    if (user?.role === 'student') {
      items.push(
        { to: '/app/student/request', label: 'Request Gatepass', icon: '＋' },
        { to: '/app/student/history', label: 'History', icon: '⌁' },
      )
    }
    if (user?.role === 'admin') {
      items.push(
        { to: '/app/admin/requests', label: 'Requests', icon: '▦' },
        { to: '/app/admin/analytics', label: 'Analytics', icon: '◷' },
        { to: '/app/admin/notifications', label: 'Notifications', icon: '⚠' },
      )
    }
    if (user?.role === 'security') {
      items.push(
        { to: '/app/security/verify', label: 'Verify QR', icon: '⌁' },
        { to: '/app/security/logs', label: 'Live Logs', icon: '▤' },
      )
    }
    return items
  }, [roleHome, user?.role])

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-brand-900 via-slate-950 to-black text-zinc-50">
      <GradientBackground />
      <div className="relative mx-auto max-w-[1400px] px-4 py-5">
        <div className="grid gap-5 lg:grid-cols-[auto_1fr]">
          <motion.aside
            className={cn('glass rounded-3xl p-4 lg:sticky lg:top-5 h-fit', collapsed ? 'w-[92px]' : 'w-[320px]')}
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            layout
          >
            <div className="flex items-center justify-between gap-2">
              <motion.div animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 'auto' }} className="overflow-hidden">
                <div className="text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Gatepass</div>
                <div className="text-xl font-semibold">Dashboard</div>
              </motion.div>
              <div className="flex gap-2">
                <button className="btn-ghost px-3" onClick={() => setCollapsed((v) => !v)} title="Toggle sidebar">
                  {collapsed ? '»' : '«'}
                </button>
                <button className="btn-ghost px-3" onClick={toggle} title="Toggle theme">
                  {theme === 'dark' ? '☾' : '☀'}
                </button>
              </div>
            </div>

            <motion.div
              className={cn('mt-4 rounded-2xl p-4', collapsed ? 'neo' : 'neo')}
              whileHover={{ y: -1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            >
              <div className="text-sm text-zinc-600 dark:text-zinc-400">Signed in</div>
              <motion.div animate={{ opacity: collapsed ? 0 : 1, height: collapsed ? 0 : 'auto' }} className="overflow-hidden">
                <div className="mt-1 font-semibold">{user?.name || '—'}</div>
                <div className="text-xs uppercase tracking-wider text-brand-600 dark:text-brand-300 mt-1">{user?.role}</div>
              </motion.div>
            </motion.div>

            <div className="mt-4 grid gap-2">
              {navItems.map((it) => (
                <motion.div key={it.to} whileHover={{ y: -2, rotateX: 2 }} transition={{ type: 'spring', stiffness: 280, damping: 18 }}>
                  <NavItem {...it} collapsed={collapsed} />
                </motion.div>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                className="btn-primary w-full"
                onClick={() => {
                  nav(roleHome)
                }}
              >
                <motion.span animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 'auto' }} className="overflow-hidden">
                  Go Home
                </motion.span>
                <motion.span animate={{ opacity: collapsed ? 1 : 0, width: collapsed ? 'auto' : 0 }} className="overflow-hidden">
                  ⌂
                </motion.span>
              </button>
              <button
                className="btn-ghost"
                onClick={() => {
                  logout()
                  nav('/login')
                }}
              >
                <motion.span animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 'auto' }} className="overflow-hidden">
                  Logout
                </motion.span>
                <motion.span animate={{ opacity: collapsed ? 1 : 0, width: collapsed ? 'auto' : 0 }} className="overflow-hidden">
                  ⇦
                </motion.span>
              </button>
            </div>
          </motion.aside>

          <motion.main className="glass rounded-3xl p-4 md:p-6 min-h-[calc(100vh-40px)]" layout>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(8px)' }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
          </motion.main>
        </div>
      </div>
    </div>
  )
}

