# Quick Start Guide - Parent Notification System

## Installation Steps

### **1. Install Dependencies**
```bash
cd backend
npm install nodemailer twilio zod
```

### **2. Create .env File**
Create a `.env` file in the `backend` directory with the following:

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=gatepass_db

# JWT
JWT_SECRET=your_super_secret_jwt_key_here

# Email (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Campus Gatepass <your-email@gmail.com>"

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Server
PORT=4001
CLIENT_ORIGIN=http://localhost:5174
```

### **3. Setup Email (Gmail)**
1. Enable 2-factor authentication on your Gmail account
2. Generate an app password:
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Create a new app password for "Campus Gatepass"
   - Use this as `SMTP_PASS`

### **4. Setup SMS (Twilio)**
1. Create a Twilio account at https://www.twilio.com/
2. Get your Account SID and Auth Token from the dashboard
3. Purchase a phone number
4. Add credentials to `.env`

### **5. Update Database**
Run the schema to add parent contacts tables:
```sql
-- Run this in your MySQL database
-- The tables are already in schema.sql
```

### **6. Start Server**
```bash
npm run dev
```

## Testing the System

### **Test Parent Contacts**
1. Go to the admin dashboard
2. Navigate to a student's profile
3. Add parent contact information
4. Use the "Test Notification" button

### **Test Notifications**
1. Create a gatepass request for a student with parent contacts
2. Approve the gatepass
3. Use security panel to scan QR for exit/entry
4. Check if parents receive notifications

## Troubleshooting

### **Common Issues**

#### **Module Not Found Error**
```bash
npm install nodemailer twilio zod
```

#### **Email Not Sending**
- Check Gmail app password
- Verify SMTP credentials
- Check spam/junk folder

#### **SMS Not Sending**
- Verify Twilio credentials
- Check phone number format (+countrycode)
- Ensure sufficient Twilio balance

#### **Database Connection Error**
- Verify MySQL is running
- Check database credentials
- Ensure database exists

### **Environment Variables**
Make sure all required environment variables are set in `.env`:

```bash
# Required for basic functionality
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=gatepass_db
JWT_SECRET=your_secret_key

# Required for notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your_app_password
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890
```

## Verification

Once the server starts successfully, you should see:

```
[nodemon] starting `node src/server.js`
Server running on port 4001
Database connected
```

The parent notification system is now ready to use!
