import express from 'express';
import { getFAANGQuestionsData } from '../agents/agent8-faang-questions.js';

const router = express.Router();

// GET /api/faang-questions - Get FAANG interview questions
router.get('/', async (req, res) => {
  try {
    const { company, difficulty, type } = req.query;

    const questions = await getFAANGQuestionsData({
      company,
      difficulty,
      type,
    });

    res.json({ questions });
  } catch (error) {
    console.error('Get FAANG questions error:', error);
    res.status(500).json({ error: error.message || 'Failed to load questions' });
  }
});

export default router;
