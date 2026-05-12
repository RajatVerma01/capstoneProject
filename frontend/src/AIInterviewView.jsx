import React, { useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2, MessageSquare, Send, FileText, Award, TrendingUp, AlertCircle, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { uploadResumeForInterview, startInterview, sendInterviewMessage, endInterview } from './api';
import Interviewer3D from './components/Interviewer3D';
import VideoCallInterview from './components/VideoCallInterview';

export default function AIInterviewView({ onBack }) {
  const [step, setStep] = useState('setup'); // setup, interview, report
  const [file, setFile] = useState(null);
  const [userName, setUserName] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [duration, setDuration] = useState(5); // in minutes
  const [language, setLanguage] = useState('English'); // English or Hindi
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Interview state
  const [interviewId, setInterviewId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [sending, setSending] = useState(false);
  const [interviewEnded, setInterviewEnded] = useState(false);
  
  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [currentSpeakingText, setCurrentSpeakingText] = useState('');
  const recognitionRef = useRef(null);
  
  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(0); // in seconds
  const [timerInterval, setTimerInterval] = useState(null);
  
  // Report state
  const [report, setReport] = useState(null);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'] },
    maxFiles: 1,
    onDrop: (accepted) => setFile(accepted[0] || null),
  });

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setUserInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'no-speech') {
          setError('No speech detected. Please try again.');
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining > 0 && !interviewEnded) {
      const interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      setTimerInterval(interval);
      
      return () => clearInterval(interval);
    }
  }, [timeRemaining, interviewEnded]);

  // Speak the latest assistant message
  useEffect(() => {
    if (messages.length > 0 && voiceEnabled) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant') {
        setCurrentSpeakingText(lastMessage.content);
      }
    }
  }, [messages, voiceEnabled]);

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function handleTimeUp() {
    setInterviewEnded(true);
    if (timerInterval) {
      clearInterval(timerInterval);
    }
  }

  function toggleVoiceInput() {
    if (!recognitionRef.current) {
      setError('Speech recognition is not supported in your browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setError('');
      setUserInput('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  }

  function toggleVoiceOutput() {
    setVoiceEnabled(!voiceEnabled);
    if (voiceEnabled) {
      // Stop any ongoing speech
      window.speechSynthesis.cancel();
      setCurrentSpeakingText('');
    }
  }

  async function handleStartInterview(e) {
    e.preventDefault();
    setError('');
    
    if (!file || !jobRole.trim() || !userName.trim()) {
      setError('Please fill in all fields and upload your resume.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('jobRole', jobRole.trim());
      formData.append('userName', userName.trim());
      formData.append('duration', duration);
      formData.append('language', language);
      
      const data = await startInterview(formData);
      setInterviewId(data.interviewId);
      setMessages(data.messages || []);
      setTimeRemaining(duration * 60); // Convert minutes to seconds
      setStep('interview');
      
      // Speak the first question
      if (data.messages && data.messages.length > 0 && voiceEnabled) {
        setCurrentSpeakingText(data.messages[0].content);
      }
    } catch (err) {
      setError(err.message || 'Failed to start interview.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendMessage(messageText) {
    const userMessage = typeof messageText === 'string' ? messageText : userInput.trim();
    
    if (!userMessage || sending) return;

    setUserInput('');
    setSending(true);
    setError('');
    setCurrentSpeakingText(''); // Stop current speech

    // Add user message immediately
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const data = await sendInterviewMessage(interviewId, userMessage);
      
      // Add AI response
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      
      // Check if interview should end
      if (data.shouldEnd) {
        setInterviewEnded(true);
      }
    } catch (err) {
      setError(err.message || 'Failed to send message.');
      // Remove the user message if sending failed
      setMessages(prev => prev.slice(0, -1));
      setUserInput(userMessage);
    } finally {
      setSending(false);
    }
  }

  async function handleEndInterview() {
    setLoading(true);
    setError('');
    
    try {
      const data = await endInterview(interviewId);
      setReport(data.report);
      setStep('report');
    } catch (err) {
      setError(err.message || 'Failed to generate report.');
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setStep('setup');
    setFile(null);
    setUserName('');
    setJobRole('');
    setDuration(5);
    setLanguage('English');
    setInterviewId(null);
    setMessages([]);
    setUserInput('');
    setInterviewEnded(false);
    setTimeRemaining(0);
    setReport(null);
    setError('');
    setCurrentSpeakingText('');
    setIsListening(false);
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    window.speechSynthesis.cancel();
  }

  return (
    <div className="ai-interview-view">
      <div className="view-header">
        <button className="btn btn-ghost" onClick={onBack}>
          ← Back to Home
        </button>
        <h1>AI Interview Practice</h1>
        <p>Practice interviews with AI and get detailed feedback</p>
      </div>

      {step === 'setup' && (
        <form className="card interview-setup-card" onSubmit={handleStartInterview}>
          <h2>Setup Your Interview</h2>
          <p className="card-subtitle">Fill in your details to start the interview with Aditya</p>

          <div className="form-row">
            <label className="label">
              <FileText size={18} /> Your Name
            </label>
            <input
              type="text"
              placeholder="e.g. Alex Johnson"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="input"
              disabled={loading}
            />
          </div>

          <div className="form-row">
            <label className="label">
              <FileText size={18} /> Job Role
            </label>
            <input
              type="text"
              placeholder="e.g. Software Engineer, Data Scientist, Product Manager"
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              className="input"
              disabled={loading}
            />
          </div>

          <div className="form-row">
            <label className="label">
              <FileText size={18} /> Interview Duration
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="input"
              disabled={loading}
            >
              {[1, 2, 3, 5, 10, 15, 20, 25, 30].map(min => (
                <option key={min} value={min}>{min} minute{min > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label className="label">
              <FileText size={18} /> Preferred Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="input"
              disabled={loading}
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi (हिंदी)</option>
            </select>
          </div>

          <div className="form-row">
            <span className="label">
              <Upload size={18} /> Resume (PDF or TXT)
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

          <div className="interview-info">
            <AlertCircle size={20} />
            <div>
              <strong>What to expect:</strong>
              <ul>
                <li>Your interviewer will be Aditya</li>
                <li>Questions based on your resume and the job role</li>
                <li>Mix of technical and behavioral questions</li>
                <li>Real-time conversation with AI interviewer</li>
                <li>Detailed feedback report at the end</li>
              </ul>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-large" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={20} className="spin" /> Starting Interview...
              </>
            ) : (
              <>
                <MessageSquare size={20} /> Start Interview
              </>
            )}
          </button>
        </form>
      )}

      {step === 'interview' && (
        <VideoCallInterview
          userName={userName}
          jobRole={jobRole}
          duration={duration}
          language={language}
          messages={messages}
          onSendMessage={handleSendMessage}
          onEndCall={handleEndInterview}
          isSending={sending}
        />
      )}

      {step === 'report' && report && (
        <div className="interview-report">
          <div className="card report-header-card">
            <div className="report-header">
              <Award size={48} className="report-icon" />
              <div>
                <h2>Interview Report</h2>
                <p className="report-subtitle">Role: {jobRole}</p>
              </div>
            </div>
            <div className="report-score">
              <div className="score-circle">
                <span className="score-value">{report.overallScore}</span>
                <span className="score-label">/100</span>
              </div>
              <p className="score-description">{report.performanceLevel}</p>
            </div>
          </div>

          <div className="card">
            <h3><TrendingUp size={20} /> Strengths</h3>
            <ul className="report-list">
              {report.strengths.map((strength, idx) => (
                <li key={idx} className="strength-item">{strength}</li>
              ))}
            </ul>
          </div>

          <div className="card">
            <h3><AlertCircle size={20} /> Areas for Improvement</h3>
            <ul className="report-list">
              {report.improvements.map((improvement, idx) => (
                <li key={idx} className="improvement-item">{improvement}</li>
              ))}
            </ul>
          </div>

          <div className="card">
            <h3>Detailed Feedback</h3>
            <p className="report-feedback">{report.detailedFeedback}</p>
          </div>

          <div className="card">
            <h3>Recommendations</h3>
            <ul className="report-list">
              {report.recommendations.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </div>

          <div className="report-actions">
            <button className="btn btn-primary" onClick={handleReset}>
              Start New Interview
            </button>
            <button className="btn btn-ghost" onClick={onBack}>
              Back to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
