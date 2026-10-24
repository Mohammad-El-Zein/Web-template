import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useTranslation } from 'react-i18next';
import Sidebar from './components/Layout/Sidebar';
import Topbar from './components/Layout/Topbar';
import Dashboard from './pages/Dashboard/Dashboard';
import Foods from './pages/Foods/Foods';
import FoodForm from './pages/FoodForm/FoodForm';
import Orders from './pages/Orders/Orders';
import Profile from './pages/Profile/Profile';
import Login from './pages/Login/Login';
import { AdminContext } from './context/AdminContext';
import { clearToken, getToken } from './services/api';
import { getProfile } from './services/authService';

const pageTitleKey = (path) => {
  if (path.startsWith('/foods/new')) return 'form.addTitle';
  if (path.match(/^\/foods\/[^/]+\/edit/)) return 'form.editTitle';
  if (path.startsWith('/foods')) return 'foods.title';
  if (path.startsWith('/orders')) return 'orders.title';
  if (path.startsWith('/profile')) return 'profile.title';
  return 'nav.dashboard';
};

const App = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [loggedIn, setLoggedIn] = useState(!!getToken());
  const [profile, setProfile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const logout = useCallback(() => {
    clearToken();
    setProfile(null);
    setLoggedIn(false);
  }, []);

  // Wird von api.js ausgelöst, wenn der Token abgelaufen ist
  useEffect(() => {
    const onForcedLogout = () => {
      setProfile(null);
      setLoggedIn(false);
      toast.error(t('session.expired'));
    };
    window.addEventListener('admin-logout', onForcedLogout);
    return () => window.removeEventListener('admin-logout', onForcedLogout);
  }, [t]);

  useEffect(() => {
    if (!loggedIn) return;
    getProfile().then(setProfile).catch(() => {});
  }, [loggedIn]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const contextValue = useMemo(() => ({ profile, setProfile, logout }), [profile, logout]);
  const toastPosition = i18n.dir() === 'rtl' ? 'top-left' : 'top-right';

  if (!loggedIn) {
    return (
      <>
        <ToastContainer position={toastPosition} rtl={i18n.dir() === 'rtl'} />
        <Login onLogin={() => setLoggedIn(true)} />
      </>
    );
  }

  return (
    <AdminContext.Provider value={contextValue}>
      <div className="admin-shell">
        <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
        <div className={`sidebar-backdrop ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)}></div>

        <div className="main-area">
          <Topbar title={t(pageTitleKey(location.pathname))} onMenuClick={() => setSidebarOpen(true)} />
          <main className="page">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/foods" element={<Foods />} />
              <Route path="/foods/new" element={<FoodForm />} />
              <Route path="/foods/:id/edit" element={<FoodForm />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/profile" element={<Profile />} />
              {/* alte Adressen */}
              <Route path="/add" element={<Navigate to="/foods/new" replace />} />
              <Route path="/list" element={<Navigate to="/foods" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
      <ToastContainer position={toastPosition} rtl={i18n.dir() === 'rtl'} />
    </AdminContext.Provider>
  );
};

export default App;
