import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  RiTempHotLine, RiLeafLine, RiAlertLine, RiDatabase2Line,
  RiArrowUpLine, RiArrowDownLine, RiMoreLine, RiMapPinLine,
} from 'react-icons/ri';
import { dashboardStats, tempTrend, co2Data, precipData, alertsData, anomalyPoints } from '../data/mockData';

/* ── Stat Card ─────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, change, up, color }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className={`stat-icon ${color}`}><Icon /></div>
      <div className="stat-body">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        <div className={`stat-change ${up ? 'up' : 'down'}`}>
          {up ? <RiArrowUpLine /> : <RiArrowDownLine />}
          {change}
          <span className="period">vs last month</span>
        </div>
      </div>
    </div>
  );
}

/* ── Custom Tooltip ─────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
      padding: '10px 14px', fontSize: '0.78rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    }}>
      <p style={{ fontWeight: 700, marginBottom: 4, color: '#1a2332' }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color, margin: '2px 0' }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const unreadAlerts = alertsData.filter(a => !a.acknowledged);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1>Overview Dashboard</h1>
        <p>Real-time climate monitoring — Last updated: {new Date().toLocaleString()}</p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-xl-3">
          <StatCard icon={RiTempHotLine} label="Avg. Temperature" value={dashboardStats.avgTemp.value}
            change={dashboardStats.avgTemp.change} up={dashboardStats.avgTemp.up} color="orange" />
        </div>
        <div className="col-6 col-xl-3">
          <StatCard icon={RiLeafLine} label="CO₂ Level (ppm)" value={dashboardStats.co2.value}
            change={dashboardStats.co2.change} up={dashboardStats.co2.up} color="blue" />
        </div>
        <div className="col-6 col-xl-3">
          <StatCard icon={RiAlertLine} label="Active Anomalies" value={dashboardStats.anomalies.value}
            change={dashboardStats.anomalies.change} up={dashboardStats.anomalies.up} color="red" />
        </div>
        <div className="col-6 col-xl-3">
          <StatCard icon={RiDatabase2Line} label="Data Points Ingested" value={dashboardStats.dataPoints.value}
            change={dashboardStats.dataPoints.change} up={dashboardStats.dataPoints.up} color="green" />
        </div>
      </div>

      {/* ── Charts Row ── */}
      <div className="row g-3 mb-4">
        {/* Temperature Trend */}
        <div className="col-12 col-xl-8">
          <div className="card-es h-100">
            <div className="card-header-es">
              <h6>Temperature Trend — 2025</h6>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>°C · Monthly averages</span>
            </div>
            <div className="card-body-es">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={tempTrend} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                  <defs>
                    <linearGradient id="gradAvg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#0078b7" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#0078b7" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradMax" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#dc2626" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="°" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="max" stroke="#dc2626" strokeWidth={1.5} fill="url(#gradMax)" name="Max °C" dot={false} />
                  <Area type="monotone" dataKey="avg" stroke="#0078b7" strokeWidth={2} fill="url(#gradAvg)" name="Avg °C" dot={false} />
                  <Area type="monotone" dataKey="min" stroke="#16a34a" strokeWidth={1.5} fill="none" name="Min °C" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* CO₂ Bar */}
        <div className="col-12 col-xl-4">
          <div className="card-es h-100">
            <div className="card-header-es">
              <h6>CO₂ Levels (ppm)</h6>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Monthly</span>
            </div>
            <div className="card-body-es">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={co2Data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[400, 430]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="co2" name="CO₂ ppm" fill="#0078b7" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="baseline" stroke="#dc2626" strokeWidth={1.5} dot={false} name="Baseline" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Row ── */}
      <div className="row g-3">
        {/* Recent Alerts */}
        <div className="col-12 col-lg-6">
          <div className="card-es">
            <div className="card-header-es">
              <h6>Recent Alerts</h6>
              <span style={{
                background: 'var(--danger-bg)', color: 'var(--danger)',
                fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 10,
              }}>
                {unreadAlerts.length} unread
              </span>
            </div>
            <div style={{ padding: '8px 0' }}>
              {alertsData.slice(0, 5).map(alert => (
                <div key={alert.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 20px', borderBottom: '1px solid var(--border-light)',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-page)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: alert.severity === 'critical' ? '#dc2626'
                      : alert.severity === 'high' ? '#ea580c'
                        : alert.severity === 'medium' ? '#d97706' : '#0ea5e9',
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {alert.message}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      {alert.region} · {alert.triggeredAt}
                    </div>
                  </div>
                  {!alert.acknowledged && (
                    <span style={{
                      background: 'var(--danger-bg)', color: 'var(--danger)',
                      fontSize: '0.6rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                    }}>NEW</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Precipitation */}
        <div className="col-12 col-lg-6">
          <div className="card-es">
            <div className="card-header-es">
              <h6>Precipitation (mm)</h6>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Monthly rainfall</span>
            </div>
            <div className="card-body-es">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={precipData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="mm" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="mm" name="Rainfall mm" radius={[4, 4, 0, 0]}>
                    {precipData.map((_, i) => (
                      <rect key={i} fill={`hsl(${207 - i * 3}, 75%, ${48 + i * 1.5}%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top Anomaly Regions */}
        <div className="col-12">
          <div className="card-es">
            <div className="card-header-es">
              <h6>Top Anomaly Regions</h6>
              <button className="btn btn-sm btn-outline-primary" style={{ fontSize: '0.72rem', padding: '3px 10px' }}>
                View All
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="es-table">
                <thead>
                  <tr>
                    <th>Region</th>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Severity</th>
                    <th>Detected</th>
                  </tr>
                </thead>
                <tbody>
                  {anomalyPoints.slice(0, 5).map(pt => (
                    <tr key={pt.id}>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <RiMapPinLine style={{ color: 'var(--primary)', flexShrink: 0 }} />
                          <span style={{ fontWeight: 600 }}>{pt.region}</span>
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{pt.type}</td>
                      <td><code style={{ background: 'var(--bg-page)', padding: '2px 6px', borderRadius: 4, fontSize: '0.78rem' }}>{pt.value}</code></td>
                      <td>
                        <span className={`status-badge ${
                          pt.severity === 'critical' ? 'danger'
                          : pt.severity === 'high' ? 'danger'
                          : pt.severity === 'medium' ? 'warning' : 'info'
                        }`} style={{ textTransform: 'capitalize' }}>
                          {pt.severity}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{pt.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
