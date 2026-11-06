import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, CreditCard, ArrowRight, Plus, Activity, ChevronDown, ChevronRight, QrCode, Edit2, Check, X } from 'lucide-react';

const API_URL = '/api';

export default function DebtManager() {
  const [users, setUsers] = useState([]);
  const [balances, setBalances] = useState([]);
  const [simplified, setSimplified] = useState([]);
  const [history, setHistory] = useState([]);
  const [newUserName, setNewUserName] = useState('');
  const [newUserAccount, setNewUserAccount] = useState('');
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingAccountValue, setEditingAccountValue] = useState('');
  const [paymentModal, setPaymentModal] = useState(null);
  const [modalAccountInput, setModalAccountInput] = useState('');
  const [isConfirmingDebt, setIsConfirmingDebt] = useState(false);
  const [expandedWeeks, setExpandedWeeks] = useState({});

  const formatAccountNo = (acc) => {
    if (!acc) return '';
    return String(acc).replace(/\s+/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const openPaymentModal = (t) => {
    const latestToUser = users.find(u => u.id === t.to.id);
    const currentAccountNo = latestToUser?.account_no ?? t.to.account_no ?? '';
    setPaymentModal({
      ...t,
      to: { ...t.to, account_no: currentAccountNo }
    });
    setModalAccountInput(currentAccountNo);
  };

  const handleConfirmClearDebt = async () => {
    if (!paymentModal || isConfirmingDebt) return;
    setIsConfirmingDebt(true);
    try {
      await axios.post(`${API_URL}/transactions`, {
        payer_ids: [paymentModal.to.id],
        payee_id: paymentModal.from.id,
        amount: paymentModal.amount,
        description: 'Xóa nợ',
        created_by_passcode: localStorage.getItem('auth_passcode_value')
      });
      setPaymentModal(null);
      fetchData();
    } catch (error) {
      console.error('Error clearing debt:', error);
    } finally {
      setIsConfirmingDebt(false);
    }
  };

  const handleSaveUserAccount = async (userId, accountNoValue, isFromModal = false) => {
    try {
      const res = await axios.patch(`${API_URL}/users/${userId}`, {
        account_no: accountNoValue
      });
      const savedAcc = res.data.account_no || '';
      setEditingUserId(null);
      if (isFromModal && paymentModal) {
        setPaymentModal({
          ...paymentModal,
          to: { ...paymentModal.to, account_no: savedAcc }
        });
      }
      fetchData();
    } catch (error) {
      console.error('Error updating user account:', error);
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
      await axios.post(`${API_URL}/users`, {
        name: newUserName.trim(),
        account_no: newUserAccount.trim(),
        created_by_passcode: localStorage.getItem('auth_passcode_value')
      });
      setNewUserName('');
      setNewUserAccount('');
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
          <form onSubmit={handleAddUser} style={{ marginBottom: '1rem' }}>
            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <div className="input-container">
                <label>Tên người dùng</label>
                <input type="text" placeholder="Nhập tên..." value={newUserName} onChange={(e) => setNewUserName(e.target.value)} />
              </div>
              <div className="input-container">
                <label>STK ViettelPay (MB Bank)</label>
                <input
                  type="text"
                  placeholder="VD: 9704 2292 0488..."
                  value={newUserAccount}
                  onChange={(e) => setNewUserAccount(e.target.value)}
                />
              </div>
            </div>
            <button type="submit" style={{ width: '100%' }}><Plus size={18} /> Thêm thành viên</button>
          </form>
          <div className="list-container">
            {balances.map(user => (
              <div key={user.id} className="list-item">
                <div className="user-info" style={{ flex: 1, marginRight: '0.75rem' }}>
                  <span className="user-name">{user.name}</span>
                  {editingUserId === user.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
                      <input
                        type="text"
                        placeholder="Nhập STK ViettelPay (MB Bank)..."
                        value={editingAccountValue}
                        onChange={(e) => setEditingAccountValue(e.target.value)}
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.85rem' }}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveUserAccount(user.id, editingAccountValue)}
                        style={{ padding: '0.35rem 0.5rem', height: 'auto', background: 'var(--success)' }}
                        title="Lưu"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingUserId(null)}
                        style={{ padding: '0.35rem 0.5rem', height: 'auto', background: 'var(--text-secondary)' }}
                        title="Hủy"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      <span>
                        {user.account_no
                          ? `ViettelPay (MB): ${formatAccountNo(user.account_no)}`
                          : 'Chưa có STK ViettelPay'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingUserId(user.id);
                          setEditingAccountValue(user.account_no || '');
                        }}
                        style={{ background: 'transparent', color: 'var(--accent)', padding: '0.15rem', height: 'auto', minWidth: 'unset' }}
                        title="Cập nhật STK ViettelPay"
                      >
                        <Edit2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
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
                  onClick={() => openPaymentModal(t)}
                  style={{ marginLeft: '1rem', padding: '0.5rem 1rem', background: 'var(--success)', height: 'auto', minWidth: 'unset', fontSize: '0.85rem' }}
                >
                  <QrCode size={16} /> Thanh toán / Xóa nợ
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {paymentModal && (
        <div className="modal-overlay" onClick={() => setPaymentModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.15rem' }}>
                <QrCode size={22} style={{ color: 'var(--accent)' }} /> Thanh toán qua QR ViettelPay
              </h3>
              <button
                type="button"
                onClick={() => setPaymentModal(null)}
                style={{ background: 'transparent', color: 'var(--text-secondary)', padding: '0.25rem', height: 'auto' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-transfer-summary">
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Người trả</span>
                <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{paymentModal.from.name}</div>
              </div>
              <ArrowRight size={20} style={{ color: 'var(--accent)' }} />
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Chủ nợ nhận</span>
                <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{paymentModal.to.name}</div>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Số tiền cần thanh toán</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger)' }}>
                {formatMoney(paymentModal.amount)}
              </div>
            </div>

            {paymentModal.to.account_no ? (
              <div className="qr-container">
                <img
                  src={`https://img.vietqr.io/image/MB-${String(paymentModal.to.account_no).replace(/\s+/g, '')}-compact2.png?amount=${Math.round(paymentModal.amount)}&addInfo=${encodeURIComponent(`${paymentModal.from.name} tra no ${paymentModal.to.name}`)}&accountName=${encodeURIComponent(paymentModal.to.name)}`}
                  alt="ViettelPay VietQR"
                  className="qr-image"
                />
                <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Số tài khoản ViettelPay (MB Bank)
                </div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', letterSpacing: '0.5px', marginTop: '0.15rem' }}>
                  {formatAccountNo(paymentModal.to.account_no)}
                </div>
              </div>
            ) : (
              <div className="qr-missing-box">
                <p style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <strong>{paymentModal.to.name}</strong> chưa có số tài khoản ViettelPay (MB Bank). Nhập số tài khoản 19 số bên dưới để tạo mã QR:
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="VD: 9704 2292 0488 4637 290"
                    value={modalAccountInput}
                    onChange={(e) => setModalAccountInput(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveUserAccount(paymentModal.to.id, modalAccountInput, true)}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    Lưu & Tạo QR
                  </button>
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                onClick={handleConfirmClearDebt}
                disabled={isConfirmingDebt}
                style={{ flex: 2, background: 'var(--success)' }}
              >
                <Check size={18} /> {isConfirmingDebt ? 'Đang xử lý...' : 'Đã chuyển khoản (Xóa nợ)'}
              </button>
              <button
                type="button"
                onClick={() => setPaymentModal(null)}
                style={{ flex: 1, background: '#64748b' }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

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