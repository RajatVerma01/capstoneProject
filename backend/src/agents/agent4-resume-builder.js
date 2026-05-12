import { generateContent } from './aiClient.js';

/**
 * Agent 4: Generate a tailored resume with new skills highlighted and an ATS-friendly score.
 * Called only after user has completed all roadmap phases.
 */
export async function buildTailoredResume({
  originalResumeText,
  targetJobTitle,
  newSkillsFromPhases,
  originalSkills,
}) {
  console.log('\n========================================');
  console.log('📄 RESUME BUILDER - Agent 4');
  console.log('========================================');
  console.log(`🎯 Target Job: ${targetJobTitle}`);
  console.log(`📋 Original Skills: ${originalSkills?.length || 0} skills`);
  console.log(`✨ New Skills Learned: ${newSkillsFromPhases?.length || 0} skills`);
  console.log('========================================\n');

  const prompt = `You are an expert resume writer and ATS (Applicant Tracking System) specialist.

**Task:** Rewrite and tailor the following resume for the target job, incorporating the new skills the candidate has learned. Make it ATS-optimized and highlight the newly added skills.

**Target job:** ${targetJobTitle}

**Candidate's original skills (from resume):** ${(originalSkills || []).join(', ') || 'Not listed'}

**New skills to add (candidate has completed learning these):** ${(newSkillsFromPhases || []).join(', ') || 'None'}

**Original resume text:**
---
${(originalResumeText || '').slice(0, 15000)}
---

**Instructions:**
1. Produce a complete, polished resume (full text) tailored for "${targetJobTitle}".
2. Integrate the new skills naturally into experience, skills section, or a "Recent Learning" section.
3. Use clear section headings (e.g. Experience, Education, Skills, Projects) and bullet points. Keep it professional and ATS-friendly (no graphics, standard headings).
4. After the resume, provide a brief list of 3–5 "Key highlights" that make this resume strong for this role.
5. Rate the resume's fit for the target job as an ATS match score from 1–100 (integer), considering keyword match and structure.

Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "tailoredResume": "full resume text here with line breaks as \\n",
  "highlights": ["highlight 1", "highlight 2", "highlight 3"],
  "score": 85
}

JSON:`;

  console.log('🤖 Step 1: Sending request to Gemini AI...');
  
  try {
    const text = await generateContent(prompt);
    console.log(`✅ Step 2: Received AI response (${text.length} characters)`);
    
    console.log('🔍 Step 3: Parsing JSON response...');
    
    // Clean up the response - remove markdown code blocks if present
    let cleaned = text.trim();
    
    // Remove markdown code blocks
    cleaned = cleaned.replace(/```json\s*/g, '');
    cleaned = cleaned.replace(/```\s*/g, '');
    cleaned = cleaned.trim();
    
    // Try to find JSON object in the response
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
      console.log('✅ Found JSON object in response');
    }
    
    console.log('📝 Attempting to parse JSON...');
    const parsed = JSON.parse(cleaned);
    
    console.log('✅ Step 4: JSON parsed successfully');
    console.log(`   Resume length: ${parsed.tailoredResume?.length || 0} characters`);
    console.log(`   Highlights: ${parsed.highlights?.length || 0} items`);
    console.log(`   ATS Score: ${parsed.score || 'N/A'}`);
    
    // Process the resume text
    if (parsed.tailoredResume && typeof parsed.tailoredResume === 'string') {
      parsed.tailoredResume = parsed.tailoredResume.replace(/\\n/g, '\n');
    }
    
    const result = {
      tailoredResume: parsed.tailoredResume || '',
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
      score: typeof parsed.score === 'number' ? Math.min(100, Math.max(0, parsed.score)) : 75,
    };
    
    console.log('\n✅ Resume generation completed successfully!');
    console.log('========================================\n');
    
    return result;
    
  } catch (e) {
    console.error('\n❌ Error in resume generation:');
    console.error(`   Error type: ${e.name}`);
    console.error(`   Error message: ${e.message}`);
    
    if (e instanceof SyntaxError) {
      console.error('   This is a JSON parsing error');
      console.error('   The AI response may not be valid JSON');
    }
    
    console.error('========================================\n');
    throw new Error('Failed to generate tailored resume. Please try again.');
  }
}
