/**
 * CHIEPERAI Master Server
 * Integrates Express API routes with Vite developer middleware
 */
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import apiRouter from './services/api';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser for API requests
  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'CHIEPERAI', timestamp: new Date() });
  });

  // Mount Gemini API Router
  app.use('/api', apiRouter);

  // Vite Middleware integration based on environment
  if (process.env.NODE_ENV !== 'production') {
    console.log('Starting server in DEVELOPMENT mode with Vite middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Starting server in PRODUCTION mode...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CHIEPERAI] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start CHIEPERAI server:', error);
});
