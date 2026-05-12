import { generateContent } from './aiClient.js';

/**
 * Agent 3: Compute skill gap and build a learning roadmap
 * OPTIMIZED: Removed web scraping, faster roadmap generation
 */
export async function buildRoadmap({
  resumeSkills,
  jobRequirements,
  targetJobTitle,
}) {
  const gap = computeSkillGap(
    resumeSkills.skills || [],
    jobRequirements.requiredSkills || []
  );
  const allToLearn = [
    ...new Set([...(jobRequirements.niceToHave || []), ...gap]),
  ].slice(0, 12);

  const prompt = `Create a concise learning roadmap for "${targetJobTitle}".

Current skills: ${(resumeSkills.skills || []).slice(0, 10).join(', ') || 'None'}
Skills to learn: ${gap.slice(0, 10).join(', ')}

Create 2-3 learning phases. Return ONLY valid JSON (no markdown, no explanations):
{
  "phases": [
    {
      "title": "Phase 1: Foundations",
      "weeks": "1-4",
      "goals": ["Learn basics", "Build foundation"],
      "skills": ["skill1", "skill2"],
      "tips": "Focus on fundamentals"
    }
  ],
  "summary": "Brief roadmap overview",
  "estimatedDuration": "8-12 weeks"
}`;

  try {
    const text = await generateContent(prompt, { temperature: 0.3, maxOutputTokens: 3072 });
    
    // Remove all markdown code blocks and extra whitespace
    let cleaned = text.trim();
    cleaned = cleaned.replace(/```json\s*/g, '');
    cleaned = cleaned.replace(/```\s*/g, '');
    cleaned = cleaned.replace(/^[^{]*({.*})[^}]*$/s, '$1'); // Extract JSON object
    
    const roadmap = JSON.parse(cleaned);

    // Validate structure
    if (!roadmap.phases || !Array.isArray(roadmap.phases)) {
      throw new Error('Invalid roadmap structure: missing phases array');
    }

    // Add generic course links
    roadmap.phases = roadmap.phases.map((phase) => ({
      ...phase,
      skills: (phase.skills || []).map((skill) => ({
        name: skill,
        link: generateCourseLink(skill),
      })),
    }));

    return {
      skillGap: gap,
      jobSummary: jobRequirements.summary || 'Job requirements analysis',
      roadmap,
      resumeSummary: {
        skills: resumeSkills.skills || [],
        experience: resumeSkills.experience || 'Not specified',
        education: resumeSkills.education || 'Not specified',
      },
    };
  } catch (e) {
    console.error('Agent3 parsing error:', e.message);
    console.log('Using fallback roadmap...');
    
    // Fallback roadmap
    return {
      skillGap: gap,
      jobSummary: jobRequirements.summary || 'Job requirements analysis',
      roadmap: createFallbackRoadmap(gap, targetJobTitle),
      resumeSummary: {
        skills: resumeSkills.skills || [],
        experience: resumeSkills.experience || 'Not specified',
        education: resumeSkills.education || 'Not specified',
      },
    };
  }
}

function computeSkillGap(have, required) {
  const haveSet = new Set(have.map((s) => s.toLowerCase().trim()));
  return (required || [])
    .map((s) => s.trim())
    .filter((s) => s && !haveSet.has(s.toLowerCase()));
}

/**
 * Generate a generic course search link
 */
function generateCourseLink(skill) {
  const encoded = encodeURIComponent(`${skill} tutorial course`);
  return `https://www.google.com/search?q=${encoded}`;
}

/**
 * Create a fallback roadmap when AI fails
 */
function createFallbackRoadmap(skills, jobTitle) {
  const half = Math.ceil(skills.length / 2);
  const phase1Skills = skills.slice(0, half);
  const phase2Skills = skills.slice(half);

  return {
    phases: [
      {
        title: 'Phase 1: Core Skills',
        weeks: '1-6',
        goals: ['Master fundamental concepts', 'Build strong foundation'],
        skills: phase1Skills.map(s => ({ name: s, link: generateCourseLink(s) })),
        tips: 'Focus on understanding core concepts before moving forward',
      },
      {
        title: 'Phase 2: Advanced Skills',
        weeks: '7-12',
        goals: ['Apply advanced techniques', 'Build real projects'],
        skills: phase2Skills.map(s => ({ name: s, link: generateCourseLink(s) })),
        tips: 'Practice with real-world projects to solidify your knowledge',
      },
    ],
    summary: `Structured learning path for ${jobTitle} covering ${skills.length} essential skills`,
    estimatedDuration: '12-16 weeks',
  };
}
