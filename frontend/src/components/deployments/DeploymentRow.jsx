import { Link } from 'react-router-dom'
import Badge from '../ui/Badge'
import { ScrollText } from 'lucide-react'

function fmtDate(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
}

export default function DeploymentRow({ deployment, projectId }) {
  return (
    <tr className="border-b border-surface-border hover:bg-zinc-900/60 transition-colors">
      <td className="px-4 py-3 font-mono text-xs text-zinc-400">{deployment.id.slice(0, 8)}…</td>
      <td className="px-4 py-3"><Badge status={deployment.status} /></td>
      <td className="px-4 py-3 text-sm text-zinc-500">{fmtDate(deployment.createdAt)}</td>
      <td className="px-4 py-3 text-right">
        <Link
          to={`/project/${projectId}/deploy/${deployment.id}`}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-accent transition-colors"
        >
          <ScrollText size={13} />
          View Logs
        </Link>
      </td>
    </tr>
  )
}
