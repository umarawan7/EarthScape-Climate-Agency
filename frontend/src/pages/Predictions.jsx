import { useEffect, useMemo, useState } from 'react';
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { RiBrainLine, RiArrowUpLine, RiArrowDownLine, RiTimeLine, RiSearchLine } from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';
import { climateService, mlService } from '../services/domainServices';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', fontSize: '0.78rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <p style={{ fontWeight: 700, marginBottom: 4, color: '#1a2332' }}>{label}</p>
      {payload.map((p) => p.value !== null && (
        <p key={p.name} style={{ color: p.color, margin: '2px 0' }}>{p.name}: <strong>{typeof p.value === 'number' ? `${p.value.toFixed(2)}°C` : p.value}</strong></p>
      ))}
    </div>
  );
};

function normalizePredictions(records) {
  const sorted = [...records]
    .filter((r) => r.target_date || r.created_at)
    .sort((a, b) => new Date(a.target_date || a.created_at) - new Date(b.target_date || b.created_at));

  return sorted.slice(-30).map((row) => {
    const pointDate = new Date(row.target_date || row.created_at);
    const dateLabel = pointDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const predicted = Number(row.predicted_temp ?? row.predicted_temperature_c ?? 0);
    const spread = Math.max(0.5, Math.abs(predicted) * 0.03);
    return {
      date: dateLabel,
      actual: null,
      predicted,
      upper: +(predicted + spread).toFixed(2),
      lower: +(predicted - spread).toFixed(2),
    };
  });
}

function extractLocations(records) {
  const map = new Map(); // region -> { latitude, longitude }
  for (const r of records) {
    const region = String(r.region || '').trim();
    if (region && region !== 'Global' && !map.has(region)) {
      const lat = Number(r.latitude);
      const lon = Number(r.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        map.set(region, { latitude: lat, longitude: lon });
      }
    }
  }
  return map;
}

export default function Predictions() {
  const { accessToken } = useAuth();
  const [locationInput, setLocationInput] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedCoords, setSelectedCoords] = useState({ latitude: 0, longitude: 0 });
  const [horizon, setHorizon] = useState('14');
  const [chartData, setChartData] = useState([]);
  const [models, setModels] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Load existing predictions + model list + climate records for location lookup
  const loadData = async () => {
    if (!accessToken) return;
    try {
      const [predictionRows, modelRows, climateRows] = await Promise.all([
        climateService.predictions(accessToken),
        mlService.models(accessToken),
        climateService.records(accessToken),
      ]);
      setChartData(normalizePredictions(Array.isArray(predictionRows) ? predictionRows : []));
      setModels(Array.isArray(modelRows) ? modelRows : []);
      setRecords(Array.isArray(climateRows) ? climateRows : []);
    } catch (err) {
      setMessage(err?.message || 'Failed to load model data');
    }
  };

  useEffect(() => { loadData(); }, [accessToken]);

  const locationMap = useMemo(() => extractLocations(records), [records]);
  const locationOptions = useMemo(() => Array.from(locationMap.keys()).sort(), [locationMap]);

  // Resolve coordinates for a location string
  const resolveCoords = async (locStr) => {
    const trimmed = locStr.trim();
    if (!trimmed) return null;

    // 1. Exact match from DB records
    if (locationMap.has(trimmed)) return locationMap.get(trimmed);

    // 2. Partial match from DB records
    for (const [key, coords] of locationMap.entries()) {
      if (key.toLowerCase().includes(trimmed.toLowerCase()) || trimmed.toLowerCase().includes(key.toLowerCase())) {
        return coords;
      }
    }

    // 3. Fallback: geocode via Open-Meteo
    try {
      const result = await mlService.cityToCoordinates(accessToken, trimmed);
      return { latitude: result.latitude, longitude: result.longitude };
    } catch {
      return null;
    }
  };

  const handleLocationSearch = async (e) => {
    e.preventDefault();
    if (!locationInput.trim()) return;
    const coords = await resolveCoords(locationInput);
    if (coords) {
      setSelectedLocation(locationInput.trim());
      setSelectedCoords(coords);
      setMessage('');
    } else {
      setMessage(`Could not resolve location: "${locationInput}". Try a different city or country.`);
    }
  };

  const runForecast = async () => {
    if (!accessToken) return;
    if (!selectedLocation) {
      setMessage('Please search and select a location first.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const today = new Date();
      const total = Number(horizon);
      const calls = [];

      for (let i = 0; i < total; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        calls.push(
          mlService.forecast(accessToken, {
            year: d.getFullYear(),
            month: d.getMonth() + 1,
            day: d.getDate(),
            latitude: selectedCoords.latitude,
            longitude: selectedCoords.longitude,
            region: selectedLocation,
          })
        );
      }
      await Promise.all(calls);
      setMessage(`Forecast for "${selectedLocation}" completed and stored.`);
      await loadData();
    } catch (err) {
      setMessage(err?.message || 'Forecast run failed');
    } finally {
      setLoading(false);
    }
  };

  const todayIdx = chartData.findIndex((d) => d.actual === null);
  const todayLabel = chartData[todayIdx]?.date;

  const summary = useMemo(() => {
    if (!chartData.length) return { peak: 0, low: 0, mean: 0 };
    const values = chartData.map((d) => d.predicted).filter((v) => Number.isFinite(v));
    if (!values.length) return { peak: 0, low: 0, mean: 0 };
    const peak = Math.max(...values);
    const low = Math.min(...values);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return { peak, low, mean };
  }, [chartData]);

  return (
    <div>
      <div className="page-header">
        <h1>ML Predictions</h1>
        <p>Machine learning-powered climate forecasting with daily resolution and confidence intervals</p>
      </div>

      {message && <div className="alert alert-info" style={{ fontSize: '0.82rem' }}>{message}</div>}

      {/* ── Control bar ── */}
      <div className="card-es mb-4">
        <div className="card-body-es">
          <div className="row g-3 align-items-end">
            {/* Location search */}
            <div className="col-12 col-md-5">
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Location (Country / City)
              </label>
              <form onSubmit={handleLocationSearch} className="d-flex gap-2">
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    id="pred-location-input"
                    type="text"
                    className="form-control form-control-sm"
                    placeholder='e.g. "Pakistan", "London"…'
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    list="pred-location-datalist"
                  />
                  <datalist id="pred-location-datalist">
                    {locationOptions.map((loc) => (
                      <option key={loc} value={loc} />
                    ))}
                  </datalist>
                </div>
                <button type="submit" className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1" style={{ whiteSpace: 'nowrap' }}>
                  <RiSearchLine /> Search
                </button>
              </form>
              {selectedLocation && (
                <div style={{ fontSize: '0.72rem', color: 'var(--success)', marginTop: 4, fontWeight: 600 }}>
                  ✓ {selectedLocation} — Lat: {selectedCoords.latitude.toFixed(3)}, Lon: {selectedCoords.longitude.toFixed(3)}
                </div>
              )}
            </div>

            {/* Horizon */}
            <div className="col-6 col-md-3">
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Forecast Horizon</label>
              <select id="pred-horizon" className="form-select form-select-sm" value={horizon} onChange={(e) => setHorizon(e.target.value)}>
                <option value="7">7 Days</option>
                <option value="14">14 Days</option>
                <option value="30">30 Days</option>
              </select>
            </div>

            {/* Run button */}
            <div className="col-12 col-md-auto">
              <button
                id="run-prediction-btn"
                className="btn btn-primary btn-sm d-flex align-items-center gap-2"
                onClick={runForecast}
                disabled={loading || !selectedLocation}
              >
                <RiBrainLine /> {loading ? 'Running…' : 'Run Prediction'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Chart + summary ── */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-xl-8">
          <div className="card-es">
            <div className="card-header-es">
              <h6>Temperature Forecast{selectedLocation ? ` — ${selectedLocation}` : ''}</h6>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, background: '#16a34a', borderRadius: '50%', display: 'inline-block' }} />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Model active — {horizon}-day horizon (daily resolution)</span>
              </div>
            </div>
            <div className="card-body-es">
              {chartData.length === 0 ? (
                <div className="text-muted text-center py-5">
                  Select a location, then click <strong>Run Prediction</strong> to generate a daily forecast.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={chartData} margin={{ top: 4, right: 12, bottom: 0, left: -10 }}>
                    <defs>
                      <linearGradient id="confBand" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0078b7" stopOpacity={0.08} />
                        <stop offset="95%" stopColor="#0078b7" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="°" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="upper" stroke="none" fill="url(#confBand)" name="Upper Bound" legendType="none" />
                    <Area type="monotone" dataKey="lower" stroke="none" fill="#fff" name="Lower Bound" legendType="none" />
                    {todayLabel && (
                      <ReferenceLine x={todayLabel} stroke="#d97706" strokeDasharray="5 3" label={{ value: 'Today', fill: '#d97706', fontSize: 11, position: 'top' }} />
                    )}
                    <Line type="monotone" dataKey="predicted" name="Predicted °C" stroke="#dc2626" strokeWidth={2} strokeDasharray="5 3" dot={false} />
                    <Line type="monotone" dataKey="upper" name="Upper 95% CI" stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 3" dot={false} />
                    <Line type="monotone" dataKey="lower" name="Lower 95% CI" stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 3" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="card-es h-100">
            <div className="card-header-es"><h6>Forecast Summary</h6></div>
            <div className="card-body-es">
              {[
                { label: 'Forecast Peak', value: `${summary.peak.toFixed(2)}°C`, sub: 'Highest in horizon', icon: RiArrowUpLine, color: '#dc2626' },
                { label: 'Forecast Low', value: `${summary.low.toFixed(2)}°C`, sub: 'Lowest in horizon', icon: RiArrowDownLine, color: '#0078b7' },
                { label: 'Model Mean', value: `${summary.mean.toFixed(2)}°C`, sub: 'Average forecast', icon: RiBrainLine, color: '#16a34a' },
                { label: 'Active Models', value: String(models.length), sub: 'Registered models', icon: RiTimeLine, color: '#d97706' },
              ].map((m) => (
                <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: `${m.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.color, fontSize: 18 }}>
                    <m.icon />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{m.label}</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{m.value}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{m.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Model registry ── */}
      <div className="card-es">
        <div className="card-header-es">
          <h6>Model Registry</h6>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{models.length} models registered</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="es-table">
            <thead>
              <tr>
                <th>Model Name</th>
                <th>Type</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {models.map((m) => (
                <tr key={m.name}>
                  <td style={{ fontWeight: 600 }}>{m.name}</td>
                  <td style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.78rem' }}>{m.type}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{new Date(m.updated_at).toLocaleString()}</td>
                </tr>
              ))}
              {!models.length && (
                <tr><td colSpan="3" className="text-center text-muted">No models found yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
