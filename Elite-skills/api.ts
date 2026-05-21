import { apiCacheClear, apiCacheGet, apiCacheInvalidatePrefix, apiCacheSet } from './lib/apiCache'
import { consumeClientRateLimit } from './lib/clientRateLimit'
import { FREE_BOARDROOM_AI_MESSAGES, normalizePlanTier, planLabel, type PlanTier } from './lib/planLimits'
import {
  assertMongoId,
  normalizeBlogCreatePayload,
  normalizeBlogUpdatePayload,
  normalizeBoardroomPayload,
  normalizeConnectionRequestPayload,
  normalizeContactPayload,
  normalizeListBlogsQuery,
  normalizeListNotificationsQuery,
  normalizeListReferralsQuery,
  normalizeChatMessageLimit,
  normalizeLoginPayload,
  normalizeProfileUpdatePayload,
  normalizeRecommendText,
  normalizeReferralCreatePayload,
  normalizeRegisterPayload,
  normalizeScanPayload,
  normalizeStrategyBank,
} from './lib/clientInput'

const PROD_FALLBACK_BASE = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000'

export const API_BASE =
  import.meta.env.VITE_API_BASE ?? (import.meta.env.DEV ? 'http://localhost:5000' : PROD_FALLBACK_BASE)

export type AccountPlan = PlanTier

export type AuthUser = {
  id: string
  name: string
  email: string
  isAdmin?: boolean
  canCreateReferral?: boolean
  plan: AccountPlan
  planLabel?: string
  boardroomRemaining?: number | null
  scansRemaining?: number | null
  strategyRemaining?: number | null
}

/** Ensures plan fields are normalized (defaults for older API responses). */
export function normalizeAuthUser(
  user: Pick<AuthUser, 'id' | 'name' | 'email'> & Partial<Omit<AuthUser, 'id' | 'name' | 'email'>>,
): AuthUser {
  const plan = normalizePlanTier(user.plan)
  const boardroomRemaining =
    typeof user.boardroomRemaining === 'number' || user.boardroomRemaining === null
      ? user.boardroomRemaining
      : plan === 'elite'
        ? null
        : FREE_BOARDROOM_AI_MESSAGES
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
    canCreateReferral: user.canCreateReferral,
    plan,
    planLabel: user.planLabel ?? planLabel(plan),
    boardroomRemaining,
    scansRemaining: user.scansRemaining ?? null,
    strategyRemaining: user.strategyRemaining ?? null,
  }
}

export function getToken(): string | null {
  return localStorage.getItem('token')
}

export function setToken(token: string | null) {
  if (!token) localStorage.removeItem('token')
  else localStorage.setItem('token', token)
}

/** Bump when cache key shape changes */
const API_CACHE_VERSION = '1'

function cacheKeyGet(path: string, token: string | null) {
  return `${API_CACHE_VERSION}:GET:${path}:${token ?? 'anon'}`
}

/** Call after logout / user switch so cached GETs are not reused across accounts */
export function clearApiCaches() {
  apiCacheClear()
}

export function invalidateNotificationsCaches() {
  apiCacheInvalidatePrefix(`${API_CACHE_VERSION}:GET:/api/notifications`)
}

function invalidateScanCaches() {
  apiCacheInvalidatePrefix(`${API_CACHE_VERSION}:GET:/api/scan`)
}

function invalidateReferralCaches() {
  apiCacheInvalidatePrefix(`${API_CACHE_VERSION}:GET:/api/referrals`)
}

function invalidateRequestCaches() {
  apiCacheInvalidatePrefix(`${API_CACHE_VERSION}:GET:/api/requests/`)
}

function invalidateConnectionsCaches() {
  apiCacheInvalidatePrefix(`${API_CACHE_VERSION}:GET:/api/connections`)
}

/** Auth /me cache (plan, boardroom remaining, etc.) */
export function invalidateAuthMeCache() {
  apiCacheInvalidatePrefix(`${API_CACHE_VERSION}:GET:/api/auth/me`)
}

/** After connection accept/reject, public profile "connected" flags and lists can change */
function invalidateProfileRelatedCaches() {
  apiCacheInvalidatePrefix(`${API_CACHE_VERSION}:GET:/api/profile/`)
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init?.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  const contentType = res.headers.get('content-type') ?? ''
  const data = contentType.includes('application/json') ? await res.json() : await res.text()

  if (!res.ok) {
    const message =
      typeof data === 'object' && data && 'message' in data && typeof (data as { message?: unknown }).message === 'string'
        ? String((data as { message: string }).message)
        : typeof data === 'object' && data && 'error' in data
          ? String((data as { error: unknown }).error)
          : 'Request failed'
    throw new Error(message)
  }

  return data as T
}

export async function register(payload: {
  inviteToken: string
  name: string
  email: string
  password: string
  passwordConfirm: string
}): Promise<{ token: string; user: AuthUser }> {
  const body = normalizeRegisterPayload(payload)
  const data = await request<{ token: string; user: AuthUser }>('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, inviteToken: payload.inviteToken }),
  })
  return { token: data.token, user: normalizeAuthUser(data.user) }
}

export type InvitePreview = { valid: true; plan: AccountPlan; planLabel: string } | { valid: false; error?: string }

export async function validateRegistrationInvite(token: string): Promise<InvitePreview> {
  const cleaned = String(token ?? '').trim()
  if (!cleaned) return { valid: false, error: 'Invalid link' }
  try {
    const data = await request<{ valid: boolean; plan?: AccountPlan; planLabel?: string; error?: string }>(
      `/api/auth/invite/${encodeURIComponent(cleaned)}`,
    )
    if (!data.valid || !data.plan) return { valid: false, error: data.error ?? 'Invalid link' }
    return { valid: true, plan: normalizePlanTier(data.plan), planLabel: data.planLabel ?? planLabel(normalizePlanTier(data.plan)) }
  } catch (err) {
    return { valid: false, error: err instanceof Error ? err.message : 'Invalid link' }
  }
}

export type RegistrationInviteItem = {
  id: string
  plan: AccountPlan
  planLabel: string
  usedAt: string | null
  usedByUserId: string | null
  createdAt: string
}

export async function createRegistrationInvite(plan: AccountPlan): Promise<{
  invite: RegistrationInviteItem & { registrationUrl: string }
}> {
  return request('/api/admin/invites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan }),
  })
}

export async function listRegistrationInvites(): Promise<{ invites: RegistrationInviteItem[] }> {
  return request('/api/admin/invites')
}

export async function login(payload: { email: string; password: string }): Promise<{ token: string; user: AuthUser }> {
  const body = normalizeLoginPayload(payload)
  const data = await request<{ token: string; user: AuthUser }>('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return { token: data.token, user: normalizeAuthUser(data.user) }
}

export async function me(): Promise<{ user: AuthUser }> {
  const token = getToken()
  const key = cacheKeyGet('/api/auth/me', token)
  const hit = apiCacheGet<{ user: AuthUser }>(key)
  if (hit) return { user: normalizeAuthUser(hit.user) }
  const data = await request<{ user: AuthUser }>('/api/auth/me')
  const normalized = { user: normalizeAuthUser(data.user) }
  apiCacheSet(key, normalized, null)
  return normalized
}

export async function submitContact(payload: { name: string; email: string; message: string }): Promise<{ ok: true }> {
  consumeClientRateLimit('contact:guest', 8, 60 * 60 * 1000)
  const body = normalizeContactPayload(payload)
  return request('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export type ScanResult = {
  score: number
  matchedKeywords: string[]
  missingKeywords: string[]
  tips: string[]
  resumeKeywords: string[]
  jobKeywords: string[]
  correctedResume: string
  suggestedAdditions: {
    summary: string[]
    experienceBullets: string[]
    skills: string[]
  }
  sections: {
    name: string
    startLine: number
    endLine: number
    matchedKeywords: string[]
    missingKeywords: string[]
    issues: string[]
    lines: {
      lineNumber: number
      section: string
      text: string
      issues: string[]
      suggestedKeywords: string[]
      suggestedRewrite: string | null
    }[]
  }[]
}

export async function scanResume(payload: { resume: File; jobDescription: string }): Promise<ScanResult> {
  consumeClientRateLimit(`scan:${getToken() ?? 'guest'}`, 12, 15 * 60 * 1000)
  const { resume, jobDescription } = normalizeScanPayload(payload)
  const form = new FormData()
  form.append('resume', resume)
  form.append('jobDescription', jobDescription)

  const data = await request<ScanResult>('/api/scan', {
    method: 'POST',
    body: form,
  })
  invalidateScanCaches()
  return data
}

export type ScanHistoryItem = { id: string; score: number; createdAt: string }

export async function scanHistory(options?: { force?: boolean }): Promise<{ scans: ScanHistoryItem[] }> {
  const token = getToken()
  const path = '/api/scan/history'
  const key = cacheKeyGet(path, token)
  if (!options?.force) {
    const hit = apiCacheGet<{ scans: ScanHistoryItem[] }>(key)
    if (hit) return hit
  }
  const data = await request<{ scans: ScanHistoryItem[] }>(path)
  apiCacheSet(key, data, null)
  return data
}

export async function scanById(id: string, options?: { force?: boolean }): Promise<ScanResult> {
  assertMongoId(id, 'scan id')
  const path = `/api/scan/history/${encodeURIComponent(id)}`
  const token = getToken()
  const key = cacheKeyGet(path, token)
  if (!options?.force) {
    const hit = apiCacheGet<ScanResult>(key)
    if (hit) return hit
  }
  const data = await request<ScanResult>(path)
  apiCacheSet(key, data, null)
  return data
}

export type ReferralPost = {
  id: string
  authorUserId: string
  company: string
  roleTitle: string
  location: string
  jobLink: string
  referralType: string
  description: string
  tags: string[]
  questions: string[]
  status: 'open' | 'closed'
  createdAt: string
}

export async function listReferrals(
  payload?: { q?: string; tag?: string; limit?: number },
  options?: { force?: boolean },
): Promise<{ posts: ReferralPost[] }> {
  const p = normalizeListReferralsQuery(payload)
  const q = p.q ? encodeURIComponent(p.q) : ''
  const tag = p.tag ? encodeURIComponent(p.tag) : ''
  const limit = p.limit !== undefined ? encodeURIComponent(String(p.limit)) : ''

  const params = [
    q ? `q=${q}` : null,
    tag ? `tag=${tag}` : null,
    limit ? `limit=${limit}` : null,
  ]
    .filter(Boolean)
    .join('&')

  const path = `/api/referrals${params ? `?${params}` : ''}`
  const token = getToken()
  const key = cacheKeyGet(path, token)
  if (!options?.force) {
    const hit = apiCacheGet<{ posts: ReferralPost[] }>(key)
    if (hit) return hit
  }
  const data = await request<{ posts: ReferralPost[] }>(path)
  apiCacheSet(key, data, null)
  return data
}

export async function createReferralPost(payload: {
  company: string
  roleTitle: string
  location?: string
  jobLink?: string
  referralType?: string
  description: string
  tags?: string[]
  questions?: string[]
}): Promise<{ id: string }> {
  consumeClientRateLimit(`referral-create:${getToken() ?? 'guest'}`, 28, 60 * 60 * 1000)
  const body = normalizeReferralCreatePayload(payload)
  const result = await request<{ id: string }>('/api/referrals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  invalidateReferralCaches()
  return result
}

export async function getReferralPost(id: string, options?: { force?: boolean }): Promise<{ post: ReferralPost }> {
  assertMongoId(id)
  const path = `/api/referrals/${encodeURIComponent(id)}`
  const token = getToken()
  const key = cacheKeyGet(path, token)
  if (!options?.force) {
    const hit = apiCacheGet<{ post: ReferralPost }>(key)
    if (hit) return hit
  }
  const data = await request<{ post: ReferralPost }>(path)
  apiCacheSet(key, data, null)
  return data
}

export type Recommendation = {
  authorUserId: string
  text: string
  createdAt: string
}

export type ExperienceItem = { title: string; description: string }
export type ProjectItem = { title: string; description: string }

export type Profile = {
  userId: string
  name: string
  headline: string
  professionalSummary?: string
  experience: ExperienceItem[]
  projects: ProjectItem[]
  education?: string[]
  additionalInfo?: string[]
  contact: { email: string; phone: string; linkedIn: string }
  visibility: { showEmail: boolean; showPhone: boolean; showLinkedIn: boolean }
  connectionQuestions: string[]
  recommendations: Recommendation[]
}

export type ProfilePublic =
  | {
      userId: string
      name: string
      headline: string
      connectionQuestions?: string[]
      recommendations: Recommendation[]
    }
    | {
      userId: string
      name: string
      headline: string
      experience: ExperienceItem[]
      projects: ProjectItem[]
      contact?: { email?: string; phone?: string; linkedIn?: string }
      recommendations: Recommendation[]
      connected: boolean
    }

export async function getMyProfile(options?: { force?: boolean }): Promise<{ profile: Profile }> {
  const token = getToken()
  const key = cacheKeyGet('/api/profile/me', token)
  if (!options?.force) {
    const hit = apiCacheGet<{ profile: Profile }>(key)
    if (hit) return hit
  }
  const data = await request<{ profile: Profile }>('/api/profile/me')
  apiCacheSet(key, data, null)
  return data
}

export async function updateMyProfile(payload: {
  cvName?: string
  headline?: string
  professionalSummary?: string
  experience?: ExperienceItem[]
  projects?: ProjectItem[]
  education?: string[]
  additionalInfo?: string[]
  connectionQuestions?: string[]
  contact?: { email?: string; phone?: string; linkedIn?: string }
  visibility?: { showEmail?: boolean; showPhone?: boolean; showLinkedIn?: boolean }
}): Promise<{ ok: true }> {
  const body = normalizeProfileUpdatePayload(payload)
  const result = await request<{ ok: true }>('/api/profile/me', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  invalidateProfileRelatedCaches()
  invalidateConnectionsCaches()
  return result
}

export async function getProfile(userId: string, options?: { force?: boolean }): Promise<{ profile: ProfilePublic }> {
  assertMongoId(userId, 'user id')
  const path = `/api/profile/${encodeURIComponent(userId)}`
  const token = getToken()
  const key = cacheKeyGet(path, token)
  if (!options?.force) {
    const hit = apiCacheGet<{ profile: ProfilePublic }>(key)
    if (hit) return hit
  }
  const data = await request<{ profile: ProfilePublic }>(path)
  apiCacheSet(key, data, null)
  return data
}

export async function recommendUser(userId: string, text: string): Promise<{ ok: true }> {
  assertMongoId(userId, 'user id')
  consumeClientRateLimit(`recommend:${getToken() ?? 'guest'}`, 35, 60 * 60 * 1000)
  const cleaned = normalizeRecommendText(text)
  const result = await request<{ ok: true }>(`/api/profile/${encodeURIComponent(userId)}/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: cleaned }),
  })
  apiCacheInvalidatePrefix(`${API_CACHE_VERSION}:GET:/api/profile/${encodeURIComponent(userId)}`)
  return result
}

export type ConnectionRequest = {
  id: string
  postId: string | null
  fromUserId: string
  toUserId: string
  fromUser: { id: string; name: string; headline: string }
  toUser: { id: string; name: string; headline: string }
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled'
  questionAnswers: { question: string; answer: string }[]
  createdAt: string
}

export async function listIncomingRequests(options?: { force?: boolean }): Promise<{ requests: ConnectionRequest[] }> {
  const token = getToken()
  const path = '/api/requests/incoming'
  const key = cacheKeyGet(path, token)
  if (!options?.force) {
    const hit = apiCacheGet<{ requests: ConnectionRequest[] }>(key)
    if (hit) return hit
  }
  const data = await request<{ requests: ConnectionRequest[] }>(path)
  apiCacheSet(key, data, null)
  return data
}

export async function listOutgoingRequests(options?: { force?: boolean }): Promise<{ requests: ConnectionRequest[] }> {
  const token = getToken()
  const path = '/api/requests/outgoing'
  const key = cacheKeyGet(path, token)
  if (!options?.force) {
    const hit = apiCacheGet<{ requests: ConnectionRequest[] }>(key)
    if (hit) return hit
  }
  const data = await request<{ requests: ConnectionRequest[] }>(path)
  apiCacheSet(key, data, null)
  return data
}

export async function createConnectionRequest(payload: {
  postId?: string
  toUserId?: string
  questionAnswers: { question: string; answer: string }[]
}): Promise<{ id: string }> {
  consumeClientRateLimit(`conn-req:${getToken() ?? 'guest'}`, 50, 60 * 60 * 1000)
  const body = normalizeConnectionRequestPayload(payload)
  if (!body.postId && !body.toUserId) {
    throw new Error('toUserId or postId is required')
  }
  const result = await request<{ id: string }>('/api/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      postId: body.postId ?? '',
      toUserId: body.toUserId ?? '',
      questionAnswers: body.questionAnswers,
    }),
  })
  invalidateRequestCaches()
  return result
}

export async function acceptRequest(id: string): Promise<{ ok: true }> {
  assertMongoId(id, 'request id')
  const result = await request<{ ok: true }>(`/api/requests/${encodeURIComponent(id)}/accept`, { method: 'POST' })
  invalidateRequestCaches()
  invalidateConnectionsCaches()
  invalidateProfileRelatedCaches()
  return result
}

export async function rejectRequest(id: string): Promise<{ ok: true }> {
  assertMongoId(id, 'request id')
  const result = await request<{ ok: true }>(`/api/requests/${encodeURIComponent(id)}/reject`, { method: 'POST' })
  invalidateRequestCaches()
  return result
}

export type ConnectionListItem = {
  id: string
  otherUser: { id: string; name: string; headline: string }
  createdAt: string
}

export async function listConnections(options?: { force?: boolean }): Promise<{ connections: ConnectionListItem[] }> {
  const token = getToken()
  const path = '/api/connections'
  const key = cacheKeyGet(path, token)
  if (!options?.force) {
    const hit = apiCacheGet<{ connections: ConnectionListItem[] }>(key)
    if (hit) return hit
  }
  const data = await request<{ connections: ConnectionListItem[] }>(path)
  apiCacheSet(key, data, null)
  return data
}

export async function getConnectionProfile(
  connectionId: string,
  options?: { force?: boolean },
): Promise<{ profile: ProfilePublic }> {
  assertMongoId(connectionId, 'connection id')
  const path = `/api/connections/${encodeURIComponent(connectionId)}/profile`
  const token = getToken()
  const key = cacheKeyGet(path, token)
  if (!options?.force) {
    const hit = apiCacheGet<{ profile: ProfilePublic }>(key)
    if (hit) return hit
  }
  const data = await request<{ profile: ProfilePublic }>(path)
  apiCacheSet(key, data, null)
  return data
}

export type ChatMessage = {
  id: string
  connectionId: string
  fromUserId: string
  text: string
  createdAt: string
}

export async function listChatMessages(connectionId: string, limit = 50): Promise<{ messages: ChatMessage[] }> {
  assertMongoId(connectionId, 'connection id')
  const safeLimit = normalizeChatMessageLimit(limit)
  return request(`/api/chat/${encodeURIComponent(connectionId)}/messages?limit=${encodeURIComponent(String(safeLimit))}`)
}

export type NotificationItem = {
  id: string
  type: string
  title: string
  body: string
  link: string
  meta: Record<string, unknown>
  readAt: string | null
  createdAt: string
}

export async function listNotifications(
  payload?: {
    unreadOnly?: boolean
    limit?: number
  },
  options?: { force?: boolean },
): Promise<{ notifications: NotificationItem[] }> {
  const p = normalizeListNotificationsQuery(payload)
  const path = `/api/notifications?unreadOnly=${p.unreadOnly ? 'true' : 'false'}&limit=${encodeURIComponent(String(p.limit))}`
  const token = getToken()
  const key = cacheKeyGet(path, token)
  if (!options?.force) {
    const hit = apiCacheGet<{ notifications: NotificationItem[] }>(key)
    if (hit) return hit
  }
  const data = await request<{ notifications: NotificationItem[] }>(path)
  apiCacheSet(key, data, null)
  return data
}

export async function getUnreadNotificationCount(): Promise<{ count: number }> {
  return request('/api/notifications/unread-count')
}

export async function markNotificationRead(id: string): Promise<{ ok: true }> {
  assertMongoId(id, 'notification id')
  const result = await request<{ ok: true }>(`/api/notifications/${encodeURIComponent(id)}/read`, { method: 'POST' })
  invalidateNotificationsCaches()
  return result
}

export async function markAllNotificationsRead(): Promise<{ ok: true }> {
  const result = await request<{ ok: true }>('/api/notifications/read-all', { method: 'POST' })
  invalidateNotificationsCaches()
  return result
}

export async function boardroomChat(payload: {
  userMessage: string
  history: { role: string; text: string }[]
}): Promise<{ response: string; boardroomRemaining?: number | null }> {
  consumeClientRateLimit(`boardroom:${getToken() ?? 'guest'}`, 42, 60 * 1000)
  const body = normalizeBoardroomPayload(payload)
  try {
    return await request<{ response: string; boardroomRemaining?: number | null }>('/api/boardroom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } finally {
    invalidateAuthMeCache()
  }
}

export async function fetchStrategy(bank: string): Promise<{ response: string }> {
  consumeClientRateLimit(`strategy:${getToken() ?? 'guest'}`, 36, 15 * 60 * 1000)
  const cleaned = normalizeStrategyBank(bank)
  return request('/api/strategy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bank: cleaned }),
  })
}

export type BlogPostListItem = {
  id: string
  title: string
  slug: string
  excerpt: string
  publishedAt: string
  authorName: string
}

export type BlogPostDetail = BlogPostListItem & {
  content: string
  mediaUrls: string[]
  authorUserId: string
  metaTitle: string
  metaDescription: string
}

export async function listBlogs(params?: { q?: string; limit?: number }): Promise<{ posts: BlogPostListItem[] }> {
  const p = normalizeListBlogsQuery(params)
  const qs = new URLSearchParams()
  if (p.q) qs.set('q', p.q)
  if (p.limit !== undefined) qs.set('limit', String(p.limit))
  const suffix = qs.toString() ? `?${qs}` : ''
  return request(`/api/blogs${suffix}`)
}

export async function getBlogBySlug(slug: string): Promise<{ post: BlogPostDetail }> {
  const s = String(slug ?? '').trim().slice(0, 300)
  if (!s) {
    throw new Error('Invalid slug')
  }
  return request(`/api/blogs/by-slug/${encodeURIComponent(s)}`)
}

export async function getBlogPost(id: string): Promise<{ post: BlogPostDetail & { status?: string } }> {
  assertMongoId(id, 'post id')
  return request(`/api/blogs/${encodeURIComponent(id)}`)
}

export async function createBlogPost(payload: {
  title: string
  content: string
  excerpt?: string
  metaTitle?: string
  metaDescription?: string
  mediaUrls?: string[]
  status?: 'draft' | 'published'
}): Promise<{ id: string; slug: string }> {
  const body = normalizeBlogCreatePayload(payload)
  return request('/api/blogs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function updateBlogPost(id: string, payload: {
  title?: string
  content?: string
  excerpt?: string
  metaTitle?: string
  metaDescription?: string
  mediaUrls?: string[]
  status?: 'draft' | 'published'
}): Promise<{ id: string; slug: string }> {
  assertMongoId(id, 'post id')
  const body = normalizeBlogUpdatePayload(payload)
  return request(`/api/blogs/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
