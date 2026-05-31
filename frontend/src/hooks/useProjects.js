import { useState, useEffect, useCallback } from 'react'
import { getProjects } from '../lib/api'

export function useProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProjects = useCallback(() => {
    setLoading(true)
    getProjects()
      .then(data => { setProjects(data || []); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  function addProject(project) {
    setProjects(prev => [project, ...prev.filter(p => p.id !== project.id)])
  }

  return { projects, loading, error, addProject, refetch: fetchProjects }
}
