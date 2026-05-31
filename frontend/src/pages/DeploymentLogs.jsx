import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import PageWrapper from '../components/layout/PageWrapper'
import LogTerminal from '../components/logs/LogTerminal'
import Badge from '../components/ui/Badge'
import CopyButton from '../components/ui/CopyButton'
import Spinner from '../components/ui/Spinner'
import { useDeployLogs } from '../hooks/useDeployLogs'
import { useSocketLogs } from '../hooks/useSocketLogs'

function inferStatus(logs) {
  const all = logs.map(l => (l.log || '').toLowerCase()).join(' ')
  if (all.includes('error') || all.includes('failed') || all.includes('exception')) return 'FAILED'
  if (all.includes('done') || all.includes('success') || all.includes('complete') || all.includes('ready')) return 'READY'
  if (logs.length > 0) return 'IN_PROGRESS'
  return 'QUEUED'
}

export default function DeploymentLogs() {
  const { projectId, deploymentId } = useParams()
  const { logs: historicalLogs, loading } = useDeployLogs(deploymentId)
  const { liveLogs, connected } = useSocketLogs(deploymentId)

  const allLogs = useMemo(() => {
    const liveIds = new Set(liveLogs.map(l => l.event_id))
    const deduped = historicalLogs.filter(l => !liveIds.has(l.event_id))
    return [...deduped, ...liveLogs]
  }, [historicalLogs, liveLogs])

  const status = inferStatus(allLogs)

  // Retrieve project name from localStorage
  let projectName = projectId.slice(0, 8)
  try {
    const projects = JSON.parse(localStorage.getItem('repolaunch_projects') || '[]')
    const p = projects.find(p => p.id === projectId)
    if (p) projectName = p.name
  } catch {}

  return (
    <div className="min-h-screen">
      <Navbar />
      <PageWrapper>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
          <Link to="/" className="hover:text-zinc-300 transition-colors">Projects</Link>
          <span>/</span>
          <Link to={`/project/${projectId}`} className="hover:text-zinc-300 transition-colors">{projectName}</Link>
          <span>/</span>
          <span className="text-zinc-300 font-mono">{deploymentId.slice(0, 8)}…</span>
        </div>

        {/* Status bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-surface border border-surface-border rounded-xl">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-xs text-zinc-500 shrink-0">Deployment</span>
            <span className="font-mono text-xs text-zinc-300 truncate">{deploymentId}</span>
            <CopyButton text={deploymentId} />
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Badge status={status} />
            {connected && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                Live
              </span>
            )}
          </div>
        </div>

        {/* Terminal */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : (
          <LogTerminal
            historicalLogs={historicalLogs}
            liveLogs={liveLogs}
            connected={connected}
            deploymentId={deploymentId}
          />
        )}

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between text-xs text-zinc-600">
          <span>
            {allLogs.length} log line{allLogs.length !== 1 ? 's' : ''}
          </span>
          <Link
            to={`/project/${projectId}`}
            className="flex items-center gap-1.5 hover:text-zinc-400 transition-colors"
          >
            <ArrowLeft size={12} />
            Back to project
          </Link>
        </div>
      </PageWrapper>
    </div>
  )
}
