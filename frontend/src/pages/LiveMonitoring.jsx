import { Activity, Battery, MapPinned, RadioTower } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import StatusIndicator from '../components/StatusIndicator';
import SignalIndicator from '../components/SignalIndicator';
import PageHeader from '../components/PageHeader';
import { getAccidentSeverity } from '../utils/severity';
import { buildMapLink, formatAltitude, formatCoordinate, formatSignalDbm, formatSpeed } from '../utils/telemetry';

export default function LiveMonitoring() {
  const { liveData, connectionStatus, helmetFeed, hardwareStatus, lastTelemetryAt } = useSocket();

  const hardwareTone =
    hardwareStatus === 'CONNECTED'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
      : hardwareStatus === 'DISCONNECTED'
        ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
        : 'border-amber-500/30 bg-amber-500/10 text-amber-200';
  const hardwareMessage =
    hardwareStatus === 'CONNECTED'
      ? 'Helmet hardware is connected and sending telemetry.'
      : hardwareStatus === 'DISCONNECTED'
        ? 'Helmet hardware was connected earlier, but live packets have stopped.'
        : 'No live telemetry has been received from the helmet yet.';

  if (!liveData) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-6 rounded-[2rem] border border-slate-800 bg-slate-950/70 p-10 text-center">
        <div className="relative">
          <Activity className="animate-pulse text-cyan-300" size={64} />
          <div className="absolute inset-0 animate-pulse bg-cyan-400 opacity-20 blur-2xl" />
        </div>
        <div>
          <h2 className="mb-2 text-2xl font-bold">Waiting for Live Data</h2>
          <p className="mx-auto max-w-md text-slate-400">
            The system is connected to the WebSocket server but has not received telemetry yet. Start the simulator or connect the ESP32 device.
          </p>
        </div>
        <div className={`rounded-2xl border px-5 py-4 ${hardwareTone}`}>
          <p className="text-xs uppercase tracking-[0.24em]">Hardware Status</p>
          <p className="mt-2 text-lg font-semibold">{hardwareStatus}</p>
          <p className="mt-2 text-sm">{hardwareMessage}</p>
        </div>
      </div>
    );
  }

  const isDanger = liveData.alcohol_detected || liveData.fall_detected || liveData.drowsiness;
  const severity = getAccidentSeverity(liveData);
  const mapLink = buildMapLink(liveData.latitude, liveData.longitude);
  const severityStyles = {
    red: 'border-rose-500/30 bg-rose-500/10 text-rose-200',
    slate: 'border-slate-700 bg-slate-900/70 text-slate-300',
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Telemetry"
        title="Embedded live monitoring"
        description="Streaming ESP32 device telemetry with rider condition, MPU6050 motion values, and live safety events."
        action={<SignalIndicator signal={connectionStatus === 'ONLINE' ? 'STRONG' : connectionStatus === 'DEGRADED' ? 'MODERATE' : 'WEAK'} />}
      />

      <div className="relative overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950 p-8">
        <div className={`absolute -inset-40 rounded-full opacity-10 blur-3xl transition-colors duration-1000 ${isDanger ? 'bg-red-500' : 'bg-emerald-500'}`} />
        <div className="relative z-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className={`flex flex-col items-center justify-center gap-4 rounded-2xl border p-6 ${hardwareTone}`}>
            <div className="text-center">
              <h3 className="mb-1 font-medium">Hardware Link</h3>
              <p className="text-xl font-bold">{hardwareStatus}</p>
              <p className="mt-2 text-sm">
                {lastTelemetryAt ? `Last packet ${new Date(lastTelemetryAt).toLocaleTimeString()}` : 'No telemetry yet'}
              </p>
            </div>
          </div>
          <StatusIndicator title="MQ-3 Alcohol" active={liveData.alcohol_detected} />
          <StatusIndicator title="IR Drowsiness" active={liveData.drowsiness} />
          <StatusIndicator title="MPU6050 Fall" active={liveData.fall_detected} />
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="rounded-full bg-slate-950/50 p-4 shadow-inner">
              <Battery className={liveData.battery_status <= 20 ? 'text-red-500' : 'text-emerald-500'} />
            </div>
            <div className="text-center">
              <h3 className="mb-1 font-medium text-slate-300">Battery Level</h3>
              <p className={`text-xl font-bold ${liveData.battery_status <= 20 ? 'text-red-500' : 'text-emerald-500'}`}>
                {liveData.battery_status}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
          <p className="text-sm text-slate-400">MQ-3 Reading</p>
          <p className="mt-3 text-xl font-semibold text-white">{liveData.alcohol_value ?? '--'}</p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
          <p className="text-sm text-slate-400">Eye Closure</p>
          <p className="mt-3 text-xl font-semibold text-white">{liveData.eye_closure_duration ?? '--'} s</p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
          <p className="text-sm text-slate-400">Blink Rate</p>
          <p className="mt-3 text-xl font-semibold text-white">{liveData.blink_rate ?? '--'}</p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
          <p className="text-sm text-slate-400">Battery Voltage</p>
          <p className="mt-3 text-xl font-semibold text-white">{liveData.battery_voltage ?? '--'} V</p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
          <p className="text-sm text-slate-400">GSM Operator</p>
          <p className="mt-3 text-xl font-semibold text-white">{liveData.gsm_operator || '--'}</p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
          <p className="text-sm text-slate-400">GSM Signal</p>
          <p className="mt-3 text-xl font-semibold text-white">{formatSignalDbm(liveData.gsm_signal_dbm)}</p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
          <p className="text-sm text-slate-400">GPS Fix</p>
          <p className="mt-3 text-xl font-semibold text-white">{liveData.gps_fix ? 'LOCKED' : 'SEARCHING'}</p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
          <p className="text-sm text-slate-400">Satellites</p>
          <p className="mt-3 text-xl font-semibold text-white">{liveData.gps_satellites ?? '--'}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
          <p className="text-sm text-slate-400">MPU6050 Accelerometer</p>
          <p className="mt-3 text-lg font-semibold text-white">
            X: {liveData.accel_x ?? '--'} / Y: {liveData.accel_y ?? '--'} / Z: {liveData.accel_z ?? '--'}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
          <p className="text-sm text-slate-400">MPU6050 Gyroscope</p>
          <p className="mt-3 text-lg font-semibold text-white">
            X: {liveData.gyro_x ?? '--'} / Y: {liveData.gyro_y ?? '--'} / Z: {liveData.gyro_z ?? '--'}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
          <div className="flex items-center gap-3">
            <RadioTower className="text-cyan-300" size={18} />
            <p className="text-sm text-slate-400">Emergency GSM Metadata</p>
          </div>
          <p className="mt-3 text-lg font-semibold text-white">
            {liveData.gsm_network || 'GSM900'} / {liveData.gsm_registered ? 'Registered' : 'Searching network'}
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Operator {liveData.gsm_operator || '--'} / Signal {formatSignalDbm(liveData.gsm_signal_dbm)} / Mode {liveData.communication_mode || 'GSM_GPRS'}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
          <div className="flex items-center gap-3">
            <MapPinned className="text-cyan-300" size={18} />
            <p className="text-sm text-slate-400">GPS Tracking</p>
          </div>
          <p className="mt-3 text-lg font-semibold text-white">
            {formatCoordinate(liveData.latitude)}, {formatCoordinate(liveData.longitude)}
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Speed {formatSpeed(liveData.gps_speed)} / Altitude {formatAltitude(liveData.gps_altitude)} / Update {liveData.gps_last_update ? new Date(liveData.gps_last_update).toLocaleTimeString() : '--'}
          </p>
          {mapLink ? (
            <a
              href={mapLink}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/20"
            >
              Open live location
            </a>
          ) : null}
        </div>
      </div>

      <div className={`rounded-3xl border p-5 ${severityStyles[severity.color]}`}>
        <p className="text-sm uppercase tracking-[0.24em]">Accident Severity</p>
        <p className="mt-3 text-2xl font-semibold">
          Level {severity.level || 0} - {severity.label}
        </p>
        <p className="mt-3 text-sm">Any detected accident is shown in red.</p>
        <p className="mt-2 text-sm">
          Acceleration: {severity.acceleration.toFixed(2)} / Tilt Angle: {severity.tiltAngle.toFixed(2)} / Impact Force: {severity.impactForce.toFixed(2)}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {helmetFeed.slice(0, 3).map((item) => (
          <div key={item.id} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">{item.helmet_id}</h3>
              <SignalIndicator signal={item.signal_strength || 'MODERATE'} />
            </div>
            <p className="mt-3 text-sm text-slate-400">{new Date(item.timestamp).toLocaleString()}</p>
            <p className="mt-3 text-sm text-slate-300">
              {item.communication_mode || 'HTTP'} / {item.gsm_operator || 'Operator pending'} / GPS {item.gps_fix ? 'LOCKED' : 'SEARCHING'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
