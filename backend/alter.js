const mysql = require('mysql2/promise');
require('dotenv').config();

async function alterTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    await connection.query('ALTER TABLE fund_transactions CHANGE partner spender VARCHAR(255)');
    console.log('Renamed partner to spender');
  } catch (e) {
    console.log('Error or already renamed:', e.message);
  }

  try {
    await connection.query('ALTER TABLE fund_transactions ADD COLUMN is_refunded BOOLEAN DEFAULT FALSE');
    console.log('Added is_refunded column');
  } catch (e) {
    console.log('Error or already added:', e.message);
  }

  await connection.end();
}

alterTable();
