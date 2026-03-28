import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { apiRequest } from '../services/api';
import PageHeader from '../components/PageHeader';
import { getAccidentSeverity } from '../utils/severity';

export default function Analytics() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAndProcess = async () => {
      try {
        const history = await apiRequest('/api/history');
        const daily = {};

        history.forEach((log) => {
          const day = new Date(log.timestamp).toLocaleDateString();
          if (!daily[day]) {
            daily[day] = { day, falls: 0, drowsiness: 0, alcohol: 0, activity: 0 };
          }

          daily[day].activity += 1;
          if (log.fall_detected) daily[day].falls += 1;
          if (log.drowsiness) daily[day].drowsiness += 1;
          if (log.alcohol_detected) daily[day].alcohol += 1;
        });

        const severityDistribution = history.reduce(
          (acc, item) => {
            const severity = item.severity_level != null ? item.severity_level : getAccidentSeverity(item).level;
            if (severity === 1) acc[0].count += 1;
            if (severity === 2) acc[1].count += 1;
            if (severity === 3) acc[2].count += 1;
            return acc;
          },
          [
            { name: 'Minor (Level 1)', count: 0, fill: '#10b981' },
            { name: 'Medium (Level 2)', count: 0, fill: '#f59e0b' },
            { name: 'Severe (Level 3)', count: 0, fill: '#f43f5e' },
          ]
        );

        setSummary({
          incidentBreakdown: [
            { name: 'Alcohol', count: history.filter((item) => item.alcohol_detected).length },
            { name: 'Drowsiness', count: history.filter((item) => item.drowsiness).length },
            { name: 'Fall', count: history.filter((item) => item.fall_detected).length },
          ],
          severityDistribution,
          dailySeries: Object.values(daily).slice(-7),
          timeline: history.slice(0, 12).reverse().map((item, index) => ({
            index: index + 1,
            battery: item.battery_status,
            risk: Number(item.alcohol_detected) + Number(item.drowsiness) + Number(item.fall_detected),
          })),
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAndProcess();
  }, []);

  if (loading) return <div className="animate-pulse text-slate-400">Loading analytics...</div>;

  if (error) {
    return <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-8 text-rose-100">{error}</div>;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Insights"
        title="Advanced analytics"
        description="Trend lines for incidents, rider risk, and helmet activity to support final-year demos and startup-style operations reviews."
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[2rem] border border-slate-800 bg-slate-950/70 p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-indigo-500/10 p-3"><BarChart3 className="text-indigo-400" size={24} /></div>
            <div>
              <h3 className="text-lg font-semibold text-white">Incident distribution</h3>
              <p className="text-sm text-slate-400">Alcohol, drowsiness, and fall detections.</p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary?.incidentBreakdown || []}>
                <CartesianGrid stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="count" fill="#22d3ee" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-800 bg-slate-950/70 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white">Fall and drowsiness per day</h3>
            <p className="text-sm text-slate-400">Daily incident trends over the recent timeline.</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary?.dailySeries || []}>
                <CartesianGrid stroke="#1e293b" vertical={false} />
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="falls" stroke="#f43f5e" strokeWidth={2} />
                <Line type="monotone" dataKey="drowsiness" stroke="#f59e0b" strokeWidth={2} />
                <Line type="monotone" dataKey="alcohol" stroke="#22d3ee" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-800 bg-slate-950/70 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white">Accident severity distribution</h3>
            <p className="text-sm text-slate-400">Minor, medium, and severe accident events stored in the telemetry pipeline.</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary?.severityDistribution || []} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" width={120} />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                  {(summary?.severityDistribution || []).map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-800 bg-slate-950/70 p-6 xl:col-span-2">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white">Helmet activity timeline</h3>
            <p className="text-sm text-slate-400">Battery behavior and cumulative risk score across recent events.</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary?.timeline || []}>
                <CartesianGrid stroke="#1e293b" vertical={false} />
                <XAxis dataKey="index" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="battery" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="risk" stroke="#fb7185" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
