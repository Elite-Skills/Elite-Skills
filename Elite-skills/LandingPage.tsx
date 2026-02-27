import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AIChatSimulator from './components/AIChatSimulator';
import FunnelChart from './components/FunnelChart';
import StrategyGenerator from './components/StrategyGenerator';
import LandingNavbar from './components/LandingNavbar';
import ContactFormModal from './components/ContactFormModal';
import { Calculator, ChevronRight, GraduationCap, TrendingUp, Globe, Award } from 'lucide-react';
import { useAuth } from './state/AuthContext';

const LandingPage: React.FC = () => {
  const [salary, setSalary] = useState(120000);
  const [contactOpen, setContactOpen] = useState(false);
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

  const roi = Math.floor((salary - 49) / 49);

  return (
    <div className="min-h-screen">
      <LandingNavbar />

      {/* Hero Section */}
      <header id="top" className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-zinc-900/50 to-transparent opacity-50 -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center lg:text-left">
          <div className="lg:w-2/3">
            <div className="inline-block px-4 py-1.5 mb-8 border border-elite-gold/30 rounded-full bg-elite-gold/5">
              <span className="text-[10px] uppercase tracking-[0.3em] text-elite-gold font-semibold">Targets: HEC, ESSEC, LBS, Bocconi, Oxford</span>
            </div>
            <h1 className="text-5xl lg:text-8xl font-bold leading-tight mb-8">
              Secure Your 2026 <br />
              <span className="text-gold-gradient font-serif italic">Investment Banking Offer</span>
            </h1>
            <p className="text-xl text-elite-text-muted mb-12 font-light max-w-2xl leading-relaxed">
              The definitive Elite Skills guide used by students at Europe's top business schools. Now featuring proprietary AI stress-testing and MD-level logic drills.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
              {token ? (
                <Link
                  to="/checker"
                  className="px-10 py-5 bg-elite-gold text-black font-bold text-lg rounded-sm hover:bg-white transition-all duration-300 shadow-[0_0_40px_rgba(212,175,55,0.2)] text-center"
                >
                  Go to ATS Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-10 py-5 bg-elite-gold text-black font-bold text-lg rounded-sm hover:bg-white transition-all duration-300 shadow-[0_0_40px_rgba(212,175,55,0.2)] text-center"
                  >
                    Accelerator Bundle — <span className="line-through opacity-70">€249</span> <span className="text-black font-extrabold">€49</span>
                  </Link>
                  <button
                    onClick={() => scrollToSection('ai-demo')}
                    className="px-10 py-5 border border-white/20 text-white font-medium text-lg rounded-sm hover:border-elite-gold hover:text-elite-gold transition-all duration-300 flex items-center gap-2"
                  >
                    Try ✨ AI Simulation <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Features Icons */}
      <section className="py-12 bg-elite-black/50 border-y border-white/5">
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
      <section id="problem" className="py-24 bg-elite-gray border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-4xl lg:text-5xl font-serif mb-8">The 0.5% Reality</h2>
              <p className="text-lg text-elite-text-muted mb-8 leading-relaxed">
                The "January Window" is closing. Across London, Paris, and Frankfurt, over 10,000 top-tier applicants are competing for fewer than 50 spots at elite boutiques. Technical excellence is no longer a differentiator—it is the baseline requirement for entry.
              </p>
              <div className="bg-black/60 p-8 border-l-2 border-elite-gold shadow-2xl">
                <h4 className="text-elite-gold font-serif text-xl mb-4">Market Saturation</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Total Applicants</span>
                    <span className="text-white font-mono">10,000+</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-white/20 h-full w-full"></div>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Offers Available</span>
                    <span className="text-elite-gold font-bold font-mono">50</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-elite-gold h-full w-[0.5%] shadow-[0_0_10px_#D4AF37]"></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bento-card p-8 rounded-xl shadow-inner">
               <h3 className="text-center text-xs uppercase tracking-[0.3em] text-elite-text-muted mb-6">Recruitment Funnel Metrics</h3>
               <FunnelChart />
            </div>
          </div>
        </div>
      </section>

      {/* AI Simulation Section */}
      <section id="ai-demo" className="py-32 bg-elite-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-6xl font-serif mb-6">Master the Boardroom</h2>
            <p className="text-xl text-elite-text-muted max-w-2xl mx-auto">Don't wait for your first Superday to fail. Stress-test your technical intuition against our Senior MD model.</p>
          </div>
          <AIChatSimulator />
        </div>
      </section>

      {/* Product Grid */}
      <section id="accelerator" className="py-24 bg-elite-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bento-card col-span-1 md:col-span-2 p-10 relative overflow-hidden group rounded-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-elite-gold/5 blur-3xl -z-10 group-hover:bg-elite-gold/10 transition-colors"></div>
              <h3 className="text-3xl font-serif text-white mb-4">The 2026 Elite Skills Guide</h3>
              <p className="text-base text-elite-text-muted mb-10 leading-relaxed">
                100+ Advanced questions covering DCF, LBO accounting, and M&A math. Not just answers, but the *logic* preferred by elite firms like Centerview and PWP.
              </p>
              <div className="bg-black/50 border border-white/10 rounded-lg p-10 flex flex-col justify-center items-center text-center">
                <p className="text-xl font-medium text-white italic mb-4">"Explain how a $10M write-down affects the three financial statements."</p>
                <div className="h-0.5 w-12 bg-elite-gold/40"></div>
              </div>
            </div>
            
            <StrategyGenerator />
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section id="roi" className="py-32 bg-elite-black">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 border border-elite-gold/20 rounded-full bg-elite-gold/5">
             <Calculator className="w-3 h-3 text-elite-gold" />
             <span className="text-[10px] uppercase tracking-widest text-elite-gold font-bold">Financial Analysis</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-serif mb-12">The Investment Case</h2>
          <div className="bg-elite-gray border border-white/10 p-10 rounded-2xl shadow-2xl relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center text-left">
              <div className="space-y-8">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-elite-text-muted mb-3 font-bold">Investment Cost</label>
                  <div className="text-5xl font-serif">
                    <span className="line-through text-gray-500">€249</span>{' '}
                    <span className="text-elite-gold font-bold">€49</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-elite-text-muted font-bold">Target Salary (First Year)</label>
                    <span className="text-elite-gold font-bold font-mono">€{salary.toLocaleString()}</span>
                  </div>
                  <input 
                    type="range" 
                    min="60000" 
                    max="160000" 
                    value={salary} 
                    step="5000" 
                    onChange={(e) => setSalary(parseInt(e.target.value))}
                    className="w-full accent-elite-gold h-1 bg-white/10 rounded-full appearance-none cursor-pointer" 
                  />
                  <div className="flex justify-between text-[10px] text-gray-600 mt-2 font-mono uppercase tracking-widest">
                    <span>60K</span>
                    <span>110K</span>
                    <span>160K</span>
                  </div>
                </div>
              </div>
              <div className="bg-elite-gold/5 p-10 rounded-xl border border-elite-gold/10 text-center flex flex-col justify-center">
                <span className="text-[10px] uppercase tracking-[0.4em] text-elite-gold mb-4 font-bold">Expected ROI</span>
                <div className="text-7xl font-bold text-white mb-2 tracking-tighter">{roi.toLocaleString()}x</div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">Return on capital invested</p>
              </div>
            </div>
          </div>
          
          <div id="checkout" className="mt-16 flex flex-col items-center">
            {token ? (
              <Link
                to="/checker"
                className="group relative bg-elite-gold text-black font-bold py-6 px-16 rounded-sm text-xl shadow-[0_0_40px_rgba(212,175,55,0.4)] hover:shadow-[0_0_60px_rgba(212,175,55,0.6)] transition-all transform hover:scale-[1.02] inline-block"
              >
                <div className="absolute inset-0 border border-white/20 translate-x-1 translate-y-1 group-hover:translate-x-0 group-hover:translate-y-0 transition-all"></div>
                Go to Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                className="group relative bg-elite-gold text-black font-bold py-6 px-16 rounded-sm text-xl shadow-[0_0_40px_rgba(212,175,55,0.4)] hover:shadow-[0_0_60px_rgba(212,175,55,0.6)] transition-all transform hover:scale-[1.02] inline-block"
              >
                <div className="absolute inset-0 border border-white/20 translate-x-1 translate-y-1 group-hover:translate-x-0 group-hover:translate-y-0 transition-all"></div>
                Get The Elite Skills Bundle — <span className="line-through opacity-70">€249</span> <span className="font-extrabold">€49</span>
              </Link>
            )}
            <p className="mt-6 text-xs text-gray-600 uppercase tracking-[0.3em]">Instant Access • PDF Guide • AI Simulator • Strategy Vault</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <span className="text-2xl font-serif font-bold text-white tracking-widest block mb-6">
                <span className="text-elite-gold">ELITE</span> SKILLS
              </span>
              <p className="text-elite-text-muted text-sm max-w-sm leading-relaxed">
                The leading professional training resource for aspiring bulge bracket and elite boutique investment bankers. Created by alumni from HEC, LBS, and Goldman Sachs.
              </p>
            </div>
            <div>
              <h4 className="text-white text-[10px] uppercase tracking-widest mb-6 font-bold">Resources</h4>
              <ul className="text-elite-text-muted text-xs space-y-4">
                <li><button onClick={() => scrollToSection('problem')} className="hover:text-white transition-colors">Success Rates</button></li>
                <li><button onClick={() => scrollToSection('accelerator')} className="hover:text-white transition-colors">Technical Vault</button></li>
                <li><button onClick={() => scrollToSection('ai-demo')} className="hover:text-white transition-colors">MD Simulation</button></li>
                <li><button onClick={() => setContactOpen(true)} className="hover:text-elite-gold transition-colors">Contact Us</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-[10px] uppercase tracking-widest mb-6 font-bold">Legal</h4>
              <ul className="text-elite-text-muted text-xs space-y-4">
                <li><button className="hover:text-white transition-colors">Privacy Policy</button></li>
                <li><button className="hover:text-white transition-colors">Terms of Service</button></li>
                <li><button className="hover:text-white transition-colors">Refund Policy</button></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center border-t border-white/5 pt-8 text-[10px] text-gray-700 uppercase tracking-widest">
            <div>© 2026 ELITE SKILLS ACCELERATOR. ALL RIGHTS RESERVED.</div>
            <div className="mt-4 md:mt-0 flex gap-8">
              <span>Verified Secure</span>
              <span>Finance Career Partners</span>
            </div>
          </div>
        </div>
      </footer>
      <ContactFormModal isOpen={contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  );
};

export default LandingPage;
