import { generateContent } from './aiClient.js';
import { extractTextFromFile } from '../utils/pdfParser.js';

/**
 * Agent 5: Extract skills and experience from resume for job matching
 */
export async function extractResumeSkills(resumePath) {
  const resumeText = await extractTextFromFile(resumePath);

  const prompt = `You are a resume analyzer. Extract the following from this resume:
1. Skills (technical and soft skills) - return as array
2. Years of experience (estimate if not explicit) - return as string
3. Education (degrees, institutions) - return as string
4. Resume Summary - A concise paragraph (3-4 sentences) summarizing the candidate's key projects, past roles, and notable achievements from the resume.

Resume:
${resumeText}

Return ONLY valid JSON in this exact format:
{
  "skills": ["skill1", "skill2", ...],
  "experience": "X years" or "Entry level" or "Mid-level" or "Senior",
  "education": "Degree, Institution",
  "resumeSummary": "summary paragraph here..."
}`;

  try {
    const text = await generateContent(prompt, { temperature: 0.3, maxOutputTokens: 2048 });
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      experience: parsed.experience || 'Not specified',
      education: parsed.education || 'Not specified',
      resumeSummary: parsed.resumeSummary || 'Not specified',
    };
  } catch (err) {
    console.error('Failed to parse AI JSON:', err.message);
    return {
      skills: [],
      experience: 'Not specified',
      education: 'Not specified',
      resumeSummary: 'Not specified',
    };
  }
}
