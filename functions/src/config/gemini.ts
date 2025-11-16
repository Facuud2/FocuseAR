import { defineSecret } from 'firebase-functions/params';
import { GoogleGenAI } from '@google/genai';

export const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');

export const initializeGeminiAI = () => {
  return new GoogleGenAI({});
};
