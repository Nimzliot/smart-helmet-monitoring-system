-- Smart Helmet Rider Monitoring System
-- Paste this into the Supabase SQL Editor.
-- It creates the main telemetry, rider, helmet, and alert tables with RLS enabled.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password text NOT NULL,
  role text NOT NULL CHECK (role = 'admin'),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS name text,
ADD COLUMN IF NOT EXISTS password text,
ADD COLUMN IF NOT EXISTS role text,
ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

UPDATE public.users
SET
  name = COALESCE(NULLIF(name, ''), 'Operator'),
  password = COALESCE(NULLIF(password, ''), 'change-me'),
  role = 'admin'
WHERE
  name IS NULL
  OR password IS NULL
  OR role IS NULL
  OR name = ''
  OR password = ''
  OR role = ''
  OR role <> 'admin';

ALTER TABLE public.users
ALTER COLUMN name SET NOT NULL;

ALTER TABLE public.users
ALTER COLUMN password SET NOT NULL;

ALTER TABLE public.users
ALTER COLUMN role SET NOT NULL;

ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
ADD CONSTRAINT users_role_check CHECK (role = 'admin');

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

ALTER TABLE public.helmet_logs
ADD COLUMN IF NOT EXISTS alcohol_value double precision,
ADD COLUMN IF NOT EXISTS eye_blink_detected boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS blink_rate double precision,
ADD COLUMN IF NOT EXISTS eye_closure_duration double precision,
ADD COLUMN IF NOT EXISTS accel_x double precision,
ADD COLUMN IF NOT EXISTS accel_y double precision,
ADD COLUMN IF NOT EXISTS accel_z double precision,
ADD COLUMN IF NOT EXISTS gyro_x double precision,
ADD COLUMN IF NOT EXISTS gyro_y double precision,
ADD COLUMN IF NOT EXISTS gyro_z double precision,
ADD COLUMN IF NOT EXISTS battery_voltage double precision,
ADD COLUMN IF NOT EXISTS communication_mode text DEFAULT 'HTTP',
ADD COLUMN IF NOT EXISTS alcohol_detected boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS drowsiness boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS fall_detected boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS severity_level integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS severity_color text DEFAULT 'slate',
ADD COLUMN IF NOT EXISTS battery_status integer NOT NULL DEFAULT 100,
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision,
ADD COLUMN IF NOT EXISTS signal_strength text DEFAULT 'MODERATE',
ADD COLUMN IF NOT EXISTS timestamp timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.helmet_logs
DROP CONSTRAINT IF EXISTS helmet_logs_battery_status_check;

ALTER TABLE public.helmet_logs
ADD CONSTRAINT helmet_logs_battery_status_check
CHECK (battery_status >= 0 AND battery_status <= 100);

CREATE TABLE IF NOT EXISTS public.alerts (
  id text PRIMARY KEY,
  helmet_id text NOT NULL REFERENCES public.helmets(helmet_id) ON DELETE CASCADE,
  type text NOT NULL,
  severity text NOT NULL,
  message text NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.riders
ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.helmets
ADD COLUMN IF NOT EXISTS last_seen timestamptz,
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision,
ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.alerts
ADD COLUMN IF NOT EXISTS timestamp timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_helmet_logs_helmet_id ON public.helmet_logs (helmet_id);
CREATE INDEX IF NOT EXISTS idx_helmet_logs_timestamp ON public.helmet_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_helmet_id ON public.alerts (helmet_id);
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON public.alerts (timestamp DESC);

ALTER TABLE public.riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helmets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helmet_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow rider read" ON public.riders;
DROP POLICY IF EXISTS "Allow rider write" ON public.riders;
DROP POLICY IF EXISTS "Allow helmet read" ON public.helmets;
DROP POLICY IF EXISTS "Allow helmet write" ON public.helmets;
DROP POLICY IF EXISTS "Allow user read" ON public.users;
DROP POLICY IF EXISTS "Allow user write" ON public.users;
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

CREATE POLICY "Allow user read"
  ON public.users
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Allow user write"
  ON public.users
  FOR ALL
  TO service_role
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

DO $$
DECLARE
  user_id_type text;
BEGIN
  SELECT data_type
  INTO user_id_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name = 'id';

  IF user_id_type = 'uuid' THEN
    INSERT INTO public.users (id, name, email, password, role)
    VALUES (gen_random_uuid(), 'Admin', 'admin@smarthelmet.local', 'admin123', 'admin')
    ON CONFLICT (email) DO UPDATE
    SET
      name = EXCLUDED.name,
      password = EXCLUDED.password,
      role = EXCLUDED.role;
  ELSE
    INSERT INTO public.users (id, name, email, password, role)
    VALUES ('U001', 'Admin', 'admin@smarthelmet.local', 'admin123', 'admin')
    ON CONFLICT (email) DO UPDATE
    SET
      name = EXCLUDED.name,
      password = EXCLUDED.password,
      role = EXCLUDED.role;
  END IF;
END $$;

INSERT INTO public.helmets (helmet_id, rider_id, status, battery_level, latitude, longitude)
VALUES
  ('H001', 'R001', 'ACTIVE', 92, 12.9716, 77.5946),
  ('H002', null, 'IDLE', 86, 12.9754, 77.5992),
  ('H003', null, 'IDLE', 74, 12.9688, 77.5899)
ON CONFLICT (helmet_id) DO NOTHING;
