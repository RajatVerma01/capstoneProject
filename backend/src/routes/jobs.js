import express from 'express';
import multer from 'multer';
import { extractResumeSkills } from '../agents/agent5-job-matcher.js';
import { searchJobsAgent } from '../agents/agent6-job-search.js';
import {
  createJobProfile,
  getJobProfileById,
  createFaangAlert,
  getFaangAlertsByEmail,
  deleteFaangAlertById,
} from '../services/jobService.js';

const router = express.Router();

// Memory storage for Vercel serverless (no disk writes)
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/jobs/upload-resume - Upload resume and extract skills
router.post('/upload-resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No resume file uploaded' });
    }

    // Use buffer directly (no file path in serverless)
    const { skills, experience, education } = await extractResumeSkills(
      req.file.buffer
    );

    // Save job profile (in-memory, no file path needed)
    const profile = await createJobProfile({
      resumePath: req.file.originalname, // Just store filename for reference
      skills,
      experience,
      education,
    });

    res.json({
      id: profile.id,
      skills,
      experience,
      education,
    });
  } catch (error) {
    console.error('Upload resume error:', error);
    res.status(500).json({ error: error.message || 'Failed to process resume' });
  }
});

// POST /api/jobs/search - Search for jobs based on skills and experience
router.post('/search', async (req, res) => {
  try {
    const { skills, experience } = req.body;

    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({ error: 'Skills array is required' });
    }

    const jobs = await searchJobsAgent({ skills, experience });

    res.json({ jobs });
  } catch (error) {
    console.error('Job search error:', error);
    res.status(500).json({ error: error.message || 'Failed to search jobs' });
  }
});

// POST /api/jobs/faang-alerts - Setup FAANG job alerts
router.post('/faang-alerts', async (req, res) => {
  try {
    const { email, resumeId } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!resumeId) {
      return res.status(400).json({ error: 'Resume ID is required' });
    }

    // Get job profile to get skills
    const profile = await getJobProfileById(resumeId);
    if (!profile) {
      return res.status(404).json({ error: 'Job profile not found' });
    }

    const alert = await createFaangAlert({
      email: email.trim(),
      resumeId,
      skills: profile.skills,
      active: true,
    });

    res.json({
      id: alert.id,
      email: alert.email,
      active: alert.active,
    });
  } catch (error) {
    console.error('Setup alerts error:', error);
    res.status(500).json({ error: error.message || 'Failed to setup alerts' });
  }
});

// GET /api/jobs/faang-alerts - Get all FAANG alerts (optional, for admin)
router.get('/faang-alerts', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ error: 'Email query parameter is required' });
    }

    const alerts = await getFaangAlertsByEmail(email);
    res.json({ alerts });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: error.message || 'Failed to get alerts' });
  }
});

// DELETE /api/jobs/faang-alerts/:id - Delete/disable a FAANG alert
router.delete('/faang-alerts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await deleteFaangAlertById(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete alert error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete alert' });
  }
});

export default router;
