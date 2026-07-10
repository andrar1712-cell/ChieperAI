import express from 'express';
import apiRouter from '../services/api.js';

const app = express();

app.use(express.json());

// API route mapping
app.use('/api', apiRouter);

// Export for Vercel serverless environment
export default app;
