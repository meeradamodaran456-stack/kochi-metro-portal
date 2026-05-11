import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard  from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import Login      from './pages/Login';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return user.role === 'admin' ? children : <Navigate to="/" replace />;
}


function ThemeHandler() {
  useEffect(() => {
    const theme = localStorage.getItem('km_theme') || 'light';
    const pcMode = localStorage.getItem('km_pc_mode') === 'true';
    document.documentElement.setAttribute('data-theme', theme);
    document.body.classList.toggle('pc-mode', pcMode);
  }, []);
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeHandler />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/admin" element={
            <AdminRoute><AdminPanel /></AdminRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
