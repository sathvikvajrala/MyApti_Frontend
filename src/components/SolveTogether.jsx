import React, { useState, useEffect, useRef } from 'react';

export default function SolveTogether({ currentUser, onNavigate }) {
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
        }
      `}} />
    </div>
  );
}
