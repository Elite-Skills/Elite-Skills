import { useEffect, useMemo, useState } from 'react'

import { getMyProfile, updateMyProfile, type Profile } from '../api'

function splitLines(s: string): string[] {
  return s
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean)
}

function joinLines(xs: string[]): string {
  return (xs ?? []).join('\n')
}

export default function ProfileMePage() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [profile, setProfile] = useState<Profile | null>(null)

  const [headline, setHeadline] = useState('')
  const [experience, setExperience] = useState('')
  const [projects, setProjects] = useState('')
  const [connectionQuestions, setConnectionQuestions] = useState('')

  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [linkedIn, setLinkedIn] = useState('')

  const [showEmail, setShowEmail] = useState(false)
  const [showPhone, setShowPhone] = useState(false)
  const [showLinkedIn, setShowLinkedIn] = useState(true)

  const canSave = useMemo(() => !saving && Boolean(profile), [profile, saving])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await getMyProfile()
        if (cancelled) return

        setProfile(data.profile)
        setHeadline(data.profile.headline ?? '')
        setExperience(joinLines(data.profile.experience ?? []))
        setProjects(joinLines(data.profile.projects ?? []))
        setConnectionQuestions(joinLines(data.profile.connectionQuestions ?? []))

        setEmail(data.profile.contact?.email ?? '')
        setPhone(data.profile.contact?.phone ?? '')
        setLinkedIn(data.profile.contact?.linkedIn ?? '')

        setShowEmail(Boolean(data.profile.visibility?.showEmail))
        setShowPhone(Boolean(data.profile.visibility?.showPhone))
        setShowLinkedIn(Boolean(data.profile.visibility?.showLinkedIn ?? true))
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

  async function onSave() {
    if (!profile) return

    setSaving(true)
    setError(null)
    try {
      await updateMyProfile({
        headline,
        experience: splitLines(experience),
        projects: splitLines(projects),
        connectionQuestions: splitLines(connectionQuestions),
        contact: { email, phone, linkedIn },
        visibility: { showEmail, showPhone, showLinkedIn },
      })

      const updated = await getMyProfile()
      setProfile(updated.profile)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <div className="card">
        <h2>My profile</h2>
        <div className="muted">Edit your public headline and what becomes visible after connecting.</div>

        {loading ? <div className="muted" style={{ marginTop: 12 }}>Loading…</div> : null}
        {error ? <div className="error" style={{ marginTop: 12 }}>{error}</div> : null}

        <div className="form">
          <label className="label">
            Headline
            <input className="input" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="BBA Finance | Digital Marketing | SEO" />
          </label>

          <label className="label">
            Experience (one per line)
            <textarea className="textarea" rows={6} value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="Intern - ABC Co (2025)\nCampus ambassador - XYZ" />
          </label>

          <label className="label">
            Projects (one per line)
            <textarea className="textarea" rows={6} value={projects} onChange={(e) => setProjects(e.target.value)} placeholder="SEO audit project\nMarketing campaign analysis" />
          </label>

          <label className="label">
            Questions for people requesting to connect (one per line)
            <textarea className="textarea" rows={4} value={connectionQuestions} onChange={(e) => setConnectionQuestions(e.target.value)} placeholder="Why do you want to connect?\nWhat role are you looking for?" />
          </label>

          <div className="row">
            <label className="label">
              Email (optional)
              <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </label>
            <label className="label">
              Phone (optional)
              <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91…" />
            </label>
            <label className="label">
              LinkedIn (optional)
              <input className="input" value={linkedIn} onChange={(e) => setLinkedIn(e.target.value)} placeholder="https://linkedin.com/in/..." />
            </label>
          </div>

          <div className="card" style={{ padding: 14 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Contact visibility</div>
            <div className="muted" style={{ marginBottom: 10 }}>You control whether these fields are visible after connecting.</div>

            <div className="row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'inherit' }}>
                <input type="checkbox" checked={showEmail} onChange={(e) => setShowEmail(e.target.checked)} />
                Show email
              </label>
              <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'inherit' }}>
                <input type="checkbox" checked={showPhone} onChange={(e) => setShowPhone(e.target.checked)} />
                Show phone
              </label>
              <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'inherit' }}>
                <input type="checkbox" checked={showLinkedIn} onChange={(e) => setShowLinkedIn(e.target.checked)} />
                Show LinkedIn
              </label>
            </div>
          </div>

          <button className="btn" type="button" onClick={onSave} disabled={!canSave}>
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </div>
    </div>
  )
}
