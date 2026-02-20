import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { acceptRequest, rejectRequest, listIncomingRequests, listOutgoingRequests, type ConnectionRequest } from '../api'

type Tab = 'incoming' | 'outgoing'

export default function RequestsPage() {
  const [tab, setTab] = useState<Tab>('incoming')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [incoming, setIncoming] = useState<ConnectionRequest[]>([])
  const [outgoing, setOutgoing] = useState<ConnectionRequest[]>([])

  const data = useMemo(() => (tab === 'incoming' ? incoming : outgoing), [incoming, outgoing, tab])

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const [inc, out] = await Promise.all([listIncomingRequests(), listOutgoingRequests()])
      setIncoming(inc.requests)
      setOutgoing(out.requests)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  async function accept(id: string) {
    setError(null)
    try {
      await acceptRequest(id)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept')
    }
  }

  async function reject(id: string) {
    setError(null)
    try {
      await rejectRequest(id)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject')
    }
  }

  return (
    <div className="page">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ marginBottom: 6 }}>Requests</h2>
            <div className="muted">Manage incoming/outgoing connection requests.</div>
          </div>
          <Link className="btn" to="/referrals">
            Browse referrals
          </Link>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          <button className={`btn ${tab === 'incoming' ? '' : 'secondary'}`} type="button" onClick={() => setTab('incoming')}>
            Incoming ({incoming.length})
          </button>
          <button className={`btn ${tab === 'outgoing' ? '' : 'secondary'}`} type="button" onClick={() => setTab('outgoing')}>
            Outgoing ({outgoing.length})
          </button>
          <Link className="btn secondary" to="/requests/new">
            New request
          </Link>
        </div>

        {error ? <div className="error" style={{ marginTop: 12 }}>{error}</div> : null}
        {loading ? <div className="muted" style={{ marginTop: 12 }}>Loading…</div> : null}

        <div className="list" style={{ marginTop: 12 }}>
          {data.length === 0 && !loading ? <div className="muted">No requests.</div> : null}

          {data.map((r) => (
            <div key={r.id} className="listItem">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 800 }}>
                    {tab === 'incoming' ? r.fromUser.name : r.toUser.name}
                  </div>
                  <div className="muted" style={{ marginTop: 4 }}>
                    {tab === 'incoming' ? r.fromUser.headline : r.toUser.headline}
                  </div>
                  <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
                    Status: {r.status}
                  </div>
                </div>
                <Link className="btn secondary" to={`/profile/${tab === 'incoming' ? r.fromUserId : r.toUserId}`}>
                  View profile
                </Link>
              </div>

              {r.questionAnswers.length > 0 ? (
                <div style={{ marginTop: 10 }}>
                  <div className="muted" style={{ marginBottom: 6 }}>Answers</div>
                  <div className="list">
                    {r.questionAnswers.map((qa) => (
                      <div key={`${r.id}-${qa.question}`} className="listItem">
                        <div style={{ fontWeight: 700 }}>{qa.question}</div>
                        <div style={{ marginTop: 6 }}>{qa.answer}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {tab === 'incoming' && r.status === 'pending' ? (
                <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                  <button className="btn" type="button" onClick={() => accept(r.id)}>
                    Accept
                  </button>
                  <button className="btn secondary" type="button" onClick={() => reject(r.id)}>
                    Reject
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
