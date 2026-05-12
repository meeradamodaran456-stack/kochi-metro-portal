import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        const { user } = await login(form.username, form.password);
        if (user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        await register(form.username, form.password);
        setSuccess('Account created! You can now login.');
        setIsLogin(true);
        setForm({ ...form, password: '' });
      }
    } catch (err) {
      console.error('Auth error:', err);
      const msg = err.response?.data?.message || 'Something went wrong.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="card login-card">
        <div className="login-logo-header">
          <div className="brand-logo">
            <div className="logo-square sq-teal" />
            <div className="logo-square sq-lime" />
          </div>
          <h1 className="login-title">KOCHI METRO</h1>
          <p className="login-subtitle">Staff Portal {isLogin ? 'Login' : 'Sign Up'}</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="m-b-1" style={{ color: '#ef4444', fontSize: '0.9rem', textAlign:'center' }}>{error}</div>}
          {success && <div className="m-b-1" style={{ color: 'var(--accent)', fontSize: '0.9rem', textAlign:'center' }}>{success}</div>}

          <div className="login-form-group">
            <input
              type="text"
              className="login-input"
              placeholder="Username / Email"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>

          <div className="login-form-group">
            <input
              type="password"
              className="login-input"
              placeholder="Password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary login-btn-full" disabled={loading}>
            {loading ? (isLogin ? 'Logging in...' : 'Creating Account...') : (isLogin ? '→ Login' : '→ Sign Up')}
          </button>
        </form>

        <div className="login-footer">
          {isLogin ? (
            <>Don't have an account? <span className="link-span" onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}>Sign up</span></>
          ) : (
            <>Already have an account? <span className="link-span" onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }}>Login</span></>
          )}
        </div>
      </div>
    </div>
  );
}
