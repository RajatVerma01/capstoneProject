import React, { useState, useEffect } from 'react';
import { FileText, ArrowLeft, Loader2, Download, Star } from 'lucide-react';
import { buildResume } from './api';

export default function ResumeBuilderView({ roadmapId, targetJobTitle, onBack }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!roadmapId) return;
    setLoading(true);
    setError('');
    buildResume(roadmapId)
      .then(setData)
      .catch((err) => setError(err.message || 'Failed to build resume'))
      .finally(() => setLoading(false));
  }, [roadmapId]);

  function handleDownload() {
    if (!data?.tailoredResume) return;
    const blob = new Blob([data.tailoredResume], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tailored-resume-${targetJobTitle?.replace(/\s+/g, '-').slice(0, 30) || 'resume'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="resume-builder-view">
        <div className="card">
          <div className="loading-state">
            <Loader2 size={32} className="spin" />
            <p>Building your tailored resume…</p>
          </div>
        </div>
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          <ArrowLeft size={18} /> Back to roadmap
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="resume-builder-view">
        <div className="card">
          <p className="error">{error}</p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          <ArrowLeft size={18} /> Back to roadmap
        </button>
      </div>
    );
  }

  return (
    <div className="resume-builder-view">
      <div className="card resume-builder-header">
        <h2>Tailored resume for {targetJobTitle}</h2>
        {data?.score != null && (
          <div className="ats-score">
            <Star size={20} />
            <span>ATS match score</span>
            <strong>{data.score}/100</strong>
          </div>
        )}
      </div>

      {data?.highlights?.length > 0 && (
        <div className="card section">
          <h3>Key highlights</h3>
          <ul className="highlights-list">
            {data.highlights.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </div>
      )}

      {data?.tailoredResume && (
        <div className="card section resume-content-card">
          <div className="resume-actions">
            <h3>Your tailored resume</h3>
            <button type="button" className="btn btn-primary" onClick={handleDownload}>
              <Download size={18} /> Download as TXT
            </button>
          </div>
          <pre className="resume-text">{data.tailoredResume}</pre>
        </div>
      )}

      <button type="button" className="btn btn-ghost" onClick={onBack}>
        <ArrowLeft size={18} /> Back to roadmap
      </button>
    </div>
  );
}
