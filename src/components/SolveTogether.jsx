import React, { useState, useEffect, useRef } from 'react';

<<<<<<< HEAD
export default function SolveTogether({ currentUser, onNavigate }) {
=======
export default function SolveTogether({ currentUser }) {
>>>>>>> a3be34523603327fffc6c0be2b251ea448a877a5
  const [inputText, setInputText] = useState('');
  const [stats, setStats] = useState({ segmentCount: 0, wordCount: 0, charCount: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);
  
  // Chat States
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      id: 1,
      sender: 'ai',
      text: "Hello! I am Jimmy, your Solve Partner. You can type a question, attach study files (using the paperclip 📎), or click the microphone 🎙️ to start Voice Mode! Let's solve together.",
      timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isAnswering, setIsAnswering] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  
  // Voice Mode States
  const [voiceActive, setVoiceActive] = useState(false);
  const [transcriptText, setTranscriptText] = useState('');
  const [voiceSpeaking, setVoiceSpeaking] = useState(false);
  
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isAnswering]);

  // Load existing stats on mount
  useEffect(() => {
    const fetchContext = async () => {
      try {
        const headers = currentUser ? { 'x-user-username': currentUser } : {};
        const res = await fetch('/api/solve/context', { headers });
        if (res.ok) {
          const data = await res.json();
          if (data.text) {
            setInputText(data.text);
            setStats({
              segmentCount: data.segmentCount,
              wordCount: data.text.split(/\s+/).filter(w => w).length,
              charCount: data.text.length
            });
          }
        }
      } catch (err) {
        console.error("Failed to load solve context:", err);
      }
    };
    fetchContext();
  }, [currentUser]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setTranscriptText('Listening...');
      };

      rec.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setTranscriptText(`You said: "${text}"`);
        // Submit the question
        submitVoiceQuestion(text);
      };

      rec.onerror = (e) => {
        console.error("Speech recognition error:", e);
        if (e.error !== 'no-speech') {
          setTranscriptText(`Speech Error: ${e.error}`);
        }
      };

      rec.onend = () => {
        // If voice mode is still active but not speaking, start listening again
        if (voiceActive && !voiceSpeaking) {
          try {
            rec.start();
          } catch (err) {
            // Already running
          }
        }
      };

      recognitionRef.current = rec;
    }
  }, [voiceActive, voiceSpeaking]);

  // Watch Voice Active State changes
  useEffect(() => {
    if (voiceActive) {
      // Trigger voice recognition start
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (err) {
          console.warn("Recognition already started");
        }
      } else {
        alert("Speech Recognition API is not supported in this browser. Please try Chrome, Edge, or Safari.");
        setVoiceActive(false);
      }
    } else {
      // Stop recognition and speaking
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {}
      }
      window.speechSynthesis?.cancel();
      setVoiceSpeaking(false);
      setTranscriptText('');
    }
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, [voiceActive]);

  // Speak text aloud helper
  const speakAloud = (text) => {
    if (!window.speechSynthesis) return;

    // Stop listening before speaking to prevent self-trigger
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {}
    }

    setVoiceSpeaking(true);
    setTranscriptText("Jimmy is speaking...");

    // Remove brackets/tags from spoken output for better speech flow
    const cleanText = text.replace(/\[.*?\]/g, '').replace(/ℹ️.*$/m, '').trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-US';
    
    // Choose a nice natural english voice if available
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google') || v.name.includes('Natural'));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onend = () => {
      setVoiceSpeaking(false);
      // Restart listening if voice mode is still active
      if (voiceActive && recognitionRef.current) {
        try {
          setTranscriptText("Listening...");
          recognitionRef.current.start();
        } catch (err) {}
      }
    };

    utterance.onerror = () => {
      setVoiceSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Submit voice question
  const submitVoiceQuestion = async (queryText) => {
    if (!queryText.trim()) return;

    // Add user message
    setChatHistory(prev => [
      ...prev,
      {
        id: Date.now(),
        sender: 'user',
        text: queryText,
        timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    setIsAnswering(true);

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (currentUser) {
        headers['x-user-username'] = currentUser;
      }

      const res = await fetch('/api/solve/query', {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: queryText })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Query failed");
      }

      // Answer output
      setChatHistory(prev => [
        ...prev,
        {
          id: Date.now(),
          sender: 'ai',
          text: data.answer,
          source: data.source,
          timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsAnswering(false);

      // Read reply aloud
      speakAloud(data.answer);

    } catch (err) {
      setChatHistory(prev => [
        ...prev,
        {
          id: Date.now(),
          sender: 'ai',
          text: `Error: ${err.message}`,
          timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsAnswering(false);
    }
  };

  // Handle Text Document Process
  const handleProcessMaterial = async () => {
    if (!inputText.trim()) {
      alert("Please paste some study text first!");
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (currentUser) {
        headers['x-user-username'] = currentUser;
      }
      
      const res = await fetch('/api/solve/process', {
        method: 'POST',
        headers,
        body: JSON.stringify({ text: inputText.trim() })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Processing failed");
      }
      
      setStats({
        segmentCount: data.segmentCount,
        wordCount: data.wordCount,
        charCount: data.charCount
      });
      setShowNotesDrawer(false);

      setChatHistory(prev => [
        ...prev,
        {
          id: Date.now(),
          sender: 'system',
          text: `System: Study notes indexed successfully! ${data.segmentCount} segments learned.`,
          timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle File Attachment Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const headers = {};
      if (currentUser) {
        headers['x-user-username'] = currentUser;
      }

      const res = await fetch('/api/solve/upload', {
        method: 'POST',
        headers,
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "File upload failed.");
      }

      setUploadedFiles(prev => [
        ...prev,
        {
          name: file.name,
          size: (file.size / 1024).toFixed(1) + ' KB',
          segmentCount: data.segmentCount
        }
      ]);

      setStats({
        segmentCount: data.totalSegments,
        wordCount: stats.wordCount + data.wordCount,
        charCount: stats.charCount + data.charCount
      });

      setChatHistory(prev => [
        ...prev,
        {
          id: Date.now(),
          sender: 'system',
          text: `📎 Document "${file.name}" learned by Jimmy (${data.segmentCount} segments parsed).`,
          timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
        }
      ]);

    } catch (err) {
      alert(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Submit Text Question
  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!query.trim() || isAnswering) return;
    
    const userMsg = query.trim();
    setQuery('');
    
    setChatHistory(prev => [
      ...prev,
      {
        id: Date.now(),
        sender: 'user',
        text: userMsg,
        timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    
    setIsAnswering(true);
    
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (currentUser) {
        headers['x-user-username'] = currentUser;
      }
      
      const res = await fetch('/api/solve/query', {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: userMsg })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Query failed");
      }
      
      setTimeout(() => {
        setChatHistory(prev => [
          ...prev,
          {
            id: Date.now(),
            sender: 'ai',
            text: data.answer,
            source: data.source,
            timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setIsAnswering(false);
      }, 500);
      
    } catch (err) {
      setChatHistory(prev => [
        ...prev,
        {
          id: Date.now(),
          sender: 'ai',
          text: `Error: ${err.message}`,
          timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsAnswering(false);
    }
  };

  return (
<<<<<<< HEAD
    <div className="solve-together-view" style={{ maxWidth: '650px', margin: '80px auto 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '25px' }}>
      <div className="glass-card fade-in" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', position: 'relative', overflow: 'hidden' }}>
        
        {/* Pulsating Orb */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.4) 0%, rgba(245, 158, 11, 0.05) 70%)',
          boxShadow: '0 0 30px rgba(245, 158, 11, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'pulse-soon 2s infinite alternate ease-in-out'
        }}>
          <span style={{ fontSize: '2.5rem' }}>🎙️</span>
        </div>

        <div style={{ display: 'inline-block', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 12px', borderRadius: '20px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
          COMING SOON
        </div>

        <h1 style={{ color: '#fff', fontSize: '1.8rem', margin: 0, fontWeight: 700 }}>Solve With Jimmy</h1>
        
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', margin: '0 0 10px 0' }}>
          Jimmy is currently undergoing training on advanced quantitative reasoning and browser-based speech synthesizers. We are polishing the interactive Voice Mode, document OCR, and custom speech engines to provide you with a flawless real-time learning experience.
        </p>

        {/* Progress Bar */}
        <div style={{ width: '100%', background: 'rgba(255,255,255,0.05)', height: '8px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          <div style={{ width: '85%', background: 'linear-gradient(90deg, var(--color-accent) 0%, #fbbf24 100%)', height: '100%', borderRadius: '4px' }}></div>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>System integration status: 85% complete</span>

        {/* Action Button */}
        <button
          onClick={() => onNavigate && onNavigate('dashboard')}
          className="glass-button primary"
          style={{ marginTop: '15px', height: '40px', padding: '0 24px', fontSize: '0.85rem' }}
        >
          Back to Dashboard
        </button>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse-soon {
          0% { transform: scale(0.95); box-shadow: 0 0 20px rgba(245, 158, 11, 0.2); }
          100% { transform: scale(1.05); box-shadow: 0 0 45px rgba(245, 158, 11, 0.5); }
=======
    <div className="solve-together-view" style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* Header with Stats & Paste Drawer trigger */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '1.8rem', margin: 0 }}>Solve With Jimmy</h1>
          <p className="page-subtitle" style={{ fontSize: '0.88rem', margin: '2px 0 0 0' }}>Ask questions or attach files to learn with your LLM study partner.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setShowNotesDrawer(!showNotesDrawer)} 
            className="glass-button" 
            style={{ fontSize: '0.82rem', padding: '8px 12px' }}
          >
            📋 Paste Notes
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '6px 14px', borderRadius: '8px', fontSize: '0.78rem' }}>
            <div>Segments: <strong style={{ color: '#fff' }}>{stats.segmentCount}</strong></div>
            <div>Files: <strong style={{ color: 'var(--color-accent)' }}>{uploadedFiles.length}</strong></div>
          </div>
        </div>
      </div>

      {/* Paste Notes Collapsible Drawer */}
      {showNotesDrawer && (
        <div className="glass-card fade-in" style={{ padding: '20px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1rem', color: '#fff', margin: 0 }}>Paste Custom Study Notes</h3>
            <button onClick={() => setShowNotesDrawer(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
          </div>
          <textarea
            className="glass-input"
            placeholder="Paste formulas, paragraphs, text shortcut notes here..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            style={{ minHeight: '120px', resize: 'vertical', fontSize: '0.9rem', padding: '10px' }}
          />
          <button 
            onClick={handleProcessMaterial} 
            disabled={isProcessing}
            className="glass-button primary" 
            style={{ width: '100%', height: '38px', fontSize: '0.88rem', justifyContent: 'center' }}
          >
            {isProcessing ? "Processing..." : "Analyze & Learn"}
          </button>
        </div>
      )}

      {/* Unified Chat Workspace */}
      <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', overflow: 'hidden', position: 'relative' }}>
        
        {/* Messages Pane */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          padding: '10px 5px',
          marginBottom: '15px'
        }}>
          {chatHistory.map((msg) => {
            const isSystem = msg.sender === 'system';
            if (isSystem) {
              return (
                <div key={msg.id} style={{ 
                  alignSelf: 'center', 
                  fontSize: '0.78rem', 
                  color: 'var(--text-muted)', 
                  background: 'rgba(255,255,255,0.03)', 
                  border: '1px solid var(--border-color)', 
                  padding: '6px 14px', 
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  {msg.text}
                </div>
              );
            }

            const isAi = msg.sender === 'ai';
            return (
              <div key={msg.id} style={{
                alignSelf: isAi ? 'flex-start' : 'flex-end',
                maxWidth: '80%',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <div style={{
                  background: isAi ? 'rgba(255,255,255,0.03)' : 'rgba(99, 102, 241, 0.15)',
                  border: isAi ? '1px solid var(--border-color)' : '1px solid rgba(99, 102, 241, 0.3)',
                  borderRadius: isAi ? '12px 12px 12px 2px' : '12px 12px 2px 12px',
                  padding: '12px 16px',
                  color: isAi ? 'var(--text-primary)' : '#fff',
                  fontSize: '0.92rem',
                  lineHeight: '1.5',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  {msg.text}
                  {isAi && msg.source && (
                    <div style={{ fontSize: '0.74rem', color: 'var(--color-accent)', marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px' }}>
                      ℹ️ {msg.source}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', alignSelf: isAi ? 'flex-start' : 'flex-end', padding: '0 4px' }}>
                  {msg.timestamp}
                </span>
              </div>
            );
          })}

          {isAnswering && (
            <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '12px 12px 12px 2px', padding: '12px 16px', display: 'flex', gap: '5px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Thinking</span>
              <div style={{ display: 'flex', gap: '3px' }}>
                <span style={{ width: '4px', height: '4px', background: 'var(--text-muted)', borderRadius: '50%', animation: 'chat-dot 1.2s infinite 0.2s' }}></span>
                <span style={{ width: '4px', height: '4px', background: 'var(--text-muted)', borderRadius: '50%', animation: 'chat-dot 1.2s infinite 0.4s' }}></span>
                <span style={{ width: '4px', height: '4px', background: 'var(--text-muted)', borderRadius: '50%', animation: 'chat-dot 1.2s infinite 0.6s' }}></span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Upload File listing info */}
        {uploadedFiles.length > 0 && chatHistory.length <= 2 && (
          <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '10px', fontSize: '0.8rem' }}>
            <div style={{ color: 'var(--text-muted)', marginBottom: '5px', fontWeight: 600 }}>Active Documents:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {uploadedFiles.map((f, i) => (
                <span key={i} style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc', padding: '4px 10px', borderRadius: '15px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  📄 {f.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar Layout */}
        <form onSubmit={handleAskQuestion} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '5px 10px' }}>
          {/* File input (Hidden) */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            disabled={isUploading}
            accept=".txt,.md,.pdf,.docx,.png,.jpg,.jpeg,.mp3,.wav,.m4a"
            style={{ display: 'none' }} 
          />
          
          {/* Attachment Paperclip button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isAnswering}
            className="chat-bar-btn"
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Attach Document/Audio/Image"
          >
            {isUploading ? (
              <div className="mini-spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.05)', borderTopColor: 'var(--color-accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            ) : (
              <svg viewBox="0 0 24 24" style={{ width: '20px', height: '20px', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }}>
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
            )}
          </button>

          {/* Text Input */}
          <input
            type="text"
            className="chat-input-field"
            value={query}
            onChange={e => setQuery(e.target.value)}
            disabled={isAnswering || voiceActive}
            placeholder={voiceActive ? "Voice Mode Active - Listening..." : "Type your question here or upload notes..."}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#fff',
              fontSize: '0.92rem',
              padding: '8px 10px'
            }}
          />

          {/* Voice Mic Button */}
          <button
            type="button"
            onClick={() => setVoiceActive(!voiceActive)}
            disabled={isAnswering}
            className={`chat-bar-btn ${voiceActive ? 'voice-active' : ''}`}
            style={{
              background: voiceActive ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
              border: 'none',
              color: voiceActive ? '#fca5a5' : 'var(--text-muted)',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease'
            }}
            title="Toggle Voice Mode"
          >
            <svg viewBox="0 0 24 24" style={{ width: '20px', height: '20px', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }}>
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
            </svg>
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!query.trim() || isAnswering || voiceActive}
            className="glass-button primary"
            style={{ width: '36px', height: '36px', borderRadius: '50%', padding: 0, justifyContent: 'center', flexShrink: 0 }}
          >
            <svg viewBox="0 0 24 24" style={{ width: '16px', height: '16px', fill: 'currentColor' }}>
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </form>

        {/* Voice Mode Visualizer Overlay */}
        {voiceActive && (
          <div className="voice-overlay fade-in" style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(10, 10, 12, 0.95)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '12px',
            zIndex: 10,
            color: '#fff'
          }}>
            {/* Pulsating Glowing Orb */}
            <div className={`voice-orb ${voiceSpeaking ? 'speaking' : 'listening'}`} style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.8) 0%, rgba(79, 70, 229, 0.3) 70%)',
              boxShadow: '0 0 40px rgba(99, 102, 241, 0.6)',
              marginBottom: '30px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {/* Outer wave rings */}
              <div className="voice-wave-ring" style={{ animationDelay: '0.2s' }}></div>
              <div className="voice-wave-ring" style={{ animationDelay: '0.4s' }}></div>
              <div className="voice-wave-ring" style={{ animationDelay: '0.6s' }}></div>
              
              {/* Center icon */}
              <svg viewBox="0 0 24 24" style={{ width: '40px', height: '40px', fill: 'none', stroke: '#fff', strokeWidth: 2 }}>
                {voiceSpeaking ? (
                  <path d="M12 2a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM2 10h3M19 10h3M6 14h12"/>
                ) : (
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
                )}
              </svg>
            </div>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>
              {voiceSpeaking ? "Jimmy is speaking..." : "Jimmy is listening..."}
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '300px', textAlign: 'center', fontStyle: 'italic', height: '24px' }}>
              {transcriptText}
            </p>

            <button
              onClick={() => setVoiceActive(false)}
              className="glass-button"
              style={{
                marginTop: '40px',
                borderColor: 'rgba(239, 68, 68, 0.4)',
                color: '#fca5a5',
                padding: '8px 24px',
                fontSize: '0.85rem'
              }}
            >
              Exit Voice Mode
            </button>
          </div>
        )}

      </div>

      {/* Styled components inside standard dangerouslySetInnerHTML block */}
      <style dangerouslySetInnerHTML={{__html: `
        .voice-wave-ring {
          position: absolute;
          top: -10px; left: -10px; right: -10px; bottom: -10px;
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: 50%;
          animation: voice-pulse 2.2s cubic-bezier(0.16, 1, 0.3, 1) infinite;
          opacity: 0;
          pointer-events: none;
        }
        
        .voice-orb.speaking {
          animation: orb-speak 1.5s infinite alternate ease-in-out;
          background: radial-gradient(circle, rgba(168, 85, 247, 0.8) 0%, rgba(139, 92, 246, 0.3) 70%);
          box-shadow: 0 0 40px rgba(168, 85, 247, 0.6);
        }
        
        .voice-orb.listening {
          animation: orb-listen 2s infinite alternate ease-in-out;
        }

        .chat-bar-btn:hover:not(:disabled) {
          color: #fff !important;
        }

        @keyframes voice-pulse {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }

        @keyframes orb-listen {
          0% { transform: scale(1); box-shadow: 0 0 30px rgba(99, 102, 241, 0.4); }
          100% { transform: scale(1.08); box-shadow: 0 0 50px rgba(99, 102, 241, 0.8); }
        }

        @keyframes orb-speak {
          0% { transform: scale(1.02); }
          100% { transform: scale(1.15); box-shadow: 0 0 60px rgba(168, 85, 247, 0.9); }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes chat-dot {
          0%, 100% { transform: translateY(0); opacity: 0.3; }
          50% { transform: translateY(-4px); opacity: 1; }
>>>>>>> a3be34523603327fffc6c0be2b251ea448a877a5
        }
      `}} />
    </div>
  );
}
