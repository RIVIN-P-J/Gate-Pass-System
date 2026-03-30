import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import { formatDateTime } from '../lib/date'
import { QrCode, Clock, AlertTriangle, CheckCircle } from 'lucide-react'

const StudentQRCode = ({ gatepassId }) => {
  const [qrData, setQrData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [generated, setGenerated] = useState(false)

  const generateQRCode = async () => {
    if (!gatepassId) {
      setError('Gatepass ID is required')
      return
    }

    setLoading(true)
    setError('')
    setGenerated(false)

    try {
      const { data } = await api.get(`/qr-codes/student/${gatepassId}`)
      setQrData(data)
      setGenerated(true)
    } catch (err) {
      const errorMessage = err?.response?.data?.message || 'Failed to generate QR code'
      setError(errorMessage)
      setGenerated(false)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (timeString) => {
    if (!timeString) return 'Not set'
    return formatDateTime(timeString)
  }

  if (!gatepassId) {
    return (
      <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 p-4">
        <div className="flex items-center gap-2 text-amber-300">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm">No active gatepass found</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {!generated && (
        <div className="text-center">
          <button
            onClick={generateQRCode}
            disabled={loading}
            className="px-6 py-3 bg-brand-500 text-white rounded-xl hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Generating...' : 'Generate Gatepass QR Code'}
          </button>
          <p className="mt-2 text-xs text-zinc-500">
            Generate the same gatepass QR used for both exit and entry.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/25 p-4">
          <div className="flex items-center gap-2 text-rose-300">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {generated && qrData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="space-y-4"
        >
          {/* QR Code Display */}
          <div className="rounded-3xl bg-white p-8 border-2 border-white/20">
            <div className="text-center mb-4">
              <div className="text-sm text-zinc-600 mb-2">Gatepass QR Code</div>
              <div className="text-xs text-zinc-500">Show this to security for campus exit or entry</div>
            </div>
            
            {/* QR Code Placeholder - In a real app, you'd use a QR code library */}
            <div className="w-64 h-64 mx-auto bg-black rounded-lg flex items-center justify-center">
              <QrCode className="h-32 w-32 text-white" />
            </div>
            
            <div className="text-center mt-4">
              <div className="text-xs text-zinc-500 font-mono break-all">
                QR Token: {qrData.qrToken.substring(0, 20)}...
              </div>
            </div>
          </div>

          {/* Gatepass Information */}
          <div className="rounded-3xl bg-white/5 border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-zinc-100 mb-4">Gatepass Details</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-zinc-400" />
                <div>
                  <div className="text-sm text-zinc-400">Exit Time</div>
                  <div className="text-zinc-200">{formatTime(qrData.gatepass.exit_time)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-zinc-400" />
                <div>
                  <div className="text-sm text-zinc-400">Expected Entry</div>
                  <div className="text-zinc-200">{formatTime(qrData.gatepass.in_time)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/25 p-4">
            <div className="flex items-center gap-2 text-emerald-300 mb-2">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-semibold">Instructions</span>
            </div>
            <ul className="text-emerald-200 text-sm space-y-1">
              <li>• Show this QR code to security personnel</li>
              <li>• Security will scan it for campus exit and entry</li>
              <li>• The same QR can be reused twice: once to exit, once to enter</li>
              <li>• Time is recorded only after verification</li>
            </ul>
          </div>

          {/* Warning */}
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 p-4">
            <div className="flex items-center gap-2 text-amber-300 mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-semibold">Important</span>
            </div>
            <p className="text-amber-200 text-sm">
              If you enter more than 5 minutes after your approved entry time, administrators will be notified.
            </p>
          </div>

          <button
            onClick={() => setGenerated(false)}
            className="w-full px-4 py-2 bg-zinc-700 text-zinc-300 rounded-xl hover:bg-zinc-600 transition-colors"
          >
            Generate New QR Code
          </button>
        </motion.div>
      )}
    </div>
  )
}

export default StudentQRCode
