import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const Stat = ({ label, value }) => (
  <div className="rounded-3xl bg-white/5 border border-white/10 p-5">
    <div className="text-sm text-zinc-400">{label}</div>
    <div className="mt-2 text-3xl font-semibold">{value}</div>
  </div>
)

export default function AdminHome() {
  return (
    <div>
      <div className="text-2xl font-semibold">Admin Overview</div>
      <div className="mt-2 text-zinc-300">Approve requests, review student details, and monitor request trends.</div>

      <motion.div
        className="mt-6 grid gap-4 md:grid-cols-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Stat label="Pending" value="—" />
        <Stat label="Approved (today)" value="—" />
        <Stat label="Total requests" value="—" />
      </motion.div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Link to="/app/admin/requests" className="rounded-3xl bg-white/5 border border-white/10 p-6 hover:bg-white/7">
          <div className="text-lg font-semibold">Review Requests</div>
          <div className="mt-2 text-zinc-300">Search, filter, approve/reject with smooth modals.</div>
          <div className="mt-5 text-brand-300 text-sm">Open →</div>
        </Link>
        <Link to="/app/admin/analytics" className="rounded-3xl bg-white/5 border border-white/10 p-6 hover:bg-white/7">
          <div className="text-lg font-semibold">Analytics</div>
          <div className="mt-2 text-zinc-300">Interactive charts and trends for workload visibility.</div>
          <div className="mt-5 text-brand-300 text-sm">Open →</div>
        </Link>
      </div>
    </div>
  )
}

