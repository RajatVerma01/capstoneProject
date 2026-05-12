import { generateContent } from './aiClient.js';

/**
 * Agent 1: Extract skills and experience from resume text.
 * Returns structured JSON: { skills: string[], experience: string, education: string }.
 * OPTIMIZED: Reduced prompt size, faster parsing
 */
export async function extractResumeSkills(resumeText) {
  const prompt = `Extract skills, experience, and education from this resume. Return ONLY valid JSON (no markdown):
{
  "skills": ["skill1", "skill2"],
  "experience": "brief summary",
  "education": "brief summary"
}

Resume:
${resumeText.slice(0, 8000)}`;

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
      skills: Array.isArray(result.skills) ? result.skills : [],
      experience: result.experience || 'Not specified',
      education: result.education || 'Not specified',
    };
  } catch (e) {
    console.error('Agent1 parsing error:', e.message);
    // Return minimal valid structure
    return {
      skills: ['General skills from resume'],
      experience: 'Experience details from resume',
      education: 'Education details from resume',
    };
  }
}
