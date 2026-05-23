import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  RiTempHotLine, RiAlertLine, RiDatabase2Line,
  RiArrowUpLine, RiArrowDownLine, RiMapPinLine,
  RiSearchLine, RiNavigationLine,
} from 'react-icons/ri';
import { useEffect, useMemo, useState } from 'react';
import { tempTrend } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { alertService, climateService, mlService } from '../services/domainServices';

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

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', fontSize: '0.78rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <p style={{ fontWeight: 700, marginBottom: 4, color: '#1a2332' }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, margin: '2px 0' }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { accessToken } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [records, setRecords] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [liveWeather, setLiveWeather] = useState(null);
  const [weatherSearch, setWeatherSearch] = useState('');
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState('');
  const [message, setMessage] = useState('');

  const loadData = async () => {
    if (!accessToken) return;
    try {
      const [alertRows, climateRows, anomalyRows] = await Promise.all([
        alertService.list(accessToken),
        climateService.records(accessToken),
        climateService.anomalies(accessToken),
      ]);
      setAlerts(Array.isArray(alertRows) ? alertRows : []);
      setRecords(Array.isArray(climateRows) ? climateRows : []);
      setAnomalies(Array.isArray(anomalyRows) ? anomalyRows : []);
    } catch (err) {
      setMessage(err?.message || 'Failed to load dashboard data');
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 30000);
    return () => clearInterval(timer);
  }, [accessToken]);

  const fetchLiveWeather = async (lat, lon, region = 'auto-location') => {
    setWeatherLoading(true);
    setWeatherError('');
    try {
      const response = await mlService.liveWeather(accessToken, {
        latitude: Number(lat),
        longitude: Number(lon),
        region,
      });
      setLiveWeather(response);
    } catch (err) {
      setWeatherError(err?.message || 'Failed to fetch live weather');
    } finally {
      setWeatherLoading(false);
    }
  };

  const handleSearchWeather = async (e) => {
    e.preventDefault();
    if (!weatherSearch.trim()) return;
    setWeatherLoading(true);
    setWeatherError('');
    try {
      const coords = await mlService.cityToCoordinates(accessToken, weatherSearch);
      await fetchLiveWeather(coords.latitude, coords.longitude, coords.name || weatherSearch);
      setWeatherSearch('');
    } catch (err) {
      setWeatherError(err?.message || 'Failed to resolve location');
      setWeatherLoading(false);
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setWeatherError('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchLiveWeather(position.coords.latitude, position.coords.longitude, 'Your Location');
      },
      (err) => {
        setWeatherError('Could not get browser location. Using fallback.');
        fetchLiveWeather(24.8607, 67.0011, 'Karachi (Fallback)');
      }
    );
  };

  useEffect(() => {
    if (!accessToken) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchLiveWeather(position.coords.latitude, position.coords.longitude, 'Your Location');
        },
        () => {
          fetchLiveWeather(24.8607, 67.0011, 'Karachi (Fallback)');
        }
      );
    } else {
      fetchLiveWeather(24.8607, 67.0011, 'Karachi (Fallback)');
    }
  }, [accessToken]);

  const unreadAlerts = alerts.filter((a) => !a.acknowledged);

  const stats = useMemo(() => {
    const temps = records.map((r) => Number(r.temperature)).filter((v) => Number.isFinite(v));
    const avgTemp = temps.length ? (temps.reduce((a, b) => a + b, 0) / temps.length) : 0;
    return {
      avgTemp,
      dataPoints: records.length,
      anomalies: anomalies.length,
      alerts: unreadAlerts.length,
    };
  }, [records, anomalies, unreadAlerts.length]);

  return (
    <div>
      <div className="page-header">
        <h1>Overview Dashboard</h1>
        <p>Real-time climate monitoring • Last updated: {new Date().toLocaleString()}</p>
      </div>

      {message && <div className="alert alert-info" style={{ fontSize: '0.82rem' }}>{message}</div>}

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <StatCard icon={RiTempHotLine} label="Avg. Temperature" value={`${stats.avgTemp.toFixed(2)}°C`} change="Live" up color="orange" />
        </div>
        <div className="col-12 col-md-4">
          <StatCard icon={RiAlertLine} label="Active Alerts" value={String(stats.alerts)} change="Unread" up={stats.alerts > 0} color="red" />
        </div>
        <div className="col-12 col-md-4">
          <StatCard icon={RiDatabase2Line} label="Data Points Ingested" value={stats.dataPoints.toLocaleString()} change={`${stats.anomalies} anomalies`} up color="green" />
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-xl-8">
          <div className="card-es h-100">
            <div className="card-header-es">
              <h6>Temperature Trend • 2025</h6>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>°C • Monthly averages</span>
            </div>
            <div className="card-body-es">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={tempTrend} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                  <defs>
                    <linearGradient id="gradAvg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0078b7" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#0078b7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="°" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="avg" stroke="#0078b7" strokeWidth={2} fill="url(#gradAvg)" name="Avg °C" dot={false} />
                  <Area type="monotone" dataKey="min" stroke="#16a34a" strokeWidth={1.5} fill="none" name="Min °C" dot={false} />
                  <Area type="monotone" dataKey="max" stroke="#dc2626" strokeWidth={1.5} fill="none" name="Max °C" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="card-es h-100">
            <div className="card-header-es d-flex justify-content-between align-items-center">
              <h6>Live Weather Anomaly Check</h6>
              {liveWeather && (
                <span className={`status-badge ${liveWeather.is_anomaly ? 'danger' : 'success'}`}>
                  {liveWeather.is_anomaly ? 'Anomaly' : 'Normal'}
                </span>
              )}
            </div>
            <div className="card-body-es d-flex flex-column justify-content-between" style={{ minHeight: '240px' }}>
              <form onSubmit={handleSearchWeather} className="mb-3">
                <div className="input-group input-group-sm">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search city (e.g. London)..."
                    value={weatherSearch}
                    onChange={(e) => setWeatherSearch(e.target.value)}
                    disabled={weatherLoading}
                  />
                  <button className="btn btn-primary d-flex align-items-center" type="submit" disabled={weatherLoading}>
                    <RiSearchLine />
                  </button>
                  <button 
                    className="btn btn-outline-secondary d-flex align-items-center" 
                    type="button" 
                    onClick={handleUseMyLocation}
                    disabled={weatherLoading}
                    title="Use my location"
                  >
                    <RiNavigationLine />
                  </button>
                </div>
              </form>

              {weatherLoading ? (
                <div className="d-flex flex-column align-items-center justify-content-center py-4 flex-grow-1">
                  <div className="spinner-border text-primary spinner-border-sm mb-2" role="status"></div>
                  <span className="text-muted" style={{ fontSize: '0.78rem' }}>Updating weather data...</span>
                </div>
              ) : weatherError ? (
                <div className="alert alert-danger py-2 px-3 flex-grow-1" style={{ fontSize: '0.78rem' }}>
                  {weatherError}
                </div>
              ) : liveWeather ? (
                <div className="flex-grow-1 d-flex flex-column justify-content-between">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div>
                      <h5 className="mb-0" style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                        {liveWeather.region}
                      </h5>
                      <span className="text-muted" style={{ fontSize: '0.68rem' }}>
                        Lat: {Number(liveWeather.latitude).toFixed(3)} / Lon: {Number(liveWeather.longitude).toFixed(3)}
                      </span>
                    </div>
                    <div className="text-end">
                      <div className="h3 mb-0" style={{ fontWeight: 800, color: 'var(--primary)' }}>
                        {Number(liveWeather.temperature).toFixed(1)}°C
                      </div>
                    </div>
                  </div>

                  <div className="p-2 rounded mb-2" style={{ background: '#f8fafc', border: '1px solid var(--border-light)' }}>
                    <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.75rem' }}>
                      <span className="text-muted">Anomaly Score:</span>
                      <strong className={liveWeather.is_anomaly ? 'text-danger' : 'text-success'}>
                        {Number(liveWeather.anomaly_score).toFixed(4)}
                      </strong>
                    </div>
                    <div className="d-flex justify-content-between" style={{ fontSize: '0.75rem' }}>
                      <span className="text-muted">Status:</span>
                      <span className={`badge ${liveWeather.is_anomaly ? 'bg-danger' : 'bg-success'}`} style={{ fontSize: '0.68rem' }}>
                        {liveWeather.is_anomaly ? 'Anomaly Detected' : 'Normal Temperature'}
                      </span>
                    </div>
                  </div>

                  <div className="d-flex align-items-center justify-content-between text-muted" style={{ fontSize: '0.65rem' }}>
                    <span>Source: {liveWeather.source}</span>
                    <span>Observed: {new Date(liveWeather.observed_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted py-4 flex-grow-1">
                  No weather data loaded
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-lg-5">
          <div className="card-es h-100">
            <div className="card-header-es">
              <h6>Recent Alerts</h6>
              <span style={{ background: 'var(--danger-bg)', color: 'var(--danger)', fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>
                {unreadAlerts.length} unread
              </span>
            </div>
            <div style={{ padding: '8px 0', overflowY: 'auto', maxHeight: 350 }}>
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderBottom: '1px solid var(--border-light)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: alert.severity === 'critical' ? '#dc2626' : alert.severity === 'high' ? '#ea580c' : alert.severity === 'medium' ? '#d97706' : '#0ea5e9' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {alert.message}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      {alert.region} • {new Date(alert.triggered_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
              {!alerts.length && <div className="text-muted px-3 py-2">No alerts yet.</div>}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-7">
          <div className="card-es h-100">
            <div className="card-header-es">
              <h6>Recent Anomaly Regions</h6>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="es-table mb-0">
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
                  {anomalies.slice(0, 5).map((pt) => (
                    <tr key={pt.id}>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <RiMapPinLine style={{ color: 'var(--primary)', flexShrink: 0 }} />
                          <span style={{ fontWeight: 600 }}>{pt.region || 'Unknown'}</span>
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{pt.anomaly_type}</td>
                      <td><code style={{ background: 'var(--bg-page)', padding: '2px 6px', borderRadius: 4, fontSize: '0.78rem' }}>{pt.value ?? '-'}</code></td>
                      <td>
                        <span className={`status-badge ${pt.severity === 'critical' || pt.severity === 'high' ? 'danger' : pt.severity === 'medium' ? 'warning' : 'info'}`} style={{ textTransform: 'capitalize' }}>
                          {pt.severity}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{pt.detected_at ? new Date(pt.detected_at).toLocaleString() : '-'}</td>
                    </tr>
                  ))}
                  {!anomalies.length && (
                    <tr><td colSpan="5" className="text-center text-muted py-3">No anomalies detected yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
