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

/** Extended profile for display */
type DisplayProfile = Profile & { education?: string[]; additionalInfo?: string[] }

/** Render one experience/project item: title above description */
function ExpItemBlock({
  item,
  editable,
  titlePlaceholder,
  descPlaceholder,
  style,
}: {
  item: { title: string; description: string }
  editable?: boolean
  titlePlaceholder?: string
  descPlaceholder?: string
  style?: React.CSSProperties
}) {
  const t = (item.title || '').trim()
  const d = (item.description || '').trim()
  return (
    <div style={{ marginBottom: 10, ...style }}>
      <Editable editable={editable} placeholder={titlePlaceholder} style={{ fontWeight: 600, marginBottom: 2, lineHeight: 1.4 }}>{t}</Editable>
      <Editable editable={editable} placeholder={descPlaceholder} style={{ lineHeight: 1.4, color: '#333' }}>{d}</Editable>
    </div>
  )
}

/** Use profile data; empty sections get placeholder text (no filler) */
function getDisplayProfile(profile: Profile): DisplayProfile {
  return { ...profile }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8, borderBottom: '1px solid #000', paddingBottom: 4 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function Editable({
  children,
  editable,
  placeholder,
  style,
  ...rest
}: { children: React.ReactNode; editable?: boolean; placeholder?: string; style?: React.CSSProperties }) {
  const isEmpty = !children || (typeof children === 'string' && !children.trim())
  return (
    <div
      {...rest}
      style={style}
      contentEditable={editable}
      suppressContentEditableWarning
      data-placeholder={editable && isEmpty && placeholder ? placeholder : undefined}
    >
      {children}
    </div>
  )
}

function ClassicTemplate({ profile, summary, editable }: { profile: DisplayProfile; summary?: string; editable?: boolean }) {
  const { name, headline, experience, projects, education, additionalInfo, contact } = profile
  const expItems = experience ?? []
  const projItems = projects ?? []
  return (
    <div style={{ fontFamily: 'Georgia, serif', fontSize: 11, color: '#000', padding: 24, maxWidth: 595 }}>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <Editable editable={editable} placeholder="Your name" style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '0.05em', color: '#000' }}>{name?.trim()}</Editable>
        <Editable editable={editable} placeholder="Your headline" style={{ fontSize: 10, marginTop: 4, color: '#333' }}>{headline?.trim()}</Editable>
        <div style={{ fontSize: 9, marginTop: 6, color: '#555' }}>
          <Editable editable={editable} placeholder="Email" style={{ display: 'inline' }}>{contact?.email}</Editable>
          <Editable editable={editable} placeholder="Phone" style={{ display: 'inline', marginLeft: 12 }}>{contact?.phone}</Editable>
          <Editable editable={editable} placeholder="LinkedIn" style={{ display: 'inline', marginLeft: 12 }}>{contact?.linkedIn}</Editable>
        </div>
      </div>
      <Section title="Professional Summary">
        <Editable editable={editable} placeholder="2–3 sentences about your experience and goals" style={{ lineHeight: 1.4, color: '#333' }}>{summary?.trim()}</Editable>
      </Section>
      <Section title="Experience">
        {expItems.length > 0 ? expItems.map((item, i) => (
          <ExpItemBlock key={i} item={item} editable={editable} titlePlaceholder="Job title — Company (Years)" descPlaceholder="Key achievements and responsibilities" />
        )) : <ExpItemBlock item={{ title: '', description: '' }} editable={editable} titlePlaceholder="Job title — Company (Years)" descPlaceholder="Key achievements and responsibilities" />}
      </Section>
      <Section title="Projects">
        {projItems.length > 0 ? projItems.map((item, i) => (
          <ExpItemBlock key={i} item={item} editable={editable} titlePlaceholder="Project title" descPlaceholder="Description and outcomes" />
        )) : <ExpItemBlock item={{ title: '', description: '' }} editable={editable} titlePlaceholder="Project title" descPlaceholder="Description and outcomes" />}
      </Section>
      <Section title="Education">
        {(education ?? []).length > 0 ? education!.map((e, i) => (
          <Editable key={i} editable={editable} style={{ marginBottom: 6, lineHeight: 1.4 }}>{e}</Editable>
        )) : <Editable editable={editable} placeholder="Degree — University (Year)" style={{ marginBottom: 6, lineHeight: 1.4 }}></Editable>}
      </Section>
      <Section title="Additional Information">
        {(additionalInfo ?? []).length > 0 ? additionalInfo!.map((a, i) => (
          <Editable key={i} editable={editable} style={{ marginBottom: 6, lineHeight: 1.4 }}>{a}</Editable>
        )) : <Editable editable={editable} placeholder="Certifications, languages, skills" style={{ marginBottom: 6, lineHeight: 1.4 }}></Editable>}
      </Section>
    </div>
  )
}

function ModernTemplate({ profile, summary, editable }: { profile: DisplayProfile; summary?: string; editable?: boolean }) {
  const { name, headline, experience, projects, education, additionalInfo, contact } = profile
  const expItems = experience ?? []
  const projItems = projects ?? []
  return (
    <div style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: 10, color: '#000', display: 'flex', maxWidth: 595 }}>
      <div style={{ width: 140, padding: 20, background: '#fff', borderRight: '1px solid #000' }}>
        <Editable editable={editable} placeholder="Your name" style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px 0', color: '#000' }}>{name?.trim()}</Editable>
        <Editable editable={editable} placeholder="Headline" style={{ fontSize: 9, color: '#333', lineHeight: 1.4 }}>{headline?.trim()}</Editable>
        <div style={{ marginTop: 16, fontSize: 9, color: '#333' }}>
          <Editable editable={editable} placeholder="Email" style={{ marginBottom: 4 }}>{contact?.email}</Editable>
          <Editable editable={editable} placeholder="Phone" style={{ marginBottom: 4 }}>{contact?.phone}</Editable>
          <Editable editable={editable} placeholder="LinkedIn" style={{ marginBottom: 4 }}>{contact?.linkedIn}</Editable>
        </div>
      </div>
      <div style={{ flex: 1, padding: 24 }}>
        <Section title="Professional Summary">
          <Editable editable={editable} placeholder="2–3 sentences about your experience and goals" style={{ lineHeight: 1.4, color: '#333' }}>{summary?.trim()}</Editable>
        </Section>
        <Section title="Experience">
          {expItems.length > 0 ? expItems.map((item, i) => (
            <ExpItemBlock key={i} item={item} editable={editable} titlePlaceholder="Job title — Company (Years)" descPlaceholder="Key achievements" />
          )) : <ExpItemBlock item={{ title: '', description: '' }} editable={editable} titlePlaceholder="Job title — Company (Years)" descPlaceholder="Key achievements" />}
        </Section>
        <Section title="Projects">
          {projItems.length > 0 ? projItems.map((item, i) => (
            <ExpItemBlock key={i} item={item} editable={editable} titlePlaceholder="Project title" descPlaceholder="Description and outcomes" />
          )) : <ExpItemBlock item={{ title: '', description: '' }} editable={editable} titlePlaceholder="Project title" descPlaceholder="Description and outcomes" />}
        </Section>
        <Section title="Education">
          {(education ?? []).length > 0 ? education!.map((e, i) => (
            <Editable key={i} editable={editable} style={{ marginBottom: 6, lineHeight: 1.4 }}>{e}</Editable>
          )) : <Editable editable={editable} placeholder="Degree — University (Year)" style={{ marginBottom: 6, lineHeight: 1.4 }}></Editable>}
        </Section>
        <Section title="Additional Information">
          {(additionalInfo ?? []).length > 0 ? additionalInfo!.map((a, i) => (
            <Editable key={i} editable={editable} style={{ marginBottom: 6, lineHeight: 1.4 }}>{a}</Editable>
          )) : <Editable editable={editable} placeholder="Certifications, languages, skills" style={{ marginBottom: 6, lineHeight: 1.4 }}></Editable>}
        </Section>
      </div>
    </div>
  )
}

function MinimalTemplate({ profile, summary, editable }: { profile: DisplayProfile; summary?: string; editable?: boolean }) {
  const { name, headline, experience, projects, education, additionalInfo, contact } = profile
  const expItems = experience ?? []
  const projItems = projects ?? []
  const contactStr = [contact?.email, contact?.phone, contact?.linkedIn].filter(Boolean).join(' · ')
  return (
    <div style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: 11, color: '#000', padding: 32, maxWidth: 595 }}>
      <Editable editable={editable} placeholder="Your name" style={{ fontSize: 20, fontWeight: 600, margin: '0 0 4px 0', letterSpacing: '-0.02em', color: '#000' }}>{name?.trim()}</Editable>
      <Editable editable={editable} placeholder="Headline" style={{ fontSize: 10, color: '#444', marginBottom: 24 }}>{headline?.trim()}</Editable>
      <Editable editable={editable} placeholder="Email · Phone · LinkedIn" style={{ fontSize: 9, color: '#666', marginBottom: 28 }}>{contactStr}</Editable>
      <Section title="Professional Summary">
        <Editable editable={editable} placeholder="2–3 sentences about your experience and goals" style={{ lineHeight: 1.5, color: '#333' }}>{summary?.trim()}</Editable>
      </Section>
      <Section title="Experience">
        {expItems.length > 0 ? expItems.map((item, i) => (
          <ExpItemBlock key={i} item={item} editable={editable} titlePlaceholder="Job title — Company (Years)" descPlaceholder="Key achievements" style={{ marginBottom: 8 }} />
        )) : <ExpItemBlock item={{ title: '', description: '' }} editable={editable} titlePlaceholder="Job title — Company (Years)" descPlaceholder="Key achievements" style={{ marginBottom: 8 }} />}
      </Section>
      <Section title="Projects">
        {projItems.length > 0 ? projItems.map((item, i) => (
          <ExpItemBlock key={i} item={item} editable={editable} titlePlaceholder="Project title" descPlaceholder="Description and outcomes" style={{ marginBottom: 8 }} />
        )) : <ExpItemBlock item={{ title: '', description: '' }} editable={editable} titlePlaceholder="Project title" descPlaceholder="Description and outcomes" style={{ marginBottom: 8 }} />}
      </Section>
      <Section title="Education">
        {(education ?? []).length > 0 ? education!.map((e, i) => (
          <Editable key={i} editable={editable} style={{ marginBottom: 8, lineHeight: 1.5 }}>{e}</Editable>
        )) : <Editable editable={editable} placeholder="Degree — University (Year)" style={{ marginBottom: 8, lineHeight: 1.5 }}></Editable>}
      </Section>
      <Section title="Additional Information">
        {(additionalInfo ?? []).length > 0 ? additionalInfo!.map((a, i) => (
          <Editable key={i} editable={editable} style={{ marginBottom: 8, lineHeight: 1.5 }}>{a}</Editable>
        )) : <Editable editable={editable} placeholder="Certifications, languages, skills" style={{ marginBottom: 8, lineHeight: 1.5 }}></Editable>}
      </Section>
    </div>
  )
}

function CompactTemplate({ profile, summary, editable }: { profile: DisplayProfile; summary?: string; editable?: boolean }) {
  const { name, headline, experience, projects, education, additionalInfo, contact } = profile
  const expItems = experience ?? []
  const projItems = projects ?? []
  return (
    <div style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: 10, color: '#000', padding: 20, maxWidth: 595 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8, paddingBottom: 8 }}>
        <Editable editable={editable} placeholder="Your name" style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#000' }}>{name?.trim()}</Editable>
        <div style={{ fontSize: 8, color: '#333' }}>
          <Editable editable={editable} placeholder="Email" style={{ display: 'inline' }}>{contact?.email}</Editable>
          <Editable editable={editable} placeholder="Phone" style={{ display: 'inline', marginLeft: 8 }}>{contact?.phone}</Editable>
          <Editable editable={editable} placeholder="LinkedIn" style={{ display: 'inline', marginLeft: 8 }}>{contact?.linkedIn}</Editable>
        </div>
      </div>
      <Editable editable={editable} placeholder="Headline" style={{ fontSize: 9, marginBottom: 12, color: '#444' }}>{headline?.trim()}</Editable>
      <Section title="Professional Summary">
        <Editable editable={editable} placeholder="2–3 sentences about your experience and goals" style={{ lineHeight: 1.35, color: '#333' }}>{summary?.trim()}</Editable>
      </Section>
      <Section title="Experience">
        {expItems.length > 0 ? expItems.map((item, i) => (
          <ExpItemBlock key={i} item={item} editable={editable} titlePlaceholder="Job title — Company (Years)" descPlaceholder="Key achievements" style={{ marginBottom: 6 }} />
        )) : <ExpItemBlock item={{ title: '', description: '' }} editable={editable} titlePlaceholder="Job title — Company (Years)" descPlaceholder="Key achievements" style={{ marginBottom: 6 }} />}
      </Section>
      <Section title="Projects">
        {projItems.length > 0 ? projItems.map((item, i) => (
          <ExpItemBlock key={i} item={item} editable={editable} titlePlaceholder="Project title" descPlaceholder="Description and outcomes" style={{ marginBottom: 6 }} />
        )) : <ExpItemBlock item={{ title: '', description: '' }} editable={editable} titlePlaceholder="Project title" descPlaceholder="Description and outcomes" style={{ marginBottom: 6 }} />}
      </Section>
      <Section title="Education">
        {(education ?? []).length > 0 ? education!.map((e, i) => (
          <Editable key={i} editable={editable} style={{ marginBottom: 4, lineHeight: 1.35 }}>{e}</Editable>
        )) : <Editable editable={editable} placeholder="Degree — University (Year)" style={{ marginBottom: 4, lineHeight: 1.35 }}></Editable>}
      </Section>
      <Section title="Additional Information">
        {(additionalInfo ?? []).length > 0 ? additionalInfo!.map((a, i) => (
          <Editable key={i} editable={editable} style={{ marginBottom: 4, lineHeight: 1.35 }}>{a}</Editable>
        )) : <Editable editable={editable} placeholder="Certifications, languages, skills" style={{ marginBottom: 4, lineHeight: 1.35 }}></Editable>}
      </Section>
    </div>
  )
}

function TemplatePreview({ templateId, profile, summary, editable }: { templateId: TemplateId; profile: DisplayProfile; summary?: string; editable?: boolean }) {
  switch (templateId) {
    case 'classic':
      return <ClassicTemplate profile={profile} summary={summary} editable={editable} />
    case 'modern':
      return <ModernTemplate profile={profile} summary={summary} editable={editable} />
    case 'minimal':
      return <MinimalTemplate profile={profile} summary={summary} editable={editable} />
    case 'compact':
      return <CompactTemplate profile={profile} summary={summary} editable={editable} />
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
    if (!profile || !resumeRef.current) return
    setExporting(true)
    try {
      const canvas = await html2canvas(resumeRef.current, {
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
      pdf.save(`${(profile.name || 'resume').replace(/\s+/g, '-')}-resume.pdf`)
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

  const displayProfile = getDisplayProfile(profile)
  const summary = profile.professionalSummary?.trim() ?? ''

  return (
    <div className="page">
      <div className="card">
        <div className="header">
          <div>
            <h2>Resume Creator</h2>
            <div className="muted">Choose a style, fill in your data or type directly in the resume, then download as PDF.</div>
          </div>
        </div>

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
          <p className="muted" style={{ padding: '8px 16px', margin: 0, fontSize: 12, borderBottom: '1px solid var(--border)' }}>
            Click any text to edit. Empty fields show placeholders — type to add your info.
          </p>
          <div ref={resumeRef} style={{ background: '#fff', minHeight: 400, width: 595, maxWidth: '100%', margin: '0 auto' }}>
            <TemplatePreview templateId={selected} profile={displayProfile} summary={summary} editable />
          </div>
        </div>

        <div style={{ marginTop: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={exporting}
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
