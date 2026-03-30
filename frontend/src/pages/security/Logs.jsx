import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { api } from '../../lib/api'
import { formatDateTime } from '../../lib/date'

export default function Logs() {
  const [items, setItems] = useState([])
  const [busy, setBusy] = useState(true)

  async function load() {
    setBusy(true)
    try {
      const { data } = await api.get('/security/logs')
      setItems(data.items)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load logs')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold">Live Activity Logs</div>
          <div className="mt-2 text-zinc-300">Entry/exit events created by security verification.</div>
        </div>
        <button className="btn-ghost" onClick={load}>
          Refresh
        </button>
      </div>

      <div className="mt-6 grid gap-3">
        {busy ? (
          <div className="rounded-3xl bg-white/5 border border-white/10 p-6 text-zinc-300">Loading…</div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl bg-white/5 border border-white/10 p-6 text-zinc-300">No logs yet.</div>
        ) : (
          items.map((x) => (
            <motion.div
              key={x.id}
              className="rounded-3xl bg-white/5 border border-white/10 p-5"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-zinc-100 font-semibold">
                    Gatepass #{x.gatepass_id} • {x.student_register_number}
                  </div>
                  <div className="mt-1 text-xs text-zinc-400">{x.student_department} • Year {x.student_year}</div>
                </div>
                <div className="text-xs text-zinc-400">
                  Exit: {x.exit_time ? formatDateTime(x.exit_time) : '—'} • Entry:{' '}
                  {x.entry_time ? formatDateTime(x.entry_time) : '—'}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}

