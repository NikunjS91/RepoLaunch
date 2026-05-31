export default function Card({ children, className = '', hover = false }) {
  return (
    <div
      className={`bg-surface border border-surface-border rounded-xl p-6
        ${hover ? 'hover:border-zinc-600 hover:bg-surface-elevated transition-all duration-200 cursor-pointer' : ''}
        ${className}`}
    >
      {children}
    </div>
  )
}
