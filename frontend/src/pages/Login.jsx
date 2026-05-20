import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RiEarthLine, RiMailLine, RiLockLine, RiShieldCheckLine, RiBarChartLine, RiAlertLine, RiCloudLine } from 'react-icons/ri';

const ROLES = ['admin', 'analyst', 'viewer'];

export default function Login() {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState('admin');
  const [email,    setEmail]    = useState('admin@earthscape.io');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setEmail(`${role}@earthscape.io`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      login(selectedRole);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="login-page">
      {/* ── Left Panel ── */}
      <div className="login-left">
        <div className="login-left-content">
          <div className="login-brand-icon">
            <RiEarthLine />
          </div>
          <h1>EarthScape Climate Agency</h1>
          <p>Advanced climate analytics platform for monitoring, processing, and visualizing large-scale environmental datasets.</p>

          <div className="login-feature-list">
            {[
              { icon: RiBarChartLine, text: 'Real-time climate data dashboards' },
              { icon: RiAlertLine,    text: 'Automated anomaly detection & alerts' },
              { icon: RiCloudLine,    text: 'PySpark distributed data processing' },
              { icon: RiShieldCheckLine, text: 'Role-based access control (RBAC)' },
            ].map(({ icon: Icon, text }) => (
              <div className="login-feature-item" key={text}>
                <span className="icon"><Icon /></span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="login-right">
        <div style={{ maxWidth: 360, width: '100%' }}>
          <div style={{ marginBottom: 28 }}>
            <h2>Sign In</h2>
            <p className="sub">Access your climate monitoring workspace</p>
          </div>

          {/* Role switcher (demo) */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
              Demo Role
            </label>
            <div className="login-role-select">
              {ROLES.map(r => (
                <button
                  key={r}
                  type="button"
                  className={`login-role-btn${selectedRole === r ? ' active' : ''}`}
                  onClick={() => handleRoleSelect(r)}
                  id={`role-${r}`}
                  style={{ textTransform: 'capitalize' }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="login-input-group">
              <label>Email address</label>
              <div className="login-input-wrap">
                <RiMailLine className="inp-icon" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@earthscape.io"
                  required
                />
              </div>
            </div>

            <div className="login-input-group">
              <label>Password</label>
              <div className="login-input-wrap">
                <RiLockLine className="inp-icon" />
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
              <Link to="/forgot-password" style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600 }}>Forgot password?</Link>
            </div>

            <button id="login-submit" className="login-btn" type="submit" disabled={loading}>
              {loading ? (
                <span className="d-flex align-items-center justify-content-center gap-2">
                  <span className="spinner-border spinner-border-sm" role="status" />
                  Signing in…
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p style={{ marginTop: 28, fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.7 }}>
            By signing in, you agree to EarthScape's data handling policies.<br />
            Secured with end-to-end JWT authentication.
          </p>

          <p style={{ marginTop: 16, fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            Don't have an account? <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
