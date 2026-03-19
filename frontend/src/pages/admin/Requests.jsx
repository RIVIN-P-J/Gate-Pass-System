import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { api } from '../../lib/api'
import { eventEmitter } from '../../lib/events'

const StatusPill = ({ status }) => {
  const cls =
    status === 'approved'
      ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/25'
      : status === 'rejected'
        ? 'bg-rose-500/15 text-rose-200 border-rose-500/25'
        : 'bg-amber-500/15 text-amber-200 border-amber-500/25'
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs border ${cls}`}>{status}</span>
}

function Modal({ open, onClose, children }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="fixed inset-0 z-50 grid place-items-center px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.button className="absolute inset-0 bg-black/60" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div
            className="relative w-full max-w-xl rounded-3xl bg-zinc-950 border border-white/10 shadow-soft p-6"
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ duration: 0.25 }}
          >
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export default function Requests() {
  const [items, setItems] = useState([])
  const [busy, setBusy] = useState(true)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [selected, setSelected] = useState(null)
  const [decisionBusy, setDecisionBusy] = useState(false)

  async function load() {
    setBusy(true)
    try {
      const { data } = await api.get('/admin/gatepasses')
      setItems(data.items)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load requests')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase()
    return items
      .filter((x) => (status === 'all' ? true : x.status === status))
      .filter((x) => {
        if (!qq) return true
        return (
          (x.reason || '').toLowerCase().includes(qq) ||
          (x.student?.register_number || '').toLowerCase().includes(qq) ||
          (x.student?.department || '').toLowerCase().includes(qq) ||
          (x.user?.name || '').toLowerCase().includes(qq)
        )
      })
  }, [items, q, status])

  async function decide(id, nextStatus) {
    setDecisionBusy(true)
    try {
      await api.post(`/admin/gatepasses/${id}/${nextStatus}`)
      toast.success(nextStatus === 'approved' ? 'Approved' : 'Rejected')
      setSelected(null)
      await load()
      
      // Emit event to refresh admin dashboard stats
      eventEmitter.emit('requestUpdated', { action: nextStatus, id })
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Action failed')
    } finally {
      setDecisionBusy(false)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold">Gatepass Requests</div>
          <div className="mt-2 text-zinc-300">Approve or reject with a smooth modal and instant student notification.</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <input className="input w-[260px]" placeholder="Search name/reg/department…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="input w-[180px]" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button className="btn-ghost" onClick={load}>
            Refresh
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-white/10">
        <div className="grid grid-cols-[140px_1fr_180px_160px] gap-0 bg-white/5 px-4 py-3 text-xs uppercase tracking-wider text-zinc-300">
          <div>ID</div>
          <div>Student</div>
          <div>Status</div>
          <div className="text-right">Action</div>
        </div>
        {busy ? (
          <div className="p-6 text-zinc-300 bg-zinc-950">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-zinc-300 bg-zinc-950">No matching requests.</div>
        ) : (
          filtered.map((x) => (
            <motion.div
              key={x.id}
              className="grid grid-cols-[140px_1fr_180px_160px] items-center bg-zinc-950 px-4 py-4 border-t border-white/10"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
            >
              <div className="text-zinc-200 font-semibold">#{x.id}</div>
              <div>
                <div className="text-zinc-100 font-medium">{x.user?.name}</div>
                <div className="text-xs text-zinc-400 mt-1">
                  {x.student?.register_number} • {x.student?.department} • Year {x.student?.year}
                </div>
                <div className="text-xs text-zinc-400 mt-1 line-clamp-1">{x.reason}</div>
              </div>
              <div>
                <StatusPill status={x.status} />
              </div>
              <div className="text-right">
                <button className="btn-ghost" onClick={() => setSelected(x)}>
                  Review
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)}>
        {selected ? (
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xl font-semibold">Request #{selected.id}</div>
                <div className="mt-1 text-zinc-300">{selected.user?.name}</div>
                <div className="mt-2 text-xs text-zinc-400">
                  {selected.student?.register_number} • {selected.student?.department} • Year {selected.student?.year}
                </div>
              </div>
              <StatusPill status={selected.status} />
            </div>

            <div className="mt-5 rounded-2xl bg-white/5 border border-white/10 p-4">
              <div className="text-sm text-zinc-300">Reason</div>
              <div className="mt-2 text-zinc-100">{selected.reason}</div>
              <div className="mt-4 text-xs text-zinc-400">
                Out: {new Date(selected.out_time).toLocaleString()} • In: {new Date(selected.in_time).toLocaleString()}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2 justify-end">
              <button className="btn-ghost" onClick={() => setSelected(null)} disabled={decisionBusy}>
                Close
              </button>
              <button
                className="btn-ghost border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/15"
                onClick={() => decide(selected.id, 'rejected')}
                disabled={decisionBusy || selected.status !== 'pending'}
              >
                Reject
              </button>
              <button className="btn-primary" onClick={() => decide(selected.id, 'approved')} disabled={decisionBusy || selected.status !== 'pending'}>
                Approve
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

