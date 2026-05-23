import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  RiMenuLine, RiSearchLine, RiBellLine, RiRefreshLine, RiLogoutBoxLine, RiSettings4Line, RiUserLine
} from 'react-icons/ri';
import { alertService } from '../../services/domainServices';

const PAGE_TITLES = {
  '/':            { title: 'Dashboard',        sub: 'Overview of climate monitoring data' },
  '/explorer':    { title: 'Climate Explorer',  sub: 'Explore historical and real-time climate datasets' },
  '/anomaly-map': { title: 'Anomaly Map',       sub: 'Geospatial anomaly detection visualization' },
  '/predictions': { title: 'Predictions',       sub: 'ML-powered climate forecasting' },
  '/ingestion':   { title: 'Ingestion Monitor', sub: 'Data pipeline status and ingestion history' },
  '/alerts':      { title: 'Alerts',            sub: 'Active threshold alerts and notifications' },
  '/users':       { title: 'User Management',   sub: 'Manage user accounts and roles' },
  '/support':     { title: 'Support',           sub: 'Submit and track support tickets' },
  '/profile':     { title: 'Profile',           sub: 'Manage your account details and security settings' },
};

export default function Navbar({ collapsed, setCollapsed, setMobileOpen }) {
  const { user, logout, accessToken } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();
  const page      = PAGE_TITLES[location.pathname] || { title: 'EarthScape', sub: '' };
  const [alerts, setAlerts] = useState([]);
  const unread = useMemo(() => alerts.filter(a => !a.acknowledged).length, [alerts]);

  const [showNotifs, setShowNotifs] = useState(false);
  const [showUser, setShowUser] = useState(false);
  
  const notifRef = useRef();
  const userRef = useRef();

  useEffect(() => {
    if (!accessToken) return;
    const loadAlerts = async () => {
      try {
        const data = await alertService.list(accessToken);
        setAlerts(Array.isArray(data) ? data : []);
      } catch {
        setAlerts([]);
      }
    };
    loadAlerts();
    const timer = setInterval(loadAlerts, 30000);
    return () => clearInterval(timer);
  }, [accessToken]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifs(false);
      }
      if (userRef.current && !userRef.current.contains(event.target)) {
        setShowUser(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className={`main-navbar${collapsed ? ' collapsed' : ''}`}>
      {/* Hamburger */}
      <button
        id="sidebar-toggle"
        className="navbar-toggle d-none d-lg-flex"
        onClick={() => setCollapsed(c => !c)}
        title="Toggle sidebar"
      >
        <RiMenuLine />
      </button>
      <button
        id="sidebar-mobile-toggle"
        className="navbar-toggle d-flex d-lg-none"
        onClick={() => setMobileOpen(o => !o)}
        title="Open menu"
      >
        <RiMenuLine />
      </button>

      {/* Page title */}
      <div className="d-none d-sm-block">
        <div className="navbar-page-title">{page.title}</div>
        <div className="navbar-breadcrumb">{page.sub}</div>
      </div>

      <div className="navbar-right">
        {/* Search */}
        <div className="navbar-search d-none d-md-flex">
          <RiSearchLine className="search-icon" />
          <input
            type="text"
            placeholder="Search regions, datasets…"
            id="global-search"
          />
        </div>

        {/* Refresh */}
        <button className="navbar-icon-btn" title="Refresh data" id="refresh-btn">
          <RiRefreshLine />
        </button>

        {/* Notifications */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button className="navbar-icon-btn" title="Alerts" id="notif-btn" onClick={() => setShowNotifs(!showNotifs)}>
            <RiBellLine />
            {unread > 0 && <span className="notif-dot" />}
          </button>
          
          {showNotifs && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: 10,
              width: 320, background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
              zIndex: 1000, overflow: 'hidden'
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h6 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700 }}>Notifications</h6>
                <button className="btn btn-link p-0 text-primary-es" style={{ fontSize: '0.75rem', textDecoration: 'none' }} onClick={() => { setShowNotifs(false); navigate('/alerts'); }}>View All</button>
              </div>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {alerts.slice(0, 3).map(alert => (
                  <div key={alert.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', cursor: 'pointer' }} onClick={() => { setShowNotifs(false); navigate('/alerts'); }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{alert.message}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{alert.triggered_at || '-'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 4px' }} />

        {/* User chip */}
        <div style={{ position: 'relative' }} ref={userRef}>
          <div className="navbar-user" id="user-menu" onClick={() => setShowUser(!showUser)}>
            <div className="navbar-user-avatar">{user?.initials}</div>
            <div className="d-none d-sm-block">
              <div className="navbar-user-name">{user?.name?.split(' ')[0]}</div>
              <div className="navbar-user-role" style={{ textTransform: 'capitalize' }}>{user?.role}</div>
            </div>
          </div>
          
          {showUser && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: 10,
              width: 200, background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
              zIndex: 1000, overflow: 'hidden', padding: '8px 0'
            }}>
              <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border-light)', marginBottom: 8 }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{user?.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.email}</div>
              </div>
              
              <button className="btn btn-link text-start w-100 text-decoration-none" style={{ color: 'var(--text-primary)', padding: '6px 16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 10 }} onClick={() => { setShowUser(false); navigate('/profile'); }}>
                <RiUserLine /> Profile
              </button>
              <button className="btn btn-link text-start w-100 text-decoration-none" style={{ color: 'var(--text-primary)', padding: '6px 16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 10 }} onClick={() => setShowUser(false)}>
                <RiSettings4Line /> Settings
              </button>
              <div style={{ borderTop: '1px solid var(--border-light)', margin: '8px 0' }} />
              <button className="btn btn-link text-start w-100 text-decoration-none text-danger" style={{ padding: '6px 16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 10 }} onClick={() => { setShowUser(false); logout(); }}>
                <RiLogoutBoxLine /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
