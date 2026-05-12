import Groq from 'groq-sdk';
import { config } from '../config.js';

let groqClient = null;

function getGroqClient() {
  if (!groqClient && config.groqApiKey) {
    groqClient = new Groq({
      apiKey: config.groqApiKey,
    });
  }
  return groqClient;
}

/**
 * Generate content using Groq API
 * @param {string} prompt - The prompt to send
 * @param {object} options - Generation options
 * @returns {Promise<string>} - Generated text
 */
export async function generateContent(prompt, options = {}) {
  const client = getGroqClient();

  if (!client) {
    throw new Error('GROQ_API_KEY is not set');
  }

  const maxRetries = options.maxRetries || 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const completion = await client.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: options.model || 'llama-3.3-70b-versatile', // Fast and smart
        temperature: options.temperature || 0.7,
        max_tokens: options.maxOutputTokens || 4096,
        top_p: 1,
        stream: false,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      lastError = error;
      console.error(`Groq API error (attempt ${attempt}/${maxRetries}):`, error.message);

      // Check if it's a rate limit error
      if (error.status === 429 || error.message?.includes('rate limit')) {
        const retryDelay = 2000 * attempt; // Exponential backoff

        if (attempt < maxRetries) {
          console.log(`⏳ Rate limit hit. Waiting ${retryDelay / 1000}s before retry...`);
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
