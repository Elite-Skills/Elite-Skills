import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { getConnectionProfile, type ProfilePublic } from '../api'

export default function ConnectionProfilePage() {
  const params = useParams()
  const connectionId = String(params.connectionId ?? '')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<ProfilePublic | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await getConnectionProfile(connectionId)
        if (!cancelled) setProfile(data.profile)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    if (connectionId) load()

    return () => {
      cancelled = true
    }
  }, [connectionId])

  return (
    <div className="page">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ marginBottom: 6 }}>Connected profile</h2>
            <div className="muted">Full profile is available after you connect.</div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link className="btn secondary" to="/connections">
              Back
            </Link>
            <Link className="btn" to={`/chat/${encodeURIComponent(connectionId)}`}>
              Chat
            </Link>
          </div>
        </div>

        {loading ? <div className="muted" style={{ marginTop: 12 }}>Loading…</div> : null}
        {error ? <div className="error" style={{ marginTop: 12 }}>{error}</div> : null}

        {!profile ? null : (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{profile.name}</div>
            <div className="muted" style={{ marginTop: 6 }}>{profile.headline || '—'}</div>

            {'experience' in profile && (profile.experience ?? []).length > 0 ? (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Experience</div>
                <div className="list">
                  {(profile.experience ?? []).map((x: string) => (
                    <div key={`exp-${x}`} className="listItem">{x}</div>
                  ))}
                </div>
              </div>
            ) : null}

            {'projects' in profile && (profile.projects ?? []).length > 0 ? (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Projects</div>
                <div className="list">
                  {(profile.projects ?? []).map((x: string) => (
                    <div key={`pr-${x}`} className="listItem">{x}</div>
                  ))}
                </div>
              </div>
            ) : null}

            {'contact' in profile && profile.contact && Object.keys(profile.contact).length > 0 ? (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Contact</div>
                <div className="list">
                  {'email' in profile.contact && profile.contact.email ? <div className="listItem">Email: {profile.contact.email}</div> : null}
                  {'phone' in profile.contact && profile.contact.phone ? <div className="listItem">Phone: {profile.contact.phone}</div> : null}
                  {'linkedIn' in profile.contact && profile.contact.linkedIn ? (
                    <div className="listItem">LinkedIn: {profile.contact.linkedIn}</div>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div style={{ marginTop: 14 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Recommendations</div>
              <div className="list">
                {(profile.recommendations ?? []).length === 0 ? <div className="muted">No recommendations yet.</div> : null}
                {(profile.recommendations ?? []).map((r: any, idx: number) => (
                  <div key={`rec-${idx}-${r.text}`} className="listItem">
                    <div>{r.text}</div>
                    <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>By {r.authorUserId}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
