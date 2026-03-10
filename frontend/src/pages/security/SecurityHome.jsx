import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function SecurityHome() {
  return (
    <div>
      <div className="text-2xl font-semibold">Security Overview</div>
      <div className="mt-2 text-zinc-300">Verify gatepasses via QR, then mark exit/entry to maintain an audit log.</div>

      <motion.div className="mt-6 grid gap-4 md:grid-cols-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Link to="/app/security/verify" className="rounded-3xl bg-white/5 border border-white/10 p-6 hover:bg-white/7">
          <div className="text-lg font-semibold">Verify QR</div>
          <div className="mt-2 text-zinc-300">Paste/scan QR payload, validate, and mark exit/entry.</div>
          <div className="mt-5 text-brand-300 text-sm">Open →</div>
        </Link>
        <Link to="/app/security/logs" className="rounded-3xl bg-white/5 border border-white/10 p-6 hover:bg-white/7">
          <div className="text-lg font-semibold">Live Activity Logs</div>
          <div className="mt-2 text-zinc-300">Real-time feed of gate activity.</div>
          <div className="mt-5 text-brand-300 text-sm">Open →</div>
        </Link>
      </motion.div>
    </div>
  )
}

