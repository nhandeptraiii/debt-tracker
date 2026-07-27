import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, CreditCard, ArrowRight, Wallet, Plus, Activity, RefreshCw, Building2, Lock } from 'lucide-react';
import './index.css';
import FundManager from './components/FundManager';

const API_URL = '/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('auth_passcode') === 'true';
  });
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');
  const validPasscodes = ['486508', '486496', '487754', '270989'];

  const [users, setUsers] = useState([]);
  const [balances, setBalances] = useState([]);
  const [simplified, setSimplified] = useState([]);
  const [newUserName, setNewUserName] = useState('');

  const [activeTab, setActiveTab] = useState('debts'); // 'debts', 'general', 'private'
  const [history, setHistory] = useState([]);

  const [transaction, setTransaction] = useState({
    payer_ids: [],
    payee_id: '',
    amount: '',
    description: ''
  });

  const fetchData = async () => {
    try {
      const usersRes = await axios.get(`${API_URL}/users`);
      setUsers(usersRes.data);

      const balancesRes = await axios.get(`${API_URL}/balances`);
      setBalances(balancesRes.data.userBalances);
      setSimplified(balancesRes.data.simplifiedTransactions);

      const historyRes = await axios.get(`${API_URL}/transactions`);
      setHistory(historyRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    try {
      await axios.post(`${API_URL}/users`, { name: newUserName, created_by_passcode: localStorage.getItem('auth_passcode_value') });
      setNewUserName('');
      fetchData();
    } catch (error) {
      console.error("Error adding user:", error);
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (transaction.payer_ids.length === 0 || !transaction.payee_id || !transaction.amount) return;

    // Convert payee_id to number to compare with payer_ids (which might be strings from the checkbox value, actually they are IDs from users array, which are numbers)
    // To be safe, compare as strings.
    if (transaction.payer_ids.map(String).includes(String(transaction.payee_id))) {
      alert("Người nợ và người nhận không thể là cùng một người!");
      return;
    }
    try {
      await axios.post(`${API_URL}/transactions`, { ...transaction, created_by_passcode: localStorage.getItem('auth_passcode_value') });
      setTransaction({ payer_ids: [], payee_id: '', amount: '', description: '' });
      fetchData();
    } catch (error) {
      console.error("Error adding transaction:", error);
    }
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (validPasscodes.includes(passcode)) {
      setIsAuthenticated(true);
      localStorage.setItem('auth_passcode_value', passcode);
      localStorage.setItem('auth_passcode', 'true');
      setAuthError('');
    } else {
      setAuthError('Mật mã không đúng!');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', margin: '0 auto' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><Lock size={24} /> Xác thực truy cập</h2>
          <p className="subtitle" style={{ marginBottom: '1.5rem' }}>Vui lòng nhập mật mã để tiếp tục</p>
          <form onSubmit={handleLogin}>
            <div className="input-container" style={{ marginBottom: '1rem' }}>
              <input 
                type="password" 
                placeholder="Nhập mật mã 6 số" 
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                maxLength={6}
                style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '2px' }}
                autoFocus
              />
            </div>
            {authError && <p style={{ color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.9rem' }}>{authError}</p>}
            <button type="submit" style={{ width: '100%' }}>Xác nhận</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header>
        <h1><Wallet className="inline-block mr-2 mb-1" size={36} /> Debt & Fund Tracker</h1>
        <p className="subtitle">Hệ thống quản lý nợ thông minh & cấn trừ tự động</p>
      </header>

      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'debts' ? 'active' : ''}`}
          onClick={() => setActiveTab('debts')}
        >
          <RefreshCw className="inline-block mr-2" size={18} style={{ verticalAlign: 'middle' }} />
          Quản lý Nợ
        </button>
        <button
          className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          <Building2 className="inline-block mr-2" size={18} style={{ verticalAlign: 'middle' }} />
          Quỹ Chung Phòng
        </button>
        <button
          className={`tab-btn ${activeTab === 'private' ? 'active' : ''}`}
          onClick={() => setActiveTab('private')}
        >
          <Lock className="inline-block mr-2" size={18} style={{ verticalAlign: 'middle' }} />
          Quỹ Riêng KHDN
        </button>
      </div>

      {activeTab === 'debts' && (
        <>
          <div className="grid-2">
            <div className="card">
              <h2><Users size={20} /> Thêm người dùng</h2>
              <form onSubmit={handleAddUser} className="form-group">
                <div className="input-container">
                  <label>Tên người dùng</label>
                  <input
                    type="text"
                    placeholder="Nhập tên..."
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                  />
                </div>
                <button type="submit"><Plus size={18} /> Thêm</button>
              </form>

              <div className="list-container mt-4" style={{ marginTop: '1rem' }}>
                {balances.map(user => (
                  <div key={user.id} className="list-item">
                    <div className="user-info">
                      <span className="user-name">{user.name}</span>
                    </div>
                    <span className={`balance ${user.balance > 0 ? 'positive' : user.balance < 0 ? 'negative' : 'neutral'}`}>
                      {user.balance > 0 ? '+' : ''}{formatMoney(user.balance)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h2><CreditCard size={20} /> Ghi nợ mới</h2>
              <form onSubmit={handleAddTransaction}>
                <div className="form-group">
                  <div className="input-container">
                    <label>Ai cho mượn? (Chủ nợ)</label>
                    <select
                      value={transaction.payee_id}
                      onChange={(e) => {
                        const newPayeeId = e.target.value;
                        setTransaction({ 
                          ...transaction, 
                          payee_id: newPayeeId,
                          payer_ids: transaction.payer_ids.filter(id => String(id) !== String(newPayeeId))
                        });
                      }}
                    >
                      <option value="">Chọn chủ nợ</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                  <div className="input-container">
                    <label>Ai nợ? (Chọn nhiều người)</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.9)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      {users.filter(u => String(u.id) !== String(transaction.payee_id)).map(u => (
                        <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: '500' }}>
                          <input
                            type="checkbox"
                            style={{ width: 'auto', margin: 0, cursor: 'pointer' }}
                            checked={transaction.payer_ids.includes(u.id)}
                            onChange={(e) => {
                              const newIds = e.target.checked
                                ? [...transaction.payer_ids, u.id]
                                : transaction.payer_ids.filter(id => id !== u.id);
                              setTransaction({ ...transaction, payer_ids: newIds });
                            }}
                          />
                          {u.name}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <div className="input-container">
                    <label>Số tiền (Nghìn Đồng)</label>
                    <input
                      type="number"
                      placeholder="Ví dụ: 50000"
                      value={transaction.amount}
                      onChange={(e) => setTransaction({ ...transaction, amount: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div className="input-container">
                    <label>Ghi chú (Tùy chọn)</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Ăn trưa..."
                      value={transaction.description}
                      onChange={(e) => setTransaction({ ...transaction, description: e.target.value })}
                    />
                  </div>
                  <button type="submit" style={{ minWidth: '100px' }}>Ghi lại</button>
                </div>
              </form>
            </div>
          </div>

          <div className="card" style={{ marginTop: '1rem' }}>
            <h2><Activity size={20} /> Phương án thanh toán tối ưu</h2>
            <p className="subtitle" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
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
                    <div className="transaction-arrow">
                      <ArrowRight size={20} />
                    </div>
                    <div style={{ flex: 1, fontWeight: '600' }}>{t.to.name}</div>
                    <div style={{ flex: 1, textAlign: 'right' }} className="balance negative">
                      {formatMoney(t.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="card" style={{ marginTop: '1rem' }}>
            <h2><Activity size={20} /> Lịch sử ghi nợ</h2>
            <div className="list-container">
              {history.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem 0' }}>Chưa có giao dịch nào.</p>
              ) : (
                history.map(t => (
                  <div key={t.id} className="list-item">
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {t.payer_name} <ArrowRight size={14} style={{ color: 'var(--accent)' }} /> {t.payee_name}
                      </div>
                      {t.description && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Lý do: {t.description}</div>}
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                        {new Date(t.created_at).toLocaleString('vi-VN')} {t.created_by_passcode && `- Tạo bởi: ${t.created_by_passcode}`}
                      </div>
                    </div>
                    <div className="balance negative">
                      {formatMoney(t.amount)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'general' && <FundManager type="general" />}
      {activeTab === 'private' && <FundManager type="private" />}
    </div>
  );
}

export default App;
