import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { RiMapPinLine } from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';
import { climateService } from '../services/domainServices';

const SEVERITY_COLORS = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#d97706',
  low: '#0ea5e9',
};

const SEVERITY_RADIUS = { critical: 18, high: 14, medium: 11, low: 8 };

export default function AnomalyMap() {
  const { accessToken } = useAuth();
  const [filter, setFilter] = useState('all');
  const [points, setPoints] = useState([]);
  const [message, setMessage] = useState('');

  const loadAnomalies = async () => {
    if (!accessToken) return;
    try {
      const rows = await climateService.anomalies(accessToken);
      const mapped = (Array.isArray(rows) ? rows : [])
        .filter((row) => Number.isFinite(Number(row.latitude)) && Number.isFinite(Number(row.longitude)))
        .map((row) => ({
          id: row.id,
          lat: Number(row.latitude),
          lng: Number(row.longitude),
          region: row.region || 'Unknown region',
          type: row.anomaly_type || 'Anomaly',
          severity: row.severity || 'medium',
          value: row.value ?? '-',
          date: row.detected_at ? new Date(row.detected_at).toLocaleString() : '-',
          description: row.description,
        }));
      setPoints(mapped);
    } catch (err) {
      setMessage(err?.message || 'Failed to load anomalies');
    }
  };

  useEffect(() => {
    loadAnomalies();
  }, [accessToken]);

  const filtered = useMemo(() => (filter === 'all' ? points : points.filter((a) => a.severity === filter)), [filter, points]);

  return (
    <div>
      <div className="page-header">
        <h1>Anomaly Map</h1>
        <p>Geospatial visualization of detected climate anomalies worldwide</p>
      </div>

      {message && <div className="alert alert-info" style={{ fontSize: '0.82rem' }}>{message}</div>}

      <div className="row g-3 mb-4">
        {['critical', 'high', 'medium', 'low'].map((sev) => (
          <div className="col-6 col-md-3" key={sev}>
            <div className="card-es" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', borderColor: filter === sev ? SEVERITY_COLORS[sev] : '' }} onClick={() => setFilter((f) => (f === sev ? 'all' : sev))}>
              <div style={{ width: 38, height: 38, borderRadius: 8, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: SEVERITY_COLORS[sev] }} />
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{sev}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: SEVERITY_COLORS[sev], lineHeight: 1 }}>{points.filter((a) => a.severity === sev).length}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-3">
        <div className="col-12 col-xl-8">
          <div className="card-es">
            <div className="card-header-es">
              <h6>Global Anomaly Map</h6>
              <select
                id="map-filter-select"
                className="form-select form-select-sm"
                style={{ width: 'auto', fontSize: '0.75rem' }}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="card-body-es" style={{ padding: '12px 16px' }}>
              <MapContainer center={[20, 15]} zoom={2} style={{ height: 420, borderRadius: 10, border: '1px solid var(--border)' }} scrollWheelZoom={false}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                {filtered.map((pt) => (
                  <CircleMarker
                    key={pt.id}
                    center={[pt.lat, pt.lng]}
                    radius={SEVERITY_RADIUS[pt.severity] || 10}
                    pathOptions={{
                      color: SEVERITY_COLORS[pt.severity] || SEVERITY_COLORS.medium,
                      fillColor: SEVERITY_COLORS[pt.severity] || SEVERITY_COLORS.medium,
                      fillOpacity: 0.55,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div style={{ minWidth: 180 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 4 }}>{pt.region}</div>
                        <div style={{ fontSize: '0.75rem', color: '#555', marginBottom: 6 }}>{pt.type}</div>
                        <div style={{ fontSize: '0.75rem' }}>{pt.description || 'No details'}</div>
                        <div style={{ fontSize: '0.7rem', color: '#888', marginTop: 6 }}>{pt.date}</div>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="card-es h-100">
            <div className="card-header-es">
              <h6>Detected Anomalies</h6>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{filtered.length} points</span>
            </div>
            <div style={{ overflowY: 'auto', maxHeight: 520 }}>
              {filtered.map((pt) => (
                <div key={pt.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', borderLeft: `3px solid ${SEVERITY_COLORS[pt.severity] || SEVERITY_COLORS.medium}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <RiMapPinLine style={{ color: SEVERITY_COLORS[pt.severity] || SEVERITY_COLORS.medium }} />
                      {pt.region}
                    </span>
                    <code style={{ fontSize: '0.72rem', background: 'var(--bg-page)', padding: '1px 6px', borderRadius: 4 }}>{pt.value}</code>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{pt.type}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>{pt.date}</div>
                </div>
              ))}
              {!filtered.length && <div className="text-muted p-3">No anomalies found.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
