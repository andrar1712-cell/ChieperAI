/**
 * Shared Type Definitions for CHIEPERAI
 */

export type ThemeType = 'dark' | 'light' | 'auto';

export interface Settings {
  theme: ThemeType;
  fontSize: number; // in pixels (e.g., 14, 16, 18)
  blurStrength: number; // in pixels (e.g., 8, 12, 16, 20)
  glassOpacity: number; // decimal (e.g., 0.08, 0.15, 0.2)
  animationSpeed: number; // seconds or factor (e.g., 0.2, 0.3, 0.5)
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  favorite?: boolean;
  tokens?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  pinned: boolean;
  favorite: boolean;
  draftText?: string;
}

export interface PromptTemplate {
  id: string;
  category: string;
  title: string;
  promptText: string;
  favorite: boolean;
}

export interface TokenUsage {
  totalTokens: number;
  totalMessages: number;
}

export type ActiveTab = 'chat' | 'prompts' | 'about' | 'contact' | 'settings';
