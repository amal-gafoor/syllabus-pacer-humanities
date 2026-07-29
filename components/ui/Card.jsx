export default function Card({ children, className = "" }) {
  return (
    <div className={`mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 ${className}`}>
      {children}
    </div>
  );
}
