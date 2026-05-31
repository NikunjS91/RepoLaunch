import { Link, useNavigate } from 'react-router-dom'
import { ExternalLink, GitBranch, Rocket } from 'lucide-react'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import { deployProject } from '../../lib/api'
import { useState } from 'react'

export default function ProjectCard({ project, lastDeployment, onDeploy }) {
  const navigate = useNavigate()
  const [deploying, setDeploying] = useState(false)

  async function handleDeploy(e) {
    e.stopPropagation()
    e.preventDefault()
    setDeploying(true)
    try {
      const result = await deployProject(project.id)
      onDeploy?.(result.deploymentId)
      navigate(`/project/${project.id}/deploy/${result.deploymentId}`)
    } finally {
      setDeploying(false)
    }
  }

  const siteUrl = `http://${project.subDomain}.localhost:8000`

  return (
    <div className="relative group p-[1px] rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 hover:from-emerald-500/20 hover:to-cyan-500/20 transition-all duration-300">
      <div className="bg-surface rounded-[11px] p-6 h-full flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-zinc-100 truncate text-base">{project.name}</h3>
            <a
              href={project.gitURL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 mt-0.5 transition-colors"
              onClick={e => e.stopPropagation()}
            >
              <GitBranch size={12} />
              <span className="truncate max-w-[180px]">{project.gitURL.replace('https://github.com/', '')}</span>
            </a>
          </div>
          {lastDeployment && <Badge status={lastDeployment.status} />}
        </div>

        {/* Subdomain */}
        <a
          href={siteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-accent hover:underline truncate"
          onClick={e => e.stopPropagation()}
        >
          <ExternalLink size={11} />
          {project.subDomain}.localhost:8000
        </a>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto pt-2 border-t border-surface-border">
          <Link to={`/project/${project.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">View Project</Button>
          </Link>
          <Button size="sm" onClick={handleDeploy} loading={deploying}>
            <Rocket size={13} />
            Deploy
          </Button>
        </div>
      </div>
    </div>
  )
}
