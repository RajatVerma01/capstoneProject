import express from 'express';
import multer from 'multer';
import path from 'path';
import { extractResumeSkills } from '../agents/agent5-job-matcher.js';
import { startInterviewAgent, continueInterviewAgent, generateInterviewReport } from '../agents/agent7-interview.js';
import {
  createInterview,
  getInterviewById,
  addInterviewMessage,
  updateInterviewStatus,
} from '../services/interviewService.js';

const router = express.Router();

// File upload setup - Use memory storage for Vercel
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// POST /api/interview/start - Start a new interview
router.post('/start', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No resume file uploaded' });
    }

    const { jobRole, userName, duration, language = 'English' } = req.body;
    if (!jobRole || !jobRole.trim()) {
      return res.status(400).json({ error: 'Job role is required' });
    }
    if (!userName || !userName.trim()) {
      return res.status(400).json({ error: 'User name is required' });
    }

    const resumePath = req.file.path;
    const interviewDuration = parseInt(duration) || 5; // Default 5 minutes
    
    // Extract skills and summary from resume (pass buffer for Vercel)
    const { skills, experience, resumeSummary } = await extractResumeSkills(
      req.file.buffer || resumePath
    );

    // Start interview with AI
    const { firstQuestion, context } = await startInterviewAgent({
      skills,
      experience,
      resumeSummary,
      jobRole: jobRole.trim(),
      userName: userName.trim(),
      language: language,
    });

    // Create interview in database
    const interview = await createInterview({
      resumePath,
      jobRole: jobRole.trim(),
      userName: userName.trim(),
      duration: interviewDuration,
      skills,
      experience,
      resumeSummary,
      context: { ...context, language },
      messages: [
        { role: 'assistant', content: firstQuestion, timestamp: new Date().toISOString() },
      ],
      status: 'active',
      startTime: new Date().toISOString(),
    });

    res.json({
      interviewId: interview.id,
      messages: interview.messages,
    });
  } catch (error) {
    console.error('Start interview error:', error);
    res.status(500).json({ error: error.message || 'Failed to start interview' });
  }
});

// POST /api/interview/:id/message - Send a message in the interview
router.post('/:id/message', async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const interview = await getInterviewById(id);
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    if (interview.status !== 'active') {
      return res.status(400).json({ error: 'Interview is not active' });
    }

    // Add user message
    await addInterviewMessage(id, {
      role: 'user',
      content: message.trim(),
      timestamp: new Date().toISOString(),
    });

    // Get AI response
    const { response, shouldEnd } = await continueInterviewAgent({
      context: interview.context,
      messages: [...interview.messages, { role: 'user', content: message.trim() }],
      jobRole: interview.jobRole,
    });

    // Add AI response
    await addInterviewMessage(id, {
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString(),
    });

    res.json({
      response,
      shouldEnd,
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: error.message || 'Failed to send message' });
  }
});

// POST /api/interview/:id/end - End interview and generate report
router.post('/:id/end', async (req, res) => {
  try {
    const { id } = req.params;

    const interview = await getInterviewById(id);
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    // Generate report
    const report = await generateInterviewReport({
      messages: interview.messages,
      jobRole: interview.jobRole,
      skills: interview.skills,
    });

    // Update interview status
    await updateInterviewStatus(id, 'completed', report);

    res.json({ report });
  } catch (error) {
    console.error('End interview error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate report' });
  }
});

export default router;
