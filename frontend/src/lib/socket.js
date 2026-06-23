import { io } from 'socket.io-client'

let socket = null

function getSocket() {
  if (!socket) {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || ''
    socket = io(socketUrl, {
      transports: ['websocket'],
      autoConnect: true,
    })
  }
  return socket
}

export function subscribeToDeployment(deploymentId, onLog, onConnected) {
  const s = getSocket()

  const handleMessage = (msg) => {
    if (typeof msg === 'string' && msg.startsWith('Subscribed')) {
      onConnected?.()
      return
    }
    onLog(msg)
  }

  s.emit('Subscribe', deploymentId)
  s.on('message', handleMessage)

  return () => s.off('message', handleMessage)
}
