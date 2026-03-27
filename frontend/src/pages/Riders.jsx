import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import { apiRequest } from '../services/api';

const initialForm = {
  name: '',
  phone: '',
  emergency_contact: '',
  email: '',
};

export default function Riders() {
  const [riders, setRiders] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const loadRiders = async () => {
    try {
      setRiders(await apiRequest('/api/riders'));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadRiders();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiRequest('/api/riders', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setForm(initialForm);
      await loadRiders();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Riders"
        title="Rider management"
        description="Register riders, maintain emergency contacts, and prepare helmet assignment workflows."
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-[2rem] border border-slate-800 bg-slate-950/70 p-6">
          {[
            ['name', 'Rider Name'],
            ['phone', 'Phone'],
            ['emergency_contact', 'Emergency Contact'],
            ['email', 'Email'],
          ].map(([key, label]) => (
            <label key={key} className="block">
              <span className="mb-2 block text-sm text-slate-400">{label}</span>
              <input
                required
                value={form[key]}
                onChange={(e) => setForm((current) => ({ ...current, [key]: e.target.value }))}
                className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </label>
          ))}
          <button type="submit" disabled={submitting} className="rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:brightness-110 disabled:opacity-60">
            {submitting ? 'Saving...' : 'Add Rider'}
          </button>
        </form>

        <div className="rounded-[2rem] border border-slate-800 bg-slate-950/70 p-6">
          <div className="space-y-4">
            {riders.map((rider) => (
              <div key={rider.id} className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-white">{rider.name}</p>
                    <p className="text-sm text-slate-400">{rider.email}</p>
                  </div>
                  <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-cyan-300">{rider.id}</span>
                </div>
                <p className="mt-3 text-sm text-slate-400">Phone: {rider.phone}</p>
                <p className="text-sm text-slate-400">Emergency: {rider.emergency_contact}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
