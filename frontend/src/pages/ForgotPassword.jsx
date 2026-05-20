import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RiEarthLine, RiMailLine, RiShieldKeyholeLine, RiLockPasswordLine } from 'react-icons/ri';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 1000);
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    if (otp.length < 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(3);
    }, 1000);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
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
          <h1>Password Recovery</h1>
          <p>Follow the steps to securely reset your account password and regain access to the EarthScape platform.</p>
        </div>
      </div>

      <div className="login-right">
        <div style={{ maxWidth: 360, width: '100%' }}>
          {step === 1 && (
            <>
              <div style={{ marginBottom: 28 }}>
                <h2>Forgot Password?</h2>
                <p className="sub">Enter your email address to receive a 6-digit OTP code.</p>
              </div>
              <form onSubmit={handleEmailSubmit}>
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
                <button className="login-btn" type="submit" disabled={loading}>
                  {loading ? 'Sending...' : 'Send OTP'}
                </button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <div style={{ marginBottom: 28 }}>
                <h2>Enter OTP</h2>
                <p className="sub">We've sent a 6-digit code to <strong>{email}</strong>.</p>
              </div>
              <form onSubmit={handleOtpSubmit}>
                {error && <div className="alert alert-danger" style={{ padding: '10px 14px', fontSize: '0.8rem' }}>{error}</div>}
                <div className="login-input-group">
                  <label>6-Digit Code</label>
                  <div className="login-input-wrap">
                    <RiShieldKeyholeLine className="inp-icon" />
                    <input
                      type="text"
                      maxLength="6"
                      value={otp}
                      onChange={e => setOtp(e.target.value)}
                      placeholder="Enter 6-digit code"
                      required
                    />
                  </div>
                </div>
                <button className="login-btn" type="submit" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </form>
            </>
          )}

          {step === 3 && (
            <>
              <div style={{ marginBottom: 28 }}>
                <h2>New Password</h2>
                <p className="sub">Please enter your new password.</p>
              </div>
              <form onSubmit={handlePasswordSubmit}>
                <div className="login-input-group">
                  <label>New Password</label>
                  <div className="login-input-wrap">
                    <RiLockPasswordLine className="inp-icon" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Create a strong password"
                      required
                    />
                  </div>
                </div>
                <button className="login-btn" type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </>
          )}

          <p style={{ marginTop: 24, fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            Remembered your password? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
