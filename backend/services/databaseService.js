const {
  client: supabase,
  configured,
  withTimeout,
  formatSupabaseError,
  logSupabaseError,
  isNetworkLevelError,
} = require("../config/supabase");
const env = require("../config/env");
const AppError = require("../utils/appError");

const nowIso = () => new Date().toISOString();
const DEFAULT_LOCATION = {
  latitude: env.defaultLatitude,
  longitude: env.defaultLongitude,
};
const toNumberOrNull = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};
const hasExplicitValue = (value) => value !== undefined && value !== null && value !== "";
const toBooleanOrNull = (value) => {
  if (!hasExplicitValue(value)) return null;
  if (typeof value === "boolean") return value;
  if (value === 1 || value === "1") return true;
  if (value === 0 || value === "0") return false;
  return Boolean(value);
};
const normalizeAcceleration = (value) => {
  if (value === null) return null;
  return Math.abs(value) > 32 ? value / 16384 : value;
};
const buildMotionProfile = (accelX, accelY, accelZ, gyroX, gyroY, gyroZ) => {
  const normalizedAccel = [accelX, accelY, accelZ]
    .map(normalizeAcceleration)
    .filter((value) => value !== null);
  const accelMagnitude = normalizedAccel.length === 3
    ? Math.sqrt(normalizedAccel.reduce((sum, value) => sum + value * value, 0))
    : 0;
  const accelDelta = Math.abs(accelMagnitude - 1);
  const maxGyro = [gyroX, gyroY, gyroZ]
    .filter((value) => value !== null)
    .reduce((max, value) => Math.max(max, Math.abs(value)), 0);

  return {
    accelMagnitude,
    accelDelta,
    maxGyro,
  };
};
const getSeverity = ({ fallDetected, accelX, accelY, accelZ, gyroX, gyroY, gyroZ }) => {
  const motion = buildMotionProfile(accelX, accelY, accelZ, gyroX, gyroY, gyroZ);
  const score = motion.accelDelta * 10 + motion.maxGyro / 120;

  if (!fallDetected) {
    return { level: 0, color: "slate", score };
  }

  if (score >= 10) {
    return { level: 3, color: "red", score };
  }

  if (score >= 5) {
    return { level: 2, color: "red", score };
  }

  return { level: 1, color: "red", score };
};

class DatabaseService {
  constructor() {
    this.memory = {
      helmetLogs: [],
      alerts: [],
      riders: [
        {
          id: "R001",
          name: "Harini",
          phone: "+91-9876543210",
          emergency_contact: "+91-9988776655",
          email: "asha.rider@smarthelmet.local",
        },
      ],
      helmets: [
        {
          helmet_id: "H001",
          rider_id: "R001",
          status: "ACTIVE",
          battery_level: 92,
          last_seen: nowIso(),
          latitude: 12.9716,
          longitude: 77.5946,
          communication_mode: "GSM_GPRS",
          gsm_network: "GSM900",
          gsm_operator: "Airtel",
          gsm_signal_dbm: -71,
          gps_fix: true,
          gps_satellites: 8,
          gps_speed: 42.5,
        },
        {
          helmet_id: "H002",
          rider_id: null,
          status: "IDLE",
          battery_level: 86,
          last_seen: null,
          latitude: 12.975,
          longitude: 77.6,
          communication_mode: "GSM_GPRS",
          gsm_network: "GSM900",
          gsm_operator: "Jio",
          gsm_signal_dbm: -79,
          gps_fix: true,
          gps_satellites: 6,
          gps_speed: 0,
        },
        {
          helmet_id: "H003",
          rider_id: null,
          status: "IDLE",
          battery_level: 74,
          last_seen: null,
          latitude: 12.968,
          longitude: 77.59,
          communication_mode: "GSM_GPRS",
          gsm_network: "GSM900",
          gsm_operator: "Vi",
          gsm_signal_dbm: -88,
          gps_fix: false,
          gps_satellites: 0,
          gps_speed: 0,
        },
      ],
    };

    this.users = [
      {
        id: "U001",
        name: "Admin",
        email: "admin@gmail.com",
        password: "admin",
        role: "admin",
      },
    ];
  }

  isConfigured() {
    return configured && Boolean(supabase);
  }

  ensureConfigured() {
    if (!this.isConfigured()) {
      throw new AppError("Supabase is required for this backend and is not configured correctly", 500);
    }
  }

  sanitizeUser(user) {
    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  async getRiderById(riderId) {
    return this.safeSupabase(async () => {
      const { data, error } = await supabase
        .from("riders")
        .select("*")
        .eq("id", riderId)
        .limit(1);

      if (error) throw error;
      return data[0] || null;
    });
  }

  async getRiderByEmail(email) {
    return this.safeSupabase(async () => {
      const { data, error } = await supabase
        .from("riders")
        .select("*")
        .eq("email", email)
        .limit(1);

      if (error) throw error;
      return data[0] || null;
    });
  }

  async getNextRiderId() {
    const riders = await this.listRiders();
    const maxNumber = riders.reduce((max, rider) => {
      const match = String(rider.id || "").match(/^R(\d+)$/);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0);

    return `R${String(maxNumber + 1).padStart(3, "0")}`;
  }

  buildHelmetRecord(payload) {
    const alcoholValue = toNumberOrNull(payload.alcohol_value);
    const blinkRate = toNumberOrNull(payload.blink_rate);
    const eyeClosureDuration = toNumberOrNull(payload.eye_closure_duration);
    const accelX = toNumberOrNull(payload.accel_x);
    const accelY = toNumberOrNull(payload.accel_y);
    const accelZ = toNumberOrNull(payload.accel_z);
    const gyroX = toNumberOrNull(payload.gyro_x);
    const gyroY = toNumberOrNull(payload.gyro_y);
    const gyroZ = toNumberOrNull(payload.gyro_z);
    const batteryVoltage = toNumberOrNull(payload.battery_voltage);
    const rawLatitude = toNumberOrNull(payload.latitude);
    const rawLongitude = toNumberOrNull(payload.longitude);
    const hasGpsCoordinates = rawLatitude !== null && rawLongitude !== null;
    const latitude = hasGpsCoordinates ? rawLatitude : DEFAULT_LOCATION.latitude;
    const longitude = hasGpsCoordinates ? rawLongitude : DEFAULT_LOCATION.longitude;
    const gpsSatellites = toNumberOrNull(payload.gps_satellites);
    const gpsSpeed = toNumberOrNull(payload.gps_speed);
    const gpsAltitude = toNumberOrNull(payload.gps_altitude);
    const gsmSignalDbm = toNumberOrNull(payload.gsm_signal_dbm);
    const explicitAlcohol = toBooleanOrNull(payload.alcohol_detected);
    const explicitDrowsiness = toBooleanOrNull(payload.drowsiness);
    const explicitFall = toBooleanOrNull(payload.fall_detected);
    const gpsFix = toBooleanOrNull(payload.gps_fix);
    const gsmRegistered = toBooleanOrNull(payload.gsm_registered);
    const motion = buildMotionProfile(accelX, accelY, accelZ, gyroX, gyroY, gyroZ);
    const batteryStatus =
      payload.battery_status !== undefined && payload.battery_status !== null
        ? Number(payload.battery_status)
        : batteryVoltage !== null
          ? Math.max(0, Math.min(100, Math.round(((batteryVoltage - 3.3) / 0.9) * 100)))
          : 100;
    const computedAlcohol =
      explicitAlcohol !== null ? explicitAlcohol : alcoholValue !== null ? alcoholValue >= 2000 : false;
    const computedDrowsiness =
      explicitDrowsiness !== null
        ? explicitDrowsiness
        : eyeClosureDuration !== null
        ? eyeClosureDuration >= 2.5
        : blinkRate !== null
          ? blinkRate <= 8
          : Boolean(payload.eye_blink_detected);
    const computedFall =
      explicitFall !== null
        ? explicitFall
        : motion.accelDelta >= 0.8 || motion.maxGyro >= 180;
    const severity = getSeverity({
      fallDetected: computedFall,
      accelX,
      accelY,
      accelZ,
      gyroX,
      gyroY,
      gyroZ,
    });

    return {
      id: payload.id || `${payload.helmet_id}-${Date.now()}`,
      helmet_id: payload.helmet_id,
      alcohol_value: alcoholValue,
      eye_blink_detected: Boolean(payload.eye_blink_detected),
      blink_rate: blinkRate,
      eye_closure_duration: eyeClosureDuration,
      accel_x: accelX,
      accel_y: accelY,
      accel_z: accelZ,
      gyro_x: gyroX,
      gyro_y: gyroY,
      gyro_z: gyroZ,
      battery_voltage: batteryVoltage,
      communication_mode: payload.communication_mode || "HTTP",
      alcohol_detected: computedAlcohol,
      drowsiness: computedDrowsiness,
      fall_detected: computedFall,
      severity_level: severity.level,
      severity_color: severity.color,
      battery_status: Number.isFinite(batteryStatus) ? batteryStatus : 100,
      latitude,
      longitude,
      gps_fix: gpsFix !== null ? gpsFix : hasGpsCoordinates,
      gps_satellites: gpsSatellites,
      gps_speed: gpsSpeed,
      gps_altitude: gpsAltitude,
      gps_last_update: payload.gps_last_update || payload.timestamp || nowIso(),
      signal_strength: payload.signal_strength ?? "STRONG",
      gsm_signal_dbm: gsmSignalDbm,
      gsm_network: payload.gsm_network || "GSM900",
      gsm_operator: payload.gsm_operator || null,
      gsm_registered: gsmRegistered !== null ? gsmRegistered : true,
      timestamp: payload.timestamp || nowIso(),
    };
  }

  async safeSupabase(operation) {
    this.ensureConfigured();

    try {
      return await withTimeout(operation);
    } catch (error) {
      const prefix = isNetworkLevelError(error)
        ? "Supabase operation failed due to network issue"
        : "Supabase operation failed";
      logSupabaseError(prefix, error);
      throw new AppError(`Supabase operation failed: ${formatSupabaseError(error)}`, 500);
    }
  }

  syncHelmetSnapshot(record) {
    const index = this.memory.helmets.findIndex((helmet) => helmet.helmet_id === record.helmet_id);
    const nextHelmet = {
      helmet_id: record.helmet_id,
      rider_id: index >= 0 ? this.memory.helmets[index].rider_id : null,
      status:
        record.fall_detected || record.alcohol_detected || record.drowsiness
          ? "ALERT"
          : "ACTIVE",
      battery_level: record.battery_status,
      last_seen: record.timestamp,
      latitude: record.latitude ?? null,
      longitude: record.longitude ?? null,
      communication_mode: record.communication_mode || "HTTP",
      gsm_network: record.gsm_network || null,
      gsm_operator: record.gsm_operator || null,
      gsm_signal_dbm: record.gsm_signal_dbm ?? null,
      gsm_registered: record.gsm_registered ?? null,
      gps_fix: record.gps_fix ?? null,
      gps_satellites: record.gps_satellites ?? null,
      gps_speed: record.gps_speed ?? null,
      gps_altitude: record.gps_altitude ?? null,
      severity_level: record.severity_level ?? 0,
      severity_color: record.severity_color || "slate",
    };

    if (index >= 0) {
      this.memory.helmets[index] = { ...this.memory.helmets[index], ...nextHelmet };
    } else {
      this.memory.helmets.unshift(nextHelmet);
    }

    return nextHelmet;
  }

  upsertMemoryRider(rider) {
    const existingIndex = this.memory.riders.findIndex(
      (item) => item.id === rider.id || item.email === rider.email
    );

    if (existingIndex >= 0) {
      this.memory.riders[existingIndex] = { ...this.memory.riders[existingIndex], ...rider };
      return this.memory.riders[existingIndex];
    }

    this.memory.riders.push(rider);
    return rider;
  }

  upsertMemoryHelmet(helmet) {
    const existingIndex = this.memory.helmets.findIndex((item) => item.helmet_id === helmet.helmet_id);

    if (existingIndex >= 0) {
      this.memory.helmets[existingIndex] = { ...this.memory.helmets[existingIndex], ...helmet };
      return this.memory.helmets[existingIndex];
    }

    this.memory.helmets.push(helmet);
    return helmet;
  }

  async upsertHelmetSnapshot(record) {
    const existingHelmet = await this.getHelmetById(record.helmet_id);
    const helmet = {
      helmet_id: record.helmet_id,
      rider_id: existingHelmet?.rider_id || null,
      status:
        record.fall_detected || record.alcohol_detected || record.drowsiness
          ? "ALERT"
          : "ACTIVE",
      battery_level: record.battery_status,
      last_seen: record.timestamp,
      latitude: record.latitude ?? null,
      longitude: record.longitude ?? null,
      communication_mode: record.communication_mode || "HTTP",
      gsm_network: record.gsm_network || "GSM900",
      gsm_operator: record.gsm_operator || null,
      gsm_signal_dbm: record.gsm_signal_dbm ?? null,
      gsm_registered: record.gsm_registered ?? null,
      gps_fix: record.gps_fix ?? null,
      gps_satellites: record.gps_satellites ?? null,
      gps_speed: record.gps_speed ?? null,
      gps_altitude: record.gps_altitude ?? null,
    };

    await this.safeSupabase(
      async () => {
        const { error } = await supabase.from("helmets").upsert([helmet], { onConflict: "helmet_id" });
        if (error) throw error;
      }
    );

    return this.upsertMemoryHelmet(helmet);
  }

  async createHelmetLog(payload) {
    const record = this.buildHelmetRecord(payload);
    const helmet = await this.upsertHelmetSnapshot(record);

    await this.safeSupabase(
      async () => {
        const { error } = await supabase.from("helmet_logs").insert([record]);
        if (error) throw error;
      }
    );

    this.memory.helmetLogs.unshift(record);
    this.memory.helmetLogs = this.memory.helmetLogs.slice(0, 500);
    this.syncHelmetSnapshot(record);

    return {
      record,
      helmet,
    };
  }

  async getLatestStatus(helmetId = "H001") {
    return this.safeSupabase(
      async () => {
        const { data, error } = await supabase
          .from("helmet_logs")
          .select("*")
          .eq("helmet_id", helmetId)
          .order("timestamp", { ascending: false })
          .limit(1);

        if (error) throw error;
        return data[0] || null;
      }
    );
  }

  async getHistory(limit = 100) {
    return this.safeSupabase(
      async () => {
        const { data, error } = await supabase
          .from("helmet_logs")
          .select("*")
          .order("timestamp", { ascending: false })
          .limit(limit);

        if (error) throw error;
        return data;
      }
    );
  }

  async getAlerts(limit = 50) {
    return this.safeSupabase(
      async () => {
        const { data, error } = await supabase
          .from("alerts")
          .select("*")
          .order("timestamp", { ascending: false })
          .limit(limit);

        if (error) throw error;
        return data;
      }
    );
  }

  async createAlerts(alerts) {
    if (!alerts.length) return [];

    await this.safeSupabase(
      async () => {
        const { error } = await supabase.from("alerts").insert(alerts);
        if (error) throw error;
      }
    );

    this.memory.alerts.unshift(...alerts);
    this.memory.alerts = this.memory.alerts.slice(0, 300);
    return alerts;
  }

  async listRiders() {
    return this.safeSupabase(
      async () => {
        const { data, error } = await supabase.from("riders").select("*").order("name");
        if (error) throw error;
        return data;
      }
    );
  }

  async createRider(payload) {
    const existingRider =
      (payload.id ? await this.getRiderById(payload.id) : null) ||
      (payload.email ? await this.getRiderByEmail(payload.email) : null) ||
      null;
    const rider = {
      id: payload.id || existingRider?.id || await this.getNextRiderId(),
      name: payload.name,
      phone: payload.phone,
      emergency_contact: payload.emergency_contact,
      email: payload.email,
    };

    await this.safeSupabase(
      async () => {
        const { error } = await supabase.from("riders").upsert([rider], { onConflict: "email" });
        if (error) throw error;
      }
    );

    return this.upsertMemoryRider(rider);
  }

  async listHelmets() {
    return this.safeSupabase(
      async () => {
        const { data, error } = await supabase.from("helmets").select("*").order("helmet_id");
        if (error) throw error;
        return data;
      }
    );
  }

  async createHelmet(payload) {
    const helmet = {
      helmet_id: payload.helmet_id,
      rider_id: payload.rider_id || null,
      status: payload.status || "IDLE",
      battery_level: payload.battery_level ?? 100,
      last_seen: payload.last_seen || null,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
      communication_mode: payload.communication_mode || "GSM_GPRS",
      gsm_network: payload.gsm_network || "GSM900",
      gsm_operator: payload.gsm_operator || null,
      gsm_signal_dbm: payload.gsm_signal_dbm ?? null,
      gsm_registered: payload.gsm_registered ?? null,
      gps_fix: payload.gps_fix ?? null,
      gps_satellites: payload.gps_satellites ?? null,
      gps_speed: payload.gps_speed ?? null,
      gps_altitude: payload.gps_altitude ?? null,
    };

    await this.safeSupabase(
      async () => {
        const { error } = await supabase.from("helmets").upsert([helmet], { onConflict: "helmet_id" });
        if (error) throw error;
      }
    );

    return this.upsertMemoryHelmet(helmet);
  }

  async getHelmetById(helmetId) {
    return this.safeSupabase(async () => {
      const { data, error } = await supabase
        .from("helmets")
        .select("*")
        .eq("helmet_id", helmetId)
        .limit(1);

      if (error) throw error;
      return data[0] || null;
    });
  }

  async findRiderByHelmet(helmetId) {
    const helmet = await this.getHelmetById(helmetId);
    if (!helmet || !helmet.rider_id) return null;

    return this.safeSupabase(async () => {
      const { data, error } = await supabase
        .from("riders")
        .select("*")
        .eq("id", helmet.rider_id)
        .limit(1);

      if (error) throw error;
      return data[0] || null;
    });
  }

  async findHelmetById(helmetId) {
    return this.getHelmetById(helmetId);
  }

  async authenticateUser(email, password) {
    return this.safeSupabase(
      async () => {
        const { data, error } = await supabase
          .from("users")
          .select("id, name, email, role, password")
          .eq("email", email)
          .eq("password", password)
          .limit(1);

        if (error) throw error;
        return data[0] || null;
      }
    );
  }

  async getUserById(userId) {
    return this.safeSupabase(
      async () => {
        const { data, error } = await supabase
          .from("users")
          .select("id, name, email, role")
          .eq("id", userId)
          .limit(1);

        if (error) throw error;
        return data[0] || null;
      }
    );
  }

  async getSystemHealth() {
    const latestLogs = await this.getHistory(100);
    const activeWindowStart = Date.now() - env.healthWindowMinutes * 60 * 1000;
    const latestEventAt = latestLogs[0]?.timestamp || null;
    const latestEventAgeSeconds = latestEventAt
      ? Math.max(0, Math.round((Date.now() - new Date(latestEventAt).getTime()) / 1000))
      : null;
    const activeHelmetIds = new Set(
      latestLogs
        .filter((entry) => new Date(entry.timestamp).getTime() >= activeWindowStart)
        .map((entry) => entry.helmet_id)
    );

    return {
      server: "online",
      database: "supabase",
      activeHelmets: activeHelmetIds.size,
      trackedHelmets: (await this.listHelmets()).length,
      latestEventAt,
      latestHeartbeatAt: latestEventAt,
      latestEventAgeSeconds,
      latestHeartbeatAgeSeconds: latestEventAgeSeconds,
      hardwareConnected:
        latestEventAgeSeconds !== null && latestEventAgeSeconds <= env.hardwareOfflineThresholdSeconds,
      hardwareStatus:
        latestEventAgeSeconds === null
          ? "NO_DATA"
          : latestEventAgeSeconds <= env.hardwareOfflineThresholdSeconds
            ? "CONNECTED"
            : "DISCONNECTED",
      notifications: {
        fast2smsConfigured: Boolean(env.fast2smsApiKey),
        defaultLocation: DEFAULT_LOCATION,
      },
      heartbeat: {
        intervalSeconds: 5,
        offlineThresholdSeconds: env.hardwareOfflineThresholdSeconds,
      },
    };
  }
}

module.exports = new DatabaseService();
