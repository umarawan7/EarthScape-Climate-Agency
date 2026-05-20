import { useState } from 'react';
import { usersData } from '../data/mockData';
import { RiUserAddLine, RiSearchLine, RiEdit2Line, RiDeleteBinLine } from 'react-icons/ri';

export default function UserManagement() {
  const [search, setSearch] = useState('');
  
  const filteredUsers = usersData.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-end">
        <div>
          <h1>User Management</h1>
          <p>Manage platform access and role-based permissions (Admin Only)</p>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2" id="add-user-btn">
          <RiUserAddLine /> Add User
        </button>
      </div>

      <div className="card-es">
        <div className="card-header-es">
          <div className="navbar-search" style={{ display: 'flex', width: 300 }}>
            <RiSearchLine className="search-icon" />
            <input 
              type="text" 
              placeholder="Search users by name, email, or role..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
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
                <th>Status</th>
                <th>Last Login</th>
                <th>Date Added</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>
                        {user.initials}
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
                      border: '1px solid var(--border)'
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.status === 'active' ? 'success' : 'muted'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{user.lastLogin}</td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{user.created}</td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-link text-primary-es p-1"><RiEdit2Line size={16} /></button>
                    <button className="btn btn-sm btn-link text-danger p-1"><RiDeleteBinLine size={16} /></button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted">
                    No users found matching "{search}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
