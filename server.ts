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

  // Explicit route for Google Search Console Verification
  app.get('/google15ac6785dcdf054c.html', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send('google-site-verification: google15ac6785dcdf054c.html');
  });

  // lightweight Google OAuth callback route
  app.get(['/auth/callback', '/auth/callback/'], (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>CHIEPERAI Authentication</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #09090b;
            color: #f4f4f5;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
          }
          .container {
            text-align: center;
            padding: 2rem;
            border-radius: 1rem;
            background-color: #18181b;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          }
          .spinner {
            border: 3px solid rgba(255,255,255,0.1);
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border-left-color: #4f8cff;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
          }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="spinner"></div>
          <p id="status">Menghubungkan ke CHIEPERAI...</p>
        </div>
        <script>
          // Parse parameters from hash fragment
          const hash = window.location.hash.substring(1);
          const params = new URLSearchParams(hash);
          const accessToken = params.get('access_token');
          const error = params.get('error');

          if (error) {
            document.getElementById('status').innerText = 'Gagal melakukan autentikasi: ' + error;
            setTimeout(() => window.close(), 3000);
          } else if (accessToken) {
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', accessToken: accessToken }, '*');
              document.getElementById('status').innerText = 'Autentikasi berhasil! Menutup jendela...';
              setTimeout(() => window.close(), 800);
            } else {
              document.getElementById('status').innerText = 'Autentikasi berhasil! Mengalihkan...';
              window.location.href = '/';
            }
          } else {
            document.getElementById('status').innerText = 'Tidak ada token ditemukan.';
            setTimeout(() => window.close(), 3000);
          }
        </script>
      </body>
      </html>
    `);
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
