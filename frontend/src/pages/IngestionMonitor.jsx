import { useEffect, useMemo, useState } from 'react';
import {
  RiUploadCloud2Line, RiCheckLine, RiCloseLine, RiTimeLine,
  RiPlayLine, RiRefreshLine, RiDatabase2Line,
} from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';
import { ingestService, sparkService } from '../services/domainServices';

function StatusBadge({ status }) {
  const map = {
    success: 'success',
    failed: 'danger',
    running: 'info',
    queued: 'muted',
    completed: 'success',
    training: 'info',
    in_progress: 'info',
    open: 'warning',
    resolved: 'success',
    active: 'info',
  };
  return (
    <span className={`status-badge ${map[status] || 'muted'}`} style={{ textTransform: 'capitalize' }}>
      {status?.replace('_', ' ')}
    </span>
  );
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

export default function IngestionMonitor() {
  const { accessToken } = useAuth();
  const [dragOver, setDragOver] = useState(false);
  const [uploaded, setUploaded] = useState([]);
  const [history, setHistory] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [sourceName, setSourceName] = useState('berkeleyearth');
  const [intervalMinutes, setIntervalMinutes] = useState(60);

  const refreshAll = async () => {
    if (!accessToken) return;
    try {
      const [historyData, jobsData, schedulesData] = await Promise.all([
        ingestService.history(accessToken),
        sparkService.jobs(accessToken),
        ingestService.schedules(accessToken),
      ]);
      setHistory(Array.isArray(historyData) ? historyData : []);
      setJobs(Array.isArray(jobsData) ? jobsData : []);
      setSchedules(Array.isArray(schedulesData) ? schedulesData : []);
    } catch (err) {
      setMessage(err?.message || 'Failed to load ingestion data');
    }
  };

  useEffect(() => {
    refreshAll();
    const timer = setInterval(refreshAll, 20000);
    return () => clearInterval(timer);
  }, [accessToken]);

  const queueFiles = (files) => {
    const mapped = files.map((f) => ({
      id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
      file: f,
      name: f.name,
      size: `${(f.size / 1024 / 1024).toFixed(1)} MB`,
      status: 'queued',
    }));
    setUploaded((prev) => [...prev, ...mapped]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    queueFiles(Array.from(e.dataTransfer.files || []));
  };

  const totals = useMemo(() => {
    const records = history.reduce((sum, row) => sum + Number(row.record_count || 0), 0);
    const success = history.filter((row) => row.status === 'success').length;
    const failed = history.filter((row) => row.status === 'failed').length;
    const activeJobs = jobs.filter((row) => row.status === 'running').length;
    return { records, success, failed, activeJobs };
  }, [history, jobs]);

  const startIngestion = async () => {
    if (!uploaded.length || !accessToken) return;
    setLoading(true);
    setMessage('');

    try {
      for (const item of uploaded) {
        setUploaded((prev) => prev.map((row) => row.id === item.id ? { ...row, status: 'running' } : row));
        await ingestService.upload(accessToken, sourceName || 'manual-upload', item.file);
        setUploaded((prev) => prev.map((row) => row.id === item.id ? { ...row, status: 'success' } : row));
      }
      await refreshAll();
      setMessage('Upload and ingestion completed');
    } catch (err) {
      setMessage(err?.message || 'Ingestion failed');
      setUploaded((prev) => prev.map((row) => row.status === 'running' ? { ...row, status: 'failed' } : row));
    } finally {
      setLoading(false);
    }
  };

  const setSchedule = async () => {
    if (!accessToken) return;
    try {
      await ingestService.schedule(accessToken, sourceName || 'berkeleyearth', Number(intervalMinutes));
      setMessage('Schedule saved');
      await refreshAll();
    } catch (err) {
      setMessage(err?.message || 'Failed to save schedule');
    }
  };

  const runJob = async (jobName = 'clean_data') => {
    if (!accessToken) return;
    try {
      await sparkService.runJob(accessToken, jobName);
      setMessage(`Spark job ${jobName} started`);
      await refreshAll();
    } catch (err) {
      setMessage(err?.message || 'Failed to run Spark job');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Ingestion Monitor</h1>
        <p>Upload datasets, track ingestion history, and manage PySpark batch jobs</p>
      </div>

      {message && (
        <div className="alert alert-info" style={{ fontSize: '0.82rem' }}>{message}</div>
      )}

      <div className="row g-3 mb-4">
        {[
          { icon: RiDatabase2Line, label: 'Total Records', value: `${(totals.records / 1e6).toFixed(2)}M`, color: 'blue' },
          { icon: RiCheckLine, label: 'Successful Runs', value: totals.success, color: 'green' },
          { icon: RiCloseLine, label: 'Failed Runs', value: totals.failed, color: 'red' },
          { icon: RiTimeLine, label: 'Spark Jobs Active', value: totals.activeJobs, color: 'orange' },
        ].map((s) => (
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
        <div className="col-12 col-lg-5">
          <div className="card-es h-100">
            <div className="card-header-es"><h6>Upload Dataset</h6></div>
            <div className="card-body-es">
              <div className="mb-2">
                <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Source Name</label>
                <input className="form-control form-control-sm" value={sourceName} onChange={(e) => setSourceName(e.target.value)} />
              </div>

              <div
                id="drop-zone"
                className={`upload-zone${dragOver ? ' dragover' : ''}`}
                style={dragOver ? { borderColor: 'var(--primary-dark)', background: '#c8e8f6' } : {}}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input').click()}
              >
                <RiUploadCloud2Line className="upload-icon" />
                <h5>Drag & Drop Files Here</h5>
                <p>Supports CSV and JSON</p>
                <input
                  type="file"
                  id="file-input"
                  accept=".csv,.json"
                  multiple
                  style={{ display: 'none' }}
                  onChange={(e) => queueFiles(Array.from(e.target.files || []))}
                />
              </div>

              {uploaded.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>QUEUED FILES</div>
                  {uploaded.map((f) => (
                    <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-page)', borderRadius: 8, marginBottom: 6 }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{f.name}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{f.size}</div>
                      </div>
                      <StatusBadge status={f.status} />
                    </div>
                  ))}
                  <button className="btn btn-primary btn-sm w-100 mt-2" id="start-ingestion-btn" onClick={startIngestion} disabled={loading}>
                    {loading ? 'Running...' : 'Start Ingestion'}
                  </button>
                </div>
              )}

              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>Schedule Recurring Ingestion</div>
                <div className="row g-2">
                  <div className="col-7">
                    <input
                      className="form-control form-control-sm"
                      type="number"
                      min={5}
                      value={intervalMinutes}
                      onChange={(e) => setIntervalMinutes(e.target.value)}
                    />
                  </div>
                  <div className="col-5">
                    <button id="schedule-btn" className="btn btn-outline-primary btn-sm w-100" onClick={setSchedule}>Set</button>
                  </div>
                </div>
                {schedules.length > 0 && (
                  <div style={{ marginTop: 10, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Latest schedule: every {schedules[0]?.interval_minutes} min (next: {formatDate(schedules[0]?.next_run)})
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-7">
          <div className="card-es h-100">
            <div className="card-header-es">
              <h6>PySpark Jobs</h6>
              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-primary d-flex align-items-center gap-2" style={{ fontSize: '0.72rem', padding: '4px 12px' }} onClick={() => runJob('clean_data')}>
                  <RiPlayLine /> Clean Data
                </button>
                <button className="btn btn-sm btn-outline-primary d-flex align-items-center gap-2" style={{ fontSize: '0.72rem', padding: '4px 12px' }} onClick={() => runJob('aggregate_stats')}>
                  Run Stats
                </button>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="es-table">
                <thead>
                  <tr>
                    <th>Job</th>
                    <th>Status</th>
                    <th>Started</th>
                    <th>Finished</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{job.job_name}</td>
                      <td><StatusBadge status={job.status} /></td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDate(job.started_at)}</td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDate(job.finished_at)}</td>
                    </tr>
                  ))}
                  {!jobs.length && (
                    <tr><td colSpan="4" className="text-center text-muted">No jobs yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="card-es">
        <div className="card-header-es">
          <h6>Ingestion History</h6>
          <button id="refresh-ingestion-btn" className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" style={{ fontSize: '0.72rem', padding: '3px 10px' }} onClick={refreshAll}>
            <RiRefreshLine /> Refresh
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="es-table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Format</th>
                <th>Records</th>
                <th>Status</th>
                <th>Trigger</th>
                <th>Ingested At</th>
              </tr>
            </thead>
            <tbody>
              {history.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontWeight: 600, fontSize: '0.8rem' }}>{log.source_name}</td>
                  <td><span style={{ background: 'var(--bg-page)', padding: '2px 7px', borderRadius: 4, fontSize: '0.68rem', fontWeight: 700 }}>{String(log.format || '').toUpperCase()}</span></td>
                  <td style={{ fontSize: '0.8rem' }}>{Number(log.record_count || 0).toLocaleString()}</td>
                  <td><StatusBadge status={log.status} /></td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{log.trigger || 'manual'}</td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDate(log.ingested_at)}</td>
                </tr>
              ))}
              {!history.length && (
                <tr><td colSpan="6" className="text-center text-muted">No ingestion runs found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
