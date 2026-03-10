import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const Card = ({ title, desc, to }) => (
  <motion.div whileHover={{ y: -4, rotateX: 2 }} transition={{ type: 'spring', stiffness: 280, damping: 18 }}>
    <Link to={to} className="block rounded-3xl bg-white/5 border border-white/10 p-6 hover:bg-white/7">
      <div className="text-lg font-semibold">{title}</div>
      <div className="mt-2 text-zinc-300">{desc}</div>
      <div className="mt-5 text-brand-300 text-sm">Open →</div>
    </Link>
  </motion.div>
)

export default function StudentHome() {
  return (
    <div>
      <div className="text-2xl font-semibold">Student Overview</div>
      <div className="mt-2 text-zinc-300">Request, track, and display your approved gatepass QR instantly.</div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card title="Request a gatepass" desc="Animated form with smart validation." to="/app/student/request" />
        <Card title="History & status" desc="Pending / Approved / Rejected with filters." to="/app/student/history" />
      </div>
    </div>
  )
}

