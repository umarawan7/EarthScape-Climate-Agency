// ─── Temperature Data (12 months) ──────────────────────────────
export const tempTrend = [
  { month: 'Jan', avg: 14.2, max: 18.5, min: 9.8, predicted: 14.8 },
  { month: 'Feb', avg: 15.1, max: 20.1, min: 10.4, predicted: 15.5 },
  { month: 'Mar', avg: 17.8, max: 23.4, min: 12.1, predicted: 18.2 },
  { month: 'Apr', avg: 21.3, max: 27.8, min: 15.6, predicted: 21.9 },
  { month: 'May', avg: 26.0, max: 33.2, min: 19.2, predicted: 26.7 },
  { month: 'Jun', avg: 31.4, max: 39.1, min: 24.8, predicted: 32.0 },
  { month: 'Jul', avg: 34.2, max: 42.3, min: 27.4, predicted: 35.1 },
  { month: 'Aug', avg: 33.6, max: 41.8, min: 26.9, predicted: 34.4 },
  { month: 'Sep', avg: 29.1, max: 36.5, min: 22.7, predicted: 29.8 },
  { month: 'Oct', avg: 23.4, max: 29.7, min: 17.3, predicted: 24.0 },
  { month: 'Nov', avg: 18.2, max: 23.1, min: 13.5, predicted: 18.9 },
  { month: 'Dec', avg: 14.8, max: 19.3, min: 10.2, predicted: 15.3 },
];

// ─── CO₂ Data ───────────────────────────────────────────────────
export const co2Data = [
  { month: 'Jan', co2: 418.2, baseline: 410 },
  { month: 'Feb', co2: 419.6, baseline: 410 },
  { month: 'Mar', co2: 421.3, baseline: 410 },
  { month: 'Apr', co2: 422.8, baseline: 410 },
  { month: 'May', co2: 424.1, baseline: 410 },
  { month: 'Jun', co2: 420.5, baseline: 410 },
  { month: 'Jul', co2: 418.9, baseline: 410 },
  { month: 'Aug', co2: 417.4, baseline: 410 },
  { month: 'Sep', co2: 419.2, baseline: 410 },
  { month: 'Oct', co2: 421.7, baseline: 410 },
  { month: 'Nov', co2: 423.5, baseline: 410 },
  { month: 'Dec', co2: 425.0, baseline: 410 },
];

// ─── Precipitation Data ─────────────────────────────────────────
export const precipData = [
  { month: 'Jan', mm: 42, days: 8  },
  { month: 'Feb', mm: 35, days: 6  },
  { month: 'Mar', mm: 58, days: 10 },
  { month: 'Apr', mm: 72, days: 12 },
  { month: 'May', mm: 88, days: 14 },
  { month: 'Jun', mm: 120, days: 18 },
  { month: 'Jul', mm: 145, days: 20 },
  { month: 'Aug', mm: 138, days: 19 },
  { month: 'Sep', mm: 95, days: 14 },
  { month: 'Oct', mm: 66, days: 11 },
  { month: 'Nov', mm: 48, days: 8  },
  { month: 'Dec', mm: 38, days: 7  },
];

// ─── Anomaly Points (for map) ───────────────────────────────────
export const anomalyPoints = [
  { id: 1, lat: 51.5074,   lng: -0.1278,  region: 'London, UK',       type: 'Temperature Spike',    severity: 'high',     value: '+4.2°C', date: '2025-05-18' },
  { id: 2, lat: 28.6139,   lng: 77.2090,  region: 'New Delhi, India',  type: 'Extreme Heat',         severity: 'critical', value: '48.6°C', date: '2025-05-17' },
  { id: 3, lat: -33.8688,  lng: 151.2093, region: 'Sydney, Australia', type: 'Drought Anomaly',      severity: 'medium',   value: '-38mm',  date: '2025-05-16' },
  { id: 4, lat: 40.7128,   lng: -74.0060, region: 'New York, USA',     type: 'CO₂ Spike',            severity: 'medium',   value: '432ppm', date: '2025-05-15' },
  { id: 5, lat: -23.5505,  lng: -46.6333, region: 'São Paulo, Brazil', type: 'Heavy Precipitation',  severity: 'high',     value: '+85mm',  date: '2025-05-14' },
  { id: 6, lat: 35.6762,   lng: 139.6503, region: 'Tokyo, Japan',      type: 'Wind Speed Anomaly',   severity: 'low',      value: '89km/h', date: '2025-05-13' },
  { id: 7, lat: 55.7558,   lng: 37.6173,  region: 'Moscow, Russia',    type: 'Cold Snap',            severity: 'medium',   value: '-14°C',  date: '2025-05-12' },
  { id: 8, lat: 30.0444,   lng: 31.2357,  region: 'Cairo, Egypt',      type: 'Dust Storm Index',     severity: 'low',      value: 'AQI 285', date: '2025-05-11' },
];

// ─── Ingestion Logs ─────────────────────────────────────────────
export const ingestionLogs = [
  { id: 'ING-001', source: 'NOAA_Global_2024.csv',   format: 'CSV',  records: 1480320, size: '2.3 GB', status: 'success',  ingestedAt: '2025-05-18 09:12', duration: '4m 22s' },
  { id: 'ING-002', source: 'ERA5_Reanalysis_Q2.json', format: 'JSON', records: 892400,  size: '1.1 GB', status: 'success',  ingestedAt: '2025-05-17 14:35', duration: '2m 58s' },
  { id: 'ING-003', source: 'Kaggle_Climate_V3.csv',   format: 'CSV',  records: 0,       size: '780 MB', status: 'failed',   ingestedAt: '2025-05-16 11:20', duration: '0m 42s' },
  { id: 'ING-004', source: 'Sensor_Stream_May.json',  format: 'JSON', records: 425600,  size: '540 MB', status: 'success',  ingestedAt: '2025-05-15 08:00', duration: '1m 33s' },
  { id: 'ING-005', source: 'WMO_Stations_2025.csv',   format: 'CSV',  records: 230100,  size: '310 MB', status: 'running',  ingestedAt: '2025-05-18 12:05', duration: '...'    },
  { id: 'ING-006', source: 'ESA_Soil_Moisture.csv',   format: 'CSV',  records: 660800,  size: '870 MB', status: 'success',  ingestedAt: '2025-05-14 07:44', duration: '3m 10s' },
];

// ─── Spark Jobs ─────────────────────────────────────────────────
export const sparkJobs = [
  { id: 'JOB-01', name: 'clean_data.py',           status: 'completed', triggered: '2025-05-18 09:40', duration: '12m 15s', records: 1480320 },
  { id: 'JOB-02', name: 'aggregate_stats.py',      status: 'completed', triggered: '2025-05-18 10:00', duration: '8m 42s',  records: 1480320 },
  { id: 'JOB-03', name: 'anomaly_batch.py',         status: 'running',   triggered: '2025-05-18 12:10', duration: '...',     records: 892400  },
  { id: 'JOB-04', name: 'correlation_analysis.py', status: 'queued',    triggered: '—',               duration: '—',       records: 0       },
  { id: 'JOB-05', name: 'pattern_detection.py',    status: 'failed',    triggered: '2025-05-17 15:30', duration: '2m 01s',  records: 0       },
];

// ─── Alerts ─────────────────────────────────────────────────────
export const alertsData = [
  { id: 'ALT-001', type: 'Temperature',    severity: 'critical', region: 'South Asia',    message: 'Temperature exceeded 48°C threshold',          value: '48.6°C', threshold: '45°C', triggeredAt: '2025-05-18 13:42', acknowledged: false },
  { id: 'ALT-002', type: 'CO₂ Level',      severity: 'high',     region: 'North America', message: 'CO₂ concentration above 430ppm alert level',   value: '432ppm', threshold: '430ppm', triggeredAt: '2025-05-18 11:20', acknowledged: false },
  { id: 'ALT-003', type: 'Precipitation',  severity: 'high',     region: 'South America', message: 'Anomalous precipitation detected — 85mm over baseline', value: '185mm', threshold: '100mm', triggeredAt: '2025-05-18 09:15', acknowledged: true  },
  { id: 'ALT-004', type: 'Wind Speed',     severity: 'medium',   region: 'East Asia',     message: 'Wind speed spike above warning threshold',     value: '89km/h', threshold: '75km/h', triggeredAt: '2025-05-17 22:30', acknowledged: true  },
  { id: 'ALT-005', type: 'Humidity',       severity: 'low',      region: 'Europe',        message: 'Low humidity levels detected — possible drought risk', value: '18%', threshold: '25%', triggeredAt: '2025-05-17 16:00', acknowledged: true  },
  { id: 'ALT-006', type: 'AQI',           severity: 'medium',   region: 'North Africa',  message: 'Air quality index exceeded moderate threshold', value: '285', threshold: '200',  triggeredAt: '2025-05-17 08:45', acknowledged: false },
];

// ─── Users ──────────────────────────────────────────────────────
export const usersData = [
  { id: 1, name: 'Dr. Sarah Mitchell', email: 'sarah.m@earthscape.io',  role: 'admin',   status: 'active',   lastLogin: '2025-05-18 13:42', created: '2024-01-10', initials: 'SM' },
  { id: 2, name: 'James Okafor',       email: 'j.okafor@earthscape.io', role: 'analyst', status: 'active',   lastLogin: '2025-05-18 10:15', created: '2024-03-22', initials: 'JO' },
  { id: 3, name: 'Priya Sharma',       email: 'p.sharma@earthscape.io', role: 'viewer',  status: 'active',   lastLogin: '2025-05-17 14:30', created: '2024-06-05', initials: 'PS' },
  { id: 4, name: 'Carlos Rivera',      email: 'c.rivera@earthscape.io', role: 'analyst', status: 'active',   lastLogin: '2025-05-16 09:00', created: '2024-08-14', initials: 'CR' },
  { id: 5, name: 'Aiko Tanaka',        email: 'a.tanaka@earthscape.io', role: 'viewer',  status: 'inactive', lastLogin: '2025-04-28 11:20', created: '2024-09-30', initials: 'AT' },
  { id: 6, name: 'Marcus Benson',      email: 'm.benson@earthscape.io', role: 'analyst', status: 'active',   lastLogin: '2025-05-18 08:50', created: '2024-11-01', initials: 'MB' },
];

// ─── Support Tickets ────────────────────────────────────────────
export const supportTickets = [
  { id: 'TKT-001', subject: 'Dashboard charts not loading for some regions',   category: 'bug',     status: 'in_progress', createdAt: '2025-05-18', user: 'Priya Sharma',  priority: 'high'   },
  { id: 'TKT-002', subject: 'Request for additional CO₂ trend filters',        category: 'feature', status: 'open',        createdAt: '2025-05-17', user: 'James Okafor',  priority: 'medium' },
  { id: 'TKT-003', subject: 'Ingestion job ING-003 failed — no error details', category: 'data',    status: 'open',        createdAt: '2025-05-16', user: 'Carlos Rivera', priority: 'high'   },
  { id: 'TKT-004', subject: 'How to export anomaly reports as PDF?',           category: 'other',   status: 'resolved',    createdAt: '2025-05-15', user: 'Aiko Tanaka',   priority: 'low'    },
  { id: 'TKT-005', subject: 'Role change request — viewer to analyst',         category: 'other',   status: 'resolved',    createdAt: '2025-05-14', user: 'Marcus Benson', priority: 'low'    },
];

// ─── Prediction Data ────────────────────────────────────────────
export const predictionData = [
  { date: 'May 19', actual: 32.1, predicted: 32.8, upper: 34.5, lower: 31.1 },
  { date: 'May 20', actual: 33.4, predicted: 33.9, upper: 35.7, lower: 32.1 },
  { date: 'May 21', actual: null, predicted: 34.5, upper: 36.8, lower: 32.2 },
  { date: 'May 22', actual: null, predicted: 35.2, upper: 37.9, lower: 32.5 },
  { date: 'May 23', actual: null, predicted: 34.8, upper: 37.4, lower: 32.2 },
  { date: 'May 24', actual: null, predicted: 33.6, upper: 36.1, lower: 31.1 },
  { date: 'May 25', actual: null, predicted: 32.2, upper: 34.8, lower: 29.6 },
  { date: 'May 26', actual: null, predicted: 31.0, upper: 33.5, lower: 28.5 },
  { date: 'May 27', actual: null, predicted: 30.5, upper: 33.1, lower: 27.9 },
];

export const regionOptions = ['Global', 'South Asia', 'East Asia', 'Europe', 'North America', 'South America', 'North Africa', 'Oceania'];

export const dashboardStats = {
  avgTemp:      { value: '28.4°C', change: '+1.2°C', up: true  },
  co2:          { value: '421.3',  change: '+2.8ppm', up: true  },
  anomalies:    { value: '24',     change: '+6',      up: true  },
  dataPoints:   { value: '3.08M',  change: '+480K',   up: true  },
};
