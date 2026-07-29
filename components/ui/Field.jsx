// text-base (16px) is deliberate: anything smaller makes iOS Safari zoom the
// whole page in when the field is focused, which is horrible on a phone.
export const inputCls =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-base text-slate-800 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100";

export const errCls =
  " border-rose-300 bg-rose-50/40 focus:border-rose-400 focus:ring-rose-100";

export default function Field({ label, children, hint, required, error }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-rose-500">{error}</span>
      ) : (
        hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>
      )}
    </label>
  );
}
