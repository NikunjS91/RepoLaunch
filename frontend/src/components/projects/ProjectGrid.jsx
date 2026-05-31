import ProjectCard from './ProjectCard'

export default function ProjectGrid({ projects, getLastDeployment, onDeploy }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map(p => (
        <ProjectCard
          key={p.id}
          project={p}
          lastDeployment={getLastDeployment?.(p)}
          onDeploy={(deploymentId) => onDeploy?.(p.id, deploymentId)}
        />
      ))}
    </div>
  )
}
