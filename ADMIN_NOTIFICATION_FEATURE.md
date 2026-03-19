# Admin Notification System

## Overview
This feature provides admins with real-time notifications when students return late from approved gatepasses or exceed the monthly gatepass limit. Admins can configure thresholds and manage notifications through a dedicated interface.

## Features Implemented

### 1. Database Schema
- **AdminNotifications Table**: Stores all admin notifications with read/unread status
- **StudentMonthlyCounts Table**: Tracks monthly gatepass requests per student
- **Enhanced AdminSettings Table**: Added notification configuration options

### 2. Backend API Endpoints

#### Notification Routes (`/api/notifications/`)
- `GET /` - Get all notifications for admin (supports unread filter)
- `GET /unread-count` - Get count of unread notifications
- `POST /:id/read` - Mark specific notification as read
- `POST /mark-all-read` - Mark all notifications as read

#### Admin Routes (Enhanced)
- `GET /admin/settings` - Get notification settings
- `POST /admin/settings` - Update notification settings

### 3. Automated Detection Logic

#### Late Return Detection
- **Trigger**: When security personnel log student entry
- **Logic**: Compares actual entry time with approved in_time
- **Grace Period**: Configurable (default: 15 minutes)
- **Notification**: Sent to all admins if student exceeds grace period

#### Monthly Limit Detection
- **Trigger**: When student submits new gatepass request
- **Logic**: Tracks monthly count per student
- **Limit**: Configurable (default: 5 passes per month)
- **Notification**: Sent to all admins when limit is exceeded

### 4. Frontend Components

#### Admin Notifications Page (`/app/admin/notifications`)
- **Notification List**: View all notifications with color coding
- **Filter Options**: Show all or only unread notifications
- **Read Management**: Mark individual or all notifications as read
- **Settings Panel**: Configure notification thresholds
- **Real-time Updates**: Auto-refresh every 30 seconds

#### Notification Features
- **Color-coded Types**: 
  - Red: Late returns
  - Orange: Monthly limit exceeded
  - Purple: Unusual activity (future)
- **Time Display**: Shows relative time (e.g., "5 minutes ago")
- **Student Details**: Shows student name and register number
- **Gatepass Context**: Links to relevant gatepass when applicable

### 5. Real-time Notifications
- **WebSocket Integration**: Instant push notifications to connected admins
- **Auto-refresh**: Notifications update automatically every 30 seconds
- **Unread Counter**: Shows count of unread notifications in navigation

## How It Works

### For Late Returns
1. Student gets approved gatepass with specified return time
2. Student leaves campus (exit logged by security)
3. Student returns and security scans QR code
4. System logs entry time and compares with approved return time
5. If entry time > approved time + grace period → notification created
6. All admins receive real-time notification

### For Monthly Limits
1. Student submits new gatepass request
2. System increments monthly count for that student
3. If count > configured limit → notification created
4. All admins receive real-time notification
5. Notification shows current count and limit

### Admin Configuration
Admins can configure:
- **Late Return Grace Period**: 0-120 minutes (default: 15)
- **Monthly Pass Limit**: 1-50 passes per month (default: 5)

## Technical Implementation

### Database Changes
```sql
-- Notifications storage
CREATE TABLE AdminNotifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  student_id INT NOT NULL,
  gatepass_id INT NULL,
  notification_type ENUM('late_return', 'monthly_limit_exceeded', 'unusual_activity') NOT NULL,
  message TEXT NOT NULL,
  notification_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_read BOOLEAN DEFAULT FALSE
);

-- Monthly tracking
CREATE TABLE StudentMonthlyCounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  month_year VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  pass_count INT NOT NULL DEFAULT 0,
  UNIQUE KEY unique_student_month (student_id, month_year)
);
```

### Integration Points
- **Gatepass Creation**: Monthly limit check
- **Security Entry Logging**: Late return detection
- **Real-time Hub**: WebSocket notifications
- **Admin Settings**: Configuration management

### Performance Considerations
- **Async Processing**: Notifications created asynchronously to avoid blocking
- **Indexing**: Optimized queries for admin notification retrieval
- **Polling**: Efficient 30-second refresh interval
- **Batch Operations**: Bulk notification creation for multiple admins

## Usage Instructions

### Admin Usage
1. Go to `/app/admin/notifications` to view and manage notifications
2. Configure settings using the settings panel
3. Mark notifications as read to clean up the list
4. Use filters to focus on unread notifications

### Security Usage
1. Normal QR scanning process - no changes needed
2. System automatically detects late returns
3. Notifications created automatically in background

### Student Usage
1. Normal gatepass request process - no changes needed
2. System automatically tracks monthly counts
3. Notifications sent to admins when limits exceeded

## Benefits

### For Admins
- **Proactive Monitoring**: Early detection of policy violations
- **Configurable Thresholds**: Flexible rule management
- **Centralized Dashboard**: Single place for all alerts
- **Real-time Updates**: Immediate awareness of issues

### For Students
- **Clear Boundaries**: Understanding of limits and expectations
- **Fair Enforcement**: Consistent application of rules
- **Transparency**: Students know when limits are reached

### For Security
- **Automated Detection**: No manual monitoring required
- **Seamless Integration**: Works with existing QR scanning process
- **Reduced Errors**: Systematic vs manual tracking

## Future Enhancements
1. **Email Notifications**: Send alerts via email for critical issues
2. **SMS Alerts**: Text message notifications for urgent matters
3. **Student Notifications**: Inform students when they're approaching limits
4. **Pattern Analysis**: Detect unusual behavior patterns
5. **Report Generation**: Monthly/weekly notification summaries
6. **Escalation Rules**: Automatic escalation for repeated violations

This notification system provides comprehensive monitoring while maintaining the existing workflow and improving administrative oversight.
