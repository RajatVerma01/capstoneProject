// Vercel Serverless Function Wrapper for Backend
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import roadmapRoutes from '../backend/src/routes/roadmap.js';
import jobsRoutes from '../backend/src/routes/jobs.js';
import interviewRoutes from '../backend/src/routes/interview.js';
import faangQuestionsRoutes from '../backend/src/routes/faangQuestions.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/roadmap', roadmapRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/faang-questions', faangQuestionsRoutes);

app.get('/api/health', (_, res) => res.json({ ok: true, message: 'API is running on Vercel' }));

// Export for Vercel
export default app;
