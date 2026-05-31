import DeploymentRow from './DeploymentRow'
import { ScrollText } from 'lucide-react'

export default function DeploymentTable({ deployments, projectId }) {
  if (!deployments?.length) {
    return (
      <div className="text-center py-10 text-sm text-zinc-600">
        No deployments yet.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-surface-border">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-surface-border bg-zinc-900/60">
            <th className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">ID</th>
            <th className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Started</th>
            <th className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider text-right">Logs</th>
          </tr>
        </thead>
        <tbody>
          {deployments.map(d => (
            <DeploymentRow key={d.id} deployment={d} projectId={projectId} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
