import { useEffect, useMemo, useState } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { RiFilterLine, RiDownload2Line } from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';
import { climateService } from '../services/domainServices';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', fontSize: '0.78rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <p style={{ fontWeight: 700, marginBottom: 4, color: '#1a2332' }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, margin: '2px 0' }}>{p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</strong></p>
      ))}
    </div>
  );
};

function buildTemperatureSeries(records, location) {
  const normalized = location.trim().toLowerCase();
  const filtered = records.filter((r) => {
    if (!normalized || normalized === 'global') return true;
    return String(r.region || '').toLowerCase().includes(normalized);
  });
  if (!filtered.length) return [];

  const grouped = new Map();
  for (const row of filtered) {
    const ts = new Date(row.timestamp);
    if (Number.isNaN(ts.getTime())) continue;
    const key = ts.getMonth();
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(Number(row.temperature));
  }

  return MONTH_NAMES.map((month, idx) => {
    const values = (grouped.get(idx) || []).filter((v) => Number.isFinite(v));
    if (!values.length) return { month, avg: null, min: null, max: null };
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    return { month, avg: +avg.toFixed(2), min: +min.toFixed(2), max: +max.toFixed(2) };
  }).filter((d) => d.avg !== null);
}

function extractLocations(records) {
  const seen = new Set();
  const locs = [];
  for (const r of records) {
    const region = String(r.region || '').trim();
    if (region && region !== 'Global' && !seen.has(region)) {
      seen.add(region);
      locs.push(region);
    }
  }
  return locs.sort();
}

function exportToCSV(data, filename = 'climate_data.csv') {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h] ?? '';
      return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
    }).join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function ClimateExplorer() {
  const { accessToken } = useAuth();
  const [location, setLocation] = useState('Global');
  const [locationInput, setLocationInput] = useState('');
  const [chartType, setChartType] = useState('area');
  const [records, setRecords] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!accessToken) return;
      try {
        const rows = await climateService.records(accessToken);
        setRecords(Array.isArray(rows) ? rows : []);
      } catch (err) {
        setMessage(err?.message || 'Failed to load climate records');
      }
    };
    load();
  }, [accessToken]);

  const locationOptions = useMemo(() => extractLocations(records), [records]);

  const temperatureData = useMemo(() => buildTemperatureSeries(records, location), [records, location]);

  const handleApply = () => {
    setLocation(locationInput.trim() || 'Global');
  };

  const handleExport = () => {
    if (!temperatureData.length) {
      setMessage('No data to export for the current selection.');
      return;
    }
    const exportData = temperatureData.map((d) => ({
      month: d.month,
      location,
      avg_temperature_c: d.avg,
      min_temperature_c: d.min,
      max_temperature_c: d.max,
    }));
    exportToCSV(exportData, `climate_${location.replace(/[^a-z0-9]/gi, '_')}.csv`);
  };

  const color = '#0078b7';
  const unit = '°C';

  const statData = temperatureData.filter((d) => d.avg !== null);
  const statValues = statData.map((d) => d.avg);
  const mean = statValues.length ? (statValues.reduce((a, b) => a + b, 0) / statValues.length).toFixed(2) : '-';
  const maxVal = statValues.length ? Math.max(...statValues).toFixed(2) : '-';
  const minVal = statValues.length ? Math.min(...statValues).toFixed(2) : '-';

  return (
    <div>
      <div className="page-header">
        <h1>Climate Explorer</h1>
        <p>Filter and visualize historical temperature data by location</p>
      </div>

      {message && <div className="alert alert-info" style={{ fontSize: '0.82rem' }}>{message}</div>}

      {/* ── Filter bar ── */}
      <div className="card-es mb-4">
        <div className="card-body-es">
          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-5">
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Location (Country / City)
              </label>
              <input
                id="location-search"
                type="text"
                className="form-control form-control-sm"
                placeholder='Search e.g. "Pakistan", "London"…'
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                list="location-datalist"
              />
              <datalist id="location-datalist">
                <option value="Global" />
                {locationOptions.map((loc) => (
                  <option key={loc} value={loc} />
                ))}
              </datalist>
            </div>

            <div className="col-6 col-md-3">
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Chart Type</label>
              <select id="chart-type-select" className="form-select form-select-sm" value={chartType} onChange={(e) => setChartType(e.target.value)}>
                <option value="area">Area Chart</option>
                <option value="line">Line Chart</option>
                <option value="bar">Bar Chart</option>
              </select>
            </div>

            <div className="col-auto">
              <button id="apply-filter-btn" className="btn btn-primary btn-sm d-flex align-items-center gap-2" onClick={handleApply}>
                <RiFilterLine /> Apply Filters
              </button>
            </div>
            <div className="col-auto">
              <button id="export-btn" className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2" onClick={handleExport}>
                <RiDownload2Line /> Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main chart + stats ── */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-xl-8">
          <div className="card-es">
            <div className="card-header-es">
              <h6>Average Temperature °C — {location}</h6>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Monthly aggregated</span>
            </div>
            <div className="card-body-es">
              {temperatureData.length === 0 ? (
                <div className="text-muted text-center py-5">
                  {records.length === 0 ? 'Loading data…' : 'No records found for this location.'}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  {chartType === 'area' ? (
                    <AreaChart data={temperatureData} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                      <defs>
                        <linearGradient id="explorerGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit={unit} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Area type="monotone" dataKey="avg" name="Avg °C" stroke={color} strokeWidth={2.5} fill="url(#explorerGrad)" dot={{ fill: color, r: 3 }} />
                      <Area type="monotone" dataKey="max" name="Max °C" stroke="#dc2626" strokeWidth={1.5} fill="none" dot={false} strokeDasharray="4 2" />
                      <Area type="monotone" dataKey="min" name="Min °C" stroke="#16a34a" strokeWidth={1.5} fill="none" dot={false} strokeDasharray="4 2" />
                    </AreaChart>
                  ) : chartType === 'line' ? (
                    <LineChart data={temperatureData} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit={unit} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="avg" name="Avg °C" stroke={color} strokeWidth={2.5} dot={{ fill: color, r: 3 }} />
                      <Line type="monotone" dataKey="max" name="Max °C" stroke="#dc2626" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                      <Line type="monotone" dataKey="min" name="Min °C" stroke="#16a34a" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                    </LineChart>
                  ) : (
                    <BarChart data={temperatureData} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit={unit} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="avg" name="Avg °C" fill={color} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="card-es h-100">
            <div className="card-header-es"><h6>Summary Statistics</h6></div>
            <div className="card-body-es">
              {[
                { label: 'Mean Temp', value: mean !== '-' ? `${mean} °C` : '—' },
                { label: 'Max Temp', value: maxVal !== '-' ? `${maxVal} °C` : '—' },
                { label: 'Min Temp', value: minVal !== '-' ? `${minVal} °C` : '—' },
                { label: 'Months with data', value: String(statData.length) },
                { label: 'Total Records', value: records.length.toLocaleString() },
                { label: 'Locations in DB', value: locationOptions.length.toLocaleString() },
              ].map((stat) => (
                <div key={stat.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{stat.label}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Min / Max / Avg multi-line overview ── */}
      <div className="card-es">
        <div className="card-header-es">
          <h6>Temperature Range Overview — {location}</h6>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Avg / Min / Max per month</span>
        </div>
        <div className="card-body-es">
          {temperatureData.length === 0 ? (
            <div className="text-muted text-center py-4">No data available.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={temperatureData} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="°" />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="avg" name="Avg Temp" stroke="#0078b7" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="max" name="Max Temp" stroke="#dc2626" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                <Line type="monotone" dataKey="min" name="Min Temp" stroke="#16a34a" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
