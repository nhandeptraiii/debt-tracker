import { useState } from 'react';
import { Wallet, Lock } from 'lucide-react';
import './index.css';
import DebtManager from './components/DebtManager';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('auth_passcode') === 'true';
  });
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');
  const validPasscodes = ['486508', '486496', '487754', '270989'];

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
        <h1><Wallet className="inline-block mr-2 mb-1" size={36} /> Debt Tracker</h1>
        <p className="subtitle">Hệ thống quản lý nợ thông minh & cấn trừ tự động</p>
      </header>

      <DebtManager />
    </div>
  );
}

export default App;
