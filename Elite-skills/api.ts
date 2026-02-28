const PROD_FALLBACK_BASE = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000'

export const API_BASE =
  import.meta.env.VITE_API_BASE ?? (import.meta.env.DEV ? 'http://localhost:5000' : PROD_FALLBACK_BASE)

export type AuthUser = { id: string; name: string; email: string }

export function getToken(): string | null {
  return localStorage.getItem('token')
}

export function setToken(token: string | null) {
  if (!token) localStorage.removeItem('token')
  else localStorage.setItem('token', token)
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
    const message = typeof data === 'object' && data && 'error' in data ? String((data as any).error) : 'Request failed'
    throw new Error(message)
  }

  return data as T
}

export async function register(payload: { name: string; email: string; password: string; passwordConfirm: string }): Promise<{ token: string; user: AuthUser }> {
  return request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function login(payload: { email: string; password: string }): Promise<{ token: string; user: AuthUser }> {
  return request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function me(): Promise<{ user: AuthUser }> {
  return request('/api/auth/me')
}

export async function submitContact(payload: { name: string; email: string; message: string }): Promise<{ ok: true }> {
  return request('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
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
  const form = new FormData()
  form.append('resume', payload.resume)
  form.append('jobDescription', payload.jobDescription)

  return request('/api/scan', {
    method: 'POST',
    body: form,
  })
}

export type ScanHistoryItem = { id: string; score: number; createdAt: string }

export async function scanHistory(): Promise<{ scans: ScanHistoryItem[] }> {
  return request('/api/scan/history')
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

export async function listReferrals(payload?: { q?: string; tag?: string; limit?: number }): Promise<{ posts: ReferralPost[] }> {
  const q = payload?.q ? encodeURIComponent(payload.q) : ''
  const tag = payload?.tag ? encodeURIComponent(payload.tag) : ''
  const limit = payload?.limit ? encodeURIComponent(String(payload.limit)) : ''

  const params = [
    q ? `q=${q}` : null,
    tag ? `tag=${tag}` : null,
    limit ? `limit=${limit}` : null,
  ]
    .filter(Boolean)
    .join('&')

  return request(`/api/referrals${params ? `?${params}` : ''}`)
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
  return request('/api/referrals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function getReferralPost(id: string): Promise<{ post: ReferralPost }> {
  return request(`/api/referrals/${encodeURIComponent(id)}`)
}

export type Recommendation = {
  authorUserId: string
  text: string
  createdAt: string
}

export type Profile = {
  userId: string
  name: string
  headline: string
  experience: string[]
  projects: string[]
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
      experience: string[]
      projects: string[]
      contact?: { email?: string; phone?: string; linkedIn?: string }
      recommendations: Recommendation[]
      connected: boolean
    }

export async function getMyProfile(): Promise<{ profile: Profile }> {
  return request('/api/profile/me')
}

export async function updateMyProfile(payload: {
  headline?: string
  experience?: string[]
  projects?: string[]
  connectionQuestions?: string[]
  contact?: { email?: string; phone?: string; linkedIn?: string }
  visibility?: { showEmail?: boolean; showPhone?: boolean; showLinkedIn?: boolean }
}): Promise<{ ok: true }> {
  return request('/api/profile/me', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function getProfile(userId: string): Promise<{ profile: ProfilePublic }> {
  return request(`/api/profile/${encodeURIComponent(userId)}`)
}

export async function recommendUser(userId: string, text: string): Promise<{ ok: true }> {
  return request(`/api/profile/${encodeURIComponent(userId)}/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
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

export async function listIncomingRequests(): Promise<{ requests: ConnectionRequest[] }> {
  return request('/api/requests/incoming')
}

export async function listOutgoingRequests(): Promise<{ requests: ConnectionRequest[] }> {
  return request('/api/requests/outgoing')
}

export async function createConnectionRequest(payload: {
  postId?: string
  toUserId?: string
  questionAnswers: { question: string; answer: string }[]
}): Promise<{ id: string }> {
  return request('/api/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function acceptRequest(id: string): Promise<{ ok: true }> {
  return request(`/api/requests/${encodeURIComponent(id)}/accept`, { method: 'POST' })
}

export async function rejectRequest(id: string): Promise<{ ok: true }> {
  return request(`/api/requests/${encodeURIComponent(id)}/reject`, { method: 'POST' })
}

export type ConnectionListItem = {
  id: string
  otherUser: { id: string; name: string; headline: string }
  createdAt: string
}

export async function listConnections(): Promise<{ connections: ConnectionListItem[] }> {
  return request('/api/connections')
}

export async function getConnectionProfile(connectionId: string): Promise<{ profile: ProfilePublic }> {
  return request(`/api/connections/${encodeURIComponent(connectionId)}/profile`)
}

export type ChatMessage = {
  id: string
  connectionId: string
  fromUserId: string
  text: string
  createdAt: string
}

export async function listChatMessages(connectionId: string, limit = 50): Promise<{ messages: ChatMessage[] }> {
  return request(`/api/chat/${encodeURIComponent(connectionId)}/messages?limit=${encodeURIComponent(String(limit))}`)
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

export async function listNotifications(payload?: {
  unreadOnly?: boolean
  limit?: number
}): Promise<{ notifications: NotificationItem[] }> {
  const unreadOnly = payload?.unreadOnly ? 'true' : 'false'
  const limit = payload?.limit ? encodeURIComponent(String(payload.limit)) : '30'
  return request(`/api/notifications?unreadOnly=${unreadOnly}&limit=${limit}`)
}

export async function getUnreadNotificationCount(): Promise<{ count: number }> {
  return request('/api/notifications/unread-count')
}

export async function markNotificationRead(id: string): Promise<{ ok: true }> {
  return request(`/api/notifications/${encodeURIComponent(id)}/read`, { method: 'POST' })
}

export async function markAllNotificationsRead(): Promise<{ ok: true }> {
  return request('/api/notifications/read-all', { method: 'POST' })
}

export async function boardroomChat(payload: {
  userMessage: string
  history: { role: string; text: string }[]
}): Promise<{ response: string }> {
  return request('/api/boardroom', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function fetchStrategy(bank: string): Promise<{ response: string }> {
  return request('/api/strategy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bank }),
  })
}
