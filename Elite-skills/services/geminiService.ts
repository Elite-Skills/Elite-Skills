
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (err instanceof Error && err.name === 'AbortError') throw err;
      const errStr = String(err);
      const isRetryable = errStr.includes('503') || errStr.includes('UNAVAILABLE') ||
        errStr.includes('overloaded') || errStr.includes('high demand');
      if (!isRetryable || attempt === maxAttempts) throw err;
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      await sleep(delay);
    }
  }
  throw lastError;
}

export const getMDResponse = async (userMessage: string, history: { role: string, text: string }[]) => {
  const model = 'gemini-3-flash-preview';
  
  const systemInstruction = `
    You are a hard-nosed Senior Managing Director at an elite investment bank (e.g., Goldman Sachs, Lazard, or Rothschild). 
    A candidate is answering a technical finance question. 
    Be brief, professional, and slightly critical. 
    Give them quick feedback on their answer (whether it was technically sound, too verbose, or lacked intuition).
    Then, ask one more deep-dive technical question about valuation (DCF/Comps), M&A math, or accounting (3-statement linking). 
    Limit response to 2-3 sentences max. Maintain an elite, high-stakes persona.
  `;

  const formattedHistory = history.map(h => ({
    role: h.role === 'user' ? 'user' : 'model',
    parts: [{ text: h.text }]
  }));

  try {
    const response = await withRetry(() =>
      ai.models.generateContent({
        model,
        contents: [
          ...formattedHistory,
          { role: 'user', parts: [{ text: userMessage }] }
        ],
        config: {
          systemInstruction,
          temperature: 0.8,
        },
      })
    );
    return response.text;
  } catch (error) {
    console.error("Gemini MD error:", error);
    return "Your answer was insufficient. Try harder. (API temporarily unavailable—please try again.)";
  }
};

export const getStrategyResponse = async (bank: string, signal?: AbortSignal) => {
  const model = 'gemini-3-flash-preview';
  
  const systemInstruction = `
    You are a top Investment Banking Recruitment Consultant. 
    Provide 3 specific, tactical bullet points for an IB internship applicant at the selected firm. 
    Focus on the firm's culture (e.g., Lazard's intellectualism, Goldman's teamwork, Rothschild's family-owned advisory heritage), 
    typical interview style, and key technical focus areas. Professional, elite tone.
    
    Format your response with clear section titles in **bold** (e.g. **Culture & Fit:**, **Interview Style:**, **Technical Focus:**).
    Use double line breaks between paragraphs. Keep each section concise but substantive.
  `;

  try {
    const response = await withRetry(() =>
      ai.models.generateContent({
        model,
        contents: `Provide a recruitment strategy for an internship at: ${bank}`,
        config: {
          systemInstruction,
          ...(signal && { abortSignal: signal }),
        },
      })
    );
    return response.text;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    console.error("Gemini Strategy error:", error);
    throw error;
  }
};
