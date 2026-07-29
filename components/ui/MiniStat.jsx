export default function MiniStat({ color, icon, value, label }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="mb-1 flex items-center gap-1.5" style={{ color }}>
        {icon}
        <span className="text-xl font-bold">{value}</span>
      </div>
      <span className="text-xs text-slate-400">{label}</span>
    </div>
  );
}
