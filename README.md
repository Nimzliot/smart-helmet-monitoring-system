# Smart Helmet Rider Monitoring System

Smart Helmet Rider Monitoring System is a full-stack IoT safety platform prototype for monitoring rider risk, helmet telemetry, GPS updates, and emergency alerts in real time.

## Overview

- Frontend: React + Vite + Tailwind CSS + Socket.IO client + Recharts
- Backend: Node.js + Express + Socket.IO
- Database: Supabase PostgreSQL with RLS-ready SQL schema
- Simulator: Multi-helmet telemetry generator for H001, H002, and H003

## Architecture

### Backend

The backend is organized into scalable layers:

- `backend/config`
- `backend/controllers`
- `backend/routes`
- `backend/services`
- `backend/middleware`
- `backend/utils`

Main capabilities:

- `POST /api/helmet-data`
- `GET /api/status`
- `GET /api/history`
- `GET /api/alerts`
- `GET /api/riders`
- `POST /api/riders`
- `GET /api/helmets`
- `POST /api/helmets`
- `POST /api/auth/login`
- `GET /api/system/health`

Realtime events:

- `helmet:update`
- `alert:new`
- `helmet:location`
- legacy compatibility event: `helmet-update`

### Frontend

The frontend is organized into:

- `frontend/src/components`
- `frontend/src/context`
- `frontend/src/hooks`
- `frontend/src/layouts`
- `frontend/src/pages`
- `frontend/src/services`

Main pages:

- Login
- Dashboard
- Live Monitoring
- Map Tracking
- Alerts
- History
- Analytics
- Riders
- Helmets
- Settings

## Run Backend

Open a terminal:

```powershell
cd backend
npm.cmd install
npm.cmd run dev
```

If PowerShell blocks `npm`, use `npm.cmd`.

## Run Frontend

Open another terminal:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

## Start Simulator

After backend is running:

```powershell
cd backend
npm.cmd run simulate
```

The simulator sends random telemetry, battery, GPS, and safety events for:

- `H001`
- `H002`
- `H003`

## Default Login

- Admin: `admin@smarthelmet.local` / `admin123`
- Monitor: `monitor@smarthelmet.local` / `monitor123`

## Supabase Setup

1. Create a Supabase project.
2. Open the SQL Editor.
3. Paste the contents of `backend/schema.sql`.
4. Copy `backend/.env.example` to `backend/.env` and fill in your values:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
PORT=5000
JWT_SECRET=replace-with-a-secure-secret
FRONTEND_URL=http://localhost:5173
```

Do not commit `backend/.env` to GitHub.

## In-Memory Fallback

If Supabase is not configured, the system still runs using in-memory storage. This keeps the project demo-friendly and preserves compatibility for:

- telemetry ingestion
- live dashboard updates
- alerts
- rider and helmet management

Note: in-memory data is cleared when the backend restarts.

## Final-Year / Prototype Features

- Modular backend architecture
- Validation middleware
- Logging middleware
- JWT-style authentication
- Rider and helmet registry
- GPS tracking support
- Alert generation with severity levels
- Emergency notification simulation
- Health monitoring endpoint
- Advanced analytics dashboard
- Realtime Socket.IO updates
