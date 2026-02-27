import type React from 'react'
import { Link, useLocation } from 'react-router-dom'

import { useAuth } from '../state/AuthContext'
import LandingNavbar from './LandingNavbar'
import { useRealtime } from '../state/RealtimeContext'

function isActivePath(pathname: string, target: string): boolean {
  if (target === '/checker') return pathname === '/checker'
  return pathname === target || pathname.startsWith(`${target}/`)
}

type NavItem = {
  to: string
  label: string
  icon: React.ReactNode
}

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {children}
    </svg>
  )
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth()
  const { unreadCount } = useRealtime()
  const location = useLocation()

  const items: NavItem[] = [
    {
      to: '/checker',
      label: 'ATS Checker',
      icon: (
        <Icon>
          <path
            d="M4 4h16v16H4V4zm4 4h8M8 12h8M8 16h5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Icon>
      ),
    },
    {
      to: '/referrals',
      label: 'Referrals',
      icon: (
        <Icon>
          <path
            d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 0c3.866 0 7 1.79 7 4v2H5v-2c0-2.21 3.134-4 7-4Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Icon>
      ),
    },
    {
      to: '/requests',
      label: 'Requests',
      icon: (
        <Icon>
          <path
            d="M7 7h10M7 12h10M7 17h6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5 3h14a2 2 0 0 1 2 2v14l-3-2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Icon>
      ),
    },
    {
      to: '/notifications',
      label: 'Notifications',
      icon: (
        <Icon>
          <path
            d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2Zm6-6V11a6 6 0 1 0-12 0v5l-2 2h16l-2-2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Icon>
      ),
    },
    {
      to: '/connections',
      label: 'Connections',
      icon: (
        <Icon>
          <path
            d="M16 8a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm-8 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 21v-1c0-2.21 2.686-4 6-4m14 5v-1c0-2.21-2.686-4-6-4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Icon>
      ),
    },
    {
      to: '/resume-creator',
      label: 'Resume Creator',
      icon: (
        <Icon>
          <path
            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Icon>
      ),
    },
    {
      to: '/profile/me',
      label: 'My Profile',
      icon: (
        <Icon>
          <path
            d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4 21c0-3.314 3.582-6 8-6s8 2.686 8 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Icon>
      ),
    },
  ]

  return (
    <div className="appShellWrapper">
      <LandingNavbar />
      <div className="appShell appShellWithNav">
        <aside className="sidebar">
          <div className="sidebarTop">
            <Link className="sidebarBrand" to="/checker" title="Elite Skills">
              ES
            </Link>
          </div>

          <nav className="sidebarNav">
            {items.map((it) => {
            const active = isActivePath(location.pathname, it.to)
              return (
                <div key={it.to} className="sidebarItemWrap">
                  <Link
                    to={it.to}
                    className={`sidebarItem ${active ? 'active' : ''}`}
                    title={it.label}
                    aria-label={it.label}
                  >
                    {it.icon}
                  </Link>
                  {it.to === '/notifications' && unreadCount > 0 ? (
                    <span className="badge" title={`${unreadCount} unread`}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  ) : null}
                </div>
              )
            })}
          </nav>

          <div className="sidebarBottom">
            <button className="sidebarItem" type="button" onClick={logout} title="Logout" aria-label="Logout">
              <Icon>
                <path
                  d="M10 17l-1 3h6l-1-3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M7 3h10a2 2 0 0 1 2 2v6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M7 8H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16 12h6m0 0-2-2m2 2-2 2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Icon>
            </button>
          </div>
        </aside>

        <main className="main">
          <div className="mainInner">{children}</div>
        </main>
      </div>
    </div>
  )
}
