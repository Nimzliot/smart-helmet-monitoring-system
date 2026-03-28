import { AlertTriangle } from 'lucide-react';

export default function AlertPanel({ alerts = [] }) {
  const formatTimestamp = (value) => {
    if (!value) return 'Awaiting telemetry';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Awaiting telemetry' : date.toLocaleString();
  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-rose-500/10 p-3 text-rose-300">
          <AlertTriangle size={20} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Live Alerts</h3>
          <p className="text-sm text-slate-400">Unsafe conditions and emergency notifications.</p>
        </div>
      </div>

      <div className="space-y-3">
        {alerts.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-400">
            No active alerts right now.
          </div>
        )}
        {alerts.slice(0, 5).map((alert) => (
          <div key={alert.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-white">{alert.type.replaceAll('_', ' ')}</p>
              <span className="rounded-full bg-rose-500/10 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-rose-300">
                {alert.severity}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-400">{alert.message}</p>
            <p className="mt-2 text-xs text-slate-500">
              Device {alert.helmet_id} / {formatTimestamp(alert.timestamp)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
