import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import type { AuthUser } from '../api'
import { clearApiCaches, getToken, me, normalizeAuthUser, setToken as persistToken } from '../api'

type AuthState = {
  user: AuthUser | null
  token: string | null
  loading: boolean
  setAuth: (payload: { token: string; user: AuthUser } | null) => void
  patchUser: (patch: Partial<AuthUser>) => void
  logout: () => void
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(getToken())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        if (!token) {
          if (!cancelled) {
            setUser(null)
            setLoading(false)
          }
          return
        }

        const timeout = (ms: number) =>
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Auth timeout')), ms))
        const data = await Promise.race([me(), timeout(8000)])
        if (!cancelled) {
          setUser(normalizeAuthUser(data.user))
          setLoading(false)
        }
      } catch {
        if (!cancelled) {
          clearApiCaches()
          persistToken(null)
          setToken(null)
          setUser(null)
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [token])

  const patchUser = useCallback((patch: Partial<AuthUser>) => {
    setUser((u) => (u ? { ...u, ...patch } : u))
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      user,
      token,
      loading,
      setAuth: (payload: { token: string; user: AuthUser } | null) => {
        clearApiCaches()
        if (!payload) {
          persistToken(null)
          setToken(null)
          setUser(null)
          return
        }
        persistToken(payload.token)
        setToken(payload.token)
        setUser(normalizeAuthUser(payload.user))
      },
      patchUser,
      logout: () => {
        clearApiCaches()
        persistToken(null)
        setToken(null)
        setUser(null)
      },
    }),
    [loading, patchUser, token, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
