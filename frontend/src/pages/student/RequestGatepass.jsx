import { useState } from 'react'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { api } from '../../lib/api'

export default function RequestGatepass() {
  const [form, setForm] = useState({
    reason: '',
    out_time: '',
    in_time: '',
  })
  const [busy, setBusy] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setBusy(true)
    try {
      await api.post('/gatepasses', form)
      toast.success('Gatepass request submitted')
      setForm({ reason: '', out_time: '', in_time: '' })
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit request')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="text-2xl font-semibold">Request Gatepass</div>
      <div className="mt-2 text-zinc-300">Fill in the details. Admin approval will trigger a real-time notification.</div>

      <motion.form
        onSubmit={onSubmit}
        className="mt-6 grid gap-4 rounded-3xl bg-white/5 border border-white/10 p-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div>
          <div className="text-sm text-zinc-300 mb-2">Reason</div>
          <textarea
            className="input min-h-[110px]"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            placeholder="Explain why you need to go out…"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-sm text-zinc-300 mb-2">Out time</div>
            <input
              className="input"
              type="datetime-local"
              value={form.out_time}
              onChange={(e) => setForm({ ...form, out_time: e.target.value })}
            />
          </div>
          <div>
            <div className="text-sm text-zinc-300 mb-2">In time</div>
            <input
              className="input"
              type="datetime-local"
              value={form.in_time}
              onChange={(e) => setForm({ ...form, in_time: e.target.value })}
            />
          </div>
        </div>

        <button className="btn-primary py-3" disabled={busy}>
          {busy ? 'Submitting…' : 'Submit Request'}
        </button>
      </motion.form>
    </div>
  )
}

