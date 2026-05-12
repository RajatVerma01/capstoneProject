import express from 'express';
import { config } from '../config.js';
import { upload } from '../middleware/upload.js';
import { extractTextFromFile } from '../utils/pdfParser.js';
import { extractResumeSkills } from '../agents/agent1-resume-skills.js';
import { fetchJobRequirements } from '../agents/agent2-job-requirements.js';
import { buildRoadmap } from '../agents/agent3-roadmap-builder.js';
import { buildTailoredResume } from '../agents/agent4-resume-builder.js';

const router = express.Router();

// In-memory storage for demo purposes
const roadmapStore = new Map();

router.post('/analyze', upload.single('resume'), async (req, res) => {
  try {
    if (!config.geminiApiKey || !config.geminiApiKey.trim()) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not set. Add it to backend/.env and restart the server.',
      });
    }

    const { targetJobTitle } = req.body;
    const file = req.file;

    if (!targetJobTitle || !file) {
      return res.status(400).json({
        error: 'Missing targetJobTitle or resume file',
      });
    }

    console.log('Starting analysis for:', targetJobTitle);

    const resumeText = await extractTextFromFile(file.path);
    if (!resumeText || resumeText.length < 50) {
      return res.status(400).json({
        error: 'Could not extract enough text from resume. Use PDF or TXT.',
      });
    }

    console.log('Resume text extracted, length:', resumeText.length);

    // OPTIMIZED: Run agent1 and agent2 in parallel
    console.log('Running agents 1 and 2 in parallel...');
    const [resumeSkills, jobRequirements] = await Promise.all([
      extractResumeSkills(resumeText),
      fetchJobRequirements(targetJobTitle),
    ]);

    console.log('Agent 1 & 2 complete. Running agent 3...');

    // Agent 3 depends on results from 1 and 2
    const result = await buildRoadmap({
      resumeSkills,
      jobRequirements,
      targetJobTitle,
    });

    console.log('Agent 3 complete.');

    // Store in memory
    const id = `roadmap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    roadmapStore.set(id, {
      id,
      targetJobTitle,
      resumeText: resumeText.slice(0, 5000),
      resumeSkills,
      jobRequirements,
      result,
      progress: { completedPhaseIndices: [] },
      allPhasesCompleted: false,
      createdAt: new Date().toISOString(),
    });

    console.log('Analysis complete! ID:', id);

    res.json({
      id,
      targetJobTitle,
      result,
      progress: { completedPhaseIndices: [] },
    });
  } catch (err) {
    console.error('Roadmap analyze error:', err);
    res.status(500).json({
      error: err.message || 'Analysis failed. Please try again.',
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const doc = roadmapStore.get(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    
    const { resumeText: _, ...rest } = doc;
    res.json({
      ...rest,
      progress: doc.progress || { completedPhaseIndices: [] },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/progress', async (req, res) => {
  try {
    const { completedPhaseIndices } = req.body;
    if (!Array.isArray(completedPhaseIndices)) {
      return res.status(400).json({ error: 'completedPhaseIndices must be an array' });
    }
    
    const doc = roadmapStore.get(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    
    const phases = doc.result?.roadmap?.phases || [];
    const valid = completedPhaseIndices.filter(
      (i) => typeof i === 'number' && i >= 0 && i < phases.length
    );
    const unique = [...new Set(valid)].sort((a, b) => a - b);
    
    doc.progress = { completedPhaseIndices: unique };
    doc.allPhasesCompleted = unique.length === phases.length;
    
    roadmapStore.set(req.params.id, doc);
    
    res.json({
      id: doc.id,
      progress: doc.progress,
      allPhasesCompleted: doc.allPhasesCompleted,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/build-resume', async (req, res) => {
  try {
    if (!config.geminiApiKey || !config.geminiApiKey.trim()) {
      return res.status(503).json({ error: 'GEMINI_API_KEY is not set.' });
    }
    
    const doc = roadmapStore.get(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    
    if (!doc.allPhasesCompleted) {
      return res.status(403).json({
        error: 'Complete all learning phases to unlock the Resume Builder.',
      });
    }
    
    const phases = doc.result?.roadmap?.phases || [];
    const completedIndices = doc.progress?.completedPhaseIndices || [];
    const newSkillsFromPhases = [];
    
    completedIndices.forEach((i) => {
      const phase = phases[i];
      if (phase?.skills) {
        phase.skills.forEach((s) => {
          const name = typeof s === 'string' ? s : s?.name;
          if (name) newSkillsFromPhases.push(name);
        });
      }
    });
    
    const originalSkills = doc.result?.resumeSummary?.skills || [];
    const built = await buildTailoredResume({
      originalResumeText: doc.resumeText,
      targetJobTitle: doc.targetJobTitle,
      newSkillsFromPhases: [...new Set(newSkillsFromPhases)],
      originalSkills,
    });
    
    res.json(built);
  } catch (err) {
    console.error('Build resume error:', err);
    res.status(500).json({ error: err.message || 'Failed to build resume' });
  }
});

export default router;
