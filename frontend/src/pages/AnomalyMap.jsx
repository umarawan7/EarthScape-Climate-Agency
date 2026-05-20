import { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { anomalyPoints, regionOptions } from '../data/mockData';
import { RiMapPinLine, RiFilterLine } from 'react-icons/ri';

const SEVERITY_COLORS = {
  critical: '#dc2626',
  high:     '#ea580c',
  medium:   '#d97706',
  low:      '#0ea5e9',
};

const SEVERITY_RADIUS = { critical: 18, high: 14, medium: 11, low: 8 };

export default function AnomalyMap() {
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all'
    ? anomalyPoints
    : anomalyPoints.filter(a => a.severity === filter);

  return (
    <div>
      <div className="page-header">
        <h1>Anomaly Map</h1>
        <p>Geospatial visualization of detected climate anomalies worldwide</p>
      </div>

      {/* ── Stats strip ── */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Critical', count: anomalyPoints.filter(a => a.severity === 'critical').length, color: '#dc2626', bg: '#fef2f2' },
          { label: 'High',     count: anomalyPoints.filter(a => a.severity === 'high').length,     color: '#ea580c', bg: '#fff7ed' },
          { label: 'Medium',   count: anomalyPoints.filter(a => a.severity === 'medium').length,   color: '#d97706', bg: '#fffbeb' },
          { label: 'Low',      count: anomalyPoints.filter(a => a.severity === 'low').length,      color: '#0ea5e9', bg: '#f0f9ff' },
        ].map(s => (
          <div className="col-6 col-md-3" key={s.label}>
            <div className="card-es" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', borderColor: filter === s.label.toLowerCase() ? s.color : '' }}
              onClick={() => setFilter(f => f === s.label.toLowerCase() ? 'all' : s.label.toLowerCase())}>
              <div style={{ width: 38, height: 38, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: s.color }} />
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.count}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Map + List ── */}
      <div className="row g-3">
        <div className="col-12 col-xl-8">
          <div className="card-es">
            <div className="card-header-es">
              <h6>Global Anomaly Map</h6>
              <div className="d-flex gap-2 align-items-center">
                <select
                  id="map-filter-select"
                  className="form-select form-select-sm"
                  style={{ width: 'auto', fontSize: '0.75rem' }}
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
            <div className="card-body-es" style={{ padding: '12px 16px' }}>
              <MapContainer
                center={[20, 15]}
                zoom={2}
                style={{ height: 420, borderRadius: 10, border: '1px solid var(--border)' }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                {filtered.map(pt => (
                  <CircleMarker
                    key={pt.id}
                    center={[pt.lat, pt.lng]}
                    radius={SEVERITY_RADIUS[pt.severity]}
                    pathOptions={{
                      color: SEVERITY_COLORS[pt.severity],
                      fillColor: SEVERITY_COLORS[pt.severity],
                      fillOpacity: 0.55,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 180 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 4 }}>{pt.region}</div>
                        <div style={{ fontSize: '0.75rem', color: '#555', marginBottom: 6 }}>{pt.type}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                          <span>Value:</span>
                          <strong style={{ color: SEVERITY_COLORS[pt.severity] }}>{pt.value}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                          <span>Severity:</span>
                          <strong style={{ textTransform: 'capitalize', color: SEVERITY_COLORS[pt.severity] }}>{pt.severity}</strong>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#888', marginTop: 6 }}>{pt.date}</div>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>

              {/* Legend */}
              <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
                {Object.entries(SEVERITY_COLORS).map(([s, c]) => (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                    <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Side list */}
        <div className="col-12 col-xl-4">
          <div className="card-es h-100">
            <div className="card-header-es">
              <h6>Detected Anomalies</h6>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{filtered.length} points</span>
            </div>
            <div style={{ overflowY: 'auto', maxHeight: 520 }}>
              {filtered.map(pt => (
                <div key={pt.id} style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border-light)',
                  borderLeft: `3px solid ${SEVERITY_COLORS[pt.severity]}`,
                  transition: 'background 0.15s',
                  cursor: 'default',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-page)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <RiMapPinLine style={{ color: SEVERITY_COLORS[pt.severity] }} />
                      {pt.region}
                    </span>
                    <code style={{ fontSize: '0.72rem', background: 'var(--bg-page)', padding: '1px 6px', borderRadius: 4, color: SEVERITY_COLORS[pt.severity], fontWeight: 700 }}>
                      {pt.value}
                    </code>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{pt.type}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>{pt.date}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
