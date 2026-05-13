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
  const userMessages = messages.filter(m => m.role === 'user');
  const assistantMessages = messages.filter(m => m.role === 'assistant');
  
  // Build a numbered Q&A list for deeper analysis
  const qaPairs = assistantMessages.map((q, i) => {
    const answer = userMessages[i];
    return `Q${i + 1}: ${q.content}\nA${i + 1}: ${answer ? answer.content : '(no answer given)'}`;
  }).join('\n\n');

  const totalQuestions = assistantMessages.length;
  const answeredQuestions = userMessages.length;

  const prompt = `You are a senior technical recruiter evaluating a candidate's mock interview performance.

Role being interviewed for: ${jobRole}
Candidate's stated skills: ${skills.join(', ')}
Total questions asked: ${totalQuestions}
Questions answered: ${answeredQuestions}

--- FULL INTERVIEW Q&A ---
${qaPairs}
--- END OF INTERVIEW ---

PRODUCE A HIGHLY PERSONALIZED, GENUINE EVALUATION. Your report MUST:
1. Reference SPECIFIC things the candidate actually said (quote or paraphrase directly from their answers)
2. Identify gaps between what they claimed to know (skills) and what they demonstrated in answers
3. Evaluate answer depth: Did they give vague or concrete examples? Did they mention real projects/numbers?
4. Note communication style: Were answers coherent, structured, too brief, or too rambling?
5. If the candidate barely answered (< 2 answers), reflect that honestly with a low score

SCORING GUIDE:
- 90-100: Exceptional - concrete examples, deep domain knowledge, confident delivery
- 75-89: Good - solid answers with some specific examples, minor gaps
- 60-74: Average - mostly generic answers, lacks depth or specificity  
- 40-59: Below average - vague, off-topic, or very short answers
- 0-39: Poor - almost no meaningful answers or very limited participation

Return ONLY valid JSON in this EXACT format (no markdown, no extra text):
{
  "overallScore": <number 0-100>,
  "performanceLevel": "<Exceptional|Strong|Good|Average|Below Average|Needs Significant Improvement>",
  "strengths": [
    "<specific strength with example from their answer>",
    "<specific strength with example from their answer>",
    "<specific strength with example from their answer>"
  ],
  "improvements": [
    "<specific weakness referencing what they said or didn't say>",
    "<specific weakness referencing what they said or didn't say>",
    "<specific weakness referencing what they said or didn't say>"
  ],
  "detailedFeedback": "<3 paragraphs: (1) overall impression with specific references to their answers, (2) technical/domain assessment citing what they demonstrated or missed, (3) communication and professionalism assessment>",
  "recommendations": [
    "<actionable, specific recommendation based on a gap you identified>",
    "<actionable, specific recommendation based on a gap you identified>",
    "<actionable, specific recommendation based on a gap you identified>"
  ],
  "questionBreakdown": [
    {"question": "<brief version of Q1>", "score": <0-10>, "comment": "<what was good/bad about this specific answer>"}
  ]
}`;

  try {
    const text = await generateContent(prompt, { temperature: 0.2, maxOutputTokens: 3000 });
    
    // Strip potential markdown code fences
    const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    const report = JSON.parse(jsonMatch[0]);
    // Ensure questionBreakdown exists even if AI omits it
    if (!report.questionBreakdown) report.questionBreakdown = [];
    return report;
  } catch (err) {
    console.error('Failed to parse report JSON:', err.message);
    // Honest fallback reflecting the actual number of questions
    const honestScore = answeredQuestions === 0 ? 0 : Math.min(50, Math.round((answeredQuestions / Math.max(totalQuestions, 1)) * 60));
    return {
      overallScore: honestScore,
      performanceLevel: answeredQuestions === 0 ? 'No Participation' : 'Needs Improvement',
      strengths: answeredQuestions > 0 
        ? ['Participated in the interview session', 'Showed willingness to engage with the interviewer']
        : ['Joined the interview session'],
      improvements: [
        'Provide more detailed and specific answers using the STAR method (Situation, Task, Action, Result)',
        'Back up claims with concrete examples from your real experience',
        'Speak more about your specific projects and measurable outcomes',
      ],
      detailedFeedback: answeredQuestions === 0
        ? 'No responses were recorded during this interview session. The candidate did not provide answers to the questions asked. To get an accurate evaluation, please complete a full interview session.'
        : `The interview evaluation could not be fully processed due to a technical issue. The candidate answered ${answeredQuestions} out of ${totalQuestions} questions asked for the ${jobRole} position. Please retry the interview for a complete evaluation.`,
      recommendations: [
        `Study common ${jobRole} interview questions and prepare structured responses`,
        'Practice the STAR method for behavioral questions',
        'Research the company and role requirements before your next interview',
      ],
      questionBreakdown: [],
    };
  }
}
