import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RiEarthLine, RiMailLine, RiLockLine, RiUserLine } from 'react-icons/ri';

export default function Signup() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    // Simulate signup request
    setTimeout(() => {
      setLoading(false);
      navigate('/login');
    }, 1200);
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-left-content">
          <div className="login-brand-icon">
            <RiEarthLine />
          </div>
          <h1>Join EarthScape</h1>
          <p>Create an account to explore climate datasets, set up anomaly alerts, and view machine learning predictions.</p>
        </div>
      </div>

      <div className="login-right">
        <div style={{ maxWidth: 360, width: '100%' }}>
          <div style={{ marginBottom: 28 }}>
            <h2>Create Account</h2>
            <p className="sub">Sign up for a viewer account to get started.</p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="alert alert-danger" style={{ padding: '10px 14px', fontSize: '0.8rem' }}>
                {error}
              </div>
            )}
            
            <div className="login-input-group">
              <label>Full Name</label>
              <div className="login-input-wrap">
                <RiUserLine className="inp-icon" />
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div className="login-input-group">
              <label>Email address</label>
              <div className="login-input-wrap">
                <RiMailLine className="inp-icon" />
                <input
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
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                />
              </div>
            </div>

            <div className="login-input-group">
              <label>Confirm Password</label>
              <div className="login-input-wrap">
                <RiLockLine className="inp-icon" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                />
              </div>
            </div>

            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? (
                <span className="d-flex align-items-center justify-content-center gap-2">
                  <span className="spinner-border spinner-border-sm" role="status" />
                  Creating Account…
                </span>
              ) : 'Sign Up'}
            </button>
          </form>

          <p style={{ marginTop: 24, fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
