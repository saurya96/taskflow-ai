import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, Copy, FileText, Pencil, RefreshCw, Trash2, WandSparkles } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { getErrorMessage, taskApi } from '../api/client'
import { Alert, Button, LoadingState, Modal, PageHeader, StatusBadge } from '../components/Ui'

function formatDate(value) {
  if (!value) return 'Not recorded'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function TaskEditForm({ task, onSave, onCancel, saving }) {
  const [title, setTitle] = useState(task.title || '')
  const [description, setDescription] = useState(task.description || '')
  const [priority, setPriority] = useState(task.priority || 'medium')
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    if (!title.trim()) {
      setError('Task title is required.')
      return
    }
    await onSave({ title: title.trim(), description: description.trim(), priority })
  }

  return (
    <form className="form-stack" onSubmit={submit}>
      <Alert>{error}</Alert>
      <label className="field"><span>Title</span><input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} required /></label>
      <label className="field"><span>Description</span><input value={description} onChange={(event) => setDescription(event.target.value)} /></label>
      <label className="field"><span>Priority</span><select value={priority} onChange={(event) => setPriority(event.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
      <p className="form-note">The API does not allow editing task input or operation after submission.</p>
      <div className="modal-actions"><Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button></div>
    </form>
  )
}

function TaskDetailPage() {
  const { taskId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(location.state?.warning || (location.state?.created ? 'Task submitted. Waiting for the worker to process it.' : ''))
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const currentTask = await taskApi.get(taskId)
      setTask(currentTask)
      if (currentTask.status === 'success' || currentTask.status === 'failed') {
        setNotice('')
      }
      setError('')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    let active = true
    const load = () => {
      if (active) void refresh()
    }
    const initialLoad = window.setTimeout(load, 0)
    const timer = window.setInterval(load, 3000)
    return () => {
      active = false
      window.clearTimeout(initialLoad)
      window.clearInterval(timer)
    }
  }, [refresh])

  const save = async (updates) => {
    setSaving(true)
    try {
      await taskApi.update(taskId, updates)
      setModalOpen(false)
      setNotice('Task details updated.')
      await refresh()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!window.confirm(`Delete task "${task.title}"? This cannot be undone.`)) return
    try {
      await taskApi.remove(taskId)
      navigate('/tasks', { replace: true })
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  const copyResult = async () => {
    if (!task?.result) return
    try {
      await navigator.clipboard.writeText(task.result)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setError('Could not copy the result. Select and copy the text instead.')
    }
  }

  if (loading) return <LoadingState label="Loading task…" />
  if (!task) return <><Link to="/tasks" className="back-link"><ArrowLeft size={16} /> Task history</Link><Alert>{error || 'Task could not be found.'}</Alert></>

  return (
    <>
      <Link to="/tasks" className="back-link"><ArrowLeft size={16} /> Task history</Link>
      <PageHeader
        eyebrow={`TASK · ${task.operation}`}
        title={task.title}
        description={task.description || 'No task description provided.'}
        action={<div className="header-button-group"><Button variant="secondary" onClick={() => setModalOpen(true)} disabled={task.status === 'running'}><Pencil size={16} /> Edit</Button><Button variant="danger" onClick={remove}><Trash2 size={16} /> Delete</Button></div>}
      />
      <Alert>{error}</Alert>
      <Alert variant="success">{notice}</Alert>

      <div className="task-detail-layout">
        <div className="task-detail-main">
          <section className="content-card task-status-card">
            <div className="section-heading">
              <div><p className="eyebrow">PROCESSING STATUS</p><h2>{task.status === 'success' ? 'Task completed' : task.status === 'failed' ? 'Task needs attention' : task.status === 'running' ? 'Worker is processing your task' : 'Waiting in the queue'}</h2></div>
              <StatusBadge status={task.status} />
            </div>
            <p className="status-explanation">
              {task.status === 'success' && 'The worker finished this operation and saved the result.'}
              {task.status === 'failed' && 'The worker reported a failure. Review the processing log below.'}
              {task.status === 'running' && 'This page checks for updates automatically every 3 seconds.'}
              {task.status === 'pending' && 'This task has not been reported as started by the worker yet.'}
            </p>
            {(task.status === 'pending' || task.status === 'running') && <div className="processing-line"><RefreshCw size={15} className="spin" /> Live updates are enabled</div>}
          </section>

          <section className="content-card">
            <div className="section-heading"><div><h2>Input</h2><p>Text submitted for this operation</p></div><span className="operation-chip">{task.operation}</span></div>
            <pre className="task-text-block">{task.inputText}</pre>
          </section>

          {task.status === 'success' && (
            <section className="content-card result-card">
              <div className="section-heading"><div><h2><CheckCircle2 size={19} /> Result</h2><p>Confirmed output returned by the worker</p></div><Button variant="secondary" className="copy-button" onClick={copyResult}><Copy size={15} /> {copied ? 'Copied' : 'Copy'}</Button></div>
              <pre className="task-result-block">{task.result}</pre>
            </section>
          )}

          <section className="content-card logs-card">
            <div className="section-heading"><div><h2><FileText size={18} /> Processing log</h2><p>Updates persisted with this task</p></div><span className="log-count">{task.logs?.length || 0} entries</span></div>
            {task.logs?.length ? (
              <ol className="log-list">
                {task.logs.map((line, index) => {
                  const parts = line.match(/^(\S+T\S+)\s+(INFO|ERROR|WARNING)\s+(.*)$/)
                  return (
                    <li key={`${line}-${index}`} className={parts?.[2] === 'ERROR' ? 'log-error' : ''}>
                      <span className="log-indicator" />
                      <time>{parts ? formatDate(parts[1]) : `Entry ${index + 1}`}</time>
                      <span className="log-level">{parts?.[2] || 'LOG'}</span>
                      <span className="log-message">{parts?.[3] || line}</span>
                    </li>
                  )
                })}
              </ol>
            ) : <p className="muted-copy logs-empty">No processing logs have been reported yet.</p>}
          </section>
        </div>

        <aside className="task-detail-sidebar">
          <section className="content-card task-meta-card">
            <h2>Task details</h2>
            <div className="meta-row"><span><WandSparkles size={15} /> Operation</span><strong>{task.operation}</strong></div>
            <div className="meta-row"><span><span className="meta-priority-dot" /> Priority</span><strong className={`priority-${task.priority}`}>{task.priority || 'medium'}</strong></div>
            <div className="meta-row"><span><CalendarDays size={15} /> Created</span><strong>{formatDate(task.createdAt)}</strong></div>
            <div className="meta-row"><span><Clock3 size={15} /> Updated</span><strong>{formatDate(task.updatedAt)}</strong></div>
            <Link to={`/projects/${task.projectId}`} className="meta-project-link">View parent project <ArrowLeft size={14} /></Link>
          </section>
          <div className="polling-note"><span className="live-dot" /> Status refreshes every 3 seconds</div>
        </aside>
      </div>
      {modalOpen && <Modal title="Edit task details" onClose={() => setModalOpen(false)}><TaskEditForm task={task} onSave={save} onCancel={() => setModalOpen(false)} saving={saving} /></Modal>}
    </>
  )
}

export default TaskDetailPage
