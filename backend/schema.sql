-- Smart Helmet Rider Monitoring System
-- Paste this into the Supabase SQL Editor.
-- It creates the main telemetry, rider, helmet, and alert tables with RLS enabled.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.riders (
  id text PRIMARY KEY,
  name text NOT NULL,
  phone text NOT NULL,
  emergency_contact text NOT NULL,
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.helmets (
  helmet_id text PRIMARY KEY,
  rider_id text REFERENCES public.riders(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'IDLE',
  battery_level integer NOT NULL DEFAULT 100 CHECK (battery_level >= 0 AND battery_level <= 100),
  last_seen timestamptz,
  latitude double precision,
  longitude double precision,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.helmet_logs (
  id text PRIMARY KEY,
  helmet_id text NOT NULL REFERENCES public.helmets(helmet_id) ON DELETE CASCADE,
  alcohol_value double precision,
  eye_blink_detected boolean DEFAULT false,
  blink_rate double precision,
  eye_closure_duration double precision,
  accel_x double precision,
  accel_y double precision,
  accel_z double precision,
  gyro_x double precision,
  gyro_y double precision,
  gyro_z double precision,
  battery_voltage double precision,
  communication_mode text DEFAULT 'HTTP',
  alcohol_detected boolean NOT NULL DEFAULT false,
  drowsiness boolean NOT NULL DEFAULT false,
  fall_detected boolean NOT NULL DEFAULT false,
  severity_level integer NOT NULL DEFAULT 0,
  severity_color text DEFAULT 'slate',
  battery_status integer NOT NULL DEFAULT 100 CHECK (battery_status >= 0 AND battery_status <= 100),
  latitude double precision,
  longitude double precision,
  signal_strength text DEFAULT 'MODERATE',
  timestamp timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.alerts (
  id text PRIMARY KEY,
  helmet_id text NOT NULL REFERENCES public.helmets(helmet_id) ON DELETE CASCADE,
  type text NOT NULL,
  severity text NOT NULL,
  message text NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_helmet_logs_helmet_id ON public.helmet_logs (helmet_id);
CREATE INDEX IF NOT EXISTS idx_helmet_logs_timestamp ON public.helmet_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_helmet_id ON public.alerts (helmet_id);
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON public.alerts (timestamp DESC);

ALTER TABLE public.riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helmets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helmet_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow rider read" ON public.riders;
DROP POLICY IF EXISTS "Allow rider write" ON public.riders;
DROP POLICY IF EXISTS "Allow helmet read" ON public.helmets;
DROP POLICY IF EXISTS "Allow helmet write" ON public.helmets;
DROP POLICY IF EXISTS "Allow log read" ON public.helmet_logs;
DROP POLICY IF EXISTS "Allow log insert" ON public.helmet_logs;
DROP POLICY IF EXISTS "Allow alert read" ON public.alerts;
DROP POLICY IF EXISTS "Allow alert insert" ON public.alerts;

CREATE POLICY "Allow rider read"
  ON public.riders
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow rider write"
  ON public.riders
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow helmet read"
  ON public.helmets
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow helmet write"
  ON public.helmets
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow log read"
  ON public.helmet_logs
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow log insert"
  ON public.helmet_logs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow alert read"
  ON public.alerts
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow alert insert"
  ON public.alerts
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

INSERT INTO public.riders (id, name, phone, emergency_contact, email)
VALUES ('R001', 'Asha Verma', '+91-9876543210', '+91-9988776655', 'asha.rider@smarthelmet.local')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.helmets (helmet_id, rider_id, status, battery_level, latitude, longitude)
VALUES
  ('H001', 'R001', 'ACTIVE', 92, 12.9716, 77.5946),
  ('H002', null, 'IDLE', 86, 12.9754, 77.5992),
  ('H003', null, 'IDLE', 74, 12.9688, 77.5899)
ON CONFLICT (helmet_id) DO NOTHING;
