
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { boardroomChat, me, normalizeAuthUser } from '../api';
import { ELITE_SKILLS_GET_ACCESS_LABEL, ELITE_SKILLS_WHATSAPP } from '../socialLinks';
import { Send, Briefcase } from 'lucide-react';
import { useAuth } from '../state/AuthContext';
import { FREE_BOARDROOM_AI_MESSAGES } from '../lib/planLimits';

const STORAGE_KEY = 'boardroom_guest_sent';

type LimitKind = 'guest' | 'plan';

interface Message {
  role: 'user' | 'model';
  text: string;
  limitKind?: LimitKind;
}

function getGuestSentCount(): number {
  try {
    return parseInt(sessionStorage.getItem(STORAGE_KEY) || '0', 10);
  } catch {
    return 0;
  }
}

const AIChatSimulator: React.FC = () => {
  const { token, user, patchUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Welcome to the boardroom. I'm a Senior MD at an Elite Boutique. Let's see if you can handle a technical question. Ready?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [guestCount, setGuestCount] = useState(() => getGuestSentCount());
  const scrollRef = useRef<HTMLDivElement>(null);

  const guestSentCount = token ? 0 : guestCount;
  const boardroomRemaining = user?.boardroomRemaining;
  const hasBoardroomCap = Boolean(token) && boardroomRemaining !== null && boardroomRemaining !== undefined;
  const hitLimitGuest = !token && guestSentCount >= FREE_BOARDROOM_AI_MESSAGES;
  const hitLimitPlan = hasBoardroomCap && typeof boardroomRemaining === 'number' && boardroomRemaining <= 0;
  const hitLimit = hitLimitGuest || hitLimitPlan;

  useEffect(() => {
    if (token) {
      sessionStorage.removeItem(STORAGE_KEY);
      setGuestCount(0);
    } else {
      setGuestCount(getGuestSentCount());
    }
  }, [token]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    if (hitLimit) return;
    const currentCount = getGuestSentCount();
    if (!token && currentCount >= FREE_BOARDROOM_AI_MESSAGES) return;
    if (token && hasBoardroomCap && typeof boardroomRemaining === 'number' && boardroomRemaining <= 0) return;

    const userMessage = input;
    if (!token) {
      const next = currentCount + 1;
      sessionStorage.setItem(STORAGE_KEY, String(next));
      setGuestCount(next);
    }
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    const history = messages.map(m => ({ role: m.role, text: m.text }));
    try {
      const data = await boardroomChat({ userMessage, history });
      setMessages(prev => [...prev, { role: 'model', text: data.response || 'Interesting response. Next question.' }]);
      if (token && data.boardroomRemaining !== undefined) {
        patchUser({ boardroomRemaining: data.boardroomRemaining })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Request failed';
      const isQuota =
        msg.includes('free_plan_limit') ||
        msg.includes('429') ||
        /free plan includes \d+ ai boardroom/i.test(msg) ||
        /trial messages/i.test(msg);
      if (!token && (isQuota || msg.includes('429'))) {
        sessionStorage.setItem(STORAGE_KEY, String(FREE_BOARDROOM_AI_MESSAGES));
        setGuestCount(FREE_BOARDROOM_AI_MESSAGES);
      }
      if (token && hasBoardroomCap && isQuota) {
        patchUser({ boardroomRemaining: 0 })
      }
      if (token) {
        void me()
          .then((d) => patchUser(normalizeAuthUser(d.user)))
          .catch(() => {})
      }
      const limitKind: LimitKind = token ? 'plan' : 'guest';
      setMessages(prev => [...prev, { role: 'model', text: '', limitKind }]);
    }
    setIsLoading(false);
  };

  return (
    <div className="relative mx-auto flex w-full max-w-3xl flex-col overflow-hidden rounded-lg bento-card boardroom-chat p-4 sm:p-6 md:p-10">
      <div className="mb-3 flex shrink-0 items-center gap-3 border-b border-white/10 pb-3 sm:mb-6 sm:pb-4">
        <div className="rounded-full bg-elite-gold/10 p-2">
          <Briefcase className="h-5 w-5 text-elite-gold" />
        </div>
        <div>
          <h3 className="font-serif text-lg text-white">Senior MD Boardroom Simulation</h3>
          <p className="text-[10px] uppercase tracking-widest text-elite-text-muted">Live Stress Test</p>
        </div>
      </div>

      <div ref={scrollRef} className="mb-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar sm:mb-6 sm:space-y-4 sm:pr-2">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-lg p-3 text-sm sm:max-w-[80%] sm:p-4 ${
                msg.role === 'user'
                  ? 'ml-2 border border-elite-gold/20 bg-elite-gold/10 text-white sm:ml-12'
                  : 'mr-2 border border-white/10 bg-white/5 text-gray-300 sm:mr-12'
              }`}
            >
              <span
                className={`mb-1 block text-[10px] font-bold uppercase tracking-widest ${
                  msg.role === 'user' ? 'text-right text-elite-gold' : 'text-elite-text-muted'
                }`}
              >
                {msg.role === 'user' ? 'Candidate' : 'Senior MD'}
              </span>
              <p className={msg.role === 'model' && !msg.limitKind ? 'italic' : ''}>
                {msg.limitKind === 'guest' ? (
                  <>
                    Trial complete.{' '}
                    <Link to="/login" className="font-semibold text-elite-gold underline hover:text-elite-gold-dim">
                      Create a free account
                    </Link>
                    {' '}for {FREE_BOARDROOM_AI_MESSAGES} more boardroom messages, or{' '}
                    <a
                      href={ELITE_SKILLS_WHATSAPP}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-elite-gold underline hover:text-elite-gold-dim"
                    >
                      {ELITE_SKILLS_GET_ACCESS_LABEL}
                    </a>
                    {' '}for unlimited boardroom, ATS checker, resume creator, and full strategy vault.
                  </>
                ) : msg.limitKind === 'plan' ? (
                  <>
                    You&apos;ve used all boardroom messages on your {user?.planLabel ?? 'current'} plan.{' '}
                    <a
                      href={ELITE_SKILLS_WHATSAPP}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-elite-gold underline not-italic hover:text-elite-gold-dim"
                    >
                      {ELITE_SKILLS_GET_ACCESS_LABEL}
                    </a>
                    {' '}to upgrade.
                  </>
                ) : (
                  msg.text
                )}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="mr-2 w-full max-w-[85%] rounded-lg border border-white/10 bg-white/5 p-3 sm:mr-12 sm:max-w-[60%] sm:p-4">
              <div className="shimmer h-4 w-full rounded" />
            </div>
          </div>
        )}
      </div>

      {hitLimit && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-black/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="limit-popup-title"
        >
          <div className="mx-4 w-full max-w-sm rounded-lg border border-elite-gold/40 bg-elite-gray p-8 text-center shadow-xl">
            <p id="limit-popup-title" className="mb-2 font-serif text-xl font-bold text-white">
              Conversation locked
            </p>
            <p className="mb-6 text-sm leading-relaxed text-elite-text-muted">
              {hitLimitGuest ? (
                <>
                  You&apos;ve used your trial messages.{' '}
                  <Link to="/login" className="font-semibold text-elite-gold underline hover:text-elite-gold-dim">
                    Log in
                  </Link>
                  {' '}or sign up for {FREE_BOARDROOM_AI_MESSAGES} more boardroom runs on a free account, or{' '}
                  <a
                    href={ELITE_SKILLS_WHATSAPP}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-elite-gold underline hover:text-elite-gold-dim"
                  >
                    {ELITE_SKILLS_GET_ACCESS_LABEL}
                  </a>
                  {' '}for <strong className="text-white">Accelerator</strong>: unlimited boardroom, ATS checker, resume creator,
                  and every strategy firm.
                </>
              ) : (
                <>
                  Free tier includes {FREE_BOARDROOM_AI_MESSAGES} boardroom messages. You&apos;re at the limit.{' '}
                  <a
                    href={ELITE_SKILLS_WHATSAPP}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-elite-gold underline hover:text-elite-gold-dim"
                  >
                    {ELITE_SKILLS_GET_ACCESS_LABEL}
                  </a>
                  {' '}for <strong className="text-white">Accelerator</strong>: unlimited boardroom, ATS checker, resume creator,
                  and the full strategy vault.
                </>
              )}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              {hitLimitGuest ? (
                <>
                  <Link
                    to="/login"
                    className="inline-block rounded-sm bg-elite-gold px-6 py-3 text-center text-sm font-bold !text-black hover:bg-white hover:!text-black"
                  >
                    Log in or sign up
                  </Link>
                  <a
                    href={ELITE_SKILLS_WHATSAPP}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-sm bg-elite-gold px-6 py-3 text-center text-sm font-bold !text-black hover:bg-white hover:!text-black"
                  >
                    {ELITE_SKILLS_GET_ACCESS_LABEL}
                  </a>
                </>
              ) : (
                <a
                  href={ELITE_SKILLS_WHATSAPP}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block w-full rounded-sm bg-elite-gold px-8 py-3 text-center text-sm font-bold !text-black hover:bg-white hover:!text-black sm:w-auto"
                >
                  {ELITE_SKILLS_GET_ACCESS_LABEL}
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {!hitLimit && (
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Answer the technical question..."
            className="min-w-0 flex-grow rounded-sm border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-elite-gold focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={isLoading}
            className="flex shrink-0 items-center justify-center gap-2 rounded-sm bg-elite-gold px-6 py-3 text-sm font-bold !text-black hover:bg-white hover:!text-black disabled:opacity-60"
          >
            {isLoading ? 'Thinking...' : (
              <>
                <Send className="h-4 w-4" />
                Test Me
              </>
            )}
          </button>
        </div>
      )}

      <p className="mt-2 shrink-0 text-center text-[10px] italic text-gray-500 sm:mt-4">
        Powered by Gemini 3 Flash. Trial: {FREE_BOARDROOM_AI_MESSAGES} messages; free accounts: {FREE_BOARDROOM_AI_MESSAGES}{' '}
        total; Accelerator: unlimited.
      </p>
    </div>
  );
};

export default AIChatSimulator;
