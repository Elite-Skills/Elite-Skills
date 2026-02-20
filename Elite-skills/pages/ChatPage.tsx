import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { getToken, listChatMessages, type ChatMessage } from '../api'
import { useRealtime } from '../state/RealtimeContext'

type ChatMessageEvent = {
  id: string
  connectionId: string
  fromUserId: string
  text: string
  createdAt: string
}

export default function ChatPage() {
  const params = useParams()
  const connectionId = String(params.connectionId ?? '')

  const token = getToken()
  const { socket } = useRealtime()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')

  const joinedRef = useRef<string | null>(null)

  const canSend = useMemo(() => Boolean(connectionId) && Boolean(token) && text.trim().length > 0, [connectionId, text, token])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await listChatMessages(connectionId, 100)
        if (!cancelled) setMessages(data.messages)
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

  useEffect(() => {
    if (!connectionId || !token || !socket) return

    socket.emit('chat:join', { connectionId }, (resp: { ok: boolean; error?: string }) => {
      if (!resp?.ok) {
        setError(resp?.error ?? 'Join failed')
        return
      }
      joinedRef.current = connectionId
    })

    const onMessage = (m: ChatMessageEvent) => {
      if (!m || m.connectionId !== connectionId) return
      setMessages((prev) => {
        if (prev.some((p) => p.id === m.id)) return prev
        return [...prev, m]
      })
    }

    socket.on('chat:message', onMessage)

    return () => {
      socket.off('chat:message', onMessage)
      joinedRef.current = null
    }
  }, [connectionId, socket, token])

  async function send() {
    if (!socket || !canSend) return

    const payload = { connectionId, text: text.trim() }
    setText('')

    socket.emit('chat:send', payload, (resp: { ok: boolean; error?: string }) => {
      if (!resp?.ok) setError(resp?.error ?? 'Send failed')
    })
  }

  return (
    <div className="page">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ marginBottom: 6 }}>Chat</h2>
            <div className="muted">Connection: {connectionId}</div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link className="btn secondary" to="/connections">
              Back
            </Link>
            <Link className="btn secondary" to={`/connections/${encodeURIComponent(connectionId)}/profile`}>
              Profile
            </Link>
          </div>
        </div>

        {error ? <div className="error" style={{ marginTop: 12 }}>{error}</div> : null}
        {loading ? <div className="muted" style={{ marginTop: 12 }}>Loading…</div> : null}

        <div className="list" style={{ marginTop: 12, maxHeight: 420, overflow: 'auto' }}>
          {messages.length === 0 && !loading ? <div className="muted">No messages yet.</div> : null}
          {messages.map((m) => (
            <div key={m.id} className="listItem">
              <div className="muted" style={{ fontSize: 12 }}>From: {m.fromUserId}</div>
              <div style={{ marginTop: 6 }}>{m.text}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 12 }}>
          <textarea className="textarea" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
            <button className="btn" type="button" disabled={!canSend} onClick={send}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
