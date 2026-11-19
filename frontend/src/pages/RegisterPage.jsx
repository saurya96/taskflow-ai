import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Workflow } from 'lucide-react'
import { getErrorMessage } from '../api/client'
import { Alert, Button } from '../components/Ui'
import { useAuth } from '../context/useAuth'

function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (values.name.trim().length < 2) {
      setError('Your name must contain at least 2 characters.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      setError('Enter a valid email address.')
      return
    }
    if (values.password.length < 8) {
      setError('Your password must be at least 8 characters.')
      return
    }
    if (values.password !== values.confirmPassword) {
      setError('The passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      await register({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      })
      navigate('/', { replace: true })
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to create your account. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-brand"><div className="brand-mark"><Workflow size={21} /></div><span>taskflow<span className="brand-ai">.ai</span></span></div>
      <div className="auth-main">
        <section className="auth-card">
          <div className="auth-card-heading">
            <p className="eyebrow">START YOUR WORKSPACE</p>
            <h1>Make room for focused work</h1>
            <p>Create an account to organize projects and process tasks.</p>
          </div>
          <Alert>{error}</Alert>
          <form className="form-stack" onSubmit={submit} noValidate>
            <label className="field">
              <span>Your name</span>
              <input autoComplete="name" placeholder="Alex Morgan" value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} required minLength={2} />
            </label>
            <label className="field">
              <span>Email address</span>
              <input type="email" autoComplete="email" placeholder="you@company.com" value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} required />
            </label>
            <label className="field">
              <span>Password <small>At least 8 characters</small></span>
              <span className="password-input">
                <input type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Create a password" value={values.password} onChange={(event) => setValues({ ...values, password: event.target.value })} required minLength={8} />
                <button type="button" className="password-toggle" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </label>
            <label className="field">
              <span>Confirm password</span>
              <input type="password" autoComplete="new-password" placeholder="Repeat your password" value={values.confirmPassword} onChange={(event) => setValues({ ...values, confirmPassword: event.target.value })} required />
            </label>
            <Button className="auth-submit" type="submit" disabled={submitting}>
              {submitting ? 'Creating account…' : 'Create account'} {!submitting && <ArrowRight size={17} />}
            </Button>
          </form>
          <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
        </section>
        <div className="auth-aside">
          <span className="auth-aside-mark">“</span>
          <p>Turn your ideas into a workflow that keeps moving.</p>
          <span>Projects, tasks, and progress in one place.</span>
        </div>
      </div>
      <footer className="auth-footer"><span>TaskFlow AI</span><span>Secure workspace access</span></footer>
    </div>
  )
}

export default RegisterPage
