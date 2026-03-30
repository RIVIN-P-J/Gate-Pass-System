const nodemailer = require('nodemailer')
const twilio = require('twilio')
const { query } = require('../db/pool')

class NotificationService {
  constructor() {
    // Initialize email transporter only if email credentials are provided
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.emailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      })
    } else {
      console.log('Email credentials not provided. Email notifications will be disabled.')
      this.emailTransporter = null
    }

    // Initialize Twilio client only if Twilio credentials and sender number are provided
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      this.twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      )
      this.twilioFrom = process.env.TWILIO_PHONE_NUMBER
    } else {
      console.log('Twilio configuration incomplete. SMS notifications will be disabled.')
      this.twilioClient = null
      this.twilioFrom = null
    }
  }

  async getParentContacts(studentId) {
    try {
      const contacts = await query(
        `SELECT pc.contact_type, pc.contact_value, pc.is_active, pc.preferred_method,
                s.name as student_name, s.register_number
         FROM ParentContacts pc
         JOIN Students s ON s.id = pc.student_id
         WHERE pc.student_id = ? AND pc.is_active = 1`,
        [studentId]
      )
      return contacts
    } catch (error) {
      console.error('Error fetching parent contacts:', error)
      return []
    }
  }

  contactMatchesPreference(contact) {
    if (!contact.preferred_method || contact.preferred_method === 'both') {
      return true
    }

    return contact.preferred_method === contact.contact_type
  }

  async sendSMS(to, message) {
    try {
      if (!this.twilioClient || !this.twilioFrom) {
        console.log('SMS service not available - skipping SMS to:', to)
        return { success: false, error: 'SMS service not configured' }
      }

      const response = await this.twilioClient.messages.create({
        body: message,
        from: this.twilioFrom,
        to: to
      })
      console.log('SMS sent successfully to', to, 'sid:', response.sid)
      return { success: true, sid: response.sid }
    } catch (error) {
      console.error('Error sending SMS to', to, error)
      return { success: false, error: error.message }
    }
  }

  async sendEmail(to, subject, message) {
    try {
      if (!this.emailTransporter) {
        console.log('Email service not available - skipping email to:', to)
        return { success: false, error: 'Email service not configured' }
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: to,
        subject: subject,
        html: this.generateEmailTemplate(message)
      }

      const response = await this.emailTransporter.sendMail(mailOptions)
      console.log('Email sent successfully:', response.messageId)
      return { success: true, messageId: response.messageId }
    } catch (error) {
      console.error('Error sending email:', error)
      return { success: false, error: error.message }
    }
  }

  generateEmailTemplate(message) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Campus Notification</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            background-color: #4f46e5;
            color: white;
            padding: 20px;
            border-radius: 10px 10px 0 0;
            margin: -30px -30px 20px -30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            text-align: center;
          }
          .content {
            margin-bottom: 30px;
          }
          .footer {
            border-top: 1px solid #e0e0e0;
            padding-top: 20px;
            font-size: 12px;
            color: #666;
            text-align: center;
          }
          .timestamp {
            background-color: #f8f9fa;
            padding: 10px;
            border-radius: 5px;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🏫 Campus Gatepass System</div>
          </div>
          <div class="content">
            ${message}
            <div class="timestamp">
              This notification was sent on ${new Date().toLocaleString()}
            </div>
          </div>
          <div class="footer">
            <p>This is an automated message from the Campus Gatepass System.</p>
            <p>If you have any questions, please contact the school administration.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  async sendParentNotification(studentId, action, timestamp) {
    try {
      const contacts = await this.getParentContacts(studentId)
      const student = contacts[0] // Get student info from first contact

      if (!contacts || contacts.length === 0) {
        console.log('No parent contacts found for student:', studentId)
        return { success: false, message: 'No parent contacts found' }
      }

      const activeContacts = contacts.filter(contact => contact.is_active)
      if (activeContacts.length === 0) {
        console.log('No active parent contacts found for student:', studentId)
        return { success: false, message: 'No active parent contacts found' }
      }

      let actionText = 'has returned to the campus'
      let subjectSuffix = 'Entry Notification'

      if (action === 'exit') {
        actionText = 'has left the campus'
        subjectSuffix = 'Exit Alert'
      } else if (action === 'emergency') {
        actionText = 'has requested an emergency exit from campus'
        subjectSuffix = 'Emergency Alert'
      }

      const formattedTime = new Date(timestamp).toLocaleString()
      const message = `Hello,\n\nThis is to inform you that ${student.student_name} ${actionText} at ${formattedTime}.\nPlease contact the school if you have any questions or need assistance.`
      const subject = `Campus Alert: ${student.student_name} ${subjectSuffix}`

      const results = []

      for (const contact of activeContacts) {
        try {
          if (!this.contactMatchesPreference(contact)) {
            console.log(`Skipping ${contact.contact_type} ${contact.contact_value} due to preferred contact method ${contact.preferred_method}`)
            results.push({
              type: contact.contact_type,
              contact: contact.contact_value,
              preferred: contact.preferred_method,
              success: false,
              error: 'Skipped due to preferred contact method'
            })
            continue
          }

          let result = { success: false }
          if (contact.contact_type === 'sms' && contact.contact_value) {
            result = await this.sendSMS(contact.contact_value, message)
            console.log(`SMS sent to ${contact.contact_value}:`, result.success)
          } else if (contact.contact_type === 'email' && contact.contact_value) {
            result = await this.sendEmail(contact.contact_value, subject, message)
            console.log(`Email sent to ${contact.contact_value}:`, result.success)
          }

          results.push({
            type: contact.contact_type,
            contact: contact.contact_value,
            preferred: contact.preferred_method,
            ...result
          })

        } catch (error) {
          console.error(`Failed to send ${contact.contact_type} to ${contact.contact_value}:`, error)
          results.push({
            type: contact.contact_type,
            contact: contact.contact_value,
            success: false,
            error: error.message
          })
        }
      }

      // Log notification attempt
      await this.logNotification(studentId, action, results)

      return {
        success: true,
        message: `Notifications sent to ${results.filter(r => r.success).length} contacts`,
        results: results
      }

    } catch (error) {
      console.error('Error in sendParentNotification:', error)
      return { success: false, error: error.message }
    }
  }

  async logNotification(studentId, action, results) {
    try {
      await query(
        `INSERT INTO ParentNotificationLogs 
         (student_id, action, notification_results, created_at) 
         VALUES (?, ?, ?, NOW())`,
        [studentId, action, JSON.stringify(results)]
      )
    } catch (error) {
      console.error('Error logging notification:', error)
    }
  }

  async testNotification(studentId, action = 'exit') {
    const testTime = new Date()
    return await this.sendParentNotification(studentId, action, testTime)
  }
}

module.exports = new NotificationService()
