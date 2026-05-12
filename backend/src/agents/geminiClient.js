import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';

const genAI = config.geminiApiKey
  ? new GoogleGenerativeAI(config.geminiApiKey)
  : null;

export function getModel(name, generationConfig = {}) {
  if (!genAI) throw new Error('GEMINI_API_KEY is not set');
  const modelName = name || config.geminiModel;
  return genAI.getGenerativeModel({ 
    model: modelName,
    generationConfig: {
      temperature: generationConfig.temperature || 0.7,
      maxOutputTokens: generationConfig.maxOutputTokens || 2048,
    }
  });
}

export async function generateContent(prompt, options = {}) {
  const model = getModel(options.model, {
    temperature: options.temperature,
    maxOutputTokens: options.maxOutputTokens || 4096, // Increased default
  });
  
  // Retry logic for rate limits
  const maxRetries = options.maxRetries || 3;
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      lastError = error;
      
      // Check if it's a rate limit error (429)
      if (error.message && error.message.includes('429')) {
        console.log(`⚠️  Rate limit hit. Attempt ${attempt}/${maxRetries}`);
        
        // Extract retry delay from error message if available
        const retryMatch = error.message.match(/retry in ([\d.]+)s/);
        const retryDelay = retryMatch ? parseFloat(retryMatch[1]) * 1000 : 2000 * attempt;
        
        if (attempt < maxRetries) {
          console.log(`⏳ Waiting ${retryDelay / 1000}s before retry...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
      }
      
      // If not a rate limit error or max retries reached, throw
      throw error;
    }
  }
  
  throw lastError;
}
