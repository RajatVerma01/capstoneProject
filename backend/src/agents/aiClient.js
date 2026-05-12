/**
 * Unified AI Client - Supports multiple AI providers
 * Automatically switches between Groq, Gemini, and Hugging Face based on config
 */

import { config } from '../config.js';
import * as groqClient from './groqClient.js';
import * as geminiClient from './geminiClient.js';

/**
 * Generate content using the configured AI provider
 * @param {string} prompt - The prompt to send
 * @param {object} options - Generation options
 * @returns {Promise<string>} - Generated text
 */
export async function generateContent(prompt, options = {}) {
  const provider = config.aiProvider || 'groq';
  
  console.log(`🤖 Using AI provider: ${provider.toUpperCase()}`);
  
  try {
    let text;
    if (provider === 'groq' && config.groqApiKey) {
      text = await groqClient.generateContent(prompt, options);
    } else if (provider === 'gemini' && config.geminiApiKey) {
      text = await geminiClient.generateContent(prompt, options);
    } else {
      // Fallback
      if (config.groqApiKey) {
        text = await groqClient.generateContent(prompt, options);
      } else if (config.geminiApiKey) {
        text = await geminiClient.generateContent(prompt, options);
      } else {
        throw new Error('No AI API key configured.');
      }
    }

    // CLEANUP: Remove markdown code blocks and conversational filler
    if (text) {
      // Remove markdown blocks like ```json ... ``` or ``` ... ```
      text = text.replace(/```(?:json)?\s*([\s\S]*?)```/g, '$1');
      // Trim whitespace
      text = text.trim();
    }
    return text;
  } catch (error) {
    console.error(`❌ ${provider.toUpperCase()} API error:`, error.message);
    
    // Try fallback provider if primary fails
    if (provider === 'groq' && config.geminiApiKey) {
      console.log('⚠️  Groq failed, trying Gemini as fallback...');
      const fallbackText = await geminiClient.generateContent(prompt, options);
      return fallbackText.replace(/```(?:json)?\s*([\s\S]*?)```/g, '$1').trim();
    } else if (provider === 'gemini' && config.groqApiKey) {
      console.log('⚠️  Gemini failed, trying Groq as fallback...');
      const fallbackText = await groqClient.generateContent(prompt, options);
      return fallbackText.replace(/```(?:json)?\s*([\s\S]*?)```/g, '$1').trim();
    }
    
    throw error;
  }
}

/**
 * Get the current AI provider name
 */
export function getCurrentProvider() {
  if (config.aiProvider === 'groq' && config.groqApiKey) return 'Groq';
  if (config.aiProvider === 'gemini' && config.geminiApiKey) return 'Gemini';
  if (config.groqApiKey) return 'Groq (fallback)';
  if (config.geminiApiKey) return 'Gemini (fallback)';
  return 'None';
}
