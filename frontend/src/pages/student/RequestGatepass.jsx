import { useState } from 'react'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { api } from '../../lib/api'
import { eventEmitter } from '../../lib/events'

export default function RequestGatepass() {
  const [form, setForm] = useState({
    gatepass_type: 'standard',
    reason: '',
    out_time: '',
    in_time: '',
    emergency_category: 'medical',
    duration_minutes: 60,
  })
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState({})

  // Validation function
  const validateForm = () => {
    const newErrors = {}
    const now = new Date()
    const outDateTime = form.out_time ? new Date(form.out_time) : null
    const inDateTime = form.in_time ? new Date(form.in_time) : null

    // Reason validation
    if (!form.reason.trim()) {
      newErrors.reason = 'Reason is required'
    } else if (form.reason.trim().length < 3) {
      newErrors.reason = 'Reason must be at least 3 characters'
    }

    if (form.gatepass_type === 'standard') {
      if (!form.out_time) {
        newErrors.out_time = 'OUT time is required'
      } else if (outDateTime && outDateTime < now) {
        newErrors.out_time = 'OUT time cannot be in the past'
      }

      if (!form.in_time) {
        newErrors.in_time = 'IN time is required'
      } else if (inDateTime && outDateTime && inDateTime <= outDateTime) {
        newErrors.in_time = 'IN time must be later than OUT time'
      }

      if (outDateTime && inDateTime) {
        const maxFutureDate = new Date()
        maxFutureDate.setDate(maxFutureDate.getDate() + 30)
        if (outDateTime > maxFutureDate) {
          newErrors.out_time = 'OUT time cannot be more than 30 days in the future'
        }
      }
    } else {
      if (!form.emergency_category) {
        newErrors.emergency_category = 'Emergency category is required'
      }
      if (!form.duration_minutes || form.duration_minutes < 15) {
        newErrors.duration_minutes = 'Duration must be at least 15 minutes'
      } else if (form.duration_minutes > 720) {
        newErrors.duration_minutes = 'Duration cannot exceed 12 hours'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Real-time validation on input change
  const handleInputChange = (field, value) => {
    setForm({ ...form, [field]: value })
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  async function onSubmit(e) {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please fix the validation errors')
      return
    }

    const payload = {
      gatepass_type: form.gatepass_type,
      reason: form.reason.trim(),
    }

    if (form.gatepass_type === 'standard') {
      payload.out_time = form.out_time
      payload.in_time = form.in_time
    } else {
      payload.emergency_category = form.emergency_category
      payload.duration_minutes = Number(form.duration_minutes)
    }

    setBusy(true)
    try {
      await api.post('/gatepasses', payload)
      toast.success('Gatepass request submitted')
      setForm({
        gatepass_type: 'standard',
        reason: '',
        out_time: '',
        in_time: '',
        emergency_category: 'medical',
        duration_minutes: 60,
      })
      setErrors({})
      eventEmitter.emit('requestCreated', { action: 'created' })
    } catch (err) {
      const errorData = err?.response?.data
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        const backendErrors = {}
        errorData.errors.forEach(error => {
          if (error.includes('OUT time')) {
            backendErrors.out_time = error
          } else if (error.includes('IN time')) {
            backendErrors.in_time = error
          } else {
            backendErrors.general = error
          }
        })
        setErrors(backendErrors)
        toast.error('Please fix the validation errors')
      } else {
        toast.error(errorData?.message || 'Failed to submit request')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="text-2xl font-semibold">Request Gatepass</div>
      <div className="mt-2 text-zinc-300">Choose standard or emergency. Keep the request short and submit.</div>

      <div className="mt-5 rounded-3xl bg-white/5 border border-white/10 p-5 text-sm text-zinc-400">
        <div className="font-semibold text-zinc-100 mb-2">Emergency steps</div>
        <div className="grid gap-2">
          <div>1. Choose <strong>Emergency Gatepass</strong></div>
          <div>2. Select category</div>
          <div>3. Enter a brief reason</div>
          <div>4. Set expected duration and submit</div>
        </div>
      </div>

      <motion.form
        onSubmit={onSubmit}
        className="mt-6 grid gap-4 rounded-3xl bg-white/5 border border-white/10 p-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-sm text-zinc-300 mb-2">Request type</div>
            <select
              className="input"
              value={form.gatepass_type}
              onChange={(e) => handleInputChange('gatepass_type', e.target.value)}
            >
              <option value="standard">Standard</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>
          {form.gatepass_type === 'emergency' && (
            <div>
              <div className="text-sm text-zinc-300 mb-2">Category</div>
              <select
                className="input"
                value={form.emergency_category}
                onChange={(e) => handleInputChange('emergency_category', e.target.value)}
              >
                <option value="medical">Medical</option>
                <option value="family">Family</option>
                <option value="other">Other</option>
              </select>
              {errors.emergency_category && (
                <div className="mt-1 text-xs text-rose-400">{errors.emergency_category}</div>
              )}
            </div>
          )}
        </div>

        <div>
          <div className="text-sm text-zinc-300 mb-2">Reason</div>
          <textarea
            className={`input min-h-[110px] ${errors.reason ? 'border-rose-500/50 focus:border-rose-500/50' : ''}`}
            value={form.reason}
            onChange={(e) => handleInputChange('reason', e.target.value)}
            placeholder={form.gatepass_type === 'emergency' ? 'Briefly explain the emergency reason…' : 'Explain why you need to go out…'}
          />
          {errors.reason && (
            <div className="mt-1 text-xs text-rose-400 flex items-center gap-1">
              <span className="inline-block w-1 h-1 bg-rose-400 rounded-full"></span>
              {errors.reason}
            </div>
          )}
        </div>

        {form.gatepass_type === 'emergency' && (
          <div>
            <div className="text-sm text-zinc-300 mb-2">Expected duration (minutes)</div>
            <input
              className={`input ${errors.duration_minutes ? 'border-rose-500/50 focus:border-rose-500/50' : ''}`}
              type="number"
              min="15"
              max="720"
              value={form.duration_minutes}
              onChange={(e) => handleInputChange('duration_minutes', e.target.value)}
            />
            {errors.duration_minutes && (
              <div className="mt-1 text-xs text-rose-400 flex items-center gap-1">
                <span className="inline-block w-1 h-1 bg-rose-400 rounded-full"></span>
                {errors.duration_minutes}
              </div>
            )}
          </div>
        )}

        {form.gatepass_type === 'standard' && (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm text-zinc-300 mb-2">Out time</div>
              <input
                className={`input ${errors.out_time ? 'border-rose-500/50 focus:border-rose-500/50' : ''}`}
                type="datetime-local"
                value={form.out_time}
                onChange={(e) => handleInputChange('out_time', e.target.value)}
                min={new Date().toISOString().slice(0, 16)} // Prevent selecting past dates
              />
              {errors.out_time && (
                <div className="mt-1 text-xs text-rose-400 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 bg-rose-400 rounded-full"></span>
                  {errors.out_time}
                </div>
              )}
            </div>
            
            <div>
              <div className="text-sm text-zinc-300 mb-2">In time</div>
              <input
                className={`input ${errors.in_time ? 'border-rose-500/50 focus:border-rose-500/50' : ''}`}
                type="datetime-local"
                value={form.in_time}
                onChange={(e) => handleInputChange('in_time', e.target.value)}
                min={form.out_time || new Date().toISOString().slice(0, 16)} // Prevent selecting before OUT time
              />
              {errors.in_time && (
                <div className="mt-1 text-xs text-rose-400 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 bg-rose-400 rounded-full"></span>
                  {errors.in_time}
                </div>
              )}
            </div>
          </div>
        )}

        {/* General error display */}
        {errors.general && (
          <div className="rounded-xl bg-rose-500/10 border border-rose-500/25 p-3">
            <div className="text-sm text-rose-300 flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-rose-400 rounded-full"></span>
              {errors.general}
            </div>
          </div>
        )}

        <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 p-3">
          <div className="text-xs text-amber-300">
            {form.gatepass_type === 'standard' ? (
              <><strong>Please note:</strong> OUT time cannot be in the past, IN time must be later than OUT time, and requests cannot be made more than 30 days in advance.</>
            ) : (
              <><strong>Emergency requests:</strong> Medical and family emergencies are prioritized and may auto-approve. Parents and admin will be notified instantly.</>
            )}
          </div>
        </div>

        <button className="btn-primary py-3" disabled={busy}>
          {busy ? 'Submitting…' : 'Submit Request'}
        </button>
      </motion.form>
    </div>
  )
}

