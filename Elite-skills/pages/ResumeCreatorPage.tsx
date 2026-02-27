import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyProfile, type Profile } from '../api'
import { FileDown } from 'lucide-react'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

type TemplateId = 'classic' | 'modern' | 'minimal' | 'compact'

const TEMPLATES: { id: TemplateId; name: string; desc: string }[] = [
  { id: 'classic', name: 'Classic', desc: 'Centered header, traditional sections' },
  { id: 'modern', name: 'Modern', desc: 'Two-column layout, contact sidebar' },
  { id: 'minimal', name: 'Minimal', desc: 'Clean lines, generous whitespace' },
  { id: 'compact', name: 'Compact', desc: 'Dense single column, maximum content' },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6, borderBottom: '1px solid #000', paddingBottom: 4 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function ClassicTemplate({ profile }: { profile: Profile }) {
  const { name, headline, experience, projects, contact } = profile
  return (
    <div style={{ fontFamily: 'Georgia, serif', fontSize: 11, color: '#000', padding: 24, maxWidth: 595 }}>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '0.05em' }}>{name}</h1>
        <div style={{ fontSize: 10, marginTop: 4, color: '#333' }}>{headline || '—'}</div>
        <div style={{ fontSize: 9, marginTop: 6, color: '#555' }}>
          {contact?.email && <span>{contact.email}</span>}
          {contact?.phone && <span style={{ marginLeft: 12 }}>{contact.phone}</span>}
          {contact?.linkedIn && <span style={{ marginLeft: 12 }}>{contact.linkedIn}</span>}
        </div>
      </div>
      <hr style={{ border: 'none', borderTop: '1px solid #000', margin: '12px 0' }} />
      {experience && experience.length > 0 && (
        <Section title="Experience">
          {experience.map((e, i) => (
            <div key={i} style={{ marginBottom: 6, lineHeight: 1.4 }}>{e}</div>
          ))}
        </Section>
      )}
      {projects && projects.length > 0 && (
        <Section title="Projects">
          {projects.map((p, i) => (
            <div key={i} style={{ marginBottom: 6, lineHeight: 1.4 }}>{p}</div>
          ))}
        </Section>
      )}
    </div>
  )
}

function ModernTemplate({ profile }: { profile: Profile }) {
  const { name, headline, experience, projects, contact } = profile
  return (
    <div style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: 10, color: '#000', display: 'flex', maxWidth: 595, minHeight: 842 }}>
      <div style={{ width: 140, padding: 20, background: '#fff', borderRight: '1px solid #000' }}>
        <h1 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px 0' }}>{name}</h1>
        <div style={{ fontSize: 9, color: '#333', lineHeight: 1.4 }}>{headline || '—'}</div>
        <div style={{ marginTop: 16, fontSize: 9 }}>
          {contact?.email && <div style={{ marginBottom: 4 }}>{contact.email}</div>}
          {contact?.phone && <div style={{ marginBottom: 4 }}>{contact.phone}</div>}
          {contact?.linkedIn && <div style={{ marginBottom: 4 }}>{contact.linkedIn}</div>}
        </div>
      </div>
      <div style={{ flex: 1, padding: 24 }}>
        {experience && experience.length > 0 && (
          <Section title="Experience">
            {experience.map((e, i) => (
              <div key={i} style={{ marginBottom: 6, lineHeight: 1.4 }}>{e}</div>
            ))}
          </Section>
        )}
        {projects && projects.length > 0 && (
          <Section title="Projects">
            {projects.map((p, i) => (
              <div key={i} style={{ marginBottom: 6, lineHeight: 1.4 }}>{p}</div>
            ))}
          </Section>
        )}
      </div>
    </div>
  )
}

function MinimalTemplate({ profile }: { profile: Profile }) {
  const { name, headline, experience, projects, contact } = profile
  return (
    <div style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: 11, color: '#000', padding: 32, maxWidth: 595 }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>{name}</h1>
      <div style={{ fontSize: 10, color: '#444', marginBottom: 24 }}>{headline || '—'}</div>
      <div style={{ fontSize: 9, color: '#666', marginBottom: 28 }}>
        {[contact?.email, contact?.phone, contact?.linkedIn].filter(Boolean).join(' · ')}
      </div>
      {experience && experience.length > 0 && (
        <Section title="Experience">
          {experience.map((e, i) => (
            <div key={i} style={{ marginBottom: 8, lineHeight: 1.5 }}>{e}</div>
          ))}
        </Section>
      )}
      {projects && projects.length > 0 && (
        <Section title="Projects">
          {projects.map((p, i) => (
            <div key={i} style={{ marginBottom: 8, lineHeight: 1.5 }}>{p}</div>
          ))}
        </Section>
      )}
    </div>
  )
}

function CompactTemplate({ profile }: { profile: Profile }) {
  const { name, headline, experience, projects, contact } = profile
  return (
    <div style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: 10, color: '#000', padding: 20, maxWidth: 595 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8, borderBottom: '1px solid #000', paddingBottom: 8 }}>
        <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{name}</h1>
        <div style={{ fontSize: 8, color: '#333' }}>
          {contact?.email && <span>{contact.email}</span>}
          {contact?.phone && <span style={{ marginLeft: 8 }}>{contact.phone}</span>}
          {contact?.linkedIn && <span style={{ marginLeft: 8 }}>{contact.linkedIn}</span>}
        </div>
      </div>
      <div style={{ fontSize: 9, marginBottom: 12, color: '#444' }}>{headline || '—'}</div>
      {experience && experience.length > 0 && (
        <Section title="Experience">
          {experience.map((e, i) => (
            <div key={i} style={{ marginBottom: 4, lineHeight: 1.35 }}>{e}</div>
          ))}
        </Section>
      )}
      {projects && projects.length > 0 && (
        <Section title="Projects">
          {projects.map((p, i) => (
            <div key={i} style={{ marginBottom: 4, lineHeight: 1.35 }}>{p}</div>
          ))}
        </Section>
      )}
    </div>
  )
}

function TemplatePreview({ templateId, profile }: { templateId: TemplateId; profile: Profile }) {
  switch (templateId) {
    case 'classic':
      return <ClassicTemplate profile={profile} />
    case 'modern':
      return <ModernTemplate profile={profile} />
    case 'minimal':
      return <MinimalTemplate profile={profile} />
    case 'compact':
      return <CompactTemplate profile={profile} />
  }
}

export default function ResumeCreatorPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<TemplateId>('classic')
  const [exporting, setExporting] = useState(false)
  const resumeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await getMyProfile()
        if (!cancelled) setProfile(data.profile)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load profile')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  async function handleExportPDF() {
    if (!resumeRef.current || !profile) return
    setExporting(true)
    try {
      const el = resumeRef.current
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 595,
      })
      const imgData = canvas.toDataURL('image/png', 1.0)
      const pdf = new jsPDF({ format: 'a4', unit: 'px' })
      const pdfW = pdf.internal.pageSize.getWidth()
      const pdfH = pdf.internal.pageSize.getHeight()
      const imgH = (canvas.height * pdfW) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, imgH)
      pdf.save(`${profile.name.replace(/\s+/g, '-')}-resume.pdf`)
    } catch (err) {
      console.error('PDF export failed:', err)
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="card">
          <p className="muted">Loading profile…</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="page">
        <div className="card">
          <p className="error">{error || 'Profile not found'}</p>
          <Link className="btn" to="/profile/me" style={{ marginTop: 12 }}>
            Complete your profile
          </Link>
        </div>
      </div>
    )
  }

  const hasContent = (profile.experience?.length ?? 0) > 0 || (profile.projects?.length ?? 0) > 0

  return (
    <div className="page">
      <div className="card">
        <div className="header">
          <div>
            <h2>Resume Creator</h2>
            <div className="muted">Generate a professional CV from your profile. Choose a style and download as PDF.</div>
          </div>
        </div>

        {!hasContent && (
          <div className="error" style={{ marginBottom: 16 }}>
            Add experience or projects in your profile first.
            <Link className="btn" to="/profile/me" style={{ marginLeft: 12, display: 'inline-block' }}>
              Edit profile
            </Link>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelected(t.id)}
              className="btn"
              style={{
                textAlign: 'left',
                padding: 12,
                border: selected === t.id ? '2px solid var(--elite-gold)' : undefined,
                background: selected === t.id ? 'rgba(212,175,55,0.1)' : undefined,
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{t.name}</div>
              <div className="muted" style={{ fontSize: 11 }}>{t.desc}</div>
            </button>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
          <div ref={resumeRef} style={{ background: '#fff', minHeight: 400, width: 595, maxWidth: '100%', margin: '0 auto' }}>
            <TemplatePreview templateId={selected} profile={profile} />
          </div>
        </div>

        <div style={{ marginTop: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={exporting || !hasContent}
            className="btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <FileDown size={18} />
            {exporting ? 'Generating…' : 'Download PDF'}
          </button>
          <Link to="/profile/me" className="btn secondary">
            Edit profile data
          </Link>
        </div>
      </div>
    </div>
  )
}
