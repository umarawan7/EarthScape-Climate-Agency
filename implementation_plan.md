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

**Goal**: Allow uploading, importing, and scheduling ingestion of climate datasets. The project will exclusively use the Berkeley Earth Surface Temperature dataset.

#### Supported Formats
- CSV (Berkeley Earth Surface Temperature records)
- JSON (daily/weekly temperature update records)

#### Backend (FastAPI)
- `POST /api/ingest/upload` — Upload CSV/JSON files
- `POST /api/ingest/schedule` — Schedule recurring ingestion jobs
- `GET /api/ingest/history` — List all ingestion runs with status
- Files stored to a standard local directory (`/data/raw/`)
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
- **Raw data**: Standard local directory (`/data/raw/`) — input files (Hadoop and HDFS will NOT be used)
- **Processed data**: Parquet format in standard local directory (`/data/processed/`) — output from PySpark jobs (Hadoop and HDFS will NOT be used)
- **Database**: MongoDB remains exactly as-is for storing metadata, alerts, and user profiles.
- Data partitioned by **date**, **region** (latitude/longitude), and **data type** for fast retrieval

#### MongoDB Collections
```
climate_records: {
  _id, source, region, latitude, longitude, timestamp,
  temperature, data_type
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

#### Storage & Processing Details
- Python and PySpark will run in **local mode** (Hadoop and HDFS will NOT be used).
- PySpark reads from and writes to standard local directories (`/data/raw/` and `/data/processed/`).

#### PySpark Jobs (in `backend/spark_jobs/`)
| Job Script | Purpose |
|---|---|
| `clean_data.py` | Handle missing/null values, normalize temperature units |
| `aggregate_stats.py` | Compute regional averages, min/max temperatures |
| `pattern_detection.py` | Detect temperature patterns using sliding windows |
| `correlation_analysis.py` | Find temperature-to-latitude correlation |
| `anomaly_batch.py` | Flag temperature anomalies using Z-score / IQR thresholds |
| `retrain_models.py` | Combines original Kaggle dataset with all newly accumulated data to retrain ML models and prevent catastrophic forgetting |

#### Trigger Mechanism & Lifecycle
- Jobs triggered via FastAPI endpoint: `POST /api/spark/run-job`
- Job status tracked in MongoDB (`spark_jobs` collection)
- Results written to `/data/processed/` and key stats stored in MongoDB
- **Model Retraining Lifecycle**:
  - The machine learning models are **NOT** retrained every time a new file is uploaded.
  - Daily/weekly dataset uploads are instantly processed through pre-trained models to update the dashboard.
  - Actual retraining happens infrequently via a scheduled or manually triggered batch job (`retrain_models.py`) running in local PySpark.

---

### Phase 6 — Real-Time Data Processing (PySpark Structured Streaming) & Live Weather API

**Goal**: Ingest and process streaming data and live weather information in near real-time.

#### Approach
- PySpark **Structured Streaming** (running in local mode, without Hadoop/HDFS) reads from a local file stream or socket source simulating temperature update feeds
- Micro-batch processing every 10–30 seconds, writing to standard local directories and MongoDB
- **Live Weather API & Auto-Location Integration**:
  - Integrates the free, no-key **Open-Meteo API** to fetch real-time weather.
  - When coordinates or a city are selected, FastAPI fetches the live current weather from Open-Meteo.
  - FastAPI instantly passes this live temperature through the saved Scikit-learn Isolation Forest `.pkl` model for real-time anomaly detection, returning both the current temperature and an "Anomaly/Normal" badge to the frontend.

#### Stream Pipeline
```
Live Sensor Feed / Open-Meteo API Fetch
        ↓
PySpark Structured Streaming (local mode) / FastAPI Live Inference
        ↓
Real-time Anomaly Detection (Isolation Forest .pkl)
        ↓
MongoDB (climate_records + anomalies)
        ↓
FastAPI WebSocket / API Response → React Frontend
```

#### Frontend
- Real-time data feed panel and Open-Meteo live weather widget on the dashboard
- Live-updating charts (Recharts with polling / WebSocket / API requests)

---

### Phase 7 — Machine Learning Models

**Goal**: Build ML models for prediction, anomaly detection, and correlation.

#### Models (implemented in Jupyter first, then integrated)

| Model | Algorithm | Purpose |
|---|---|---|
| Temperature Trend Predictor | Linear Regression (PySpark MLlib) | Predict temperature trends |
| Temperature Anomaly Detector | Isolation Forest (Scikit-learn) | Flag abnormal temperature readings (from live weather API or uploads) |
| Temperature-to-Latitude Correlation | Pearson Correlation (PySpark) | Correlation between temperature and latitude |

#### Workflow
1. Explore and train models in **Jupyter Notebooks** (`/notebooks/`) using the Berkeley Earth Surface Temperature dataset.
2. Export and integrate best-performing models (e.g. Scikit-learn `.pkl` for Isolation Forest) into `backend/ml/`.
3. FastAPI exposes prediction endpoints:
   - `POST /api/ml/predict` — Run prediction/anomaly detection (passing live Open-Meteo temperature through the Isolation Forest `.pkl` model)
   - `GET /api/ml/models` — List all available models
4. **Model Retraining Lifecycle**:
   - The model is **not** retrained every time a new file is uploaded.
   - Daily/weekly dataset uploads are instantly processed through the pre-trained model for real-time dashboard updates.
   - Actual retraining happens infrequently via a scheduled or manually triggered PySpark batch job (Phase 5) that combines the original Kaggle dataset with all newly accumulated data to prevent catastrophic forgetting.
5. Predictions stored in MongoDB `predictions` collection.

---

### Phase 8 — Data Visualization & Dashboards

**Goal**: Build rich, interactive dashboards for exploring climate data.

#### Pages / Views (React)
| Page | Description |
|---|---|
| **Overview Dashboard** | Key stats cards, global map, recent alerts, and **Auto-Location Live Weather Widget** |
| **Climate Explorer** | Filter by region/date, temperature line & bar charts |
| **Anomaly Map** | Leaflet.js map with temperature anomaly pins |
| **Predictions** | ML forecast charts with confidence bands |
| **Ingestion Monitor** | Upload history, job statuses |
| **User Management** | Admin-only: manage users and roles |
| **Support** | Submit tickets, view responses |

#### Auto-Location Integration & Live Weather (React ↔ FastAPI)
- React frontend requests browser location permissions to auto-detect the user's current coordinates.
- Providing a dropdown/search bar for manual city/coordinates selection as fallback.
- FastAPI fetches the live current weather from the free, no-key Open-Meteo API when coordinates/city are selected.
- FastAPI instantly runs this live data through the saved Scikit-learn `.pkl` model for real-time anomaly detection, returning both the current temperature and an "Anomaly/Normal" badge to the frontend dashboard.

#### Libraries
- **Recharts** — Line, Bar, Area, Scatter charts
- **Leaflet.js** — Interactive geospatial maps
- **React Table** — Data tables with sorting/filtering
- **Framer Motion** — Smooth page/component animations

---

### Phase 9 — Notifications & Alerts

**Goal**: Automated alerts when climate anomalies exceed defined thresholds.

#### Alert System
- Thresholds configurable per region (e.g., temperature > 45°C)
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

- **Deployment**: The project will be run fully locally (localhost). PySpark will be configured in local mode. Hadoop and HDFS will NOT be used.
- **Data Source**: The project will exclusively use the Berkeley Earth Surface Temperature dataset. A free, no-key Open-Meteo API will be integrated to fulfill real-time weather requirements.
- **Imagery**: Satellite imagery processing has been entirely skipped to streamline the data ingestion pipeline.
- **Storage**: Python and PySpark will operate in local mode, reading and writing to standard local directories (`/data/raw/` and `/data/processed/`). MongoDB remains exactly as-is for storing metadata, alerts, and user profiles.
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

