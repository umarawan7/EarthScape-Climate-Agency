import { Link } from 'react-router-dom';
import { RiEarthLine } from 'react-icons/ri';

export default function ForgotPassword() {
  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-left-content">
          <div className="login-brand-icon">
            <RiEarthLine />
          </div>
          <h1>Password Recovery</h1>
          <p>Password reset is managed by platform administrators for this local deployment.</p>
        </div>
      </div>

      <div className="login-right">
        <div style={{ maxWidth: 420, width: '100%' }}>
          <div style={{ marginBottom: 20 }}>
            <h2>Reset Password</h2>
            <p className="sub">Please contact an admin or analyst to reset your account password.</p>
          </div>

          <div className="alert alert-warning" style={{ fontSize: '0.85rem' }}>
            This environment currently does not expose a public OTP/email reset flow.
          </div>

          <p style={{ marginTop: 24, fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            Back to <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
