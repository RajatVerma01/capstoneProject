import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Search, Loader2, Briefcase, MapPin, DollarSign, Clock, Bell, BellOff, Mail } from 'lucide-react';
import { uploadResumeForJobs, searchJobs, setupFaangAlerts, getFaangAlerts, deleteFaangAlert } from './api';

export default function JobSearchView({ onBack }) {
  const [file, setFile] = useState(null);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [resumeId, setResumeId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [jobs, setJobs] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [userExperience, setUserExperience] = useState('');
  
  // FAANG alerts state
  const [email, setEmail] = useState('');
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [alertId, setAlertId] = useState(null);
  const [alertLoading, setAlertLoading] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'] },
    maxFiles: 1,
    onDrop: (accepted) => setFile(accepted[0] || null),
  });

  async function handleUploadResume(e) {
    e.preventDefault();
    setError('');
    if (!file) {
      setError('Please upload your resume.');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);
      const data = await uploadResumeForJobs(formData);
      setResumeId(data.id);
      setUserSkills(data.skills || []);
      setUserExperience(data.experience || '');
      setResumeUploaded(true);
      // Auto-search for jobs
      handleSearchJobs(data.skills, data.experience);
    } catch (err) {
      setError(err.message || 'Failed to upload resume.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSearchJobs(skills = userSkills, experience = userExperience) {
    setSearchLoading(true);
    setError('');
    try {
      const data = await searchJobs({ skills, experience });
      setJobs(data.jobs || []);
    } catch (err) {
      setError(err.message || 'Failed to search jobs.');
    } finally {
      setSearchLoading(false);
    }
  }

  async function handleSetupAlerts(e) {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!resumeId) {
      setError('Please upload your resume first.');
      return;
    }
    setAlertLoading(true);
    setError('');
    try {
      const data = await setupFaangAlerts({ email: email.trim(), resumeId });
      setAlertId(data.id);
      setAlertsEnabled(true);
    } catch (err) {
      setError(err.message || 'Failed to setup alerts.');
    } finally {
      setAlertLoading(false);
    }
  }

  async function handleDisableAlerts() {
    if (!alertId) return;
    setAlertLoading(true);
    setError('');
    try {
      await deleteFaangAlert(alertId);
      setAlertId(null);
      setAlertsEnabled(false);
      setEmail('');
    } catch (err) {
      setError(err.message || 'Failed to disable alerts.');
    } finally {
      setAlertLoading(false);
    }
  }

  return (
    <div className="job-search-view">
      <div className="view-header">
        <button className="btn btn-ghost" onClick={onBack}>
          ← Back to Home
        </button>
        <h1>Job Search & FAANG Alerts</h1>
        <p>Upload your resume to find matching jobs and setup alerts</p>
      </div>

      {!resumeUploaded ? (
        <form className="card upload-card" onSubmit={handleUploadResume}>
          <h2>Upload Your Resume</h2>
          <p className="card-subtitle">We'll analyze your skills and find matching jobs</p>
          
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

          {error && <p className="error">{error}</p>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={20} className="spin" /> Analyzing resume…
              </>
            ) : (
              <>
                <Upload size={20} /> Upload & Search Jobs
              </>
            )}
          </button>
        </form>
      ) : (
        <div className="job-search-content">
          {/* Skills Summary */}
          <div className="card skills-card">
            <h3>Your Profile</h3>
            <div className="skills-tags">
              {userSkills.slice(0, 10).map((skill, idx) => (
                <span key={idx} className="skill-tag">{skill}</span>
              ))}
            </div>
            {userExperience && (
              <p className="experience-text">Experience: {userExperience}</p>
            )}
          </div>

          {/* FAANG Alerts Setup */}
          <div className="card alerts-card">
            <div className="alerts-header">
              <Bell size={24} />
              <h3>FAANG Job Alerts</h3>
            </div>
            <p className="card-subtitle">
              Get notified when new jobs open at Facebook, Apple, Amazon, Netflix, Google
            </p>

            {!alertsEnabled ? (
              <form onSubmit={handleSetupAlerts} className="alert-form">
                <div className="form-row">
                  <Mail size={18} />
                  <input
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                    disabled={alertLoading}
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={alertLoading}>
                  {alertLoading ? (
                    <>
                      <Loader2 size={20} className="spin" /> Setting up…
                    </>
                  ) : (
                    <>
                      <Bell size={20} /> Enable Alerts
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="alert-active">
                <div className="alert-status">
                  <Bell size={20} className="alert-icon-active" />
                  <span>Alerts active for {email}</span>
                </div>
                <button
                  className="btn btn-ghost"
                  onClick={handleDisableAlerts}
                  disabled={alertLoading}
                >
                  {alertLoading ? (
                    <>
                      <Loader2 size={18} className="spin" /> Disabling…
                    </>
                  ) : (
                    <>
                      <BellOff size={18} /> Disable Alerts
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Job Results */}
          <div className="jobs-section">
            <div className="jobs-header">
              <h2>
                <Briefcase size={24} /> Matching Jobs
              </h2>
              <button
                className="btn btn-secondary"
                onClick={() => handleSearchJobs()}
                disabled={searchLoading}
              >
                {searchLoading ? (
                  <>
                    <Loader2 size={18} className="spin" /> Searching…
                  </>
                ) : (
                  <>
                    <Search size={18} /> Refresh
                  </>
                )}
              </button>
            </div>

            {error && <p className="error">{error}</p>}

            {searchLoading ? (
              <div className="loading-jobs">
                <Loader2 size={32} className="spin" />
                <p>Searching for real, active job listings on the internet...</p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  This may take a moment as we scan LinkedIn, Indeed, and Glassdoor
                </p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="no-jobs">
                <Briefcase size={48} />
                <p>No active job listings found at this moment.</p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  We only show real, active jobs from the internet. Try refreshing or check back later.
                </p>
              </div>
            ) : (
              <div className="jobs-grid">
                {jobs.map((job, idx) => (
                  <div 
                    key={idx} 
                    className={`job-card ${job.url ? 'job-card-clickable' : ''}`}
                    onClick={() => job.url && window.open(job.url, '_blank', 'noopener,noreferrer')}
                    style={job.url ? { cursor: 'pointer' } : {}}
                  >
                    <div className="job-header">
                      <h3>{job.title}</h3>
                      <span className={`company-badge ${job.isFaang ? 'faang' : ''}`}>
                        {job.company}
                      </span>
                    </div>
                    <div className="job-meta">
                      {job.experienceLevel && (
                        <span className={`job-meta-item experience-level ${job.experienceLevel === 'Entry Level' ? 'entry-level' : 'experienced-level'}`}>
                          <Briefcase size={16} /> {job.experienceLevel}
                        </span>
                      )}
                      {job.location && (
                        <span className="job-meta-item">
                          <MapPin size={16} /> {job.location}
                        </span>
                      )}
                      {job.salary && (
                        <span className="job-meta-item">
                          <DollarSign size={16} /> {job.salary}
                        </span>
                      )}
                      {job.postedDate && (
                        <span className="job-meta-item">
                          <Clock size={16} /> {job.postedDate}
                        </span>
                      )}
                    </div>
                    {job.description && (
                      <p className="job-description">{job.description}</p>
                    )}
                    {job.matchScore && (
                      <div className="match-score-container">
                        <div className="match-score">
                          Match: {job.matchScore}%
                        </div>
                        {job.matchCriteria && job.matchCriteria.length > 0 && (
                          <div className="match-criteria">
                            <strong>Why this matches:</strong>
                            <ul>
                              {job.matchCriteria.map((criteria, cIdx) => (
                                <li key={cIdx}>✓ {criteria}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                    {job.url && (
                      <div className="job-card-footer">
                        <span className="view-job-hint">Click to view job →</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
