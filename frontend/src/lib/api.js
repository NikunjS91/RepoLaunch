import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:9000',
})

// Attach JWT to every request automatically
api.interceptors.request.use(config => {
  const token = localStorage.getItem('repolaunch_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Auth ─────────────────────────────────────────────────────────────────────
export const registerUser = (email, password) =>
  api.post('auth/register', { email, password }).then(r => r.data)

export const loginUser = (email, password) =>
  api.post('auth/login', { email, password }).then(r => r.data)

// ── Projects ──────────────────────────────────────────────────────────────────
export const getProjects = () =>
  api.get('projects').then(r => r.data.data.projects)

export const getProject = (id) =>
  api.get(`project/${id}`).then(r => r.data.data.project)

export const createProject = (name, gitURL) =>
  api.post('project', { name, gitURL }).then(r => r.data.data.project)

export const deployProject = (projectId) =>
  api.post('deploy', { projectId }).then(r => r.data.data)

export const getLogs = (deploymentId) =>
  api.get(`logs/${deploymentId}`).then(r => r.data.logs)
