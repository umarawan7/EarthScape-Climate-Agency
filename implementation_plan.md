# EarthScape Climate Agency — Full-Stack Implementation Plan

## Overview

EarthScape is a full-stack climate data analytics platform for monitoring, processing, and visualizing large-scale climate datasets. The system uses **React** for the frontend, **Python (FastAPI)** for the backend API, **PySpark** for distributed data processing, and **MongoDB** for metadata and user management. All functional requirements from the brief are addressed in phases.

---

## Tech Stack Summary

| Layer | Technology |
|---|---|
| Frontend | React (Vite), Chart.js / Recharts, Leaflet.js |
| Backend API | Python — FastAPI |
| Auth | JWT (JSON Web Tokens) + bcrypt |
| Data Processing | PySpark (batch & micro-batch streaming) |
| ML Models | PySpark MLlib + Scikit-learn |
| Database | MongoDB (via PyMongo / Motor) |
| Real-time Stream | PySpark Structured Streaming |
| Notebook | Jupyter Notebook (for ML exploration) |
| Dev Tools | VS Code, MongoDB Compass, MongoDB Shell |

---

## Architecture Overview

```
┌─────────────────────────────────────────┐
│              React Frontend              │
│  Dashboards · Auth · Alerts · Support   │
└──────────────────┬──────────────────────┘
                   │ REST / WebSocket
┌──────────────────▼──────────────────────┐
│           FastAPI Backend (Python)       │
│  Auth · Data Ingestion · Alerts · CRUD  │
└──────┬───────────────────┬──────────────┘
       │                   │
┌──────▼──────┐    ┌───────▼────────────┐
│   MongoDB   │    │  PySpark Cluster   │
│ Users/Meta/ │    │  Batch + Streaming │
│ Alerts/Logs │    │  ML + Anomaly Det. │
└─────────────┘    └────────────────────┘
                           │
                   ┌───────▼────────────┐
                   │   Data Sources     │
                   │ CSV · JSON         │
                   │ Kaggle Datasets    │
                   └────────────────────┘
```

---

## Phases

### Phase 1 — Project Setup & Infrastructure

**Goal**: Establish development environment and project scaffolding.

#### Tasks
- Set up VS Code workspace with Python virtual environment
- Initialize React project using Vite (`npm create vite@latest`)
- Initialize FastAPI backend with folder structure
- Set up MongoDB locally (Compass + Shell)
- Configure PySpark locally (or via Jupyter)
- Define `.env` files for secrets (JWT keys, Mongo URI)
- Set up folder structure for the full project:

```
earthscape/
├── frontend/          # React App
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/    # Auth context
│   │   └── services/   # API calls
├── backend/           # FastAPI App
│   ├── routes/
│   ├── models/        # Pydantic + Mongo schemas
│   ├── services/      # Business logic
│   ├── spark_jobs/    # PySpark scripts
│   └── ml/            # ML model scripts
└── notebooks/         # Jupyter exploration notebooks
```

---

### Phase 2 — User Authentication & Authorization

**Goal**: Implement secure login system with role-based access control (RBAC).

#### Backend (FastAPI)
- `POST /api/auth/register` — Register new users (admin only)
- `POST /api/auth/login` — Return JWT access token
- `GET /api/auth/me` — Get current logged-in user profile
- User roles: **Admin**, **Analyst**, **Viewer**
- Passwords hashed with `bcrypt`
- JWT tokens with expiry and refresh logic
- Role-based middleware to protect routes

#### MongoDB Schema — Users Collection
```
users: {
  _id, name, email, password_hash,
  role: ["admin" | "analyst" | "viewer"],
  created_at, last_login
}
```

#### Frontend (React)
- Login Page with JWT token storage (localStorage / httpOnly cookie)
- Auth Context provider wrapping entire app
- Protected Routes — redirect unauthenticated users
- Role-based UI rendering (hide admin controls from viewers)

---

### Phase 3 — Data Ingestion

**Goal**: Allow uploading, importing, and scheduling ingestion of climate datasets.

#### Supported Formats
- CSV (Kaggle dataset records)
- JSON (sensor data)

#### Backend (FastAPI)
- `POST /api/ingest/upload` — Upload CSV/JSON files
- `POST /api/ingest/schedule` — Schedule recurring ingestion jobs
- `GET /api/ingest/history` — List all ingestion runs with status
- Files stored to a local data lake directory (`/data/raw/`)
- Ingestion metadata (source, timestamp, record count) stored in MongoDB

#### MongoDB Schema — Ingestion Logs
```
ingestion_logs: {
  _id, source_name, file_path, format,
  record_count, ingested_at, status, error_message
}
```

#### Frontend (React)
- Data Ingestion Dashboard page
- File Upload component (drag & drop)
- Ingestion history table with status badges
- Scheduler UI for setting periodic ingestion intervals

---

### Phase 4 — Data Storage & Organization

**Goal**: Store processed climate data in an organized, queryable format.

#### Storage Strategy
- **Raw data**: Local filesystem (`/data/raw/`) — input files
- **Processed data**: Parquet format (`/data/processed/`) — output from PySpark jobs
- **Metadata + results**: MongoDB collections
- Data partitioned by **date**, **region**, and **data type** for fast retrieval

#### MongoDB Collections
```
climate_records: {
  _id, source, region, timestamp,
  temperature, humidity, co2_ppm,
  wind_speed, precipitation, data_type
}

anomalies: {
  _id, record_id, anomaly_type,
  severity, detected_at, description
}

predictions: {
  _id, model_name, region, target_date,
  predicted_temp, confidence_score, created_at
}
```

---

### Phase 5 — Batch Data Processing (PySpark)

**Goal**: Process large climate datasets using PySpark MapReduce-style jobs.

#### PySpark Jobs (in `backend/spark_jobs/`)
| Job Script | Purpose |
|---|---|
| `clean_data.py` | Handle missing/null values, normalize units |
| `aggregate_stats.py` | Compute regional averages, min/max, totals |
| `pattern_detection.py` | Detect climate patterns using sliding windows |
| `correlation_analysis.py` | Find correlations between variables (temp ↔ CO₂) |
| `anomaly_batch.py` | Flag anomalies using Z-score / IQR thresholds |

#### Trigger Mechanism
- Jobs triggered via FastAPI endpoint: `POST /api/spark/run-job`
- Job status tracked in MongoDB (`spark_jobs` collection)
- Results written to `/data/processed/` and key stats stored in MongoDB

---

### Phase 6 — Real-Time Data Processing (PySpark Structured Streaming)

**Goal**: Ingest and process streaming sensor/API data in near real-time.

#### Approach
- PySpark **Structured Streaming** reads from a local file stream or socket source simulating live sensor feeds
- Micro-batch processing every 10–30 seconds
- Outputs written to MongoDB in real-time
- Anomalies detected in-stream and pushed to alert system

#### Stream Pipeline
```
Live Sensor Feed (CSV / JSON files dropped in /data/stream/)
        ↓
PySpark Structured Streaming (micro-batch)
        ↓
Real-time Anomaly Detection
        ↓
MongoDB (climate_records + anomalies)
        ↓
FastAPI WebSocket → React Frontend
```

#### Frontend
- Real-time data feed panel on the dashboard
- Live-updating charts (Recharts with polling / WebSocket)

---

### Phase 7 — Machine Learning Models

**Goal**: Build ML models for prediction, anomaly detection, and correlation.

#### Models (implemented in Jupyter first, then integrated)

| Model | Algorithm | Purpose |
|---|---|---|
| Temperature Trend Predictor | Linear Regression (PySpark MLlib) | Predict temperature 7–30 days ahead |
| Anomaly Detector | Isolation Forest (Scikit-learn) | Flag abnormal sensor readings |
| CO₂ Correlation Analyzer | Pearson Correlation (PySpark) | Correlate CO₂ with temperature |
| Precipitation Classifier | Random Forest (PySpark MLlib) | Classify precipitation likelihood |

#### Workflow
1. Explore and train models in **Jupyter Notebooks** (`/notebooks/`)
2. Export and integrate best-performing models into `backend/ml/`
3. FastAPI exposes prediction endpoints:
   - `POST /api/ml/predict` — Run prediction for a region/date
   - `GET /api/ml/models` — List all available models
4. Models retrained periodically via scheduled PySpark jobs
5. Predictions stored in MongoDB `predictions` collection

---

### Phase 8 — Data Visualization & Dashboards

**Goal**: Build rich, interactive dashboards for exploring climate data.

#### Pages / Views (React)
| Page | Description |
|---|---|
| **Overview Dashboard** | Key stats cards, global map, recent alerts |
| **Climate Explorer** | Filter by region/date, line & bar charts |
| **Anomaly Map** | Leaflet.js map with anomaly pins |
| **Predictions** | ML forecast charts with confidence bands |
| **Ingestion Monitor** | Upload history, job statuses |
| **User Management** | Admin-only: manage users and roles |
| **Support** | Submit tickets, view responses |

#### Libraries
- **Recharts** — Line, Bar, Area, Scatter charts
- **Leaflet.js** — Interactive geospatial maps
- **React Table** — Data tables with sorting/filtering
- **Framer Motion** — Smooth page/component animations

---

### Phase 9 — Notifications & Alerts

**Goal**: Automated alerts when climate anomalies exceed defined thresholds.

#### Alert System
- Thresholds configurable per region and variable (e.g., temp > 45°C, CO₂ > 500ppm)
- Alert generation triggered by:
  - PySpark streaming anomaly detection
  - Scheduled batch job results
- Notifications delivered in-app and via email (using Gmail SMTP)
- Alerts stored in MongoDB:
```
alerts: {
  _id, type, severity, region,
  message, threshold, actual_value,
  triggered_at, acknowledged, acknowledged_by
}
```

#### Backend Endpoints
- `GET /api/alerts` — Fetch active alerts (filterable by severity/region)
- `POST /api/alerts/configure` — Set alert thresholds (admin/analyst)
- `PATCH /api/alerts/:id/acknowledge` — Mark alert as seen

#### Frontend
- Alert notification bell in navbar with badge count
- Alerts page with severity-color-coded list
- Configurable threshold settings panel (admin/analyst roles)
- Real-time alert push via WebSocket from FastAPI

---

### Phase 10 — Feedback & Support System

**Goal**: Allow users to submit issues, request help, and provide feedback.

#### Backend Endpoints
- `POST /api/support/ticket` — Submit a support ticket
- `GET /api/support/tickets` — List user's tickets (admin sees all)
- `PATCH /api/support/tickets/:id` — Update ticket status (admin)

#### MongoDB Schema
```
support_tickets: {
  _id, user_id, subject, description,
  category: ["bug" | "feature" | "data" | "other"],
  status: ["open" | "in_progress" | "resolved"],
  created_at, updated_at, admin_response
}
```

#### Frontend
- Support page with ticket submission form
- Ticket status tracker for users
- Admin panel to view all tickets and respond

---

## Development Order (Recommended)

```
Phase 1: Setup → Phase 2: Auth → Phase 3: Ingestion
→ Phase 4: Storage → Phase 5: Batch PySpark
→ Phase 6: Streaming → Phase 7: ML Models
→ Phase 8: Dashboards → Phase 9: Alerts → Phase 10: Support
```

---

## Key Architecture Decisions

- **Deployment**: The project will be run fully locally (localhost). PySpark will be configured in local mode.
- **Data Source**: The application will use a large sample dataset from Kaggle to train the model. No live weather APIs will be used.
- **Imagery**: Satellite imagery (NetCDF/GeoTIFF) processing has been skipped to simplify the ingestion pipeline.
- **Notifications**: Alerts will be delivered in-app and via email using Gmail SMTP.

---

## Verification Plan

### Per Phase
- Each backend route tested via **FastAPI's built-in Swagger UI** (`/docs`)
- PySpark jobs validated with sample datasets in Jupyter
- Frontend pages manually tested in browser across all user roles

### Final System Test
- Full end-to-end flow: Upload dataset → Trigger PySpark job → View results on dashboard → Trigger alert → Acknowledge alert
- Role-based access verification (Admin vs. Analyst vs. Viewer)
- ML prediction accuracy reviewed in Jupyter notebooks

