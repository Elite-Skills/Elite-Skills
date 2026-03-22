import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useAuth } from '../state/AuthContext'
import { useContact } from '../state/ContactContext'

function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

const navLinks = [
  { id: 'problem', label: 'The Reality' },
  { id: 'accelerator', label: 'The Accelerator' },
  { id: 'ai-demo', label: '✨ AI Simulation', highlight: true },
  { id: 'contact', label: 'Contact Us' },
  { id: 'roi', label: 'ROI', highlight: true },
]

export default function LandingNavbar() {
  const { token } = useAuth()
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
        <div className="flex justify-between items-center h-20 gap-4">
          <div className="flex items-center">
            <Link
              to="/"
              className="text-2xl font-serif font-bold text-white tracking-wider hover:opacity-90 transition-opacity"
            >
              <span className="text-elite-gold">ELITE</span> SKILLS
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-5 text-xs uppercase tracking-[0.2em] text-elite-text-muted">
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
          <div className="flex items-center gap-2">
            <Link
              to="/blog"
              className="hidden sm:inline text-xs uppercase tracking-[0.2em] text-elite-text-muted hover:text-elite-gold transition-colors"
            >
              Blog
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              className="md:hidden p-2 text-elite-text-muted hover:text-white"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            {token ? (
            <Link
              to="/checker"
              className="dashboard-nav-btn bg-elite-gold hover:bg-elite-gold-dim text-black font-bold px-6 py-2 rounded-sm transition-all text-xs uppercase tracking-widest shrink-0"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              to="/pricing"
              className="bg-elite-gold hover:bg-elite-gold-dim text-black font-bold px-6 py-2 rounded-sm transition-all text-xs uppercase tracking-widest shrink-0"
            >
              Get Access
            </Link>
            )}
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
            <Link to="/blog" className="py-2 text-xs uppercase tracking-[0.2em] text-elite-text-muted hover:text-elite-gold transition-colors">
              Blog
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
