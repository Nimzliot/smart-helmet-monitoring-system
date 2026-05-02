import { useEffect, useState } from 'react';
import BatteryIndicator from '../components/BatteryIndicator';
import PageHeader from '../components/PageHeader';
import { apiRequest } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { formatCoordinate, formatSignalDbm, formatSpeed } from '../utils/telemetry';

const initialForm = {
  helmet_id: '',
  rider_id: '',
  status: 'IDLE',
  battery_level: 100,
  communication_mode: 'GSM_GPRS',
  gsm_network: 'GSM900',
  gsm_operator: '',
};

export default function Helmets() {
  const { user } = useAuth();
  const [helmets, setHelmets] = useState([]);
  const [riders, setRiders] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const isAdmin = user?.role === 'admin';

  const load = async () => {
    try {
      setLoading(true);
      const [helmetData, riderData] = await Promise.all([
        apiRequest('/api/helmets'),
        apiRequest('/api/riders'),
      ]);
      setHelmets(helmetData);
      setRiders(riderData);
    } catch (err) {
      setFeedback(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback('');
    setSubmitting(true);
    try {
      await apiRequest('/api/helmets', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          battery_level: Number(form.battery_level),
        }),
      });
      setForm(initialForm);
      await load();
      setFeedback('Helmet saved successfully.');
    } catch (err) {
      setFeedback(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Helmets"
        title="Helmet registry"
        description="Track available helmets, assign riders, review live status, and keep battery readiness visible for operators."
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-[2rem] border border-slate-800 bg-slate-950/70 p-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-400">
            {isAdmin ? 'Admin access enabled. You can add helmets and assign riders.' : 'Monitor access detected. Helmet creation is disabled for this role.'}
          </div>
          <label className="block">
            <span className="mb-2 block text-sm text-slate-400">Helmet ID</span>
            <input required disabled={!isAdmin} value={form.helmet_id} onChange={(e) => setForm((current) => ({ ...current, helmet_id: e.target.value }))} className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-cyan-400" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-slate-400">Assigned Rider</span>
            <select disabled={!isAdmin} value={form.rider_id} onChange={(e) => setForm((current) => ({ ...current, rider_id: e.target.value }))} className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-cyan-400">
              <option value="">Unassigned</option>
              {riders.map((rider) => (
                <option key={rider.id} value={rider.id}>{rider.name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-slate-400">Status</span>
            <select disabled={!isAdmin} value={form.status} onChange={(e) => setForm((current) => ({ ...current, status: e.target.value }))} className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-cyan-400">
              <option value="IDLE">IDLE</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="ALERT">ALERT</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-slate-400">Battery Level</span>
            <input type="number" min="0" max="100" disabled={!isAdmin} value={form.battery_level} onChange={(e) => setForm((current) => ({ ...current, battery_level: e.target.value }))} className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-cyan-400" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-slate-400">Communication Mode</span>
            <input disabled={!isAdmin} value={form.communication_mode} onChange={(e) => setForm((current) => ({ ...current, communication_mode: e.target.value }))} className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-cyan-400" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-slate-400">GSM Network</span>
            <input disabled={!isAdmin} value={form.gsm_network} onChange={(e) => setForm((current) => ({ ...current, gsm_network: e.target.value }))} className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-cyan-400" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-slate-400">Preferred GSM Operator</span>
            <input disabled={!isAdmin} value={form.gsm_operator} onChange={(e) => setForm((current) => ({ ...current, gsm_operator: e.target.value }))} className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-cyan-400" />
          </label>
          {feedback ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-300">
              {feedback}
            </div>
          ) : null}
          <button type="submit" disabled={submitting || !isAdmin} className="rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:brightness-110 disabled:opacity-60">
            {submitting ? 'Saving...' : 'Save Helmet'}
          </button>
        </form>

        <div className="space-y-4 rounded-[2rem] border border-slate-800 bg-slate-950/70 p-6">
          {loading ? <p className="text-sm text-slate-400">Loading helmets...</p> : null}
          {helmets.map((helmet) => (
            <div key={helmet.helmet_id} className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-white">{helmet.helmet_id}</p>
                  <p className="text-sm text-slate-400">Rider: {helmet.rider_id || 'Unassigned'}</p>
                </div>
                <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-cyan-300">{helmet.status}</span>
              </div>
              <div className="mt-4">
                <BatteryIndicator level={helmet.battery_level || 0} />
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">GSM</p>
                  <p className="mt-2 text-sm font-semibold text-white">{helmet.gsm_network || 'GSM900'}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {helmet.gsm_operator || 'Operator pending'} / {helmet.gsm_registered ? 'Registered' : 'Inactive'} / {formatSignalDbm(helmet.gsm_signal_dbm)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">GPS</p>
                  <p className="mt-2 text-sm font-semibold text-white">{helmet.gps_fix ? 'Fix available' : 'No fix yet'}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {formatCoordinate(helmet.latitude)}, {formatCoordinate(helmet.longitude)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {helmet.gps_satellites ?? '--'} sats / {formatSpeed(helmet.gps_speed)}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {!loading && helmets.length === 0 ? <p className="text-sm text-slate-500">No helmets registered yet.</p> : null}
        </div>
      </div>
    </div>
  );
}
