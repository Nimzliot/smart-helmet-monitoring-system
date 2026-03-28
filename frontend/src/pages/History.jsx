import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { apiRequest } from '../services/api';
import SignalIndicator from '../components/SignalIndicator';
import PageHeader from '../components/PageHeader';
import { getAccidentSeverity } from '../utils/severity';

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setHistory(await apiRequest('/api/history'));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) return <div className="animate-pulse text-slate-400">Loading history...</div>;

  if (error) {
    return <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-8 text-rose-100">{error}</div>;
  }

  const filtered = history.filter((record) => record.helmet_id.toLowerCase().includes(query.toLowerCase()));
  const severityStyles = {
    green: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    yellow: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    red: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
    slate: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Records"
        title="Telemetry history"
        description="Review recent device telemetry, battery condition, and derived safety flags from connected helmets."
      />

      <div className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950">
        <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-950/30 p-4">
          <Search size={18} className="text-slate-500" />
          <input
            type="text"
            placeholder="Search by Device / Helmet ID..."
            className="w-full border-none bg-transparent text-sm text-white outline-none placeholder-slate-600"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/50 text-sm text-slate-400">
                <th className="p-4 font-medium">Time</th>
                <th className="p-4 font-medium">Device</th>
                <th className="p-4 font-medium">Signal</th>
                <th className="p-4 font-medium">MQ-3</th>
                <th className="p-4 font-medium">Eye Blink</th>
                <th className="p-4 font-medium">MPU6050</th>
                <th className="p-4 font-medium">Battery</th>
                <th className="p-4 font-medium">Alcohol</th>
                <th className="p-4 font-medium">Drowsiness</th>
                <th className="p-4 font-medium">Fall Status</th>
                <th className="p-4 font-medium">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map((record) => {
                const severity = record.severity_level != null
                  ? {
                      level: record.severity_level,
                      color: record.severity_color || 'slate',
                      label:
                        record.severity_level === 3 ? 'Severe' :
                        record.severity_level === 2 ? 'Medium' :
                        record.severity_level === 1 ? 'Minor' : 'No accident',
                    }
                  : getAccidentSeverity(record);

                return (
                  <tr key={record.id || record.timestamp} className="text-sm transition-colors hover:bg-slate-800/30">
                    <td className="p-4 font-mono text-xs text-slate-300">{new Date(record.timestamp).toLocaleString()}</td>
                    <td className="p-4 font-medium text-cyan-400">{record.helmet_id}</td>
                    <td className="p-4"><SignalIndicator signal={record.signal_strength || 'MODERATE'} /></td>
                    <td className="p-4 text-xs text-slate-300">{record.alcohol_value ?? '--'}</td>
                    <td className="p-4 text-xs text-slate-300">{record.blink_rate ?? '--'} / {record.eye_closure_duration ?? '--'}s</td>
                    <td className="p-4 text-xs text-slate-300">{record.accel_x ?? '--'}, {record.accel_y ?? '--'}, {record.accel_z ?? '--'}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center justify-center rounded px-2 py-1 text-xs font-bold ${record.battery_status <= 20 ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        {record.battery_status}% / {record.battery_voltage ?? '--'}V
                      </span>
                    </td>
                    <td className="p-4">{record.alcohol_detected ? <span className="font-bold text-red-500">Yes</span> : <span className="text-slate-500">No</span>}</td>
                    <td className="p-4">{record.drowsiness ? <span className="font-bold text-red-500">Yes</span> : <span className="text-slate-500">No</span>}</td>
                    <td className="p-4">{record.fall_detected ? <span className="font-bold text-red-500">Yes</span> : <span className="text-slate-500">No</span>}</td>
                    <td className="p-4">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${severityStyles[severity.color]}`}>
                        Level {severity.level} {severity.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="11" className="p-8 text-center text-slate-500">No logs available for this search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
