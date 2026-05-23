import { useEffect, useState } from 'react';
import { RiDeleteBinLine, RiEdit2Line, RiSearchLine, RiUserAddLine } from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/domainServices';

export default function UserManagement() {
  const { accessToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('viewer');

  const loadUsers = async () => {
    if (!accessToken) return;
    try {
      const data = await userService.list(accessToken);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setMessage(err?.message || 'Failed to load users');
    }
  };

  useEffect(() => {
    loadUsers();
  }, [accessToken]);

  const filteredUsers = users.filter((u) =>
    `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(search.toLowerCase())
  );

  const clearForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('viewer');
    setSelectedUser(null);
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await userService.register(accessToken, { name, email, password, role });
      setMessage('User created');
      setShowAddModal(false);
      clearForm();
      await loadUsers();
    } catch (err) {
      setMessage(err?.message || 'Failed to create user');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await userService.updateRole(accessToken, selectedUser.id, role);
      setMessage('Role updated');
      setShowEditModal(false);
      clearForm();
      await loadUsers();
    } catch (err) {
      setMessage(err?.message || 'Failed to update role');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      await userService.remove(accessToken, selectedUser.id);
      setMessage('User deleted');
      setShowDeleteModal(false);
      setSelectedUser(null);
      await loadUsers();
    } catch (err) {
      setMessage(err?.message || 'Failed to delete user');
    }
  };

  const openAddModal = () => {
    clearForm();
    setShowAddModal(true);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setShowEditModal(true);
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-end">
        <div>
          <h1>User Management</h1>
          <p>Manage platform access and role-based permissions (Admin Only)</p>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2" id="add-user-btn" onClick={openAddModal}>
          <RiUserAddLine /> Add User
        </button>
      </div>

      {message && <div className="alert alert-info" style={{ fontSize: '0.82rem' }}>{message}</div>}

      <div className="card-es">
        <div className="card-header-es">
          <div className="navbar-search" style={{ display: 'flex', width: 300 }}>
            <RiSearchLine className="search-icon" />
            <input
              type="text"
              placeholder="Search users by name, email, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="es-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Last Login</th>
                <th>Date Added</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const initials = (user.name || '').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <tr key={user.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>
                          {initials || 'US'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        background: 'var(--bg-page)',
                        padding: '3px 10px',
                        borderRadius: 12,
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        textTransform: 'capitalize',
                        border: '1px solid var(--border)',
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}</td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-link text-primary-es p-1" onClick={() => openEditModal(user)}><RiEdit2Line size={16} /></button>
                      <button className="btn btn-sm btn-link text-danger p-1" onClick={() => openDeleteModal(user)}><RiDeleteBinLine size={16} /></button>
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-muted">
                    No users found matching "{search}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
              <div className="modal-header" style={{ borderBottom: '1px solid var(--border-light)' }}>
                <h5 className="modal-title" style={{ fontWeight: 700 }}>Add New User</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)} />
              </div>
              <form onSubmit={handleAddUser}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Full Name</label>
                    <input type="text" className="form-control" required value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Email Address</label>
                    <input type="email" className="form-control" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Temporary Password</label>
                    <input type="password" className="form-control" required value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Role</label>
                    <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
                      <option value="viewer">Viewer</option>
                      <option value="analyst">Analyst</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer" style={{ borderTop: '1px solid var(--border-light)' }}>
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Add User</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
              <div className="modal-header" style={{ borderBottom: '1px solid var(--border-light)' }}>
                <h5 className="modal-title" style={{ fontWeight: 700 }}>Update User Role</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)} />
              </div>
              <form onSubmit={handleUpdateUser}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Full Name</label>
                    <input type="text" className="form-control" value={name} disabled />
                  </div>
                  <div className="mb-3">
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Email Address</label>
                    <input type="email" className="form-control" value={email} disabled />
                  </div>
                  <div className="mb-3">
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Role</label>
                    <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
                      <option value="viewer">Viewer</option>
                      <option value="analyst">Analyst</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer" style={{ borderTop: '1px solid var(--border-light)' }}>
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
              <div className="modal-header" style={{ borderBottom: '1px solid var(--border-light)' }}>
                <h5 className="modal-title text-danger" style={{ fontWeight: 700 }}>Delete User</h5>
                <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)} />
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete <strong>{selectedUser?.name}</strong>?</p>
                <p className="text-muted" style={{ fontSize: '0.78rem' }}>This action is permanent and cannot be undone.</p>
              </div>
              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-light)' }}>
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                <button type="button" className="btn btn-danger" onClick={handleDeleteUser}>Delete User</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
