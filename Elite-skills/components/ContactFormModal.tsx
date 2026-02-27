import React, { useState } from 'react';
import { X } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ContactFormModal({ isOpen, onClose }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire to backend or email service
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setName('');
      setEmail('');
      setMessage('');
      onClose();
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full max-w-md bg-elite-gray border border-white/10 rounded-xl shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <h3 className="text-xl font-serif font-bold text-white">Contact Us</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-elite-text-muted hover:text-white transition-colors rounded"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="contact-name" className="block text-xs uppercase tracking-widest text-elite-text-muted mb-2">
              Name
            </label>
            <input
              id="contact-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded text-white placeholder:text-gray-500 focus:border-elite-gold focus:outline-none transition-colors"
              placeholder="Your name"
            />
          </div>
          <div>
            <label htmlFor="contact-email" className="block text-xs uppercase tracking-widest text-elite-text-muted mb-2">
              Email
            </label>
            <input
              id="contact-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded text-white placeholder:text-gray-500 focus:border-elite-gold focus:outline-none transition-colors"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="contact-message" className="block text-xs uppercase tracking-widest text-elite-text-muted mb-2">
              Message
            </label>
            <textarea
              id="contact-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={4}
              className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded text-white placeholder:text-gray-500 focus:border-elite-gold focus:outline-none transition-colors resize-none"
              placeholder="How can we help?"
            />
          </div>
          {submitted ? (
            <p className="text-elite-gold text-sm text-center py-2">Thank you! We&apos;ll be in touch soon.</p>
          ) : (
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 border border-white/20 text-white rounded hover:border-elite-gold hover:text-elite-gold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 px-4 bg-elite-gold text-black font-bold rounded hover:bg-elite-gold-dim transition-colors"
              >
                Send
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
