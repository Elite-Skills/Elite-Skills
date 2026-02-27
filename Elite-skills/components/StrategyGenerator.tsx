
import React, { useState, useRef, useEffect } from 'react';
import { fetchStrategy } from '../api';
import { ShieldCheck, Target, ChevronDown } from 'lucide-react';

/** Parses strategy text: **bold** titles, proper paragraphs */
function formatStrategyText(text: string) {
  const paragraphs = text.split(/\n\n+/).filter(Boolean);
  return paragraphs.map((para, i) => {
    const parts = para.split(/(\*\*[^*]+\*\*)/g);
    const formatted = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const title = part.slice(2, -2).replace(/^\s*\*+\s*/, '').trim();
        return <strong key={j} className="text-elite-gold font-semibold">{title}</strong>;
      }
      return part.replace(/^\s*\*+\s*/, '');
    });
    return (
      <p key={i} className="mb-4 text-sm text-white leading-relaxed last:mb-0">
        {formatted}
      </p>
    );
  });
}

const banks = [
  "Lazard (Paris)",
  "Rothschild & Co (London)",
  "Goldman Sachs (M&A)",
  "Morgan Stanley (NYC)",
  "Perella Weinberg Partners",
  "Centerview Partners"
];

const AI_TIRED_MESSAGE = "**The AI is taking a quick break.** It'll be back soon—try again in a moment!";

const isErrorResponse = (text: string) =>
  text.includes('Temporary service limit') || text.includes('high demand') || text.includes('503') || text.includes('taking a quick break');

async function fetchStrategyWithRetry(bank: string, maxAttempts = 2): Promise<string> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { response } = await fetchStrategy(bank);
      if (isErrorResponse(response)) throw new Error(response);
      return response;
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) await new Promise((r) => setTimeout(r, 4000));
    }
  }
  throw lastError;
}

const StrategyGenerator: React.FC = () => {
  const [selectedBank, setSelectedBank] = useState(banks[0]);
  const [strategy, setStrategy] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const strategyCardRef = useRef<HTMLDivElement>(null);
  const cacheRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* Only fetch when user clicks "Build Strategy" - no auto-fetch on mount */

  useEffect(() => {
    if ((strategy || isLoading) && strategyCardRef.current) {
      strategyCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [strategy, isLoading]);

  const handleGenerate = async () => {
    if (cacheRef.current.has(selectedBank)) {
      setStrategy(cacheRef.current.get(selectedBank)!);
      return;
    }
    setIsLoading(true);
    try {
      let response = await fetchStrategyWithRetry(selectedBank);
      if (!response || isErrorResponse(response)) {
        response = await fetchStrategyWithRetry(selectedBank);
      }
      if (response && !isErrorResponse(response)) {
        cacheRef.current.set(selectedBank, response);
        setStrategy(response);
      } else {
        throw new Error('Failed to load');
      }
    } catch (err) {
      setStrategy(AI_TIRED_MESSAGE);
    } finally {
      setIsLoading(false);
    }
  };

  const showOutput = strategy || isLoading;

  return (
    <>
      <div ref={strategyCardRef} className="bento-card col-span-1 p-8 rounded-lg flex flex-col h-full">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-4 h-4 text-elite-gold" />
          <h3 className="text-xl font-serif text-white">✨ AI Strategy Gen</h3>
        </div>
        <p className="text-xs text-elite-text-muted mb-6">Generate a bespoke recruitment strategy for your target firm.</p>
        
        <div className="space-y-4 flex-grow">
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="w-full bg-elite-gray border border-white/10 p-3 text-xs rounded-sm text-elite-white flex items-center justify-between hover:border-elite-gold/50 focus:outline-none focus:border-elite-gold transition-colors"
            >
              <span>{selectedBank}</span>
              <ChevronDown className={`w-4 h-4 text-elite-gold transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-elite-gray border border-white/10 rounded-sm shadow-xl overflow-hidden">
                {banks.map(bank => (
                  <button
                    key={bank}
                    type="button"
                    onClick={() => {
                      setSelectedBank(bank);
                      setIsOpen(false);
                    }}
                    className={`w-full px-3 py-2.5 text-left text-xs transition-colors ${
                      bank === selectedBank
                        ? 'bg-elite-gold/20 text-elite-gold font-medium'
                        : 'text-elite-white hover:bg-white/5 hover:text-elite-gold'
                    }`}
                  >
                    {bank}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full bg-white/10 border border-white/20 text-xs py-3 font-semibold uppercase tracking-widest hover:bg-elite-gold hover:text-black transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? 'Analyzing...' : 'Build Strategy'}
          </button>

          {!showOutput && (
            <div className="bg-black/40 rounded-sm border border-white/5 p-4 min-h-[120px] flex items-center justify-center custom-scrollbar">
              <div className="text-[10px] text-gray-600 flex items-center gap-2">
                <ShieldCheck className="w-3 h-3" />
                Select a firm to see technical hotspots.
              </div>
            </div>
          )}
        </div>
      </div>

      {showOutput && (
        <div className="col-span-1 md:col-span-3">
          <div className="bento-card rounded-xl p-8 border border-white/10 overflow-hidden">
            {isLoading ? (
              <div className="space-y-4 py-4">
                <div className="shimmer h-4 w-full rounded"></div>
                <div className="shimmer h-4 w-4/5 rounded"></div>
                <div className="shimmer h-4 w-full rounded"></div>
                <div className="shimmer h-4 w-3/4 rounded"></div>
                <div className="shimmer h-4 w-5/6 rounded"></div>
              </div>
            ) : strategy ? (
              <div className="custom-scrollbar max-h-[70vh] overflow-y-auto pr-2">
                <p className="mb-6 text-sm text-white/90 leading-relaxed italic">
                  Below are key areas to strengthen and what recruiters at {selectedBank} typically expect. Use these insights to tailor your preparation and stand out in the process.
                </p>
                {formatStrategyText(strategy)}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
};

export default StrategyGenerator;
