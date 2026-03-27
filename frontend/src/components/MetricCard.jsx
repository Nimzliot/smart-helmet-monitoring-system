export default function MetricCard({ title, value, hint, icon, tone = 'blue' }) {
  const toneClass = {
    blue: 'from-cyan-400/20 to-sky-500/10 border-cyan-400/20',
    green: 'from-emerald-400/20 to-teal-500/10 border-emerald-400/20',
    amber: 'from-amber-400/20 to-orange-500/10 border-amber-400/20',
    red: 'from-rose-400/20 to-red-500/10 border-rose-400/20',
  }[tone];

  return (
    <div className={`rounded-3xl border bg-gradient-to-br ${toneClass} p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]`}>
      <div className="mb-5 flex items-start justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">{title}</p>
          <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3 text-slate-200">{icon}</div>
      </div>
      <p className="text-sm text-slate-400">{hint}</p>
    </div>
  );
}
