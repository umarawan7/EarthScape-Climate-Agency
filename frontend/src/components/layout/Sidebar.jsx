import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  RiDashboardLine, RiGlobalLine, RiAlertLine, RiBarChartLine,
  RiUploadCloud2Line, RiTeamLine, RiCustomerService2Line,
  RiEarthLine, RiLogoutBoxLine, RiMapPinLine,
} from 'react-icons/ri';

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { path: '/',           icon: RiDashboardLine,      label: 'Dashboard'       },
      { path: '/explorer',   icon: RiBarChartLine,       label: 'Climate Explorer' },
      { path: '/anomaly-map',icon: RiMapPinLine,         label: 'Anomaly Map'     },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { path: '/predictions', icon: RiGlobalLine,        label: 'Predictions'     },
      { path: '/ingestion',   icon: RiUploadCloud2Line,  label: 'Ingestion'       },
    ],
  },
  {
    label: 'System',
    adminOnly: false,
    items: [
      { path: '/alerts',      icon: RiAlertLine,          label: 'Alerts', badge: 4 },
      { path: '/users',       icon: RiTeamLine,           label: 'Users',  adminOnly: true },
      { path: '/support',     icon: RiCustomerService2Line, label: 'Support'    },
    ],
  },
];

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    navigate(path);
    if (mobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className="sidebar-overlay"
        style={{ display: mobileOpen ? 'block' : 'none' }}
        onClick={() => setMobileOpen(false)}
      />

      <aside className={`sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <RiEarthLine size={20} />
          </div>
          <div className="sidebar-brand-text">
            <span className="name">EarthScape</span>
            <span className="tagline">Climate Agency</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <div className="sidebar-section-label">{section.label}</div>
              {section.items
                .filter(item => !item.adminOnly || isAdmin)
                .map((item) => {
                  const Icon = item.icon;
                  const active = location.pathname === item.path;
                  return (
                    <div
                      key={item.path}
                      className={`sidebar-item${active ? ' active' : ''}`}
                      onClick={() => handleNavigate(item.path)}
                    >
                      <span className="sidebar-item-icon"><Icon /></span>
                      <span className="sidebar-item-label">{item.label}</span>
                      {item.badge && (
                        <span className="sidebar-item-badge">{item.badge}</span>
                      )}
                    </div>
                  );
                })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-footer-avatar">{user?.initials}</div>
          <div className="sidebar-footer-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-role" style={{ textTransform: 'capitalize' }}>{user?.role}</div>
          </div>
          <button
            title="Logout"
            onClick={logout}
            style={{
              marginLeft: 'auto',
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.45)',
              fontSize: '17px',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              transition: 'color 0.2s',
              flexShrink: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
          >
            <RiLogoutBoxLine />
          </button>
        </div>
      </aside>
    </>
  );
}
