import { useState } from 'react'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { api } from '../../lib/api'

export default function Verify() {
  const [payload, setPayload] = useState('')
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)

  async function verify() {
    setBusy(true)
    try {
      const { data } = await api.post('/security/verify', { payload })
      setResult(data)
      toast.success('Valid gatepass')
    } catch (err) {
      setResult(null)
      toast.error(err?.response?.data?.message || 'Invalid / expired')
    } finally {
      setBusy(false)
    }
  }

  async function mark(action) {
    try {
      const { data } = await api.post(`/security/gatepasses/${result.gatepass.id}/${action}`)
      setResult({ ...result, gatepass: data.gatepass })
      toast.success(action === 'exit' ? 'Exit recorded' : 'Entry recorded')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update log')
    }
  }

  return (
    <div>
      <div className="text-2xl font-semibold">Verify QR</div>
      <div className="mt-2 text-zinc-300">For now, paste the QR payload (we’ll also support camera scan later).</div>

      <motion.div className="mt-6 grid gap-4 rounded-3xl bg-white/5 border border-white/10 p-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <textarea className="input min-h-[120px]" value={payload} onChange={(e) => setPayload(e.target.value)} placeholder="Paste QR payload…" />
        <div className="flex flex-wrap gap-2 justify-end">
          <button className="btn-ghost" onClick={() => setPayload('')}>
            Clear
          </button>
          <button className="btn-primary" onClick={verify} disabled={busy || !payload.trim()}>
            {busy ? 'Verifying…' : 'Verify'}
          </button>
        </div>
      </motion.div>

      {result?.gatepass ? (
        <motion.div className="mt-6 rounded-3xl bg-white/5 border border-white/10 p-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-lg font-semibold">Gatepass #{result.gatepass.id}</div>
              <div className="mt-1 text-zinc-300">{result.student?.register_number}</div>
              <div className="mt-2 text-xs text-zinc-400">
                Out: {new Date(result.gatepass.out_time).toLocaleString()} • In: {new Date(result.gatepass.in_time).toLocaleString()}
              </div>
            </div>
            <div className="rounded-full px-3 py-1 text-xs border bg-emerald-500/15 text-emerald-200 border-emerald-500/25">approved</div>
          </div>

          <div className="mt-4 text-zinc-200">{result.gatepass.reason}</div>

          <div className="mt-5 flex flex-wrap gap-2 justify-end">
            <button className="btn-ghost" onClick={() => mark('exit')}>
              Mark Exit
            </button>
            <button className="btn-primary" onClick={() => mark('entry')}>
              Mark Entry
            </button>
          </div>
        </motion.div>
      ) : null}
    </div>
  )
}

