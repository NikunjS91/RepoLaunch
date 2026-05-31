export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-zinc-300">{label}</label>
      )}
      <input
        className={`w-full bg-zinc-900 border border-surface-border rounded-lg px-3.5 py-2.5
          text-sm text-zinc-100 placeholder:text-zinc-600
          focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/20
          transition-colors duration-150
          ${error ? 'border-red-500/60' : ''}
          ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
