import { generateContent } from './aiClient.js';

/**
 * Agent 7: AI Interview Conductor
 */

export async function startInterviewAgent({ skills, experience, resumeSummary, jobRole, userName, language = 'English' }) {
  const isHindi = language === 'Hindi';
  const languageInstruction = isHindi 
    ? "IMPORTANT: You MUST respond ENTIRELY in Hindi language using Devanagari script. Do not use English."
    : "IMPORTANT: You MUST respond ENTIRELY in English.";

  const prompt = `You are Aditya Sharma, a friendly and warm interviewer for ${jobRole} position.

Candidate: ${userName}
Skills: ${skills.join(', ')}
Experience Level: ${experience}
Resume Summary (Projects & Roles): ${resumeSummary}

Start the interview with a warm, conversational greeting and ONE simple opening question.
${languageInstruction}

TONE: Friendly, encouraging, like talking to a friend
QUESTION STYLE: Simple, easy to answer, conversational
LENGTH: Max 2 short sentences total

Example:
"Hi ${userName}, it's great to meet you! So, tell me a bit about yourself and what got you interested in ${jobRole}?"

OR

"Hello ${userName}, thanks for joining me today! What's your favorite thing about working with [their main skill]?"

Keep it light, friendly, and easy to answer. Make them feel comfortable.

Return ONLY the greeting and question as plain text (no JSON, no labels).`;

  const firstQuestion = await generateContent(prompt, { temperature: 0.9, maxOutputTokens: 512 });

  return {
    firstQuestion,
    context: {
      skills,
      experience,
      resumeSummary,
      jobRole,
      userName,
      questionCount: 1,
    },
  };
}

export async function continueInterviewAgent({ context, messages, jobRole }) {
  // Get the last user answer for analysis
  const lastUserMessage = messages.filter(m => m.role === 'user').slice(-1)[0];
  const lastAnswer = lastUserMessage ? lastUserMessage.content : '';
  
  // Get previous questions to avoid repetition
  const previousQuestions = messages
    .filter(m => m.role === 'assistant')
    .map(m => m.content)
    .join('\n');

  const conversationHistory = messages
    .slice(-4) // Only last 2 exchanges for context
    .map(m => `${m.role === 'user' ? context.userName : 'Aditya'}: ${m.content}`)
    .join('\n');

  const isHindi = context.language === 'Hindi';
  const languageInstruction = isHindi 
    ? "IMPORTANT: You MUST respond ENTIRELY in Hindi language using Devanagari script. Do not use English words."
    : "IMPORTANT: You MUST respond ENTIRELY in English.";

  const prompt = `You are Aditya Sharma, a friendly and supportive interviewer for ${jobRole} position.

Candidate: ${context.userName}
Candidate Skills: ${context.skills.join(', ')}
Experience Level: ${context.experience}
Candidate Resume Summary (Projects & Roles): ${context.resumeSummary || 'Not provided'}

Recent conversation:
${conversationHistory}

CANDIDATE'S LAST ANSWER:
"${lastAnswer}"

PREVIOUS QUESTIONS YOU ASKED:
${previousQuestions}

INSTRUCTIONS:
1. Be warm, friendly, and encouraging (like talking to a friend)
2. Ask ONE simple, easy-to-answer follow-up question
3. Keep it conversational and light
4. FOCUS heavily on their "Resume Summary" (ask about their specific projects, past roles, or achievements mentioned in the summary)
5. Don't ask generic technical deep-dive questions, relate questions to what they actually built or did.
6. Max 2 short sentences
7. Make them feel comfortable and confident
8. ${languageInstruction}

QUESTION STYLE - Use phrases like:
- "That sounds interesting! Can you tell me more about..."
- "Nice! What did you enjoy most about..."
- "Cool! How did you feel when..."
- "Great! What was your favorite part of..."
- "Awesome! What would you do differently next time?"

AVOID:
- Technical jargon
- Complex theoretical questions
- Multiple questions at once
- Long explanations

Keep it simple, friendly, and conversational!

Return ONLY your follow-up question as plain text (no JSON, no labels).`;

  const response = await generateContent(prompt, { temperature: 0.9, maxOutputTokens: 512 });

  return {
    response,
    shouldEnd: false,
  };
}

export async function generateInterviewReport({ messages, jobRole, skills }) {
  const conversationHistory = messages
    .map(m => `${m.role === 'user' ? 'Candidate' : 'Interviewer'}: ${m.content}`)
    .join('\n\n');

  const prompt = `You are an expert interview evaluator. Analyze this interview for the ${jobRole} position.

Candidate Skills: ${skills.join(', ')}

Interview Transcript:
${conversationHistory}

Generate a comprehensive interview report with:
1. Overall Score (0-100)
2. Performance Level (e.g., "Excellent", "Good", "Needs Improvement")
3. Top 3-5 Strengths
4. Top 3-5 Areas for Improvement
5. Detailed Feedback (2-3 paragraphs)
6. 3-5 Specific Recommendations

Return ONLY valid JSON in this exact format:
{
  "overallScore": 85,
  "performanceLevel": "Good",
  "strengths": ["strength1", "strength2", ...],
  "improvements": ["improvement1", "improvement2", ...],
  "detailedFeedback": "detailed paragraph...",
  "recommendations": ["rec1", "rec2", ...]
}`;

  try {
    const text = await generateContent(prompt, { temperature: 0.3, maxOutputTokens: 2048 });
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('Failed to parse report JSON:', err.message);
    // Return fallback report
    return {
      overallScore: 70,
      performanceLevel: 'Good',
      strengths: ['Demonstrated technical knowledge', 'Clear communication'],
      improvements: ['Provide more specific examples', 'Elaborate on technical details'],
      detailedFeedback: 'The candidate showed good understanding of the role requirements and communicated their experience effectively. There is room for improvement in providing more detailed technical explanations.',
      recommendations: ['Practice explaining technical concepts in detail', 'Prepare specific examples from past projects', 'Research common interview questions for this role'],
    };
  }
}
