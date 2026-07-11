/**
 * Express Router for CHIEPERAI Gemini API Endpoints
 */
import { Router, Request, Response } from 'express';
import { ai, checkSpecialResponse, SYSTEM_INSTRUCTION } from './gemini.js';
import { CONFIG } from './config.js';
import { dbService } from './db.js';
import fs from 'fs';
import path from 'path';

const router = Router();

// Helper to delay execution (for simulating streaming of local answers)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * @route POST /api/chat/stream
 * @desc Stream responses from Gemini API with Server-Sent Events (SSE)
 */
router.post('/chat/stream', async (req: Request, res: Response) => {
  const { messages, temperature = 0.7, userEmail, isNewSession } = req.body;

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

  const promptTokens = Math.ceil(userPrompt.length / 3.5);
  let totalGeneratedChars = 0;

  const specialAnswer = checkSpecialResponse(userPrompt);
  if (specialAnswer) {
    // Simulate streaming of the special response for a premium feel
    const words = specialAnswer.split(' ');
    for (let i = 0; i < words.length; i++) {
      const chunk = (i === 0 ? '' : ' ') + words[i];
      totalGeneratedChars += chunk.length;
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      await delay(80); // Smooth typing delay
    }
    
    if (userEmail) {
      const totalTokens = promptTokens + Math.ceil(totalGeneratedChars / 3.5);
      dbService.trackUsage(userEmail, totalTokens, 1, isNewSession);
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
    // Convert client-side message format to Gemini content format, including any file attachments
    const contents = messages.map((m: any) => {
      const parts: any[] = [{ text: m.content || '' }];
      
      if (m.files && Array.isArray(m.files)) {
        m.files.forEach((f: any) => {
          if (f.base64 && (f.type.startsWith('image/') || f.type === 'application/pdf')) {
            // Strip data URL scheme prefix if present
            const base64Data = f.base64.includes(',') ? f.base64.split(',')[1] : f.base64;
            parts.push({
              inlineData: {
                mimeType: f.type,
                data: base64Data
              }
            });
          } else if (f.content) {
            // For text/source code files, format and append as text part
            parts.push({
              text: `\n\n--- FILE ATTACHMENT: ${f.name} ---\n${f.content}\n--- END OF FILE ---`
            });
          }
        });
      }

      return {
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: parts
      };
    });

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
        totalGeneratedChars += text.length;
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    if (userEmail) {
      const totalTokens = promptTokens + Math.ceil(totalGeneratedChars / 3.5);
      dbService.trackUsage(userEmail, totalTokens, 1, isNewSession);
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

// Auth API Endpoints
router.post('/auth/register', (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!name || !email) {
    res.status(400).json({ success: false, message: 'Nama dan Email harus diisi!' });
    return;
  }
  const result = dbService.registerUser(name, email, password);
  res.json(result);
});

router.post('/auth/login', (req: Request, res: Response) => {
  const { email, password, isGoogle, name } = req.body;
  if (!email) {
    res.status(400).json({ success: false, message: 'Email harus diisi!' });
    return;
  }
  const result = dbService.loginUser(email, password, isGoogle, name);
  res.json(result);
});

router.post('/auth/google-login', async (req: Request, res: Response) => {
  const { accessToken } = req.body;
  if (!accessToken) {
    res.status(400).json({ success: false, message: 'Access Token is required' });
    return;
  }

  try {
    // Fetch profile from Google
    const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google profile fetch failed:', errorText);
      res.status(400).json({ success: false, message: 'Failed to verify Google access token' });
      return;
    }

    const profile: any = await response.json();
    const { name, email } = profile;

    if (!email) {
      res.status(400).json({ success: false, message: 'Email not returned by Google' });
      return;
    }

    // Authenticate/register user in our local DB
    const loginResult = dbService.loginUser(email, undefined, true, name);

    res.json(loginResult);
  } catch (err: any) {
    console.error('Google Auth error:', err);
    res.status(500).json({ success: false, message: 'Internal server error during Google Authentication' });
  }
});

router.post('/auth/logout', (req: Request, res: Response) => {
  const { email } = req.body;
  if (email) {
    dbService.logoutUser(email);
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

router.post('/auth/heartbeat', (req: Request, res: Response) => {
  const { email } = req.body;
  if (email) {
    dbService.updateHeartbeat(email);
    res.json({ success: true, isOnline: true });
  } else {
    res.status(400).json({ success: false, message: 'Email required' });
  }
});

// Admin / Developer Endpoints
router.get('/admin/stats', (req: Request, res: Response) => {
  const requesterEmail = req.headers['x-admin-email'] as string;
  if (!requesterEmail || requesterEmail !== 'andrar1712@gmail.com') {
    res.status(403).json({ success: false, message: 'Akses ditolak. Hanya untuk developer!' });
    return;
  }
  const stats = dbService.getAdminStats();
  res.json({ success: true, stats });
});

router.get('/admin/users', (req: Request, res: Response) => {
  const requesterEmail = req.headers['x-admin-email'] as string;
  if (!requesterEmail || requesterEmail !== 'andrar1712@gmail.com') {
    res.status(403).json({ success: false, message: 'Akses ditolak. Hanya untuk developer!' });
    return;
  }
  const users = dbService.getUsers();
  res.json({ success: true, users });
});

router.post('/admin/users/add', (req: Request, res: Response) => {
  const requesterEmail = req.headers['x-admin-email'] as string;
  if (!requesterEmail || requesterEmail !== 'andrar1712@gmail.com') {
    res.status(403).json({ success: false, message: 'Akses ditolak!' });
    return;
  }
  const { name, email, password, role } = req.body;
  const result = dbService.registerUser(name, email, password);
  if (result.success && result.user && role === 'developer') {
    // Manually update role if specified as developer
    const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'db.json'), 'utf-8'));
    const userIdx = data.users.findIndex((u: any) => u.id === result.user!.id);
    if (userIdx !== -1) {
      data.users[userIdx].role = 'developer';
      fs.writeFileSync(path.join(process.cwd(), 'data', 'db.json'), JSON.stringify(data, null, 2));
    }
  }
  res.json(result);
});

router.post('/admin/users/toggle-status', (req: Request, res: Response) => {
  const requesterEmail = req.headers['x-admin-email'] as string;
  if (!requesterEmail || requesterEmail !== 'andrar1712@gmail.com') {
    res.status(403).json({ success: false, message: 'Akses ditolak!' });
    return;
  }
  const { userId } = req.body;
  const result = dbService.toggleUserSuspension(userId);
  res.json(result);
});

router.post('/admin/users/delete', (req: Request, res: Response) => {
  const requesterEmail = req.headers['x-admin-email'] as string;
  if (!requesterEmail || requesterEmail !== 'andrar1712@gmail.com') {
    res.status(403).json({ success: false, message: 'Akses ditolak!' });
    return;
  }
  const { userId } = req.body;
  const result = dbService.deleteUser(userId);
  res.json(result);
});

export default router;
