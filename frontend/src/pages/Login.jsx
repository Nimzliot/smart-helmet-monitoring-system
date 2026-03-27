import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, KeyRound, Mail } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const [email, setEmail] = useState('admin@smarthelmet.local');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login({ email, password });
      navigate(location.state?.from?.pathname || '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.20),_transparent_30%),linear-gradient(180deg,_#020617,_#020817_40%,_#030712)] p-4">
      <div className="absolute left-[-10%] top-[-12%] h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute bottom-[-12%] right-[-10%] h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />

      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="hidden rounded-[2rem] border border-slate-800 bg-slate-950/60 p-10 backdrop-blur lg:block">
          <p className="text-xs uppercase tracking-[0.34em] text-cyan-300">Smart Helmet Rider Monitoring System</p>
          <h1 className="mt-6 max-w-xl text-5xl font-semibold leading-tight text-white">
            Production-style command center for helmet telemetry, GPS safety, and emergency response.
          </h1>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              ['Real-time telemetry', 'Live battery, fall, drowsiness, alcohol, and signal streaming'],
              ['Rider operations', 'Track riders, helmets, assignments, and live health'],
              ['Emergency workflow', 'Alert generation with console-based emergency notifications'],
            ].map(([title, body]) => (
              <div key={title} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
                <p className="font-semibold text-white">{title}</p>
                <p className="mt-3 text-sm text-slate-400">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="relative z-10 rounded-[2rem] border border-slate-800 bg-slate-950/75 p-8 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur">
          <div className="mb-8 flex flex-col items-center">
            <div className="mb-4 rounded-full bg-cyan-400/10 p-4">
              <ShieldAlert size={32} className="text-cyan-300" />
            </div>
            <h2 className="text-2xl font-semibold text-white">Secure Operator Login</h2>
            <p className="mt-2 text-center text-sm text-slate-400">
              Use <span className="font-semibold text-slate-200">admin@smarthelmet.local / admin123</span> or monitor credentials to enter the control room.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error ? (
              <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            ) : null}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-400">Operator Email</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail size={18} className="text-slate-500" />
                </div>
                <input
                  type="email"
                  required
                  className="block w-full rounded-2xl border border-slate-800 bg-slate-900 pl-10 pr-3 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-400">Password</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <KeyRound size={18} className="text-slate-500" />
                </div>
                <input
                  type="password"
                  required
                  className="block w-full rounded-2xl border border-slate-800 bg-slate-900 pl-10 pr-3 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? 'Signing in...' : 'Access Command Center'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
