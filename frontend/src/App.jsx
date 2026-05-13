import React, { useState, useEffect } from 'react';
import './App.css';
import { useDropzone } from 'react-dropzone';
import { Upload, Target, Loader2, BookOpen } from 'lucide-react';
import { analyzeResume } from './api';
import LandingPage from './LandingPage';
import RoadmapView from './RoadmapView';
import ResumeBuilderView from './ResumeBuilderView';
import JobSearchView from './JobSearchView';
import AIInterviewView from './AIInterviewView';
import FAANGQuestionsView from './FAANGQuestionsView';

export default function App() {
  const [currentFeature, setCurrentFeature] = useState(null); // null, 'skill-gap', 'job-search', 'ai-interview', 'faang-questions'
  const [file, setFile] = useState(null);
  const [targetJobTitle, setTargetJobTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [view, setView] = useState('roadmap');

  // Scroll to top whenever currentFeature or view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentFeature, view]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'], 'application/msword': ['.doc'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    maxFiles: 1,
    onDrop: (accepted) => setFile(accepted[0] || null),
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!file || !targetJobTitle.trim()) {
      setError('Please upload a resume and enter a target job title.');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('targetJobTitle', targetJobTitle.trim());
      const data = await analyzeResume(formData);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setFile(null);
    setTargetJobTitle('');
    setResult(null);
    setView('roadmap');
    setError('');
  }

  function handleBackToLanding() {
    setCurrentFeature(null);
    setFile(null);
    setTargetJobTitle('');
    setResult(null);
    setView('roadmap');
    setError('');
  }

  // Landing page
  if (!currentFeature) {
    return <LandingPage onSelectFeature={setCurrentFeature} />;
  }

  // Job Search feature
  if (currentFeature === 'job-search') {
    return <JobSearchView onBack={handleBackToLanding} />;
  }

  // AI Interview feature
  if (currentFeature === 'ai-interview') {
    return <AIInterviewView onBack={handleBackToLanding} />;
  }

  // FAANG Questions feature
  if (currentFeature === 'faang-questions') {
    return <FAANGQuestionsView onBack={handleBackToLanding} />;
  }

  // Skill-Gap Analysis feature
  return (
    <div className="app">
      <header className="header">
        <button className="btn btn-ghost back-home-btn" onClick={handleBackToLanding}>
          ← Home
        </button>
        <div className="logo">
          <img src="/logo1.png" alt="Career Accelerator Logo" className="header-logo-img" />
          <h1>AI Powered Career Development Platform: Career Accelerator</h1>
        </div>
        <p className="tagline">Upload your resume, set your target role — get a personalized learning path to close the gap.</p>
      </header>

      <main className="main">
        {!result ? (
          <form className="card form-card" onSubmit={handleSubmit}>
            <div className="form-row">
              <label className="label">
                <Target size={18} /> Target job title
              </label>
              <input
                type="text"
                placeholder="e.g. Full Stack Developer at Google"
                value={targetJobTitle}
                onChange={(e) => setTargetJobTitle(e.target.value)}
                className="input"
                disabled={loading}
              />
            </div>

            <div className="form-row">
              <span className="label">
                <Upload size={18} /> Resume (PDF, DOC, or TXT)
              </span>
              <div
                {...getRootProps()}
                className={`dropzone ${isDragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
              >
                <input {...getInputProps()} />
                {file ? (
                  <span className="file-name">{file.name}</span>
                ) : (
                  <span>Drop your resume here or click to browse</span>
                )}
              </div>
            </div>

            {error && <p className="error">{error}</p>}

            <div className="actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={20} className="spin" /> Building your roadmap…
                  </>
                ) : (
                  'Analyze & build roadmap'
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="result-wrap">
            {view === 'resume-builder' ? (
              <ResumeBuilderView
                roadmapId={result.id}
                targetJobTitle={result.targetJobTitle}
                onBack={() => setView('roadmap')}
              />
            ) : (
              <>
                <RoadmapView
                  data={result}
                  onOpenResumeBuilder={() => setView('resume-builder')}
                />
                <button type="button" className="btn btn-ghost" onClick={handleReset}>
                  Start over
                </button>
              </>
            )}
          </div>
        )}
      </main>

      <footer className="footer">
        <p>Developed by Rajat Verma (2201330100201), Rajeev Patel (2201330100202), Kapil Gangwar (2201330100128), Shivam Kumar (2201330100316)</p>
        <p style={{ marginTop: 'var(--space-2)', fontSize: '0.875rem', opacity: 0.8 }}>Built for B.Tech students — bridge the gap between your resume and your dream role.</p>
      </footer>
    </div>
  );
}
