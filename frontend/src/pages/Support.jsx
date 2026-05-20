import { useState } from 'react';
import { supportTickets } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { RiTicketLine, RiAddLine, RiSearchLine } from 'react-icons/ri';

export default function Support() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('all');

  const filteredTickets = supportTickets.filter(t => {
    if (activeTab === 'open') return t.status === 'open' || t.status === 'in_progress';
    if (activeTab === 'resolved') return t.status === 'resolved';
    return true;
  });

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-end">
        <div>
          <h1>Support Center</h1>
          <p>Submit issues, request features, and track support tickets</p>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2" id="new-ticket-btn">
          <RiAddLine /> New Ticket
        </button>
      </div>

      <div className="row g-4">
        <div className="col-12 col-xl-3">
          <div className="card-es">
            <div className="card-body-es p-0">
              <div className="p-3 border-bottom border-light">
                <h6 className="m-0" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Views</h6>
              </div>
              <ul className="list-unstyled m-0">
                {['all', 'open', 'resolved'].map(tab => (
                  <li key={tab}>
                    <button 
                      className="w-100 text-start border-0 py-3 px-4"
                      style={{ 
                        background: activeTab === tab ? 'var(--primary-light)' : 'transparent',
                        color: activeTab === tab ? 'var(--primary)' : 'var(--text-primary)',
                        fontWeight: activeTab === tab ? 600 : 400,
                        fontSize: '0.85rem',
                        transition: 'all 0.2s',
                        borderLeft: activeTab === tab ? '3px solid var(--primary)' : '3px solid transparent'
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

        <div className="col-12 col-xl-9">
          <div className="card-es">
            <div className="card-header-es d-flex justify-content-between align-items-center">
              <h6>Tickets ({filteredTickets.length})</h6>
              <div className="navbar-search d-none d-md-flex">
                <RiSearchLine className="search-icon" />
                <input type="text" placeholder="Search tickets..." />
              </div>
            </div>
            
            <div className="list-group list-group-flush rounded-bottom">
              {filteredTickets.map(ticket => (
                <div key={ticket.id} className="list-group-item p-3" style={{ borderBottom: '1px solid var(--border-light)', transition: 'background 0.2s', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-page)'} onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <RiTicketLine style={{ color: 'var(--primary)', fontSize: 18 }} />
                      <h6 className="m-0" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{ticket.subject}</h6>
                    </div>
                    <span className={`status-badge ${ticket.status === 'resolved' ? 'success' : ticket.status === 'in_progress' ? 'info' : 'warning'}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="d-flex justify-content-between align-items-center mt-2">
                    <div className="d-flex gap-3 align-items-center">
                      <code style={{ fontSize: '0.7rem', background: 'var(--bg-page)', padding: '2px 6px', borderRadius: 4, color: 'var(--text-secondary)' }}>{ticket.id}</code>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Category: <strong style={{ textTransform: 'capitalize' }}>{ticket.category}</strong>
                      </span>
                      {isAdmin && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          User: <strong>{ticket.user}</strong>
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Created: {ticket.createdAt}
                    </div>
                  </div>
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
