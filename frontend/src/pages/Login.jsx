import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BsBuilding, BsEye, BsEyeSlash, BsShieldCheck } from 'react-icons/bs';

const roleRoute = {
  owner: '/owner/dashboard',
  accountant: '/accountant/dashboard',
  staff: '/branch/dashboard',
};

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoading, isAuthenticated, user, isInitializing } = useAuth();
  const navigate = useNavigate();

  if (!isInitializing && isAuthenticated && user) {
    const route = roleRoute[user.role] || '/branch/dashboard';
    return <Navigate to={route} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username || !password) {
      setError('يرجى إدخال رقم الهاتف وكلمة المرور');
      return;
    }
    const result = await login(username, password);
    if (result.success) {
      const route = roleRoute[result.user.role] || '/branch/dashboard';
      navigate(route);
    } else {
      setError(result.message || 'بيانات الدخول غير صحيحة');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo"><BsBuilding size={36} color="white" /></div>
          <h2>Red Board</h2>
          <p>نظام إدارة المؤسسة</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="login-input-group">
            <label>رقم الهاتف</label>
            <input
              className="form-control-custom"
              type="text"
              placeholder="أدخل رقم الهاتف"
              value={username}
              onChange={e => setUsername(e.target.value)}
              dir="ltr"
            />
          </div>

          <div className="login-input-group">
            <label>كلمة المرور</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-control-custom"
                type={showPassword ? 'text' : 'password'}
                placeholder="أدخل كلمة المرور"
                value={password}
                onChange={e => setPassword(e.target.value)}
                dir="ltr"
                style={{ paddingLeft: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', left: 12, top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)',
                  padding: 4, display: 'flex',
                }}
              >
                {showPassword ? <BsEyeSlash size={18} /> : <BsEye size={18} />}
              </button>
            </div>
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span className="spinner-border spinner-border-sm" /> جاري الدخول...
              </span>
            ) : 'دخول'}
          </button>
        </form>

        {import.meta.env.DEV && (
          <div style={{ marginTop: 28, fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center', borderTop: '1px solid var(--color-border-light)', paddingTop: 20 }}>
            <p style={{ margin: '0 0 6px', fontWeight: 600 }}>بيانات الدخول للتجربة:</p>
            <p style={{ margin: 0, lineHeight: 1.8, fontSize: '0.78rem' }}>
              <strong style={{ color: 'var(--color-primary)' }}>المدير:</strong> 01123456789 / Admin@1234<br />
              <strong style={{ color: 'var(--color-primary)' }}>محاسب:</strong> 01101234567 / Acc@1234<br />
              <strong style={{ color: 'var(--color-primary)' }}>موظف:</strong> 01244444444 / Staff@1234
            </p>
          </div>
        )}

        <div className="login-footer">
          <BsShieldCheck size={12} style={{ marginLeft: 4, verticalAlign: 'middle' }} />
          Red Board ERP v1.0
        </div>
      </div>
    </div>
  );
};

export default Login;
