import { config } from '../config.js';
import { generateContent } from './aiClient.js';

/**
 * Agent 2: Get job requirements for the target role
 * OPTIMIZED: Removed web scraping, faster AI-only approach
 */
export async function fetchJobRequirements(targetJobTitle) {
  const prompt = `List key skills for "${targetJobTitle}" role in 2024-2025. Return ONLY valid JSON (no markdown):
{
  "requiredSkills": ["skill1", "skill2"],
  "niceToHave": ["skill1", "skill2"],
  "summary": "brief role summary"
}`;

  try {
    const text = await generateContent(prompt, { temperature: 0.3, maxOutputTokens: 2048 });
    
    // Remove all markdown code blocks and extra whitespace
    let cleaned = text.trim();
    cleaned = cleaned.replace(/```json\s*/g, '');
    cleaned = cleaned.replace(/```\s*/g, '');
    cleaned = cleaned.replace(/^[^{]*({.*})[^}]*$/s, '$1'); // Extract JSON object
    
    const result = JSON.parse(cleaned);
    
    // Validate and provide defaults
    return {
      requiredSkills: Array.isArray(result.requiredSkills) ? result.requiredSkills : [],
      niceToHave: Array.isArray(result.niceToHave) ? result.niceToHave : [],
      summary: result.summary || `Requirements for ${targetJobTitle} role`,
    };
  } catch (e) {
    console.error('Agent2 parsing error:', e.message);
    // Return minimal valid structure
    return {
      requiredSkills: ['Technical skills', 'Problem solving', 'Communication'],
      niceToHave: ['Additional certifications', 'Industry experience'],
      summary: `Standard requirements for ${targetJobTitle} position`,
    };
  }
}
