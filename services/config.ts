/**
 * Configuration module for CHIEPERAI services
 */
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

export const CONFIG = {
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  defaultModel: 'gemini-3.5-flash',
  userAgent: 'aistudio-build'
};
