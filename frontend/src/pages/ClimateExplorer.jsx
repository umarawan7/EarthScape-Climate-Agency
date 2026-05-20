import { useState } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, ZAxis,
} from 'recharts';
import { RiFilterLine, RiDownload2Line, RiCalendarLine } from 'react-icons/ri';
import { tempTrend, co2Data, precipData, regionOptions } from '../data/mockData';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', fontSize: '0.78rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <p style={{ fontWeight: 700, marginBottom: 4, color: '#1a2332' }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color, margin: '2px 0' }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

export default function ClimateExplorer() {
  const [region,    setRegion]    = useState('Global');
  const [variable,  setVariable]  = useState('temperature');
  const [chartType, setChartType] = useState('area');

  const dataMap = {
    temperature: { data: tempTrend, key: 'avg', name: 'Avg Temp °C', color: '#0078b7', unit: '°C' },
    co2:         { data: co2Data,   key: 'co2',  name: 'CO₂ ppm',    color: '#16a34a', unit: 'ppm' },
    precipitation:{ data: precipData, key: 'mm', name: 'Rainfall mm', color: '#7c3aed', unit: 'mm' },
  };
  const { data, key, name, color, unit } = dataMap[variable];

  const corrData = tempTrend.map((t, i) => ({
    temp: t.avg,
    co2: co2Data[i]?.co2 || 0,
  }));

  return (
    <div>
      <div className="page-header">
        <h1>Climate Explorer</h1>
        <p>Filter, compare, and visualize historical climate data across regions and variables</p>
      </div>

      {/* ── Filters ── */}
      <div className="card-es mb-4">
        <div className="card-body-es">
          <div className="row g-3 align-items-end">
            <div className="col-6 col-md-3">
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Region</label>
              <select id="region-select" className="form-select form-select-sm" value={region} onChange={e => setRegion(e.target.value)}>
                {regionOptions.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Variable</label>
              <select id="variable-select" className="form-select form-select-sm" value={variable} onChange={e => setVariable(e.target.value)}>
                <option value="temperature">Temperature</option>
                <option value="co2">CO₂ Level</option>
                <option value="precipitation">Precipitation</option>
              </select>
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Chart Type</label>
              <select id="chart-type-select" className="form-select form-select-sm" value={chartType} onChange={e => setChartType(e.target.value)}>
                <option value="area">Area Chart</option>
                <option value="line">Line Chart</option>
                <option value="bar">Bar Chart</option>
              </select>
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Date Range</label>
              <select className="form-select form-select-sm" id="date-range-select">
                <option>Jan – Dec 2025</option>
                <option>Jan – Dec 2024</option>
                <option>Last 3 months</option>
              </select>
            </div>
            <div className="col-12 col-md-auto">
              <button id="apply-filter-btn" className="btn btn-primary btn-sm d-flex align-items-center gap-2">
                <RiFilterLine /> Apply Filters
              </button>
            </div>
            <div className="col-12 col-md-auto">
              <button id="export-btn" className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2">
                <RiDownload2Line /> Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Chart ── */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-xl-8">
          <div className="card-es">
            <div className="card-header-es">
              <h6>{name} — {region}</h6>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Monthly · 2025</span>
            </div>
            <div className="card-body-es">
              <ResponsiveContainer width="100%" height={300}>
                {chartType === 'area' ? (
                  <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                    <defs>
                      <linearGradient id="explorerGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={color} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit={unit} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey={key} name={name} stroke={color} strokeWidth={2.5} fill="url(#explorerGrad)" dot={{ fill: color, r: 3 }} />
                  </AreaChart>
                ) : chartType === 'line' ? (
                  <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit={unit} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey={key} name={name} stroke={color} strokeWidth={2.5} dot={{ fill: color, r: 3 }} />
                  </LineChart>
                ) : (
                  <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit={unit} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey={key} name={name} fill={color} radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Summary stats */}
        <div className="col-12 col-xl-4">
          <div className="card-es h-100">
            <div className="card-header-es"><h6>Summary Statistics</h6></div>
            <div className="card-body-es">
              {[
                { label: 'Mean',   value: variable === 'temperature' ? '23.9°C' : variable === 'co2' ? '421.4 ppm' : '78.8 mm' },
                { label: 'Max',    value: variable === 'temperature' ? '34.2°C' : variable === 'co2' ? '425.0 ppm' : '145 mm' },
                { label: 'Min',    value: variable === 'temperature' ? '14.2°C' : variable === 'co2' ? '417.4 ppm' : '35 mm' },
                { label: 'Std Dev',value: variable === 'temperature' ? '±7.2°C' : variable === 'co2' ? '±2.3 ppm' : '±36.4 mm' },
                { label: 'Trend',  value: variable === 'temperature' ? '+0.8°C/yr' : variable === 'co2' ? '+2.4 ppm/yr' : 'Stable' },
                { label: 'Anomaly Count', value: variable === 'temperature' ? '3 events' : variable === 'co2' ? '2 events' : '5 events' },
              ].map(stat => (
                <div key={stat.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 0', borderBottom: '1px solid var(--border-light)',
                }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{stat.label}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Correlation & Precipitation ── */}
      <div className="row g-3">
        <div className="col-12 col-lg-6">
          <div className="card-es">
            <div className="card-header-es">
              <h6>Temperature vs CO₂ Correlation</h6>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Pearson r = 0.87</span>
            </div>
            <div className="card-body-es">
              <ResponsiveContainer width="100%" height={220}>
                <ScatterChart margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="temp" name="Temp" unit="°C" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="co2"  name="CO₂"  unit="ppm" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <ZAxis range={[40, 40]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={corrData} fill="#0078b7" opacity={0.75} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card-es">
            <div className="card-header-es">
              <h6>All Variables — Monthly Overview</h6>
            </div>
            <div className="card-body-es">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={tempTrend} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="avg" name="Avg Temp" stroke="#0078b7" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="max" name="Max Temp" stroke="#dc2626" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                  <Line type="monotone" dataKey="min" name="Min Temp" stroke="#16a34a" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
