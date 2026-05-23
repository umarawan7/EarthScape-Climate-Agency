import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { selfRegisterRequest } from '../services/authService';
import { RiEarthLine, RiUserLine, RiMailLine, RiLockLine } from 'react-icons/ri';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await selfRegisterRequest({ name, email, password });
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-left-content">
          <div className="login-brand-icon">
            <RiEarthLine />
          </div>
          <h1>Create Viewer Account</h1>
          <p>Join the EarthScape Climate Agency. Viewer accounts allow read-only access to climate records, dashboards, alerts, and model forecasts.</p>
        </div>
      </div>

      <div className="login-right">
        <div style={{ maxWidth: 360, width: '100%' }}>
          <div style={{ marginBottom: 20 }}>
            <h2>Create Account</h2>
            <p className="sub">Register for a new viewer account</p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="alert alert-danger" style={{ padding: '10px 14px', fontSize: '0.8rem' }}>
                {error}
              </div>
            )}
            {success && (
              <div className="alert alert-success" style={{ padding: '10px 14px', fontSize: '0.8rem' }}>
                {success}
              </div>
            )}

            <div className="login-input-group">
              <label>Full name</label>
              <div className="login-input-wrap">
                <RiUserLine className="inp-icon" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
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
                  placeholder="At least 8 characters"
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
                  placeholder="Confirm password"
                  required
                />
              </div>
            </div>

            <button className="login-btn" type="submit" disabled={loading} style={{ marginTop: 10 }}>
              {loading ? 'Creating Account...' : 'Sign Up'}
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
