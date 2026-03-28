import { Bell, Compass, Gauge, HardHat, HeartPulse, History, LogOut, Settings, Shield, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const links = [
  { label: 'Dashboard', path: '/', icon: Gauge },
  { label: 'Live Monitoring', path: '/live', icon: HeartPulse },
  { label: 'Alerts', path: '/alerts', icon: Bell },
  { label: 'History', path: '/history', icon: History },
  { label: 'Analytics', path: '/analytics', icon: Compass },
  { label: 'Riders', path: '/riders', icon: Users },
  { label: 'Helmets', path: '/helmets', icon: HardHat },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_transparent_34%),linear-gradient(180deg,_#020617,_#020817_42%,_#030712)] text-slate-100">
      <div className="min-h-screen">
        <div className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/90 px-4 py-4 backdrop-blur xl:hidden">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-300">Smart Helmet</p>
              <p className="mt-1 text-lg font-semibold text-white">Operator Console</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-3 py-2 text-sm text-slate-300"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
          <nav className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {links.map(({ label, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm transition ${
                    isActive
                      ? 'bg-cyan-400/10 text-cyan-200 ring-1 ring-cyan-400/20'
                      : 'bg-slate-900/70 text-slate-400'
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <aside className="fixed inset-y-0 left-0 hidden w-80 border-r border-slate-800/80 bg-slate-950/70 p-7 backdrop-blur xl:flex xl:flex-col">
          <div className="rounded-3xl border border-cyan-400/20 bg-slate-900/80 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-cyan-400/10 p-3 text-cyan-300">
                <Shield size={28} />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-cyan-300">IoT Safety Platform</p>
                <h2 className="mt-1 text-xl font-semibold text-white">Smart Helmet Command</h2>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-400">
              Live telemetry, rider protection, alert handling, and emergency response in one operator console.
            </p>
          </div>

          <nav className="mt-8 flex flex-1 flex-col gap-2">
            {links.map(({ label, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-cyan-400/10 text-cyan-200 ring-1 ring-cyan-400/20'
                      : 'text-slate-400 hover:bg-slate-900/70 hover:text-white'
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
            <p className="text-sm font-semibold text-white">{user?.name || 'Operator'}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-500">{user?.role || 'admin'}</p>
            <button
              type="button"
              onClick={logout}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-rose-400/40 hover:text-white"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </aside>

        <main className="xl:ml-80">
          <div className="mx-auto max-w-7xl p-5 md:p-8">
            <div className="mb-6 hidden items-center justify-between rounded-3xl border border-slate-800/70 bg-slate-950/55 px-5 py-4 xl:flex">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-300">Admin Dashboard</p>
                <p className="mt-1 text-lg font-semibold text-white">Smart Helmet Command Center</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{user?.name || 'Admin'}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-500">{user?.role || 'admin'}</p>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-rose-400/40 hover:text-white"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>

            <div className="mb-6 rounded-3xl border border-slate-800/70 bg-slate-950/50 px-5 py-4 xl:hidden">
              <p className="text-sm font-semibold text-white">{user?.name || 'Operator'}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-500">{user?.role || 'admin'}</p>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
