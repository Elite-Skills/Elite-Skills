import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { createReferralPost } from '../api'

function splitCsv(s: string): string[] {
  return s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
}

function splitLines(s: string): string[] {
  return s
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean)
}

export default function NewReferralPage() {
  const navigate = useNavigate()

  const [company, setCompany] = useState('')
  const [roleTitle, setRoleTitle] = useState('')
  const [location, setLocation] = useState('')
  const [jobLink, setJobLink] = useState('')
  const [referralType, setReferralType] = useState('referral')
  const [tags, setTags] = useState('')
  const [questions, setQuestions] = useState('')
  const [description, setDescription] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await createReferralPost({
        company,
        roleTitle,
        location,
        jobLink,
        referralType,
        description,
        tags: splitCsv(tags),
        questions: splitLines(questions),
      })
      navigate('/referrals')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0 }}>Create referral post</h2>
          <Link className="btn secondary" to="/referrals">
            Back
          </Link>
        </div>
        <form className="form" onSubmit={onSubmit}>
          <label className="label">
            Company
            <input className="input" value={company} onChange={(e) => setCompany(e.target.value)} required />
          </label>

          <label className="label">
            Role title
            <input className="input" value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} required />
          </label>

          <div className="row">
            <label className="label">
              Location (optional)
              <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Nagpur / Remote" />
            </label>
            <label className="label">
              Referral type
              <input className="input" value={referralType} onChange={(e) => setReferralType(e.target.value)} placeholder="referral" />
            </label>
            <label className="label">
              Job link (optional)
              <input className="input" value={jobLink} onChange={(e) => setJobLink(e.target.value)} placeholder="https://…" />
            </label>
          </div>

          <label className="label">
            Tags (comma separated)
            <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="finance, marketing, seo" />
          </label>

          <label className="label">
            Questions for requesters (one per line)
            <textarea
              className="textarea"
              value={questions}
              onChange={(e) => setQuestions(e.target.value)}
              rows={4}
              placeholder="Why are you a good fit?\nWhat’s your current location?"
            />
          </label>

          <label className="label">
            Description
            <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} rows={6} required />
          </label>

          {error ? <div className="error">{error}</div> : null}

          <button className="btn" disabled={loading} type="submit">
            {loading ? 'Creating…' : 'Create'}
          </button>
        </form>
      </div>
    </div>
  )
}
