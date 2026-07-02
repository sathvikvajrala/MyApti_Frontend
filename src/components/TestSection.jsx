import React, { useState, useEffect, useRef } from 'react';

export default function TestSection({ onAddTestRecord, onNavigate, defaultCategory = 'all', questionsPool }) {
  // Test Configurations
  const [category, setCategory] = useState(defaultCategory);
  const [difficulty, setDifficulty] = useState('any');
  const [questionCountMode, setQuestionCountMode] = useState('15');
  const [customCount, setCustomCount] = useState(20);
  const [isTimed, setIsTimed] = useState(true);
  const [testMode, setTestMode] = useState('exam'); // 'exam' or 'practice'

  // Test Execution States
  const [isTestActive, setIsTestActive] = useState(false);
  const [isTestSubmitted, setIsTestSubmitted] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { qIndex: selectedOptionIndex }
  const [flags, setFlags] = useState({}); // { qIndex: boolean }
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [practiceRevealed, setPracticeRevealed] = useState({}); // { qIndex: boolean } for practice mode
  const [direction, setDirection] = useState('next');

  const timerRef = useRef(null);

  // Initialize and filter questions for the test
  const startTest = () => {
    if (!questionsPool) return;
    let pool = [...questionsPool];

    // Filter by category
    if (category !== 'all') {
      pool = pool.filter(q => q.category === category);
    }
    
    // Filter by difficulty
    if (difficulty !== 'any') {
      pool = pool.filter(q => q.difficulty.toLowerCase() === difficulty.toLowerCase());
    }

    // Shuffle questions pool
    pool.sort(() => 0.5 - Math.random());

    // Limit by count
    const count = questionCountMode === 'custom' ? Number(customCount) : Number(questionCountMode);
    const limit = isNaN(count) || count <= 0 ? 15 : count;
    const selectedQuestions = pool.slice(0, Math.min(limit, pool.length));

    if (selectedQuestions.length === 0) {
      alert("No questions found matching your filter criteria. Please try a different category or difficulty.");
      return;
    }

    setQuestions(selectedQuestions);
    setAnswers({});
    setFlags({});
    setCurrentIndex(0);
    setPracticeRevealed({});
    setIsTestSubmitted(false);
    setIsTestActive(true);

    // Setup Timer (e.g., 90 seconds per question)
    if (isTimed) {
      const totalSeconds = selectedQuestions.length * 90;
      setTimeRemaining(totalSeconds);
      setTimeSpent(0);
    } else {
      setTimeRemaining(0);
      setTimeSpent(0);
    }
  };

  // Timer Ticking Effect
  useEffect(() => {
    if (isTestActive && !isTestSubmitted) {
      timerRef.current = setInterval(() => {
        setTimeSpent(prev => prev + 1);
        if (isTimed) {
          setTimeRemaining(prev => {
            if (prev <= 1) {
              clearInterval(timerRef.current);
              submitTest(true); // Auto-submit when time runs out
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTestActive, isTestSubmitted, isTimed]);

  const selectOption = (optIndex) => {
    if (isTestSubmitted) return;

    // In practice mode, lock the answer and show solution instantly
    if (testMode === 'practice') {
      if (answers[currentIndex] !== undefined) return; // Answer already selected
      setAnswers(prev => ({ ...prev, [currentIndex]: optIndex }));
      setPracticeRevealed(prev => ({ ...prev, [currentIndex]: true }));
    } else {
      // Exam mode: just record the answer
      setAnswers(prev => ({ ...prev, [currentIndex]: optIndex }));
    }
  };

  const toggleFlag = () => {
    setFlags(prev => ({ ...prev, [currentIndex]: !prev[currentIndex] }));
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setDirection('next');
      setCurrentIndex(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setDirection('prev');
      setCurrentIndex(prev => prev - 1);
    }
  };

  const submitTest = (isAuto = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsTestSubmitted(true);

    if (isAuto) {
      alert("Time's up! Your answers have been submitted automatically.");
    }

    // Calculate score
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.answerIndex) {
        correctCount++;
      }
    });

    const scorePercent = Math.round((correctCount / questions.length) * 100);

    const record = {
      id: Date.now(),
      date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      category: category,
      totalQuestions: questions.length,
      correctAnswers: correctCount,
      scorePercent: scorePercent,
      timeSpentSeconds: timeSpent
    };

    onAddTestRecord(record);
  };

  const exitTest = () => {
    setIsTestActive(false);
    setIsTestSubmitted(false);
    setQuestions([]);
  };

  // Format time (seconds to MM:SS)
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // --- RENDERING CONFIGURATOR SCREEN ---
  if (!isTestActive) {
    return (
      <div className="test-config-view">
        <div className="page-header">
          <h1 className="page-title">Aptitude Test Simulator</h1>
          <p className="page-subtitle">Configure your mock exam parameters and test under timed conditions.</p>
        </div>

        <div className="glass-card" style={{ maxWidth: '650px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            Setup Mock Test
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Category Select */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '500' }}>
                Select Category
              </label>
              <select className="glass-select" value={category} onChange={e => setCategory(e.target.value)}>
                <option value="all">All Categories</option>
                <option value="quantitative">Quantitative Aptitude</option>
                <option value="logical">Logical Reasoning</option>
                <option value="verbal">Verbal Ability</option>
              </select>
            </div>

            {/* Difficulty Select */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '500' }}>
                Select Difficulty
              </label>
              <select className="glass-select" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                <option value="any">Any Difficulty</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            {/* Questions count and timer */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '500' }}>
                  Number of Questions
                </label>
                <select 
                  className="glass-select" 
                  value={questionCountMode} 
                  onChange={e => setQuestionCountMode(e.target.value)}
                  style={{ marginBottom: questionCountMode === 'custom' ? '8px' : '0' }}
                >
                  <option value="15">15 Questions</option>
                  <option value="30">30 Questions</option>
                  <option value="45">45 Questions</option>
                  <option value="custom">Custom...</option>
                </select>
                {questionCountMode === 'custom' && (
                  <input 
                    type="number" 
                    min="1"
                    max="100"
                    className="glass-input" 
                    placeholder="Count (1-100)"
                    value={customCount}
                    onChange={e => {
                      const val = parseInt(e.target.value);
                      setCustomCount(isNaN(val) ? '' : Math.max(1, Math.min(100, val)));
                    }}
                    style={{ width: '100%', padding: '10px', fontSize: '0.9rem' }}
                  />
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '500' }}>
                  Timer Setting
                </label>
                <div style={{ display: 'flex', alignItems: 'center', height: '45px', gap: '10px' }}>
                  <input 
                    type="checkbox" 
                    id="timer-checkbox" 
                    checked={isTimed} 
                    onChange={e => setIsTimed(e.target.checked)} 
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--color-accent)' }}
                  />
                  <label htmlFor="timer-checkbox" style={{ fontSize: '0.95rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                    Timed (1.5 min / Question)
                  </label>
                </div>
              </div>
            </div>

            {/* Test Mode */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '500' }}>
                Testing Mode
              </label>
              <div style={{ display: 'flex', gap: '15px' }}>
                <button
                  type="button"
                  onClick={() => setTestMode('exam')}
                  className={`glass-button ${testMode === 'exam' ? 'primary' : ''}`}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  ⏱ Exam Mode (Hidden Review)
                </button>
                <button
                  type="button"
                  onClick={() => setTestMode('practice')}
                  className={`glass-button ${testMode === 'practice' ? 'primary' : ''}`}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  💡 Learn Mode (Instant feedback)
                </button>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                {testMode === 'exam' 
                  ? "Answers and detailed calculations will only be shown after you submit the exam."
                  : "Check correct answers and step-by-step shortcut explanations immediately as you answer each question."
                }
              </p>
            </div>

            <button 
              onClick={startTest} 
              className="glass-button primary" 
              style={{ width: '100%', height: '50px', fontSize: '1.05rem', fontWeight: 600, marginTop: '10px', justifyContent: 'center' }}
            >
              Start Practice Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDERING SCORE SCREEN (TEST COMPLETE) ---
  if (isTestSubmitted) {
    const correctCount = questions.filter((q, idx) => answers[idx] === q.answerIndex).length;
    const scorePercent = Math.round((correctCount / questions.length) * 100);
    
    let gradeLabel = "Practice Needed";
    let gradeColor = "var(--color-error)";
    if (scorePercent >= 80) {
      gradeLabel = "Excellent Work!";
      gradeColor = "var(--color-success)";
    } else if (scorePercent >= 50) {
      gradeLabel = "Well Done!";
      gradeColor = "var(--color-warning)";
    }

    return (
      <div className="test-results-view">
        <div className="page-header">
          <h1 className="page-title">Session Review</h1>
          <p className="page-subtitle">Examine your performance and learn from the step-by-step solutions.</p>
        </div>

        {/* Grade Card Summary */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '40px 20px', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '2rem', color: gradeColor, marginBottom: '5px' }}>{gradeLabel}</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Here is your score breakdown.</p>
          
          <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '30px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                {scorePercent}%
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Final Score</span>
            </div>
            
            <div style={{ borderLeft: '1px solid var(--border-color)', height: '50px', alignSelf: 'center' }}></div>

            <div style={{ display: 'grid', gridTemplateColumns: '120px 120px', gap: '15px', textAlign: 'left' }}>
              <div>
                <div style={{ fontWeight: 600, color: '#fff' }}>{correctCount} / {questions.length}</div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Correct Items</span>
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#fff' }}>{formatTime(timeSpent)}</div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Time Elapsed</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px' }}>
            <button onClick={startTest} className="glass-button primary">
              Retake Test
            </button>
            <button onClick={exitTest} className="glass-button">
              Test Configurator
            </button>
            <button onClick={() => onNavigate('dashboard')} className="glass-button">
              Go to Dashboard
            </button>
          </div>
        </div>

        {/* Solutions Walkthrough */}
        <h3 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '15px' }}>Questions & Detailed Explanations</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {questions.map((q, idx) => {
            const userAnswer = answers[idx];
            const isCorrect = userAnswer === q.answerIndex;
            const notAnswered = userAnswer === undefined;

            return (
              <div 
                key={q.id} 
                className="glass-card" 
                style={{ 
                  borderLeft: `4px solid ${notAnswered ? 'var(--text-muted)' : isCorrect ? 'var(--color-success)' : 'var(--color-error)'}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span className={`category-badge badge-${q.category}`}>{q.category} • {q.subtopic}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Difficulty: {q.difficulty}</span>
                    {notAnswered ? (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Unanswered</span>
                    ) : isCorrect ? (
                      <span style={{ color: 'var(--color-success)', fontSize: '0.85rem', fontWeight: 600 }}>✓ Correct</span>
                    ) : (
                      <span style={{ color: 'var(--color-error)', fontSize: '0.85rem', fontWeight: 600 }}>✗ Incorrect</span>
                    )}
                  </div>
                </div>

                <p style={{ fontSize: '1rem', fontWeight: 500, lineHeight: 1.5, marginBottom: '18px', whiteSpace: 'pre-wrap' }}>
                  Q{idx + 1}. {q.question}
                </p>

                {/* Options list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
                  {q.options.map((opt, oIdx) => {
                    let optStyle = {
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.9rem',
                      color: 'var(--text-primary)',
                      textAlign: 'left'
                    };

                    if (oIdx === q.answerIndex) {
                      optStyle.background = 'var(--color-success-bg)';
                      optStyle.borderColor = 'var(--color-success)';
                    } else if (oIdx === userAnswer && !isCorrect) {
                      optStyle.background = 'var(--color-error-bg)';
                      optStyle.borderColor = 'var(--color-error)';
                    }

                    return (
                      <div key={oIdx} style={optStyle}>
                        <span style={{ marginRight: '10px', fontWeight: 'bold' }}>{String.fromCharCode(65 + oIdx)}.</span>
                        {opt}
                      </div>
                    );
                  })}
                </div>

                {/* Solution Box */}
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#a5b4fc', marginBottom: '8px', textTransform: 'uppercase' }}>
                    Calculation Solution:
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                    {q.explanation}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // --- RENDERING ACTIVE TEST SIMULATOR SCREEN ---
  const currentQuestion = questions[currentIndex];
  if (!currentQuestion) return null;

  const hasAnswered = answers[currentIndex] !== undefined;

  return (
    <div className="active-test-view">
      {/* Test Control Top Bar */}
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 24px', marginBottom: '24px', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={exitTest} className="glass-button" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
            ← Abort Test
          </button>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Category: <strong style={{ color: '#fff', textTransform: 'capitalize' }}>{category}</strong>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {isTimed && (
            <div 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', color: timeRemaining < 30 ? 'var(--color-error)' : 'var(--text-primary)' }}
              className={timeRemaining < 30 ? "pulse-glow" : ""}
            >
              <svg viewBox="0 0 24 24" style={{ width: '20px', height: '20px', fill: 'currentColor' }}>
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm3.3 12.3L14 13.5V8h1.5v4.25l2.25 1.35-.75 1.2-1.71-.8z"/>
              </svg>
              <span style={{ fontSize: '1.1rem', fontWeight: 'bold', fontFamily: 'monospace' }}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          )}

          <button onClick={() => submitTest(false)} className="glass-button primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            Submit Exam
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '24px' }} className="test-layout-split">
        
        {/* Left Side: Question Pane */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-card" key={currentIndex} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            
            {/* Question Details header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="category-badge badge-quant" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className={`category-badge badge-${currentQuestion.category}`}>
                  {currentQuestion.category}
                </span>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Difficulty: {currentQuestion.difficulty}</span>
            </div>

            {/* Question Text */}
            <p style={{ fontSize: '1.1rem', fontWeight: 500, lineHeight: 1.6, marginBottom: '24px', whiteSpace: 'pre-wrap', color: '#fff' }}>
              {currentQuestion.question}
            </p>

            {/* Option Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {currentQuestion.options.map((option, idx) => {
                const isSelected = answers[currentIndex] === idx;
                const revealed = practiceRevealed[currentIndex];
                const isCorrect = idx === currentQuestion.answerIndex;

                let btnStyle = {
                  width: '100%',
                  textAlign: 'left',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  cursor: (testMode === 'practice' && revealed) ? 'default' : 'pointer',
                  transition: 'var(--transition-fast)'
                };

                if (testMode === 'practice' && revealed) {
                  if (isCorrect) {
                    btnStyle.background = 'var(--color-success-bg)';
                    btnStyle.borderColor = 'var(--color-success)';
                  } else if (isSelected) {
                    btnStyle.background = 'var(--color-error-bg)';
                    btnStyle.borderColor = 'var(--color-error)';
                  } else {
                    btnStyle.opacity = 0.5;
                  }
                } else if (isSelected) {
                  btnStyle.background = 'rgba(99, 102, 241, 0.15)';
                  btnStyle.borderColor = 'var(--color-accent)';
                  btnStyle.boxShadow = '0 0 10px rgba(99, 102, 241, 0.15)';
                }

                return (
                  <button
                    key={idx}
                    disabled={testMode === 'practice' && revealed}
                    onClick={() => selectOption(idx)}
                    style={btnStyle}
                    className={(testMode === 'practice' && revealed) ? "" : "option-btn-hover"}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ 
                        width: '24px', 
                        height: '24px', 
                        borderRadius: '50%', 
                        background: isSelected ? 'var(--color-accent)' : 'rgba(255, 255, 255, 0.08)',
                        color: isSelected ? '#fff' : 'var(--text-secondary)',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '0.85rem',
                        fontWeight: 'bold'
                      }}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{option}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Practice mode instant feedback */}
            {testMode === 'practice' && practiceRevealed[currentIndex] && (
              <div style={{ marginTop: '10px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: 600, color: answers[currentIndex] === currentQuestion.answerIndex ? 'var(--color-success)' : 'var(--color-error)', fontSize: '0.95rem', marginBottom: '8px' }}>
                  {answers[currentIndex] === currentQuestion.answerIndex ? '✓ Correct Answer!' : '✗ Incorrect Answer'}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                  {currentQuestion.explanation}
                </div>
              </div>
            )}

            {/* Question Navigation Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={prevQuestion} 
                  disabled={currentIndex === 0} 
                  className="glass-button"
                >
                  Previous
                </button>
                <button 
                  onClick={nextQuestion} 
                  disabled={currentIndex === questions.length - 1} 
                  className="glass-button"
                >
                  Next
                </button>
              </div>

              <button 
                onClick={toggleFlag} 
                className="glass-button"
                style={flags[currentIndex] ? { borderColor: 'var(--color-warning)', color: 'var(--color-warning)' } : {}}
              >
                <svg viewBox="0 0 24 24" style={{ width: '18px', height: '18px', fill: 'currentColor' }}>
                  <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6z"/>
                </svg>
                {flags[currentIndex] ? 'Flagged for Review' : 'Flag for Review'}
              </button>
            </div>

          </div>
        </div>

        {/* Right Side: Navigation Grid & Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '15px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              Progress Board
            </h3>

            {/* Info counts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <div>
                Answered: <strong style={{ color: '#fff' }}>{Object.keys(answers).length}</strong>
              </div>
              <div>
                Flagged: <strong style={{ color: 'var(--color-warning)' }}>{Object.keys(flags).filter(k => flags[k]).length}</strong>
              </div>
            </div>

            {/* Questions Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '20px' }}>
              {questions.map((_, idx) => {
                const isActive = idx === currentIndex;
                const isAnswered = answers[idx] !== undefined;
                const isFlagged = flags[idx];

                let cellStyle = {
                  height: '42px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  background: 'rgba(255,255,255,0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  position: 'relative',
                  transition: 'var(--transition-fast)'
                };

                if (isActive) {
                  cellStyle.borderColor = 'var(--color-accent)';
                  cellStyle.boxShadow = '0 0 10px rgba(99, 102, 241, 0.2)';
                  cellStyle.background = 'rgba(99, 102, 241, 0.1)';
                  cellStyle.color = '#a5b4fc';
                } else if (isAnswered) {
                  cellStyle.background = 'rgba(99, 102, 241, 0.2)';
                  cellStyle.borderColor = 'rgba(99, 102, 241, 0.4)';
                  cellStyle.color = '#fff';
                }

                return (
                  <button 
                    key={idx} 
                    onClick={() => setCurrentIndex(idx)}
                    style={cellStyle}
                    className="grid-btn-hover"
                  >
                    {idx + 1}
                    {isFlagged && (
                      <span style={{ 
                        position: 'absolute', 
                        top: '2px', 
                        right: '2px', 
                        width: '6px', 
                        height: '6px', 
                        borderRadius: '50%', 
                        background: 'var(--color-warning)' 
                      }}></span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Instructions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '15px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}></span>
                Unvisited
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.4)' }}></span>
                Answered
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', border: '1px solid var(--color-warning)' }}></span>
                Flagged for Review (Dot)
              </div>
            </div>

          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 900px) {
          .test-layout-split {
            grid-template-columns: 1fr !important;
          }
        }
        .option-btn-hover:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          border-color: rgba(255, 255, 255, 0.2) !important;
        }
        .grid-btn-hover:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          border-color: rgba(255, 255, 255, 0.15) !important;
        }
      `}} />
    </div>
  );
}
