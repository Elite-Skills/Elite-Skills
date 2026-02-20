const STOPWORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'has',
  'have',
  'in',
  'is',
  'it',
  'its',
  'of',
  'on',
  'or',
  'that',
  'the',
  'their',
  'this',
  'to',
  'was',
  'were',
  'will',
  'with',
  'work',
  'working',
  'experience',
  'team',
  'role',
  'roles',
  'using',
  'job',
  'years',
  'year',
  'internal',
  'teams',
  'ensure',
  'process',
  'platform',
])

function normalizeText(s: string): string {
  return s.replace(/\s+/g, ' ').trim().toLowerCase()
}

function extractLinkedIn(raw: string): string | null {
  const m = raw.match(/https?:\/\/(?:www\.)?linkedin\.com\/[^\s]+/i)
  return m ? m[0].replace(/[).,]+$/, '') : null
}

function cleanSummaryText(s: string): string {
  return normalizeLine(s)
    .replace(/\bwanna\b/gi, 'want to')
    .replace(/\blots of\b/gi, 'more')
    .replace(/\byour organisation\b/gi, 'your organization')
    .replace(/\borganisation\b/gi, 'organization')
    .replace(/\.{2,}/g, '.')
}

function bulletizeLine(section: string, line: string): string {
  const t = normalizeLine(line)
  if (!t) return ''
  if (isBulletLine(t)) return t
  if (looksLikeBulletCandidate(section, t)) return `- ${t}`
  return t
}

function buildImprovedResumeDraft(sections: SectionBreakdown[], resumeTextRaw: string): string {
  const general = sections.find((s) => s.name === 'General')
  const summary = sections.find((s) => s.name === 'Summary')
  const education = sections.find((s) => s.name === 'Education')
  const skills = sections.find((s) => s.name === 'Skills')
  const interests = sections.find((s) => s.name === 'Interests')
  const experience = sections.find((s) => s.name === 'Experience')
  const projects = sections.find((s) => s.name === 'Projects')

  const email = resumeTextRaw.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? null
  const phone = resumeTextRaw.match(/\+?\d[\d\s().-]{8,}\d/)?.[0] ?? null
  const linkedIn = extractLinkedIn(resumeTextRaw)

  const generalLines = (general?.lines ?? []).map((l) => normalizeLine(l.text)).filter(Boolean)
  const name = generalLines[0] ?? ''
  const locationParts = generalLines
    .slice(1)
    .filter((l) => !email || !l.includes(email))
    .filter((l) => !phone || !l.includes(phone))
    .filter((l) => !/^https?:\/\//i.test(l))
    .slice(0, 2)

  const contactParts = [
    locationParts.join(', ').trim() || null,
    email,
    phone,
    linkedIn,
  ].filter(Boolean)

  const out: string[] = []
  if (name) out.push(name)
  if (contactParts.length > 0) out.push(contactParts.join(' | '))

  if (summary) {
    const raw = summary.lines.map((l) => cleanSummaryText(l.text)).join(' ')
    const compact = raw.replace(/\s+/g, ' ').trim()
    if (compact) {
      out.push('')
      out.push('Summary')
      out.push(compact)
    }
  }

  if (education) {
    const eduLines = education.lines.map((l) => normalizeLine(l.text)).filter(Boolean)
    if (eduLines.length > 0) {
      out.push('')
      out.push('Education')
      for (const l of eduLines) out.push(`- ${l}`)
    }
  }

  if (skills) {
    const skillLines = skills.lines.map((l) => normalizeLine(l.text)).filter(Boolean)
    if (skillLines.length > 0) {
      out.push('')
      out.push('Skills')
      for (const l of skillLines) {
        const t = l.replace(/^[-*•]\s+/, '')
        out.push(`- ${t}`)
      }
    }
  }

  if (experience) {
    const expLines = experience.lines.map((l) => bulletizeLine('Experience', l.text)).filter(Boolean)
    if (expLines.length > 0) {
      out.push('')
      out.push('Experience')
      out.push(...expLines)
    }
  }

  if (projects) {
    const projLines = projects.lines.map((l) => bulletizeLine('Projects', l.text)).filter(Boolean)
    if (projLines.length > 0) {
      out.push('')
      out.push('Projects')
      out.push(...projLines)
    }
  }

  if (interests) {
    const intLines = interests.lines.map((l) => normalizeLine(l.text)).filter(Boolean)
    const cleaned = intLines
      .map((l) => l.replace(/^[-*•\[]+\s*/g, '').replace(/\]$/g, ''))
      .filter((l) => l.length > 0)
    if (cleaned.length > 0) {
      out.push('')
      out.push('Interests')
      for (const l of cleaned) out.push(`- ${l}`)
    }
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

function normalizeLine(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}

function stemWord(w: string): string {
  if (w.length <= 3) return w
  if (w.endsWith('ies') && w.length > 4) return `${w.slice(0, -3)}y`
  if (w.endsWith('sses')) return w.slice(0, -2)
  if (w.endsWith('ing') && w.length > 6) return w.slice(0, -3)
  if (w.endsWith('ed') && w.length > 5) return w.slice(0, -2)
  if (w.endsWith('es') && w.length > 4) return w.slice(0, -2)
  if (w.endsWith('s') && w.length > 4) return w.slice(0, -1)
  return w
}

function tokenizeKeywords(text: string): string[] {
  const tokens = normalizeText(text)
    .replace(/[^a-z0-9+.#\s-]/g, ' ')
    .split(/\s+/g)
    .map((t) => t.trim())
    .filter(Boolean)
  return tokens
}

function buildBigrams(tokens: string[]): string[] {
  const out: string[] = []
  for (let i = 0; i < tokens.length - 1; i++) {
    const a = tokens[i]
    const b = tokens[i + 1]
    if (!a || !b) continue
    if (STOPWORDS.has(a) || STOPWORDS.has(b)) continue
    if (a.length < 3 || b.length < 3) continue
    out.push(`${a} ${b}`)
  }
  return out
}

function buildTrigrams(tokens: string[]): string[] {
  const out: string[] = []
  for (let i = 0; i < tokens.length - 2; i++) {
    const a = tokens[i]
    const b = tokens[i + 1]
    const c = tokens[i + 2]
    if (!a || !b || !c) continue
    if (STOPWORDS.has(a) || STOPWORDS.has(b) || STOPWORDS.has(c)) continue
    if (a.length < 3 || b.length < 3 || c.length < 3) continue
    out.push(`${a} ${b} ${c}`)
  }
  return out
}

function extractResumeKeywords(resumeRaw: string): string[] {
  const tokens = tokenizeKeywords(resumeRaw)
  const counts = new Map<string, number>()

  for (const t of tokens) {
    if (t.length < 2) continue
    if (STOPWORDS.has(t)) continue
    if (t.includes('@') || t.includes('/')) continue
    if (/(?:\.com|\.in|\.net|\.org|\.io|\.ai)$/.test(t)) continue
    if (/^\d+$/.test(t)) continue

    counts.set(t, (counts.get(t) ?? 0) + 1)
  }

  const bigrams = buildBigrams(tokens)
  for (const b of bigrams) {
    counts.set(b, (counts.get(b) ?? 0) + 1)
  }

  const trigrams = buildTrigrams(tokens)
  for (const t of trigrams) {
    counts.set(t, (counts.get(t) ?? 0) + 1)
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k)
    .slice(0, 60)
}

function splitLines(raw: string): string[] {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.replace(/\t/g, ' '))
    .map(normalizeLine)
    .filter((l) => l.length > 0)
}

function canonicalSectionName(s: string): string | null {
  const t = normalizeText(s)
  if (t.includes('work experience')) return 'Experience'
  if (t.includes('experience')) return 'Experience'
  if (t.includes('professional experience')) return 'Experience'
  if (t.includes('employment')) return 'Experience'
  if (t.includes('projects')) return 'Projects'
  if (t.includes('project')) return 'Projects'
  if (t.includes('skills')) return 'Skills'
  if (t.includes('tools')) return 'Skills'
  if (t.includes('technologies')) return 'Skills'
  if (t.includes('technology')) return 'Skills'
  if (t.includes('education')) return 'Education'
  if (t.includes('certifications') || t.includes('certification')) return 'Certifications'
  if (t.includes('summary') || t.includes('profile')) return 'Summary'
  if (t.includes('objective')) return 'Summary'
  if (t.includes('languages') || t === 'language') return 'Languages'
  if (t.includes('contact') || t.includes('personal details')) return 'General'
  if (t.includes('achievements')) return 'Achievements'
  if (t.includes('hobbies') || t.includes('interests')) return 'Interests'
  return null
}

function detectSectionHeading(line: string): string | null {
  const l = normalizeLine(line)
  const headingCandidate = l
    .replace(/^\s*(?:[-*•]+\s*)?/, '')
    .replace(/^[#*_\[\]()]+/g, '')
    .replace(/[#*_\[\]()]+$/g, '')
    .replace(/:+$/g, '')
    .trim()
  if (!headingCandidate) return null

  const lower = headingCandidate.toLowerCase()

  const known = [
    'summary',
    'profile',
    'objective',
    'skills',
    'technical skills',
    'tools',
    'technologies',
    'technology',
    'experience',
    'work experience',
    'professional experience',
    'employment',
    'projects',
    'project',
    'education',
    'certifications',
    'certification',
    'achievements',
    'languages',
    'language',
    'hobbies',
    'hobbies and interests',
    'interests',
    'contact',
    'personal details',
  ]

  const isKnown = known.some((k) => lower === k || lower.startsWith(`${k} `) || lower.startsWith(`${k}:`))
  const looksLikeHeading =
    headingCandidate.length <= 40 &&
    (isKnown || (/^[A-Z][A-Z\s&/.-]{2,}$/.test(headingCandidate) && !/[0-9]/.test(headingCandidate)) || /:$/.test(l))

  if (!looksLikeHeading) return null

  const canonical = canonicalSectionName(headingCandidate)
  return canonical
}

function isBulletLine(line: string): boolean {
  return /^(?:[-*•]\s+|\d+[.)]\s+)/.test(line)
}

function looksLikeBulletCandidate(section: string, line: string): boolean {
  if (section !== 'Experience' && section !== 'Projects') return false
  const t = normalizeLine(line)
  if (t.length < 10 || t.length > 180) return false
  if (isBulletLine(t)) return true

  return /^(worked|managed|coordinated|delivered|supported|developed|built|led|created|implemented|maintained|handled|owned|improved)\b/i.test(t)
}

function hasMetric(line: string): boolean {
  return /\b\d+(?:[.,]\d+)?\b/.test(line) || /%/.test(line)
}

function extractEmail(raw: string): boolean {
  return /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(raw)
}

function extractPhone(raw: string): boolean {
  return /\+?\d[\d\s().-]{8,}\d/.test(raw)
}

function suggestRewrite(
  originalLine: string,
  section: string,
  issues: string[],
  suggestedKeywords: string[],
  treatAsBullet: boolean
): string | null {
  const trimmed = originalLine.trim()
  const bulletMatch = trimmed.match(/^(?:[-*•]\s+|\d+[.)]\s+)/)
  const hasBullet = Boolean(bulletMatch)
  const prefix = bulletMatch ? bulletMatch[0] : treatAsBullet ? '- ' : ''
  let body = bulletMatch ? trimmed.slice(prefix.length).trim() : trimmed

  body = body.replace(/\bresponsible for\b\s*/i, 'Managed ')
  body = body.replace(/\bworked on\b\s*/i, 'Delivered ')
  body = body.replace(/\bwork on\b\s*/i, 'Deliver ')
  body = body.replace(/\bhelped\b\s*/i, 'Improved ')
  body = body.replace(/\bassist(?:ed)?\b\s*/i, 'Supported ')

  if (issues.some((i) => i.toLowerCase().includes('metric')) && !hasMetric(originalLine)) {
    body = `${body} (Impact: [add metric like 20% / 5+ / $10K])`
  }

  const kws = suggestedKeywords.filter(Boolean)
  if (kws.length > 0 && (section === 'Experience' || section === 'Projects') && (hasBullet || treatAsBullet)) {
    const top = kws.slice(0, 3).join(', ')
    if (!body.toLowerCase().includes(kws[0].toLowerCase())) {
      body = `${body} (Keywords: ${top})`
    }
  }

  if (issues.some((i) => i.toLowerCase().includes('long')) && body.length > 170) {
    body = `${body.slice(0, 170).trimEnd()}…`
  }

  const rewritten = `${prefix}${body}`.trim()
  if (!rewritten || rewritten === trimmed) return null
  return rewritten
}

function buildSuggestedAdditions(missing: string[]): {
  summary: string[]
  experienceBullets: string[]
  skills: string[]
} {
  const uniq = Array.from(new Set(missing))

  const has = (s: string) => uniq.includes(s)
  const pickFirst = (candidates: string[]) => candidates.find((c) => has(c))

  const booking = pickFirst(['booking management', 'booking', 'bookings'])
  const travel = pickFirst(['travel operations', 'travel booking', 'travel'])
  const customer = pickFirst(['customer support', 'customer', 'service'])
  const supplier = pickFirst(['supplier coordination', 'suppliers', 'supplier'])
  const ota = pickFirst(['ota', 'operations ota', 'ota operations'])
  const reporting = pickFirst(['reporting', 'dashboards', 'mis'])
  const tools = pickFirst(['google sheets', 'sheets', 'excel', 'crm'])

  const summary: string[] = []
  if (travel || booking) {
    summary.push(
      `Operations professional with exposure to ${[travel, booking].filter(Boolean).join(' and ')} and a focus on accuracy and turnaround time.`
    )
  }
  if (customer || supplier || ota) {
    summary.push(
      `Comfortable coordinating across stakeholders${customer ? ' (customers)' : ''}${supplier ? ' and suppliers' : ''}${
        ota ? ' and working with OTAs' : ''
      }.`
    )
  }

  const experienceBullets: string[] = []
  experienceBullets.push(
    `- Managed ${[booking ?? 'bookings', travel ?? 'travel requests'].filter(Boolean).join(' / ')} end-to-end: confirmations, vouchers, and timely updates to stakeholders. (Impact: [add metric])`
  )
  if (supplier || customer) {
    experienceBullets.push(
      `- Coordinated with ${supplier ? 'suppliers' : 'partners'} and ${customer ? 'customers' : 'internal teams'} to resolve issues and ensure smooth service delivery. (Impact: [add metric])`
    )
  }
  if (reporting || tools) {
    experienceBullets.push(
      `- Maintained daily MIS / reporting using ${tools ? tools : 'Excel/Google Sheets'} and tracked operational metrics on dashboards for continuous improvements. (Impact: [add metric])`
    )
  }

  const skills: string[] = []
  const toolsList = [
    has('excel') ? 'Excel' : null,
    has('google sheets') || has('sheets') ? 'Google Sheets' : null,
    has('crm') ? 'CRM' : null,
    has('dashboards') ? 'Dashboards' : null,
    has('reporting') ? 'Reporting' : null,
    has('mis') ? 'MIS' : null,
  ].filter(Boolean)
  if (toolsList.length > 0) {
    skills.push(`- Tools: ${toolsList.join(', ')}`)
  }
  if (ota) {
    skills.push(`- Platforms: OTA portals (as applicable)`)
  }
  if (booking || customer || supplier) {
    skills.push(`- Operations: ${[booking, customer, supplier].filter(Boolean).join(', ')}`)
  }

  return { summary, experienceBullets, skills }
}

function shouldSuggestKeywordsForSection(section: string): boolean {
  return section === 'Experience' || section === 'Projects'
}

function isToolKeyword(k: string): boolean {
  return (
    /^(excel|sheet|sheets|google|crm|reporting|tools|tool|dashboard|dashboards|sql|tableau|power|bi|jira|salesforce|hubspot|zendesk|sap)$/.test(
      k
    ) ||
    k.includes('crm')
  )
}

function isOpsKeyword(k: string): boolean {
  return /(operations?|booking|bookings|travel|supplier|suppliers|customer|support|service|coordination|vouchers|confirmations|tours|activities|sightseeing|ota|vendor|delivery|pricing|maintain|issues|end-to-end)/.test(
    k
  )
}

function relevantKeywordsForSection(section: string, allKeywords: string[]): string[] {
  if (section === 'Education' || section === 'Languages' || section === 'General') return []

  if (section === 'Skills') {
    const tools = allKeywords.filter((k) => {
      if (k.includes(' ')) {
        return k.split(' ').some((part) => isToolKeyword(part)) || isToolKeyword(k)
      }
      return isToolKeyword(k)
    })

    const platforms = allKeywords.filter((k) => /\bota\b/.test(k))
    return [...tools, ...platforms]
  }

  if (section === 'Summary') {
    const roleAndDomain = allKeywords.filter((k) => isOpsKeyword(k) || /associate/.test(k))
    const tools = allKeywords.filter((k) => isToolKeyword(k)).slice(0, 4)
    return [...roleAndDomain, ...tools]
  }

  // Experience / Projects
  return allKeywords.filter((k) => {
    if (k.includes(' ')) {
      const parts = k.split(' ')
      const hasTool = parts.some((p) => isToolKeyword(p)) || isToolKeyword(k)
      if (hasTool) return false
    }
    if (isToolKeyword(k)) return false
    return isOpsKeyword(k) || /associate/.test(k)
  })
}

function pickSuggestedKeywords(section: string, missing: string[], normalizedLine: string): string[] {
  let pool = missing.filter((k) => !normalizedLine.includes(k))

  if (section === 'Skills') {
    pool = pool.filter(isToolKeyword)
  } else if (section === 'Experience' || section === 'Projects') {
    pool = pool.filter((k) => !isToolKeyword(k))
  }

  const max = section === 'Skills' ? 6 : 3
  return pool.slice(0, max)
}

export type LineFeedback = {
  lineNumber: number
  section: string
  text: string
  issues: string[]
  suggestedKeywords: string[]
  suggestedRewrite: string | null
}

export type SectionBreakdown = {
  name: string
  startLine: number
  endLine: number
  matchedKeywords: string[]
  missingKeywords: string[]
  issues: string[]
  lines: LineFeedback[]
}

function extractKeywords(jobDescription: string): string[] {
  const tokens = tokenizeKeywords(jobDescription)

  const counts = new Map<string, number>()
  for (const t of tokens) {
    if (t.length < 3) continue
    if (STOPWORDS.has(t)) continue

    // Filter out URLs/domains and very noisy tokens
    if (/\bhttps?\b/.test(t)) continue
    if (t.includes('@') || t.includes('/')) continue
    if (/(?:\.com|\.in|\.net|\.org|\.io|\.ai)$/.test(t)) continue

    counts.set(t, (counts.get(t) ?? 0) + 1)
  }

  const bigrams = buildBigrams(tokens)
  for (const b of bigrams) {
    counts.set(b, (counts.get(b) ?? 0) + 1)
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k)
    .slice(0, 60)
}

export type AtsResult = {
  score: number
  matchedKeywords: string[]
  missingKeywords: string[]
  tips: string[]
  sections: SectionBreakdown[]
  resumeKeywords: string[]
  jobKeywords: string[]
  correctedResume: string
  suggestedAdditions: {
    summary: string[]
    experienceBullets: string[]
    skills: string[]
  }
}

export function scoreResume(resumeTextRaw: string, jobDescriptionRaw: string): AtsResult {
  const resumeText = normalizeText(resumeTextRaw)
  const jobDescription = normalizeText(jobDescriptionRaw)

  const resumeKeywords = extractResumeKeywords(resumeTextRaw)
  const resumeTokenSet = new Set(tokenizeKeywords(resumeTextRaw))
  const resumeStemSet = new Set([...resumeTokenSet].map(stemWord))
  const resumeTextNorm = normalizeText(resumeTextRaw)

  const keywords = extractKeywords(jobDescription)
  const matched = keywords.filter((k) => {
    if (k.includes(' ')) return resumeTextNorm.includes(k)
    if (resumeTokenSet.has(k)) return true
    if (resumeStemSet.has(stemWord(k))) return true
    return resumeText.includes(k)
  })
  const missing = keywords.filter((k) => !matched.includes(k))

  const keywordScore = keywords.length === 0 ? 0 : matched.length / keywords.length

  const hasSkills = resumeText.includes('skills')
  const hasExperience = resumeText.includes('experience') || resumeText.includes('work experience')
  const hasEducation = resumeText.includes('education')

  const structureBonus = [hasSkills, hasExperience, hasEducation].filter(Boolean).length / 3

  const lengthPenalty = resumeText.length < 1200 ? 0.15 : 0

  let score = Math.round((keywordScore * 0.8 + structureBonus * 0.2 - lengthPenalty) * 100)
  score = Math.max(0, Math.min(100, score))

  const tips: string[] = []

  if (missing.length > 0) {
    tips.push(`Add relevant keywords: ${missing.slice(0, 12).join(', ')}${missing.length > 12 ? '…' : ''}`)
  }
  if (!hasSkills) tips.push('Add a clearly labeled “Skills” section.')
  if (!hasExperience) tips.push('Add a clearly labeled “Experience” section with role titles and impact bullets.')
  if (!hasEducation) tips.push('Add an “Education” section (even if minimal).')
  if (resumeText.length < 1200) tips.push('Your resume content looks short; add measurable achievements and relevant details.')
  if (/[|]{3,}/.test(resumeTextRaw)) tips.push('Avoid complex tables/columns; ATS can misread multi-column layouts.')

  if (!extractEmail(resumeTextRaw)) tips.push('Add a professional email address in your header.')
  if (!extractPhone(resumeTextRaw)) tips.push('Add a phone number in your header.')

  const rawLines = splitLines(resumeTextRaw)
  const sections: SectionBreakdown[] = []

  let current: SectionBreakdown = {
    name: 'General',
    startLine: 1,
    endLine: 1,
    matchedKeywords: [],
    missingKeywords: [],
    issues: [],
    lines: [],
  }

  function pushCurrent() {
    if (current.lines.length === 0 && current.name === 'General') return
    current.endLine = Math.max(current.startLine, current.endLine)
    sections.push(current)
  }

  for (let i = 0; i < rawLines.length; i++) {
    const lineNumber = i + 1
    const line = rawLines[i]
    const heading = detectSectionHeading(line)

    if (heading) {
      current.endLine = lineNumber - 1
      pushCurrent()
      current = {
        name: heading,
        startLine: lineNumber,
        endLine: lineNumber,
        matchedKeywords: [],
        missingKeywords: [],
        issues: [],
        lines: [],
      }
      continue
    }

    current.endLine = lineNumber

    const issues: string[] = []
    const normalized = normalizeText(line)

    if (line.length > 180) issues.push('This line is long; split it into shorter bullets for ATS readability.')
    if (/\bresponsible for\b|\bworked on\b|\bhelped\b/i.test(line)) {
      issues.push('Use stronger action verbs and focus on outcomes (what changed because of your work).')
    }

    const bulletCandidate = looksLikeBulletCandidate(current.name, line)
    if ((current.name === 'Experience' || current.name === 'Projects') && bulletCandidate && !isBulletLine(line)) {
      issues.push('Convert this into a bullet point for ATS readability.')
    }

    if ((current.name === 'Experience' || current.name === 'Projects') && bulletCandidate && !hasMetric(line)) {
      issues.push('Add a metric (%, $, time, scale) to quantify impact for this bullet.')
    }

    const suggestedKeywords: string[] = []
    if (missing.length > 0 && shouldSuggestKeywordsForSection(current.name) && bulletCandidate) {
      suggestedKeywords.push(...pickSuggestedKeywords(current.name, missing, normalized))
    }

    const suggestedRewrite =
      issues.length > 0 || suggestedKeywords.length > 0
        ? suggestRewrite(line, current.name, issues, suggestedKeywords, bulletCandidate)
        : null

    const isUsefulLine = line.length >= 3
    if (isUsefulLine) {
      current.lines.push({
        lineNumber,
        section: current.name,
        text: line,
        issues,
        suggestedKeywords,
        suggestedRewrite,
      })
    }
  }

  pushCurrent()

  for (const s of sections) {
    const sectionText = normalizeText(s.lines.map((l) => l.text).join(' '))
    const relevant = relevantKeywordsForSection(s.name, keywords)
    s.matchedKeywords = relevant.filter((k) => sectionText.includes(k))
    s.missingKeywords = relevant.filter((k) => !sectionText.includes(k)).slice(0, 20)

    const sectionIssues: string[] = []
    if (s.name === 'Experience' || s.name === 'Projects') {
      const hasAnyBullets = s.lines.some((l) => isBulletLine(l.text))
      if (!hasAnyBullets) sectionIssues.push('Add bullet points (2–5) with responsibilities + outcomes for ATS readability.')

      const hasAnyMetrics = s.lines.some((l) => hasMetric(l.text))
      if (!hasAnyMetrics) sectionIssues.push('Add metrics to at least 1–2 bullets (%, $, time saved, scale).')

      if (s.matchedKeywords.length === 0 && s.missingKeywords.length > 0) {
        sectionIssues.push('This section does not mention job-relevant keywords; tailor it to the target role (only if accurate).')
      }
    }

    if (s.name === 'Skills') {
      if (s.missingKeywords.length > 0) sectionIssues.push('If you have these tools/platforms, add them to Skills for ATS matching.')
    }

    if (s.name === 'Summary') {
      if (s.missingKeywords.length > 0) sectionIssues.push('Tailor Summary to the target role domain (operations) and mention 2–4 relevant keywords naturally.')
    }

    s.issues = sectionIssues
  }

  const correctedResume = sections
    .map((s) => s) // keep sections stable for draft builder
    .filter(Boolean)
    .length
    ? buildImprovedResumeDraft(
        sections.map((s) => ({
          ...s,
          lines: s.lines.map((l) => ({ ...l, text: l.suggestedRewrite ?? l.text })),
        })),
        resumeTextRaw
      )
    : ''

  const suggestedAdditions = buildSuggestedAdditions(missing)

  return {
    score,
    matchedKeywords: matched,
    missingKeywords: missing,
    tips,
    sections,
    resumeKeywords,
    jobKeywords: keywords,
    correctedResume,
    suggestedAdditions,
  }
}
