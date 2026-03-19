import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bell, BellRing, CheckCircle, AlertTriangle, Clock, Users, Settings } from 'lucide-react'

const StatusPill = ({ type }) => {
  const cls =
    type === 'late_return'
      ? 'bg-rose-500/15 text-rose-200 border-rose-500/25'
      : type === 'monthly_limit_exceeded'
        ? 'bg-amber-500/15 text-amber-200 border-amber-500/25'
        : 'bg-purple-500/15 text-purple-200 border-purple-500/25'
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs border ${cls}`}>{type.replace('_', ' ')}</span>
}

const NotificationCard = ({ notification, onMarkAsRead }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'late_return': return <Clock className="h-5 w-5 text-rose-400" />
      case 'monthly_limit_exceeded': return <AlertTriangle className="h-5 w-5 text-amber-400" />
      case 'unusual_activity': return <BellRing className="h-5 w-5 text-purple-400" />
      default: return <Bell className="h-5 w-5 text-zinc-400" />
    }
  }

  const getTimeAgo = (dateTime) => {
    const now = new Date()
    const notificationTime = new Date(dateTime)
    const diffMs = now - notificationTime
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString()
  }

  return (
    <motion.div
      className={`rounded-3xl bg-white/5 border border-white/10 overflow-hidden ${
        !notification.is_read ? 'border-l-4 border-l-brand-500' : ''
      }`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 mt-1">
            {getIcon(notification.notification_type)}
          </div>
          
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Header with Status and New Badge */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <StatusPill type={notification.notification_type} />
              {!notification.is_read && (
                <span className="inline-flex rounded-full px-2 py-1 text-xs bg-brand-500/20 text-brand-300 border border-brand-500/25">
                  New
                </span>
              )}
            </div>
            
            {/* Message */}
            <p className="text-zinc-100 font-medium mb-3 break-words">
              {notification.message}
            </p>
            
            {/* Meta Information */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{notification.student_name} ({notification.register_number})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span>{getTimeAgo(notification.notification_time)}</span>
                </div>
              </div>
              
              {notification.gatepass_id && (
                <div className="text-sm text-zinc-400">
                  Gatepass #{notification.gatepass_id}: {notification.reason}
                </div>
              )}
            </div>
          </div>
          
          {/* Right Side Actions */}
          <div className="flex flex-col items-end gap-3 flex-shrink-0 ml-4">
            <div className="text-xs text-zinc-500 whitespace-nowrap">
              {formatDateTime(notification.notification_time)}
            </div>
            {!notification.is_read && (
              <button
                onClick={() => onMarkAsRead(notification.id)}
                className="rounded-xl bg-brand-500/20 text-brand-300 border border-brand-500/25 px-3 py-1 text-xs hover:bg-brand-500/30 transition-colors whitespace-nowrap"
              >
                Mark as Read
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [settings, setSettings] = useState({
    late_return_grace_minutes: 15,
    monthly_pass_limit: 5
  })

  useEffect(() => {
    fetchNotifications()
    fetchUnreadCount()
    fetchSettings()
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications()
      fetchUnreadCount()
    }, 30000)
    return () => clearInterval(interval)
  }, [showUnreadOnly])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const params = showUnreadOnly ? '?unreadOnly=true' : ''
      const response = await fetch(`/api/notifications${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      setNotifications(data)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications/unread-count', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      setUnreadCount(data.count)
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      const settingsMap = {}
      data.forEach(setting => {
        settingsMap[setting.setting_key] = setting.setting_value
      })
      setSettings(settingsMap)
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      // Update local state
      setNotifications(prev => prev.map(notification => 
        notification.id === notificationId ? { ...notification, is_read: true } : notification
      ))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      // Update local state
      setNotifications(prev => prev.map(notification => ({ ...notification, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const updateSetting = async (key, value) => {
    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ setting_key: key, setting_value: parseInt(value) })
      })
      
      setSettings(prev => ({ ...prev, [key]: parseInt(value) }))
    } catch (error) {
      console.error('Error updating setting:', error)
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-2xl font-semibold">Notifications</div>
      <div className="mt-2 text-zinc-300">Monitor student activity and manage notification settings.</div>

      {/* Controls Bar */}
      <div className="mt-6 rounded-3xl bg-white/5 border border-white/10 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <span className="inline-flex rounded-full px-3 py-1 text-xs bg-rose-500/20 text-rose-300 border border-rose-500/25">
                {unreadCount} unread
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              className={`rounded-xl px-4 py-2 text-sm transition-colors ${
                showUnreadOnly 
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/25' 
                  : 'bg-white/5 text-zinc-300 border border-white/10 hover:bg-white/7'
              }`}
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            >
              {showUnreadOnly ? 'Show All' : 'Unread Only'}
            </button>
            {unreadCount > 0 && (
              <button
                className="rounded-xl bg-white/5 text-zinc-300 border border-white/10 px-4 py-2 text-sm hover:bg-white/7 transition-colors"
                onClick={markAllAsRead}
              >
                Mark All as Read
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Settings Card */}
      <motion.div
        className="mt-6 rounded-3xl bg-white/5 border border-white/10 overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="h-5 w-5 text-zinc-400" />
            <div className="text-lg font-semibold">Notification Settings</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Late Return Grace Period (minutes)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={settings.late_return_grace_minutes}
                  onChange={(e) => updateSetting('late_return_grace_minutes', e.target.value)}
                  className="w-20 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50"
                />
                <span className="text-sm text-zinc-400">minutes</span>
              </div>
              <p className="text-xs text-zinc-500 mt-2">
                Students will be marked as late if they return after this grace period
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Monthly Pass Limit
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={settings.monthly_pass_limit}
                  onChange={(e) => updateSetting('monthly_pass_limit', e.target.value)}
                  className="w-20 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50"
                />
                <span className="text-sm text-zinc-400">passes per month</span>
              </div>
              <p className="text-xs text-zinc-500 mt-2">
                Admin will be notified when students exceed this limit
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Notifications List */}
      <div className="mt-6">
        {loading ? (
          <div className="rounded-3xl bg-white/5 border border-white/10 p-8 text-center">
            <div className="text-zinc-400">Loading notifications...</div>
          </div>
        ) : notifications.length === 0 ? (
          <motion.div
            className="rounded-3xl bg-white/5 border border-white/10 p-8 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <CheckCircle className="h-12 w-12 text-zinc-500 mx-auto mb-4" />
            <p className="text-zinc-400">
              {showUnreadOnly ? 'No unread notifications' : 'No notifications at this time'}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification, index) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
