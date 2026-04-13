import { useEffect, useState } from 'react';
import { Activity, BellRing, BatteryCharging, Radio, ShieldAlert, HardHat, Server, Wifi } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import BatteryIndicator from '../components/BatteryIndicator';
import SignalIndicator from '../components/SignalIndicator';
import AlertPanel from '../components/AlertPanel';
import PageHeader from '../components/PageHeader';
import { apiRequest } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { getAccidentSeverity } from '../utils/severity';

export default function Dashboard() {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { liveData, alerts, connectionStatus, helmetFeed, hardwareStatus, lastTelemetryAt } = useSocket();

  useEffect(() => {
    const load = async () => {
      try {
        const [status, history, helmets, systemHealth] = await Promise.all([
          apiRequest('/api/status'),
          apiRequest('/api/history'),
          apiRequest('/api/helmets'),
          apiRequest('/api/system/health'),
        ]);

        setSnapshot({
          status,
          helmets,
          systemHealth,
          criticalCount: history.filter((item) => item.alcohol_detected || item.drowsiness || item.fall_detected).length,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const status = liveData || snapshot?.status;

  if (loading) return <div className="animate-pulse text-slate-400">Loading command dashboard...</div>;

  if (error) {
    return <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-8 text-rose-100">{error}</div>;
  }

  if (!snapshot || !status) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-8 text-slate-400">
        Backend is reachable, but there is no telemetry yet. Start the simulator to populate the dashboard.
      </div>
    );
  }

  const hasTelemetry = Boolean(status?.helmet_id && status?.timestamp && !status?.mock);
  const activeHelmetCount = snapshot.helmets.filter((helmet) => helmet.status !== 'IDLE').length;
  const criticalState = status.fall_detected || status.alcohol_detected || status.drowsiness;
  const severity = getAccidentSeverity(status);
  const averageBattery = Math.round(
    snapshot.helmets.reduce((sum, item) => sum + (item.battery_level || 0), 0) / Math.max(1, snapshot.helmets.length)
  );
  const displayBatteryLevel = Number.isFinite(Number(status?.battery_status)) ? Number(status.battery_status) : averageBattery;
  const lastUpdateText = hasTelemetry ? new Date(status.timestamp).toLocaleString() : 'Waiting for first telemetry packet';
  const severityTone = {
    green: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    yellow: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
    red: 'border-rose-500/30 bg-rose-500/10 text-rose-200',
    slate: 'border-slate-700 bg-slate-900/70 text-slate-300',
  };
  const backendHardwareStatus = snapshot.systemHealth.hardwareStatus || 'NO_DATA';
  const displayHardwareStatus = hardwareStatus === 'NO_DATA' ? backendHardwareStatus : hardwareStatus;
  const hardwareConnected = displayHardwareStatus === 'CONNECTED';
  const hardwareLastSeen = lastTelemetryAt || snapshot.systemHealth.latestEventAt;
  const hardwareTone =
    displayHardwareStatus === 'CONNECTED'
      ? 'bg-emerald-500/10 text-emerald-200'
      : displayHardwareStatus === 'DISCONNECTED'
        ? 'bg-rose-500/10 text-rose-200'
        : 'bg-amber-500/10 text-amber-200';
  const hardwareLabel =
    displayHardwareStatus === 'CONNECTED'
      ? 'HARDWARE CONNECTED'
      : displayHardwareStatus === 'DISCONNECTED'
        ? 'HARDWARE DISCONNECTED'
        : 'WAITING FOR HARDWARE';

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operations"
        title="ESP32 rider safety overview"
        description="Monitor rider risk, device telemetry, helmet battery, MPU6050 motion, and emergency alerts from the connected smart helmets."
        action={
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Signal</p>
            <p className="mt-2 text-sm font-semibold text-white">{connectionStatus}</p>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Active Helmets" value={activeHelmetCount} hint="Helmets currently streaming or reporting recent telemetry." icon={<Activity size={20} />} tone="blue" />
        <MetricCard title="Critical Alerts" value={snapshot.criticalCount} hint="Unsafe events derived from helmet telemetry and accident logic." icon={<ShieldAlert size={20} />} tone="red" />
        <MetricCard title="Fleet Battery" value={`${averageBattery}%`} hint="Average battery availability across registered helmets." icon={<BatteryCharging size={20} />} tone="green" />
        <MetricCard title="System Health" value={snapshot.systemHealth.server} hint={`Database: ${snapshot.systemHealth.database} / Active helmets: ${snapshot.systemHealth.activeHelmets}`} icon={<Radio size={20} />} tone="amber" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-[2rem] border border-slate-800 bg-slate-950/70 p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Live Device</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{status.helmet_id || 'Awaiting Device Data'}</h2>
              <p className="mt-2 text-sm text-slate-400">Last update {lastUpdateText}</p>
              <p className="mt-2 text-sm text-slate-500">
                Hardware {hardwareConnected ? 'is sending live packets.' : displayHardwareStatus === 'DISCONNECTED' ? 'has stopped sending packets.' : 'has not sent telemetry yet.'}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`rounded-full px-4 py-2 text-xs font-semibold tracking-[0.28em] ${hardwareTone}`}>
                {hardwareLabel}
              </span>
              <span className={`rounded-full px-4 py-2 text-xs font-semibold tracking-[0.28em] ${criticalState ? 'bg-rose-500/10 text-rose-200' : 'bg-emerald-500/10 text-emerald-200'}`}>
                {hasTelemetry ? (criticalState ? 'RISK DETECTED' : 'RIDER SAFE') : 'NO LIVE DATA'}
              </span>
            </div>
          </div>

          {!hasTelemetry ? (
            <div className="mt-8 space-y-4">
              <div className="rounded-[1.75rem] border border-cyan-400/20 bg-cyan-400/5 p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="max-w-2xl">
                    <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Waiting For Telemetry</p>
                    <h3 className="mt-3 text-2xl font-semibold text-white">The dashboard is ready. It just has not received the first helmet packet yet.</h3>
                    <p className="mt-3 text-sm text-slate-400">
                      Your backend, login system, and fleet records are online. Start the simulator or connect the ESP32 to replace placeholders with live alcohol, eye-blink, MPU6050, and battery data.
                    </p>
                  </div>
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Socket Status</p>
                    <p className="mt-3 text-xl font-semibold text-white">{connectionStatus}</p>
                    <p className="mt-2 text-sm text-slate-400">Listening for live helmet updates.</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {[
                  {
                    title: 'Start Demo Telemetry',
                    body: 'Run the backend simulator to populate history, alerts, and the live dashboard without hardware.',
                    icon: Activity,
                  },
                  {
                    title: 'Connect ESP32',
                    body: 'Point the embedded firmware to your backend IP and send packets to /api/helmet-data.',
                    icon: Wifi,
                  },
                  {
                    title: 'Verify Fleet Setup',
                    body: `${snapshot.helmets.length} helmets are registered and ready for assignment, device telemetry, monitoring, and alerts.`,
                    icon: HardHat,
                  },
                ].map(({ title, body, icon: Icon }) => (
                  <div key={title} className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-slate-950/80 p-3 text-cyan-300">
                        <Icon size={18} />
                      </div>
                      <p className="font-semibold text-white">{title}</p>
                    </div>
                    <p className="mt-4 text-sm text-slate-400">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                  <p className="text-sm text-slate-400">Battery Module</p>
                  <div className="mt-4"><BatteryIndicator level={displayBatteryLevel} /></div>
                  <p className="mt-3 text-xs text-slate-500">
                    Voltage: {status.battery_voltage ?? 'Awaiting data'}{status.battery_voltage != null ? ' V' : ''}
                  </p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                  <p className="text-sm text-slate-400">Communication</p>
                  <div className="mt-4"><SignalIndicator signal={status.signal_strength || 'MODERATE'} /></div>
                  <p className="mt-3 text-xs text-slate-500">Mode: {status.communication_mode || 'HTTP'}</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                  <p className="text-sm text-slate-400">MQ-3 Alcohol Sensor</p>
                  <p className="mt-4 text-lg font-semibold text-white">{status.alcohol_value ?? 'Awaiting data'}</p>
                  <p className="mt-3 text-xs text-slate-500">Threshold-based alcohol detection from ESP32 input.</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                  <p className="text-sm text-slate-400">IR Eye Blink Sensor</p>
                  <p className="mt-4 text-lg font-semibold text-white">
                    Blink Rate: {status.blink_rate ?? '--'} / Eye Closure: {status.eye_closure_duration ?? '--'}{status.eye_closure_duration != null ? 's' : ''}
                  </p>
                  <p className="mt-3 text-xs text-slate-500">Drowsiness: {String(Boolean(status.drowsiness))}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                  <p className="text-sm text-slate-400">MPU6050 Accelerometer</p>
                  <p className="mt-4 text-lg font-semibold text-white">
                    X: {status.accel_x ?? '--'} / Y: {status.accel_y ?? '--'} / Z: {status.accel_z ?? '--'}
                  </p>
                  <p className="mt-3 text-xs text-slate-500">Live movement data from the connected helmet.</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                  <p className="text-sm text-slate-400">MPU6050 Gyroscope</p>
                  <p className="mt-4 text-lg font-semibold text-white">
                    X: {status.gyro_x ?? '--'} / Y: {status.gyro_y ?? '--'} / Z: {status.gyro_z ?? '--'}
                  </p>
                  <p className="mt-3 text-xs text-slate-500">Accident/Fall: {String(Boolean(status.fall_detected))}</p>
                </div>
              </div>
            </>
          )}

          <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
            <div className="flex items-center gap-3">
              <BellRing size={18} className="text-cyan-300" />
              <p className="font-semibold text-white">Recent fleet updates</p>
            </div>
            <div className="mt-4 space-y-3">
              {(helmetFeed.length ? helmetFeed : [status]).slice(0, 4).map((item, index) => (
                <div key={item.id || item.timestamp || index} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
                  <div>
                    <p className="font-medium text-white">{item.helmet_id || 'Awaiting Device Data'}</p>
                    <p className="text-xs text-slate-500">
                      {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'No timestamp yet'}
                    </p>
                  </div>
                  <SignalIndicator signal={item.signal_strength || 'MODERATE'} />
                </div>
              ))}
            </div>
          </div>

          <div className={`mt-6 rounded-3xl border p-5 ${severityTone[severity.color]}`}>
            <p className="text-sm uppercase tracking-[0.24em]">Accident Severity</p>
            <p className="mt-3 text-2xl font-semibold">
              {hasTelemetry ? `Level ${severity.level || 0} - ${severity.label}` : 'Waiting for telemetry'}
            </p>
            <p className="mt-3 text-sm">Green = Minor, Yellow = Medium, Red = Severe</p>
          </div>
        </div>

        <div className="space-y-6">
          <AlertPanel alerts={alerts} />

          <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-900 p-3 text-cyan-300">
                <Server size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">System Readiness</h3>
                <p className="text-sm text-slate-400">Core software services are ready for demo and embedded integration.</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {[
                ['Backend API', snapshot.systemHealth.server],
                ['Database', snapshot.systemHealth.database],
                ['Socket Link', connectionStatus],
                ['Hardware', displayHardwareStatus],
                ['Last Hardware Seen', hardwareLastSeen ? new Date(hardwareLastSeen).toLocaleString() : 'No telemetry yet'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3">
                  <p className="text-sm text-slate-400">{label}</p>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
