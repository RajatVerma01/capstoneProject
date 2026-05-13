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

// Start server (only for local development)
if (!config.geminiApiKey && !config.groqApiKey) {
  console.error('\n⚠️  No API key set. Add GROQ_API_KEY or GEMINI_API_KEY to backend/.env and restart.');
  console.error('   Get Groq key at: https://console.groq.com/keys');
  console.error('   Get Gemini key at: https://aistudio.google.com/apikey\n');
}

// Only start server if not in serverless environment (Vercel)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(config.port, () => {
    console.log(`✅ Server running at http://localhost:${config.port}`);
    console.log(`📝 Using in-memory storage (no database required)`);
  });
}

// Export for Vercel serverless functions
export default app;
