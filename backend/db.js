const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Hàm khởi tạo database
async function initDb() {
  try {
    // Tạo connection riêng để tạo database nếu chưa có
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
    await connection.end();

    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        created_by_passcode VARCHAR(20)
      )
    `;

    const createTransactionsTable = `
      CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        payer_id INT NOT NULL,
        payee_id INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        description VARCHAR(255),
        created_by_passcode VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (payer_id) REFERENCES users(id),
        FOREIGN KEY (payee_id) REFERENCES users(id)
      )
    `;

    const createFundTransactionsTable = `
      CREATE TABLE IF NOT EXISTS fund_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        fund_type VARCHAR(20) NOT NULL,
        transaction_date DATE NOT NULL,
        description VARCHAR(255) NOT NULL,
        income DECIMAL(12, 2) DEFAULT 0,
        expense DECIMAL(12, 2) DEFAULT 0,
        spender VARCHAR(255),
        notes VARCHAR(255),
        is_refunded BOOLEAN DEFAULT FALSE,
        created_by_passcode VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await pool.query(createUsersTable);
    await pool.query(createTransactionsTable);
    await pool.query(createFundTransactionsTable);

    // Add columns if tables already exist
    try { await pool.query("ALTER TABLE users ADD COLUMN created_by_passcode VARCHAR(20)"); } catch (e) {}
    try { await pool.query("ALTER TABLE transactions ADD COLUMN created_by_passcode VARCHAR(20)"); } catch (e) {}
    try { await pool.query("ALTER TABLE fund_transactions ADD COLUMN created_by_passcode VARCHAR(20)"); } catch (e) {}

    console.log("Database and tables initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

module.exports = { pool, initDb };
