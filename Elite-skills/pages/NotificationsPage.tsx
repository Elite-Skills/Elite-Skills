import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from '../api'
import { useRealtime } from '../state/RealtimeContext'

export default function NotificationsPage() {
  const { refreshUnreadCount } = useRealtime()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unreadOnly, setUnreadOnly] = useState(false)

  const hasUnread = useMemo(() => items.some((n) => !n.readAt), [items])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await listNotifications({ unreadOnly, limit: 50 })
      setItems(data.notifications)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [unreadOnly])

  async function readOne(id: string) {
    setError(null)
    try {
      await markNotificationRead(id)
      await refreshUnreadCount()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark read')
    }
  }

  async function readAll() {
    setError(null)
    try {
      await markAllNotificationsRead()
      await refreshUnreadCount()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark all read')
    }
  }

  return (
    <div className="page">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ marginBottom: 6 }}>Notifications</h2>
            <div className="muted">Updates about requests, chat messages, and recommendations.</div>
          </div>
          <Link className="btn secondary" to="/connections">
            Connections
          </Link>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          <button className={`btn ${unreadOnly ? 'secondary' : ''}`} type="button" onClick={() => setUnreadOnly(false)}>
            All
          </button>
          <button className={`btn ${unreadOnly ? '' : 'secondary'}`} type="button" onClick={() => setUnreadOnly(true)}>
            Unread
          </button>
          <button className="btn secondary" type="button" disabled={!hasUnread || loading} onClick={readAll}>
            Mark all read
          </button>
        </div>

        {error ? <div className="error" style={{ marginTop: 12 }}>{error}</div> : null}
        {loading ? <div className="muted" style={{ marginTop: 12 }}>Loading…</div> : null}

        <div className="list" style={{ marginTop: 12 }}>
          {items.length === 0 && !loading ? <div className="muted">No notifications.</div> : null}

          {items.map((n) => (
            <div key={n.id} className="listItem">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 800 }}>{n.title}</div>
                  {n.body ? <div style={{ marginTop: 6 }}>{n.body}</div> : null}
                  <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>
                    {new Date(n.createdAt).toLocaleString()} {n.readAt ? '• Read' : '• Unread'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  {n.link ? (
                    <button
                      className="btn secondary"
                      type="button"
                      onClick={() => {
                        if (!n.readAt) readOne(n.id)
                        navigate(n.link)
                      }}
                    >
                      Open
                    </button>
                  ) : null}

                  {!n.readAt ? (
                    <button className="btn" type="button" onClick={() => readOne(n.id)}>
                      Mark read
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
