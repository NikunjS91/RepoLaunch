import { useState, useEffect } from 'react'
import { getProject } from '../lib/api'

export function useProject(projectId) {
  const [project, setProject] = useState(null)
  const [deployments, setDeployments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!projectId) return
    setLoading(true)
    getProject(projectId)
      .then(data => {
        setProject(data)
        setDeployments(data?.Deployment || [])
        setLoading(false)
      })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [projectId])

  function addDeployment(deployment) {
    setDeployments(prev => [deployment, ...prev.filter(d => d.id !== deployment.id)])
  }

  return { project, deployments, loading, error, addDeployment }
}
