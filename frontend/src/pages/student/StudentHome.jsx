import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Home, LogOut, LogIn, AlertTriangle, Clock } from 'lucide-react'
import StudentQRCode from '../../components/StudentQRCode'

const Card = ({ title, desc, to }) => (
  <motion.div whileHover={{ y: -4, rotateX: 2 }} transition={{ type: 'spring', stiffness: 280, damping: 18 }}>
    <Link to={to} className="block rounded-3xl bg-white/5 border border-white/10 p-6 hover:bg-white/7">
      <div className="text-lg font-semibold">{title}</div>
      <div className="mt-2 text-zinc-300">{desc}</div>
      <div className="mt-5 text-brand-300 text-sm">Open →</div>
    </Link>
  </motion.div>
)

const StatusCard = ({ status, currentGatepass }) => {
  const getStatusInfo = () => {
    switch (status) {
      case 'INSIDE':
        return {
          icon: <Home className="h-6 w-6" />,
          color: 'text-emerald-400',
          bgColor: 'bg-emerald-500/15 border-emerald-500/25',
          label: 'Inside Campus',
          description: 'You are currently inside the campus'
        }
      case 'OUTSIDE':
        return {
          icon: <LogOut className="h-6 w-6" />,
          color: 'text-amber-400',
          bgColor: 'bg-amber-500/15 border-amber-500/25',
          label: 'Outside Campus',
          description: currentGatepass ? `Left for: ${currentGatepass.reason}` : 'You are currently outside the campus'
        }
      case 'OVERDUE':
        return {
          icon: <AlertTriangle className="h-6 w-6" />,
          color: 'text-rose-400',
          bgColor: 'bg-rose-500/15 border-rose-500/25',
          label: 'Overdue',
          description: currentGatepass ? `Expected back at: ${new Date(currentGatepass.in_time).toLocaleString()}` : 'You are overdue to return'
        }
      default:
        return {
          icon: <Home className="h-6 w-6" />,
          color: 'text-zinc-400',
          bgColor: 'bg-zinc-500/15 border-zinc-500/25',
          label: 'Unknown',
          description: 'Status not available'
        }
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <motion.div
      className={`rounded-3xl border p-6 ${statusInfo.bgColor}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-center gap-4">
        <div className={statusInfo.color}>
          {statusInfo.icon}
        </div>
        <div className="flex-1">
          <div className="text-lg font-semibold text-zinc-100">{statusInfo.label}</div>
          <div className="text-sm text-zinc-300 mt-1">{statusInfo.description}</div>
          {currentGatepass && (
            <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400">
              <Clock className="h-3 w-3" />
              <span>Out: {new Date(currentGatepass.out_time).toLocaleString()}</span>
              {currentGatepass.in_time && (
                <span>• In: {new Date(currentGatepass.in_time).toLocaleString()}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function StudentHome() {
  const [currentStatus, setCurrentStatus] = useState({
    status: 'INSIDE',
    current_gatepass_id: null,
    status_time: new Date(),
    reason: null,
    out_time: null,
    in_time: null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCurrentStatus()
    // Refresh status every 30 seconds
    const interval = setInterval(fetchCurrentStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchCurrentStatus = async () => {
    try {
      const response = await fetch('/api/student-status/current', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      setCurrentStatus(data)
    } catch (error) {
      console.error('Error fetching student status:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="text-2xl font-semibold">Student Overview</div>
      <div className="mt-2 text-zinc-300">Request, track, and display your approved gatepass QR instantly.</div>

      {/* Current Status Display */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4">Current Status</h3>
        {loading ? (
          <div className="rounded-3xl bg-white/5 border border-white/10 p-6 text-center text-zinc-400">
            Loading status...
          </div>
        ) : (
          <StatusCard 
            status={currentStatus.status} 
            currentGatepass={currentStatus.current_gatepass_id ? {
              reason: currentStatus.reason,
              out_time: currentStatus.out_time,
              in_time: currentStatus.in_time
            } : null}
          />
        )}
      </div>

      {/* QR Code Section - Only show when student is OUTSIDE */}
      {currentStatus.status === 'OUTSIDE' && currentStatus.current_gatepass_id && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mt-6"
        >
          <h3 className="text-lg font-semibold mb-4">Entry QR Code</h3>
          <StudentQRCode gatepassId={currentStatus.current_gatepass_id} />
        </motion.div>
      )}

      {/* Action Cards */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card title="Request a gatepass" desc="Animated form with smart validation." to="/app/student/request" />
        <Card title="History & status" desc="Pending / Approved / Rejected with filters." to="/app/student/history" />
      </div>
    </div>
  )
}

