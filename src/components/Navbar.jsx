import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, Sun, Moon, Monitor } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="glass" style={{ margin: '1rem', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <h2 style={{ color: 'var(--color-teal)', margin: 0, fontWeight: '700' }}>METRO</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/dashboard" style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: '500' }}>Directory</Link>
          {user?.role === 'admin' && (
            <Link to="/admin" style={{ color: 'var(--color-teal)', textDecoration: 'none', fontWeight: '500' }}>Admin Panel</Link>
          )}
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => toggleTheme('light')} style={{ background: 'none', border: 'none', color: theme === 'light' ? 'var(--color-teal)' : 'var(--text-muted)', cursor: 'pointer' }} title="Daylight Theme"><Sun size={20}/></button>
          <button onClick={() => toggleTheme('dark')} style={{ background: 'none', border: 'none', color: theme === 'dark' ? 'var(--color-teal)' : 'var(--text-muted)', cursor: 'pointer' }} title="Night Theme"><Moon size={20}/></button>
          <button onClick={() => toggleTheme('grey')} style={{ background: 'none', border: 'none', color: theme === 'grey' ? 'var(--color-teal)' : 'var(--text-muted)', cursor: 'pointer' }} title="Grey Theme"><Monitor size={20}/></button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '1.5rem' }}>
          <span style={{ fontWeight: '500' }}>{user?.name || user?.fullname}</span>
          <button onClick={handleLogout} className="glass-button" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
