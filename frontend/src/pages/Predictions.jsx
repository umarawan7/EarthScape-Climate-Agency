import { useState } from 'react';
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { RiBrainLine, RiArrowUpLine, RiArrowDownLine, RiTimeLine } from 'react-icons/ri';
import { predictionData, regionOptions } from '../data/mockData';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', fontSize: '0.78rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <p style={{ fontWeight: 700, marginBottom: 4, color: '#1a2332' }}>{label}</p>
      {payload.map(p => p.value !== null && (
        <p key={p.name} style={{ color: p.color, margin: '2px 0' }}>{p.name}: <strong>{typeof p.value === 'number' ? `${p.value}°C` : p.value}</strong></p>
      ))}
    </div>
  );
};

const MODELS = [
  { id: 'temp_lr',  name: 'Temperature Trend Predictor', algo: 'Linear Regression (MLlib)', rmse: '0.84°C', r2: '0.91', status: 'active',  trained: '2025-05-10' },
  { id: 'anomaly',  name: 'Anomaly Detector',            algo: 'Isolation Forest (Sklearn)', rmse: 'N/A',    r2: 'N/A',  status: 'active',  trained: '2025-05-08' },
  { id: 'co2_corr', name: 'CO₂ Correlation Analyzer',   algo: 'Pearson / PySpark',          rmse: 'N/A',    r2: '0.87', status: 'active',  trained: '2025-05-12' },
  { id: 'precip',   name: 'Precipitation Classifier',   algo: 'Random Forest (MLlib)',      rmse: '12.4mm', r2: '0.78', status: 'training',trained: 'In progress' },
];

export default function Predictions() {
  const [region, setRegion] = useState('South Asia');
  const [horizon, setHorizon] = useState('7');

  const todayIdx = predictionData.findIndex(d => d.actual === null);
  const todayLabel = predictionData[todayIdx]?.date;

  return (
    <div>
      <div className="page-header">
        <h1>ML Predictions</h1>
        <p>Machine learning–powered climate forecasting with confidence intervals</p>
      </div>

      {/* ── Controls ── */}
      <div className="card-es mb-4">
        <div className="card-body-es">
          <div className="row g-3 align-items-end">
            <div className="col-6 col-md-4">
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Region</label>
              <select id="pred-region" className="form-select form-select-sm" value={region} onChange={e => setRegion(e.target.value)}>
                {regionOptions.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="col-6 col-md-4">
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Forecast Horizon</label>
              <select id="pred-horizon" className="form-select form-select-sm" value={horizon} onChange={e => setHorizon(e.target.value)}>
                <option value="7">7 Days</option>
                <option value="14">14 Days</option>
                <option value="30">30 Days</option>
              </select>
            </div>
            <div className="col-12 col-md-4">
              <button id="run-prediction-btn" className="btn btn-primary btn-sm d-flex align-items-center gap-2">
                <RiBrainLine /> Run Prediction
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Forecast Chart ── */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-xl-8">
          <div className="card-es">
            <div className="card-header-es">
              <h6>Temperature Forecast — {region}</h6>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, background: '#16a34a', borderRadius: '50%', display: 'inline-block' }} />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Model active · {horizon}-day horizon</span>
              </div>
            </div>
            <div className="card-body-es">
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={predictionData} margin={{ top: 4, right: 12, bottom: 0, left: -10 }}>
                  <defs>
                    <linearGradient id="confBand" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#0078b7" stopOpacity={0.08} />
                      <stop offset="95%" stopColor="#0078b7" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[26, 40]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="°" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />

                  {/* Confidence band */}
                  <Area type="monotone" dataKey="upper" stroke="none" fill="url(#confBand)" name="Upper Bound" legendType="none" />
                  <Area type="monotone" dataKey="lower" stroke="none" fill="#fff" name="Lower Bound" legendType="none" />

                  {/* Today line */}
                  {todayLabel && (
                    <ReferenceLine x={todayLabel} stroke="#d97706" strokeDasharray="5 3" label={{ value: 'Today', fill: '#d97706', fontSize: 11, position: 'top' }} />
                  )}

                  <Line type="monotone" dataKey="actual"    name="Actual °C"    stroke="#0078b7" strokeWidth={2.5} dot={{ r: 4, fill: '#0078b7' }} connectNulls={false} />
                  <Line type="monotone" dataKey="predicted" name="Predicted °C"  stroke="#dc2626" strokeWidth={2} strokeDasharray="5 3" dot={false} />
                  <Line type="monotone" dataKey="upper"     name="Upper 95% CI" stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 3" dot={false} />
                  <Line type="monotone" dataKey="lower"     name="Lower 95% CI" stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 3" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Prediction metrics */}
        <div className="col-12 col-xl-4">
          <div className="card-es h-100">
            <div className="card-header-es"><h6>Forecast Summary</h6></div>
            <div className="card-body-es">
              {[
                { label: 'Forecast Peak',   value: '35.2°C', sub: 'May 22, 2025',    icon: RiArrowUpLine,   color: '#dc2626' },
                { label: 'Forecast Low',    value: '30.5°C', sub: 'May 27, 2025',    icon: RiArrowDownLine, color: '#0078b7' },
                { label: 'Model RMSE',      value: '0.84°C', sub: 'Training score',  icon: RiBrainLine,     color: '#16a34a' },
                { label: 'Avg Confidence',  value: '91%',    sub: 'Within CI band',  icon: RiTimeLine,      color: '#d97706' },
              ].map(m => (
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

      {/* ── Model Registry ── */}
      <div className="card-es">
        <div className="card-header-es">
          <h6>Model Registry</h6>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{MODELS.length} models registered</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="es-table">
            <thead>
              <tr>
                <th>Model Name</th>
                <th>Algorithm</th>
                <th>RMSE</th>
                <th>R²</th>
                <th>Status</th>
                <th>Last Trained</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {MODELS.map(m => (
                <tr key={m.id}>
                  <td style={{ fontWeight: 600 }}>{m.name}</td>
                  <td style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.78rem' }}>{m.algo}</td>
                  <td><code style={{ background: 'var(--bg-page)', padding: '2px 6px', borderRadius: 4, fontSize: '0.78rem' }}>{m.rmse}</code></td>
                  <td><code style={{ background: 'var(--bg-page)', padding: '2px 6px', borderRadius: 4, fontSize: '0.78rem' }}>{m.r2}</code></td>
                  <td>
                    <span className={`status-badge ${m.status === 'active' ? 'success' : 'warning'}`} style={{ textTransform: 'capitalize' }}>
                      {m.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{m.trained}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary" style={{ fontSize: '0.72rem', padding: '3px 10px' }} id={`retrain-${m.id}`}>
                      Retrain
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
