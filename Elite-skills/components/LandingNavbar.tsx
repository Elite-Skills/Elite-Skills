import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useAuth } from '../state/AuthContext'

function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

const navLinks = [
  { id: 'problem', label: 'The Reality' },
  { id: 'accelerator', label: 'The Accelerator' },
  { id: 'ai-demo', label: '✨ AI Simulation', highlight: true },
  { id: 'roi', label: 'ROI' },
]

export default function LandingNavbar() {
  const { token } = useAuth()
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
        <div className="flex justify-between items-center h-20 gap-4">
          <div className="flex items-center">
            <Link
              to="/"
              className="text-2xl font-serif font-bold text-white tracking-wider hover:opacity-90 transition-opacity"
            >
              <span className="text-elite-gold">ELITE</span> SKILLS
            </Link>
          </div>
          <div className="hidden md:flex space-x-8 text-xs uppercase tracking-[0.2em] text-elite-text-muted">
            {navLinks.map(({ id, label, highlight }) => (
              <Link
                key={id}
                to={`/#${id}`}
                onClick={(e) => handleNavClick(e, id)}
                className={`hover:text-elite-gold transition-colors ${highlight ? 'font-bold text-elite-gold' : ''}`}
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2">
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
              to="/register"
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
                to={`/#${id}`}
                onClick={(e) => handleNavClick(e, id)}
                className={`py-2 text-xs uppercase tracking-[0.2em] hover:text-elite-gold transition-colors ${highlight ? 'font-bold text-elite-gold' : 'text-elite-text-muted'}`}
              >
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
