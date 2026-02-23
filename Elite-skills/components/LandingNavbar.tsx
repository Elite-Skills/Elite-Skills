import { Link } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'

export default function LandingNavbar() {
  const { token } = useAuth()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-elite-black/90 backdrop-blur-md border-b border-white/10 min-w-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            <Link to="/#problem" className="hover:text-elite-gold transition-colors">
              The Reality
            </Link>
            <Link to="/#accelerator" className="hover:text-elite-gold transition-colors">
              The Accelerator
            </Link>
            <Link to="/#ai-demo" className="hover:text-elite-gold transition-colors font-bold text-elite-gold">
              ✨ AI Simulation
            </Link>
            <Link to="/#roi" className="hover:text-elite-gold transition-colors">
              ROI
            </Link>
          </div>
          {token ? (
            <Link
              to="/checker"
              className="bg-elite-gold hover:bg-elite-gold-dim text-black font-bold px-6 py-2 rounded-sm transition-all text-xs uppercase tracking-widest shrink-0"
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
    </nav>
  )
}
