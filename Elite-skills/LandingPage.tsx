import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AIChatSimulator from './components/AIChatSimulator';
import FunnelChart from './components/FunnelChart';
import StrategyGenerator from './components/StrategyGenerator';
import LandingNavbar from './components/LandingNavbar';
import { Calculator, ChevronRight, GraduationCap, TrendingUp, Globe, Award, Instagram, Linkedin } from 'lucide-react';
import { useAuth } from './state/AuthContext';
import { useContact } from './state/ContactContext';
import {
  ELITE_SKILLS_GET_ACCESS_LABEL,
  ELITE_SKILLS_WHATSAPP,
  ELITE_SKILLS_INSTAGRAM,
  ELITE_SKILLS_LINKEDIN,
} from './socialLinks';

/** Landing hero + footer WhatsApp CTAs: bundle wording while keeping the header Get Access label elsewhere. */
const LANDING_ACCELERATOR_WHATSAPP_LABEL = 'Accelerator Bundle';

const LandingPage: React.FC = () => {
  const [salary, setSalary] = useState(120000);
  const { openContact } = useContact();
  const { token } = useAuth();
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.slice(1);
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }, [hash]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen">
      <LandingNavbar />

      {/* Hero Section */}
      <header id="top" className="relative overflow-hidden pt-28 pb-10 md:pt-32 md:pb-20 lg:pt-48 lg:pb-32">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-zinc-900/50 to-transparent opacity-50 -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center lg:text-left">
          <div className="lg:w-2/3">
            <div className="inline-block px-4 py-1.5 mb-6 border border-elite-gold/30 rounded-full bg-elite-gold/5 md:mb-8">
              <span className="text-[10px] uppercase tracking-[0.3em] text-elite-gold font-semibold">Targets: HEC, ESSEC, LBS, Bocconi, Oxford</span>
            </div>
            <h1 className="text-5xl lg:text-8xl font-bold leading-tight mb-6 md:mb-8">
              Secure Your 2026 <br />
              <span className="text-gold-gradient font-serif italic">Investment Banking Offer</span>
            </h1>
            <p className="text-xl text-elite-text-muted mb-8 font-light max-w-2xl leading-relaxed md:mb-12">
              The definitive Elite Skills guide used by students at Europe's top business schools. Now featuring proprietary AI stress-testing and MD-level logic drills.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:gap-6 lg:justify-start">
              {token ? (
                <Link
                  to="/checker"
                  className="px-10 py-5 bg-elite-gold text-black font-bold text-lg rounded-sm hover:bg-white transition-all duration-300 shadow-[0_0_40px_rgba(212,175,55,0.2)] text-center"
                >
                  Go to ATS Dashboard
                </Link>
              ) : (
                <>
                  <a
                    href={ELITE_SKILLS_WHATSAPP}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-3.5 bg-elite-gold text-black font-bold text-sm rounded-sm hover:bg-white transition-all duration-300 shadow-[0_0_40px_rgba(212,175,55,0.2)] text-center md:px-10 md:py-5 md:text-lg"
                  >
                    {LANDING_ACCELERATOR_WHATSAPP_LABEL}
                  </a>
                  <button
                    type="button"
                    onClick={() => scrollToSection('ai-demo')}
                    className="flex w-full items-center justify-center gap-2 rounded-sm border border-white/20 px-5 py-3.5 text-sm font-medium text-white transition-all duration-300 hover:border-elite-gold hover:text-elite-gold sm:w-auto md:px-10 md:py-5 md:text-lg"
                  >
                    Try ✨ AI Simulation{' '}
                    <ChevronRight className="h-4 w-4 shrink-0 md:h-5 md:w-5" aria-hidden />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Features Icons */}
      <section className="py-8 bg-elite-black/50 border-y border-white/5 md:py-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="flex items-center gap-4 text-elite-text-muted">
            <GraduationCap className="w-6 h-6 text-elite-gold opacity-50" />
            <span className="text-[10px] uppercase tracking-widest font-semibold">Tier 1 Pedigree</span>
          </div>
          <div className="flex items-center gap-4 text-elite-text-muted">
            <Globe className="w-6 h-6 text-elite-gold opacity-50" />
            <span className="text-[10px] uppercase tracking-widest font-semibold">Global Dealflow</span>
          </div>
          <div className="flex items-center gap-4 text-elite-text-muted">
            <TrendingUp className="w-6 h-6 text-elite-gold opacity-50" />
            <span className="text-[10px] uppercase tracking-widest font-semibold">Proven ROI</span>
          </div>
          <div className="flex items-center gap-4 text-elite-text-muted">
            <Award className="w-6 h-6 text-elite-gold opacity-50" />
            <span className="text-[10px] uppercase tracking-widest font-semibold">MD Verified</span>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problem" className="border-y border-white/5 bg-elite-gray py-10 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-start gap-8 md:gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
            <div>
              <h2 className="mb-4 font-serif text-4xl md:mb-8 lg:text-5xl">The 0.5% Reality</h2>
              <p className="mb-4 text-lg leading-relaxed text-elite-text-muted md:mb-6 lg:mb-8">
                The "January Window" is closing. Across London, Paris, and Frankfurt, over 10,000 top-tier applicants are competing for fewer than 50 spots at elite boutiques. Technical excellence is no longer a differentiator—it is the baseline requirement for entry.
              </p>
              <div className="border-l-2 border-elite-gold bg-black/60 p-4 shadow-2xl md:p-8">
                <h4 className="mb-3 font-serif text-lg text-elite-gold md:mb-4 md:text-xl">Market Saturation</h4>
                <div className="space-y-3 md:space-y-4">
                  <div className="flex items-center justify-between text-xs md:text-sm">
                    <span className="text-gray-400">Total Applicants</span>
                    <span className="font-mono text-white">10,000+</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                    <div className="h-full w-full bg-white/20"></div>
                  </div>
                  <div className="flex items-center justify-between text-xs md:text-sm">
                    <span className="text-gray-400">Offers Available</span>
                    <span className="font-mono font-bold text-elite-gold">50</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                    <div className="h-full w-[0.5%] bg-elite-gold shadow-[0_0_10px_#D4AF37]"></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bento-card rounded-xl p-4 shadow-inner md:p-8">
              <h3 className="mb-3 text-center text-[10px] uppercase tracking-[0.25em] text-elite-text-muted md:mb-6 md:text-xs md:tracking-[0.3em]">
                Recruitment Funnel Metrics
              </h3>
              <FunnelChart />
            </div>
          </div>
        </div>
      </section>

      {/* AI Simulation Section */}
      <section id="ai-demo" className="bg-elite-black py-10 md:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 text-center md:mb-16">
            <h2 className="mb-3 font-serif text-4xl md:mb-6 lg:text-6xl">Master the Boardroom</h2>
            <p className="mx-auto max-w-2xl text-lg text-elite-text-muted md:text-xl">
              Don't wait for your first Superday to fail. Stress-test your technical intuition against our Senior MD model.
            </p>
          </div>
          <AIChatSimulator />
        </div>
      </section>

      {/* Product Grid */}
      <section id="accelerator" className="bg-elite-gray py-10 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
            <div className="bento-card group relative col-span-1 overflow-hidden rounded-xl p-5 md:col-span-2 md:p-10">
              <div className="absolute top-0 right-0 -z-10 h-32 w-32 bg-elite-gold/5 blur-3xl group-hover:bg-elite-gold/10 transition-colors"></div>
              <h3 className="mb-3 font-serif text-2xl text-white md:mb-4 md:text-3xl">The 2026 Elite Skills Guide</h3>
              <p className="mb-6 text-base leading-relaxed text-elite-text-muted md:mb-10">
                100+ Advanced questions covering DCF, LBO accounting, and M&A math. Not just answers, but the *logic* preferred by elite firms like Centerview and PWP.
              </p>
              <div className="flex flex-col items-center justify-center rounded-lg border border-white/10 bg-black/50 p-5 text-center md:p-10">
                <p className="mb-3 text-base font-medium italic text-white md:mb-4 md:text-xl">
                  &quot;Explain how a $10M write-down affects the three financial statements.&quot;
                </p>
                <div className="h-0.5 w-12 bg-elite-gold/40"></div>
              </div>
            </div>
            
            <StrategyGenerator />
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section id="roi" className="bg-elite-black py-10 md:py-32">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-elite-gold/20 bg-elite-gold/5 px-4 py-1.5 md:mb-8">
             <Calculator className="h-3 w-3 text-elite-gold" />
             <span className="text-[10px] font-bold uppercase tracking-widest text-elite-gold">Perspective</span>
          </div>
          <h2 className="mb-6 font-serif text-4xl md:mb-12 lg:text-5xl">Your Upside</h2>
          <div className="relative rounded-2xl border border-white/10 bg-elite-gray p-4 shadow-2xl sm:p-6 md:p-10">
            <div className="grid grid-cols-1 items-center gap-6 text-left md:grid-cols-2 md:gap-12">
              <div className="space-y-5 md:space-y-8">
                <div>
                  <div className="mb-3 flex items-center justify-between md:mb-4">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-elite-text-muted">Illustrative first-year compensation</label>
                    <span className="font-mono font-bold text-elite-gold">€{salary.toLocaleString()}</span>
                  </div>
                  <input 
                    type="range" 
                    min="60000" 
                    max="160000" 
                    value={salary} 
                    step="5000" 
                    onChange={(e) => setSalary(parseInt(e.target.value))}
                    className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-elite-gold" 
                  />
                  <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-widest text-gray-600">
                    <span>60K</span>
                    <span>110K</span>
                    <span>160K</span>
                  </div>
                </div>
              </div>
              <div className="flex min-w-0 flex-col justify-center overflow-hidden rounded-xl border border-elite-gold/10 bg-elite-gold/5 p-5 text-left sm:p-6 md:p-10">
                <span className="mb-3 text-[10px] font-bold uppercase tracking-[0.4em] text-elite-gold md:mb-4">Why preparation compounds</span>
                <p className="text-sm leading-relaxed text-elite-text-muted">
                  Strong processes stack: sharper technicals, cleaner materials, and less wasted cycles before interviews.
                  Bands like the one you dial in above show why marginal gains in readiness can matter far beyond any fixed sticker price—we focus on shipping outcomes, not quoting numbers here.
                </p>
              </div>
            </div>
          </div>
          
          <div id="checkout" className="mt-8 flex flex-col items-center md:mt-16">
            {token ? (
              <Link
                to="/checker"
                className="inline-block rounded-sm bg-elite-gold px-8 py-4 text-center text-base font-bold text-black shadow-[0_0_40px_rgba(212,175,55,0.4)] transition-all hover:shadow-[0_0_60px_rgba(212,175,55,0.6)] hover:brightness-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-elite-black md:px-16 md:py-6 md:text-xl md:transition-transform md:hover:scale-[1.02]"
              >
                Go to Dashboard
              </Link>
            ) : (
              <a
                href={ELITE_SKILLS_WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-sm bg-elite-gold px-8 py-4 text-center text-base font-bold text-black shadow-[0_0_40px_rgba(212,175,55,0.4)] transition-all hover:shadow-[0_0_60px_rgba(212,175,55,0.6)] hover:brightness-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-elite-black md:px-16 md:py-6 md:text-xl md:transition-transform md:hover:scale-[1.02]"
              >
                {LANDING_ACCELERATOR_WHATSAPP_LABEL}
              </a>
            )}
            <p className="mt-4 max-w-xl text-center text-xs uppercase tracking-[0.3em] text-gray-600 md:mt-6">
              Opens WhatsApp for the Accelerator bundle — same {ELITE_SKILLS_GET_ACCESS_LABEL} link as the header
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-black py-10 md:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-10 grid grid-cols-1 gap-8 md:mb-16 md:grid-cols-4 md:gap-12">
            <div className="col-span-1 md:col-span-2">
              <span className="mb-4 block text-2xl font-serif font-bold tracking-widest text-white md:mb-6">
                <span className="flex flex-col items-start leading-tight md:hidden">
                  <span className="text-elite-gold">ELITE</span>
                  <span>SKILLS</span>
                </span>
                <span className="hidden md:inline">
                  <span className="text-elite-gold">ELITE</span> SKILLS
                </span>
              </span>
              <p className="text-elite-text-muted text-sm max-w-sm leading-relaxed">
                The leading professional training resource for aspiring bulge bracket and elite boutique investment bankers. Created by alumni from HEC, LBS, and Goldman Sachs.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4 md:mt-8">
                <span className="text-white text-[10px] uppercase tracking-widest font-bold w-full sm:w-auto">Follow</span>
                <a
                  href={ELITE_SKILLS_INSTAGRAM}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-elite-text-muted text-xs hover:text-elite-gold transition-colors"
                >
                  <Instagram className="w-4 h-4" aria-hidden />
                  Instagram
                </a>
                <a
                  href={ELITE_SKILLS_LINKEDIN}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-elite-text-muted text-xs hover:text-elite-gold transition-colors"
                >
                  <Linkedin className="w-4 h-4" aria-hidden />
                  LinkedIn
                </a>
              </div>
            </div>
            <div>
              <h4 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-white md:mb-6">Resources</h4>
              <ul className="space-y-3 text-xs text-elite-text-muted md:space-y-4">
                <li><button onClick={() => scrollToSection('problem')} className="hover:text-white transition-colors">Success Rates</button></li>
                <li><button onClick={() => scrollToSection('accelerator')} className="hover:text-white transition-colors">Technical Vault</button></li>
                <li><button onClick={() => scrollToSection('ai-demo')} className="hover:text-white transition-colors">MD Simulation</button></li>
                <li><button onClick={openContact} className="hover:text-elite-gold transition-colors">Contact Us</button></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-white md:mb-6">Legal</h4>
              <ul className="space-y-3 text-xs text-elite-text-muted md:space-y-4">
                <li><button className="hover:text-white transition-colors">Privacy Policy</button></li>
                <li><button className="hover:text-white transition-colors">Terms of Service</button></li>
                <li><button className="hover:text-white transition-colors">Refund Policy</button></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col items-center justify-between border-t border-white/5 pt-6 text-[10px] uppercase tracking-widest text-gray-700 md:flex-row md:pt-8">
            <div>© 2026 ELITE SKILLS ACCELERATOR. ALL RIGHTS RESERVED.</div>
            <div className="mt-4 md:mt-0 flex gap-8">
              <span>Verified Secure</span>
              <span>Finance Career Partners</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
