# Smart Helmet Rider Monitoring System

Smart Helmet Rider Monitoring System is a full-stack IoT safety platform prototype for monitoring rider risk, helmet telemetry, and emergency alerts in real time.

## Overview

- Frontend: React + Vite + Tailwind CSS + Socket.IO client + Recharts
- Backend: Node.js + Express + Socket.IO
- Database: Supabase PostgreSQL with RLS-ready SQL schema
- Simulator: Multi-helmet telemetry generator for H001, H002, and H003
- Embedded: ESP32 firmware scaffold for MQ-3, IR eye blink sensor, and MPU6050

## Architecture

### Backend

Main API capabilities:

- `POST /api/helmet-data`
- `GET /api/status`
- `GET /api/history`
- `GET /api/alerts`
- `GET /api/riders`
- `POST /api/riders`
- `GET /api/helmets`
- `POST /api/helmets`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/system/health`

Realtime events:

- `helmet:update`
- `alert:new`
- `helmet:location`
- legacy compatibility event: `helmet-update`

### Frontend

Main pages:

- Login
- Dashboard
- Live Monitoring
- Alerts
- History
- Analytics
- Riders
- Helmets
- Settings

## Run Backend

```powershell
cd backend
npm.cmd install
npm.cmd run dev
```

## Run Frontend

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

## Start Simulator

```powershell
cd backend
npm.cmd run simulate
```

## Default Login

- Admin: `admin@smarthelmet.local` / `admin123`

## Supabase Setup

1. Create a Supabase project.
2. Open the SQL Editor.
3. Paste the contents of `backend/schema.sql`.
4. Copy `backend/.env.example` to `backend/.env` and fill in your values.

Recommended env values:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=optional_but_recommended_for_backend_only
PORT=5000
JWT_SECRET=replace-with-a-secure-secret
FRONTEND_URL=http://localhost:5173,http://localhost:5174
DEVICE_API_KEY=shared-device-key-for-esp32
DEFAULT_LATITUDE=12.65068910917473
DEFAULT_LONGITUDE=78.60467542494665
FAST2SMS_API_KEY=your_fast2sms_api_key
FAST2SMS_ROUTE=q
FAST2SMS_LANGUAGE=english
```

Do not commit `backend/.env` to GitHub.

## Embedded Integration

The `embedded/` folder contains the ESP32 scaffold for:

- MQ-3 alcohol detection
- IR eye blink based drowsiness detection
- MPU6050 fall/accident detection
- Wi-Fi HTTP telemetry posting to the backend
- default GPS fallback coordinates when no live GPS fix is available

Current ESP32 data flow:

- ESP32 connects to the same Wi‑Fi network as the backend machine
- ESP32 sends `POST /api/helmet-data` over Wi‑Fi HTTP
- Backend normalizes and stores the payload in Supabase or memory fallback
- Backend emits live Socket.IO events to the dashboard
- GSM on the helmet remains available for direct emergency SMS

## Emergency SMS Workflow

- Existing ESP32 GSM/SMS flow remains unchanged.
- Backend can now send an additional Fast2SMS emergency message to the rider emergency contact.
- SMS includes vehicle identifier, rider name, and a Google Maps link.
- If GPS is unavailable, the project falls back to `12.65068910917473, 78.60467542494665` so alerts still include a location link.

## Prototype Features

- Admin login with protected routes
- Helmet and rider management
- Live monitoring dashboard
- Severity-based alert generation
- History and analytics views
- Supabase-backed persistence
- Supabase-backed runtime persistence
- Realtime Socket.IO updates
