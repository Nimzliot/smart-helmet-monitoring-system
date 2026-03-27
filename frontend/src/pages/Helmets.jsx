import { useEffect, useState } from 'react';
import BatteryIndicator from '../components/BatteryIndicator';
import PageHeader from '../components/PageHeader';
import { apiRequest } from '../services/api';

const initialForm = {
  helmet_id: '',
  rider_id: '',
  status: 'IDLE',
  battery_level: 100,
};

export default function Helmets() {
  const [helmets, setHelmets] = useState([]);
  const [riders, setRiders] = useState([]);
  const [form, setForm] = useState(initialForm);

  const load = async () => {
    try {
      const [helmetData, riderData] = await Promise.all([
        apiRequest('/api/helmets'),
        apiRequest('/api/riders'),
      ]);
      setHelmets(helmetData);
      setRiders(riderData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Helmets"
        title="Helmet registry"
        description="Track available helmets, assign riders, review live status, and manage battery readiness."
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-[2rem] border border-slate-800 bg-slate-950/70 p-6">
          <label className="block">
            <span className="mb-2 block text-sm text-slate-400">Helmet ID</span>
            <input required value={form.helmet_id} onChange={(e) => setForm((current) => ({ ...current, helmet_id: e.target.value }))} className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-cyan-400" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-slate-400">Assigned Rider</span>
            <select value={form.rider_id} onChange={(e) => setForm((current) => ({ ...current, rider_id: e.target.value }))} className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-cyan-400">
              <option value="">Unassigned</option>
              {riders.map((rider) => (
                <option key={rider.id} value={rider.id}>{rider.name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-slate-400">Status</span>
            <select value={form.status} onChange={(e) => setForm((current) => ({ ...current, status: e.target.value }))} className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-cyan-400">
              <option value="IDLE">IDLE</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="ALERT">ALERT</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-slate-400">Battery Level</span>
            <input type="number" min="0" max="100" value={form.battery_level} onChange={(e) => setForm((current) => ({ ...current, battery_level: e.target.value }))} className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-cyan-400" />
          </label>
          <button type="submit" className="rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:brightness-110">
            Save Helmet
          </button>
        </form>

        <div className="space-y-4 rounded-[2rem] border border-slate-800 bg-slate-950/70 p-6">
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
