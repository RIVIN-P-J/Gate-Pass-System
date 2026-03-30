CREATE DATABASE IF NOT EXISTS gatepass_db;
USE gatepass_db;

CREATE TABLE IF NOT EXISTS Users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('student','admin','security') NOT NULL DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  register_number VARCHAR(64) NOT NULL UNIQUE,
  department VARCHAR(120) NOT NULL,
  year INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS GatepassRequests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  reason TEXT NOT NULL,
  gatepass_type ENUM('standard','emergency') NOT NULL DEFAULT 'standard',
  emergency_category ENUM('medical','family','other') DEFAULT NULL,
  expected_duration_minutes INT DEFAULT NULL,
  priority ENUM('standard','high') NOT NULL DEFAULT 'standard',
  auto_approved BOOLEAN NOT NULL DEFAULT FALSE,
  out_time DATETIME NOT NULL,
  in_time DATETIME NOT NULL,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES Students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  gatepass_id INT NOT NULL,
  exit_time DATETIME NULL,
  entry_time DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (gatepass_id) REFERENCES GatepassRequests(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS AdminSettings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(80) NOT NULL UNIQUE,
  setting_value INT NOT NULL
);

INSERT IGNORE INTO AdminSettings (setting_key, setting_value) VALUES
  ('late_return_grace_minutes', 15),
  ('monthly_pass_limit', 5);

CREATE TABLE IF NOT EXISTS AdminNotifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  student_id INT NOT NULL,
  gatepass_id INT NULL,
  notification_type ENUM('late_return', 'monthly_limit_exceeded', 'unusual_activity', 'emergency_request') NOT NULL,
  message TEXT NOT NULL,
  notification_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_read BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (admin_id) REFERENCES Users(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES Students(id) ON DELETE CASCADE,
  FOREIGN KEY (gatepass_id) REFERENCES GatepassRequests(id) ON DELETE CASCADE,
  INDEX idx_admin_unread (admin_id, is_read, notification_time),
  INDEX idx_student_notifications (student_id, notification_time)
);

CREATE TABLE IF NOT EXISTS EmergencyRequestAudits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  gatepass_id INT NOT NULL,
  student_id INT NOT NULL,
  event_type ENUM('created','auto_approved','notification_sent','limit_checked','manual_review') NOT NULL,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (gatepass_id) REFERENCES GatepassRequests(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES Students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS StudentMonthlyCounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  month_year VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  pass_count INT NOT NULL DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES Students(id) ON DELETE CASCADE,
  UNIQUE KEY unique_student_month (student_id, month_year)
);

CREATE TABLE IF NOT EXISTS StudentStatus (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  status ENUM('INSIDE', 'OUTSIDE', 'OVERDUE') NOT NULL DEFAULT 'INSIDE',
  current_gatepass_id INT NULL,
  status_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES Students(id) ON DELETE CASCADE,
  FOREIGN KEY (current_gatepass_id) REFERENCES GatepassRequests(id) ON DELETE SET NULL,
  INDEX idx_student_status (student_id, status),
  INDEX idx_status_time (status, status_time)
);

CREATE TABLE IF NOT EXISTS ParentContacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  contact_type ENUM('sms', 'email') NOT NULL,
  contact_value VARCHAR(255) NOT NULL,
  contact_name VARCHAR(120) NOT NULL,
  relationship VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  preferred_method ENUM('sms', 'email', 'both') DEFAULT 'both',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES Students(id) ON DELETE CASCADE,
  INDEX idx_student_contacts (student_id, is_active),
  INDEX idx_contact_type (contact_type)
);

CREATE TABLE IF NOT EXISTS ParentNotificationLogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  action ENUM('exit', 'entry') NOT NULL,
  notification_results JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES Students(id) ON DELETE CASCADE,
  INDEX idx_student_notifications (student_id, created_at),
  INDEX idx_action (action, created_at)
);

-- Sample parent contacts (for testing)
INSERT IGNORE INTO ParentContacts (student_id, contact_type, contact_value, contact_name, relationship) VALUES
(1, 'sms', '+1234567890', 'John Doe', 'Father'),
(1, 'email', 'john.doe@example.com', 'John Doe', 'Father'),
(2, 'sms', '+0987654321', 'Jane Smith', 'Mother'),
(2, 'email', 'jane.smith@example.com', 'Jane Smith', 'Mother');
