import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import { getProfile, recommendUser, type ProfilePublic, type Recommendation } from '../api'

export default function ProfilePage() {
  const params = useParams()
  const userId = String(params.userId ?? '')
  const [search] = useSearchParams()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<ProfilePublic | null>(null)

  const [rec, setRec] = useState(search.get('recommend') === '1' ? 'Great to work with. Strong communication and reliable.' : '')
  const [sending, setSending] = useState(false)

  const canRecommend = useMemo(() => rec.trim().length >= 10 && !sending, [rec, sending])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await getProfile(userId)
        if (!cancelled) setProfile(data.profile)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    if (userId) load()

    return () => {
      cancelled = true
    }
  }, [userId])

  async function sendRecommendation() {
    if (!profile) return
    setSending(true)
    setError(null)
    try {
      await recommendUser(profile.userId, rec.trim())
      const updated = await getProfile(profile.userId)
      setProfile(updated.profile)
      setRec('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to recommend')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="page">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ marginBottom: 6 }}>Profile</h2>
            <div className="muted">View user details. Full profile unlocks after connecting.</div>
          </div>
          <Link className="btn secondary" to="/referrals">
            Back
          </Link>
        </div>

        {loading ? <div className="muted" style={{ marginTop: 12 }}>Loading…</div> : null}
        {error ? <div className="error" style={{ marginTop: 12 }}>{error}</div> : null}

        {!profile ? null : (
          <>
            <div style={{ marginTop: 12, fontWeight: 800, fontSize: 18 }}>{profile.name}</div>
            <div className="muted" style={{ marginTop: 6 }}>{profile.headline || '—'}</div>

            {'connected' in profile && profile.connected ? (
              <div style={{ marginTop: 12 }}>
                <div className="row">
                  <div className="metric">
                    <div className="metricTitle">Experience</div>
                    <div className="metricValue">{(profile.experience ?? []).length}</div>
                  </div>
                  <div className="metric">
                    <div className="metricTitle">Projects</div>
                    <div className="metricValue">{(profile.projects ?? []).length}</div>
                  </div>
                  <div className="metric">
                    <div className="metricTitle">Recommendations</div>
                    <div className="metricValue">{(profile.recommendations ?? []).length}</div>
                  </div>
                </div>

                {(profile.experience ?? []).length > 0 ? (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>Experience</div>
                    <div className="list">
                      {(profile.experience ?? []).map((x: string) => (
                        <div key={`exp-${x}`} className="listItem">{x}</div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {(profile.projects ?? []).length > 0 ? (
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
                  <Link className="btn" to={`/requests/new?toUserId=${encodeURIComponent(profile.userId)}`}>
                    Send request
                  </Link>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 14 }}>
                {'connectionQuestions' in profile && (profile.connectionQuestions ?? []).length > 0 ? (
                  <>
                    <div className="muted" style={{ marginBottom: 6 }}>Questions you must answer to connect</div>
                    <div className="list">
                      {(profile.connectionQuestions ?? []).map((q: string) => (
                        <div key={`q-${q}`} className="listItem">{q}</div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="muted">No connection questions set.</div>
                )}

                <div style={{ marginTop: 12 }}>
                  <Link className="btn" to={`/requests/new?toUserId=${encodeURIComponent(profile.userId)}`}>
                    Send request
                  </Link>
                </div>
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Recommendations</div>
              {(profile.recommendations ?? []).length === 0 ? <div className="muted">No recommendations yet.</div> : null}
              <div className="list">
                {(profile.recommendations ?? []).map((r: Recommendation, idx: number) => (
                  <div key={`rec-${idx}-${r.text}`} className="listItem">
                    <div>{r.text}</div>
                    <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>By {r.authorUserId}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 14 }}>
                <div className="muted" style={{ marginBottom: 6 }}>Write a recommendation (public)</div>
                <textarea className="textarea" rows={3} value={rec} onChange={(e) => setRec(e.target.value)} />
                <div style={{ marginTop: 10 }}>
                  <button className="btn" type="button" onClick={sendRecommendation} disabled={!canRecommend}>
                    {sending ? 'Posting…' : 'Post recommendation'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
