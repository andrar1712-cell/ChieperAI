/**
 * Express Router for CHIEPERAI Gemini API Endpoints
 */
import { Router, Request, Response } from 'express';
import { ai, checkSpecialResponse, SYSTEM_INSTRUCTION } from './gemini.js';
import { CONFIG } from './config.js';

const router = Router();

// Helper to delay execution (for simulating streaming of local answers)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * @route POST /api/chat/stream
 * @desc Stream responses from Gemini API with Server-Sent Events (SSE)
 */
router.post('/chat/stream', async (req: Request, res: Response) => {
  const { messages, temperature = 0.7 } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Messages are required and must be an array.' });
    return;
  }

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // Establish stream

  // 1. Check for the last user prompt to see if it triggers the special developer response
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
  const userPrompt = lastUserMessage?.content || '';

  const specialAnswer = checkSpecialResponse(userPrompt);
  if (specialAnswer) {
    // Simulate streaming of the special response for a premium feel
    const words = specialAnswer.split(' ');
    for (let i = 0; i < words.length; i++) {
      const chunk = (i === 0 ? '' : ' ') + words[i];
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      await delay(80); // Smooth typing delay
    }
    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  // 2. Check if API key is configured
  if (!CONFIG.geminiApiKey) {
    const errorMsg = 'Gemini API Key is missing. Silakan konfigurasi API Key Anda di panel Settings > Secrets.';
    res.write(`data: ${JSON.stringify({ error: errorMsg })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  try {
    // Convert client-side message format to Gemini content format
    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    // Call generateContentStream from the modern SDK
    const responseStream = await ai.models.generateContentStream({
      model: CONFIG.defaultModel,
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: temperature,
      }
    });

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Gemini Stream Error:', error);
    const fallbackError = error.message || 'Terjadi kesalahan saat memproses permintaan Anda ke Gemini.';
    res.write(`data: ${JSON.stringify({ error: fallbackError })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

/**
 * @route POST /api/chat/tokens
 * @desc Simple utility to estimate tokens/characters
 */
router.post('/chat/tokens', (req: Request, res: Response) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    res.json({ tokens: 0, characters: 0 });
    return;
  }
  // Rough approximation: 1 token ~ 4 characters for English, slightly less for Indonesian
  const characters = text.length;
  const estimatedTokens = Math.ceil(characters / 3.5);
  res.json({ tokens: estimatedTokens, characters });
});

export default router;
