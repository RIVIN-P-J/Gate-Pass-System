# QR Code Single Use Policy

## Overview
This document explains the implementation of the "one QR code for one entry and one exit" policy, ensuring that each gatepass QR code can only be used once for exit and once for entry.

## Policy Rules

### **1. One Exit Per QR Code**
- Each approved gatepass QR code can be used **exactly once** for exit
- After successful exit, the same QR code cannot be used for exit again
- Prevents multiple exit scans of the same gatepass

### **2. One Entry Per QR Code**
- Each approved gatepass QR code can be used **exactly once** for entry
- After successful entry, the same QR code cannot be used for entry again
- Ensures proper completion of the exit→entry cycle

### **3. Proper Sequence Enforcement**
- **Exit must come before entry**: Cannot mark entry without first marking exit
- **Sequential validation**: System enforces the correct order of operations
- **Cycle completion**: Once both exit and entry are recorded, gatepass is fully used

## Technical Implementation

### **Backend Validation**

#### **Exit Validation**
```javascript
// Check if already exited
if (existing.length > 0 && existing[0].exit_time) {
  return res.status(400).json({ 
    message: 'This QR code has already been used for exit. Each gatepass allows only one exit.',
    code: 'ALREADY_EXITED'
  })
}

// Check if cycle already completed
if (existing.length > 0 && existing[0].entry_time) {
  return res.status(400).json({ 
    message: 'This gatepass cycle is already completed. Student has both exited and entered.',
    code: 'CYCLE_COMPLETED'
  })
}
```

#### **Entry Validation**
```javascript
// Must exit before entering
if (!existing.length) {
  return res.status(400).json({ 
    message: 'Student must exit before entering. No exit record found for this gatepass.',
    code: 'NO_EXIT_RECORD'
  })
}

// Cannot enter without exit
if (!existing[0].exit_time) {
  return res.status(400).json({ 
    message: 'Student has not exited yet. Cannot mark entry without exit.',
    code: 'NO_EXIT_TIME'
  })
}

// Already entered
if (existing[0].entry_time) {
  return res.status(400).json({ 
    message: 'This QR code has already been used for entry. Each gatepass allows only one entry.',
    code: 'ALREADY_ENTERED'
  })
}
```

### **Database Schema**

#### **Logs Table Structure**
```sql
CREATE TABLE Logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  gatepass_id INT NOT NULL,
  exit_time DATETIME NULL,        -- NULL until exit is recorded
  entry_time DATETIME NULL,       -- NULL until entry is recorded
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **Status Tracking**
- **No Records**: QR code not used yet
- **exit_time only**: Student has exited, waiting for entry
- **both exit_time & entry_time**: Cycle completed

### **Error Codes and Messages**

| Error Code | Message | When Triggered |
|------------|---------|----------------|
| `ALREADY_EXITED` | "This QR code has already been used for exit. Each gatepass allows only one exit." | Trying to exit again |
| `CYCLE_COMPLETED` | "This gatepass cycle is already completed. Student has both exited and entered." | Trying to use completed gatepass |
| `ALREADY_ENTERED` | "This QR code has already been used for entry. Each gatepass allows only one entry." | Trying to enter again |
| `NO_EXIT_RECORD` | "Student must exit before entering. No exit record found for this gatepass." | Entry without exit record |
| `NO_EXIT_TIME` | "Student has not exited yet. Cannot mark entry without exit." | Entry without exit time |

## User Experience

### **Security Personnel Workflow**

#### **First Exit**
1. Scan QR code → ✅ Exit recorded
2. Status: QR code used for exit, ready for entry

#### **Attempt Second Exit**
1. Scan same QR code → ❌ Error: "Already used for exit"
2. Action: Use different gatepass or inform student

#### **Entry After Exit**
1. Scan same QR code → ✅ Entry recorded
2. Status: Gatepass cycle completed

#### **Attempt Second Entry**
1. Scan same QR code → ❌ Error: "Already used for entry"
2. Action: Gatepass fully used, new gatepass required

### **Student Experience**

#### **Normal Flow**
1. **Apply for gatepass** → Get approved QR code
2. **Exit campus** → Security scans QR code (first use)
3. **Return to campus** → Security scans same QR code (second use)
4. **Gatepass completed** → Need new gatepass for next outing

#### **Error Scenarios**
- **Multiple exit attempts**: Security will see error message
- **Entry without exit**: Security prevented from marking entry
- **Reuse attempt**: Clear error about gatepass being fully used

## API Endpoints

### **Exit Endpoint**
```
POST /api/security/gatepasses/:id/exit
```

**Response Examples:**
- **Success**: `{ gatepass: { id, reason, out_time, in_time, status } }`
- **Error**: `{ message: "This QR code has already been used for exit", code: "ALREADY_EXITED" }`

### **Entry Endpoint**
```
POST /api/security/gatepasses/:id/entry
```

**Response Examples:**
- **Success**: `{ gatepass: { id, reason, out_time, in_time, status } }`
- **Error**: `{ message: "Student must exit before entering", code: "NO_EXIT_RECORD" }`

### **Status Check Endpoint**
```
GET /api/security/gatepasses/:id/log-status
```

**Response Examples:**
```json
{
  "canExit": true,
  "canEnter": false,
  "status": "not_used",
  "message": "QR code not used yet - ready for first exit"
}
```

## Frontend Integration

### **Error Handling**
```javascript
async function mark(action) {
  try {
    const { data } = await api.post(`/security/gatepasses/${result.gatepass.id}/${action}`)
    toast.success(`${action} recorded successfully`)
  } catch (err) {
    const errorData = err?.response?.data
    let errorMessage = errorData?.message || 'Failed to update log'
    
    // Handle specific error codes
    if (errorData?.code === 'ALREADY_EXITED') {
      errorMessage = 'This QR code has already been used for exit.'
    }
    
    toast.error(errorMessage)
  }
}
```

### **Status Display**
- **Not Used**: Green indicator, "Ready for exit"
- **Exited**: Amber indicator, "Ready for entry"  
- **Completed**: Red indicator, "Fully used"

## Security Benefits

### **1. Prevents Fraud**
- Cannot reuse same QR code multiple times
- Ensures each gatepass represents a single outing
- Prevents unauthorized multiple exits

### **2. Maintains Audit Trail**
- Clear record of when each QR code was used
- Timestamps for exit and entry
- Complete cycle tracking

### **3. Enforces Compliance**
- Students must follow proper exit→entry sequence
- Prevents bypassing security procedures
- Ensures accountability

## Testing Scenarios

### **Valid Scenarios**
1. **Normal Flow**: Exit → Entry ✅
2. **New Gatepass**: Fresh QR code for new outing ✅

### **Invalid Scenarios**
1. **Double Exit**: Exit → Exit ❌
2. **Entry Without Exit**: Entry ❌
3. **Double Entry**: Exit → Entry → Entry ❌
4. **Completed Gatepass Reuse**: Exit → Entry → Exit ❌

### **Edge Cases**
1. **Invalid Gatepass ID**: 404 error ❌
2. **Unapproved Gatepass**: 400 error ❌
3. **Database Errors**: 500 error ❌

## Monitoring and Analytics

### **Usage Tracking**
- Track how many QR codes are completed vs abandoned
- Monitor time between exit and entry
- Identify patterns of misuse

### **Security Metrics**
- Failed scan attempts
- Error code frequencies
- Peak usage times

## Future Enhancements

### **Potential Improvements**
1. **Time-based Expiration**: QR codes expire after certain time
2. **Geofencing**: QR codes only work at specific locations
3. **Multi-factor**: Additional verification for high-risk scenarios
4. **Batch Operations**: Handle multiple students simultaneously

### **Reporting**
1. **Usage Reports**: Daily/weekly gatepass usage statistics
2. **Compliance Reports**: Adherence to exit→entry protocol
3. **Security Reports**: Failed scan attempts and patterns

This single-use QR policy ensures security, maintains accurate records, and prevents misuse while providing clear feedback to both security personnel and students.
