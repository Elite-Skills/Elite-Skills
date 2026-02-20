import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { login } from '../api'
import { useAuth } from '../state/AuthContext'
import LandingNavbar from '../components/LandingNavbar'

export default function LoginPage() {
  const { setAuth } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const data = await login({ email, password })
      setAuth(data)
      navigate('/checker')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0a0a' }}>
      <LandingNavbar />
      <div className="ats-app flex items-center justify-center pt-32 pb-12">
        <div className="container">
          <div className="card narrow">
            <h1>Login</h1>
        <p className="muted">Sign in to access your dashboard.</p>

        <form onSubmit={onSubmit} className="form">
          <label className="label">
            Email
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </label>
          <label className="label">
            Password
            <input
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </label>

          {error ? <div className="error">{error}</div> : null}

          <button className="btn" disabled={loading} type="submit">
            {loading ? 'Signing in…' : 'Login'}
          </button>
        </form>

        <div className="muted" style={{ marginTop: 12 }}>
          Don’t have an account? <Link to="/register" style={{ color: 'var(--elite-gold)' }}>Create one</Link>
        </div>
          </div>
        </div>
      </div>
    </div>
  )
}
