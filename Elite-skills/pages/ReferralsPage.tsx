import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { listReferrals, type ReferralPost } from '../api'

export default function ReferralsPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [posts, setPosts] = useState<ReferralPost[]>([])

  const [q, setQ] = useState('')
  const [tag, setTag] = useState('')

  const query = useMemo(() => ({ q: q.trim(), tag: tag.trim() }), [q, tag])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await listReferrals({ q: query.q, tag: query.tag })
        if (!cancelled) setPosts(data.posts)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [query.q, query.tag])

  return (
    <div className="page">
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ marginBottom: 6 }}>Referral posts</h2>
            <div className="muted">Browse referrals posted by users. Use tags/search to filter.</div>
          </div>
          <Link className="btn" to="/referrals/new">
            Create post
          </Link>
        </div>

        <div className="row" style={{ marginTop: 14 }}>
          <label className="label">
            Search
            <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Company, role, description…" />
          </label>
          <label className="label">
            Tag
            <input className="input" value={tag} onChange={(e) => setTag(e.target.value)} placeholder="e.g. finance" />
          </label>
          <div />
        </div>

        {error ? <div className="error" style={{ marginTop: 12 }}>{error}</div> : null}
        {loading ? <div className="muted" style={{ marginTop: 12 }}>Loading…</div> : null}

        <div className="list">
          {posts.length === 0 && !loading ? <div className="muted">No posts found.</div> : null}
          {posts.map((p) => (
            <div key={p.id} className="listItem">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>
                    {p.roleTitle} — {p.company}
                  </div>
                  <div className="muted" style={{ marginTop: 4 }}>
                    {p.location ? p.location : 'Remote/Not specified'}
                  </div>
                </div>
                <Link className="btn secondary" to={`/profile/${p.authorUserId}`}>
                  View poster
                </Link>
              </div>

              <div style={{ marginTop: 10 }}>{p.description}</div>

              {p.tags.length > 0 ? (
                <div className="chips" style={{ marginTop: 10 }}>
                  {p.tags.map((t) => (
                    <span key={`${p.id}-t-${t}`} className="chip">
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}

              {p.questions.length > 0 ? (
                <div style={{ marginTop: 10 }}>
                  <div className="muted" style={{ marginBottom: 6 }}>
                    Request questions
                  </div>
                  <div className="list">
                    {p.questions.map((q) => (
                      <div key={`${p.id}-q-${q}`} className="listItem">
                        {q}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div style={{ marginTop: 10 }}>
                <Link className="btn" to={`/requests/new?postId=${encodeURIComponent(p.id)}`}>
                  Send request
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
