import React, { useMemo } from 'react';
import './Interviewer3D.css';
import '../styles/interview.css';

export default function Interviewer3D({ isSpeaking, emotion = 'neutral', textToSpeak = '', messages = [] }) {
  // Determine interview progress based on message count
  const progressSteps = ['Introduction', 'Project Deep Dive', 'Technical Skills', 'Behavioral', 'Conclusion'];
  const currentStepIndex = useMemo(() => {
    const msgCount = messages.length;
    if (msgCount <= 2) return 0;
    if (msgCount <= 6) return 1;
    if (msgCount <= 12) return 2;
    if (msgCount <= 16) return 3;
    return 4;
  }, [messages]);

  // Extract key topics from messages (mock logic for demo)
  const keyTopics = useMemo(() => {
    const topics = new Set(['Resume', 'Experience']);
    messages.forEach(m => {
      if (m.content.toLowerCase().includes('go')) topics.add('Go / Golang');
      if (m.content.toLowerCase().includes('java')) topics.add('Java');
      if (m.content.toLowerCase().includes('system')) topics.add('System Design');
      if (m.content.toLowerCase().includes('database') || m.content.toLowerCase().includes('sql')) topics.add('Databases');
      if (m.content.toLowerCase().includes('api')) topics.add('REST APIs');
    });
    return Array.from(topics).slice(-4);
  }, [messages]);

  return (
    <div className="useful-interviewer-container">
      {/* Background Decor */}
      <div className="useful-bg-glow"></div>

      {/* Main Content Layout */}
      <div className="useful-layout">
        
        {/* Left Section: Interviewer Profile */}
        <div className="useful-profile-section">
          <div className={`useful-avatar-wrapper ${isSpeaking ? 'speaking' : ''}`}>
            <img src="/aditya.png" alt="Aditya Sharma" className="useful-avatar-img" />
            {isSpeaking && (
              <div className="useful-audio-visualizer">
                <span></span><span></span><span></span><span></span><span></span>
              </div>
            )}
          </div>
          <div className="useful-interviewer-info">
            <h3>Aditya Sharma</h3>
            <p>Senior Technical Lead</p>
            <div className="useful-status-tag">
              <span className="dot"></span> {isSpeaking ? 'Speaking...' : 'Listening...'}
            </div>
          </div>
        </div>

        {/* Right Section: Progress & Insights */}
        <div className="useful-insights-section">
          <div className="useful-card">
            <h4>Interview Roadmap</h4>
            <div className="useful-roadmap">
              {progressSteps.map((step, idx) => (
                <div key={step} className={`roadmap-item ${idx <= currentStepIndex ? 'active' : ''} ${idx === currentStepIndex ? 'current' : ''}`}>
                  <div className="roadmap-dot">
                    {idx < currentStepIndex ? '✓' : idx + 1}
                  </div>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="useful-card">
            <h4>Key Topics Discussed</h4>
            <div className="useful-topic-tags">
              {keyTopics.map(topic => (
                <span key={topic} className="topic-tag">{topic}</span>
              ))}
              {keyTopics.length === 0 && <span className="topic-placeholder">Waiting for topics...</span>}
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Visualizer Bar */}
      <div className={`useful-bottom-wave ${isSpeaking ? 'active' : ''}`}>
        <div className="wave-bar"></div>
        <div className="wave-bar"></div>
        <div className="wave-bar"></div>
        <div className="wave-bar"></div>
        <div className="wave-bar"></div>
        <div className="wave-bar"></div>
        <div className="wave-bar"></div>
        <div className="wave-bar"></div>
      </div>
    </div>
  );
}
