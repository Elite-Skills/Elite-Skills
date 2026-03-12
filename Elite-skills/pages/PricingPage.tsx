import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import LandingNavbar from '../components/LandingNavbar'
import { useAuth } from '../state/AuthContext'

export default function PricingPage() {
  const { token } = useAuth()

  const features = [
    'Full PDF guide (100+ questions)',
    'AI MD Simulation access',
    'Strategy Vault & templates',
    'ATS Checker & Resume Creator',
    'Email support',
  ]

  const freeFeatures = [
    '3 AI Simulation messages',
    'Sample strategy templates',
    'Community access',
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0a0a' }}>
      <LandingNavbar />
      <div className="ats-app pt-32 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-5xl font-serif font-bold text-white mb-4">
              Choose Your Plan
            </h1>
            <p className="text-elite-text-muted text-lg max-w-2xl mx-auto">
              Filler pricing info for visual testing. Data will be updated later.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Free tier */}
            <div className="bento-card p-8 rounded-xl border border-white/10 flex flex-col">
              <h3 className="text-xl font-serif font-bold text-white mb-2">Free</h3>
              <p className="text-elite-text-muted text-sm mb-6">Get started with limited access</p>
              <div className="text-3xl font-bold text-white mb-6">€0</div>
              <ul className="space-y-4 flex-grow mb-8">
                {freeFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-elite-text-muted text-sm">
                    <Check className="w-5 h-5 text-elite-gold shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              {token ? (
                <Link
                  to="/checker"
                  className="block w-full py-3 px-6 border border-white/20 text-white text-center rounded hover:border-elite-gold hover:text-elite-gold transition-colors mt-auto"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <Link
                  to="/register"
                  className="block w-full py-3 px-6 border border-white/20 text-elite-gold text-center rounded hover:border-elite-gold hover:text-elite-gold transition-colors mt-auto"
                >
                  Get Free Access
                </Link>
              )}
            </div>

            {/* Accelerator tier */}
            <div className="bento-card p-8 rounded-xl border-2 border-elite-gold/50 relative flex flex-col">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-elite-gold text-black text-xs font-bold uppercase tracking-widest rounded">
                Most Popular
              </div>
              <h3 className="text-xl font-serif font-bold text-white mb-2">Accelerator Bundle</h3>
              <p className="text-elite-text-muted text-sm mb-6">Full access to all resources</p>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-2xl text-gray-500 line-through">€249</span>
                <span className="text-4xl font-bold text-elite-gold">€49</span>
              </div>
              <ul className="space-y-4 flex-grow mb-8">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-elite-text-muted text-sm">
                    <Check className="w-5 h-5 text-elite-gold shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              {token ? (
                <Link
                  to="/checker"
                  className="pricing-cta-btn block w-full py-3 px-6 bg-elite-gold text-black font-bold text-center rounded hover:bg-elite-gold-dim transition-colors mt-auto"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="pricing-cta-btn block w-full py-3 px-6 bg-elite-gold text-black font-bold text-center rounded hover:bg-elite-gold-dim transition-colors mt-auto"
                >
                  Get Accelerator — €49
                </Link>
              )}
            </div>
          </div>

          <p className="text-center text-elite-text-muted text-xs mt-12">
            Filler content for visual testing. Pricing and features subject to change.
          </p>
        </div>
      </div>
    </div>
  )
}
