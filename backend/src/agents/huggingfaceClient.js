import { HfInference } from '@huggingface/inference';
import { config } from '../config.js';

let hfClient = null;

function getHfClient() {
  if (!hfClient && config.huggingfaceApiKey) {
    hfClient = new HfInference(config.huggingfaceApiKey);
  }
  return hfClient;
}

/**
 * Generate content using Hugging Face Inference API
 * @param {string} prompt - The prompt to send
 * @param {object} options - Generation options
 * @returns {Promise<string>} - Generated text
 */
export async function generateContent(prompt, options = {}) {
  const client = getHfClient();
  
  if (!client) {
    throw new Error('HUGGINGFACE_API_KEY is not set');
  }

  const maxRetries = options.maxRetries || 3;
  let lastError;

  // Choose model based on task
  const model = options.model || 'mistralai/Mixtral-8x7B-Instruct-v0.1';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await client.textGeneration({
        model: model,
        inputs: prompt,
        parameters: {
          max_new_tokens: options.maxOutputTokens || 4096,
          temperature: options.temperature || 0.7,
          top_p: 0.95,
          repetition_penalty: 1.1,
          return_full_text: false,
        },
      });

      return response.generated_text || '';
    } catch (error) {
      lastError = error;
      console.error(`Hugging Face API error (attempt ${attempt}/${maxRetries}):`, error.message);

      // Check if it's a rate limit or model loading error
      if (error.message?.includes('rate limit') || error.message?.includes('loading')) {
        const retryDelay = error.message?.includes('loading') ? 20000 : 3000 * attempt;
        
        if (attempt < maxRetries) {
          console.log(`⏳ ${error.message?.includes('loading') ? 'Model loading' : 'Rate limit'}. Waiting ${retryDelay / 1000}s before retry...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
      }

      // If not a retryable error or max retries reached, throw
      throw error;
    }
  }

  throw lastError;
}

/**
 * Available Hugging Face models (free tier)
 */
export const HF_MODELS = {
  // Best for general tasks
  MIXTRAL: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
  
  // Fast and good quality
  LLAMA_3_8B: 'meta-llama/Meta-Llama-3-8B-Instruct',
  
  // Lightweight and fast
  MISTRAL_7B: 'mistralai/Mistral-7B-Instruct-v0.2',
  
  // Good for coding
  CODELLAMA: 'codellama/CodeLlama-13b-Instruct-hf',
  
  // Alternative options
  ZEPHYR: 'HuggingFaceH4/zephyr-7b-beta',
  FALCON: 'tiiuae/falcon-7b-instruct',
};
