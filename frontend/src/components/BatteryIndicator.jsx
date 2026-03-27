export default function BatteryIndicator({ level = 0 }) {
  const color =
    level <= 20 ? 'bg-rose-500' : level <= 40 ? 'bg-amber-400' : 'bg-emerald-400';

  return (
    <div className="flex items-center gap-3">
      <div className="h-3 w-28 overflow-hidden rounded-full bg-slate-800">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(4, level)}%` }} />
      </div>
      <span className="text-sm font-semibold text-slate-200">{level}%</span>
    </div>
  );
}
