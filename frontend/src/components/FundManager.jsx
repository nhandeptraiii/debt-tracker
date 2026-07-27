import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const API_URL = '/api';

export default function FundManager({ type }) {
  const [transactions, setTransactions] = useState([]);
  const [formData, setFormData] = useState({
    transaction_date: new Date().toISOString().split('T')[0],
    description: '',
    income: '',
    expense: '',
    spender: '',
    notes: '',
    is_refunded: false
  });

  const fetchFunds = async () => {
    try {
      const res = await axios.get(`${API_URL}/funds?type=${type}`);
      setTransactions(res.data);
    } catch (error) {
      console.error("Error fetching funds:", error);
    }
  };

  useEffect(() => {
    fetchFunds();
  }, [type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.transaction_date || !formData.description) return;

    try {
      await axios.post(`${API_URL}/funds`, {
        fund_type: type,
        transaction_date: formData.transaction_date,
        description: formData.description,
        income: formData.income || 0,
        expense: formData.expense || 0,
        spender: formData.spender,
        notes: formData.notes,
        is_refunded: formData.is_refunded,
        created_by_passcode: localStorage.getItem('auth_passcode_value')
      });
      setFormData({
        transaction_date: new Date().toISOString().split('T')[0],
        description: '',
        income: '',
        expense: '',
        spender: '',
        notes: '',
        is_refunded: false
      });
      fetchFunds();
    } catch (error) {
      console.error("Error adding fund transaction:", error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa giao dịch này?")) return;
    try {
      await axios.delete(`${API_URL}/funds/${id}`);
      fetchFunds();
    } catch (error) {
      console.error("Error deleting fund transaction:", error);
    }
  };

  const handleToggleRefund = async (id, currentStatus) => {
    try {
      await axios.patch(`${API_URL}/funds/${id}`, { is_refunded: !currentStatus });
      fetchFunds();
    } catch (error) {
      console.error("Error updating refund status:", error);
    }
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-US').format(amount);
  };

  const handleExportExcel = () => {
    let currentBalance = 0;
    const excelData = transactions.map((t, index) => {
      const income = parseFloat(t.income) || 0;
      const expense = parseFloat(t.expense) || 0;
      currentBalance = currentBalance + income - expense;

      const row = {
        'STT': index + 1,
        'Ngày': new Date(t.transaction_date).toLocaleDateString('vi-VN'),
        'Nội dung': t.description,
        'Thu': income > 0 ? formatMoney(income) : '',
        'Chi': expense > 0 ? formatMoney(expense) : ''
      };

      if (type === 'general') {
        row['Người chi'] = t.spender;
      }

      row['Trạng thái hoàn trả'] = income > 0 ? '' : (t.is_refunded ? 'Đã trả' : 'Chưa trả');
      row['Ghi chú'] = t.notes;

      return row;
    });

    const balanceRow = {
      'STT': '',
      'Ngày': '',
      'Nội dung': 'Tổng số dư còn lại',
      'Thu': formatMoney(currentBalance),
      'Chi': ''
    };

    if (type === 'general') {
      balanceRow['Người chi'] = '';
    }
    balanceRow['Trạng thái hoàn trả'] = '';
    balanceRow['Ghi chú'] = '';

    excelData.push(balanceRow);

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    const fileName = type === 'general' ? 'Quy_Chung.xlsx' : 'Quy_Rieng.xlsx';
    XLSX.writeFile(workbook, fileName);
  };

  let currentBalance = 0;
  let totalIncome = 0;
  let totalExpense = 0;

  return (
    <div className="card" style={{ maxWidth: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ marginBottom: 0, borderBottom: 'none' }}>
          {type === 'general' ? 'Quản lý Quỹ Chung Phòng' : 'Quản lý Quỹ Riêng KHDN'}
        </h2>
        <button onClick={handleExportExcel} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--success)' }}>
          <Download size={18} /> Xuất Excel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="form-group" style={{ flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div className="input-container" style={{ minWidth: '150px' }}>
          <label>Ngày</label>
          <input
            type="date"
            value={formData.transaction_date}
            onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
            required
          />
        </div>
        <div className="input-container" style={{ minWidth: '200px', flex: 2 }}>
          <label>Nội dung</label>
          <input
            type="text"
            placeholder="Nội dung thu/chi"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
        </div>
        <div className="input-container" style={{ minWidth: '120px' }}>
          <label>Thu (VNĐ)</label>
          <input
            type="number"
            placeholder="0"
            value={formData.income}
            onChange={(e) => setFormData({ ...formData, income: e.target.value })}
          />
        </div>
        <div className="input-container" style={{ minWidth: '120px' }}>
          <label>Chi (VNĐ)</label>
          <input
            type="number"
            placeholder="0"
            value={formData.expense}
            onChange={(e) => setFormData({ ...formData, expense: e.target.value })}
          />
        </div>
        {type === 'general' && (
          <div className="input-container" style={{ minWidth: '150px' }}>
            <label>Người chi</label>
            <input
              type="text"
              placeholder="Người chi (nếu có)"
              value={formData.spender}
              onChange={(e) => setFormData({ ...formData, spender: e.target.value })}
            />
          </div>
        )}
        {/* <div className="input-container" style={{ minWidth: '100px', flexDirection: 'row', alignItems: 'center', gap: '0.5rem', alignSelf: 'center', marginTop: '1.5rem' }}>
          <input 
            type="checkbox" 
            id={`refunded-${type}`}
            checked={formData.is_refunded}
            onChange={(e) => setFormData({...formData, is_refunded: e.target.checked})}
            style={{ width: 'auto' }}
          />
          <label htmlFor={`refunded-${type}`} style={{ cursor: 'pointer', margin: 0 }}>Đã trả lại?</label>
        </div> */}
        <div className="input-container" style={{ minWidth: '150px' }}>
          <label>Ghi chú</label>
          <input
            type="text"
            placeholder="Ghi chú thêm"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>
        <div className="input-container" style={{ alignSelf: 'center', flex: 'none', marginTop: '1rem' }}>
          <button type="submit" style={{ minWidth: '100px' }}><Plus size={18} /> Thêm</button>
        </div>
      </form>

      <div className="fund-table-container">
        <table className="fund-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>STT</th>
              <th style={{ width: '100px' }}>Ngày</th>
              <th className="col-description">Nội dung</th>
              <th className="money">Thu</th>
              <th className="money">Chi</th>
              <th className="money">Còn lại</th>
              {type === 'general' && <th>Người chi</th>}
              <th style={{ textAlign: 'center' }}>Đã trả lại</th>
              <th>Ghi chú</th>
              <th style={{ width: '40px' }}></th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t, index) => {
              const income = parseFloat(t.income) || 0;
              const expense = parseFloat(t.expense) || 0;
              currentBalance = currentBalance + income - expense;
              totalIncome += income;
              totalExpense += expense;
              return (
                <tr key={t.id}>
                  <td>{index + 1}</td>
                  <td>{new Date(t.transaction_date).toLocaleDateString('vi-VN')}</td>
                  <td className="col-description">{t.description}</td>
                  <td className="money" style={{ color: income > 0 ? 'var(--success)' : 'inherit' }}>
                    {income > 0 ? formatMoney(income) : '-'}
                  </td>
                  <td className="money" style={{ color: expense > 0 ? 'var(--danger)' : 'inherit' }}>
                    {expense > 0 ? formatMoney(expense) : '-'}
                  </td>
                  <td className="money" style={{ fontWeight: 600 }}>{formatMoney(currentBalance)}</td>
                  {type === 'general' && <td>{t.spender}</td>}
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={t.is_refunded === 1 || t.is_refunded === true}
                      onChange={() => handleToggleRefund(t.id, t.is_refunded)}
                      style={{ cursor: 'pointer', width: 'auto' }}
                    />
                  </td>
                  <td>{t.notes} {t.created_by_passcode && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}><br/>Tạo bởi: {t.created_by_passcode}</span>}</td>
                  <td>
                    <button
                      onClick={() => handleDelete(t.id)}
                      style={{ background: 'transparent', color: 'var(--danger)', padding: '0.25rem', height: 'auto', minWidth: 'unset' }}
                      title="Xóa"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {transactions.length > 0 && (
              <tr className="total-row">
                <td colSpan={3} style={{ textAlign: 'center' }}>Tổng cộng</td>
                <td className="money" style={{ color: 'var(--success)' }}>{formatMoney(totalIncome)}</td>
                <td className="money" style={{ color: 'var(--danger)' }}>{formatMoney(totalExpense)}</td>
                <td className="money">{formatMoney(currentBalance)}</td>
                {type === 'general' && <td></td>}
                <td></td>
                <td></td>
                <td></td>
              </tr>
            )}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={type === 'general' ? 10 : 9} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Chưa có giao dịch nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
