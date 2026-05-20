import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import { Link } from 'react-router-dom'
import { getMyProfile, type Profile } from '../api'
import AcceleratorPaywall from '../components/AcceleratorPaywall'
import { AcceleratorRichPitch } from '../components/AcceleratorRichPitch'
import { useAuth } from '../state/AuthContext'
import {
  FileDown,
  List,
  ListOrdered,
  Link2,
  Undo2,
  Redo2,
  IndentIncrease,
  IndentDecrease,
  AlignLeft,
  AlignCenter,
  AlignRight,
  RemoveFormatting,
  Minus,
  Highlighter,
  ChevronDown,
} from 'lucide-react'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

type TemplateId = 'classic' | 'modern' | 'minimal' | 'compact'

const TEMPLATES: { id: TemplateId; name: string; desc: string }[] = [
  { id: 'classic', name: 'Classic', desc: 'Centered header, traditional sections' },
  { id: 'modern', name: 'Modern', desc: 'Two-column layout, contact sidebar' },
  { id: 'minimal', name: 'Minimal', desc: 'Clean lines, generous whitespace' },
  { id: 'compact', name: 'Compact', desc: 'Dense single column, maximum content' },
]

const EMPTY_DOC = '<p><br></p>'

type ResumeLayoutOptions = {
  showSummary: boolean
  showProjects: boolean
  showEducation: boolean
  showAdditional: boolean
  accent: 'default' | 'gold' | 'navy'
  /** Multiplier applied to template body font sizes */
  textScale: number
  lineHeight: number
  /** When set, replaces template body font for the whole resume */
  bodyFont: 'template' | 'serif' | 'sans'
}

const DEFAULT_LAYOUT: ResumeLayoutOptions = {
  showSummary: true,
  showProjects: true,
  showEducation: true,
  showAdditional: true,
  accent: 'default',
  textScale: 1,
  lineHeight: 1.4,
  bodyFont: 'template',
}

function sectionAccentStyle(accent: ResumeLayoutOptions['accent']): { borderColor: string; color: string } {
  switch (accent) {
    case 'gold':
      return { borderColor: '#b8860b', color: '#7a5c00' }
    case 'navy':
      return { borderColor: '#1e3a5f', color: '#1e3a5f' }
    default:
      return { borderColor: '#000', color: '#000' }
  }
}

const FONT_SERIF_STACK = 'Georgia, "Times New Roman", serif'
const FONT_SANS_STACK = 'Helvetica, Arial, sans-serif'

function resolveBodyFont(layout: ResumeLayoutOptions, templateDefault: string): string {
  if (layout.bodyFont === 'serif') return FONT_SERIF_STACK
  if (layout.bodyFont === 'sans') return FONT_SANS_STACK
  return templateDefault
}

function ResumeOptionsPanel({
  layout,
  onChange,
}: {
  layout: ResumeLayoutOptions
  onChange: (patch: Partial<ResumeLayoutOptions>) => void
}) {
  return (
    <details className="resume-options-dropdown">
      <summary className="resume-options-summary">
        <span className="resume-options-summary-text">
          <span className="resume-options-summary-title">More options</span>
          <span className="resume-options-summary-hint">Sections, accent, and typography</span>
        </span>
        <span className="resume-options-summary-chevron" aria-hidden>
          <ChevronDown size={18} strokeWidth={2.2} />
        </span>
      </summary>
      <div className="resume-options-panel-inner">
        <div className="resume-options-group">
          <div className="resume-options-group-label">Show on resume</div>
          <div className="resume-options-chips">
            <label className="resume-opt-check">
              <input type="checkbox" checked={layout.showSummary} onChange={(e) => onChange({ showSummary: e.target.checked })} />
              Summary
            </label>
            <label className="resume-opt-check">
              <input type="checkbox" checked={layout.showProjects} onChange={(e) => onChange({ showProjects: e.target.checked })} />
              Projects
            </label>
            <label className="resume-opt-check">
              <input type="checkbox" checked={layout.showEducation} onChange={(e) => onChange({ showEducation: e.target.checked })} />
              Education
            </label>
            <label className="resume-opt-check">
              <input type="checkbox" checked={layout.showAdditional} onChange={(e) => onChange({ showAdditional: e.target.checked })} />
              Additional
            </label>
          </div>
        </div>
        <div className="resume-options-group">
          <div className="resume-options-group-label">Look &amp; feel</div>
          <div className="resume-options-grid">
            <label className="resume-opt-field">
              Section accent
              <select value={layout.accent} onChange={(e) => onChange({ accent: e.target.value as ResumeLayoutOptions['accent'] })}>
                <option value="default">Black</option>
                <option value="gold">Gold</option>
                <option value="navy">Navy</option>
              </select>
            </label>
            <label className="resume-opt-field">
              Text size
              <select
                value={String(layout.textScale)}
                onChange={(e) => onChange({ textScale: Number(e.target.value) })}
              >
                <option value="0.92">Compact</option>
                <option value="1">Normal</option>
                <option value="1.08">Large</option>
              </select>
            </label>
            <label className="resume-opt-field">
              Line spacing
              <select
                value={String(layout.lineHeight)}
                onChange={(e) => onChange({ lineHeight: Number(e.target.value) })}
              >
                <option value="1.25">Tight</option>
                <option value="1.4">Normal</option>
                <option value="1.55">Relaxed</option>
              </select>
            </label>
            <label className="resume-opt-field">
              Body font
              <select
                value={layout.bodyFont}
                onChange={(e) => onChange({ bodyFont: e.target.value as ResumeLayoutOptions['bodyFont'] })}
              >
                <option value="template">Match template</option>
                <option value="serif">Serif</option>
                <option value="sans">Sans-serif</option>
              </select>
            </label>
          </div>
        </div>
      </div>
    </details>
  )
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Turn plain profile text into simple HTML paragraphs */
function plainTextToHtml(text: string): string {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const parts: string[] = []
  for (const line of lines) {
    const t = line.trim()
    if (!t) continue
    parts.push(`<p>${escapeHtml(t)}</p>`)
  }
  return parts.length ? parts.join('') : EMPTY_DOC
}

function isHtmlEffectivelyEmpty(html: string): boolean {
  if (!html || html === '<br>' || html === '<p><br></p>' || html === '<p></p>') return true
  const d = document.createElement('div')
  d.innerHTML = html
  const t = d.textContent?.replace(/\u00a0/g, ' ').trim() ?? ''
  return t === ''
}

type ResumeDraft = {
  name: string
  headline: string
  email: string
  phone: string
  linkedIn: string
  summaryHtml: string
  experience: { title: string; descriptionHtml: string }[]
  projects: { title: string; descriptionHtml: string }[]
  education: string[]
  additionalHtml: string[]
}

/** html2canvas often mis-draws form controls (shifted / wrong alignment). Swap clones for static divs that match layout. */
function replaceGhostFieldsInPdfClone(originalRoot: HTMLElement, clonedDoc: Document) {
  const cloneRoot = clonedDoc.querySelector('.resume-preview-inner') as HTMLElement | null
  if (!cloneRoot) return

  cloneRoot.style.width = '595px'
  cloneRoot.style.maxWidth = '595px'
  cloneRoot.style.marginLeft = '0'
  cloneRoot.style.marginRight = '0'
  cloneRoot.style.boxSizing = 'border-box'

  const origInputs = originalRoot.querySelectorAll('input.resume-ghost-input')
  const cloneInputs = cloneRoot.querySelectorAll('input.resume-ghost-input')
  origInputs.forEach((origEl, i) => {
    const cloneEl = cloneInputs[i]
    if (!cloneEl?.parentNode) return
    const orig = origEl as HTMLInputElement
    const cs = getComputedStyle(orig)
    const surrogate = clonedDoc.createElement('div')
    surrogate.className = 'resume-pdf-static-field'
    const val = orig.value.trim()
    surrogate.textContent = val || orig.placeholder || ''
    surrogate.style.boxSizing = 'border-box'
    surrogate.style.margin = cs.margin
    surrogate.style.paddingTop = cs.paddingTop
    surrogate.style.paddingRight = cs.paddingRight
    surrogate.style.paddingBottom = cs.paddingBottom
    surrogate.style.paddingLeft = cs.paddingLeft
    surrogate.style.fontSize = cs.fontSize
    surrogate.style.fontFamily = cs.fontFamily
    surrogate.style.fontWeight = cs.fontWeight
    surrogate.style.fontStyle = cs.fontStyle
    surrogate.style.letterSpacing = cs.letterSpacing
    surrogate.style.lineHeight = cs.lineHeight
    surrogate.style.textAlign = cs.textAlign
    surrogate.style.color = val ? cs.color : '#999'
    const w = cs.width
    surrogate.style.width = w && w !== 'auto' ? w : `${orig.clientWidth}px`
    surrogate.style.minWidth = cs.minWidth && cs.minWidth !== '0px' ? cs.minWidth : ''
    surrogate.style.maxWidth = cs.maxWidth && cs.maxWidth !== 'none' ? cs.maxWidth : '100%'
    surrogate.style.flexGrow = cs.flexGrow
    surrogate.style.flexShrink = cs.flexShrink
    surrogate.style.flexBasis = cs.flexBasis
    const d = cs.display
    surrogate.style.display = d === 'inline' || d === 'inline-block' ? 'inline-block' : d
    cloneEl.parentNode.replaceChild(surrogate, cloneEl)
  })

  const origTas = originalRoot.querySelectorAll('textarea.resume-ghost-textarea')
  const cloneTas = cloneRoot.querySelectorAll('textarea.resume-ghost-textarea')
  origTas.forEach((origEl, i) => {
    const cloneEl = cloneTas[i]
    if (!cloneEl?.parentNode) return
    const orig = origEl as HTMLTextAreaElement
    const cs = getComputedStyle(orig)
    const surrogate = clonedDoc.createElement('div')
    surrogate.className = 'resume-pdf-static-field'
    const val = orig.value.trim()
    surrogate.textContent = val || orig.placeholder || ''
    surrogate.style.boxSizing = 'border-box'
    surrogate.style.margin = cs.margin
    surrogate.style.paddingTop = cs.paddingTop
    surrogate.style.paddingRight = cs.paddingRight
    surrogate.style.paddingBottom = cs.paddingBottom
    surrogate.style.paddingLeft = cs.paddingLeft
    surrogate.style.fontSize = cs.fontSize
    surrogate.style.fontFamily = cs.fontFamily
    surrogate.style.fontWeight = cs.fontWeight
    surrogate.style.fontStyle = cs.fontStyle
    surrogate.style.letterSpacing = cs.letterSpacing
    surrogate.style.lineHeight = cs.lineHeight
    surrogate.style.textAlign = cs.textAlign
    surrogate.style.color = val ? cs.color : '#999'
    surrogate.style.whiteSpace = 'pre-wrap'
    const w = cs.width
    surrogate.style.width = w && w !== 'auto' ? w : `${orig.clientWidth}px`
    surrogate.style.minHeight = cs.minHeight && cs.minHeight !== 'auto' ? cs.minHeight : `${orig.clientHeight}px`
    surrogate.style.display = 'block'
    cloneEl.parentNode.replaceChild(surrogate, cloneEl)
  })
}

function syncContentEditableStylesForPdfClone(originalRoot: HTMLElement, clonedDoc: Document) {
  const cloneRoot = clonedDoc.querySelector('.resume-preview-inner')
  if (!cloneRoot) return
  const origList = originalRoot.querySelectorAll('[contenteditable="true"]')
  const cloneList = cloneRoot.querySelectorAll('[contenteditable="true"]')
  origList.forEach((origNode, i) => {
    const h = cloneList[i] as HTMLElement | undefined
    if (!h) return
    const cs = getComputedStyle(origNode)
    h.style.outline = 'none'
    h.style.boxShadow = 'none'
    h.style.backgroundColor = 'transparent'
    h.style.textAlign = cs.textAlign
  })
}

function profileToDraft(p: Profile): ResumeDraft {
  const exp =
    p.experience?.length && p.experience.some((e) => (e.title || e.description || '').trim())
      ? p.experience.map((e) => ({
          title: e.title ?? '',
          descriptionHtml: plainTextToHtml(e.description ?? ''),
        }))
      : [{ title: '', descriptionHtml: EMPTY_DOC }]

  const proj =
    p.projects?.length && p.projects.some((e) => (e.title || e.description || '').trim())
      ? p.projects.map((e) => ({
          title: e.title ?? '',
          descriptionHtml: plainTextToHtml(e.description ?? ''),
        }))
      : [{ title: '', descriptionHtml: EMPTY_DOC }]

  const edu = p.education?.length ? [...p.education] : ['']
  const addl = p.additionalInfo?.length ? p.additionalInfo.map((s) => plainTextToHtml(s)) : [EMPTY_DOC]

  return {
    name: p.name?.trim() ?? '',
    headline: p.headline?.trim() ?? '',
    email: p.contact?.email ?? '',
    phone: p.contact?.phone ?? '',
    linkedIn: p.contact?.linkedIn ?? '',
    summaryHtml: plainTextToHtml(p.professionalSummary ?? ''),
    experience: exp,
    projects: proj,
    education: edu,
    additionalHtml: addl,
  }
}

const ResumeRichEditorContext = createContext<(el: HTMLDivElement | null) => void>(() => {})

function useRegisterRichEditor() {
  return useContext(ResumeRichEditorContext)
}

const RESUME_HIGHLIGHT_HEX = '#fef08a'
const RESUME_PAGE_BG_HEX = '#ffffff'
/** Matches RichTextField body copy */
const RESUME_BODY_COLOR_HEX = '#333333'

const RESUME_FORE_COLORS: { label: string; color: string }[] = [
  { label: 'Default text color', color: RESUME_BODY_COLOR_HEX },
  { label: 'Black', color: '#000000' },
  { label: 'Navy', color: '#1e3a5f' },
  { label: 'Blue', color: '#1d4ed8' },
  { label: 'Green', color: '#15803d' },
  { label: 'Red', color: '#b91c1c' },
  { label: 'Purple', color: '#6d28d9' },
  { label: 'Gold', color: '#a16207' },
]

function parseRgbColor(rgb: string): { r: number; g: number; b: number } | null {
  const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i)
  if (!m) return null
  return { r: +m[1], g: +m[2], b: +m[3] }
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, '0'))
      .join('')
  )
}

/** True if computed background matches the toolbar yellow highlight (execCommand may normalize rgb). */
function isResumeYellowHighlight(bg: string): boolean {
  const t = bg.trim().toLowerCase()
  if (t === RESUME_HIGHLIGHT_HEX || t === '#ffef88') return true
  const p = parseRgbColor(bg)
  if (!p) return false
  const hex = rgbToHex(p.r, p.g, p.b).toLowerCase()
  if (hex === RESUME_HIGHLIGHT_HEX) return true
  // Allow small variance from browser rounding
  return p.r > 248 && p.g > 232 && p.b > 120 && p.b < 150
}

function ancestorChainHasYellowHighlight(node: Node, root: HTMLElement): boolean {
  let el: Element | null = node.nodeType === Node.TEXT_NODE ? (node.parentElement as Element | null) : (node as Element)
  while (el && el !== root) {
    if (isResumeYellowHighlight(getComputedStyle(el).backgroundColor)) return true
    el = el.parentElement
  }
  return false
}

/** Whether the current selection is inside the editor and sits on (or touches) yellow highlight. */
function selectionTouchesYellowHighlight(editable: HTMLElement): boolean {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return false
  const range = sel.getRangeAt(0)
  if (!editable.contains(range.commonAncestorContainer)) return false
  return (
    ancestorChainHasYellowHighlight(range.startContainer, editable) ||
    ancestorChainHasYellowHighlight(range.endContainer, editable)
  )
}

/** Sticky bar at top of creator — applies to whichever rich field was last focused */
function GlobalResumeFormatToolbar({ getTarget }: { getTarget: () => HTMLDivElement | null }) {
  const run = useCallback(
    (cmd: string, value?: string) => {
      const el = getTarget()
      if (!el) return
      el.focus()
      try {
        document.execCommand(cmd, false, value)
      } catch {
        /* ignore */
      }
      el.dispatchEvent(new Event('input', { bubbles: true }))
    },
    [getTarget],
  )

  const applyForeColor = useCallback(
    (color: string) => {
      const el = getTarget()
      if (!el) return
      el.focus()
      try {
        document.execCommand('styleWithCSS', false, 'true')
      } catch {
        /* ignore */
      }
      try {
        document.execCommand('foreColor', false, color)
      } catch {
        /* ignore */
      }
      el.dispatchEvent(new Event('input', { bubbles: true }))
    },
    [getTarget],
  )

  const toggleHighlight = useCallback(() => {
    const el = getTarget()
    if (!el) return
    el.focus()
    try {
      document.execCommand('styleWithCSS', false, 'true')
    } catch {
      /* ignore */
    }
    const remove = selectionTouchesYellowHighlight(el)
    try {
      document.execCommand('backColor', false, remove ? RESUME_PAGE_BG_HEX : RESUME_HIGHLIGHT_HEX)
    } catch {
      /* ignore */
    }
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }, [getTarget])

  const insertLink = useCallback(() => {
    const el = getTarget()
    if (!el) return
    const url = window.prompt('Link URL (https://…)')
    if (!url?.trim()) return
    el.focus()
    try {
      document.execCommand('createLink', false, url.trim())
    } catch {
      /* ignore */
    }
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }, [getTarget])

  const TbBtn = ({
    title,
    onClick,
    children,
    className,
  }: {
    title: string
    onClick: () => void
    children: ReactNode
    className?: string
  }) => (
    <button type="button" title={title} aria-label={title} className={className} onClick={onClick}>
      {children}
    </button>
  )

  return (
    <div
      className="resume-global-format-bar"
      role="toolbar"
      aria-label="Resume text formatting"
      onMouseDown={(e) => {
        if ((e.target as HTMLElement).closest('button')) e.preventDefault()
      }}
    >
      <span className="resume-global-format-label">Format</span>
      <div className="resume-format-toolbar resume-format-toolbar-wide" aria-hidden={false}>
        <TbBtn title="Bold" onClick={() => run('bold')}>
          <strong>B</strong>
        </TbBtn>
        <TbBtn title="Italic" onClick={() => run('italic')}>
          <em>I</em>
        </TbBtn>
        <TbBtn title="Underline" onClick={() => run('underline')}>
          <span className="resume-tb-underline">U</span>
        </TbBtn>
        <TbBtn title="Strikethrough" onClick={() => run('strikeThrough')}>
          <Minus size={14} strokeWidth={2.5} className="resume-tb-strike-icon" />
        </TbBtn>
        <span className="resume-toolbar-sep" />
        <TbBtn title="Align left" onClick={() => run('justifyLeft')}>
          <AlignLeft size={14} strokeWidth={2.5} />
        </TbBtn>
        <TbBtn title="Align center" onClick={() => run('justifyCenter')}>
          <AlignCenter size={14} strokeWidth={2.5} />
        </TbBtn>
        <TbBtn title="Align right" onClick={() => run('justifyRight')}>
          <AlignRight size={14} strokeWidth={2.5} />
        </TbBtn>
        <span className="resume-toolbar-sep" />
        <TbBtn title="Bulleted list" onClick={() => run('insertUnorderedList')}>
          <List size={14} strokeWidth={2.5} />
        </TbBtn>
        <TbBtn title="Numbered list" onClick={() => run('insertOrderedList')}>
          <ListOrdered size={14} strokeWidth={2.5} />
        </TbBtn>
        <TbBtn title="Indent" onClick={() => run('indent')}>
          <IndentIncrease size={14} strokeWidth={2.5} />
        </TbBtn>
        <TbBtn title="Outdent" onClick={() => run('outdent')}>
          <IndentDecrease size={14} strokeWidth={2.5} />
        </TbBtn>
        <span className="resume-toolbar-sep" />
        <TbBtn title="Highlight selection (click again on highlighted text to remove)" onClick={toggleHighlight}>
          <Highlighter size={14} strokeWidth={2.5} />
        </TbBtn>
        <span className="resume-format-color-swatches" role="group" aria-label="Text color">
          {RESUME_FORE_COLORS.map(({ label, color }) => (
            <TbBtn
              key={color}
              title={label}
              className="resume-tb-swatch-btn"
              onClick={() => applyForeColor(color)}
            >
              <span className="resume-tb-color-swatch" style={{ background: color }} />
            </TbBtn>
          ))}
        </span>
        <TbBtn title="Insert link" onClick={insertLink}>
          <Link2 size={14} strokeWidth={2.5} />
        </TbBtn>
        <span className="resume-toolbar-sep" />
        <TbBtn title="Clear formatting" onClick={() => run('removeFormat')}>
          <RemoveFormatting size={14} strokeWidth={2.5} />
        </TbBtn>
        <TbBtn title="Undo" onClick={() => run('undo')}>
          <Undo2 size={14} strokeWidth={2.5} />
        </TbBtn>
        <TbBtn title="Redo" onClick={() => run('redo')}>
          <Redo2 size={14} strokeWidth={2.5} />
        </TbBtn>
      </div>
    </div>
  )
}

function RichTextField({
  value,
  onChange,
  placeholder,
  editable,
  style,
  minHeight = 28,
}: {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  editable?: boolean
  style?: CSSProperties
  minHeight?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const focused = useRef(false)
  const [showPh, setShowPh] = useState(true)
  const registerActive = useRegisterRichEditor()

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || focused.current) return
    const next = value && !isHtmlEffectivelyEmpty(value) ? value : EMPTY_DOC
    if (el.innerHTML !== next) el.innerHTML = next
  }, [value])

  useEffect(() => {
    setShowPh(isHtmlEffectivelyEmpty(value))
  }, [value])

  if (!editable) {
    return (
      <div
        className="resume-rich-editor resume-rich-readonly"
        style={{ minHeight, ...style }}
        dangerouslySetInnerHTML={{
          __html:
            value && !isHtmlEffectivelyEmpty(value)
              ? value
              : `<p class="resume-rich-placeholder">${escapeHtml(placeholder ?? '')}</p>`,
        }}
      />
    )
  }

  const empty = showPh

  return (
    <div className="resume-rich-field">
      {empty && placeholder && (
        <span className="resume-rich-ph-overlay" aria-hidden>
          {placeholder}
        </span>
      )}
      <div
        ref={ref}
        className="resume-rich-editor"
        contentEditable
        suppressContentEditableWarning
        onFocus={() => {
          focused.current = true
          setShowPh(false)
          registerActive(ref.current)
        }}
        onBlur={() => {
          focused.current = false
          setShowPh(isHtmlEffectivelyEmpty(ref.current?.innerHTML ?? ''))
        }}
        onInput={() => {
          const el = ref.current
          if (el) {
            onChange(el.innerHTML)
            setShowPh(isHtmlEffectivelyEmpty(el.innerHTML))
          }
        }}
        style={{ minHeight, ...style }}
      />
    </div>
  )
}

function GhostInput({
  value,
  onChange,
  placeholder,
  editable,
  style,
  multiline,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  editable?: boolean
  style?: CSSProperties
  multiline?: boolean
}) {
  const base: CSSProperties = {
    width: '100%',
    border: 'none',
    background: 'transparent',
    font: 'inherit',
    color: 'inherit',
    padding: 0,
    margin: 0,
    display: 'block',
    boxSizing: 'border-box',
    ...style,
  }

  if (!editable) {
    const show = value.trim()
    return (
      <span style={base}>
        {show || <span style={{ color: '#999' }}>{placeholder}</span>}
      </span>
    )
  }

  if (multiline) {
    return (
      <textarea
        className="resume-ghost-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        style={{ ...base, resize: 'vertical', minHeight: 56, lineHeight: 1.4 }}
      />
    )
  }

  return (
    <input
      type="text"
      className="resume-ghost-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ ...base, lineHeight: 1.4 }}
    />
  )
}

function Section({ title, children, layout }: { title: string; children: ReactNode; layout: ResumeLayoutOptions }) {
  const a = sectionAccentStyle(layout.accent)
  const s = layout.textScale
  return (
    <div className="resume-section" style={{ marginBottom: 14 }}>
      <div
        className="resume-section-heading"
        style={{
          fontSize: 10 * s,
          fontWeight: 700,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          marginBottom: 10,
          borderBottom: `1px solid ${a.borderColor}`,
          paddingBottom: 8,
          color: a.color,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  )
}

function SectionAddButton({ editable, label, onAdd }: { editable?: boolean; label: string; onAdd: () => void }) {
  if (!editable) return null
  return (
    <div className="resume-list-row-actions">
      <button type="button" className="resume-list-btn" onClick={onAdd}>
        + Add {label}
      </button>
    </div>
  )
}

function RowRemoveButton({ editable, canRemove, onRemove }: { editable?: boolean; canRemove: boolean; onRemove: () => void }) {
  if (!editable || !canRemove) return null
  return (
    <button type="button" className="resume-list-btn danger resume-row-remove" onClick={onRemove}>
      Remove
    </button>
  )
}

function ExpItemBlock({
  item,
  onTitleChange,
  onDescChange,
  editable,
  titlePlaceholder,
  descPlaceholder,
  style,
  layout,
}: {
  item: { title: string; descriptionHtml: string }
  onTitleChange: (v: string) => void
  onDescChange: (html: string) => void
  editable?: boolean
  titlePlaceholder?: string
  descPlaceholder?: string
  style?: CSSProperties
  layout: ResumeLayoutOptions
}) {
  return (
    <div className="resume-exp-item" style={{ marginBottom: 12, ...style }}>
      <GhostInput
        editable={editable}
        value={item.title}
        onChange={onTitleChange}
        placeholder={titlePlaceholder}
        style={{ fontWeight: 600, marginBottom: 8, lineHeight: layout.lineHeight }}
      />
      <RichTextField
        editable={editable}
        value={item.descriptionHtml}
        onChange={onDescChange}
        placeholder={descPlaceholder}
        style={{ lineHeight: layout.lineHeight, color: '#333' }}
        minHeight={24}
      />
    </div>
  )
}

type SetDraft = Dispatch<SetStateAction<ResumeDraft>>

function SharedSections({
  draft,
  setDraft,
  editable,
  expBlockStyle,
  layout,
}: {
  draft: ResumeDraft
  setDraft: SetDraft
  editable?: boolean
  expBlockStyle?: CSSProperties
  layout: ResumeLayoutOptions
}) {
  return (
    <>
      {layout.showSummary && (
        <Section title="Professional Summary" layout={layout}>
          <RichTextField
            editable={editable}
            value={draft.summaryHtml}
            onChange={(html) => setDraft((d) => ({ ...d, summaryHtml: html }))}
            placeholder="2–3 sentences about your experience and goals"
            style={{ lineHeight: layout.lineHeight, color: '#333' }}
            minHeight={28}
          />
        </Section>
      )}

      <Section title="Experience" layout={layout}>
        {draft.experience.map((item, i) => (
          <div key={i} className="resume-exp-row">
            <div className="resume-exp-row-inner">
              <ExpItemBlock
                item={item}
                editable={editable}
                layout={layout}
                titlePlaceholder="Job title — Company (Years)"
                descPlaceholder="Key achievements — use the bar above for • bullets"
                style={expBlockStyle}
                onTitleChange={(v) =>
                  setDraft((d) => ({
                    ...d,
                    experience: d.experience.map((it, j) => (j === i ? { ...it, title: v } : it)),
                  }))
                }
                onDescChange={(html) =>
                  setDraft((d) => ({
                    ...d,
                    experience: d.experience.map((it, j) => (j === i ? { ...it, descriptionHtml: html } : it)),
                  }))
                }
              />
            </div>
            <RowRemoveButton
              editable={editable}
              canRemove={draft.experience.length > 1}
              onRemove={() =>
                setDraft((d) => ({
                  ...d,
                  experience:
                    d.experience.length > 1
                      ? d.experience.filter((_, j) => j !== i)
                      : [{ title: '', descriptionHtml: EMPTY_DOC }],
                }))
              }
            />
          </div>
        ))}
        <SectionAddButton
          editable={editable}
          label="experience"
          onAdd={() =>
            setDraft((d) => ({
              ...d,
              experience: [...d.experience, { title: '', descriptionHtml: EMPTY_DOC }],
            }))
          }
        />
      </Section>

      {layout.showProjects && (
        <Section title="Projects" layout={layout}>
          {draft.projects.map((item, i) => (
            <div key={i} className="resume-exp-row">
              <div className="resume-exp-row-inner">
                <ExpItemBlock
                  item={item}
                  editable={editable}
                  layout={layout}
                  titlePlaceholder="Project title"
                  descPlaceholder="Outcomes and details — format bar above for bullets"
                  style={expBlockStyle}
                  onTitleChange={(v) =>
                    setDraft((d) => ({
                      ...d,
                      projects: d.projects.map((it, j) => (j === i ? { ...it, title: v } : it)),
                    }))
                  }
                  onDescChange={(html) =>
                    setDraft((d) => ({
                      ...d,
                      projects: d.projects.map((it, j) => (j === i ? { ...it, descriptionHtml: html } : it)),
                    }))
                  }
                />
              </div>
              <RowRemoveButton
                editable={editable}
                canRemove={draft.projects.length > 1}
                onRemove={() =>
                  setDraft((d) => ({
                    ...d,
                    projects:
                      d.projects.length > 1
                        ? d.projects.filter((_, j) => j !== i)
                        : [{ title: '', descriptionHtml: EMPTY_DOC }],
                  }))
                }
              />
            </div>
          ))}
          <SectionAddButton
            editable={editable}
            label="project"
            onAdd={() =>
              setDraft((d) => ({
                ...d,
                projects: [...d.projects, { title: '', descriptionHtml: EMPTY_DOC }],
              }))
            }
          />
        </Section>
      )}

      {layout.showEducation && (
        <Section title="Education" layout={layout}>
          {draft.education.map((line, i) => (
            <div key={i} className="resume-edu-row" style={{ marginBottom: 2 }}>
              <GhostInput
                editable={editable}
                value={line}
                onChange={(v) =>
                  setDraft((d) => ({
                    ...d,
                    education: d.education.map((e, j) => (j === i ? v : e)),
                  }))
                }
                placeholder="Degree — University (Year)"
                style={{ lineHeight: layout.lineHeight, flex: 1 }}
              />
              <RowRemoveButton
                editable={editable}
                canRemove={draft.education.length > 1}
                onRemove={() =>
                  setDraft((d) => ({
                    ...d,
                    education: d.education.length > 1 ? d.education.filter((_, j) => j !== i) : [''],
                  }))
                }
              />
            </div>
          ))}
          <SectionAddButton editable={editable} label="education line" onAdd={() => setDraft((d) => ({ ...d, education: [...d.education, ''] }))} />
        </Section>
      )}

      {layout.showAdditional && (
        <Section title="Additional Information" layout={layout}>
          {draft.additionalHtml.map((html, i) => (
            <div key={i} className="resume-exp-row" style={{ marginBottom: 2 }}>
              <div className="resume-exp-row-inner">
                <RichTextField
                  editable={editable}
                  value={html}
                  onChange={(h) =>
                    setDraft((d) => ({
                      ...d,
                      additionalHtml: d.additionalHtml.map((x, j) => (j === i ? h : x)),
                    }))
                  }
                  placeholder="Certifications, languages, skills"
                  style={{ lineHeight: layout.lineHeight, color: '#333' }}
                  minHeight={24}
                />
              </div>
              <RowRemoveButton
                editable={editable}
                canRemove={draft.additionalHtml.length > 1}
                onRemove={() =>
                  setDraft((d) => ({
                    ...d,
                    additionalHtml:
                      d.additionalHtml.length > 1 ? d.additionalHtml.filter((_, j) => j !== i) : [EMPTY_DOC],
                  }))
                }
              />
            </div>
          ))}
          <SectionAddButton
            editable={editable}
            label="additional block"
            onAdd={() => setDraft((d) => ({ ...d, additionalHtml: [...d.additionalHtml, EMPTY_DOC] }))}
          />
        </Section>
      )}
    </>
  )
}

function ClassicTemplate({
  draft,
  setDraft,
  editable,
  layout,
}: {
  draft: ResumeDraft
  setDraft: SetDraft
  editable?: boolean
  layout: ResumeLayoutOptions
}) {
  const { name, headline, email, phone, linkedIn } = draft
  const s = layout.textScale
  const ff = resolveBodyFont(layout, FONT_SERIF_STACK)
  return (
    <div style={{ fontFamily: ff, fontSize: 11 * s, lineHeight: layout.lineHeight, color: '#000', padding: 24, maxWidth: 595 }}>
      <div style={{ textAlign: 'center', marginBottom: 16 * s }}>
        <GhostInput
          editable={editable}
          value={name}
          onChange={(v) => setDraft((d) => ({ ...d, name: v }))}
          placeholder="Your name"
          style={{ fontSize: 22 * s, fontWeight: 700, margin: 0, letterSpacing: '0.05em', color: '#000', textAlign: 'center' }}
        />
        <GhostInput
          editable={editable}
          value={headline}
          onChange={(v) => setDraft((d) => ({ ...d, headline: v }))}
          placeholder="Your headline"
          style={{ fontSize: 10 * s, marginTop: 4 * s, color: '#333', textAlign: 'center', lineHeight: layout.lineHeight }}
        />
        <div style={{ fontSize: 9 * s, marginTop: 6 * s, color: '#555', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '4px 12px' }}>
          <GhostInput editable={editable} value={email} onChange={(v) => setDraft((d) => ({ ...d, email: v }))} placeholder="Email" style={{ display: 'inline', flex: '1 1 auto', minWidth: 120, textAlign: 'center', lineHeight: layout.lineHeight }} />
          <GhostInput editable={editable} value={phone} onChange={(v) => setDraft((d) => ({ ...d, phone: v }))} placeholder="Phone" style={{ display: 'inline', flex: '1 1 auto', minWidth: 100, textAlign: 'center', lineHeight: layout.lineHeight }} />
          <GhostInput editable={editable} value={linkedIn} onChange={(v) => setDraft((d) => ({ ...d, linkedIn: v }))} placeholder="LinkedIn" style={{ display: 'inline', flex: '1 1 auto', minWidth: 120, textAlign: 'center', lineHeight: layout.lineHeight }} />
        </div>
      </div>
      <SharedSections draft={draft} setDraft={setDraft} editable={editable} layout={layout} />
    </div>
  )
}

function ModernTemplate({
  draft,
  setDraft,
  editable,
  layout,
}: {
  draft: ResumeDraft
  setDraft: SetDraft
  editable?: boolean
  layout: ResumeLayoutOptions
}) {
  const { name, headline, email, phone, linkedIn } = draft
  const s = layout.textScale
  const ff = resolveBodyFont(layout, FONT_SANS_STACK)
  return (
    <div className="resume-modern-layout" style={{ fontFamily: ff, fontSize: 10 * s, lineHeight: layout.lineHeight, color: '#000', display: 'flex', maxWidth: 595 }}>
      <div className="resume-modern-sidebar" style={{ width: 140, padding: 20, background: '#fff', borderRight: '1px solid #000' }}>
        <GhostInput editable={editable} value={name} onChange={(v) => setDraft((d) => ({ ...d, name: v }))} placeholder="Your name" style={{ fontSize: 14 * s, fontWeight: 700, margin: '0 0 8px 0', color: '#000' }} />
        <GhostInput editable={editable} value={headline} onChange={(v) => setDraft((d) => ({ ...d, headline: v }))} placeholder="Headline" style={{ fontSize: 9 * s, color: '#333', lineHeight: layout.lineHeight }} />
        <div style={{ marginTop: 16 * s, fontSize: 9 * s, color: '#333' }}>
          <GhostInput editable={editable} value={email} onChange={(v) => setDraft((d) => ({ ...d, email: v }))} placeholder="Email" style={{ marginBottom: 4, lineHeight: layout.lineHeight }} />
          <GhostInput editable={editable} value={phone} onChange={(v) => setDraft((d) => ({ ...d, phone: v }))} placeholder="Phone" style={{ marginBottom: 4, lineHeight: layout.lineHeight }} />
          <GhostInput editable={editable} value={linkedIn} onChange={(v) => setDraft((d) => ({ ...d, linkedIn: v }))} placeholder="LinkedIn" style={{ marginBottom: 4, lineHeight: layout.lineHeight }} />
        </div>
      </div>
      <div className="resume-modern-main" style={{ flex: 1, padding: 24 }}>
        <SharedSections draft={draft} setDraft={setDraft} editable={editable} layout={layout} />
      </div>
    </div>
  )
}

function MinimalTemplate({
  draft,
  setDraft,
  editable,
  layout,
}: {
  draft: ResumeDraft
  setDraft: SetDraft
  editable?: boolean
  layout: ResumeLayoutOptions
}) {
  const { name, headline, email, phone, linkedIn } = draft
  const contactLine = [email, phone, linkedIn].filter(Boolean).join(' · ')
  const s = layout.textScale
  const ff = resolveBodyFont(layout, FONT_SANS_STACK)
  return (
    <div style={{ fontFamily: ff, fontSize: 11 * s, lineHeight: layout.lineHeight, color: '#000', padding: 32, maxWidth: 595 }}>
      <GhostInput editable={editable} value={name} onChange={(v) => setDraft((d) => ({ ...d, name: v }))} placeholder="Your name" style={{ fontSize: 20 * s, fontWeight: 600, margin: '0 0 4px 0', letterSpacing: '-0.02em', color: '#000' }} />
      <GhostInput editable={editable} value={headline} onChange={(v) => setDraft((d) => ({ ...d, headline: v }))} placeholder="Headline" style={{ fontSize: 10 * s, color: '#444', marginBottom: 16 * s }} />
      {editable ? (
        <div style={{ fontSize: 9 * s, color: '#666', marginBottom: 28 * s, display: 'grid', gap: 6 }}>
          <GhostInput editable value={email} onChange={(v) => setDraft((d) => ({ ...d, email: v }))} placeholder="Email" />
          <GhostInput editable value={phone} onChange={(v) => setDraft((d) => ({ ...d, phone: v }))} placeholder="Phone" />
          <GhostInput editable value={linkedIn} onChange={(v) => setDraft((d) => ({ ...d, linkedIn: v }))} placeholder="LinkedIn" />
        </div>
      ) : (
        <div style={{ fontSize: 9 * s, color: '#666', marginBottom: 28 * s }}>
          {contactLine || <span style={{ color: '#999' }}>Email · Phone · LinkedIn</span>}
        </div>
      )}
      <SharedSections draft={draft} setDraft={setDraft} editable={editable} expBlockStyle={{ marginBottom: 2 }} layout={layout} />
    </div>
  )
}

function CompactTemplate({
  draft,
  setDraft,
  editable,
  layout,
}: {
  draft: ResumeDraft
  setDraft: SetDraft
  editable?: boolean
  layout: ResumeLayoutOptions
}) {
  const { name, headline, email, phone, linkedIn } = draft
  const s = layout.textScale
  const ff = resolveBodyFont(layout, FONT_SANS_STACK)
  return (
    <div style={{ fontFamily: ff, fontSize: 10 * s, lineHeight: layout.lineHeight, color: '#000', padding: 20, maxWidth: 595 }}>
      <div className="resume-compact-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 * s, paddingBottom: 8 * s, flexWrap: 'wrap', gap: 8 }}>
        <GhostInput editable={editable} value={name} onChange={(v) => setDraft((d) => ({ ...d, name: v }))} placeholder="Your name" style={{ fontSize: 16 * s, fontWeight: 700, margin: 0, color: '#000', flex: '1 1 200px' }} />
        <div style={{ fontSize: 8 * s, color: '#333', display: 'flex', flexWrap: 'wrap', gap: '4px 8px' }}>
          <GhostInput editable={editable} value={email} onChange={(v) => setDraft((d) => ({ ...d, email: v }))} placeholder="Email" style={{ display: 'inline', minWidth: 80 }} />
          <GhostInput editable={editable} value={phone} onChange={(v) => setDraft((d) => ({ ...d, phone: v }))} placeholder="Phone" style={{ display: 'inline', minWidth: 72 }} />
          <GhostInput editable={editable} value={linkedIn} onChange={(v) => setDraft((d) => ({ ...d, linkedIn: v }))} placeholder="LinkedIn" style={{ display: 'inline', minWidth: 80 }} />
        </div>
      </div>
      <GhostInput editable={editable} value={headline} onChange={(v) => setDraft((d) => ({ ...d, headline: v }))} placeholder="Headline" style={{ fontSize: 9 * s, marginBottom: 12 * s, color: '#444' }} />
      <SharedSections draft={draft} setDraft={setDraft} editable={editable} expBlockStyle={{ marginBottom: 2 }} layout={layout} />
    </div>
  )
}

function TemplatePreview({
  templateId,
  draft,
  setDraft,
  editable,
  layout,
}: {
  templateId: TemplateId
  draft: ResumeDraft
  setDraft: SetDraft
  editable?: boolean
  layout: ResumeLayoutOptions
}) {
  switch (templateId) {
    case 'classic':
      return <ClassicTemplate draft={draft} setDraft={setDraft} editable={editable} layout={layout} />
    case 'modern':
      return <ModernTemplate draft={draft} setDraft={setDraft} editable={editable} layout={layout} />
    case 'minimal':
      return <MinimalTemplate draft={draft} setDraft={setDraft} editable={editable} layout={layout} />
    case 'compact':
      return <CompactTemplate draft={draft} setDraft={setDraft} editable={editable} layout={layout} />
  }
}

export default function ResumeCreatorPage() {
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [draft, setDraft] = useState<ResumeDraft | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<TemplateId>('classic')
  const [layout, setLayout] = useState<ResumeLayoutOptions>(DEFAULT_LAYOUT)
  const [exporting, setExporting] = useState(false)
  const resumeRef = useRef<HTMLDivElement>(null)
  const activeRichEditorRef = useRef<HTMLDivElement | null>(null)

  const setActiveRichEditor = useCallback((el: HTMLDivElement | null) => {
    activeRichEditorRef.current = el
  }, [])

  useEffect(() => {
    if (authLoading || !user || user.plan !== 'paid') return

    let cancelled = false
    async function load() {
      try {
        const data = await getMyProfile()
        if (!cancelled) {
          setProfile(data.profile)
          setDraft(profileToDraft(data.profile))
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load profile')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [authLoading, user?.plan, user?.id])

  async function handleExportPDF() {
    if (!draft || !resumeRef.current) return
    const el = resumeRef.current
    setExporting(true)
    el.classList.add('resume-pdf-mode')
    try {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      })
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        scrollX: -window.scrollX,
        scrollY: -window.scrollY,
        onclone: (clonedDoc) => {
          clonedDoc
            .querySelectorAll('.resume-list-row-actions, .resume-list-btn, .resume-row-remove, .resume-rich-ph-overlay')
            .forEach((node) => {
              ;(node as HTMLElement).style.display = 'none'
            })
          replaceGhostFieldsInPdfClone(el, clonedDoc)
          syncContentEditableStylesForPdfClone(el, clonedDoc)
        },
      })
      const imgData = canvas.toDataURL('image/png', 1.0)
      const pdf = new jsPDF({ format: 'a4', unit: 'px' })
      const pdfW = pdf.internal.pageSize.getWidth()
      const imgH = (canvas.height * pdfW) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, imgH)
      pdf.save(`${(draft.name || 'resume').replace(/\s+/g, '-')}-resume.pdf`)
    } catch (err) {
      console.error('PDF export failed:', err)
    } finally {
      el.classList.remove('resume-pdf-mode')
      setExporting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="page">
        <div className="card">
          <p className="muted">Loading…</p>
        </div>
      </div>
    )
  }

  if (!user || user.plan !== 'paid') {
    return (
      <AcceleratorPaywall variant="rich" title="Resume Creator" description={<AcceleratorRichPitch />} />
    )
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

  if (error || !profile || !draft) {
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

  return (
    <div className="page">
      <div className="card">
        <div className="header">
          <div>
            <h2>Resume Creator</h2>
            <div className="muted">Pick a template, open <strong>More options</strong> for sections and typography, use the format bar for rich text, then export PDF.</div>
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
              <div className="muted" style={{ fontSize: 12, lineHeight: 1.35 }}>
                {t.desc}
              </div>
            </button>
          ))}
        </div>

        <ResumeOptionsPanel layout={layout} onChange={(patch) => setLayout((L) => ({ ...L, ...patch }))} />

        <ResumeRichEditorContext.Provider value={setActiveRichEditor}>
          <GlobalResumeFormatToolbar getTarget={() => activeRichEditorRef.current} />
          <div className="resume-preview-wrap" style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div ref={resumeRef} className="resume-preview-inner">
              <TemplatePreview templateId={selected} draft={draft} setDraft={setDraft} editable layout={layout} />
            </div>
          </div>
        </ResumeRichEditorContext.Provider>

        <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <button type="button" onClick={handleExportPDF} disabled={exporting} className="btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
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
