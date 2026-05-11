import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { user } = await login(form.username, form.password);
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login component error:', err);
      const msg = err.response?.data?.message || 'Invalid credentials.';
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
          <p className="login-subtitle">Staff Portal Login</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="m-b-1" style={{ color: '#ef4444', fontSize: '0.9rem' }}>{error}</div>}

          <div className="login-form-group">
            <input
              type="text"
              className="login-input"
              placeholder="Email Address"
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
            {loading ? 'Logging in...' : '→ Login'}
          </button>
        </form>

        <div className="login-footer">
          Don't have an account? <Link to="/login">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
