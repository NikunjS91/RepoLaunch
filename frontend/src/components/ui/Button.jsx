const VARIANTS = {
  primary: 'bg-accent hover:bg-accent-dim text-zinc-950 font-semibold',
  outline: 'border border-surface-border hover:border-zinc-500 text-zinc-200 hover:text-white bg-transparent',
  ghost:   'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 bg-transparent',
  danger:  'bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400',
}

const SIZES = {
  sm: 'text-xs px-3 py-1.5 rounded-lg',
  md: 'text-sm px-4 py-2 rounded-lg',
  lg: 'text-sm px-5 py-2.5 rounded-xl',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled = false,
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-medium transition-all duration-150
        ${VARIANTS[variant]} ${SIZES[size]}
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}`}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      )}
      {children}
    </button>
  )
}
