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

module.exports = { getPool, query }

