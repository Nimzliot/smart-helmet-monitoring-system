const { client: supabase, configured } = require("../config/supabase");
const env = require("../config/env");
const { logger } = require("../config/logger");

const nowIso = () => new Date().toISOString();
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
    return { level: 2, color: "yellow", score };
  }

  return { level: 1, color: "green", score };
};

class DatabaseService {
  constructor() {
    this.memory = {
      helmetLogs: [],
      alerts: [],
      riders: [
        {
          id: "R001",
          name: "Asha Verma",
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
        },
        {
          helmet_id: "H002",
          rider_id: null,
          status: "IDLE",
          battery_level: 86,
          last_seen: null,
          latitude: 12.975,
          longitude: 77.6,
        },
        {
          helmet_id: "H003",
          rider_id: null,
          status: "IDLE",
          battery_level: 74,
          last_seen: null,
          latitude: 12.968,
          longitude: 77.59,
        },
      ],
    };

    this.users = [
      {
        id: "U001",
        name: "Admin",
        email: "admin@smarthelmet.local",
        password: "admin123",
        role: "admin",
      },
    ];
  }

  isConfigured() {
    return configured && Boolean(supabase);
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
    const explicitAlcohol = toBooleanOrNull(payload.alcohol_detected);
    const explicitDrowsiness = toBooleanOrNull(payload.drowsiness);
    const explicitFall = toBooleanOrNull(payload.fall_detected);
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
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
      signal_strength: payload.signal_strength ?? "STRONG",
      timestamp: payload.timestamp || nowIso(),
    };
  }

  async safeSupabase(operation, fallback) {
    if (!this.isConfigured()) {
      return fallback();
    }

    try {
      return await operation();
    } catch (error) {
      logger.warn("Supabase operation failed. Falling back to in-memory store.", error.message);
      return fallback();
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

  async createHelmetLog(payload) {
    const record = this.buildHelmetRecord(payload);

    await this.safeSupabase(
      async () => {
        await supabase.from("helmet_logs").insert([record]);
      },
      async () => null
    );

    this.memory.helmetLogs.unshift(record);
    this.memory.helmetLogs = this.memory.helmetLogs.slice(0, 500);
    const helmet = this.syncHelmetSnapshot(record);

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
        return data[0] || this.memory.helmetLogs.find((item) => item.helmet_id === helmetId) || null;
      },
      async () => this.memory.helmetLogs.find((item) => item.helmet_id === helmetId) || null
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
      },
      async () => this.memory.helmetLogs.slice(0, limit)
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
      },
      async () => this.memory.alerts.slice(0, limit)
    );
  }

  async createAlerts(alerts) {
    if (!alerts.length) return [];

    await this.safeSupabase(
      async () => {
        await supabase.from("alerts").insert(alerts);
      },
      async () => null
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
      },
      async () => this.memory.riders
    );
  }

  async createRider(payload) {
    const rider = {
      id: payload.id || `R${String(this.memory.riders.length + 1).padStart(3, "0")}`,
      name: payload.name,
      phone: payload.phone,
      emergency_contact: payload.emergency_contact,
      email: payload.email,
    };

    await this.safeSupabase(
      async () => {
        await supabase.from("riders").insert([rider]);
      },
      async () => null
    );

    this.memory.riders.push(rider);
    return rider;
  }

  async listHelmets() {
    return this.safeSupabase(
      async () => {
        const { data, error } = await supabase.from("helmets").select("*").order("helmet_id");
        if (error) throw error;
        return data;
      },
      async () => this.memory.helmets
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
    };

    await this.safeSupabase(
      async () => {
        await supabase.from("helmets").insert([helmet]);
      },
      async () => null
    );

    const existingIndex = this.memory.helmets.findIndex((item) => item.helmet_id === helmet.helmet_id);
    if (existingIndex >= 0) {
      this.memory.helmets[existingIndex] = { ...this.memory.helmets[existingIndex], ...helmet };
    } else {
      this.memory.helmets.push(helmet);
    }

    return helmet;
  }

  findRiderByHelmet(helmetId) {
    const helmet = this.memory.helmets.find((item) => item.helmet_id === helmetId);
    if (!helmet || !helmet.rider_id) return null;
    return this.memory.riders.find((item) => item.id === helmet.rider_id) || null;
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
        return data[0] || this.users.find((user) => user.email === email && user.password === password) || null;
      },
      async () => this.users.find((user) => user.email === email && user.password === password) || null
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
        return data[0] || this.sanitizeUser(this.users.find((user) => user.id === userId)) || null;
      },
      async () => this.sanitizeUser(this.users.find((user) => user.id === userId)) || null
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
      database: this.isConfigured() ? "supabase" : "memory-fallback",
      activeHelmets: activeHelmetIds.size,
      trackedHelmets: (await this.listHelmets()).length,
      latestEventAt,
      latestEventAgeSeconds,
      hardwareConnected:
        latestEventAgeSeconds !== null && latestEventAgeSeconds <= env.hardwareOfflineThresholdSeconds,
      hardwareStatus:
        latestEventAgeSeconds === null
          ? "NO_DATA"
          : latestEventAgeSeconds <= env.hardwareOfflineThresholdSeconds
            ? "CONNECTED"
            : "DISCONNECTED",
    };
  }
}

module.exports = new DatabaseService();
