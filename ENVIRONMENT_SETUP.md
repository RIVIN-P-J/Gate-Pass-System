# Environment Variables Setup

## Required Environment Variables

### **Database Configuration**
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=gatepass_db
```

### **JWT Configuration**
```env
JWT_SECRET=your_super_secret_jwt_key_here
```

### **Email Configuration (Nodemailer)**
```env
# Gmail Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Campus Gatepass <your-email@gmail.com>

# Alternative SMTP providers:
# Outlook: smtp-mail.outlook.com:587
# Yahoo: smtp.mail.yahoo.com:587
# Custom: your-smtp-server:port
```

### **SMS Configuration (Twilio)**
```env
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### **Server Configuration**
```env
PORT=4001
CLIENT_ORIGIN=http://localhost:5174
```

## Setup Instructions

### **1. Email Setup (Gmail)**

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Campus Gatepass"
   - Use this password as `SMTP_PASS`

3. **Environment Variables**:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=generated-app-password
SMTP_FROM="Campus Gatepass <your-email@gmail.com>"
```

### **2. SMS Setup (Twilio)**

1. **Create Twilio Account**:
   - Sign up at https://www.twilio.com/
   - Get your Account SID and Auth Token from the dashboard

2. **Purchase a Phone Number**:
   - Buy a phone number from Twilio console
   - Note the phone number (in E.164 format: +1234567890)

3. **Environment Variables**:
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### **3. Database Setup**

1. **Create MySQL Database**:
```sql
CREATE DATABASE gatepass_db;
```

2. **Environment Variables**:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=gatepass_db
```

### **4. JWT Secret**

Generate a secure random string:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Set in environment:
```env
JWT_SECRET=generated_secure_string_here
```

## Complete .env File Example

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=mysql_password
DB_NAME=gatepass_db

# JWT
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random

# Email (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=campus-gatepass@your-school.edu
SMTP_PASS=generated_app_password_here
SMTP_FROM="Campus Gatepass System <campus-gatepass@your-school.edu>"

# SMS (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# Server
PORT=4001
CLIENT_ORIGIN=http://localhost:5174
```

## Testing the Configuration

### **Test Email Service**
```javascript
// In your backend, create a test route
router.get('/test-email', async (req, res) => {
  try {
    const result = await notificationService.sendEmail(
      'test@example.com',
      'Test Email',
      'This is a test email from Campus Gatepass System'
    )
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})
```

### **Test SMS Service**
```javascript
// In your backend, create a test route
router.get('/test-sms', async (req, res) => {
  try {
    const result = await notificationService.sendSMS(
      '+1234567890',
      'Test SMS from Campus Gatepass System'
    )
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})
```

## Troubleshooting

### **Email Issues**
1. **Authentication Failed**: Check Gmail app password
2. **Connection Refused**: Verify SMTP host and port
3. **Spam Filter**: Check spam/junk folder

### **SMS Issues**
1. **Invalid Number**: Ensure phone number is in E.164 format (+countrycode)
2. **Insufficient Credits**: Check Twilio account balance
3. **Unsupported Country**: Verify Twilio supports the target country

### **Database Issues**
1. **Connection Failed**: Check MySQL service status
2. **Access Denied**: Verify database credentials
3. **Database Not Found**: Ensure database exists

## Security Notes

1. **Never commit .env files** to version control
2. **Use strong, unique passwords** for all services
3. **Regularly rotate secrets** and credentials
4. **Limit email permissions** to only necessary scopes
5. **Monitor Twilio usage** and set up alerts

## Production Considerations

1. **Use environment-specific** configurations
2. **Set up email verification** (SPF, DKIM, DMARC)
3. **Configure rate limiting** for notifications
4. **Set up monitoring** for delivery failures
5. **Use production Twilio numbers** (not trial numbers)
