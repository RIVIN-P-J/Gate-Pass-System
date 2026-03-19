# Student Status Tracking System

## Overview
This system tracks student campus status in real-time, automatically updating when students exit or enter campus using their approved gatepasses. It provides visibility into student movements and alerts for overdue returns.

## System Requirements

### Student Application Process
- **Purpose**: Students can apply to leave campus for personal or emergency reasons
- **Required Fields**: 
  - OUT date/time (when they plan to leave)
  - IN date/time (when they plan to return)
  - Reason for leaving

### Validation Rules
1. **OUT time must not be in the past** - Prevents requesting gatepasses for past times
2. **IN time must be greater than OUT time** - Ensures logical time sequence
3. **Student must return before IN time** - Enforces timely return

## Status States

### 1. INSIDE
- **Description**: Student is currently inside the campus
- **Color**: Green (emerald)
- **Icon**: Home icon
- **When Set**: 
  - Initial state for all students
  - When student returns and is scanned by security

### 2. OUTSIDE
- **Description**: Student is currently outside the campus
- **Color**: Amber/Yellow
- **Icon**: LogOut icon
- **When Set**: When student exits campus and is scanned by security

### 3. OVERDUE
- **Description**: Student failed to return by the specified IN time
- **Color**: Red (rose)
- **Icon**: AlertTriangle icon
- **When Set**: Automatically when current time exceeds the approved IN time

## Database Schema

### StudentStatus Table
```sql
CREATE TABLE StudentStatus (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  status ENUM('INSIDE', 'OUTSIDE', 'OVERDUE') NOT NULL DEFAULT 'INSIDE',
  current_gatepass_id INT NULL,
  status_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES Students(id),
  FOREIGN KEY (current_gatepass_id) REFERENCES GatepassRequests(id),
  INDEX idx_student_status (student_id, status),
  INDEX idx_status_time (status, status_time)
);
```

## API Endpoints

### Get Current Status
```http
GET /api/student-status/current
Authorization: Bearer <token>
```

**Response:**
```json
{
  "status": "OUTSIDE",
  "current_gatepass_id": 123,
  "status_time": "2024-03-19T14:30:00.000Z",
  "reason": "Medical appointment",
  "out_time": "2024-03-19T13:00:00.000Z",
  "in_time": "2024-03-19T15:00:00.000Z"
}
```

## System Behavior Flow

### 1. Gate Pass Application
```
Student applies → Validation → Approval → Status remains INSIDE
```

### 2. Campus Exit
```
Security scans QR → Status changes to OUTSIDE → Start tracking
```

### 3. Campus Entry (On Time)
```
Security scans QR → Status changes to INSIDE → Complete tracking
```

### 4. Campus Entry (Late)
```
Security scans QR → Status changes to INSIDE → Late return notification sent
```

### 5. Overdue Detection
```
Scheduled check (every 5 minutes) → Status changes to OVERDUE → Notification sent
```

## Sample Code

### Backend Status Update Logic
```javascript
// Update student status when exiting campus
router.post('/gatepasses/:id/exit', requireAuth, requireRole('security'), async (req, res) => {
  const id = Number(req.params.id)
  
  // Log the exit
  await query('INSERT INTO Logs (gatepass_id, exit_time) VALUES (?, NOW())', [id])
  
  // Update student status to OUTSIDE
  const gatepass = await query('SELECT student_id FROM GatepassRequests WHERE id = ?', [id])
  if (gatepass.length > 0) {
    await updateStudentStatus(gatepass[0].student_id, 'OUTSIDE', id)
  }
  
  return res.json({ success: true })
})

// Update student status when entering campus
router.post('/gatepasses/:id/entry', requireAuth, requireRole('security'), async (req, res) => {
  const id = Number(req.params.id)
  
  // Log the entry
  await query('UPDATE Logs SET entry_time = NOW() WHERE gatepass_id = ?', [id])
  
  // Update student status to INSIDE
  const gatepass = await query('SELECT student_id FROM GatepassRequests WHERE id = ?', [id])
  if (gatepass.length > 0) {
    await updateStudentStatus(gatepass[0].student_id, 'INSIDE', null)
  }
  
  return res.json({ success: true })
})
```

### Overdue Detection Logic
```javascript
// Check for overdue students (runs every 5 minutes)
async function checkOverdueStudents() {
  const overdueStudents = await query(
    `SELECT ss.student_id, ss.current_gatepass_id, g.in_time as expected_return
     FROM StudentStatus ss
     JOIN GatepassRequests g ON g.id = ss.current_gatepass_id
     WHERE ss.status = 'OUTSIDE' 
     AND g.in_time < NOW()`
  )

  for (const student of overdueStudents) {
    await updateStudentStatus(student.student_id, 'OVERDUE', student.current_gatepass_id)
    // Send notification to admins
    await createNotification(student.student_id, student.current_gatepass_id, 'late_return', 
      `Student is overdue - expected back at ${student.expected_return}`)
  }
}
```

### Frontend Status Display
```javascript
const StatusCard = ({ status, currentGatepass }) => {
  const getStatusInfo = () => {
    switch (status) {
      case 'INSIDE':
        return {
          icon: <Home className="h-6 w-6" />,
          color: 'text-emerald-400',
          bgColor: 'bg-emerald-500/15 border-emerald-500/25',
          label: 'Inside Campus',
          description: 'You are currently inside the campus'
        }
      case 'OUTSIDE':
        return {
          icon: <LogOut className="h-6 w-6" />,
          color: 'text-amber-400',
          bgColor: 'bg-amber-500/15 border-amber-500/25',
          label: 'Outside Campus',
          description: currentGatepass ? `Left for: ${currentGatepass.reason}` : 'You are currently outside the campus'
        }
      case 'OVERDUE':
        return {
          icon: <AlertTriangle className="h-6 w-6" />,
          color: 'text-rose-400',
          bgColor: 'bg-rose-500/15 border-rose-500/25',
          label: 'Overdue',
          description: currentGatepass ? `Expected back at: ${new Date(currentGatepass.in_time).toLocaleString()}` : 'You are overdue to return'
        }
    }
  }

  return (
    <motion.div className={`rounded-3xl border p-6 ${statusInfo.bgColor}`}>
      <div className="flex items-center gap-4">
        <div className={statusInfo.color}>{statusInfo.icon}</div>
        <div className="flex-1">
          <div className="text-lg font-semibold">{statusInfo.label}</div>
          <div className="text-sm text-zinc-300">{statusInfo.description}</div>
        </div>
      </div>
    </motion.div>
  )
}
```

## Validation Examples

### Valid Request
```
Current Time: 2024-03-19 14:00
OUT Time: 2024-03-19 16:00
IN Time: 2024-03-19 20:00
Result: ✅ Valid - Status remains INSIDE until exit
```

### Invalid Request (Past Time)
```
Current Time: 2024-03-19 14:00
OUT Time: 2024-03-19 12:00
IN Time: 2024-03-19 16:00
Result: ❌ Error - "OUT time cannot be in the past"
```

### Invalid Request (Wrong Sequence)
```
OUT Time: 2024-03-19 16:00
IN Time: 2024-03-19 14:00
Result: ❌ Error - "IN time must be later than OUT time"
```

## Real-time Features

### Automatic Status Updates
- **Exit Detection**: Security scan triggers OUTSIDE status
- **Entry Detection**: Security scan triggers INSIDE status
- **Overdue Detection**: Scheduled check every 5 minutes

### Student Dashboard
- **Current Status Display**: Shows real-time status with color coding
- **Auto-refresh**: Updates every 30 seconds
- **Gatepass Details**: Shows current gatepass information when applicable

### Admin Notifications
- **Late Return Alerts**: Automatic notifications for overdue students
- **Status Changes**: Real-time updates for student movements

## Security Considerations

### Data Integrity
- **Double Validation**: Frontend and backend validation
- **Status Consistency**: Atomic status updates
- **Audit Trail**: Complete status history with timestamps

### Access Control
- **Role-based Access**: Only security can update status via QR scans
- **Student Access**: Students can only view their own status
- **Admin Oversight**: Admins can view all student statuses

## Performance Optimizations

### Database Indexing
- **Student Status Index**: Fast status lookups
- **Time-based Index**: Efficient overdue detection
- **Foreign Key Indexes**: Optimized joins

### Scheduled Tasks
- **Efficient Overdue Checks**: Only scans OUTSIDE students
- **Batch Processing**: Handles multiple overdue students
- **Error Handling**: Graceful failure recovery

## Future Enhancements

### Advanced Features
1. **Geofencing**: GPS-based automatic status detection
2. **Mobile App**: Push notifications for status changes
3. **Analytics**: Campus movement patterns and insights
4. **Integration**: Student information system integration

### Reporting
1. **Attendance Reports**: Automatic attendance based on status
2. **Movement Logs**: Detailed student movement history
3. **Compliance Reports**: Overdue and violation tracking

This comprehensive system ensures accurate student tracking while maintaining security and providing valuable insights for campus management.
