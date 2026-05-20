import { useState } from 'react';
import { alertsData } from '../data/mockData';
import { RiCheckDoubleLine, RiAlertLine, RiSettings4Line } from 'react-icons/ri';

const SEVERITY_COLORS = {
  critical: { bg: '#fef2f2', border: '#dc2626', color: '#b91c1c' },
  high: { bg: '#fff7ed', border: '#ea580c', color: '#c2410c' },
  medium: { bg: '#fffbeb', border: '#d97706', color: '#b45309' },
  low: { bg: '#f0f9ff', border: '#0ea5e9', color: '#0369a1' },
};

export default function Alerts() {
  const [alerts, setAlerts] = useState(alertsData);
  const [filter, setFilter] = useState('all');

  const handleAcknowledge = (id) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, acknowledged: true } : a));
  };

  const handleAcknowledgeAll = () => {
    setAlerts(alerts.map(a => ({ ...a, acknowledged: true })));
  };

  const filtered = alerts.filter(a => {
    if (filter === 'unread') return !a.acknowledged;
    if (filter !== 'all') return a.severity === filter;
    return true;
  });

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-end">
        <div>
          <h1>Alerts & Notifications</h1>
          <p>Automated threshold breaches and system notifications</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2" id="alert-settings-btn">
            <RiSettings4Line /> Configure Rules
          </button>
          <button className="btn btn-primary btn-sm d-flex align-items-center gap-2" onClick={handleAcknowledgeAll} id="ack-all-btn">
            <RiCheckDoubleLine /> Acknowledge All
          </button>
        </div>
      </div>

      <div className="card-es mb-4">
        <div className="card-body-es py-2">
          <div className="d-flex gap-3 align-items-center flex-wrap">
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Filter:</span>
            {['all', 'unread', 'critical', 'high', 'medium', 'low'].map(f => (
              <button
                key={f}
                className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline-primary'}`}
                style={{ padding: '3px 12px', fontSize: '0.75rem', textTransform: 'capitalize', borderRadius: 20 }}
                onClick={() => setFilter(f)}
              >
                {f} {f === 'unread' && `(${alerts.filter(a => !a.acknowledged).length})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="row g-3">
        {filtered.length === 0 ? (
          <div className="col-12">
            <div className="card-es empty-state">
              <RiCheckDoubleLine style={{ color: 'var(--success)', opacity: 0.5 }} />
              <h6>No alerts found</h6>
              <p>You're all caught up!</p>
            </div>
          </div>
        ) : (
          filtered.map(alert => (
            <div className="col-12" key={alert.id}>
              <div style={{
                background: SEVERITY_COLORS[alert.severity].bg,
                borderLeft: `4px solid ${SEVERITY_COLORS[alert.severity].border}`,
                borderRadius: '0 var(--radius-md) var(--radius-md) 0',
                padding: '16px 20px',
                display: 'flex',
                gap: 16,
                alignItems: 'flex-start',
                boxShadow: 'var(--shadow-sm)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {!alert.acknowledged && (
                  <div style={{ position: 'absolute', top: 12, right: 12, background: 'var(--danger)', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: 4 }}>NEW</div>
                )}

                <div style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: SEVERITY_COLORS[alert.severity].border,
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, flexShrink: 0
                }}>
                  <RiAlertLine />
                </div>

                <div style={{ flex: 1 }}>
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <div>
                      <h6 style={{ margin: 0, fontWeight: 700, color: SEVERITY_COLORS[alert.severity].color, fontSize: '0.95rem' }}>
                        {alert.type} Anomaly in {alert.region}
                      </h6>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        {alert.triggeredAt} · ID: {alert.id}
                      </div>
                    </div>

                    {!alert.acknowledged && (
                      <button
                        className="btn btn-sm btn-outline-primary"
                        style={{ fontSize: '0.7rem', padding: '4px 10px', background: '#fff' }}
                        onClick={() => handleAcknowledge(alert.id)}
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>

                  <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    {alert.message}. Recorded value was <strong>{alert.value}</strong> (Threshold: {alert.threshold}).
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
