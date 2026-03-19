import { useState } from 'react'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { api } from '../../lib/api'
import { eventEmitter } from '../../lib/events'

export default function RequestGatepass() {
  const [form, setForm] = useState({
    reason: '',
    out_time: '',
    in_time: '',
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

    // OUT time validation
    if (!form.out_time) {
      newErrors.out_time = 'OUT time is required'
    } else if (outDateTime && outDateTime < now) {
      newErrors.out_time = 'OUT time cannot be in the past'
    }

    // IN time validation
    if (!form.in_time) {
      newErrors.in_time = 'IN time is required'
    } else if (inDateTime && outDateTime && inDateTime <= outDateTime) {
      newErrors.in_time = 'IN time must be later than OUT time'
    }

    // Additional validations if both times are set
    if (outDateTime && inDateTime) {
      // Future date check (max 30 days)
      const maxFutureDate = new Date()
      maxFutureDate.setDate(maxFutureDate.getDate() + 30)
      if (outDateTime > maxFutureDate) {
        newErrors.out_time = 'OUT time cannot be more than 30 days in the future'
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
    
    // Validate form before submission
    if (!validateForm()) {
      toast.error('Please fix the validation errors')
      return
    }

    setBusy(true)
    try {
      await api.post('/gatepasses', form)
      toast.success('Gatepass request submitted')
      setForm({ reason: '', out_time: '', in_time: '' })
      setErrors({})
      
      // Emit event to refresh admin dashboard stats
      eventEmitter.emit('requestCreated', { action: 'created' })
    } catch (err) {
      const errorData = err?.response?.data
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        // Handle backend validation errors
        const backendErrors = {}
        errorData.errors.forEach(error => {
          // Map error messages to form fields
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
            className={`input min-h-[110px] ${errors.reason ? 'border-rose-500/50 focus:border-rose-500/50' : ''}`}
            value={form.reason}
            onChange={(e) => handleInputChange('reason', e.target.value)}
            placeholder="Explain why you need to go out…"
          />
          {errors.reason && (
            <div className="mt-1 text-xs text-rose-400 flex items-center gap-1">
              <span className="inline-block w-1 h-1 bg-rose-400 rounded-full"></span>
              {errors.reason}
            </div>
          )}
        </div>
        
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
            <strong>Please note:</strong> OUT time cannot be in the past, IN time must be later than OUT time, and requests cannot be made more than 30 days in advance.
          </div>
        </div>

        <button className="btn-primary py-3" disabled={busy}>
          {busy ? 'Submitting…' : 'Submit Request'}
        </button>
      </motion.form>
    </div>
  )
}

