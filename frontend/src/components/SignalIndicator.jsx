export default function SignalIndicator({ signal = 'UNKNOWN' }) {
  const tone =
    signal === 'STRONG'
      ? 'text-emerald-300 border-emerald-400/20 bg-emerald-500/10'
      : signal === 'MODERATE'
        ? 'text-amber-300 border-amber-400/20 bg-amber-500/10'
        : 'text-rose-300 border-rose-400/20 bg-rose-500/10';

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.24em] ${tone}`}>
      {signal}
    </span>
  );
}
