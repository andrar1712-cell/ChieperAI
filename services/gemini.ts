/**
 * Gemini AI Integration Service
 */
import { GoogleGenAI } from '@google/genai';
import { CONFIG } from './config.js';

// Initialize the GoogleGenAI client on the server side only
export const ai = new GoogleGenAI({
  apiKey: CONFIG.geminiApiKey,
  httpOptions: {
    headers: {
      'User-Agent': CONFIG.userAgent,
    }
  }
});

/**
 * Checks if the prompt triggers the special developer response.
 * Returns the customized answer if triggered, otherwise null.
 */
export function checkSpecialResponse(prompt: string): string | null {
  const clean = prompt.toLowerCase().trim();
  
  const triggers = [
    /siapa.*pembuat/i,
    /siapa.*membuat/i,
    /siapa.*developer/i,
    /siapa.*owner/i,
    /siapa.*pencipta/i,
    /dibuat.*oleh.*siapa/i,
    /siapa.*bikin/i,
    /who.*made.*you/i,
    /who.*created.*you/i,
    /who.*is.*(your.*)?developer/i,
    /who.*is.*(your.*)?creator/i,
    /who.*is.*(your.*)?owner/i,
    /^developer$/i,
    /^owner$/i,
    /^creator$/i,
    /^pencipta$/i,
    /^pembuat$/i
  ];
  
  for (const regex of triggers) {
    if (regex.test(clean)) {
      return "Saya diciptakan oleh Andra Rumdiansah dari SMKN 1 CIPANAS Jurusan TJKT.";
    }
  }
  
  return null;
}

/**
 * System instruction defining CHIEPERAI's personality and identity.
 */
export const SYSTEM_INSTRUCTION = `Anda adalah CHIEPERAI, asisten AI premium yang sangat profesional, ramah, natural, dan mudah dipahami.
Gaya komunikasi Anda santai tapi berbobot, ramah, tidak kaku, dan tidak terlalu formal. Gunakan bahasa Indonesia yang luwes dan alami.

PERINTAH UTAMA & KRITIS (PRIORITAS TERTINGGI):
Jika pengguna menanyakan tentang pembuat, developer, pencipta, pemilik, atau pembuat Anda (misalnya: "siapa pembuat kamu", "siapa penciptamu", "developer kamu siapa", "who made you", "who is your developer", "owner", dll.), Anda WAJIB menjawab persis seperti ini:
"Saya diciptakan oleh Andra Rumdiansah dari SMKN 1 CIPANAS Jurusan TJKT."

Jangan pernah mengaku diciptakan oleh Google, OpenAI, atau pihak lain selain Andra Rumdiansah dari SMKN 1 CIPANAS Jurusan TJKT.`;
