import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, CalendarDays, FolderKanban, Plus, Server, Workflow } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getErrorMessage, projectApi, taskApi } from '../api/client'
import { Alert, Button, EmptyState, LoadingState, PageHeader, StatusBadge } from '../components/Ui'

function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function ProjectDetailPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    try {
      const [currentProject, currentTasks] = await Promise.all([
        projectApi.get(projectId),
        taskApi.listForProject(projectId),
      ])
      setProject(currentProject)
      setTasks(currentTasks)
      setError('')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [projectId])

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

  if (loading) return <LoadingState label="Loading project…" />
  if (!project) {
    return <><Link to="/projects" className="back-link"><ArrowLeft size={16} /> Projects</Link><Alert>{error || 'Project could not be found.'}</Alert></>
  }

  const counts = {
    pending: tasks.filter((task) => task.status === 'pending').length,
    running: tasks.filter((task) => task.status === 'running').length,
    success: tasks.filter((task) => task.status === 'success').length,
    failed: tasks.filter((task) => task.status === 'failed').length,
  }

  return (
    <>
      <Link to="/projects" className="back-link"><ArrowLeft size={16} /> All projects</Link>
      <PageHeader
        eyebrow="PROJECT"
        title={project.repository}
        description="Project overview and all associated tasks."
        action={<Button onClick={() => navigate(`/tasks/new?projectId=${project._id}`)}><Plus size={17} /> New task</Button>}
      />
      <Alert>{error}</Alert>

      <section className="project-summary-grid">
        <article className="content-card project-info-card">
          <div className="project-summary-header"><div className="project-mark project-mark-0"><FolderKanban size={20} /></div><div><span className="eyebrow">PROJECT DETAILS</span><h2>{project.repository}</h2></div></div>
          <div className="project-detail-row"><Server size={16} /><span>Branch policy</span><strong>{project.branchPolicy || 'feature-branch'}</strong></div>
          <div className="project-detail-row"><Workflow size={16} /><span>Tech stack</span><strong>{project.techStack?.length ? project.techStack.join(', ') : 'Not specified'}</strong></div>
          <div className="project-detail-row"><CalendarDays size={16} /><span>Created</span><strong>{formatDate(project.createdAt)}</strong></div>
        </article>
        <article className="content-card project-activity-card">
          <div className="section-heading"><div><h2>Task activity</h2><p>Live status summary</p></div></div>
          <div className="mini-stat-grid">
            <div><span className="mini-stat-number">{tasks.length}</span><span className="mini-stat-label">Total</span></div>
            <div><span className="mini-stat-number text-amber">{counts.pending}</span><span className="mini-stat-label">Pending</span></div>
            <div><span className="mini-stat-number text-violet">{counts.running}</span><span className="mini-stat-label">Running</span></div>
            <div><span className="mini-stat-number text-green">{counts.success}</span><span className="mini-stat-label">Successful</span></div>
            <div><span className="mini-stat-number text-red">{counts.failed}</span><span className="mini-stat-label">Failed</span></div>
          </div>
        </article>
      </section>

      <section className="content-card">
        <div className="section-heading">
          <div><h2>Project tasks</h2><p>Task statuses refresh automatically.</p></div>
          <Button variant="secondary" onClick={() => navigate(`/tasks/new?projectId=${project._id}`)}><Plus size={16} /> Create task</Button>
        </div>
        {!tasks.length ? (
          <EmptyState icon={Workflow} title="No tasks in this project yet" description="Create the first task to put this project’s workflow in motion." action={<Button onClick={() => navigate(`/tasks/new?projectId=${project._id}`)}><Plus size={16} /> Create task</Button>} />
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>Task</th><th>Operation</th><th>Priority</th><th>Status</th><th>Created</th><th /></tr></thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task._id}>
                    <td><Link className="task-name-link" to={`/tasks/${task._id}`}>{task.title}</Link><span className="table-subtext">{task.description || 'No description'}</span></td>
                    <td><span className="operation-chip">{task.operation}</span></td>
                    <td><span className={`priority-text priority-${task.priority}`}>{task.priority || 'medium'}</span></td>
                    <td><StatusBadge status={task.status} /></td>
                    <td className="date-cell">{formatDate(task.createdAt)}</td>
                    <td><Link className="row-arrow" to={`/tasks/${task._id}`} aria-label={`View ${task.title}`}><ArrowRight size={16} /></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}

export default ProjectDetailPage
