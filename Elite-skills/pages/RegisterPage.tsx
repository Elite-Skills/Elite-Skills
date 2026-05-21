import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { register, validateRegistrationInvite } from '../api'
import { useAuth } from '../state/AuthContext'
import LandingNavbar from '../components/LandingNavbar'

export default function RegisterPage() {
  const { token } = useParams<{ token?: string }>()
  const { setAuth } = useAuth()
  const navigate = useNavigate()

  const [inviteLoading, setInviteLoading] = useState(true)
  const [inviteValid, setInviteValid] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [planLabel, setPlanLabel] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadInvite() {
      if (!token) {
        setInviteValid(false)
        setInviteError('Invalid link')
        setInviteLoading(false)
        return
      }

      setInviteLoading(true)
      setInviteError(null)
      try {
        const preview = await validateRegistrationInvite(token)
        if (cancelled) return
        if (preview.valid) {
          setInviteValid(true)
          setPlanLabel(preview.planLabel)
          setInviteError(null)
        } else {
          setInviteValid(false)
          setInviteError(preview.error ?? 'Invalid link')
        }
      } catch {
        if (!cancelled) {
          setInviteValid(false)
          setInviteError('Invalid link')
        }
      } finally {
        if (!cancelled) setInviteLoading(false)
      }
    }

    loadInvite()
    return () => {
      cancelled = true
    }
  }, [token])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!token) {
      setError('Invalid link')
      return
    }
    if (password !== passwordConfirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      const data = await register({ inviteToken: token, name, email, password, passwordConfirm })
      setAuth(data)
      navigate('/checker')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
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
            {inviteLoading ? (
              <>
                <h1>Create account</h1>
                <p className="muted">Checking your registration link…</p>
              </>
            ) : !inviteValid ? (
              <>
                <h1>{inviteError?.includes('expired') ? 'Link expired' : 'Invalid link'}</h1>
                <p className="muted">
                  {inviteError ?? 'Registration is invite-only. Use the one-time link provided by Elite Skills.'}
                </p>
                <div className="muted" style={{ marginTop: 12 }}>
                  Already have an account? <Link to="/login" style={{ color: 'var(--elite-gold)' }}>Login</Link>
                </div>
              </>
            ) : (
              <>
                <h1>Create account</h1>
                <p className="muted">
                  You&apos;re registering with the <strong style={{ color: 'var(--elite-gold)' }}>{planLabel}</strong>.
                </p>

                <form onSubmit={onSubmit} className="form">
                  <label className="label">
                    Full name
                    <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
                  </label>
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
                      minLength={6}
                    />
                  </label>
                  <label className="label">
                    Confirm password
                    <input
                      className="input"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      type="password"
                      required
                      minLength={6}
                    />
                  </label>

                  {error ? <div className="error">{error}</div> : null}

                  <button className="btn" disabled={loading} type="submit">
                    {loading ? 'Creating…' : 'Create account'}
                  </button>
                </form>

                <div className="muted" style={{ marginTop: 12 }}>
                  Already have an account? <Link to="/login" style={{ color: 'var(--elite-gold)' }}>Login</Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
