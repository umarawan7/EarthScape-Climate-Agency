import { useState } from 'react';
import { ingestionLogs, sparkJobs } from '../data/mockData';
import {
  RiUploadCloud2Line, RiCheckLine, RiCloseLine, RiTimeLine,
  RiPlayLine, RiRefreshLine, RiDatabase2Line,
} from 'react-icons/ri';

function StatusBadge({ status }) {
  const map = {
    success:   'success',
    failed:    'danger',
    running:   'info',
    queued:    'muted',
    completed: 'success',
    training:  'info',
    in_progress: 'info',
    open:      'warning',
    resolved:  'success',
  };
  return (
    <span className={`status-badge ${map[status] || 'muted'}`} style={{ textTransform: 'capitalize' }}>
      {status?.replace('_', ' ')}
    </span>
  );
}

export default function IngestionMonitor() {
  const [dragOver, setDragOver] = useState(false);
  const [uploaded, setUploaded] = useState([]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    setUploaded(prev => [...prev, ...files.map(f => ({ name: f.name, size: (f.size / 1024 / 1024).toFixed(1) + ' MB', status: 'queued' }))]);
  };

  const totals = {
    records: ingestionLogs.reduce((s, l) => s + l.records, 0),
    success: ingestionLogs.filter(l => l.status === 'success').length,
    failed:  ingestionLogs.filter(l => l.status === 'failed').length,
  };

  return (
    <div>
      <div className="page-header">
        <h1>Ingestion Monitor</h1>
        <p>Upload datasets, track ingestion history, and manage PySpark batch jobs</p>
      </div>

      {/* ── Summary stats ── */}
      <div className="row g-3 mb-4">
        {[
          { icon: RiDatabase2Line, label: 'Total Records',    value: (totals.records / 1e6).toFixed(2) + 'M', color: 'blue'  },
          { icon: RiCheckLine,     label: 'Successful Runs',  value: totals.success,                          color: 'green' },
          { icon: RiCloseLine,     label: 'Failed Runs',      value: totals.failed,                           color: 'red'   },
          { icon: RiTimeLine,      label: 'Spark Jobs Active', value: sparkJobs.filter(j => j.status === 'running').length, color: 'orange' },
        ].map(s => (
          <div className="col-6 col-md-3" key={s.label}>
            <div className={`stat-card ${s.color}`}>
              <div className={`stat-icon ${s.color}`}><s.icon /></div>
              <div className="stat-body">
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ fontSize: '1.4rem' }}>{s.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-3 mb-4">
        {/* ── Upload ── */}
        <div className="col-12 col-lg-5">
          <div className="card-es h-100">
            <div className="card-header-es"><h6>Upload Dataset</h6></div>
            <div className="card-body-es">
              <div
                id="drop-zone"
                className={`upload-zone${dragOver ? ' dragover' : ''}`}
                style={dragOver ? { borderColor: 'var(--primary-dark)', background: '#c8e8f6' } : {}}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input').click()}
              >
                <RiUploadCloud2Line className="upload-icon" />
                <h5>Drag & Drop Files Here</h5>
                <p>Supports CSV and JSON · Up to 5 GB per file</p>
                <input type="file" id="file-input" accept=".csv,.json" multiple style={{ display: 'none' }}
                  onChange={e => {
                    const files = Array.from(e.target.files);
                    setUploaded(prev => [...prev, ...files.map(f => ({ name: f.name, size: (f.size / 1024 / 1024).toFixed(1) + ' MB', status: 'queued' }))]);
                  }}
                />
              </div>

              {uploaded.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>QUEUED FILES</div>
                  {uploaded.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-page)', borderRadius: 8, marginBottom: 6 }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{f.name}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{f.size}</div>
                      </div>
                      <StatusBadge status={f.status} />
                    </div>
                  ))}
                  <button className="btn btn-primary btn-sm w-100 mt-2" id="start-ingestion-btn">
                    Start Ingestion
                  </button>
                </div>
              )}

              {/* Schedule */}
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>Schedule Recurring Ingestion</div>
                <div className="row g-2">
                  <div className="col-8">
                    <select className="form-select form-select-sm" id="schedule-interval">
                      <option>Every hour</option>
                      <option>Every 6 hours</option>
                      <option>Daily at midnight</option>
                      <option>Weekly on Monday</option>
                    </select>
                  </div>
                  <div className="col-4">
                    <button id="schedule-btn" className="btn btn-outline-primary btn-sm w-100">Set</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Spark Jobs ── */}
        <div className="col-12 col-lg-7">
          <div className="card-es h-100">
            <div className="card-header-es">
              <h6>PySpark Jobs</h6>
              <button id="run-job-btn" className="btn btn-sm btn-primary d-flex align-items-center gap-2" style={{ fontSize: '0.72rem', padding: '4px 12px' }}>
                <RiPlayLine /> Run Job
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="es-table">
                <thead>
                  <tr>
                    <th>Job ID</th>
                    <th>Script</th>
                    <th>Status</th>
                    <th>Records</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {sparkJobs.map(job => (
                    <tr key={job.id}>
                      <td><code style={{ fontSize: '0.75rem', background: 'var(--bg-page)', padding: '2px 6px', borderRadius: 4 }}>{job.id}</code></td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{job.name}</td>
                      <td><StatusBadge status={job.status} /></td>
                      <td style={{ fontSize: '0.8rem' }}>{job.records > 0 ? job.records.toLocaleString() : '—'}</td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{job.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ── Ingestion History ── */}
      <div className="card-es">
        <div className="card-header-es">
          <h6>Ingestion History</h6>
          <button id="refresh-ingestion-btn" className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" style={{ fontSize: '0.72rem', padding: '3px 10px' }}>
            <RiRefreshLine /> Refresh
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="es-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Source File</th>
                <th>Format</th>
                <th>Records</th>
                <th>Size</th>
                <th>Status</th>
                <th>Ingested At</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {ingestionLogs.map(log => (
                <tr key={log.id}>
                  <td><code style={{ fontSize: '0.72rem', background: 'var(--bg-page)', padding: '2px 6px', borderRadius: 4 }}>{log.id}</code></td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{log.source}</div>
                  </td>
                  <td>
                    <span style={{ background: log.format === 'CSV' ? 'var(--primary-light)' : 'var(--success-bg)', color: log.format === 'CSV' ? 'var(--primary)' : 'var(--success)', fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px', borderRadius: 4 }}>
                      {log.format}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>{log.records > 0 ? log.records.toLocaleString() : '—'}</td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{log.size}</td>
                  <td><StatusBadge status={log.status} /></td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.ingestedAt}</td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
