import { useEffect, useMemo, useState } from 'react';
import { RiCheckDoubleLine, RiAlertLine, RiSettings4Line } from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';
import { alertService } from '../services/domainServices';
import { getApiBase } from '../services/api';

const SEVERITY_COLORS = {
  critical: { bg: '#fef2f2', border: '#dc2626', color: '#b91c1c' },
  high: { bg: '#fff7ed', border: '#ea580c', color: '#c2410c' },
  medium: { bg: '#fffbeb', border: '#d97706', color: '#b45309' },
  low: { bg: '#f0f9ff', border: '#0ea5e9', color: '#0369a1' },
};

function toLocalDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString();
}

export default function Alerts() {
  const { accessToken, isAnalyst, isAdmin } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [region, setRegion] = useState('south asia');
  const [threshold, setThreshold] = useState(45);
  const [severity, setSeverity] = useState('high');
  const [message, setMessage] = useState('');

  const canConfigure = isAdmin || isAnalyst;

  const loadAlerts = async () => {
    if (!accessToken) return;
    try {
      const data = await alertService.list(accessToken);
      setAlerts(Array.isArray(data) ? data : []);
    } catch (err) {
      setMessage(err?.message || 'Failed to load alerts');
    }
  };

  useEffect(() => {
    loadAlerts();
    const timer = setInterval(loadAlerts, 30000);
    return () => clearInterval(timer);
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    const wsBase = getApiBase().replace('/api', '').replace(/^http/, 'ws');
    const ws = new WebSocket(`${wsBase}/api/ws/alerts`);
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        setAlerts((prev) => [payload, ...prev]);
      } catch {
        // no-op
      }
    };
    return () => ws.close();
  }, [accessToken]);

  const handleAcknowledge = async (id) => {
    if (!accessToken) return;
    try {
      await alertService.acknowledge(accessToken, id);
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)));
    } catch (err) {
      setMessage(err?.message || 'Failed to acknowledge');
    }
  };

  const handleAcknowledgeAll = async () => {
    const unread = alerts.filter((a) => !a.acknowledged);
    for (const item of unread) {
      await handleAcknowledge(item.id);
    }
  };

  const handleConfigure = async () => {
    if (!accessToken || !canConfigure) return;
    try {
      await alertService.configure(accessToken, {
        region,
        threshold: Number(threshold),
        severity,
      });
      setMessage('Alert rule configured');
    } catch (err) {
      setMessage(err?.message || 'Failed to configure rule');
    }
  };

  const filtered = useMemo(() => alerts.filter((a) => {
    if (filter === 'unread') return !a.acknowledged;
    if (filter !== 'all') return a.severity === filter;
    return true;
  }), [alerts, filter]);

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-end">
        <div>
          <h1>Alerts & Notifications</h1>
          <p>Automated threshold breaches and system notifications</p>
        </div>
        <div className="d-flex gap-2">
          {canConfigure && (
            <button className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2" id="alert-settings-btn" onClick={handleConfigure}>
              <RiSettings4Line /> Configure Rules
            </button>
          )}
          <button className="btn btn-primary btn-sm d-flex align-items-center gap-2" onClick={handleAcknowledgeAll} id="ack-all-btn">
            <RiCheckDoubleLine /> Acknowledge All
          </button>
        </div>
      </div>

      {message && <div className="alert alert-info" style={{ fontSize: '0.82rem' }}>{message}</div>}

      {canConfigure && (
        <div className="card-es mb-3">
          <div className="card-body-es py-2">
            <div className="row g-2 align-items-end">
              <div className="col-12 col-md-4">
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 4 }}>Region</label>
                <input className="form-control form-control-sm" value={region} onChange={(e) => setRegion(e.target.value)} />
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 4 }}>Threshold</label>
                <input className="form-control form-control-sm" type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 4 }}>Severity</label>
                <select className="form-select form-select-sm" value={severity} onChange={(e) => setSeverity(e.target.value)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="col-12 col-md-2">
                <button className="btn btn-sm btn-primary w-100" onClick={handleConfigure}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card-es mb-4">
        <div className="card-body-es py-2">
          <div className="d-flex gap-3 align-items-center flex-wrap">
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Filter:</span>
            {['all', 'unread', 'critical', 'high', 'medium', 'low'].map((f) => (
              <button
                key={f}
                className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline-primary'}`}
                style={{ padding: '3px 12px', fontSize: '0.75rem', textTransform: 'capitalize', borderRadius: 20 }}
                onClick={() => setFilter(f)}
              >
                {f} {f === 'unread' && `(${alerts.filter((a) => !a.acknowledged).length})`}
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
          filtered.map((alert) => {
            const palette = SEVERITY_COLORS[alert.severity] || SEVERITY_COLORS.medium;
            return (
              <div className="col-12" key={alert.id}>
                <div style={{
                  background: palette.bg,
                  borderLeft: `4px solid ${palette.border}`,
                  borderRadius: '0 var(--radius-md) var(--radius-md) 0',
                  padding: '16px 20px',
                  display: 'flex',
                  gap: 16,
                  alignItems: 'flex-start',
                  boxShadow: 'var(--shadow-sm)',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {!alert.acknowledged && (
                    <div style={{ position: 'absolute', top: 12, right: 12, background: 'var(--danger)', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: 4 }}>NEW</div>
                  )}

                  <div style={{
                    width: 42, height: 42, borderRadius: '50%',
                    background: palette.border,
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, flexShrink: 0,
                  }}>
                    <RiAlertLine />
                  </div>

                  <div style={{ flex: 1 }}>
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <div>
                        <h6 style={{ margin: 0, fontWeight: 700, color: palette.color, fontSize: '0.95rem' }}>
                          {alert.type || 'Temperature'} Alert in {alert.region}
                        </h6>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          {toLocalDate(alert.triggered_at)} � ID: {alert.id}
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
                      {alert.message}. Recorded value was <strong>{alert.actual_value ?? '-'}</strong> (Threshold: {alert.threshold ?? '-'}).
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
