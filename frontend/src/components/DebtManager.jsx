import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, CreditCard, ArrowRight, Plus, Activity, ChevronDown, ChevronRight } from 'lucide-react';

const API_URL = '/api';

export default function DebtManager() {
  const [users, setUsers] = useState([]);
  const [balances, setBalances] = useState([]);
  const [simplified, setSimplified] = useState([]);
  const [history, setHistory] = useState([]);
  const [newUserName, setNewUserName] = useState('');
  const [expandedWeeks, setExpandedWeeks] = useState({});

  const handleClearDebt = async (t) => {
    if (!window.confirm(`Xác nhận xóa nợ: ${t.from.name} trả ${formatMoney(t.amount)} cho ${t.to.name}?`)) return;
    try {
      await axios.post(`${API_URL}/transactions`, {
        payer_ids: [t.to.id],
        payee_id: t.from.id,
        amount: t.amount,
        description: 'Xóa nợ',
        created_by_passcode: localStorage.getItem('auth_passcode_value')
      });
      fetchData();
    } catch (error) {
      console.error('Error clearing debt:', error);
    }
  };

  const getWeekKey = (dateString) => {
    const d = new Date(dateString);
    const day = d.getDay() || 7;
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - day + 1);
    const monday = new Date(d);
    d.setDate(d.getDate() + 6);
    const sunday = new Date(d);
    return `Từ ${monday.toLocaleDateString('vi-VN')} đến ${sunday.toLocaleDateString('vi-VN')}`;
  };

  const groupedHistory = history.reduce((acc, t) => {
    const key = getWeekKey(t.created_at);
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  const toggleWeek = (weekKey) => {
    setExpandedWeeks(prev => ({ ...prev, [weekKey]: !prev[weekKey] }));
  };

  const [transaction, setTransaction] = useState({
    payer_ids: [],
    payee_id: '',
    amount: '',
    description: ''
  });

  const fetchData = async () => {
    try {
      const usersRes = await axios.get(`${API_URL}/users`);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      const balancesRes = await axios.get(`${API_URL}/balances`);
      setBalances(Array.isArray(balancesRes.data.userBalances) ? balancesRes.data.userBalances : []);
      setSimplified(Array.isArray(balancesRes.data.simplifiedTransactions) ? balancesRes.data.simplifiedTransactions : []);
      const historyRes = await axios.get(`${API_URL}/transactions`);
      setHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    try {
      await axios.post(`${API_URL}/users`, { name: newUserName, created_by_passcode: localStorage.getItem('auth_passcode_value') });
      setNewUserName('');
      fetchData();
    } catch (error) { console.error('Error adding user:', error); }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (transaction.payer_ids.length === 0 || !transaction.payee_id || !transaction.amount) return;
    if (transaction.payer_ids.map(String).includes(String(transaction.payee_id))) {
      alert('Người nợ và người nhận không thể là cùng một người!');
      return;
    }
    try {
      await axios.post(`${API_URL}/transactions`, { ...transaction, created_by_passcode: localStorage.getItem('auth_passcode_value') });
      setTransaction({ payer_ids: [], payee_id: '', amount: '', description: '' });
      fetchData();
    } catch (error) { console.error('Error adding transaction:', error); }
  };

  const formatMoney = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  return (
    <div className="card" style={{ maxWidth: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: 0, borderBottom: 'none' }}>Quản lý Nợ</h2>
      </div>

      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        <div className="debt-section-box">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            <Users size={18} /> Thành viên & Số dư
          </h3>
          <form onSubmit={handleAddUser} className="form-group" style={{ marginBottom: '1rem' }}>
            <div className="input-container">
              <label>Tên người dùng</label>
              <input type="text" placeholder="Nhập tên..." value={newUserName} onChange={(e) => setNewUserName(e.target.value)} />
            </div>
            <button type="submit"><Plus size={18} /> Thêm</button>
          </form>
          <div className="list-container">
            {balances.map(user => (
              <div key={user.id} className="list-item">
                <div className="user-info"><span className="user-name">{user.name}</span></div>
                <span className={`balance ${user.balance > 0 ? 'positive' : user.balance < 0 ? 'negative' : 'neutral'}`}>
                  {user.balance > 0 ? '+' : ''}{formatMoney(user.balance)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="debt-section-box">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            <CreditCard size={18} /> Ghi nợ mới
          </h3>
          <form onSubmit={handleAddTransaction}>
            <div className="form-group">
              <div className="input-container">
                <label>Ai cho mượn? (Chủ nợ)</label>
                <select value={transaction.payee_id} onChange={(e) => { const newPayeeId = e.target.value; setTransaction({ ...transaction, payee_id: newPayeeId, payer_ids: transaction.payer_ids.filter(id => String(id) !== String(newPayeeId)) }); }}>
                  <option value="">Chọn chủ nợ</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="input-container">
                <label>Ai nợ? (Chọn nhiều người)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(255,255,255,0.9)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  {users.filter(u => String(u.id) !== String(transaction.payee_id)).map(u => (
                    <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: '500' }}>
                      <input type="checkbox" style={{ width: 'auto', margin: 0, cursor: 'pointer' }} checked={transaction.payer_ids.includes(u.id)} onChange={(e) => { const newIds = e.target.checked ? [...transaction.payer_ids, u.id] : transaction.payer_ids.filter(id => id !== u.id); setTransaction({ ...transaction, payer_ids: newIds }); }} />
                      {u.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="form-group">
              <div className="input-container">
                <label>Số tiền (Nghìn Đồng)</label>
                <input type="number" placeholder="Ví dụ: 50000" value={transaction.amount} onChange={(e) => setTransaction({ ...transaction, amount: e.target.value })} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <div className="input-container">
                <label>Ghi chú (Tùy chọn)</label>
                <input type="text" placeholder="Ví dụ: Ăn trưa..." value={transaction.description} onChange={(e) => setTransaction({ ...transaction, description: e.target.value })} />
              </div>
              <button type="submit" style={{ minWidth: '100px' }}>Ghi lại</button>
            </div>
          </form>
        </div>
      </div>

      <div className="debt-inner-card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
          <Activity size={18} /> Phương án thanh toán tối ưu
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Hệ thống tự động cấn trừ vòng nợ, giúp giảm thiểu số lượt chuyển khoản giữa mọi người.
        </p>
        {simplified.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem 0' }}>
            Không có khoản nợ nào cần thanh toán. Mọi người đều hòa! 🎉
          </p>
        ) : (
          <div className="list-container">
            {simplified.map((t, idx) => (
              <div key={idx} className="list-item transaction-card">
                <div style={{ flex: 1, textAlign: 'right', fontWeight: '600' }}>{t.from.name}</div>
                <div className="transaction-arrow"><ArrowRight size={20} /></div>
                <div style={{ flex: 1, fontWeight: '600' }}>{t.to.name}</div>
                <div style={{ flex: 1, textAlign: 'right' }} className="balance negative">{formatMoney(t.amount)}</div>
                <button
                  onClick={() => handleClearDebt(t)}
                  style={{ marginLeft: '1rem', padding: '0.5rem 1rem', background: 'var(--success)', height: 'auto', minWidth: 'unset', fontSize: '0.85rem' }}
                >
                  Xóa nợ
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="debt-inner-card">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
          <Activity size={18} /> Lịch sử ghi nợ
        </h3>
        <div className="fund-table-container">
          {Object.keys(groupedHistory).length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Chưa có giao dịch nào.</p>
          ) : (
            Object.keys(groupedHistory).map(week => (
              <div key={week} style={{ marginBottom: '1rem', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                <div 
                  onClick={() => toggleWeek(week)}
                  style={{ background: 'rgba(255,255,255,0.7)', padding: '0.75rem 1rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, color: 'var(--text-primary)' }}
                >
                  <span>Tuần: {week} ({groupedHistory[week].length} giao dịch)</span>
                  {expandedWeeks[week] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
                {expandedWeeks[week] && (
                  <table className="fund-table" style={{ margin: 0, width: '100%' }}>
                    <thead>
                      <tr>
                        <th>Người nợ</th>
                        <th></th>
                        <th>Chủ nợ</th>
                        <th className="money">Số tiền</th>
                        <th>Ghi chú</th>
                        <th>Thời gian</th>
                        <th>Tạo bởi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedHistory[week].map(t => (
                        <tr key={t.id}>
                          <td style={{ fontWeight: 600 }}>{t.payer_name}</td>
                          <td style={{ color: 'var(--accent)', textAlign: 'center' }}><ArrowRight size={14} /></td>
                          <td style={{ fontWeight: 600 }}>{t.payee_name}</td>
                          <td className="money" style={{ color: 'var(--danger)', fontWeight: 600 }}>{formatMoney(t.amount)}</td>
                          <td>{t.description || '-'}</td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{new Date(t.created_at).toLocaleString('vi-VN')}</td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t.created_by_passcode || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}