import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Workflow } from 'lucide-react'
import { getErrorMessage } from '../api/client'
import { Alert, Button } from '../components/Ui'
import { useAuth } from '../context/useAuth'

function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (!values.email.trim() || !values.password) {
      setError('Enter your email and password to continue.')
      return
    }

    setSubmitting(true)
    try {
      await login({ email: values.email.trim(), password: values.password })
      navigate('/', { replace: true })
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to sign in. Check your details and try again.'))
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
            <p className="eyebrow">WELCOME BACK</p>
            <h1>Sign in to your workspace</h1>
            <p>Pick up where you left off and keep the work moving.</p>
          </div>
          <Alert>{error}</Alert>
          <form className="form-stack" onSubmit={submit} noValidate>
            <label className="field">
              <span>Email address</span>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={values.email}
                onChange={(event) => setValues({ ...values, email: event.target.value })}
                required
              />
            </label>
            <label className="field">
              <span>Password</span>
              <span className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={values.password}
                  onChange={(event) => setValues({ ...values, password: event.target.value })}
                  required
                />
                <button type="button" className="password-toggle" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </label>
            <Button className="auth-submit" type="submit" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'} {!submitting && <ArrowRight size={17} />}
            </Button>
          </form>
          <p className="auth-switch">New to TaskFlow? <Link to="/register">Create an account</Link></p>
        </section>
        <div className="auth-aside">
          <span className="auth-aside-mark">“</span>
          <p>Give busy work a clear path forward.</p>
          <span>One focused workflow at a time.</span>
        </div>
      </div>
      <footer className="auth-footer"><span>TaskFlow AI</span><span>Secure workspace access</span></footer>
    </div>
  )
}

export default LoginPage
