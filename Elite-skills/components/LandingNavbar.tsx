import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Instagram, Linkedin, Menu, X } from 'lucide-react'
import { useAuth } from '../state/AuthContext'
import type { PlanTier } from '../lib/planLimits'
import {
  ELITE_SKILLS_GET_ACCESS_LABEL,
  ELITE_SKILLS_WHATSAPP,
  ELITE_SKILLS_INSTAGRAM,
  ELITE_SKILLS_LINKEDIN,
} from '../socialLinks'

function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

const navPrimaryCtaClassName =
  'inline-flex items-center justify-center bg-elite-gold hover:bg-elite-gold-dim text-black font-bold px-4 py-2 sm:px-6 rounded-sm transition-all text-[10px] sm:text-xs uppercase tracking-widest shrink-0 leading-none'

function NavPrimaryCta({ token }: { token: string | null; plan?: PlanTier }) {
  if (token) {
    return (
      <Link
        to="/checker"
        className={`dashboard-nav-btn ${navPrimaryCtaClassName}`}
      >
        Dashboard
      </Link>
    )
  }
  return (
    <a
      href={ELITE_SKILLS_WHATSAPP}
      target="_blank"
      rel="noopener noreferrer"
      className={navPrimaryCtaClassName}
    >
      {ELITE_SKILLS_GET_ACCESS_LABEL}
    </a>
  )
}

const navLinks = [
  { id: 'problem', label: 'The Reality' },
  { id: 'accelerator', label: 'The Accelerator' },
  { id: 'ai-demo', label: '✨ AI Simulation', highlight: true },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'roi', label: 'ROI', highlight: true },
]

export default function LandingNavbar() {
  const { token, user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const isLanding = location.pathname === '/'

  const handleNavClick = (e: React.MouseEvent, sectionId: string) => {
    setMobileOpen(false)
    if (isLanding) {
      e.preventDefault()
      scrollToSection(sectionId)
    } else {
      navigate({ pathname: '/', hash: sectionId })
    }
  }

  return (
    <nav className="landing-navbar fixed top-0 left-0 right-0 z-50 bg-elite-black/90 backdrop-blur-md border-b border-white/10 min-w-0">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 w-full items-center justify-between gap-3 sm:gap-4">
          <div className="relative z-10 flex min-w-0 shrink-0 items-center">
            <Link
              to="/"
              className="font-serif font-bold hover:opacity-90 transition-opacity inline-flex flex-col justify-center md:flex-row md:items-center md:gap-1.5 leading-[1.1]"
            >
              <span className="flex flex-col items-start justify-center leading-[1.05] text-base tracking-wider text-white sm:text-lg md:hidden">
                <span className="text-elite-gold">ELITE</span>
                <span className="text-white">SKILLS</span>
              </span>
              <span className="hidden md:inline-flex md:items-center text-xl lg:text-2xl tracking-wider text-white">
                <span className="text-elite-gold">ELITE</span>
                <span className="text-white">{' '}SKILLS</span>
              </span>
            </Link>
          </div>

          {/* Desktop: centered nav — vertically aligned with logo + actions */}
          <div className="relative z-10 hidden md:flex flex-1 min-w-0 items-center justify-center gap-x-5 lg:gap-x-6 px-2 text-xs uppercase tracking-[0.2em] text-elite-text-muted">
            {navLinks.slice(0, -1).map(({ id, label, highlight }) =>
              id === 'dashboard' ? (
                <Link
                  key={id}
                  to="/checker"
                  className={`inline-flex items-center shrink-0 whitespace-nowrap hover:text-elite-gold transition-colors py-2 ${highlight ? 'font-bold text-elite-gold' : ''}`}
                >
                  {label}
                </Link>
              ) : (
                <Link
                  key={id}
                  to={`/#${id}`}
                  onClick={(e) => handleNavClick(e, id)}
                  className={`inline-flex items-center shrink-0 whitespace-nowrap hover:text-elite-gold transition-colors py-2 ${highlight ? 'font-bold text-elite-gold' : ''}`}
                >
                  {label}
                </Link>
              ),
            )}
            <Link
              key={navLinks[navLinks.length - 1].id}
              to={`/#${navLinks[navLinks.length - 1].id}`}
              onClick={(e) => handleNavClick(e, navLinks[navLinks.length - 1].id)}
              className="inline-flex items-center shrink-0 whitespace-nowrap ml-3 lg:ml-4 pl-3 lg:pl-4 border-l border-white/20 font-bold text-elite-gold hover:text-elite-gold-dim transition-colors py-2"
            >
              {navLinks[navLinks.length - 1].label}
            </Link>
          </div>

          {/* Right cluster: same vertical alignment on mobile + desktop */}
          <div className="relative z-10 flex shrink-0 items-center gap-2 sm:gap-3">
            <NavPrimaryCta token={token} plan={user?.plan} />
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              className="md:hidden inline-flex shrink-0 items-center justify-center p-2 text-elite-text-muted hover:text-white"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-6 h-6" aria-hidden /> : <Menu className="w-6 h-6" aria-hidden />}
            </button>
            <div className="hidden md:inline-flex items-center gap-3 ml-1 pl-3 sm:ml-2 sm:pl-4 border-l border-white/20">
              <a
                href={ELITE_SKILLS_INSTAGRAM}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center text-elite-text-muted hover:text-elite-gold transition-colors p-1"
                aria-label="Elite Skills on Instagram"
              >
                <Instagram className="w-5 h-5" aria-hidden />
              </a>
              <a
                href={ELITE_SKILLS_LINKEDIN}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center text-elite-text-muted hover:text-elite-gold transition-colors p-1"
                aria-label="Elite Skills on LinkedIn"
              >
                <Linkedin className="w-5 h-5" aria-hidden />
              </a>
            </div>
          </div>
        </div>
        {mobileOpen && (
          <div className="md:hidden absolute top-20 left-0 right-0 bg-elite-black border-b border-white/10 py-4 px-4 flex flex-col gap-4">
            {navLinks.map(({ id, label, highlight }) =>
              id === 'dashboard' ? (
                <Link
                  key={id}
                  to="/checker"
                  onClick={() => setMobileOpen(false)}
                  className={`py-2 text-xs uppercase tracking-[0.2em] hover:text-elite-gold transition-colors ${highlight ? 'font-bold text-elite-gold' : 'text-elite-text-muted'}`}
                >
                  {label}
                </Link>
              ) : (
                <Link
                  key={id}
                  to={`/#${id}`}
                  onClick={(e) => handleNavClick(e, id)}
                  className={`py-2 text-xs uppercase tracking-[0.2em] hover:text-elite-gold transition-colors ${highlight ? 'font-bold text-elite-gold' : 'text-elite-text-muted'}`}
                >
                  {label}
                </Link>
              ),
            )}
            <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
              <span className="text-[10px] uppercase tracking-widest text-white/50 font-bold">
                Follow
              </span>
              <a
                href={ELITE_SKILLS_INSTAGRAM}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center gap-3 py-2 text-xs uppercase tracking-[0.2em] text-elite-text-muted hover:text-elite-gold transition-colors"
              >
                <Instagram className="w-5 h-5 shrink-0" aria-hidden />
                Instagram
              </a>
              <a
                href={ELITE_SKILLS_LINKEDIN}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center gap-3 py-2 text-xs uppercase tracking-[0.2em] text-elite-text-muted hover:text-elite-gold transition-colors"
              >
                <Linkedin className="w-5 h-5 shrink-0" aria-hidden />
                LinkedIn
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
