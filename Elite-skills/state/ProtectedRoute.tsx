import { Navigate } from 'react-router-dom'

import AppShell from '../components/AppShell'
import { useAuth } from './AuthContext'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth()

  if (loading) return (
    <div className="ats-app min-h-screen flex items-center justify-center" style={{ color: 'var(--elite-gold)' }}>
      Loading…
    </div>
  )
  if (!token) return <Navigate to="/login" replace />

  return (
    <div className="ats-app">
      <AppShell>{children}</AppShell>
    </div>
  )
}
