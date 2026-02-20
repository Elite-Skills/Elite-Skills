import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'

import { API_BASE, getUnreadNotificationCount, type NotificationItem } from '../api'
import { useAuth } from './AuthContext'

type NotifyNewPayload = NotificationItem & { userId?: string }

type RealtimeState = {
  socket: Socket | null
  unreadCount: number
  refreshUnreadCount: () => Promise<void>
}

const RealtimeContext = createContext<RealtimeState | undefined>(undefined)

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { token, logout } = useAuth()

  const socketRef = useRef<Socket | null>(null)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  async function refreshUnreadCount() {
    if (!token) {
      setUnreadCount(0)
      return
    }

    try {
      const data = await getUnreadNotificationCount()
      setUnreadCount(data.count)
    } catch {
      return
    }
  }

  useEffect(() => {
    refreshUnreadCount()
  }, [token])

  useEffect(() => {
    if (!token) {
      socketRef.current?.disconnect()
      socketRef.current = null
      setSocket(null)
      return
    }

    const socket = io(API_BASE, {
      transports: ['websocket'],
      auth: { token },
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 500,
    })

    socketRef.current = socket
    setSocket(socket)

    socket.on('notify:new', (_payload: NotifyNewPayload) => {
      setUnreadCount((c) => c + 1)
    })

    socket.on('notify:read', () => {
      refreshUnreadCount()
    })

    socket.on('notify:read-all', () => {
      setUnreadCount(0)
    })

    socket.on('connect_error', (err) => {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.toLowerCase().includes('unauthorized')) {
        logout()
      }
    })

    return () => {
      socket.off('notify:new')
      socket.off('notify:read')
      socket.off('notify:read-all')
      socket.off('connect_error')
      socket.disconnect()
      socketRef.current = null
      setSocket(null)
    }
  }, [token])

  const value = useMemo<RealtimeState>(
    () => ({
      socket,
      unreadCount,
      refreshUnreadCount,
    }),
    [socket, unreadCount]
  )

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
}

export function useRealtime(): RealtimeState {
  const ctx = useContext(RealtimeContext)
  if (!ctx) throw new Error('useRealtime must be used within RealtimeProvider')
  return ctx
}
