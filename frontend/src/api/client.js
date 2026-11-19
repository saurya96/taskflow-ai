import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('taskflow_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem('taskflow_token')) {
      localStorage.removeItem('taskflow_token')
      localStorage.removeItem('taskflow_user')
      window.dispatchEvent(new Event('taskflow:unauthorized'))
    }
    return Promise.reject(error)
  },
)

export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error.response?.data?.message) return error.response.data.message
  if (error.code === 'ERR_NETWORK') {
    return 'Unable to reach TaskFlow API. Check the API URL and make sure the backend is running.'
  }
  return fallback
}

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (details) => api.post('/auth/register', details),
  profile: () => api.get('/auth/profile'),
}

export const projectApi = {
  list: async () => (await api.get('/projects')).data.projects,
  get: async (projectId) => (await api.get(`/projects/${projectId}`)).data.project,
  create: async (project) => (await api.post('/projects', project)).data.project,
  update: async (projectId, project) =>
    (await api.put(`/projects/${projectId}`, project)).data.project,
  remove: (projectId) => api.delete(`/projects/${projectId}`),
}

export const taskApi = {
  listForProject: async (projectId) =>
    (await api.get(`/tasks/project/${projectId}`)).data.tasks,
  get: async (taskId) => (await api.get(`/tasks/${taskId}`)).data.task,
  create: async (task) => (await api.post('/tasks', task)).data.task,
  update: async (taskId, updates) =>
    (await api.put(`/tasks/${taskId}`, updates)).data.task,
  remove: (taskId) => api.delete(`/tasks/${taskId}`),
}

export async function listAllTasks(projects) {
  if (!projects.length) return []
  const taskGroups = await Promise.all(
    projects.map((project) => taskApi.listForProject(project._id)),
  )
  return taskGroups.flat().sort(
    (first, second) => new Date(second.createdAt) - new Date(first.createdAt),
  )
}

export default api
