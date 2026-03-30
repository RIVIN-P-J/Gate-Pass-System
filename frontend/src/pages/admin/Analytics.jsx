import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { api } from '../../lib/api'

function TooltipCard({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-2xl glass px-4 py-3 shadow-soft">
      <div className="text-xs text-zinc-400">{label}</div>
      <div className="mt-1 text-sm text-zinc-200">
        Total: <span className="font-semibold">{payload[0].value}</span>
      </div>
    </div>
  )
}

export default function Analytics() {
  const [busy, setBusy] = useState(true)
  const [stats, setStats] = useState({ totals: { pending: 0, approved: 0, rejected: 0 }, daily: [] })

  async function load() {
    setBusy(true)
    try {
      const { data } = await api.get('/admin/analytics')
      setStats(data)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load analytics')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const total = useMemo(() => stats.totals.pending + stats.totals.approved + stats.totals.rejected, [stats])

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold">Analytics</div>
          <div className="mt-2 text-zinc-300">Request trends and workload overview.</div>
        </div>
        <button className="btn-ghost" onClick={load}>
          Refresh
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {[
          { k: 'Total', v: total },
          { k: 'Pending', v: stats.totals.pending },
          { k: 'Approved', v: stats.totals.approved },
          { k: 'Rejected', v: stats.totals.rejected },
        ].map((x) => (
          <div key={x.k} className="rounded-3xl bg-white/5 border border-white/10 p-5">
            <div className="text-sm text-zinc-400">{x.k}</div>
            <div className="mt-2 text-3xl font-semibold">
              {busy ? <div className="h-9 w-20 rounded-xl bg-white/10 animate-shimmer bg-[length:200%_100%] bg-[linear-gradient(110deg,rgba(255,255,255,.06),rgba(255,255,255,.18),rgba(255,255,255,.06))]" /> : x.v}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-3xl bg-white/5 border border-white/10 p-5">
        <div className="text-sm text-zinc-300 mb-4">Daily requests (last 14 days)</div>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.daily}>
              <defs>
                <linearGradient id="fillBrand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2f87ff" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#2f87ff" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.10)" vertical={false} />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.45)" tick={{ fontSize: 12 }} />
              <YAxis stroke="rgba(255,255,255,0.45)" tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip content={<TooltipCard />} />
              <Area type="monotone" dataKey="total" stroke="#52a9ff" fill="url(#fillBrand)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

