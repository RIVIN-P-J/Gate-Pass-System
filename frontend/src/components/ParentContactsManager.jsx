import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { api } from '../lib/api'
import { Phone, Mail, User, Plus, Edit2, Trash2, TestTube, CheckCircle, AlertCircle } from 'lucide-react'

const ContactCard = ({ contact, onEdit, onDelete, onTest }) => {
  const getIcon = (type) => {
    return type === 'sms' ? <Phone className="h-5 w-5" /> : <Mail className="h-5 w-5" />
  }

  const getStatusColor = (isActive) => {
    return isActive 
      ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/25' 
      : 'bg-rose-500/15 text-rose-200 border-rose-500/25'
  }

  return (
    <motion.div
      className="rounded-3xl bg-white/5 border border-white/10 p-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-1 text-zinc-400">
            {getIcon(contact.contact_type)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="text-zinc-100 font-medium">{contact.contact_name}</h4>
              <span className={`inline-flex rounded-full px-2 py-1 text-xs border ${getStatusColor(contact.is_active)}`}>
                {contact.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-zinc-300 text-sm mb-1">{contact.relationship}</p>
            <p className="text-zinc-400 text-sm font-mono">{contact.contact_value}</p>
            <p className="text-xs text-zinc-500 mt-2">
              Preferred: {contact.preferred_method === 'both' ? 'SMS & Email' : contact.preferred_method.toUpperCase()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onTest(contact.student_id)}
            className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/25 hover:bg-amber-500/30 transition-colors"
            title="Test Notification"
          >
            <TestTube className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEdit(contact)}
            className="p-2 rounded-xl bg-white/5 text-zinc-300 border border-white/10 hover:bg-white/7 transition-colors"
            title="Edit Contact"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(contact.id)}
            className="p-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/25 hover:bg-rose-500/30 transition-colors"
            title="Delete Contact"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

const ContactForm = ({ contact, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    contact_type: contact?.contact_type || 'sms',
    contact_value: contact?.contact_value || '',
    contact_name: contact?.contact_name || '',
    relationship: contact?.relationship || '',
    preferred_method: contact?.preferred_method || 'both',
    is_active: contact?.is_active !== undefined ? contact.is_active : true
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.contact_value || !formData.contact_name || !formData.relationship) {
      toast.error('Please fill in all required fields')
      return
    }

    // Validate contact format
    if (formData.contact_type === 'sms') {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
      if (!phoneRegex.test(formData.contact_value)) {
        toast.error('Please enter a valid phone number')
        return
      }
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.contact_value)) {
        toast.error('Please enter a valid email address')
        return
      }
    }

    setLoading(true)
    try {
      await onSave(formData)
      onCancel()
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      className="rounded-3xl bg-white/5 border border-white/10 p-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="text-lg font-semibold text-zinc-100 mb-4">
        {contact ? 'Edit Contact' : 'Add New Contact'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Contact Type
            </label>
            <select
              value={formData.contact_type}
              onChange={(e) => setFormData({ ...formData, contact_type: e.target.value })}
              className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50"
            >
              <option value="sms">SMS</option>
              <option value="email">Email</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Preferred Method
            </label>
            <select
              value={formData.preferred_method}
              onChange={(e) => setFormData({ ...formData, preferred_method: e.target.value })}
              className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50"
            >
              <option value="sms">SMS Only</option>
              <option value="email">Email Only</option>
              <option value="both">Both</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Contact {formData.contact_type === 'sms' ? 'Phone Number' : 'Email Address'}
          </label>
          <input
            type={formData.contact_type === 'sms' ? 'tel' : 'email'}
            value={formData.contact_value}
            onChange={(e) => setFormData({ ...formData, contact_value: e.target.value })}
            placeholder={formData.contact_type === 'sms' ? '+1234567890' : 'parent@example.com'}
            className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Contact Name
            </label>
            <input
              type="text"
              value={formData.contact_name}
              onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
              placeholder="John Doe"
              className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Relationship
            </label>
            <input
              type="text"
              value={formData.relationship}
              onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
              placeholder="Father, Mother, Guardian, etc."
              className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50"
            />
          </div>
        </div>

        {contact && (
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 rounded border-white/10 bg-white/5 text-brand-500 focus:ring-brand-500/50"
            />
            <label htmlFor="is_active" className="text-sm text-zinc-300">
              Active
            </label>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-white/5 text-zinc-300 border border-white/10 hover:bg-white/7 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Saving...' : (contact ? 'Update' : 'Add')}
          </button>
        </div>
      </form>
    </motion.div>
  )
}

export default function ParentContactsManager({ studentId }) {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingContact, setEditingContact] = useState(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    if (studentId) {
      fetchContacts()
    }
  }, [studentId])

  const fetchContacts = async () => {
    try {
      setLoading(true)
      const { data } = await api.get(`/parent-contacts/student/${studentId}`)
      setContacts(data)
    } catch (error) {
      toast.error('Failed to fetch parent contacts')
    } finally {
      setLoading(false)
    }
  }

  const handleAddContact = async (formData) => {
    try {
      await api.post(`/parent-contacts/student/${studentId}`, formData)
      toast.success('Parent contact added successfully')
      fetchContacts()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to add contact')
    }
  }

  const handleUpdateContact = async (formData) => {
    try {
      await api.put(`/parent-contacts/${editingContact.id}`, formData)
      toast.success('Parent contact updated successfully')
      fetchContacts()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update contact')
    }
  }

  const handleDeleteContact = async (contactId) => {
    if (!confirm('Are you sure you want to delete this contact?')) {
      return
    }

    try {
      await api.delete(`/parent-contacts/${contactId}`)
      toast.success('Parent contact deleted successfully')
      fetchContacts()
    } catch (error) {
      toast.error('Failed to delete contact')
    }
  }

  const handleTestNotification = async (studentId) => {
    try {
      const { data } = await api.post('/parent-contacts/test-notification/' + studentId, { action: 'exit' })
      if (data.success) {
        toast.success(`Test notification sent to ${data.results.filter(r => r.success).length} contacts`)
      } else {
        toast.error(data.message || 'Failed to send test notification')
      }
    } catch (error) {
      toast.error('Failed to send test notification')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-100">Parent Contacts</h3>
          <p className="text-zinc-400 text-sm mt-1">
            Manage contact information for parent notifications
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 text-white hover:bg-brand-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Contact
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <ContactForm
            contact={editingContact}
            onSave={editingContact ? handleUpdateContact : handleAddContact}
            onCancel={() => {
              setShowForm(false)
              setEditingContact(null)
            }}
          />
        )}
      </AnimatePresence>

      {loading ? (
        <div className="text-center py-8 text-zinc-400">
          Loading parent contacts...
        </div>
      ) : contacts.length === 0 ? (
        <motion.div
          className="rounded-3xl bg-white/5 border border-white/10 p-8 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <User className="h-12 w-12 text-zinc-500 mx-auto mb-4" />
          <p className="text-zinc-400">
            No parent contacts configured. Add contacts to enable notifications.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {contacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onEdit={(contact) => {
                setEditingContact(contact)
                setShowForm(true)
              }}
              onDelete={handleDeleteContact}
              onTest={handleTestNotification}
            />
          ))}
        </div>
      )}
    </div>
  )
}
