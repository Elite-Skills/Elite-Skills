import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import type { AuthUser } from '../api'
import { getToken, me, setToken as persistToken } from '../api'

type AuthState = {
  user: AuthUser | null
  token: string | null
  loading: boolean
  setAuth: (payload: { token: string; user: AuthUser } | null) => void
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

        const data = await me()
        if (!cancelled) {
          setUser(data.user)
          setLoading(false)
        }
      } catch {
        if (!cancelled) {
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

  const value = useMemo<AuthState>(
    () => ({
      user,
      token,
      loading,
      setAuth: (payload: { token: string; user: AuthUser } | null) => {
        if (!payload) {
          persistToken(null)
          setToken(null)
          setUser(null)
          return
        }
        persistToken(payload.token)
        setToken(payload.token)
        setUser(payload.user)
      },
      logout: () => {
        persistToken(null)
        setToken(null)
        setUser(null)
      },
    }),
    [loading, token, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
