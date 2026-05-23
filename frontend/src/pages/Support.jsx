import { useEffect, useMemo, useState } from 'react';
import { RiAddLine, RiSearchLine, RiTicketLine } from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';
import { supportService } from '../services/domainServices';

function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString();
}

export default function Support() {
  const { isAdmin, isAnalyst, accessToken } = useAuth();
  const canReply = isAdmin || isAnalyst;

  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [tickets, setTickets] = useState([]);
  const [message, setMessage] = useState('');
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    category: 'other',
  });
  const [replyState, setReplyState] = useState({});

  const loadTickets = async () => {
    if (!accessToken) return;
    try {
      const data = await supportService.list(accessToken);
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      setMessage(err?.message || 'Failed to load tickets');
    }
  };

  useEffect(() => {
    loadTickets();
  }, [accessToken]);

  const filteredTickets = useMemo(() => tickets
    .filter((t) => {
      if (activeTab === 'open') return t.status === 'open' || t.status === 'in_progress';
      if (activeTab === 'resolved') return t.status === 'resolved';
      return true;
    })
    .filter((t) => {
      if (!search.trim()) return true;
      const hay = `${t.subject} ${t.description} ${t.category}`.toLowerCase();
      return hay.includes(search.toLowerCase());
    }), [tickets, activeTab, search]);

  const submitTicket = async () => {
    if (!accessToken) return;
    try {
      await supportService.create(accessToken, newTicket);
      setNewTicket({ subject: '', description: '', category: 'other' });
      setMessage('Support ticket submitted');
      await loadTickets();
    } catch (err) {
      setMessage(err?.message || 'Failed to submit ticket');
    }
  };

  const updateTicket = async (ticketId) => {
    if (!accessToken || !canReply) return;
    const state = replyState[ticketId] || {};
    try {
      await supportService.update(accessToken, ticketId, {
        status: state.status || undefined,
        admin_response: state.reply || undefined,
      });
      setMessage('Ticket updated');
      await loadTickets();
    } catch (err) {
      setMessage(err?.message || 'Failed to update ticket');
    }
  };

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-end">
        <div>
          <h1>Support Center</h1>
          <p>Users can submit support requests. Analysts and admins can respond and manage ticket status.</p>
        </div>
      </div>

      {message && <div className="alert alert-info" style={{ fontSize: '0.82rem' }}>{message}</div>}

      <div className="row g-4">
        <div className="col-12 col-xl-4">
          <div className="card-es mb-3">
            <div className="card-header-es">
              <h6>Submit Request</h6>
            </div>
            <div className="card-body-es">
              <div className="mb-2">
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 4 }}>Subject</label>
                <input className="form-control form-control-sm" value={newTicket.subject} onChange={(e) => setNewTicket((s) => ({ ...s, subject: e.target.value }))} />
              </div>
              <div className="mb-2">
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 4 }}>Category</label>
                <select className="form-select form-select-sm" value={newTicket.category} onChange={(e) => setNewTicket((s) => ({ ...s, category: e.target.value }))}>
                  <option value="bug">Bug</option>
                  <option value="feature">Feature</option>
                  <option value="data">Data</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 4 }}>Description</label>
                <textarea className="form-control form-control-sm" rows={4} value={newTicket.description} onChange={(e) => setNewTicket((s) => ({ ...s, description: e.target.value }))} />
              </div>
              <button className="btn btn-primary btn-sm w-100 d-flex align-items-center justify-content-center gap-2" onClick={submitTicket}>
                <RiAddLine /> Submit Ticket
              </button>
            </div>
          </div>

          <div className="card-es">
            <div className="card-body-es p-0">
              <div className="p-3 border-bottom border-light">
                <h6 className="m-0" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Views</h6>
              </div>
              <ul className="list-unstyled m-0">
                {['all', 'open', 'resolved'].map((tab) => (
                  <li key={tab}>
                    <button
                      className="w-100 text-start border-0 py-3 px-4"
                      style={{
                        background: activeTab === tab ? 'var(--primary-light)' : 'transparent',
                        color: activeTab === tab ? 'var(--primary)' : 'var(--text-primary)',
                        fontWeight: activeTab === tab ? 600 : 400,
                        fontSize: '0.85rem',
                        transition: 'all 0.2s',
                        borderLeft: activeTab === tab ? '3px solid var(--primary)' : '3px solid transparent',
                      }}
                      onClick={() => setActiveTab(tab)}
                    >
                      <span style={{ textTransform: 'capitalize' }}>{tab} Tickets</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-8">
          <div className="card-es">
            <div className="card-header-es d-flex justify-content-between align-items-center">
              <h6>Tickets ({filteredTickets.length})</h6>
              <div className="navbar-search d-none d-md-flex">
                <RiSearchLine className="search-icon" />
                <input type="text" placeholder="Search tickets..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>

            <div className="list-group list-group-flush rounded-bottom">
              {filteredTickets.map((ticket) => (
                <div key={ticket.id} className="list-group-item p-3" style={{ borderBottom: '1px solid var(--border-light)', transition: 'background 0.2s' }}>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <RiTicketLine style={{ color: 'var(--primary)', fontSize: 18 }} />
                      <h6 className="m-0" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{ticket.subject}</h6>
                    </div>
                    <span className={`status-badge ${ticket.status === 'resolved' ? 'success' : ticket.status === 'in_progress' ? 'info' : 'warning'}`}>
                      {String(ticket.status || '').replace('_', ' ')}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 8 }}>{ticket.description}</div>

                  <div className="d-flex justify-content-between align-items-center mt-2 mb-2">
                    <div className="d-flex gap-3 align-items-center">
                      <code style={{ fontSize: '0.7rem', background: 'var(--bg-page)', padding: '2px 6px', borderRadius: 4, color: 'var(--text-secondary)' }}>{ticket.id}</code>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Category: <strong style={{ textTransform: 'capitalize' }}>{ticket.category}</strong>
                      </span>
                      {(isAdmin || isAnalyst) && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          User ID: <strong>{ticket.user_id}</strong>
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Updated: {formatDate(ticket.updated_at)}
                    </div>
                  </div>

                  {ticket.admin_response && (
                    <div className="alert alert-light" style={{ fontSize: '0.78rem', marginBottom: 8 }}>
                      <strong>Reply:</strong> {ticket.admin_response}
                      {ticket.admin_response_by && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          by {ticket.admin_response_by} ({ticket.admin_response_by_role})
                        </div>
                      )}
                    </div>
                  )}

                  {canReply && (
                    <div className="row g-2">
                      <div className="col-12 col-md-3">
                        <select
                          className="form-select form-select-sm"
                          value={replyState[ticket.id]?.status || ticket.status}
                          onChange={(e) => setReplyState((s) => ({ ...s, [ticket.id]: { ...s[ticket.id], status: e.target.value } }))}
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </div>
                      <div className="col-12 col-md-7">
                        <input
                          className="form-control form-control-sm"
                          placeholder="Write response to user..."
                          value={replyState[ticket.id]?.reply || ''}
                          onChange={(e) => setReplyState((s) => ({ ...s, [ticket.id]: { ...s[ticket.id], reply: e.target.value } }))}
                        />
                      </div>
                      <div className="col-12 col-md-2">
                        <button className="btn btn-sm btn-primary w-100" onClick={() => updateTicket(ticket.id)}>Reply</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {filteredTickets.length === 0 && (
                <div className="text-center p-5 text-muted">
                  <RiTicketLine size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                  <h6>No tickets found</h6>
                  <p className="mb-0" style={{ fontSize: '0.85rem' }}>There are no {activeTab} tickets at the moment.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
