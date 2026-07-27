const express = require('express');
const cors = require('cors');
const { pool, initDb } = require('./db');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Database
initDb();

// --- LOGIC TỐI GIẢN NỢ ---
function minimizeTransactions(transactions, users) {
  const balances = {};
  users.forEach(user => balances[user.id] = 0);

  for (const t of transactions) {
    balances[t.payer_id] -= parseFloat(t.amount);
    balances[t.payee_id] += parseFloat(t.amount);
  }

  const debtors = [];
  const creditors = [];

  for (const user of users) {
    if (balances[user.id] < 0) {
      debtors.push({ ...user, amount: -balances[user.id] });
    } else if (balances[user.id] > 0) {
      creditors.push({ ...user, amount: balances[user.id] });
    }
  }

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const simplifiedTransactions = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const settleAmount = Math.min(debtor.amount, creditor.amount);

    simplifiedTransactions.push({
      from: { id: debtor.id, name: debtor.name },
      to: { id: creditor.id, name: creditor.name },
      amount: settleAmount
    });

    debtor.amount -= settleAmount;
    creditor.amount -= settleAmount;

    if (debtor.amount < 0.01) i++; // Floating point safety
    if (creditor.amount < 0.01) j++;
  }

  return simplifiedTransactions;
}

// --- API ENDPOINTS ---

// 1. Lấy danh sách users
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Thêm user mới
app.post('/api/users', async (req, res) => {
  try {
    const { name, created_by_passcode } = req.body;
    const [result] = await pool.query('INSERT INTO users (name, created_by_passcode) VALUES (?, ?)', [name, created_by_passcode]);
    res.status(201).json({ id: result.insertId, name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Lấy danh sách giao dịch gốc
app.get('/api/transactions', async (req, res) => {
  try {
    const query = `
      SELECT t.*, 
             u1.name as payer_name, 
             u2.name as payee_name 
      FROM transactions t
      JOIN users u1 ON t.payer_id = u1.id
      JOIN users u2 ON t.payee_id = u2.id
      ORDER BY t.created_at DESC
    `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Thêm giao dịch nợ (payer nợ payee)
app.post('/api/transactions', async (req, res) => {
  try {
    const { payer_ids, payee_id, amount, description, created_by_passcode } = req.body;
    
    if (!Array.isArray(payer_ids) || payer_ids.length === 0) {
      return res.status(400).json({ error: "payer_ids must be a non-empty array" });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      for (const payer_id of payer_ids) {
        await connection.query(
          'INSERT INTO transactions (payer_id, payee_id, amount, description, created_by_passcode) VALUES (?, ?, ?, ?, ?)',
          [payer_id, payee_id, amount, description, created_by_passcode]
        );
      }
      
      await connection.commit();
      res.status(201).json({ success: true, message: `Created ${payer_ids.length} transactions` });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Tính toán và lấy danh sách cấn trừ
app.get('/api/balances', async (req, res) => {
  try {
    const [users] = await pool.query('SELECT * FROM users');
    const [transactions] = await pool.query('SELECT * FROM transactions');
    
    // Tổng hợp số dư của từng người
    const userBalances = users.map(user => {
      let balance = 0;
      transactions.forEach(t => {
        if (t.payer_id === user.id) balance -= parseFloat(t.amount); // Nợ người khác -> Giảm balance
        if (t.payee_id === user.id) balance += parseFloat(t.amount); // Người khác nợ -> Tăng balance
      });
      return { ...user, balance };
    });

    const simplifiedTransactions = minimizeTransactions(transactions, users);
    
    res.json({
      userBalances,
      simplifiedTransactions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- API QUẢN LÝ QUỸ ---

// 6. Lấy danh sách thu chi theo quỹ
app.get('/api/funds', async (req, res) => {
  try {
    const { type } = req.query; // 'general' or 'private'
    if (!type) {
      return res.status(400).json({ error: "Missing fund type" });
    }
    const query = `
      SELECT * FROM fund_transactions
      WHERE fund_type = ?
      ORDER BY transaction_date ASC, created_at ASC
    `;
    const [rows] = await pool.query(query, [type]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Thêm giao dịch thu chi quỹ
app.post('/api/funds', async (req, res) => {
  try {
    const { fund_type, transaction_date, description, income, expense, spender, notes, is_refunded, created_by_passcode } = req.body;
    
    if (!fund_type || !transaction_date || !description) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const query = `
      INSERT INTO fund_transactions 
      (fund_type, transaction_date, description, income, expense, spender, notes, is_refunded, created_by_passcode) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await pool.query(query, [
      fund_type, 
      transaction_date, 
      description, 
      income || 0, 
      expense || 0, 
      spender || null, 
      notes || null,
      is_refunded ? 1 : 0,
      created_by_passcode || null
    ]);
    
    res.status(201).json({ id: result.insertId, message: "Created successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7.5. Cập nhật trạng thái hoàn trả
app.patch('/api/funds/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_refunded } = req.body;
    await pool.query('UPDATE fund_transactions SET is_refunded = ? WHERE id = ?', [is_refunded ? 1 : 0, id]);
    res.json({ success: true, message: "Updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Xóa giao dịch quỹ
app.delete('/api/funds/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM fund_transactions WHERE id = ?', [id]);
    res.json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
