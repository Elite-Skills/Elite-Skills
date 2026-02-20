import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { createConnectionRequest, getProfile, getReferralPost } from '../api'

type QA = { question: string; answer: string }

function buildQA(questions: string[], existing?: QA[]): QA[] {
  const map = new Map((existing ?? []).map((x) => [x.question, x.answer]))
  return questions.map((q) => ({ question: q, answer: map.get(q) ?? '' }))
}

export default function NewRequestPage() {
  const navigate = useNavigate()
  const [search] = useSearchParams()

  const postId = search.get('postId')
  const toUserId = search.get('toUserId')

  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [questions, setQuestions] = useState<string[]>([])
  const [qa, setQa] = useState<QA[]>([])

  const canSend = useMemo(() => {
    if (sending) return false
    if (!postId && !toUserId) return false
    return qa.every((x) => x.question.trim() && x.answer.trim())
  }, [postId, qa, sending, toUserId])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        if (postId) {
          const data = await getReferralPost(postId)
          if (cancelled) return
          setTitle(`${data.post.roleTitle} — ${data.post.company}`)
          setQuestions(data.post.questions)
          setQa(buildQA(data.post.questions))
          return
        }

        if (toUserId) {
          const data = await getProfile(toUserId)
          if (cancelled) return
          setTitle(`Request to connect — ${data.profile.name}`)

          const qs = 'connectionQuestions' in data.profile ? data.profile.connectionQuestions ?? [] : []
          setQuestions(qs)
          setQa(buildQA(qs))
          return
        }
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
  }, [postId, toUserId])

  async function submit() {
    if (!canSend) return

    setSending(true)
    setError(null)
    try {
      await createConnectionRequest({
        postId: postId ?? undefined,
        toUserId: toUserId ?? undefined,
        questionAnswers: qa,
      })
      navigate('/requests')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="page">
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ marginBottom: 6 }}>Send request</h2>
            <div className="muted">{title || 'Answer the questions and send your request.'}</div>
          </div>
          <Link className="btn secondary" to="/requests">
            Back
          </Link>
        </div>

        {loading ? <div className="muted" style={{ marginTop: 12 }}>Loading…</div> : null}
        {error ? <div className="error" style={{ marginTop: 12 }}>{error}</div> : null}

        <div className="form" style={{ marginTop: 14 }}>
          {questions.length === 0 ? <div className="muted">No questions. You can still send a short message in chat after acceptance.</div> : null}

          {qa.map((x, idx) => (
            <label key={`${x.question}-${idx}`} className="label">
              {x.question}
              <textarea
                className="textarea"
                rows={2}
                value={x.answer}
                onChange={(e) => {
                  const val = e.target.value
                  setQa((prev) => prev.map((p, i) => (i === idx ? { ...p, answer: val } : p)))
                }}
                required
              />
            </label>
          ))}

          <button className="btn" type="button" disabled={!canSend} onClick={submit}>
            {sending ? 'Sending…' : 'Send request'}
          </button>
        </div>
      </div>
    </div>
  )
}
