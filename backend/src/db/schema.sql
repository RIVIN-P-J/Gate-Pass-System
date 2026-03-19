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
  notification_type ENUM('late_return', 'monthly_limit_exceeded', 'unusual_activity') NOT NULL,
  message TEXT NOT NULL,
  notification_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_read BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (admin_id) REFERENCES Users(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES Students(id) ON DELETE CASCADE,
  FOREIGN KEY (gatepass_id) REFERENCES GatepassRequests(id) ON DELETE CASCADE,
  INDEX idx_admin_unread (admin_id, is_read, notification_time),
  INDEX idx_student_notifications (student_id, notification_time)
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
