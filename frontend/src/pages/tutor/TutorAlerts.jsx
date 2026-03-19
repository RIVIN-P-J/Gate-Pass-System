import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { api } from '../../lib/api'

export default function TutorAlerts() {
  const [alerts, setAlerts] = useState([])
  const [busy, setBusy] = useState(true)
  const [threshold, setThreshold] = useState(30)

  const [requestAlerts, setRequestAlerts] = useState([])
  const [maxRequestPerMonth, setMaxRequestPerMonth] = useState(5)
  const [requestBusy, setRequestBusy] = useState(true)

  async function load(t = threshold) {
    setBusy(true)
    try {
      const { data } = await api.get('/tutor/alerts', { params: { thresholdMinutes: t } })
      setAlerts(data.alerts)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load alerts')
    } finally {
      setBusy(false)
    }
  }

  async function loadRequestAlerts(maxPerMonth = maxRequestPerMonth) {
    setRequestBusy(true)
    try {
      const { data } = await api.get('/tutor/request-volume-alerts', { params: { maxPerMonth } })
      setRequestAlerts(data.alerts)
      setMaxRequestPerMonth(data.maxPerMonth)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load request alerts')
    } finally {
      setRequestBusy(false)
    }
  }

  async function loadSettings() {
    try {
      const { data } = await api.get('/tutor/settings')
      setMaxRequestPerMonth(data.maxRequestsPerMonth)
      return data.maxRequestsPerMonth
    } catch {
      // ignore, keep default
      return maxRequestPerMonth
    }
  }

  async function saveMaxRequests() {
    try {
      const { data } = await api.post('/tutor/settings', { maxRequestsPerMonth: maxRequestPerMonth })
      setMaxRequestPerMonth(data.maxRequestsPerMonth)
      toast.success('Monthly request limit saved')
      loadRequestAlerts(data.maxRequestsPerMonth)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save request limit')
    }
  }

  useEffect(() => {
    load()
    loadSettings().then((max) => loadRequestAlerts(max))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function onThresholdChange(e) {
    const value = Number(e.target.value)
    setThreshold(value)
    load(value)
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold">Student Alerts</div>
          <div className="mt-2 text-zinc-600 dark:text-zinc-300">
            Students who have not returned within the configured minutes after their expected in time, or who have requested more gatepasses than allowed per month.
          </div>
        </div>

        <div className="glass rounded-2xl px-4 py-3 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="text-xs uppercase tracking-wider text-zinc-400">Overstay threshold</div>
            <select className="input w-28" value={threshold} onChange={onThresholdChange}>
              {[15, 30, 45, 60, 90, 120].map((v) => (
                <option key={v} value={v}>
                  {v} min
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs uppercase tracking-wider text-zinc-400">Monthly request limit</div>
            <input
              type="number"
              className="input w-20"
              min={1}
              value={maxRequestPerMonth}
              onChange={(e) => setMaxRequestPerMonth(Number(e.target.value))}
            />
            <button className="btn-ghost" onClick={saveMaxRequests}>
              Save
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        {busy ? (
          <div className="rounded-3xl bg-white/5 border border-white/10 p-6 text-zinc-600 dark:text-zinc-300">Checking for alerts…</div>
        ) : alerts.length === 0 ? (
          <div className="rounded-3xl bg-white/5 border border-white/10 p-6 text-zinc-600 dark:text-zinc-300">
            No students are currently overdue based on this threshold.
          </div>
        ) : (
          alerts.map((a) => (
            <motion.div
              key={a.gatepass_id}
              className="rounded-3xl bg-gradient-to-br from-brand-500/25 to-fuchsia-500/10 border border-brand-400/40 p-[1px]"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="rounded-[1.35rem] bg-zinc-950/95 px-5 py-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-widest text-zinc-400">Student</div>
                  <div className="mt-1 text-lg font-semibold text-zinc-50">
                    {a.student.name} ({a.student.register_number})
                  </div>
                  <div className="mt-1 text-xs text-zinc-400">
                    {a.student.department} • Year {a.student.year}
                  </div>
                  <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-300 max-w-xl">{a.reason}</div>
                  <div className="mt-2 text-xs text-zinc-500">
                    Out: {new Date(a.out_time).toLocaleString()} • Expected in: {new Date(a.in_time).toLocaleString()}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/15 border border-rose-400/40 px-3 py-1">
                    <span className="size-2 rounded-full bg-rose-400 animate-pulse" />
                    <span className="text-xs font-medium text-rose-100">
                      Over by {a.minutes_over} min
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400 text-right max-w-[240px]">
                    Gatepass #{a.gatepass_id}. You can contact the student or security and update logs as needed.
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <div className="mt-10">
        <div className="text-xl font-semibold">Monthly request limit alerts</div>
        <div className="mt-2 text-zinc-300">
          These students have made more gatepass requests this month than the configured limit.
        </div>

        <div className="mt-6 grid gap-3">
          {requestBusy ? (
            <div className="rounded-3xl bg-white/5 border border-white/10 p-6 text-zinc-300">
              Checking request counts…
            </div>
          ) : requestAlerts.length === 0 ? (
            <div className="rounded-3xl bg-white/5 border border-white/10 p-6 text-zinc-300">
              No students have exceeded the monthly request limit.
            </div>
          ) : (
            requestAlerts.map((a) => (
              <motion.div
                key={a.student.id}
                className="rounded-3xl bg-gradient-to-br from-brand-500/25 to-fuchsia-500/10 border border-brand-400/40 p-[1px]"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div className="rounded-[1.35rem] bg-zinc-950/95 px-5 py-4 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-zinc-400">Student</div>
                    <div className="mt-1 text-lg font-semibold text-zinc-50">
                      {a.student.name} ({a.student.register_number})
                    </div>
                    <div className="mt-1 text-xs text-zinc-400">
                      {a.student.department} • Year {a.student.year}
                    </div>
                    <div className="mt-3 text-sm text-zinc-300 max-w-xl">
                      Requested {a.request_count} times this month (limit: {maxRequestPerMonth}).
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/15 border border-rose-400/40 px-3 py-1">
                      <span className="size-2 rounded-full bg-rose-400 animate-pulse" />
                      <span className="text-xs font-medium text-rose-100">Over limit</span>
                    </div>
                    <div className="text-xs text-zinc-400 text-right max-w-[240px]">
                      Consider reaching out to the student or reviewing requests.
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

