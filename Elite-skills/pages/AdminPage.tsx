import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import {
  createRegistrationInvite,
  deleteRegistrationInvite,
  listRegistrationInvites,
  login,
  type AccountPlan,
  type RegistrationInviteItem,
} from '../api'
import { INVITE_PLAN_OPTIONS } from '../lib/planLimits'
import { useAuth } from '../state/AuthContext'
import LandingNavbar from '../components/LandingNavbar'

function formatWhen(value: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString()
}

function inviteStatusLabel(invite: RegistrationInviteItem): string {
  if (invite.status === 'used') return `Used ${formatWhen(invite.usedAt)}`
  if (invite.status === 'expired') return 'Expired'
  return 'Unused'
}

export default function AdminPage() {
  const { user, token, setAuth, logout } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginLoading, setLoginLoading] = useState(false)

  const [selectedPlan, setSelectedPlan] = useState<AccountPlan>('foundation')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createdLink, setCreatedLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [invites, setInvites] = useState<RegistrationInviteItem[]>([])
  const [invitesLoading, setInvitesLoading] = useState(false)
  const [invitesError, setInvitesError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const isAdmin = Boolean(user?.isAdmin)

  useEffect(() => {
    if (!token || !isAdmin) return
    let cancelled = false

    async function loadInvites() {
      setInvitesLoading(true)
      setInvitesError(null)
      try {
        const data = await listRegistrationInvites()
        if (!cancelled) setInvites(data.invites)
      } catch (err) {
        if (!cancelled) setInvitesError(err instanceof Error ? err.message : 'Could not load invites')
      } finally {
        if (!cancelled) setInvitesLoading(false)
      }
    }

    loadInvites()
    return () => {
      cancelled = true
    }
  }, [token, isAdmin])

  async function onLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginError(null)
    setLoginLoading(true)
    try {
      const data = await login({ email, password })
      setAuth(data)
      if (!data.user.isAdmin) {
        logout()
        setLoginError('This account does not have admin access.')
      }
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoginLoading(false)
    }
  }

  async function onCreateInvite(e: React.FormEvent) {
    e.preventDefault()
    setCreateError(null)
    setCreatedLink(null)
    setCopied(false)
    setCreating(true)
    try {
      const data = await createRegistrationInvite(selectedPlan)
      setCreatedLink(data.invite.registrationUrl)
      setInvites((prev) => [
        {
          id: data.invite.id,
          plan: data.invite.plan,
          planLabel: data.invite.planLabel,
          usedAt: data.invite.usedAt,
          usedByUserId: null,
          createdAt: data.invite.createdAt,
          expiresAt: data.invite.expiresAt,
          status: data.invite.status,
        },
        ...prev,
      ])
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Could not create invite')
    } finally {
      setCreating(false)
    }
  }

  async function copyLink(link: string) {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCreateError('Could not copy link to clipboard')
    }
  }

  async function onDeleteInvite(id: string) {
    if (!window.confirm('Delete this registration link? It will stop working immediately.')) return
    setDeletingId(id)
    setInvitesError(null)
    try {
      await deleteRegistrationInvite(id)
      setInvites((prev) => prev.filter((invite) => invite.id !== id))
    } catch (err) {
      setInvitesError(err instanceof Error ? err.message : 'Could not delete invite')
    } finally {
      setDeletingId(null)
    }
  }

  function handleLogout() {
    logout()
    navigate('/admin')
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0a0a' }}>
      <LandingNavbar />
      <div className="ats-app flex items-center justify-center pt-32 pb-12">
        <div className="container">
          {!token || !isAdmin ? (
            <div className="card narrow">
              <h1>Admin login</h1>
              <p className="muted">Sign in with your admin account to create registration links.</p>

              <form onSubmit={onLogin} className="form">
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

                {loginError ? <div className="error">{loginError}</div> : null}

                <button className="btn" disabled={loginLoading} type="submit">
                  {loginLoading ? 'Signing in…' : 'Login'}
                </button>
              </form>

              <div className="muted" style={{ marginTop: 12 }}>
                <Link to="/" style={{ color: 'var(--elite-gold)' }}>Back to home</Link>
              </div>
            </div>
          ) : (
            <div className="card" style={{ maxWidth: 760, margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <h1 style={{ marginBottom: 4 }}>Admin panel</h1>
                  <p className="muted" style={{ margin: 0 }}>
                    Signed in as {user?.email}
                  </p>
                </div>
                <button type="button" className="btn secondary" onClick={handleLogout}>
                  Log out
                </button>
              </div>

              <hr style={{ borderColor: 'rgba(255,255,255,0.08)', margin: '24px 0' }} />

              <h2 style={{ marginBottom: 8 }}>Registration link creator</h2>
              <p className="muted" style={{ marginTop: 0 }}>
                Each link works once and expires 24 hours after creation. Choose the plan the user receives when they register.
              </p>

              <form onSubmit={onCreateInvite} className="form" style={{ marginTop: 16 }}>
                <label className="label">
                  Plan
                  <select
                    className="input"
                    value={selectedPlan}
                    onChange={(e) => setSelectedPlan(e.target.value as AccountPlan)}
                  >
                    {INVITE_PLAN_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                {createError ? <div className="error">{createError}</div> : null}

                <button className="btn" disabled={creating} type="submit">
                  {creating ? 'Creating…' : 'Create one-time link'}
                </button>
              </form>

              {createdLink ? (
                <div
                  className="card"
                  style={{
                    marginTop: 16,
                    background: 'rgba(212, 175, 55, 0.08)',
                    border: '1px solid rgba(212, 175, 55, 0.25)',
                  }}
                >
                  <p className="muted" style={{ marginTop: 0 }}>
                    New registration link (copy and send to the user):
                  </p>
                  <code
                    style={{
                      display: 'block',
                      wordBreak: 'break-all',
                      fontSize: 13,
                      marginBottom: 12,
                      color: 'var(--elite-gold)',
                    }}
                  >
                    {createdLink}
                  </code>
                  <button type="button" className="btn secondary" onClick={() => copyLink(createdLink)}>
                    {copied ? 'Copied!' : 'Copy link'}
                  </button>
                </div>
              ) : null}

              <hr style={{ borderColor: 'rgba(255,255,255,0.08)', margin: '24px 0' }} />

              <h2 style={{ marginBottom: 8 }}>Recent links</h2>
              {invitesLoading ? <p className="muted">Loading…</p> : null}
              {invitesError ? <div className="error">{invitesError}</div> : null}

              {!invitesLoading && invites.length === 0 ? (
                <p className="muted">No registration links yet.</p>
              ) : null}

              {!invitesLoading && invites.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                      <tr className="muted">
                        <th style={{ textAlign: 'left', padding: '8px 6px' }}>Plan</th>
                        <th style={{ textAlign: 'left', padding: '8px 6px' }}>Created</th>
                        <th style={{ textAlign: 'left', padding: '8px 6px' }}>Expires</th>
                        <th style={{ textAlign: 'left', padding: '8px 6px' }}>Status</th>
                        <th style={{ textAlign: 'right', padding: '8px 6px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {invites.map((invite) => (
                        <tr key={invite.id} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                          <td style={{ padding: '10px 6px' }}>{invite.planLabel}</td>
                          <td style={{ padding: '10px 6px' }}>{formatWhen(invite.createdAt)}</td>
                          <td style={{ padding: '10px 6px' }}>{formatWhen(invite.expiresAt)}</td>
                          <td style={{ padding: '10px 6px' }}>{inviteStatusLabel(invite)}</td>
                          <td style={{ padding: '10px 6px', textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn secondary"
                              disabled={deletingId === invite.id}
                              onClick={() => onDeleteInvite(invite.id)}
                              style={{ padding: '6px 12px', fontSize: 13 }}
                            >
                              {deletingId === invite.id ? 'Deleting…' : 'Delete'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
