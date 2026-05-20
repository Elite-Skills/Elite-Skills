/**
 * Client-side validation and normalization before API calls.
 * Aligns with server rules in this project where possible.
 */

const MAX_NAME_LENGTH = 100
const MAX_EMAIL_LENGTH = 254
const MAX_PASSWORD_LENGTH = 128
const MIN_PASSWORD_LENGTH = 6

const CONTACT_MESSAGE_MAX = 5000
const JOB_DESCRIPTION_MAX = 200_000
const SCAN_RESUME_MAX_BYTES = 5 * 1024 * 1024

const BOARDROOM_MESSAGE_MAX = 12_000
const BOARDROOM_HISTORY_MAX_TURNS = 40
const BOARDROOM_HISTORY_TEXT_MAX = 32_000

const STRATEGY_BANK_MAX = 200

const BLOG_TITLE_MAX = 500
const BLOG_CONTENT_MAX = 500_000
const BLOG_EXCERPT_MAX = 300
const BLOG_META_TITLE_MAX = 70
const BLOG_META_DESCRIPTION_MAX = 160
const BLOG_MEDIA_URL_MAX = 30
const BLOG_MEDIA_URL_LENGTH = 2000

const PROFILE_LINE_MAX = 20_000
const PROFILE_HEADLINE_MAX = 500
const PROFILE_ITEM_TITLE_MAX = 500
const PROFILE_LIST_MAX_ITEMS = 100
const PROFILE_PHONE_MAX = 80
const PROFILE_LINKEDIN_MAX = 2000

const REFERRAL_FIELD_MAX = 20_000
const REFERRAL_TAGS_MAX = 50
const REFERRAL_TAG_LENGTH = 80
const REFERRAL_QUESTIONS_MAX = 30
const REFERRAL_QUESTION_LENGTH = 2000

const RECOMMENDATION_MAX = 10_000

const LIST_QUERY_MAX = 100

const OBJECT_ID_RE = /^[a-f0-9]{24}$/i

function hasDangerousChars(str: string): boolean {
  return /[\x00]/.test(str) || str.includes('$') || str.includes('..')
}

/** Strip nulls, other C0 controls (except TAB/LF), normalize newlines — use before length limits. */
function removeNullBytes(str: string): string {
  return String(str ?? '')
    .replace(/\0/g, '')
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\u2028/g, '\n')
    .replace(/\u2029/g, '\n')
}

function cleanLine(input: unknown, maxLen: number): string {
  return removeNullBytes(String(input ?? '').trim()).slice(0, maxLen)
}

function cleanOptionalLine(input: unknown, maxLen: number): string | undefined {
  if (input === undefined) return undefined
  const s = removeNullBytes(String(input ?? '').trim()).slice(0, maxLen)
  return s === '' ? undefined : s
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizeRegisterPayload(body: {
  name: string
  email: string
  password: string
  passwordConfirm: string
}): { name: string; email: string; password: string; passwordConfirm: string } {
  const name = String(body?.name ?? '').trim()
  const email = String(body?.email ?? '').trim().toLowerCase()
  const password = String(body?.password ?? '')
  const passwordConfirm = String(body?.passwordConfirm ?? '')

  if (!name || !email || !password) {
    throw new Error('Missing fields')
  }
  if (password !== passwordConfirm) {
    throw new Error('Passwords do not match')
  }
  if (name.length > MAX_NAME_LENGTH) {
    throw new Error('Name too long')
  }
  if (email.length > MAX_EMAIL_LENGTH) {
    throw new Error('Email too long')
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error('Password must be at least 6 characters')
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    throw new Error('Password too long')
  }
  if (hasDangerousChars(name) || hasDangerousChars(email)) {
    throw new Error('Invalid characters in input')
  }
  if (!EMAIL_REGEX.test(email)) {
    throw new Error('Invalid email format')
  }

  return { name, email, password, passwordConfirm }
}

export function normalizeLoginPayload(body: { email: string; password: string }): { email: string; password: string } {
  const email = String(body?.email ?? '').trim().toLowerCase()
  const password = String(body?.password ?? '')

  if (!email || !password) {
    throw new Error('Missing fields')
  }
  if (email.length > MAX_EMAIL_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    throw new Error('Invalid input')
  }
  if (hasDangerousChars(email)) {
    throw new Error('Invalid characters in input')
  }

  return { email, password }
}

export function normalizeContactPayload(body: { name: string; email: string; message: string }): {
  name: string
  email: string
  message: string
} {
  const name = cleanLine(body?.name, MAX_NAME_LENGTH)
  const email = String(body?.email ?? '').trim().toLowerCase().slice(0, MAX_EMAIL_LENGTH)
  const message = removeNullBytes(String(body?.message ?? '').trim())

  if (!name || !email || !message) {
    throw new Error('name, email, and message are required')
  }
  if (message.length > CONTACT_MESSAGE_MAX) {
    throw new Error('Message is too long')
  }
  if (!EMAIL_REGEX.test(email)) {
    throw new Error('Invalid email format')
  }
  if (hasDangerousChars(name) || hasDangerousChars(email)) {
    throw new Error('Invalid characters in input')
  }

  return { name, email, message }
}

export function normalizeScanPayload(body: { resume: File; jobDescription: string }): { resume: File; jobDescription: string } {
  const resume = body?.resume
  if (!(resume instanceof File)) {
    throw new Error('resume PDF is required')
  }
  if (resume.type !== 'application/pdf') {
    throw new Error('Only PDF files are supported')
  }
  if (resume.size > SCAN_RESUME_MAX_BYTES) {
    throw new Error('Resume file is too large (max 5 MB)')
  }

  const jobDescription = removeNullBytes(String(body?.jobDescription ?? '').trim()).slice(0, JOB_DESCRIPTION_MAX)
  if (!jobDescription) {
    throw new Error('jobDescription is required')
  }

  return { resume, jobDescription }
}

export function normalizeReferralCreatePayload(body: {
  company: string
  roleTitle: string
  location?: string
  jobLink?: string
  referralType?: string
  description: string
  tags?: string[]
  questions?: string[]
}): typeof body {
  const company = cleanLine(body?.company, REFERRAL_FIELD_MAX)
  const roleTitle = cleanLine(body?.roleTitle, REFERRAL_FIELD_MAX)
  const description = removeNullBytes(String(body?.description ?? '').trim()).slice(0, REFERRAL_FIELD_MAX)
  const location = cleanLine(body?.location, REFERRAL_FIELD_MAX)
  const jobLink = cleanLine(body?.jobLink, REFERRAL_FIELD_MAX)
  const referralType = cleanLine(body?.referralType, 120) || 'referral'

  if (!company || !roleTitle || !description) {
    throw new Error('company, roleTitle, description are required')
  }

  const tags = Array.isArray(body?.tags)
    ? body.tags
        .map((t) => cleanLine(t, REFERRAL_TAG_LENGTH).toLowerCase())
        .filter(Boolean)
        .slice(0, REFERRAL_TAGS_MAX)
    : []

  const questions = Array.isArray(body?.questions)
    ? body.questions
        .map((q) => removeNullBytes(String(q ?? '').trim()).slice(0, REFERRAL_QUESTION_LENGTH))
        .filter(Boolean)
        .slice(0, REFERRAL_QUESTIONS_MAX)
    : []

  return { company, roleTitle, location, jobLink, referralType, description, tags, questions }
}

export function normalizeProfileUpdatePayload(payload: {
  cvName?: string
  headline?: string
  professionalSummary?: string
  experience?: { title: string; description: string }[]
  projects?: { title: string; description: string }[]
  education?: string[]
  additionalInfo?: string[]
  connectionQuestions?: string[]
  contact?: { email?: string; phone?: string; linkedIn?: string }
  visibility?: { showEmail?: boolean; showPhone?: boolean; showLinkedIn?: boolean }
}): typeof payload {
  const out: typeof payload = {}

  if (payload.cvName !== undefined) {
    out.cvName = cleanLine(payload.cvName, MAX_NAME_LENGTH)
  }
  if (payload.headline !== undefined) {
    out.headline = cleanLine(payload.headline, PROFILE_HEADLINE_MAX)
  }
  if (payload.professionalSummary !== undefined) {
    out.professionalSummary = removeNullBytes(String(payload.professionalSummary ?? '').trim()).slice(0, PROFILE_LINE_MAX)
  }

  if (payload.experience !== undefined) {
    if (!Array.isArray(payload.experience)) throw new Error('Invalid experience')
    out.experience = payload.experience.slice(0, PROFILE_LIST_MAX_ITEMS).map((item) => ({
      title: cleanLine(item?.title, PROFILE_ITEM_TITLE_MAX),
      description: removeNullBytes(String(item?.description ?? '').trim()).slice(0, PROFILE_LINE_MAX),
    }))
  }

  if (payload.projects !== undefined) {
    if (!Array.isArray(payload.projects)) throw new Error('Invalid projects')
    out.projects = payload.projects.slice(0, PROFILE_LIST_MAX_ITEMS).map((item) => ({
      title: cleanLine(item?.title, PROFILE_ITEM_TITLE_MAX),
      description: removeNullBytes(String(item?.description ?? '').trim()).slice(0, PROFILE_LINE_MAX),
    }))
  }

  if (payload.education !== undefined) {
    if (!Array.isArray(payload.education)) throw new Error('Invalid education')
    out.education = payload.education
      .map((s) => removeNullBytes(String(s ?? '').trim()).slice(0, PROFILE_LINE_MAX))
      .filter(Boolean)
      .slice(0, PROFILE_LIST_MAX_ITEMS)
  }

  if (payload.additionalInfo !== undefined) {
    if (!Array.isArray(payload.additionalInfo)) throw new Error('Invalid additionalInfo')
    out.additionalInfo = payload.additionalInfo
      .map((s) => removeNullBytes(String(s ?? '').trim()).slice(0, PROFILE_LINE_MAX))
      .filter(Boolean)
      .slice(0, PROFILE_LIST_MAX_ITEMS)
  }

  if (payload.connectionQuestions !== undefined) {
    if (!Array.isArray(payload.connectionQuestions)) throw new Error('Invalid connectionQuestions')
    out.connectionQuestions = payload.connectionQuestions
      .map((s) => removeNullBytes(String(s ?? '').trim()).slice(0, PROFILE_LINE_MAX))
      .filter(Boolean)
      .slice(0, PROFILE_LIST_MAX_ITEMS)
  }

  if (payload.contact !== undefined) {
    const c = payload.contact
    if (!c || typeof c !== 'object') throw new Error('Invalid contact')
    out.contact = {
      email:
        c.email !== undefined
          ? removeNullBytes(String(c.email ?? '').trim()).slice(0, MAX_EMAIL_LENGTH)
          : undefined,
      phone: c.phone !== undefined ? cleanLine(c.phone, PROFILE_PHONE_MAX) : undefined,
      linkedIn: c.linkedIn !== undefined ? cleanLine(c.linkedIn, PROFILE_LINKEDIN_MAX) : undefined,
    }
  }

  if (payload.visibility !== undefined) {
    const v = payload.visibility
    if (!v || typeof v !== 'object') throw new Error('Invalid visibility')
    out.visibility = {
      showEmail: v.showEmail !== undefined ? Boolean(v.showEmail) : undefined,
      showPhone: v.showPhone !== undefined ? Boolean(v.showPhone) : undefined,
      showLinkedIn: v.showLinkedIn !== undefined ? Boolean(v.showLinkedIn) : undefined,
    }
  }

  return out
}

export function normalizeRecommendText(text: string): string {
  const t = removeNullBytes(String(text ?? '').trim()).slice(0, RECOMMENDATION_MAX)
  if (!t) {
    throw new Error('text is required')
  }
  return t
}

export function normalizeConnectionRequestPayload(body: {
  postId?: string
  toUserId?: string
  questionAnswers: { question: string; answer: string }[]
}): typeof body {
  const postId = String(body?.postId ?? '').trim()
  const toUserId = String(body?.toUserId ?? '').trim()

  if (!Array.isArray(body?.questionAnswers)) {
    throw new Error('questionAnswers must be an array')
  }

  if (postId && !OBJECT_ID_RE.test(postId)) {
    throw new Error('Invalid post id')
  }
  if (toUserId && !OBJECT_ID_RE.test(toUserId)) {
    throw new Error('Invalid user id')
  }

  const questionAnswers = body.questionAnswers
    .map((x) => ({
      question: removeNullBytes(String(x?.question ?? '').trim()).slice(0, PROFILE_LINE_MAX),
      answer: removeNullBytes(String(x?.answer ?? '').trim()).slice(0, PROFILE_LINE_MAX),
    }))
    .filter((x) => x.question && x.answer)

  return {
    postId: postId || undefined,
    toUserId: toUserId || undefined,
    questionAnswers,
  }
}

export function normalizeBoardroomPayload(payload: {
  userMessage: string
  history: { role: string; text: string }[]
}): { userMessage: string; history: { role: string; text: string }[] } {
  const userMessage = removeNullBytes(String(payload?.userMessage ?? '').trim()).slice(0, BOARDROOM_MESSAGE_MAX)
  if (!userMessage) {
    throw new Error('Invalid request: userMessage and history required')
  }

  if (!Array.isArray(payload?.history)) {
    throw new Error('Invalid request: userMessage and history required')
  }

  const history = payload.history
    .slice(-BOARDROOM_HISTORY_MAX_TURNS)
    .map((h) => {
      const roleRaw = String(h?.role ?? '').trim()
      const role = roleRaw === 'user' ? 'user' : 'model'
      const text = removeNullBytes(String(h?.text ?? '').trim()).slice(0, BOARDROOM_HISTORY_TEXT_MAX)
      return { role, text }
    })
    .filter((h) => h.text.length > 0)

  return { userMessage, history }
}

export function normalizeStrategyBank(bank: string): string {
  const b = removeNullBytes(String(bank ?? '').trim()).slice(0, STRATEGY_BANK_MAX)
  if (!b) {
    throw new Error('Invalid request: bank required')
  }
  return b
}

export function normalizeBlogCreatePayload(payload: {
  title: string
  content: string
  excerpt?: string
  metaTitle?: string
  metaDescription?: string
  mediaUrls?: string[]
  status?: 'draft' | 'published'
}): typeof payload {
  const title = cleanLine(payload?.title, BLOG_TITLE_MAX)
  const content = removeNullBytes(String(payload?.content ?? '').trim()).slice(0, BLOG_CONTENT_MAX)
  if (!title) {
    throw new Error('title is required')
  }

  const excerpt = cleanOptionalLine(payload?.excerpt, BLOG_EXCERPT_MAX)
  const metaTitle = cleanOptionalLine(payload?.metaTitle, BLOG_META_TITLE_MAX)
  const metaDescription = cleanOptionalLine(payload?.metaDescription, BLOG_META_DESCRIPTION_MAX)

  const mediaUrls = normalizeMediaUrlList(payload?.mediaUrls)

  const status = payload?.status === 'published' ? 'published' : 'draft'

  return { title, content, excerpt, metaTitle, metaDescription, mediaUrls, status }
}

export function normalizeBlogUpdatePayload(payload: {
  title?: string
  content?: string
  excerpt?: string
  metaTitle?: string
  metaDescription?: string
  mediaUrls?: string[]
  status?: 'draft' | 'published'
}): typeof payload {
  const out: typeof payload = {}

  if (payload.title !== undefined) {
    out.title = cleanLine(payload.title, BLOG_TITLE_MAX)
  }
  if (payload.content !== undefined) {
    out.content = removeNullBytes(String(payload.content ?? '').trim()).slice(0, BLOG_CONTENT_MAX)
  }
  if (payload.excerpt !== undefined) {
    out.excerpt = cleanLine(payload.excerpt, BLOG_EXCERPT_MAX)
  }
  if (payload.metaTitle !== undefined) {
    out.metaTitle = cleanLine(payload.metaTitle, BLOG_META_TITLE_MAX)
  }
  if (payload.metaDescription !== undefined) {
    out.metaDescription = cleanLine(payload.metaDescription, BLOG_META_DESCRIPTION_MAX)
  }
  if (payload.mediaUrls !== undefined) {
    out.mediaUrls = normalizeMediaUrlList(payload.mediaUrls)
  }
  if (payload.status !== undefined) {
    out.status = payload.status === 'published' ? 'published' : 'draft'
  }

  return out
}

function normalizeMediaUrlList(urls: unknown): string[] {
  if (!Array.isArray(urls)) return []
  const out: string[] = []
  for (const u of urls.slice(0, BLOG_MEDIA_URL_MAX)) {
    const s = removeNullBytes(String(u ?? '').trim()).slice(0, BLOG_MEDIA_URL_LENGTH)
    if (!s) continue
    try {
      const parsed = new URL(s)
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        out.push(s)
      }
    } catch {
      /* skip invalid */
    }
  }
  return out
}

export function normalizeListReferralsQuery(payload?: { q?: string; tag?: string; limit?: number }): {
  q?: string
  tag?: string
  limit?: number
} {
  if (!payload) return {}
  const q = payload.q !== undefined ? cleanLine(payload.q, LIST_QUERY_MAX).toLowerCase() : undefined
  const tag = payload.tag !== undefined ? cleanLine(payload.tag, LIST_QUERY_MAX).toLowerCase() : undefined
  const limit =
    payload.limit !== undefined
      ? Math.min(50, Math.max(1, Math.floor(Number(payload.limit)) || 20))
      : undefined
  if (!q && !tag && limit === undefined) return {}
  return { ...(q ? { q } : {}), ...(tag ? { tag } : {}), ...(limit !== undefined ? { limit } : {}) }
}

export function normalizeListBlogsQuery(params?: { q?: string; limit?: number }): { q?: string; limit?: number } {
  if (!params) return {}
  const q = params.q !== undefined ? cleanLine(params.q, LIST_QUERY_MAX) : undefined
  const limit =
    params.limit !== undefined
      ? Math.min(50, Math.max(1, Math.floor(Number(params.limit)) || 12))
      : undefined
  if (!q && limit === undefined) return {}
  return { ...(q ? { q } : {}), ...(limit !== undefined ? { limit } : {}) }
}

export function normalizeListNotificationsQuery(payload?: { unreadOnly?: boolean; limit?: number }): {
  unreadOnly: boolean
  limit: number
} {
  const unreadOnly = Boolean(payload?.unreadOnly)
  const raw = payload?.limit
  const n = typeof raw === 'number' ? raw : Number(raw)
  const limit = Math.min(100, Math.max(1, Number.isFinite(n) ? Math.floor(n) : 30))
  return { unreadOnly, limit }
}

export function normalizeChatMessageLimit(limit: number): number {
  const n = Number.isFinite(limit) ? Math.floor(limit) : 50
  return Math.min(100, Math.max(1, n))
}

export function assertMongoId(id: string, label = 'id'): void {
  const s = String(id ?? '').trim()
  if (!OBJECT_ID_RE.test(s)) {
    throw new Error(`Invalid ${label}`)
  }
}
