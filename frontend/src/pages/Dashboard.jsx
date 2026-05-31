import { useNavigate } from 'react-router-dom'
import { Layers, Plus } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import PageWrapper from '../components/layout/PageWrapper'
import ProjectGrid from '../components/projects/ProjectGrid'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import { useProjects } from '../hooks/useProjects'

export default function Dashboard() {
  const { projects, loading, addProject, refetch } = useProjects()
  const navigate = useNavigate()

  function getLastDeployment(project) {
    return project?.Deployment?.[0] || null
  }

  function handleDeploy(projectId, deploymentId) {
    refetch()
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <PageWrapper>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Projects</h1>
            <p className="text-sm text-zinc-500 mt-1">
              {loading ? '…' : `${projects.length} project${projects.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <Button onClick={() => navigate('/new')}>
            <Plus size={15} />
            New Project
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No projects yet"
            description="Import a Git repository to deploy your first project."
            ctaLabel="New Project"
            ctaTo="/new"
          />
        ) : (
          <ProjectGrid
            projects={projects}
            getLastDeployment={getLastDeployment}
            onDeploy={handleDeploy}
          />
        )}
      </PageWrapper>
    </div>
  )
}
