import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, PhoneOff, MessageSquare, X } from 'lucide-react';
import Interviewer3D from './Interviewer3D';
import '../styles/video-call.css';

export default function VideoCallInterview({ 
  userName, 
  duration,
  messages,
  onSendMessage,
  onEndCall,
  isSending,
  language = 'English',
  interviewEnded = false,
}) {
  const [stream, setStream] = useState(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(duration * 60);
  const [timeIsUp, setTimeIsUp] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [showQuestionPopup, setShowQuestionPopup] = useState(false);
  const [lastSpokenText, setLastSpokenText] = useState('');
  const [voiceReady, setVoiceReady] = useState(false); // Track if voice is initialized
  const [interimTranscript, setInterimTranscript] = useState(''); // Show what's being heard
  const timerRef = useRef(null);
  
  const isHindi = language === 'Hindi';
  const videoRef = useRef(null);
  const recognitionRef = useRef(null);
  const transcriptEndRef = useRef(null);
  const utteranceRef = useRef(null);
  const onSendMessageRef = useRef(onSendMessage);

  // Keep ref up to date
  useEffect(() => {
    onSendMessageRef.current = onSendMessage;
  }, [onSendMessage]);

  // Initialize webcam
  useEffect(() => {
    async function startWebcam() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        // Silently handle webcam error
      }
    }

    startWebcam();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true; // Keep listening for better accuracy
      recognitionRef.current.interimResults = true; // Show interim results
      recognitionRef.current.lang = isHindi ? 'hi-IN' : 'en-IN'; // Hindi or English
      recognitionRef.current.maxAlternatives = 3; // Get multiple alternatives

      recognitionRef.current.onresult = (event) => {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += transcript + ' ';
          } else {
            interimText += transcript;
          }
        }

        // Show interim results in real-time
        if (interimText) {
          setInterimTranscript(interimText);
        }

        // When final, stop and send
        if (finalText) {
          recognitionRef.current.stop();
          setIsListening(false);
          setInterimTranscript('');
          onSendMessageRef.current(finalText.trim());
        }
      };

      recognitionRef.current.onerror = (event) => {
        setIsListening(false);
        if (event.error === 'no-speech') {
          // Silently handle, user might not have spoken yet
        } else if (event.error === 'audio-capture') {
          console.warn('Microphone not found.');
        } else if (event.error === 'not-allowed') {
          console.warn('Microphone permission denied.');
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
  }, [isHindi]);

  // Timer countdown — auto-end when time is up
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          // Stop mic and speech
          if (recognitionRef.current) recognitionRef.current.stop();
          window.speechSynthesis.cancel();
          setIsListening(false);
          setShowQuestionPopup(false);
          setTimeIsUp(true);
          // Auto-trigger end after brief delay so user sees the message
          setTimeout(() => {
            onEndCall();
          }, 2500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, []);

  // Speak interviewer messages with popup
  useEffect(() => {
    if (messages.length > 0 && isSpeakerOn && voiceReady) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant') {
        const text = lastMessage.content;
        
        // Prevent duplicate speech
        if (text === lastSpokenText) {
          return;
        }
        
        setLastSpokenText(text);
        setCurrentQuestion(text);
        setShowQuestionPopup(true);
        
        // Only cancel if we are currently speaking to avoid breaking the queue
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
        }
        
        // Resume speech synthesis if paused (prevents stuttering)
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        
        // Wait for voices to load
        const speakText = () => {
          const voices = window.speechSynthesis.getVoices();
          
          // If no voices loaded yet, retry after delay
          if (voices.length === 0) {
            setTimeout(speakText, 500);
            return;
          }
          
          // Create utterance with smooth, human-like settings
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.9; // Slightly slower for more natural, human-like speech
          utterance.pitch = 0.95; // Slightly lower pitch for warmth
          utterance.volume = 1.0;
          utterance.lang = isHindi ? 'hi-IN' : 'en-IN'; // Hindi or English
          
          // Voice priority based on language
          let selectedVoice;
          
          if (isHindi) {
            // Hindi voice priority: Google हिन्दी -> Lekha -> Any hi-IN voice -> Default
            const googleHindi = voices.find(voice => voice.name.includes('Google हिन्दी') || voice.name.includes('Google Hindi'));
            const lekhaVoice = voices.find(voice => voice.name === 'Lekha' || voice.name.includes('Lekha'));
            const hiInVoice = voices.find(voice => voice.lang === 'hi-IN' || voice.lang.includes('hi'));
            
            selectedVoice = googleHindi || lekhaVoice || hiInVoice || voices[0];
          } else {
            // English voice priority: Rishi → Indian English → UK English → Default
            const indianVoice = voices.find(voice => 
              voice.name === 'Rishi' || voice.name.includes('Rishi')
            );
            
            const indianEnglishVoice = !indianVoice && voices.find(voice =>
              voice.lang === 'en-IN' || voice.name.includes('Indian')
            );
            
            const ukVoice = !indianVoice && !indianEnglishVoice && voices.find(voice =>
              voice.name.includes('Google UK English Male') ||
              voice.name.includes('Daniel') ||
              voice.lang.includes('en-GB')
            );
            
            selectedVoice = indianVoice || indianEnglishVoice || ukVoice || voices[0];
          }
          
          if (selectedVoice) {
            // Match utterance language to the selected voice's language.
            utterance.lang = selectedVoice.lang || (isHindi ? 'hi-IN' : 'en-IN');
          }

          // To prevent speech synthesis from abruptly stopping (common bug with non-native voices or long text),
          // we split the text into smaller chunks and speak them sequentially.
          const chunks = text.match(/[^.!?।\n]+[.!?।\n]*/g) || [text];
          let currentChunk = 0;

          const speakNextChunk = () => {
            if (currentChunk < chunks.length) {
              const chunkText = chunks[currentChunk].trim();
              if (!chunkText) {
                currentChunk++;
                return speakNextChunk();
              }
              const chunkUtterance = new SpeechSynthesisUtterance(chunkText);
              chunkUtterance.rate = 0.9;
              chunkUtterance.pitch = 0.95;
              chunkUtterance.volume = 1.0;
              chunkUtterance.lang = utterance.lang;
              if (selectedVoice) chunkUtterance.voice = selectedVoice;

              chunkUtterance.onend = () => {
                currentChunk++;
                speakNextChunk();
              };

              chunkUtterance.onerror = (e) => {
                console.error('Speech synthesis error on chunk:', e);
                // Even on error, try the next chunk to prevent getting stuck
                currentChunk++;
                speakNextChunk();
              };

              utteranceRef.current = chunkUtterance;
              window.speechSynthesis.speak(chunkUtterance);
            } else {
              // All chunks finished
              setTimeout(() => {
                setShowQuestionPopup(false);
                if (recognitionRef.current) {
                  try {
                    // Always try to start, if it's already started it just throws and we catch
                    recognitionRef.current.start();
                    setIsListening(true);
                    setIsMicOn(false);
                  } catch (err) {
                    console.log("Mic auto-start info:", err.message);
                  }
                }
              }, 1000);
            }
          };

          // Start speaking chunks
          speakNextChunk();
        };

        // If voices are already loaded, speak immediately
        if (window.speechSynthesis.getVoices().length > 0) {
          setTimeout(speakText, 300);
        } else {
          // Wait for voices to load
          window.speechSynthesis.onvoiceschanged = () => {
            setTimeout(speakText, 300);
          };
        }
      }
    }
  }, [messages, isSpeakerOn, lastSpokenText, isListening, voiceReady]);

  // Load voices and keep speech synthesis alive
  useEffect(() => {
    // Load voices
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };

    loadVoices();

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    // Initialize speech synthesis with a silent utterance on mount
    // This helps browsers allow speech without explicit user interaction
    const initSpeech = () => {
      const init = new SpeechSynthesisUtterance('');
      init.volume = 0;
      window.speechSynthesis.speak(init);
    };
    
    // Try to initialize after a short delay
    setTimeout(initSpeech, 500);

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function toggleMic() {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setInterimTranscript('');
      setIsMicOn(true);
    } else {
      if (!recognitionRef.current) {
        alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
        return;
      }
      
      try {
        setInterimTranscript('');
        recognitionRef.current.start();
        setIsListening(true);
        setIsMicOn(false);
      } catch (error) {
        alert('Could not start microphone. Please check permissions.');
      }
    }
  }

  function toggleSpeaker() {
    setIsSpeakerOn(!isSpeakerOn);
    if (isSpeakerOn) {
      window.speechSynthesis.cancel();
      setShowQuestionPopup(false);
    }
  }

  function enableVoice() {
    // User interaction to unlock voice in browsers
    const unlockUtterance = new SpeechSynthesisUtterance('');
    window.speechSynthesis.speak(unlockUtterance);
    
    setVoiceReady(true);
    
    // Trigger speech for first message if it exists
    if (messages.length > 0 && messages[0].role === 'assistant') {
      setLastSpokenText(''); // Reset to allow first message to speak
    }
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  const isInterviewerSpeaking = isSending || (messages.length > 0 && messages[messages.length - 1].role === 'assistant' && showQuestionPopup);

  return (
    <div className="video-call-container">
      {/* Call Info Bar */}
      <div className="call-info-bar">
        <div className="call-status">
          <div className="call-status-dot"></div>
          <span>Interview in Progress</span>
        </div>
        <div className={`call-timer ${timeRemaining < 60 ? 'warning' : ''} ${timeRemaining < 30 ? 'critical' : ''}`}>
          ⏱ {formatTime(timeRemaining)}
        </div>
      </div>

      {/* Video Grid */}
      <div className="video-grid">
        {/* Interviewer Video */}
        <div className={`video-panel ${isInterviewerSpeaking ? 'active' : ''}`}>
          <Interviewer3D 
            isSpeaking={isInterviewerSpeaking}
            emotion="neutral"
            textToSpeak=""
            messages={messages}
          />
          <div className={`video-label ${isInterviewerSpeaking ? 'speaking' : ''}`}>
            <Volume2 size={16} />
            Aditya Sharma - Interviewer
          </div>
        </div>

        {/* User Video (Webcam) */}
        <div className={`video-panel ${isListening ? 'active' : ''}`}>
          {stream ? (
            <div className="user-video-container">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="user-video"
              />
              <div className={`video-label ${isListening ? 'speaking' : ''}`}>
                {isListening ? <Mic size={16} /> : <MicOff size={16} />}
                {userName}
              </div>
            </div>
          ) : (
            <div className="video-placeholder">
              <div className="video-placeholder-icon">
                👤
              </div>
              <p>Connecting camera...</p>
            </div>
          )}
        </div>
      </div>

      {/* Question Popup - Shows Conversation History */}
      {showQuestionPopup && (
        <div className="question-popup">
          <div className="question-popup-content">
            <div className="question-popup-header">
              <div className="question-popup-avatar">🤖</div>
              <div>
                <div className="question-popup-name">Aditya Sharma</div>
                <div className="question-popup-status">Speaking...</div>
              </div>
              <button 
                className="question-popup-close"
                onClick={() => setShowQuestionPopup(false)}
                style={{
                  marginLeft: 'auto',
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '20px'
                }}
              >
                ×
              </button>
            </div>
            
            {/* Conversation History */}
            <div className="question-popup-conversation">
              {messages.slice(-6).map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`popup-message ${msg.role === 'assistant' ? 'popup-interviewer' : 'popup-user'}`}
                  style={{
                    marginBottom: '12px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: msg.role === 'assistant' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    border: msg.role === 'assistant' ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <div style={{ 
                    fontSize: '11px', 
                    opacity: 0.7, 
                    marginBottom: '4px',
                    fontWeight: '600'
                  }}>
                    {msg.role === 'assistant' ? 'Aditya' : userName}
                  </div>
                  <div style={{ fontSize: '13px', lineHeight: '1.4' }}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Current Question Highlight */}
            <div className="question-popup-current">
              <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '6px' }}>
                Current Question:
              </div>
              <div className="question-popup-text">
                {currentQuestion}
              </div>
            </div>
            
            <div className="question-popup-wave">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      )}

      {/* Listening Indicator */}
      {isListening && (
        <div className="listening-indicator">
          <div className="listening-icon">🎤</div>
          <div className="listening-text">Listening...</div>
          {interimTranscript ? (
            <div style={{
              marginTop: '12px',
              padding: '12px 20px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              color: 'white',
              fontSize: '16px',
              maxWidth: '400px',
              textAlign: 'center'
            }}>
              "{interimTranscript}"
            </div>
          ) : (
            <div className="listening-subtext">Speak your answer clearly</div>
          )}
          <button
            onClick={() => {
              recognitionRef.current?.stop();
              setIsListening(false);
              setInterimTranscript('');
            }}
            style={{
              marginTop: '16px',
              padding: '8px 20px',
              background: 'rgba(255, 255, 255, 0.3)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Stop Listening
          </button>
        </div>
      )}

      {/* Transcript Panel */}
      {showTranscript && (
        <div className="transcript-panel">
          <div className="transcript-header">
            <span className="transcript-title">
              <MessageSquare size={16} style={{ display: 'inline', marginRight: '8px' }} />
              Conversation
            </span>
            <button className="transcript-toggle" onClick={() => setShowTranscript(false)}>
              <X size={18} />
            </button>
          </div>
          <div className="transcript-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`transcript-message ${msg.role === 'assistant' ? 'interviewer' : 'user'}`}>
                <strong>{msg.role === 'assistant' ? 'Aditya' : userName}</strong>
                {msg.content}
              </div>
            ))}
            {isSending && (
              <div className="transcript-message interviewer">
                <strong>Aditya</strong>
                Thinking...
              </div>
            )}
            <div ref={transcriptEndRef} />
          </div>
        </div>
      )}

      {!showTranscript && (
        <button 
          className="transcript-toggle" 
          onClick={() => setShowTranscript(true)}
          style={{
            position: 'absolute',
            bottom: '120px',
            right: '20px',
            background: 'rgba(0, 0, 0, 0.8)',
            border: '1px solid #374151',
            borderRadius: '12px',
            padding: '12px',
            color: 'white',
            cursor: 'pointer',
            zIndex: 9
          }}
        >
          <MessageSquare size={20} />
        </button>
      )}

      {/* Time's Up Overlay */}
      {timeIsUp && (
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          gap: '16px',
        }}>
          <div style={{ fontSize: '64px' }}>⏰</div>
          <h2 style={{ color: 'white', fontSize: '32px', margin: 0 }}>Time's Up!</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '18px', margin: 0 }}>
            Generating your interview report...
          </p>
          <div style={{
            width: '48px', height: '48px',
            border: '4px solid rgba(255,255,255,0.3)',
            borderTopColor: 'white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
        </div>
      )}

      {/* Enable Voice Button (shows when voice not ready) */}
      {!voiceReady && messages.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 30,
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.95) 0%, rgba(37, 99, 235, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          padding: '32px 48px',
          borderRadius: '24px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔊</div>
          <h3 style={{ color: 'white', marginBottom: '12px', fontSize: '24px' }}>
            Enable Voice
          </h3>
          <p style={{ color: 'rgba(255, 255, 255, 0.9)', marginBottom: '24px', fontSize: '16px' }}>
            Click to hear Aditya speak
          </p>
          <button
            onClick={enableVoice}
            style={{
              background: 'white',
              color: '#2563eb',
              border: 'none',
              padding: '16px 32px',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
            }}
          >
            Enable Voice & Start Interview
          </button>
        </div>
      )}

      {/* Call Controls */}
      <div className="call-controls">
        <button 
          className={`control-btn mic ${isListening ? 'active' : ''}`}
          onClick={toggleMic}
          title={isListening ? 'Stop speaking' : 'Click to speak your answer'}
        >
          {isListening ? <Mic /> : <MicOff />}
        </button>

        <button 
          className={`control-btn speaker ${!isSpeakerOn ? 'muted' : ''}`}
          onClick={toggleSpeaker}
          title={isSpeakerOn ? 'Mute interviewer' : 'Unmute interviewer'}
        >
          {isSpeakerOn ? <Volume2 /> : <VolumeX />}
        </button>

        <button 
          className="control-btn end-call"
          onClick={onEndCall}
          title="End interview"
        >
          <PhoneOff />
        </button>
      </div>
    </div>
  );
}
