import { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, ArrowRight, Filter, Plus, Search, Workflow } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getErrorMessage, listAllTasks, projectApi } from '../api/client'
import { Alert, EmptyState, LoadingState, PageHeader, StatusBadge } from '../components/Ui'

function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

function TasksPage() {
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [projectFilter, setProjectFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    try {
      const rows = await projectApi.list()
      const taskRows = await listAllTasks(rows)
      setProjects(rows)
      setTasks(taskRows)
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

  const filteredTasks = useMemo(() => tasks.filter((task) => {
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter
    const matchesProject = projectFilter === 'all' || task.projectId === projectFilter
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || task.title?.toLowerCase().includes(query) || task.description?.toLowerCase().includes(query)
    return matchesStatus && matchesProject && matchesSearch
  }), [tasks, statusFilter, projectFilter, search])

  if (loading) return <LoadingState label="Loading task history…" />

  return (
    <>
      <PageHeader
        eyebrow="ACTIVITY"
        title="Task history"
        description="Review task input, processing status, results, and logs."
        action={<Link className="button button-primary" to="/tasks/new"><Plus size={17} /> New task</Link>}
      />
      <Alert>{error}</Alert>
      <section className="content-card">
        <div className="task-filter-bar">
          <label className="search-field"><Search size={17} /><input aria-label="Search tasks" placeholder="Search task titles…" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
          <label className="filter-field"><Filter size={16} /><span className="sr-only">Filter by status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All statuses</option><option value="pending">Pending</option><option value="running">Running</option><option value="success">Successful</option><option value="failed">Failed</option></select></label>
          <label className="filter-field project-filter"><span className="sr-only">Filter by project</span><select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)}><option value="all">All projects</option>{projects.map((project) => <option key={project._id} value={project._id}>{project.repository}</option>)}</select></label>
        </div>
        {!tasks.length ? (
          <EmptyState icon={Workflow} title="No tasks yet" description="Tasks you create will appear here with their live processing status." action={<Link className="button button-primary" to={projects.length ? '/tasks/new' : '/projects'}><Plus size={16} /> {projects.length ? 'Create a task' : 'Create a project'}</Link>} />
        ) : !filteredTasks.length ? (
          <EmptyState icon={Activity} title="No matching tasks" description="Try changing the status, project, or search filters." />
        ) : (
          <>
            <div className="table-scroll">
              <table className="data-table">
                <thead><tr><th>Task</th><th>Project</th><th>Operation</th><th>Priority</th><th>Status</th><th>Created</th><th /></tr></thead>
                <tbody>
                  {filteredTasks.map((task) => {
                    const project = projects.find((item) => item._id === task.projectId)
                    return (
                      <tr key={task._id}>
                        <td><Link className="task-name-link" to={`/tasks/${task._id}`}>{task.title}</Link><span className="table-subtext">{task.description || 'No description'}</span></td>
                        <td>{project ? <Link className="table-project-link" to={`/projects/${project._id}`}>{project.repository}</Link> : '—'}</td>
                        <td><span className="operation-chip">{task.operation}</span></td>
                        <td><span className={`priority-text priority-${task.priority}`}>{task.priority || 'medium'}</span></td>
                        <td><StatusBadge status={task.status} /></td>
                        <td className="date-cell">{formatDate(task.createdAt)}</td>
                        <td><Link className="row-arrow" to={`/tasks/${task._id}`} aria-label={`View ${task.title}`}><ArrowRight size={16} /></Link></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="table-summary">Showing {filteredTasks.length} of {tasks.length} tasks <span><span className="live-dot" /> Refreshes every 5 seconds</span></div>
          </>
        )}
      </section>
    </>
  )
}

export default TasksPage
