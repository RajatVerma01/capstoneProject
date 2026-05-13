import React from 'react';
import { BookOpen, Briefcase, TrendingUp, MessageSquare, FileQuestion, Sparkles, ArrowRight, Play } from 'lucide-react';
import './styles/hero.css';
import './styles/features.css';
import './styles/footer.css';

export default function LandingPage({ onSelectFeature }) {
  return (
    <div className="landing-page-modern">
      {/* Navigation Bar */}
      <nav className="hero-nav">
        <div className="nav-container">
          <div className="nav-logo">
            <img src="/logo1.png" alt="Career Accelerator Logo" className="nav-logo-img" />
          </div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#about">About</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={16} />
            <span>AI-Powered Career Platform</span>
          </div>

          <h1 className="hero-title">
            Turn Ambitions into Achievements<br />
            with Smart Career <span className="hero-title-accent">
              <Sparkles size={40} className="sparkle-icon" />
              Tools
            </span>
          </h1>

          <p className="hero-subtitle">
            AI-powered tools to sharpen skills, build confidence, and land your dream role.
          </p>

          <div className="hero-cta">
            <button className="btn-hero-primary" onClick={() => onSelectFeature('skill-gap')}>
              <span>Explore Tools</span>
              <ArrowRight size={20} />
            </button>
            <button className="btn-hero-secondary">
              <Play size={18} />
              <span>Try Free</span>
            </button>
          </div>
        </div>

        {/* Floating Feature Cards */}
        <div className="floating-cards">
          <div className="floating-card card-1" onClick={() => onSelectFeature('ai-interview')}>
            <div className="floating-card-icon">
              <MessageSquare size={24} />
            </div>
            <h3>AI Interview Bot</h3>
            <p>Practice with AI-powered interviews tailored to your resume and target role.</p>
          </div>

          <div className="floating-card card-2" onClick={() => onSelectFeature('skill-gap')}>
            <div className="floating-card-icon">
              <TrendingUp size={24} />
            </div>
            <h3>Skill Gap Analysis</h3>
            <p>Identify missing skills and get a personalized learning roadmap to bridge the gap.</p>
          </div>

          <div className="floating-card card-3" onClick={() => onSelectFeature('faang-questions')}>
            <div className="floating-card-icon">
              <FileQuestion size={24} />
            </div>
            <h3>FAANG Questions</h3>
            <p>Access real interview questions from top tech companies to ace your preparation.</p>
          </div>

          <div className="floating-card card-4" onClick={() => onSelectFeature('job-search')}>
            <div className="floating-card-icon">
              <Briefcase size={24} />
            </div>
            <h3>Smart Job Matching</h3>
            <p>Find jobs that match your skills with AI-powered recommendations and alerts.</p>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="features-grid-section" id="features">
        <div className="section-header">
          <h2>Everything You Need to Succeed</h2>
          <p>Comprehensive tools to accelerate your career journey</p>
        </div>

        <div className="features-grid">
          <div className="feature-grid-card" onClick={() => onSelectFeature('skill-gap')}>
            <div className="feature-grid-icon">
              <TrendingUp size={32} />
            </div>
            <h3>Skill-Gap Analysis</h3>
            <p>Upload your resume and target job title. Get a personalized learning roadmap, track your progress, and build an ATS-optimized resume.</p>
            <ul className="feature-grid-list">
              <li>AI-powered skill extraction</li>
              <li>Customized learning roadmap</li>
              <li>Progress tracking</li>
              <li>Tailored resume builder</li>
            </ul>
            <button className="feature-grid-btn">
              Get Started <ArrowRight size={16} />
            </button>
          </div>

          <div className="feature-grid-card" onClick={() => onSelectFeature('job-search')}>
            <div className="feature-grid-icon">
              <Briefcase size={32} />
            </div>
            <h3>Job Search & Alerts</h3>
            <p>Upload your updated resume to find matching jobs. Set up alerts for FAANG companies and get notified instantly.</p>
            <ul className="feature-grid-list">
              <li>Smart job matching</li>
              <li>FAANG job alerts</li>
              <li>Email notifications</li>
              <li>Real-time updates</li>
            </ul>
            <button className="feature-grid-btn">
              Explore Jobs <ArrowRight size={16} />
            </button>
          </div>

          <div className="feature-grid-card" onClick={() => onSelectFeature('ai-interview')}>
            <div className="feature-grid-icon">
              <MessageSquare size={32} />
            </div>
            <h3>AI Interview Practice</h3>
            <p>Practice real-time interviews with AI. Upload your resume, select a job role, and get personalized questions with detailed feedback.</p>
            <ul className="feature-grid-list">
              <li>Resume-based questions</li>
              <li>Role-specific scenarios</li>
              <li>Real-time chat interface</li>
              <li>Performance reports</li>
            </ul>
            <button className="feature-grid-btn">
              Start Practice <ArrowRight size={16} />
            </button>
          </div>

          <div className="feature-grid-card" onClick={() => onSelectFeature('faang-questions')}>
            <div className="feature-grid-icon">
              <FileQuestion size={32} />
            </div>
            <h3>FAANG Interview Bank</h3>
            <p>Access real interview questions from top tech companies. Browse questions by company, difficulty, and topic.</p>
            <ul className="feature-grid-list">
              <li>Company-specific questions</li>
              <li>Online assessments</li>
              <li>Difficulty levels</li>
              <li>Topic categorization</li>
            </ul>
            <button className="feature-grid-btn">
              Browse Questions <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="modern-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <img src="/logo1.png" alt="Career Accelerator Logo" className="footer-logo-img" />
          </div>
          <p style={{ fontWeight: 600, marginBottom: 'var(--space-3)' }}>Developed by Rajat Verma (2201330100201), Rajeev Patel (2201330100202), Kapil Gangwar (2201330100128), Shivam Kumar (2201330100316)</p>
          <p>Built for B.Tech students — your complete career growth platform</p>
        </div>
      </footer>
    </div>
  );
}
