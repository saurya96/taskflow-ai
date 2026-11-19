import { useCallback, useEffect, useState } from 'react'
import { ArrowRight, Boxes, FolderKanban, Pencil, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getErrorMessage, projectApi, taskApi } from '../api/client'
import { Alert, Button, EmptyState, LoadingState, Modal, PageHeader } from '../components/Ui'

function ProjectForm({ initial, onSave, onCancel, saving }) {
  const [values, setValues] = useState(() => ({
    repository: initial?.repository || '',
    branchPolicy: initial?.branchPolicy || 'feature-branch',
    techStack: (initial?.techStack || []).join(', '),
  }))
  const [validationError, setValidationError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    const repository = values.repository.trim()
    if (!repository) {
      setValidationError('A project repository/name is required.')
      return
    }
    setValidationError('')
    await onSave({
      repository,
      branchPolicy: values.branchPolicy.trim() || 'feature-branch',
      techStack: values.techStack.split(',').map((item) => item.trim()).filter(Boolean),
    })
  }

  return (
    <form className="form-stack" onSubmit={submit}>
      <Alert>{validationError}</Alert>
      <label className="field"><span>Project name or repository</span><input autoFocus value={values.repository} placeholder="e.g. platform-api" onChange={(event) => setValues({ ...values, repository: event.target.value })} required /></label>
      <label className="field"><span>Branch policy</span><input value={values.branchPolicy} placeholder="feature-branch" onChange={(event) => setValues({ ...values, branchPolicy: event.target.value })} /></label>
      <label className="field"><span>Tech stack <small>Comma-separated</small></span><input value={values.techStack} placeholder="React, Node.js, MongoDB" onChange={(event) => setValues({ ...values, techStack: event.target.value })} /></label>
      <div className="modal-actions"><Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save project'}</Button></div>
    </form>
  )
}

function ProjectsPage() {
  const [projects, setProjects] = useState([])
  const [taskCounts, setTaskCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  const refresh = useCallback(async () => {
    try {
      const rows = await projectApi.list()
      setProjects(rows)
      const pairs = await Promise.all(rows.map(async (project) => {
        const tasks = await taskApi.listForProject(project._id)
        return [project._id, tasks.length]
      }))
      setTaskCounts(Object.fromEntries(pairs))
      setError('')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh() }, 0)
    return () => window.clearTimeout(timer)
  }, [refresh])

  const saveProject = async (values) => {
    setSaving(true)
    try {
      if (modal.project) {
        await projectApi.update(modal.project._id, values)
        setNotice('Project updated.')
      } else {
        await projectApi.create(values)
        setNotice('Project created.')
      }
      setModal(null)
      await refresh()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  const deleteProject = async (project) => {
    if (!window.confirm(`Delete "${project.repository}"? This removes the project record; existing tasks are not deleted by the API.`)) return
    setError('')
    try {
      await projectApi.remove(project._id)
      setNotice('Project deleted.')
      await refresh()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  if (loading) return <LoadingState label="Loading projects…" />

  return (
    <>
      <PageHeader
        eyebrow="WORKSPACE"
        title="Projects"
        description="Keep related tasks organized around the work they support."
        action={<Button onClick={() => { setNotice(''); setModal({ project: null }) }}><Plus size={17} /> New project</Button>}
      />
      <Alert>{error}</Alert>
      <Alert variant="success">{notice}</Alert>
      {!projects.length ? (
        <div className="content-card">
          <EmptyState
            icon={FolderKanban}
            title="Start with a project"
            description="Create a project to group tasks and track their processing progress."
            action={<Button onClick={() => setModal({ project: null })}><Plus size={16} /> Create a project</Button>}
          />
        </div>
      ) : (
        <div className="project-grid">
          {projects.map((project, index) => (
            <article className="project-card" key={project._id}>
              <div className="project-card-top">
                <div className={`project-mark project-mark-${index % 4}`}><Boxes size={20} /></div>
                <div className="project-actions">
                  <button className="icon-button" title="Edit project" onClick={() => { setNotice(''); setModal({ project }) }}><Pencil size={16} /></button>
                  <button className="icon-button danger-hover" title="Delete project" onClick={() => deleteProject(project)}><Trash2 size={16} /></button>
                </div>
              </div>
              <Link to={`/projects/${project._id}`} className="project-card-title">{project.repository}<ArrowRight size={16} /></Link>
              <p className="project-branch">{project.branchPolicy || 'feature-branch'}</p>
              <div className="project-tech">
                {(project.techStack || []).length ? project.techStack.map((tech) => <span className="tech-tag" key={tech}>{tech}</span>) : <span className="muted-copy">No tech stack listed</span>}
              </div>
              <div className="project-card-footer">
                <span><FolderKanban size={15} /> {taskCounts[project._id] || 0} tasks</span>
                <Link to={`/projects/${project._id}`} className="text-link">Open project <ArrowRight size={14} /></Link>
              </div>
            </article>
          ))}
        </div>
      )}
      {modal && (
        <Modal title={modal.project ? 'Edit project' : 'Create a project'} onClose={() => setModal(null)}>
          <ProjectForm initial={modal.project} onSave={saveProject} onCancel={() => setModal(null)} saving={saving} />
        </Modal>
      )}
      <div className="data-source-note">Project details and task counts are loaded from your workspace API.</div>
    </>
  )
}

export default ProjectsPage
