import { useCallback, useEffect, useState } from 'react'
import { Activity, ArrowRight, CheckCircle2, CircleDashed, Clock3, FolderKanban, Plus, XCircle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { getErrorMessage, listAllTasks, projectApi } from '../api/client'
import { Alert, Button, LoadingState, PageHeader, StatusBadge } from '../components/Ui'

const cards = [
  { key: 'total', label: 'Total tasks', icon: Activity, color: 'blue' },
  { key: 'pending', label: 'Pending', icon: CircleDashed, color: 'amber' },
  { key: 'running', label: 'Running', icon: Clock3, color: 'violet' },
  { key: 'success', label: 'Successful', icon: CheckCircle2, color: 'green' },
  { key: 'failed', label: 'Failed', icon: XCircle, color: 'red' },
]

function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value))
}

function DashboardPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    try {
      const currentProjects = await projectApi.list()
      const currentTasks = await listAllTasks(currentProjects)
      setProjects(currentProjects)
      setTasks(currentTasks)
      setError('')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    const load = () => {
      if (active) void refresh()
    }
    const initialLoad = window.setTimeout(load, 0)
    const timer = window.setInterval(load, 5000)
    return () => {
      active = false
      window.clearTimeout(initialLoad)
      window.clearInterval(timer)
    }
  }, [refresh])

  const stats = {
    total: tasks.length,
    pending: tasks.filter((task) => task.status === 'pending').length,
    running: tasks.filter((task) => task.status === 'running').length,
    success: tasks.filter((task) => task.status === 'success').length,
    failed: tasks.filter((task) => task.status === 'failed').length,
  }

  if (loading) return <LoadingState label="Loading your workspace…" />

  return (
    <>
      <PageHeader
        eyebrow="YOUR WORKSPACE"
        title="Good work starts with clarity."
        description="A real-time view of your projects and background task activity."
        action={<Button onClick={() => navigate('/tasks/new')}><Plus size={17} /> Create task</Button>}
      />
      <Alert>{error}</Alert>

      <section className="stat-grid" aria-label="Task statistics">
        <article className="stat-card project-stat">
          <div className="stat-top"><span className="stat-icon stat-icon-slate"><FolderKanban size={18} /></span><span className="stat-caption">ORGANIZED WORK</span></div>
          <div className="stat-value">{projects.length}</div>
          <div className="stat-label">Total projects</div>
          <Link className="stat-link" to="/projects">View projects <ArrowRight size={14} /></Link>
        </article>
        {cards.map(({ key, label, icon: Icon, color }) => (
          <article className="stat-card" key={key}>
            <div className="stat-top"><span className={`stat-icon stat-icon-${color}`}><Icon size={18} /></span><span className="stat-caption">TASK OVERVIEW</span></div>
            <div className="stat-value">{stats[key]}</div>
            <div className="stat-label">{label}</div>
          </article>
        ))}
      </section>

      <section className="content-card dashboard-recent">
        <div className="section-heading">
          <div><h2>Recent tasks</h2><p>Your latest task activity across all projects</p></div>
          <Link to="/tasks" className="text-link">View task history <ArrowRight size={15} /></Link>
        </div>
        {tasks.length === 0 ? (
          <div className="dashboard-empty">
            <div className="empty-icon"><Activity size={21} /></div>
            <h3>Your task queue is ready</h3>
            <p>Create a project and submit a task to see its real processing status here.</p>
            <div className="empty-actions">
              <Link className="button button-secondary" to="/projects">Browse projects</Link>
              <Link className="button button-primary" to="/tasks/new"><Plus size={16} /> Create task</Link>
            </div>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>Task</th><th>Project</th><th>Operation</th><th>Status</th><th>Created</th><th /></tr></thead>
              <tbody>
                {tasks.slice(0, 6).map((task) => {
                  const project = projects.find((item) => item._id === task.projectId)
                  return (
                    <tr key={task._id}>
                      <td><Link className="task-name-link" to={`/tasks/${task._id}`}>{task.title}</Link><span className="table-subtext">{task.description || 'No description'}</span></td>
                      <td>{project?.repository || 'Project'}</td>
                      <td><span className="operation-chip">{task.operation}</span></td>
                      <td><StatusBadge status={task.status} /></td>
                      <td className="date-cell">{formatDate(task.createdAt)}</td>
                      <td><Link className="row-arrow" to={`/tasks/${task._id}`} aria-label={`View ${task.title}`}><ArrowRight size={16} /></Link></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <div className="dashboard-footnote"><span className="live-dot" /> Task status checks every 5 seconds</div>
    </>
  )
}

export default DashboardPage
