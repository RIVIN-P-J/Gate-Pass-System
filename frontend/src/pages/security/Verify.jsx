import { useState } from 'react'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { api } from '../../lib/api'
import { formatDateTime } from '../../lib/date'
import QRScanner from '../../components/QRScanner'
import { Keyboard, Camera, QrCode } from 'lucide-react'

export default function Verify() {
  const [payload, setPayload] = useState('')
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [inputMode, setInputMode] = useState('scanner') // 'scanner' or 'manual'

  async function verify(qrPayload = payload) {
    setBusy(true)
    try {
      const { data } = await api.post('/security/verify', { payload: qrPayload })
      setResult(data)
      toast.success(`Valid gatepass - ${data.action === 'exit' ? 'Exit' : 'Entry'} recorded`)
      if (inputMode === 'scanner') {
        setPayload(qrPayload) // Update payload display when using scanner
      }
    } catch (err) {
      setResult(null)
      toast.error(err?.response?.data?.message || 'Invalid / expired')
    } finally {
      setBusy(false)
    }
  }

  function handleQRScan(scannedPayload) {
    verify(scannedPayload)
  }

  function handleQRError(error) {
    toast.error('Failed to scan QR code')
    console.error('QR Scan Error:', error)
  }


  return (
    <div>
      <div className="text-2xl font-semibold">Verify QR Code</div>
      <div className="mt-2 text-zinc-300">Scan QR codes using camera or upload images for verification.</div>


      {/* Mode Selection */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={() => setInputMode('scanner')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
            inputMode === 'scanner'
              ? 'bg-brand-500 text-white'
              : 'bg-white/5 text-zinc-300 border border-white/10 hover:bg-white/7'
          }`}
        >
          <Camera className="h-4 w-4" />
          QR Scanner
        </button>
        <button
          onClick={() => setInputMode('manual')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
            inputMode === 'manual'
              ? 'bg-brand-500 text-white'
              : 'bg-white/5 text-zinc-300 border border-white/10 hover:bg-white/7'
          }`}
        >
          <Keyboard className="h-4 w-4" />
          Manual Input
        </button>
      </div>

      {/* QR Scanner Mode */}
      {inputMode === 'scanner' && (
        <motion.div 
          className="mt-6 rounded-3xl bg-white/5 border border-white/10 p-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <QRScanner 
            onScan={handleQRScan}
            onError={handleQRError}
          />
        </motion.div>
      )}

      {/* Manual Input Mode */}
      {inputMode === 'manual' && (
        <motion.div 
          className="mt-6 grid gap-4 rounded-3xl bg-white/5 border border-white/10 p-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <label className="block text-sm text-zinc-300 mb-2">QR Payload</label>
            <textarea 
              className="input min-h-[120px]" 
              value={payload} 
              onChange={(e) => setPayload(e.target.value)} 
              placeholder="Paste QR payload here…"
            />
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <button className="btn-ghost" onClick={() => setPayload('')}>
              Clear
            </button>
            <button className="btn-primary" onClick={() => verify()} disabled={busy || !payload.trim()}>
              {busy ? 'Verifying…' : 'Verify'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Display Scanned/Entered Payload */}
      {payload && (
        <motion.div 
          className="mt-4 rounded-xl bg-zinc-800/50 border border-zinc-700 p-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-xs text-zinc-400 mb-1">Current Payload:</div>
          <div className="text-sm text-zinc-300 font-mono break-all">{payload}</div>
        </motion.div>
      )}

      {/* Verification Result */}
      {result?.gatepass ? (
        <motion.div 
          className="mt-6 rounded-3xl bg-white/5 border border-white/10 p-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-lg font-semibold">Gatepass #{result.gatepass.id}</div>
              <div className="mt-1 text-zinc-300">{result.student?.register_number}</div>
              <div className="mt-2 text-xs text-zinc-400">
                Out: {formatDateTime(result.gatepass.out_time)} • In: {formatDateTime(result.gatepass.in_time)}
              </div>
              {result.exit_time && (
                <div className="mt-1 text-xs text-amber-400">
                  Exited: {formatDateTime(result.exit_time)}
                </div>
              )}
            </div>
            <div className="rounded-full px-3 py-1 text-xs border bg-emerald-500/15 text-emerald-200 border-emerald-500/25">approved</div>
          </div>

          <div className="mt-4 text-zinc-200">{result.gatepass.reason}</div>

          <div className="mt-5 rounded-3xl bg-zinc-900/40 p-4 text-sm text-zinc-300">
            {result.action ? (
              <div>
                <div className="font-semibold text-zinc-100">Action recorded:</div>
                <div className="mt-2">
                  {result.action === 'exit' ? 'Exit' : 'Entry'} at {formatDateTime(result.action_time)}
                </div>
              </div>
            ) : (
              <div>No security action was recorded.</div>
            )}
          </div>
        </motion.div>
      ) : null}
    </div>
  )
}

