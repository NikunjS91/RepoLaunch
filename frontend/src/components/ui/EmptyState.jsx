import { Link } from 'react-router-dom'
import Button from './Button'

export default function EmptyState({ icon: Icon, title, description, ctaLabel, ctaTo }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {Icon && (
        <div className="mb-4 p-4 rounded-2xl bg-zinc-900 border border-surface-border">
          <Icon size={32} className="text-zinc-600" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-zinc-200 mb-1">{title}</h3>
      <p className="text-sm text-zinc-500 max-w-xs mb-6">{description}</p>
      {ctaLabel && ctaTo && (
        <Link to={ctaTo}>
          <Button>{ctaLabel}</Button>
        </Link>
      )}
    </div>
  )
}
