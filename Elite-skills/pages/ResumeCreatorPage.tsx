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

/** Filler data for style preview so users see what each template looks like with real content */
const FILLER_PROFILE: Profile = {
  userId: '',
  name: 'Alexandra Chen',
  headline: 'Senior Financial Analyst | CFA Level II | 8+ Years in Investment Banking',
  experience: [
    'Senior Financial Analyst at Morgan Stanley (2020–Present) — Led due diligence for $2B+ M&A transactions; built financial models for equity and debt offerings.',
    'Financial Analyst at Goldman Sachs (2016–2020) — Supported IPO roadshows; prepared pitch books and valuation analyses for tech and healthcare sectors.',
    'Investment Banking Summer Analyst at J.P. Morgan (2015) — Built LBO models; assisted with sell-side M&A process for mid-market companies.',
  ],
  projects: [
    'Built automated DCF and LBO valuation toolkit used across 3 teams; reduced model build time by 40%.',
    'Led cross-functional initiative to standardize financial reporting; improved data accuracy and reduced reconciliation time by 25%.',
  ],
  contact: {
    email: 'alexandra.chen@email.com',
    phone: '+1 (555) 123-4567',
    linkedIn: 'linkedin.com/in/alexandra-chen',
  },
  visibility: { showEmail: true, showPhone: true, showLinkedIn: true },
  connectionQuestions: [],
  recommendations: [],
}

/** Merge user profile with filler for display; use filler when sections are empty */
function getDisplayProfile(profile: Profile): Profile {
  const hasExp = (profile.experience?.length ?? 0) > 0
  const hasProj = (profile.projects?.length ?? 0) > 0
  const hasHeadline = !!profile.headline?.trim()
  const hasContact = profile.contact && (profile.contact.email || profile.contact.phone || profile.contact.linkedIn)
  return {
    ...profile,
    name: profile.name?.trim() || FILLER_PROFILE.name,
    headline: hasHeadline ? profile.headline : FILLER_PROFILE.headline,
    experience: hasExp ? profile.experience : FILLER_PROFILE.experience,
    projects: hasProj ? profile.projects : FILLER_PROFILE.projects,
    contact: hasContact ? profile.contact : FILLER_PROFILE.contact,
  }
}

/** Generate a concise professional summary from profile data */
function generateSummary(profile: Profile): string {
  if (profile.headline?.trim()) return profile.headline.trim()
  const first = profile.experience?.[0]
  if (first) return first.length > 180 ? first.slice(0, 177) + '…' : first
  return ''
}

const FILLER_SUMMARY =
  'Results-driven finance professional with 8+ years in investment banking and M&A. CFA Level II candidate with proven track record in financial modeling, valuation, and cross-functional project delivery.'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid #000' }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8, borderBottom: '1px solid #000', paddingBottom: 4 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function ClassicTemplate({ profile, summary }: { profile: Profile; summary?: string }) {
  const { name, headline, experience, projects, contact } = profile
  return (
    <div style={{ fontFamily: 'Georgia, serif', fontSize: 11, color: '#000', padding: 24, maxWidth: 595 }}>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '0.05em', color: '#000' }}>{name}</h1>
        <div style={{ fontSize: 10, marginTop: 4, color: '#333' }}>{headline || '—'}</div>
        <div style={{ fontSize: 9, marginTop: 6, color: '#555' }}>
          {contact?.email && <span>{contact.email}</span>}
          {contact?.phone && <span style={{ marginLeft: 12 }}>{contact.phone}</span>}
          {contact?.linkedIn && <span style={{ marginLeft: 12 }}>{contact.linkedIn}</span>}
        </div>
      </div>
      <hr style={{ border: 'none', borderTop: '1px solid #000', margin: '12px 0' }} />
      {summary && (
        <Section title="Summary">
          <div style={{ lineHeight: 1.4, color: '#333' }}>{summary}</div>
        </Section>
      )}
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

function ModernTemplate({ profile, summary }: { profile: Profile; summary?: string }) {
  const { name, headline, experience, projects, contact } = profile
  return (
    <div style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: 10, color: '#000', display: 'flex', maxWidth: 595 }}>
      <div style={{ width: 140, padding: 20, background: '#fff', borderRight: '1px solid #000' }}>
        <h1 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px 0', color: '#000' }}>{name}</h1>
        <div style={{ fontSize: 9, color: '#333', lineHeight: 1.4 }}>{headline || '—'}</div>
        <div style={{ marginTop: 16, fontSize: 9, color: '#333' }}>
          {contact?.email && <div style={{ marginBottom: 4 }}>{contact.email}</div>}
          {contact?.phone && <div style={{ marginBottom: 4 }}>{contact.phone}</div>}
          {contact?.linkedIn && <div style={{ marginBottom: 4 }}>{contact.linkedIn}</div>}
        </div>
      </div>
      <div style={{ flex: 1, padding: 24 }}>
        {summary && (
          <Section title="Summary">
            <div style={{ lineHeight: 1.4, color: '#333' }}>{summary}</div>
          </Section>
        )}
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

function MinimalTemplate({ profile, summary }: { profile: Profile; summary?: string }) {
  const { name, headline, experience, projects, contact } = profile
  return (
    <div style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: 11, color: '#000', padding: 32, maxWidth: 595 }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 4px 0', letterSpacing: '-0.02em', color: '#000' }}>{name}</h1>
      <div style={{ fontSize: 10, color: '#444', marginBottom: 24 }}>{headline || '—'}</div>
      <div style={{ fontSize: 9, color: '#666', marginBottom: 28 }}>
        {[contact?.email, contact?.phone, contact?.linkedIn].filter(Boolean).join(' · ')}
      </div>
      {summary && (
        <Section title="Summary">
          <div style={{ lineHeight: 1.5, color: '#333' }}>{summary}</div>
        </Section>
      )}
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

function CompactTemplate({ profile, summary }: { profile: Profile; summary?: string }) {
  const { name, headline, experience, projects, contact } = profile
  return (
    <div style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: 10, color: '#000', padding: 20, maxWidth: 595 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8, borderBottom: '1px solid #000', paddingBottom: 8 }}>
        <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#000' }}>{name}</h1>
        <div style={{ fontSize: 8, color: '#333' }}>
          {contact?.email && <span>{contact.email}</span>}
          {contact?.phone && <span style={{ marginLeft: 8 }}>{contact.phone}</span>}
          {contact?.linkedIn && <span style={{ marginLeft: 8 }}>{contact.linkedIn}</span>}
        </div>
      </div>
      <div style={{ fontSize: 9, marginBottom: 12, color: '#444' }}>{headline || '—'}</div>
      {summary && (
        <Section title="Summary">
          <div style={{ lineHeight: 1.35, color: '#333' }}>{summary}</div>
        </Section>
      )}
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

function TemplatePreview({ templateId, profile, summary }: { templateId: TemplateId; profile: Profile; summary?: string }) {
  switch (templateId) {
    case 'classic':
      return <ClassicTemplate profile={profile} summary={summary} />
    case 'modern':
      return <ModernTemplate profile={profile} summary={summary} />
    case 'minimal':
      return <MinimalTemplate profile={profile} summary={summary} />
    case 'compact':
      return <CompactTemplate profile={profile} summary={summary} />
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
  const displayProfile = getDisplayProfile(profile)
  const summary = hasContent ? generateSummary(profile) : FILLER_SUMMARY

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

        <div className="resume-template-grid" style={{ marginBottom: 24 }}>
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelected(t.id)}
              className="btn"
              style={{
                border: selected === t.id ? '2px solid var(--elite-gold)' : undefined,
                background: selected === t.id ? 'rgba(212,175,55,0.1)' : undefined,
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 15 }}>{t.name}</div>
              <div className="muted" style={{ fontSize: 12, lineHeight: 1.35 }}>{t.desc}</div>
            </button>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
          <div ref={resumeRef} style={{ background: '#fff', minHeight: 400, width: 595, maxWidth: '100%', margin: '0 auto' }}>
            <TemplatePreview templateId={selected} profile={displayProfile} summary={summary} />
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
