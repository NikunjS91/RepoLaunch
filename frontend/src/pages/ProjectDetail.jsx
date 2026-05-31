import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, GitBranch, ExternalLink, Rocket, Calendar, Globe } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import PageWrapper from '../components/layout/PageWrapper'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import CopyButton from '../components/ui/CopyButton'
import Spinner from '../components/ui/Spinner'
import DeploymentTable from '../components/deployments/DeploymentTable'
import { useProject } from '../hooks/useProject'
import { deployProject } from '../lib/api'

function fmtDate(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString([], { dateStyle: 'long' })
}

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { project, deployments, loading, addDeployment } = useProject(id)
  const [deploying, setDeploying] = useState(false)
  const [deployError, setDeployError] = useState(null)

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <PageWrapper><div className="flex justify-center py-20"><Spinner size="lg" /></div></PageWrapper>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <PageWrapper>
          <p className="text-zinc-500">Project not found.</p>
          <Link to="/" className="text-accent text-sm hover:underline mt-2 block">← Back to projects</Link>
        </PageWrapper>
      </div>
    )
  }

  const siteUrl = `http://${project.subDomain}.localhost:8000`

  async function handleDeploy() {
    setDeploying(true)
    setDeployError(null)
    try {
      const { deploymentId } = await deployProject(project.id)
      addDeployment({ id: deploymentId, status: 'QUEUED', createdAt: new Date().toISOString() })
      navigate(`/project/${project.id}/deploy/${deploymentId}`)
    } catch (err) {
      setDeployError(err?.response?.data?.message || err.message)
    } finally {
      setDeploying(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <PageWrapper>
        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          <Link to="/" className="hover:text-zinc-300 transition-colors">Projects</Link>
          <span>/</span>
          <span className="text-zinc-300">{project.name}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="md:col-span-2">
            <h1 className="text-xl font-bold text-zinc-100 mb-4">{project.name}</h1>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <GitBranch size={15} className="text-zinc-500 shrink-0" />
                <a href={project.gitURL} target="_blank" rel="noopener noreferrer"
                  className="text-zinc-400 hover:text-accent truncate transition-colors">
                  {project.gitURL}
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Globe size={15} className="text-zinc-500 shrink-0" />
                <a href={siteUrl} target="_blank" rel="noopener noreferrer"
                  className="text-accent hover:underline truncate">
                  {project.subDomain}.localhost:8000
                </a>
                <ExternalLink size={12} className="text-zinc-600" />
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar size={15} className="text-zinc-500 shrink-0" />
                <span className="text-zinc-500">Created {fmtDate(project.createdAt)}</span>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Quick Actions</h2>
            <div className="flex flex-col gap-3">
              <Button onClick={handleDeploy} loading={deploying} className="w-full">
                <Rocket size={14} />
                Trigger New Deploy
              </Button>
              <a href={siteUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full">
                  <ExternalLink size={14} />
                  Visit Live Site
                </Button>
              </a>
              <div className="flex items-center justify-between bg-zinc-900 border border-surface-border rounded-lg px-3 py-2">
                <span className="font-mono text-xs text-zinc-400 truncate">{project.subDomain}</span>
                <CopyButton text={project.subDomain} />
              </div>
            </div>
            {deployError && <p className="mt-3 text-xs text-red-400">{deployError}</p>}
          </Card>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-base font-semibold text-zinc-200">Deployment History</h2>
            <span className="text-xs font-medium text-zinc-600 bg-zinc-800 border border-surface-border px-2 py-0.5 rounded-full">
              {deployments.length}
            </span>
          </div>
          <DeploymentTable deployments={deployments} projectId={project.id} />
        </div>
      </PageWrapper>
    </div>
  )
}
