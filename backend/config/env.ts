import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

if (process.env.GEMINI_API_KEY !== undefined && !process.env.GEMINI_API_KEY.trim()) {
  delete process.env.GEMINI_API_KEY;
}

console.log('[ENV DEBUG]', {
  cwd: process.cwd(),
  keyExists: 'GEMINI_API_KEY' in process.env,
  keyLoaded: Boolean(process.env.GEMINI_API_KEY),
  keyLength: process.env.GEMINI_API_KEY?.length,
});

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey.trim(),
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}
