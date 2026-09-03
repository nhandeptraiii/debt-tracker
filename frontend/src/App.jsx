import { useState, useEffect } from 'react';
import axios from 'axios';
import { Wallet, RefreshCw, Building2, Lock } from 'lucide-react';
import './index.css';
import FundManager from './components/FundManager';
import DebtManager from './components/DebtManager';

const API_URL = '/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('auth_passcode') === 'true';
  });
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');
  const validPasscodes = ['486508', '486496', '487754', '270989'];

  const [activeTab, setActiveTab] = useState('debts'); // 'debts', 'general', 'private'



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

      {activeTab === 'debts' && <DebtManager />}
      {activeTab === 'general' && <FundManager type="general" />}
      {activeTab === 'private' && <FundManager type="private" />}
    </div>
  );
}

export default App;
