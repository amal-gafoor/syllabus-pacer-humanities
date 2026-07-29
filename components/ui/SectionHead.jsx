export default function SectionHead({ icon, n, title, sub }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-brand-50 text-sm font-bold text-brand-600">
        {n}
      </span>
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <span className="text-brand-500">{icon}</span> {title}
        </h2>
        {sub && <p className="mt-0.5 text-sm text-slate-500">{sub}</p>}
      </div>
    </div>
  );
}
