import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { eventEmitter } from '../../lib/events'
import { RefreshCw } from 'lucide-react'

const Stat = ({ label, value, loading }) => (
  <div className="rounded-3xl bg-white/5 border border-white/10 p-5">
    <div className="text-sm text-zinc-400">{label}</div>
    <div className="mt-2 text-3xl font-semibold">
      {loading ? (
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin text-zinc-500" />
          <span className="text-zinc-500">Loading...</span>
        </div>
      ) : (
        value || '0'
      )}
    </div>
  </div>
)

export default function AdminHome() {
  const [stats, setStats] = useState({
    pending: 0,
    approvedToday: 0,
    total: 0,
    rejected: 0,
    completed: 0,
    todayTotal: 0,
    approvalRate: 0
  })
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/admin/stats')
      setStats(data)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching admin stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    
    // Listen for request updates from other components
    const handleRequestUpdate = () => {
      fetchStats() // Refresh stats immediately when a request is updated
    }
    
    const handleRequestCreate = () => {
      fetchStats() // Refresh stats immediately when a new request is created
    }
    
    eventEmitter.on('requestUpdated', handleRequestUpdate)
    eventEmitter.on('requestCreated', handleRequestCreate)
    
    return () => {
      clearInterval(interval)
      eventEmitter.off('requestUpdated', handleRequestUpdate)
      eventEmitter.off('requestCreated', handleRequestCreate)
    }
  }, [])

  const formatTime = (date) => {
    if (!date) return ''
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-semibold">Admin Overview</div>
          <div className="mt-2 text-zinc-300">Approve requests, review student details, and monitor request trends.</div>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/7 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {lastUpdated && (
        <div className="mt-2 text-xs text-zinc-500">
          Last updated: {formatTime(lastUpdated)}
        </div>
      )}

      <motion.div
        className="mt-6 grid gap-4 md:grid-cols-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Stat label="Pending" value={stats.pending} loading={loading} />
        <Stat label="Approved (today)" value={stats.approvedToday} loading={loading} />
        <Stat label="Total requests" value={stats.total} loading={loading} />
      </motion.div>

      {/* Additional stats row */}
      <motion.div
        className="mt-4 grid gap-4 md:grid-cols-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
      >
        <Stat label="Rejected" value={stats.rejected} loading={loading} />
        <Stat label="Completed" value={stats.completed} loading={loading} />
        <Stat label="Today's total" value={stats.todayTotal} loading={loading} />
        <Stat label="Approval rate" value={`${stats.approvalRate}%`} loading={loading} />
      </motion.div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Link to="/app/admin/requests" className="rounded-3xl bg-white/5 border border-white/10 p-6 hover:bg-white/7">
          <div className="text-lg font-semibold">Review Requests</div>
          <div className="mt-2 text-zinc-300">Search, filter, approve/reject with smooth modals.</div>
          {stats.pending > 0 && (
            <div className="mt-2 text-amber-300 text-sm">
              {stats.pending} pending request{stats.pending !== 1 ? 's' : ''} awaiting review
            </div>
          )}
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

