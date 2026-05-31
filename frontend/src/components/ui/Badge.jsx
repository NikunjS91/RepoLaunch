const STATUS_MAP = {
  NOT_STARTED: { label: 'Not Started', color: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/30' },
  QUEUED:      { label: 'Queued',       color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30', pulse: true },
  IN_PROGRESS: { label: 'Building',     color: 'text-blue-400 bg-blue-400/10 border-blue-400/30', pulse: true },
  READY:       { label: 'Ready',        color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' },
  FAILED:      { label: 'Failed',       color: 'text-red-400 bg-red-400/10 border-red-400/30' },
}

export default function Badge({ status }) {
  const { label, color, pulse } = STATUS_MAP[status] || STATUS_MAP.NOT_STARTED
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${color}`}>
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${color.includes('yellow') ? 'bg-yellow-400' : 'bg-blue-400'}`} />
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${color.includes('yellow') ? 'bg-yellow-400' : 'bg-blue-400'}`} />
        </span>
      )}
      {label}
    </span>
  )
}
