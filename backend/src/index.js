import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import roadmapRoutes from './routes/roadmap.js';
import jobsRoutes from './routes/jobs.js';
import interviewRoutes from './routes/interview.js';
import faangQuestionsRoutes from './routes/faangQuestions.js';
import { uploadDir } from './middleware/upload.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

app.use('/api/roadmap', roadmapRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/faang-questions', faangQuestionsRoutes);

app.get('/api/health', (_, res) => res.json({ ok: true }));

// Start server
if (!config.geminiApiKey || !config.geminiApiKey.trim()) {
  console.error('\n⚠️  GEMINI_API_KEY is not set. Add it to backend/.env and restart.');
  console.error('   Get a key at: https://aistudio.google.com/apikey\n');
}

app.listen(config.port, () => {
  console.log(`✅ Server running at http://localhost:${config.port}`);
  console.log(`📝 Using in-memory storage (no database required)`);
});
