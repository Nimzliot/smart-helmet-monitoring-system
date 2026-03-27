export default function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.34em] text-cyan-300">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-semibold text-white md:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-400 md:text-base">{description}</p>
      </div>
      {action}
    </div>
  );
}
