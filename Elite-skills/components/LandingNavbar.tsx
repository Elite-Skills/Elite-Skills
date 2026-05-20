import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Instagram, Linkedin, Menu, X } from 'lucide-react'
import { useAuth } from '../state/AuthContext'
import { useContact } from '../state/ContactContext'
import { ELITE_SKILLS_INSTAGRAM, ELITE_SKILLS_LINKEDIN } from '../socialLinks'

function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

const WHATSAPP_GET_ACCESS =
  'https://api.whatsapp.com/send/?phone=447441428122'

const navPrimaryCtaClassName =
  'bg-elite-gold hover:bg-elite-gold-dim text-black font-bold px-6 py-2 rounded-sm transition-all text-xs uppercase tracking-widest shrink-0'

function NavPrimaryCta({ token, plan }: { token: string | null; plan?: 'free' | 'paid' }) {
  if (token) {
    if (plan === 'paid') {
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
      <Link
        to="/pricing"
        className={`dashboard-nav-btn ${navPrimaryCtaClassName}`}
      >
        Get Upgraded
      </Link>
    )
  }
  return (
    <a
      href={WHATSAPP_GET_ACCESS}
      target="_blank"
      rel="noopener noreferrer"
      className={navPrimaryCtaClassName}
    >
      Get Access
    </a>
  )
}

const navLinks = [
  { id: 'problem', label: 'The Reality' },
  { id: 'accelerator', label: 'The Accelerator' },
  { id: 'ai-demo', label: '✨ AI Simulation', highlight: true },
  { id: 'contact', label: 'Contact Us' },
  { id: 'roi', label: 'ROI', highlight: true },
]

export default function LandingNavbar() {
  const { token, user } = useAuth()
  const { openContact } = useContact()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const isLanding = location.pathname === '/'

  const handleNavClick = (e: React.MouseEvent, sectionId: string) => {
    setMobileOpen(false)
    if (sectionId === 'contact') {
      e.preventDefault()
      openContact()
      return
    }
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
        <div className="flex h-20 w-full items-center gap-2 md:justify-between md:gap-4">
          <div className="relative z-10 flex min-w-0 shrink-0 items-center">
            <Link
              to="/"
              className="font-serif font-bold hover:opacity-90 transition-opacity"
            >
              <span className="flex flex-col items-start leading-[1.05] text-lg tracking-wider text-white md:hidden">
                <span className="text-elite-gold">ELITE</span>
                <span>SKILLS</span>
              </span>
              <span className="hidden text-2xl tracking-wider text-white md:inline">
                <span className="text-elite-gold">ELITE</span> SKILLS
              </span>
            </Link>
          </div>
          <div className="relative z-10 hidden md:flex items-center space-x-5 text-xs uppercase tracking-[0.2em] text-elite-text-muted">
            {navLinks.slice(0, -1).map(({ id, label, highlight }) => (
              <Link
                key={id}
                to={id === 'contact' ? '#' : `/#${id}`}
                onClick={(e) => handleNavClick(e, id)}
                className={`hover:text-elite-gold transition-colors ${highlight ? 'font-bold text-elite-gold' : ''}`}
              >
                {label}
              </Link>
            ))}
            <Link
              key={navLinks[navLinks.length - 1].id}
              to={`/#${navLinks[navLinks.length - 1].id}`}
              onClick={(e) => handleNavClick(e, navLinks[navLinks.length - 1].id)}
              className="ml-4 pl-4 border-l border-white/20 font-bold text-elite-gold hover:text-elite-gold-dim transition-colors"
            >
              {navLinks[navLinks.length - 1].label}
            </Link>
          </div>
          <div className="flex min-w-0 flex-1 justify-center md:hidden">
            <NavPrimaryCta token={token} plan={user?.plan} />
          </div>
          <div className="relative z-10 flex shrink-0 items-center gap-3 pr-3 sm:pr-4 md:gap-2 md:pr-0">
            <div className="hidden md:block">
              <NavPrimaryCta token={token} plan={user?.plan} />
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              className="md:hidden shrink-0 p-2 text-elite-text-muted hover:text-white"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="hidden md:flex items-center gap-3 ml-3 sm:ml-4 pl-3 sm:pl-4 border-l border-white/20">
              <a
                href={ELITE_SKILLS_INSTAGRAM}
                target="_blank"
                rel="noopener noreferrer"
                className="text-elite-text-muted hover:text-elite-gold transition-colors p-1"
                aria-label="Elite Skills on Instagram"
              >
                <Instagram className="w-5 h-5" aria-hidden />
              </a>
              <a
                href={ELITE_SKILLS_LINKEDIN}
                target="_blank"
                rel="noopener noreferrer"
                className="text-elite-text-muted hover:text-elite-gold transition-colors p-1"
                aria-label="Elite Skills on LinkedIn"
              >
                <Linkedin className="w-5 h-5" aria-hidden />
              </a>
            </div>
          </div>
        </div>
        {mobileOpen && (
          <div className="md:hidden absolute top-20 left-0 right-0 bg-elite-black border-b border-white/10 py-4 px-4 flex flex-col gap-4">
            {navLinks.map(({ id, label, highlight }) => (
              <Link
                key={id}
                to={id === 'contact' ? '#' : `/#${id}`}
                onClick={(e) => handleNavClick(e, id)}
                className={`py-2 text-xs uppercase tracking-[0.2em] hover:text-elite-gold transition-colors ${highlight ? 'font-bold text-elite-gold' : 'text-elite-text-muted'}`}
              >
                {label}
              </Link>
            ))}
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
