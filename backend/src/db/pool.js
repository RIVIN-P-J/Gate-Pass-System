const mysql = require('mysql2/promise')

let pool

function getPool() {
  if (pool) return pool

  pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT || 3306),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: 'Z',
  })

  return pool
}

async function query(sql, params = []) {
  const [rows] = await getPool().execute(sql, params)
  return rows
}

async function ensureEmergencySchema() {
  const pool = getPool()

  const emergencyColumns = [
    {
      name: 'gatepass_type',
      definition: "gatepass_type ENUM('standard','emergency') NOT NULL DEFAULT 'standard'"
    },
    {
      name: 'emergency_category',
      definition: "emergency_category ENUM('medical','family','other') DEFAULT NULL"
    },
    {
      name: 'expected_duration_minutes',
      definition: 'expected_duration_minutes INT DEFAULT NULL'
    },
    {
      name: 'priority',
      definition: "priority ENUM('standard','high') NOT NULL DEFAULT 'standard'"
    },
    {
      name: 'auto_approved',
      definition: 'auto_approved BOOLEAN NOT NULL DEFAULT FALSE'
    }
  ]

  for (const column of emergencyColumns) {
    const [rows] = await pool.query('SHOW COLUMNS FROM GatepassRequests LIKE ?', [column.name])
    if (!rows.length) {
      await pool.query(`ALTER TABLE GatepassRequests ADD COLUMN ${column.definition}`)
    }
  }

  const [tables] = await pool.query("SHOW TABLES LIKE 'EmergencyRequestAudits'")
  if (!tables.length) {
    await pool.query(
      `CREATE TABLE EmergencyRequestAudits (
        id INT AUTO_INCREMENT PRIMARY KEY,
        gatepass_id INT NOT NULL,
        student_id INT NOT NULL,
        event_type ENUM('created','auto_approved','notification_sent','limit_checked','manual_review') NOT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (gatepass_id) REFERENCES GatepassRequests(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES Students(id) ON DELETE CASCADE
      )`
    )
  }
}

module.exports = { getPool, query, ensureEmergencySchema }

