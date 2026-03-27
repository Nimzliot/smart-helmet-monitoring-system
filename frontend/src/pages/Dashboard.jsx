import { useEffect, useState } from 'react';
import { Activity, BellRing, BatteryCharging, Radio, ShieldAlert } from 'lucide-react';
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
  const { liveData, alerts, connectionStatus, helmetFeed } = useSocket();

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
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const status = liveData || snapshot?.status;

  if (loading) return <div className="animate-pulse text-slate-400">Loading command dashboard...</div>;

  if (!snapshot || !status) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-8 text-slate-400">
        Backend is reachable, but there is no telemetry yet. Start the simulator to populate the dashboard.
      </div>
    );
  }

  const activeHelmetCount = snapshot.helmets.filter((helmet) => helmet.status !== 'IDLE').length;
  const criticalState = status.fall_detected || status.alcohol_detected || status.drowsiness;
  const severity = getAccidentSeverity(status);
  const severityTone = {
    green: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    yellow: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
    red: 'border-rose-500/30 bg-rose-500/10 text-rose-200',
    slate: 'border-slate-700 bg-slate-900/70 text-slate-300',
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operations"
        title="ESP32 rider safety overview"
        description="Monitor MQ-3 alcohol readings, IR eye-blink drowsiness status, MPU6050 accident signals, battery health, and emergency alerts from the connected smart helmets."
        action={
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Signal</p>
            <p className="mt-2 text-sm font-semibold text-white">{connectionStatus}</p>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Active Helmets" value={activeHelmetCount} hint="Helmets currently streaming or reporting recent telemetry." icon={<Activity size={20} />} tone="blue" />
        <MetricCard title="Critical Alerts" value={snapshot.criticalCount} hint="Unsafe events derived from MQ-3, IR eye sensor, and MPU6050 telemetry." icon={<ShieldAlert size={20} />} tone="red" />
        <MetricCard title="Fleet Battery" value={`${Math.round(snapshot.helmets.reduce((sum, item) => sum + (item.battery_level || 0), 0) / Math.max(1, snapshot.helmets.length))}%`} hint="Average battery availability across registered helmets." icon={<BatteryCharging size={20} />} tone="green" />
        <MetricCard title="System Health" value={snapshot.systemHealth.server} hint={`Database: ${snapshot.systemHealth.database} • Active helmets: ${snapshot.systemHealth.activeHelmets}`} icon={<Radio size={20} />} tone="amber" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[2rem] border border-slate-800 bg-slate-950/70 p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Live Helmet</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{status.helmet_id}</h2>
              <p className="mt-2 text-sm text-slate-400">Last update {new Date(status.timestamp).toLocaleString()}</p>
            </div>
            <span className={`rounded-full px-4 py-2 text-xs font-semibold tracking-[0.28em] ${criticalState ? 'bg-rose-500/10 text-rose-200' : 'bg-emerald-500/10 text-emerald-200'}`}>
              {criticalState ? 'RISK DETECTED' : 'RIDER SAFE'}
            </span>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
              <p className="text-sm text-slate-400">Battery Module</p>
              <div className="mt-4"><BatteryIndicator level={status.battery_status || 0} /></div>
              <p className="mt-3 text-xs text-slate-500">Voltage: {status.battery_voltage ?? '--'} V</p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
              <p className="text-sm text-slate-400">Communication</p>
              <div className="mt-4"><SignalIndicator signal={status.signal_strength || 'MODERATE'} /></div>
              <p className="mt-3 text-xs text-slate-500">Mode: {status.communication_mode || 'HTTP'}</p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
              <p className="text-sm text-slate-400">MQ-3 Alcohol Sensor</p>
              <p className="mt-4 text-lg font-semibold text-white">{status.alcohol_value ?? '--'}</p>
              <p className="mt-3 text-xs text-slate-500">Threshold-based alcohol detection from ESP32 input.</p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
              <p className="text-sm text-slate-400">IR Eye Blink Sensor</p>
              <p className="mt-4 text-lg font-semibold text-white">
                Blink Rate: {status.blink_rate ?? '--'} • Eye Closure: {status.eye_closure_duration ?? '--'}s
              </p>
              <p className="mt-3 text-xs text-slate-500">Drowsiness: {String(Boolean(status.drowsiness))}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
              <p className="text-sm text-slate-400">MPU6050 Accelerometer</p>
              <p className="mt-4 text-lg font-semibold text-white">
                X: {status.accel_x ?? '--'} • Y: {status.accel_y ?? '--'} • Z: {status.accel_z ?? '--'}
              </p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
              <p className="text-sm text-slate-400">MPU6050 Gyroscope</p>
              <p className="mt-4 text-lg font-semibold text-white">
                X: {status.gyro_x ?? '--'} • Y: {status.gyro_y ?? '--'} • Z: {status.gyro_z ?? '--'}
              </p>
              <p className="mt-3 text-xs text-slate-500">Accident/Fall: {String(Boolean(status.fall_detected))}</p>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
            <div className="flex items-center gap-3">
              <BellRing size={18} className="text-cyan-300" />
              <p className="font-semibold text-white">Recent fleet updates</p>
            </div>
            <div className="mt-4 space-y-3">
              {(helmetFeed.length ? helmetFeed : [status]).slice(0, 4).map((item) => (
                <div key={item.id || item.timestamp} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
                  <div>
                    <p className="font-medium text-white">{item.helmet_id}</p>
                    <p className="text-xs text-slate-500">{new Date(item.timestamp).toLocaleString()}</p>
                  </div>
                  <SignalIndicator signal={item.signal_strength || 'MODERATE'} />
                </div>
              ))}
            </div>
          </div>

          <div className={`mt-6 rounded-3xl border p-5 ${severityTone[severity.color]}`}>
            <p className="text-sm uppercase tracking-[0.24em]">Accident Severity</p>
            <p className="mt-3 text-2xl font-semibold">Level {severity.level || 0} - {severity.label}</p>
            <p className="mt-3 text-sm">
              Green = Minor, Yellow = Medium, Red = Severe
            </p>
          </div>
        </div>

        <AlertPanel alerts={alerts} />
      </div>
    </div>
  );
}
