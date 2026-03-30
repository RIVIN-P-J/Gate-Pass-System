# Parent Notification System

## Overview
This document explains the comprehensive parent notification system that automatically sends real-time SMS and email notifications to parents when students exit or enter campus via QR scan or security actions.

## Features

### **Automatic Notifications**
- **Real-time Triggers**: Notifications sent instantly on exit/entry
- **Multiple Channels**: SMS via Twilio and Email via Nodemailer
- **Dynamic Messages**: Personalized with student name and timestamp
- **Contact Management**: Flexible parent contact configuration

### **Message Content**
```
SMS: "Your ward [Student Name] ([Register Number]) has left/entered the campus at [Time]."

Email: Professional HTML template with:
- Student information
- Action timestamp
- School branding
- Contact information
```

## Technical Implementation

### **Backend Services**

#### **NotificationService Class** (`/src/services/notificationService.js`)
```javascript
class NotificationService {
  // Initialize email and SMS clients
  constructor() {
    this.emailTransporter = nodemailer.createTransporter({...})
    this.twilioClient = twilio(accountSid, authToken)
  }

  // Main notification method
  async sendParentNotification(studentId, action, timestamp) {
    const contacts = await this.getParentContacts(studentId)
    const message = this.generateMessage(student, action, timestamp)
    
    // Send to all active contacts
    for (const contact of contacts) {
      if (contact.contact_type === 'sms') {
        await this.sendSMS(contact.contact_value, message)
      } else if (contact.contact_type === 'email') {
        await this.sendEmail(contact.contact_value, subject, message)
      }
    }
  }
}
```

#### **Security Route Integration**
```javascript
// Exit route
router.post('/gatepasses/:id/exit', async (req, res) => {
  // ... exit logic ...
  
  // Send parent notification (async)
  notificationService.sendParentNotification(studentId, 'exit', new Date())
    .catch(err => console.error('Error:', err))
})

// Entry route
router.post('/gatepasses/:id/entry', async (req, res) => {
  // ... entry logic ...
  
  // Send parent notification (async)
  notificationService.sendParentNotification(studentId, 'entry', new Date())
    .catch(err => console.error('Error:', err))
})
```

### **Database Schema**

#### **ParentContacts Table**
```sql
CREATE TABLE ParentContacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  contact_type ENUM('sms', 'email') NOT NULL,
  contact_value VARCHAR(255) NOT NULL,
  contact_name VARCHAR(120) NOT NULL,
  relationship VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  preferred_method ENUM('sms', 'email', 'both') DEFAULT 'both',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### **ParentNotificationLogs Table**
```sql
CREATE TABLE ParentNotificationLogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  action ENUM('exit', 'entry') NOT NULL,
  notification_results JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Frontend Components**

#### **ParentContactsManager Component**
```javascript
// Features:
- Add/Edit/Delete parent contacts
- Test notification functionality
- Contact validation
- Active/Inactive status management
- Preferred method selection
```

## API Endpoints

### **Parent Contact Management**

#### **Get Contacts**
```
GET /api/parent-contacts/student/:studentId
Authorization: Required
```

#### **Add Contact**
```
POST /api/parent-contacts/student/:studentId
Body: {
  contact_type: 'sms' | 'email',
  contact_value: string,
  contact_name: string,
  relationship: string,
  preferred_method: 'sms' | 'email' | 'both'
}
```

#### **Update Contact**
```
PUT /api/parent-contacts/:contactId
Body: {
  contact_value?: string,
  contact_name?: string,
  relationship?: string,
  preferred_method?: string,
  is_active?: boolean
}
```

#### **Delete Contact**
```
DELETE /api/parent-contacts/:contactId
Authorization: Required
```

#### **Test Notification**
```
POST /api/parent-contacts/test-notification/:studentId
Body: { action: 'exit' | 'entry' }
Authorization: Admin only
```

#### **Notification Logs**
```
GET /api/parent-contacts/logs/:studentId
Authorization: Required
```

## Configuration

### **Environment Variables**
```env
# Email Configuration (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Campus Gatepass <your-email@gmail.com>"

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### **Service Initialization**
```javascript
// Services are automatically initialized on server start
const notificationService = require('./services/notificationService')

// Available methods:
notificationService.sendParentNotification(studentId, action, timestamp)
notificationService.sendSMS(phoneNumber, message)
notificationService.sendEmail(email, subject, message)
notificationService.testNotification(studentId, action)
```

## User Experience

### **For Parents**
- **Instant Alerts**: Real-time notifications when student moves
- **Clear Messages**: Easy-to-understand notification content
- **Multiple Channels**: Receive via SMS, email, or both
- **Professional Format**: Well-designed email templates

### **For Students**
- **Privacy Protected**: Only authorized contacts receive notifications
- **Contact Management**: Students can manage their own parent contacts
- **Testing Available**: Verify notification setup before use

### **For Administrators**
- **Contact Management**: Add/remove parent contacts
- **Testing Tools**: Test notification delivery
- **Activity Logs**: Monitor notification history
- **Error Tracking**: Identify delivery issues

## Message Templates

### **SMS Template**
```
"Your ward John Doe (2024001) has left the campus at March 19, 2024 10:15 AM."
```

### **Email Template**
```html
<!DOCTYPE html>
<html>
<head>
  <title>Campus Notification</title>
  <style>
    /* Professional email styling */
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🏫 Campus Gatepass System</div>
    </div>
    <div class="content">
      Your ward John Doe (2024001) has left the campus at March 19, 2024 10:15 AM.
      <div class="timestamp">
        Sent on: March 19, 2024 10:16 AM
      </div>
    </div>
    <div class="footer">
      Automated message from Campus Gatepass System
    </div>
  </div>
</body>
</html>
```

## Error Handling

### **Notification Failures**
- **Logging**: All failures logged to console and database
- **Retry Logic**: Basic retry for transient failures
- **Graceful Degradation**: System continues if notifications fail
- **Error Tracking**: Detailed error information in logs

### **Common Issues**
1. **Invalid Phone Numbers**: Format validation prevents errors
2. **Email Bounces**: Logged for follow-up
3. **Service Outages**: Graceful handling of Twilio/SMTP issues
4. **Rate Limits**: Built-in rate limiting for API calls

## Security Considerations

### **Data Protection**
- **Contact Privacy**: Only authorized users can view contacts
- **PII Protection**: Sensitive data encrypted in transit
- **Access Control**: Role-based access to contact management
- **Audit Trail**: Complete logging of all notification attempts

### **Service Security**
- **API Keys**: Secure storage of Twilio and SMTP credentials
- **Rate Limiting**: Prevent abuse of notification services
- **Input Validation**: Sanitization of all contact data
- **Error Disclosure**: Minimal error information to users

## Performance Optimization

### **Async Processing**
- **Non-blocking**: Notifications sent asynchronously
- **Queue System**: Built-in queue for high-volume scenarios
- **Batch Processing**: Efficient handling of multiple contacts
- **Timeout Handling**: Proper timeouts for external services

### **Resource Management**
- **Connection Pooling**: Reuse SMTP connections
- **Memory Efficiency**: Proper cleanup of resources
- **Error Recovery**: Automatic recovery from service failures
- **Monitoring**: Track notification performance metrics

## Monitoring and Analytics

### **Delivery Tracking**
```javascript
// Notification results include:
{
  type: 'sms' | 'email',
  contact: '+1234567890' | 'email@example.com',
  success: true | false,
  sid: 'twilio_message_id' | 'email_message_id',
  error: 'error_message' // if failed
}
```

### **Metrics to Track**
- **Delivery Success Rate**: Percentage of successful notifications
- **Response Time**: Time from trigger to delivery
- **Error Rates**: Common failure patterns
- **Usage Patterns**: Peak notification times

## Testing

### **Unit Tests**
```javascript
// Test notification service
describe('NotificationService', () => {
  test('should send SMS notification', async () => {
    const result = await notificationService.sendSMS('+1234567890', 'Test message')
    expect(result.success).toBe(true)
  })

  test('should send email notification', async () => {
    const result = await notificationService.sendEmail('test@example.com', 'Subject', 'Message')
    expect(result.success).toBe(true)
  })
})
```

### **Integration Tests**
- **End-to-end**: Test complete notification flow
- **Service Integration**: Verify Twilio and SMTP connectivity
- **Error Scenarios**: Test failure handling and recovery
- **Load Testing**: Verify performance under load

## Troubleshooting

### **Common Issues**

#### **SMS Not Delivered**
1. **Check Phone Format**: Ensure E.164 format (+countrycode)
2. **Verify Twilio Balance**: Check account credits
3. **Country Support**: Verify Twilio supports target country
4. **Phone Validity**: Confirm phone number is active

#### **Email Not Delivered**
1. **Check SMTP Credentials**: Verify email and password
2. **SPF/DKIM**: Set up email authentication
3. **Spam Filters**: Check spam/junk folders
4. **Rate Limits**: Verify not exceeding sending limits

#### **Contact Not Found**
1. **Student ID**: Verify correct student identification
2. **Active Status**: Check contact is marked as active
3. **Database Sync**: Ensure contacts are properly saved

### **Debugging Tools**
```javascript
// Enable debug logging
DEBUG=notifications:* node server.js

// Test specific student notification
POST /api/parent-contacts/test-notification/123
{
  "action": "exit"
}

// View notification logs
GET /api/parent-contacts/logs/123
```

## Future Enhancements

### **Potential Improvements**
1. **WhatsApp Integration**: Add WhatsApp notifications
2. **Push Notifications**: Mobile app push notifications
3. **Message Templates**: Customizable message templates
4. **Scheduling**: Scheduled notification windows
5. **Analytics Dashboard**: Detailed notification analytics

### **Advanced Features**
1. **Geofencing**: Location-based notifications
2. **Multi-language**: Support for multiple languages
3. **Emergency Alerts**: Critical notification system
4. **Parent Portal**: Dedicated parent interface
5. **Integration**: SIS and LMS integration

This parent notification system provides a comprehensive, reliable, and secure solution for keeping parents informed about their children's campus movements in real-time.
