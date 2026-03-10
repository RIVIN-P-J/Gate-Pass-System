import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { AnimatePresence, motion } from 'framer-motion'
import { api } from '../../lib/api'

const StatusPill = ({ status }) => {
  const cls =
    status === 'approved'
      ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/25'
      : status === 'rejected'
        ? 'bg-rose-500/15 text-rose-200 border-rose-500/25'
        : 'bg-amber-500/15 text-amber-200 border-amber-500/25'
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs border ${cls}`}>{status}</span>
}

export default function History() {
  const [items, setItems] = useState([])
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(true)
  const [qrOpen, setQrOpen] = useState(false)
  const [selected, setSelected] = useState(null)

  async function load() {
    setBusy(true)
    try {
      const { data } = await api.get('/gatepasses/mine')
      setItems(data.items)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load history')
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
    if (!qq) return items
    return items.filter((x) => (x.reason || '').toLowerCase().includes(qq) || (x.status || '').toLowerCase().includes(qq))
  }, [items, q])

  function openQR(item) {
    if (item?.status !== 'approved' || !item?.qr_data_url) return
    setSelected(item)
    setQrOpen(true)
  }

  function downloadQR() {
    if (!selected?.qr_data_url) return
    const a = document.createElement('a')
    a.href = selected.qr_data_url
    a.download = `gatepass-${selected.id}-qr.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold">History</div>
          <div className="mt-2 text-zinc-300">Your past requests with status and QR for approved passes.</div>
        </div>
        <div className="flex gap-2">
          <input className="input w-[260px]" placeholder="Search reason/status…" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn-ghost" onClick={load}>
            Refresh
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        {busy ? (
          <div className="rounded-3xl bg-white/5 border border-white/10 p-6 text-zinc-300">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl bg-white/5 border border-white/10 p-6 text-zinc-300">No requests yet.</div>
        ) : (
          filtered.map((x) => (
            <motion.div
              key={x.id}
              className="rounded-3xl bg-white/5 border border-white/10 p-5"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              whileHover={{ y: -2 }}
              onClick={() => openQR(x)}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-zinc-200 font-semibold">Request #{x.id}</div>
                  <div className="mt-1 text-zinc-400 text-sm">{x.reason}</div>
                  <div className="mt-3 text-xs text-zinc-400">
                    Out: {new Date(x.out_time).toLocaleString()} • In: {new Date(x.in_time).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill status={x.status} />
                  {x.status === 'approved' && x.qr_data_url && (
                    <motion.button
                      type="button"
                      className="rounded-2xl bg-white/5 border border-white/10 p-2 cursor-pointer"
                      whileHover={{ y: -2, rotateX: 4, rotateY: -4 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                      style={{ transformStyle: 'preserve-3d' }}
                      onClick={(e) => {
                        e.stopPropagation()
                        openQR(x)
                      }}
                      title="Open QR"
                    >
                      <img alt="Gatepass QR" src={x.qr_data_url} className="size-20 rounded-xl" />
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {qrOpen && selected ? (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.button
              className="absolute inset-0 bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setQrOpen(false)}
            />

            <motion.div
              className="relative w-full max-w-2xl rounded-3xl bg-zinc-950 border border-white/10 shadow-soft p-6 overflow-hidden"
              initial={{ opacity: 0, y: 18, scale: 0.98, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: 18, scale: 0.98, filter: 'blur(6px)' }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="absolute -top-24 -right-24 size-64 rounded-full bg-brand-600/25 blur-3xl" />
              <div className="absolute -bottom-24 -left-24 size-64 rounded-full bg-fuchsia-500/20 blur-3xl" />

              <div className="relative flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-widest text-zinc-400">Approved Gatepass</div>
                  <div className="mt-2 text-2xl font-semibold text-white">Request #{selected.id}</div>
                  <div className="mt-2 text-sm text-zinc-300 max-w-xl">{selected.reason}</div>
                  <div className="mt-3 text-xs text-zinc-400">
                    Out: {new Date(selected.out_time).toLocaleString()} • In: {new Date(selected.in_time).toLocaleString()}
                  </div>
                </div>

                <StatusPill status="approved" />
              </div>

              <div className="relative mt-6 grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
                <motion.div
                  className="rounded-3xl bg-white/5 border border-white/10 p-4"
                  whileHover={{ rotateX: 3, rotateY: -3, y: -2 }}
                  transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <div className="rounded-2xl bg-white p-4 shadow-[0_20px_80px_rgba(82,169,255,.25)]">
                    <img alt="Gatepass QR large" src={selected.qr_data_url} className="mx-auto w-[320px] max-w-full" />
                  </div>
                  <div className="mt-3 text-xs text-zinc-400">
                    Show this QR to security for verification.
                  </div>
                </motion.div>

                <div className="flex flex-col gap-2">
                  <button className="btn-primary" onClick={downloadQR}>
                    Download QR
                  </button>
                  <button className="btn-ghost" onClick={() => setQrOpen(false)}>
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

