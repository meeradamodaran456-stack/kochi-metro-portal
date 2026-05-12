import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client, { API_BASE_URL } from '../api/client';

export default function AdminPanel() {
  const { user, logout } = useAuth();
  const [staff, setStaff] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null); // 'add' | 'edit' | 'bulk'
  const [currentRow, setCurrentRow] = useState(null);
  const [form, setForm] = useState({ staff_name: '', department: '', designation: '', extension_no: '', did: '', direct_number: '', mobile_number: '' });
  const [newDept, setNewDept] = useState('');
  const [lastUpdateTime, setLastUpdateTime] = useState(0); // For state locking
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const fileInputRef = useRef(null);
  const [theme, setTheme] = useState(localStorage.getItem('km_theme') || 'light');
  const [isPCMode, setIsPCMode] = useState(localStorage.getItem('km_pc_mode') === 'true');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('km_theme', theme);
  }, [theme]);

  useEffect(() => {
    document.body.classList.toggle('pc-mode', isPCMode);
    localStorage.setItem('km_pc_mode', isPCMode);
  }, [isPCMode]);

  const addNotification = (msg) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, msg }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3000);
  };

  const fetchDepartments = useCallback(async () => {
    // If we just modified something, don't let background sync overwrite it for 15s
    if (Date.now() - lastUpdateTime < 15000) return;
    try {
      const { data } = await client.get(`/staff/departments?t=${Date.now()}`);
      setDepartments(data.data || []);
    } catch (e) { console.error(e); }
  }, [lastUpdateTime]);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/staff', { params: { limit: 1000 } });
      setStaff(data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchStaff();
    fetchDepartments();

    // LIVE SYNC: Check for updates every 10 seconds
    const interval = setInterval(() => {
      fetchStaff();
      fetchDepartments();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchStaff, fetchDepartments]);

  const addDepartment = async () => {
    const nameToAdd = newDept.trim();
    if (!nameToAdd) return;
    try {
      const { data } = await client.post('/staff/departments', { name: nameToAdd });
      setNewDept('');
      addNotification('Department added');
      setLastUpdateTime(Date.now()); // Start the lock
      if (data.data) setDepartments(data.data);
    } catch (err) {
      alert('Failed to add department');
    }
  };

  const deleteDepartment = async (name) => {
    if (!window.confirm(`Delete department "${name}"?`)) return;
    try {
      const { data } = await client.delete(`/staff/departments/${name}`);
      addNotification('Department deleted');
      setLastUpdateTime(Date.now()); // Start the lock
      if (data.data) setDepartments(data.data);
    } catch (err) {
      alert('Failed to delete department');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (modal === 'add') {
        await client.post('/staff', form);
        addNotification('Staff details added successfully');
      } else {
        await client.put(`/staff/${currentRow.id}`, form);
        addNotification('Staff details updated');
      }
      setModal(null);
      fetchStaff();
    } catch (e) { alert('Operation failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this staff record?')) return;
    try {
      await client.delete(`/staff/${id}`);
      addNotification('Staff record deleted');
      fetchStaff();
    } catch (e) { alert('Delete failed'); }
  };

  const handleBulkUpload = async () => {
    if (!uploadFile) return;
    const formData = new FormData();
    formData.append('file', uploadFile);
    setLoading(true);
    try {
      const { data } = await client.post('/staff/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      addNotification(`Bulk upload complete: ${data.inserted} saved, ${data.skipped} skipped.`);
      fetchStaff();
      setModal(null);
      setUploadFile(null);
    } catch (e) {
      alert('Upload failed. Check file format.');
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = () => {
    const token = localStorage.getItem('km_token');
    window.location.href = `${API_BASE_URL}/staff/export?token=${token}`;
  };


  return (
    <div className="app-container">
      {/* ── NOTIFICATIONS ── */}
      <div className="notification-container">
        {notifications.map(n => (
          <div key={n.id} className="notification">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            {n.msg}
          </div>
        ))}
      </div>

      <nav className="navbar">
        <div className="navbar-brand">
          <div className="brand-logo"><div className="logo-square sq-teal" /><div className="logo-square sq-lime" /></div>
          METRO
        </div>
        <div className="nav-links">
          <Link to="/dashboard" className="nav-link">Directory</Link>
          <Link to="/admin" className="nav-link active">Admin Panel</Link>
        </div>
        <div className="nav-right">
          <div className="theme-toggles">
             <button className={`toggle-btn ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')} title="Light Mode">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
             </button>
             <button className={`toggle-btn ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')} title="Dark Mode">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
             </button>
             <button className={`toggle-btn ${isPCMode ? 'active' : ''}`} onClick={() => setIsPCMode(!isPCMode)} title="PC Mode">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
             </button>
          </div>
          <div className="user-profile">
            <span>Administrator</span>
            <button className="btn btn-primary btn-sm" onClick={logout}>
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
               Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="main-layout">
        <div className="page-header">
          <h1 className="page-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{color:'var(--primary)'}}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            Control Center
          </h1>
          <div className="stats-grid" style={{margin:0}}>
            <div className="stat-card">
              <div className="stat-icon staff"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></div>
              <div><div className="stat-val">{staff.length}</div><div className="stat-label">Total Staff</div></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon depts"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg></div>
              <div><div className="stat-val">{departments.length}</div><div className="stat-label">Departments</div></div>
            </div>
          </div>
        </div>

        <div className="flex-between m-b-2">
          <div style={{display:'flex',gap:'1rem'}}>
            <button className="btn btn-primary" onClick={exportExcel} style={{background:'#00897b'}}>
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
               Export Excel
            </button>
            <button className="btn btn-outline" onClick={() => setModal('bulk')}>Bulk Upload</button>
          </div>
          <button className="btn btn-accent" style={{background:'#a4c614'}} onClick={() => { setForm({ staff_name: '', department: departments[0] || '', designation: '', extension_no: '', did: '', direct_number: '', mobile_number: '' }); setModal('add'); }}>
            + Add New Staff
          </button>
        </div>

        <div className="dept-manager card">
          <h3 className="m-b-1" style={{display:'flex',alignItems:'center',gap:'0.5rem',fontSize:'1.1rem'}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
            Manage Departments
          </h3>
          <div className="dept-input-group">
            <input type="text" className="search-input" placeholder="New Department" value={newDept} onChange={e => setNewDept(e.target.value)} />
            <button className="btn btn-primary" style={{padding:'0.5rem 1rem'}} onClick={addDepartment}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          </div>
          <div className="dept-chips">
            {departments.map(d => (
              <span key={d} className="dept-chip">{d} <span className="remove-chip" onClick={() => deleteDepartment(d)}>×</span></span>
            ))}
          </div>
        </div>

        <div className="card table-container">
          <h3 className="m-b-1">Registered Staff Members</h3>
          <table className="staff-table">
            <thead>
              <tr><th>Name</th><th>Department</th><th>Designation</th><th>Ext</th><th>DID</th><th>Direct</th><th>Mobile</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {staff.map(s => (
                <tr key={s.id}>
                  <td><div className="flex-between" style={{justifyContent:'flex-start',gap:'0.75rem'}}><div className="avatar-badge" style={{backgroundColor:`hsl(${(s.staff_name.charCodeAt(0)*137)%360},50%,50%)`}}>{s.staff_name.charAt(0).toUpperCase()}</div><span style={{fontWeight:600}}>{s.staff_name}</span></div></td>
                  <td><span className="dept-pill admin">{s.department}</span></td>
                  <td style={{color:'var(--text-muted)'}}>{s.designation}</td>
                  <td>{s.extension_no || '—'}</td>
                  <td>{s.did || '—'}</td>
                  <td>{s.direct_number || '—'}</td>
                  <td>{s.mobile_number}</td>
                  <td>
                    <div className="flex-between" style={{gap:'1rem',justifyContent:'flex-start'}}>
                      <button onClick={()=>{setForm(s);setCurrentRow(s);setModal('edit');}} style={{color:'var(--primary)',background:'none',border:'none',cursor:'pointer'}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                      <button onClick={()=>handleDelete(s.id)} style={{color:'#ef4444',background:'none',border:'none',cursor:'pointer'}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── MODALS ── */}
        {(modal === 'add' || modal === 'edit') && (
          <div className="modal-overlay">
            <div className="modal card" style={{maxWidth:'600px'}}>
              <div className="modal-header"><h2>{modal==='add'?'Add New Staff':'Edit Staff'}</h2><button onClick={()=>setModal(null)}>×</button></div>
              <form onSubmit={handleSave} className="modal-body">
                <div className="form-grid">
                  {Object.keys(form).map(key => (
                    <div key={key} className="m-b-1">
                      <label style={{fontSize:'0.8rem',fontWeight:600}}>{key.replace('_',' ').toUpperCase()}</label>
                      {key === 'department' ? (
                        <select className="filter-select" style={{width:'100%',marginTop:'4px'}} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} required>
                          <option value="">Select Department</option>
                          {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      ) : (
                        <input className="search-input" value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} required={key==='staff_name'} />
                      )}
                    </div>
                  ))}
                </div>
                <div className="modal-footer"><button type="button" className="btn btn-outline" onClick={()=>setModal(null)}>Cancel</button><button type="submit" className="btn btn-primary">{modal==='add'?'Add':'Update'}</button></div>
              </form>
            </div>
          </div>
        )}

        {modal === 'bulk' && (
          <div className="modal-overlay">
            <div className="modal card" style={{maxWidth:'500px'}}>
              <div className="modal-header"><h2>Bulk Upload Staff</h2><button onClick={()=>setModal(null)}>×</button></div>
              <div className="modal-body text-center">
                <p className="m-b-1">Upload Excel (.xlsx) or CSV file with staff details.</p>
                <input type="file" ref={fileInputRef} accept=".xlsx,.xls,.csv" onChange={e=>setUploadFile(e.target.files[0])} style={{display:'none'}} />
                <button className="btn btn-outline m-b-1" onClick={()=>fileInputRef.current.click()}>{uploadFile ? uploadFile.name : 'Select File'}</button>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline" onClick={()=>setModal(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleBulkUpload} disabled={!uploadFile || loading}>{loading ? 'Uploading...' : 'Upload'}</button>
              </div>
            </div>
          </div>
        )}
        <div style={{textAlign:'center', padding:'1rem', opacity:0.5, fontSize:'0.8rem'}}>
          Kochi Metro Portal v2.0.3
        </div>
      </main>
    </div>
  );
}
