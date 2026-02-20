import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { listConnections, type ConnectionListItem } from '../api'

export default function ConnectionsPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connections, setConnections] = useState<ConnectionListItem[]>([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await listConnections()
        if (!cancelled) setConnections(data.connections)
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
  }, [])

  return (
    <div className="page">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ marginBottom: 6 }}>Connections</h2>
            <div className="muted">People you can chat with (accepted requests).</div>
          </div>
          <Link className="btn secondary" to="/requests">
            Requests
          </Link>
        </div>

        {error ? <div className="error" style={{ marginTop: 12 }}>{error}</div> : null}
        {loading ? <div className="muted" style={{ marginTop: 12 }}>Loading…</div> : null}

        <div className="list" style={{ marginTop: 12 }}>
          {connections.length === 0 && !loading ? <div className="muted">No connections yet.</div> : null}

          {connections.map((c) => (
            <div key={c.id} className="listItem">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 800 }}>{c.otherUser.name}</div>
                  <div className="muted" style={{ marginTop: 4 }}>{c.otherUser.headline}</div>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <Link className="btn secondary" to={`/connections/${encodeURIComponent(c.id)}/profile`}>
                    View profile
                  </Link>
                  <Link className="btn" to={`/chat/${encodeURIComponent(c.id)}`}>
                    Chat
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
