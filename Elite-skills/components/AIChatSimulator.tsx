
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMDResponse } from '../services/geminiService';
import { Send, Briefcase } from 'lucide-react';
import { useAuth } from '../state/AuthContext';

const MESSAGE_LIMIT_GUEST = 4;

interface Message {
  role: 'user' | 'model';
  text: string;
}

const AIChatSimulator: React.FC = () => {
  const { token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Welcome to the boardroom. I'm a Senior MD at an Elite Boutique. Let's see if you can handle a technical question. Ready?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const userMessageCount = messages.filter(m => m.role === 'user').length;
  const hitLimit = !token && userMessageCount >= MESSAGE_LIMIT_GUEST;

  const handleSend = async () => {
    if (!input.trim() || isLoading || hitLimit) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    const history = messages.map(m => ({ role: m.role, text: m.text }));
    const response = await getMDResponse(userMessage, history);
    
    setMessages(prev => [...prev, { role: 'model', text: response || 'Interesting response. Next question.' }]);
    setIsLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto bento-card p-6 md:p-10 rounded-lg overflow-hidden flex flex-col h-[500px]">
      <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
        <div className="bg-elite-gold/10 p-2 rounded-full">
            <Briefcase className="w-5 h-5 text-elite-gold" />
        </div>
        <div>
            <h3 className="text-white font-serif text-lg">Senior MD Boardroom Simulation</h3>
            <p className="text-elite-text-muted text-[10px] uppercase tracking-widest">Live Stress Test</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-grow overflow-y-auto mb-6 custom-scrollbar pr-2 space-y-4">
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] p-4 rounded-lg text-sm ${
              msg.role === 'user' 
                ? 'bg-elite-gold/10 border border-elite-gold/20 text-white ml-12' 
                : 'bg-white/5 border border-white/10 text-gray-300 mr-12'
            }`}>
              <span className={`block font-bold text-[10px] uppercase tracking-widest mb-1 ${msg.role === 'user' ? 'text-elite-gold text-right' : 'text-elite-text-muted'}`}>
                {msg.role === 'user' ? 'Candidate' : 'Senior MD'}
              </span>
              <p className={msg.role === 'model' ? 'italic' : ''}>{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 p-4 rounded-lg mr-12 w-full max-w-[60%]">
              <div className="shimmer h-4 w-full rounded"></div>
            </div>
          </div>
        )}
      </div>

      {hitLimit ? (
        <div className="bg-elite-gold/10 border border-elite-gold/30 rounded-sm p-6 text-center">
          <p className="text-white mb-4">You&apos;ve used your {MESSAGE_LIMIT_GUEST} free messages. Sign in for unlimited access.</p>
          <Link
            to="/login"
            className="inline-block bg-elite-gold text-black px-8 py-3 font-bold rounded-sm text-sm hover:bg-white transition-all"
          >
            Log in to continue
          </Link>
        </div>
      ) : (
        <div className="flex gap-4">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Answer the technical question..." 
            className="flex-grow bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-elite-gold transition-colors text-white"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading}
            className="bg-elite-gold text-black px-6 py-3 font-bold rounded-sm text-sm hover:bg-white transition-all flex items-center gap-2"
          >
            {isLoading ? 'Thinking...' : <><Send className="w-4 h-4" /> Test Me</>}
          </button>
        </div>
      )}
      <p className="text-[10px] text-gray-500 mt-4 text-center italic">Powered by Gemini 3 Flash. Unlimited access for Accelerator members.</p>
    </div>
  );
};

export default AIChatSimulator;
