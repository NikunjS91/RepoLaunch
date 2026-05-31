import { useState, useEffect } from 'react'
import { subscribeToDeployment } from '../lib/socket'

export function useSocketLogs(deploymentId) {
  const [liveLogs, setLiveLogs] = useState([])
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!deploymentId) return

    const cleanup = subscribeToDeployment(
      deploymentId,
      (msg) => {
        setLiveLogs(prev => [
          ...prev,
          {
            log: msg,
            timestamp: new Date().toISOString(),
            event_id: crypto.randomUUID(),
            live: true,
          },
        ])
      },
      () => setConnected(true)
    )

    return cleanup
  }, [deploymentId])

  return { liveLogs, connected }
}
