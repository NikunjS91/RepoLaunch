import { useState, useEffect } from 'react'
import { getLogs } from '../lib/api'

export function useDeployLogs(deploymentId) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!deploymentId) return
    setLoading(true)
    getLogs(deploymentId)
      .then(data => { setLogs(data || []); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [deploymentId])

  return { logs, loading, error }
}
