import React, { useState, useEffect } from 'react';
import { ExternalLink, ChevronDown, ChevronRight, CheckCircle, Circle, CheckSquare, Square, FileText } from 'lucide-react';
import { getRoadmap, updateRoadmapProgress } from './api';
import './styles/roadmap.css';

export default function RoadmapView({ data, onOpenResumeBuilder }) {
  const { id, targetJobTitle, result, progress: initialProgress, allPhasesCompleted: initialAllDone } = data;
  const { skillGap, jobSummary, roadmap, resumeSummary } = result || {};
  const [openPhase, setOpenPhase] = useState(0);
  const [completedPhaseIndices, setCompletedPhaseIndices] = useState(
    () => initialProgress?.completedPhaseIndices ?? []
  );
  const [allPhasesCompleted, setAllPhasesCompleted] = useState(!!initialAllDone);
  const [saving, setSaving] = useState(false);

  const phases = roadmap?.phases || [];
  const totalPhases = phases.length;

  useEffect(() => {
    if (id && totalPhases > 0 && initialProgress?.completedPhaseIndices?.length === 0) {
      getRoadmap(id).then((doc) => {
        if (doc.progress?.completedPhaseIndices?.length != null) {
          setCompletedPhaseIndices(doc.progress.completedPhaseIndices);
          setAllPhasesCompleted(!!doc.allPhasesCompleted);
        }
      }).catch(() => {});
    } else if (initialProgress?.completedPhaseIndices?.length != null) {
      setCompletedPhaseIndices(initialProgress.completedPhaseIndices);
      setAllPhasesCompleted(!!initialAllDone);
    }
  }, [id, initialProgress?.completedPhaseIndices, initialAllDone, totalPhases]);

  useEffect(() => {
    if (totalPhases > 0 && completedPhaseIndices.length === totalPhases) {
      setAllPhasesCompleted(true);
    } else {
      setAllPhasesCompleted(false);
    }
  }, [completedPhaseIndices.length, totalPhases]);

  async function handlePhaseToggle(phaseIndex) {
    const set = new Set(completedPhaseIndices);
    if (set.has(phaseIndex)) set.delete(phaseIndex);
    else set.add(phaseIndex);
    const next = [...set].sort((a, b) => a - b);
    setCompletedPhaseIndices(next);
    if (!id) return;
    setSaving(true);
    try {
      const updated = await updateRoadmapProgress(id, next);
      setAllPhasesCompleted(!!updated.allPhasesCompleted);
    } catch (_) {}
    setSaving(false);
  }

  return (
    <div className="roadmap-view">
      <div className="card roadmap-header">
        <h2>Your roadmap: {targetJobTitle}</h2>
        {roadmap?.estimatedDuration && (
          <p className="meta">Estimated: {roadmap.estimatedDuration}</p>
        )}
        {roadmap?.summary && <p className="summary">{roadmap.summary}</p>}
        {totalPhases > 0 && (
          <p className="progress-meta">
            Progress: {completedPhaseIndices.length} / {totalPhases} phases completed
            {saving && ' • Saving…'}
          </p>
        )}
      </div>

      {resumeSummary?.skills?.length > 0 && (
        <div className="card section">
          <h3>Skills from your resume</h3>
          <div className="skill-tags">
            {(resumeSummary.skills || []).map((s) => (
              <span key={s} className="tag has">
                <CheckCircle size={14} /> {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {skillGap?.length > 0 && (
        <div className="card section gap-section">
          <h3>Skill gap (to learn)</h3>
          <div className="skill-tags">
            {skillGap.map((s) => (
              <span key={s} className="tag gap">
                <Circle size={14} /> {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {jobSummary && (
        <div className="card section">
          <h3>What the role typically demands</h3>
          <p className="job-summary">{jobSummary}</p>
        </div>
      )}

      {phases.length > 0 && (
        <div className="card section phases">
          <h3>Learning phases — mark completed when done</h3>
          {phases.map((phase, i) => (
            <div
              key={i}
              className={`phase ${openPhase === i ? 'open' : ''} ${completedPhaseIndices.includes(i) ? 'completed' : ''}`}
            >
              <div className="phase-header">
                <button
                  type="button"
                  className="phase-check"
                  onClick={() => handlePhaseToggle(i)}
                  title={completedPhaseIndices.includes(i) ? 'Mark incomplete' : 'Mark complete'}
                  aria-label={completedPhaseIndices.includes(i) ? 'Mark incomplete' : 'Mark complete'}
                >
                  {completedPhaseIndices.includes(i) ? (
                    <CheckSquare size={22} className="checked" />
                  ) : (
                    <Square size={22} />
                  )}
                </button>
                <div
                  className="phase-header-main"
                  onClick={() => setOpenPhase(openPhase === i ? -1 : i)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setOpenPhase(openPhase === i ? -1 : i)}
                >
                  {openPhase === i ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  <span className="phase-title">{phase.title}</span>
                  {phase.weeks && <span className="phase-weeks">{phase.weeks}</span>}
                </div>
              </div>
              <div className="phase-body">
                {phase.goals?.length > 0 && (
                  <ul className="goals">
                    {phase.goals.map((g, j) => (
                      <li key={j}>{g}</li>
                    ))}
                  </ul>
                )}
                {phase.skills?.length > 0 && (
                  <div className="phase-skills">
                    {phase.skills.map((sk, j) => (
                      <div key={j} className="phase-skill">
                        <span>{typeof sk === 'object' ? sk.name : sk}</span>
                        {typeof sk === 'object' && sk.link ? (
                          <a href={sk.link} target="_blank" rel="noopener noreferrer" className="link">
                            <ExternalLink size={14} /> Course / docs
                          </a>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
                {phase.tips && <p className="tips">{phase.tips}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {allPhasesCompleted && totalPhases > 0 && (
        <div className="card section unlock-card">
          <h3>Resume Builder unlocked</h3>
          <p>You’ve completed all phases. Get a tailored resume with your new skills and an ATS-friendly score.</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onOpenResumeBuilder?.()}
          >
            <FileText size={20} /> Build my resume
          </button>
        </div>
      )}
    </div>
  );
}
