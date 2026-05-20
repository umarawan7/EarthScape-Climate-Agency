import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { RiUser3Line, RiLockPasswordLine, RiMailLine, RiShieldCheckLine } from 'react-icons/ri';

export default function Profile() {
  const { user } = useAuth();

  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (newPassword !== confirmPassword) {
      setMessage('New passwords do not match');
      setLoading(false);
      return;
    }

    setTimeout(() => {
      setLoading(false);
      setMessage('Profile updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 1000);
  };

  return (
    <div>
      <div className="page-header">
        <h1>User Profile</h1>
        <p>Manage your account settings and security</p>
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-4">
          <div className="card-es h-100">
            <div className="card-body-es d-flex flex-column align-items-center text-center p-5">
              <div style={{
                width: 100, height: 100, borderRadius: '50%', background: 'var(--primary-grd)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '2.5rem', fontWeight: 800, marginBottom: 20,
                boxShadow: 'var(--shadow-md)'
              }}>
                {user?.initials}
              </div>
              <h4 style={{ fontWeight: 800, marginBottom: 4 }}>{user?.name}</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 16 }}>{user?.email}</p>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <span style={{
                  background: 'var(--primary-light)', color: 'var(--primary)',
                  padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
                  textTransform: 'capitalize'
                }}>
                  {user?.role} Role
                </span>
                <span style={{
                  background: 'var(--success-bg)', color: 'var(--success)',
                  padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700
                }}>
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-8">
          <div className="card-es h-100">
            <div className="card-header-es">
              <h6>Update Security Details</h6>
            </div>
            <div className="card-body-es p-4">
              <form onSubmit={handleSubmit}>
                {message && (
                  <div className={`alert ${message.includes('successfully') ? 'alert-success' : 'alert-danger'}`} style={{ padding: '12px 16px', fontSize: '0.85rem' }}>
                    {message}
                  </div>
                )}

                <h6 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 16, color: 'var(--text-secondary)' }}>Account Email</h6>
                <div className="row g-3 mb-4">
                  <div className="col-12 col-md-6">
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Email Address</label>
                    <div className="login-input-wrap">
                      <RiMailLine className="inp-icon" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        className="form-control"
                        style={{ paddingLeft: 38 }}
                      />
                    </div>
                  </div>
                </div>

                <hr className="divider mb-4" />
                <h6 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 16, color: 'var(--text-secondary)' }}>Change Password</h6>

                <div className="row g-3 mb-4">
                  <div className="col-12 col-md-6">
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Current Password</label>
                    <div className="login-input-wrap">
                      <RiLockPasswordLine className="inp-icon" />
                      <input
                        type="password"
                        placeholder="Enter current password"
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        className="form-control"
                        style={{ paddingLeft: 38 }}
                      />
                    </div>
                  </div>
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-12 col-md-6">
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>New Password</label>
                    <div className="login-input-wrap">
                      <RiShieldCheckLine className="inp-icon" />
                      <input
                        type="password"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="form-control"
                        style={{ paddingLeft: 38 }}
                      />
                    </div>
                  </div>
                  <div className="col-12 col-md-6">
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Confirm New Password</label>
                    <div className="login-input-wrap">
                      <RiShieldCheckLine className="inp-icon" />
                      <input
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="form-control"
                        style={{ paddingLeft: 38 }}
                      />
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-end mt-4">
                  <button type="submit" className="btn btn-primary px-4" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
