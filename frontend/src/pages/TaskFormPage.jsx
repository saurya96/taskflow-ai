import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, FileText, FolderKanban, WandSparkles } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getErrorMessage, projectApi, taskApi } from '../api/client'
import { Alert, Button, LoadingState, PageHeader } from '../components/Ui'

const initialForm = {
  title: '',
  description: '',
  projectId: '',
  inputText: '',
  operation: 'uppercase',
  priority: 'medium',
}

function TaskFormPage() {
  const [values, setValues] = useState(initialForm)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    projectApi.list()
      .then((rows) => {
        setProjects(rows)
        const requestedProject = searchParams.get('projectId')
        if (requestedProject && rows.some((project) => project._id === requestedProject)) {
          setValues((current) => ({ ...current, projectId: requestedProject }))
        } else if (rows.length === 1) {
          setValues((current) => ({ ...current, projectId: rows[0]._id }))
        }
      })
      .catch((requestError) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false))
  }, [searchParams])

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (!values.title.trim()) return setError('Enter a task title.')
    if (!values.projectId) return setError('Choose a project for this task.')
    if (!values.inputText.trim()) return setError('Enter the text to process.')

    setSubmitting(true)
    try {
      const task = await taskApi.create({
        title: values.title.trim(),
        description: values.description.trim(),
        projectId: values.projectId,
        inputText: values.inputText,
        operation: values.operation,
        priority: values.priority,
      })
      navigate(`/tasks/${task._id}`, { state: { created: true } })
    } catch (requestError) {
      const message = getErrorMessage(requestError, 'Unable to create task.')
      const orphanedTaskId = requestError.response?.data?.taskId
      if (orphanedTaskId) {
        navigate(`/tasks/${orphanedTaskId}`, { state: { warning: message } })
        return
      }
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingState label="Loading project options…" />

  return (
    <>
      <Link to="/tasks" className="back-link"><ArrowLeft size={16} /> Task history</Link>
      <PageHeader eyebrow="NEW TASK" title="Create a task" description="Choose a project and operation. Your task will be queued for background processing." />
      {error && <Alert>{error}</Alert>}
      {!projects.length ? (
        <section className="content-card no-project-prompt">
          <div className="empty-icon"><FolderKanban size={22} /></div>
          <h2>Create a project first</h2>
          <p>Every task belongs to one of your projects.</p>
          <Link className="button button-primary" to="/projects">Go to projects <ArrowRight size={16} /></Link>
        </section>
      ) : (
        <form className="content-card task-form-card" onSubmit={submit}>
          <div className="form-section-heading"><div className="form-section-icon"><FileText size={18} /></div><div><h2>Task details</h2><p>Tell TaskFlow what to process and where it belongs.</p></div></div>
          <div className="form-grid">
            <label className="field field-span">
              <span>Task title <b aria-hidden="true">*</b></span>
              <input autoFocus maxLength={120} placeholder="e.g. Normalize customer notes" value={values.title} onChange={(event) => setValues({ ...values, title: event.target.value })} required />
            </label>
            <label className="field">
              <span>Project <b aria-hidden="true">*</b></span>
              <select value={values.projectId} onChange={(event) => setValues({ ...values, projectId: event.target.value })} required>
                <option value="">Select a project</option>
                {projects.map((project) => <option value={project._id} key={project._id}>{project.repository}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Priority</span>
              <select value={values.priority} onChange={(event) => setValues({ ...values, priority: event.target.value })}>
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
              </select>
            </label>
            <label className="field field-span">
              <span>Description <small>Optional</small></span>
              <input maxLength={500} placeholder="A short note to help you recognize this task" value={values.description} onChange={(event) => setValues({ ...values, description: event.target.value })} />
            </label>
            <label className="field">
              <span>Operation <b aria-hidden="true">*</b></span>
              <select value={values.operation} onChange={(event) => setValues({ ...values, operation: event.target.value })}>
                <option value="uppercase">Convert to uppercase</option>
                <option value="lowercase">Convert to lowercase</option>
                <option value="reverse">Reverse text</option>
                <option value="word_count">Count words</option>
              </select>
            </label>
            <div className="operation-hint"><WandSparkles size={16} /><span>{values.operation === 'word_count' ? 'Counts words separated by whitespace.' : 'The selected operation runs asynchronously in the task worker.'}</span></div>
            <label className="field field-span">
              <span>Input text <b aria-hidden="true">*</b></span>
              <textarea rows={7} maxLength={20000} placeholder="Paste or type the text to process…" value={values.inputText} onChange={(event) => setValues({ ...values, inputText: event.target.value })} required />
              <small className="field-footnote">{values.inputText.length.toLocaleString()} / 20,000 characters</small>
            </label>
          </div>
          <div className="task-form-footer">
            <span>New tasks start as <strong>pending</strong> and update when the worker responds.</span>
            <div className="modal-actions"><Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button><Button type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Create and queue task'} {!submitting && <ArrowRight size={16} />}</Button></div>
          </div>
        </form>
      )}
    </>
  )
}

export default TaskFormPage
