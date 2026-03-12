import { useEffect, useMemo, useState } from 'react'

import { getMyProfile, updateMyProfile, type Profile, type ExperienceItem, type ProjectItem } from '../api'
import { Plus, Trash2 } from 'lucide-react'

function joinLines(xs: string[]): string {
  return (xs ?? []).join('\n')
}

export default function ProfileMePage() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [profile, setProfile] = useState<Profile | null>(null)

  const [cvName, setCvName] = useState('')
  const [headline, setHeadline] = useState('')
  const [professionalSummary, setProfessionalSummary] = useState('')
  const [experience, setExperience] = useState<ExperienceItem[]>([])
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [education, setEducation] = useState('')
  const [additionalInfo, setAdditionalInfo] = useState('')
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
        setCvName(data.profile.name ?? '')
        setHeadline(data.profile.headline ?? '')
        setProfessionalSummary(data.profile.professionalSummary ?? '')
        setExperience(data.profile.experience ?? [])
        setProjects(data.profile.projects ?? [])
        setEducation(joinLines(data.profile.education ?? []))
        setAdditionalInfo(joinLines(data.profile.additionalInfo ?? []))
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
        cvName: cvName.trim(),
        headline,
        professionalSummary,
        experience,
        projects,
        education: education.split('\n').map((x) => x.trim()).filter(Boolean),
        additionalInfo: additionalInfo.split('\n').map((x) => x.trim()).filter(Boolean),
        connectionQuestions: connectionQuestions.split('\n').map((x) => x.trim()).filter(Boolean),
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

  function addExperience() {
    setExperience((prev) => [...prev, { title: '', description: '' }])
  }

  function removeExperience(i: number) {
    setExperience((prev) => prev.filter((_, idx) => idx !== i))
  }

  function updateExperience(i: number, field: 'title' | 'description', value: string) {
    setExperience((prev) => prev.map((e, idx) => (idx === i ? { ...e, [field]: value } : e)))
  }

  function addProject() {
    setProjects((prev) => [...prev, { title: '', description: '' }])
  }

  function removeProject(i: number) {
    setProjects((prev) => prev.filter((_, idx) => idx !== i))
  }

  function updateProject(i: number, field: 'title' | 'description', value: string) {
    setProjects((prev) => prev.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)))
  }

  return (
    <div className="page">
      <div className="card">
        <h2>My profile</h2>
        <div className="muted">Edit your public headline and what becomes visible after connecting.</div>

        {error ? <div className="error" style={{ marginTop: 12 }}>{error}</div> : null}

        {loading ? (
          <div style={{ marginTop: 16 }} className="profile-skeleton">
            <div className="shimmer h-10 w-full rounded mb-4" />
            <div className="shimmer h-10 w-full rounded mb-4" />
            <div className="shimmer h-24 w-full rounded mb-6" />
            <div className="shimmer h-4 w-24 rounded mb-3" />
            <div className="shimmer h-20 rounded mb-2" />
            <div className="shimmer h-20 rounded mb-2" />
            <div className="shimmer h-20 rounded mb-6" />
            <div className="shimmer h-4 w-20 rounded mb-3" />
            <div className="shimmer h-20 rounded mb-2" />
            <div className="shimmer h-20 rounded mb-6" />
            <div className="shimmer h-24 w-full rounded mb-4" />
            <div className="shimmer h-24 w-full rounded mb-4" />
            <div className="shimmer h-10 w-32 rounded" />
          </div>
        ) : (
        <div className="form">
          <label className="label">
            Name (for CV)
            <input className="input" value={cvName} onChange={(e) => setCvName(e.target.value)} placeholder="Your full name as it appears on your resume" />
          </label>

          <label className="label">
            Headline
            <input className="input" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="BBA Finance | Digital Marketing | SEO" />
          </label>

          <label className="label">
            Professional Summary
            <textarea className="textarea" rows={3} value={professionalSummary} onChange={(e) => setProfessionalSummary(e.target.value)} placeholder="2–3 sentence summary of your experience and goals" />
          </label>

          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ fontWeight: 700 }}>Experience</div>
              <button type="button" onClick={addExperience} className="btn secondary btn-add-profile">
                <Plus size={14} />
                <span className="btn-add-profile-text">Add Experience</span>
              </button>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {experience.map((e, i) => (
                <div key={i} className="listItem" style={{ padding: 14 }}>
                  <div className="profile-item-row" style={{ marginBottom: 8 }}>
                    <input
                      className="input"
                      value={e.title}
                      onChange={(ev) => updateExperience(i, 'title', ev.target.value)}
                      placeholder="Job title — Company (Years)"
                    />
                    {experience.length >= 1 && (
                      <button type="button" onClick={() => removeExperience(i)} className="btn secondary" style={{ padding: 8, flexShrink: 0 }} aria-label="Remove">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <textarea
                    className="textarea"
                    value={e.description}
                    onChange={(ev) => updateExperience(i, 'description', ev.target.value)}
                    placeholder="Key achievements and responsibilities"
                    rows={3}
                  />
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ fontWeight: 700 }}>Projects</div>
              <button type="button" onClick={addProject} className="btn secondary btn-add-profile">
                <Plus size={14} />
                <span className="btn-add-profile-text">Add Project</span>
              </button>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {projects.map((p, i) => (
                <div key={i} className="listItem" style={{ padding: 14 }}>
                  <div className="profile-item-row" style={{ marginBottom: 8 }}>
                    <input
                      className="input"
                      value={p.title}
                      onChange={(ev) => updateProject(i, 'title', ev.target.value)}
                      placeholder="Project title"
                    />
                    {projects.length >= 1 && (
                      <button type="button" onClick={() => removeProject(i)} className="btn secondary" style={{ padding: 8, flexShrink: 0 }} aria-label="Remove">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <textarea
                    className="textarea"
                    value={p.description}
                    onChange={(ev) => updateProject(i, 'description', ev.target.value)}
                    placeholder="Description and outcomes"
                    rows={3}
                  />
                </div>
              ))}
            </div>
          </div>

          <label className="label">
            Education (one per line)
            <textarea className="textarea" rows={4} value={education} onChange={(e) => setEducation(e.target.value)} placeholder={'MBA, Finance — Wharton (2016)\nB.S. Economics — Stanford (2012)'} />
          </label>

          <label className="label">
            Additional Information (one per line)
            <textarea className="textarea" rows={3} value={additionalInfo} onChange={(e) => setAdditionalInfo(e.target.value)} placeholder={'CFA Level II | Languages: English, Mandarin\nTechnical: Excel, Python, SQL'} />
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

            <div className="row profile-contact-visibility">
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
        )}
      </div>
    </div>
  )
}
