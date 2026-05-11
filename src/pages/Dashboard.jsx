import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('');
  const [departments, setDepartments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('km_theme') || 'light');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('km_theme', theme);
  }, [theme]);

  useEffect(() => {
    client.get('/staff/departments').then(r => setDepartments(r.data.data || [])).catch(() => {});
  }, []);

  const fetchStaff = useCallback(async (q, dept) => {
    setLoading(true);
    try {
      const { data } = await client.get('/staff', {
        params: { q, department: dept, limit: 100 }
      });
      setStaff(data.data || []);
    } catch {
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const sanitizePhone = (num) => num ? num.replace(/[^0-9+]/g, '') : '';

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchStaff(query, department);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, department, fetchStaff]);

  return (
    <div className="app-container">
      {/* ── NAVBAR ── */}
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="brand-logo"><div className="logo-square sq-teal" /><div className="logo-square sq-lime" /></div>
          METRO
        </div>

        <div className="nav-links">
          <Link to="/dashboard" className="nav-link active">Directory</Link>
          {user?.role === 'admin' && <Link to="/admin" className="nav-link">Admin Panel</Link>}
        </div>

        <div className="nav-right">
          <div className="theme-toggles">
             <button className={`toggle-btn ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')} title="Light Mode">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
             </button>
             <button className={`toggle-btn ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')} title="Dark Mode">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
             </button>
          </div>
          <div className="user-profile">
            <span>{user?.username}</span>
            <button className="btn btn-primary btn-sm" onClick={logout}>Logout</button>
          </div>
        </div>
      </nav>

      <main className="main-layout">
        <div className="search-section card">
          <div className="search-grid">
            <div className="input-with-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" className="search-input" placeholder="Search by name or DID..." value={query} onChange={e => setQuery(e.target.value)} />
            </div>
            <select className="filter-select" value={department} onChange={e => setDepartment(e.target.value)}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <div className="card table-container">
          {loading ? (
            <div className="text-center p-2"><div className="spinner" style={{margin:'0 auto'}} /></div>
          ) : staff.length === 0 ? (
            <div className="text-center p-2">No staff records found.</div>
          ) : (
            <>
              {/* ── DESKTOP TABLE ── */}
              <div className="desktop-only">
                <table className="staff-table">
                  <thead><tr><th>Name</th><th>Department</th><th>Designation</th><th>Extension</th><th>DID</th><th>Direct</th><th>Action</th></tr></thead>
                  <tbody>
                    {staff.map(s => (
                      <tr key={s.id} onClick={() => setSelectedStaff(s)} style={{cursor:'pointer'}}>
                        <td><div className="flex-between" style={{justifyContent:'flex-start',gap:'0.75rem'}}><div className="avatar-badge" style={{backgroundColor:`hsl(${(s.staff_name.charCodeAt(0)*137)%360},50%,50%)`}}>{s.staff_name.charAt(0).toUpperCase()}</div><span style={{fontWeight:600,color:'var(--primary)'}}>{s.staff_name}</span></div></td>
                        <td><span className="dept-pill admin">{s.department || '—'}</span></td>
                        <td style={{color:'var(--text-muted)'}}>{s.designation || '—'}</td>
                        <td>{s.extension_no || '—'}</td>
                        <td>{s.did || '—'}</td>
                        <td>{s.direct_number || '—'}</td>
                        <td><a href={`tel:${sanitizePhone(s.mobile_number)}`} className="call-btn" onClick={e => e.stopPropagation()}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>Call</a></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── MOBILE LIST (BOX FORMAT) ── */}
              <div className="mobile-only staff-card-grid">
                {staff.map(s => (
                  <div key={s.id} className="staff-mobile-card" onClick={() => setSelectedStaff(s)}>
                    <div className="staff-card-header">
                      <div className="avatar-badge" style={{backgroundColor:`hsl(${(s.staff_name.charCodeAt(0)*137)%360},50%,50%)`}}>{s.staff_name.charAt(0).toUpperCase()}</div>
                      <div className="staff-card-title">
                        <h3>{s.staff_name}</h3>
                        <p>{s.designation}</p>
                      </div>
                      <a href={`tel:${sanitizePhone(s.mobile_number)}`} className="call-btn-circle" onClick={e => e.stopPropagation()}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      </a>
                    </div>
                    <div className="staff-card-details">
                      <div><span>Dept:</span> {s.department}</div>
                      <div><span>DID:</span> {s.did}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* ── STAFF DETAIL MODAL ── */}
      {selectedStaff && (
        <div className="modal-overlay" onClick={() => setSelectedStaff(null)}>
          <div className="detail-card" onClick={e => e.stopPropagation()}>
            <div className="detail-header">
              <button className="detail-close" onClick={() => setSelectedStaff(null)}>×</button>
              <div className="detail-avatar">{selectedStaff.staff_name.charAt(0).toUpperCase()}</div>
              <h2 style={{fontSize:'1.5rem'}}>{selectedStaff.staff_name}</h2>
              <p style={{opacity:0.9,fontSize:'0.9rem'}}>{selectedStaff.designation}</p>
            </div>
            <div className="detail-body">
              <div className="detail-item">
                <div className="detail-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg></div>
                <div className="detail-info"><span className="detail-label">Department</span><span className="detail-value">{selectedStaff.department || '—'}</span></div>
              </div>
              <div className="detail-item">
                <div className="detail-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div>
                <div className="detail-info"><span className="detail-label">Mobile / Direct</span><span className="detail-value">{selectedStaff.mobile_number || '—'} (Direct: {selectedStaff.direct_number || '—'})</span></div>
              </div>
              <div className="detail-item">
                <div className="detail-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></div>
                <div className="detail-info"><span className="detail-label">DID / Extension</span><span className="detail-value">{selectedStaff.did || '—'} (Ext: {selectedStaff.extension_no || '—'})</span></div>
              </div>
              <div className="m-t-2">
                <a href={`tel:${sanitizePhone(selectedStaff.mobile_number)}`} className="btn btn-primary" style={{width:'100%',textAlign:'center',display:'block'}}>Call Now</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
