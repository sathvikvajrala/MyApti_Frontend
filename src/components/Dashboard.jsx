import React, { useState, useEffect } from 'react';

export default function Dashboard({ testHistory, onNavigate, readTopics, questionsPool }) {
  const [dailyQuestion, setDailyQuestion] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);

  // Select a random question for the daily challenge on mount
  useEffect(() => {
    if (questionsPool && questionsPool.length > 0) {
      // Use date-based index so it changes daily but stays constant for the same day
      const day = new Date().getDate();
      const index = day % questionsPool.length;
      setDailyQuestion(questionsPool[index]);
    }
  }, [questionsPool]);

  // Calculate statistics
  const totalTests = testHistory.length;
  const avgScore = totalTests > 0 
    ? Math.round(testHistory.reduce((acc, curr) => acc + curr.scorePercent, 0) / totalTests) 
    : 0;
  
  const totalQuestionsAnswered = testHistory.reduce((acc, curr) => acc + curr.totalQuestions, 0);
  const totalCorrectAnswers = testHistory.reduce((acc, curr) => acc + curr.correctAnswers, 0);
  const overallAccuracy = totalQuestionsAnswered > 0 
    ? Math.round((totalCorrectAnswers / totalQuestionsAnswered) * 100)
    : 0;

  const handleDailySubmit = (optionIndex) => {
    if (isAnswered) return;
    setSelectedOption(optionIndex);
    setIsAnswered(true);
  };

  const resetDaily = () => {
    setIsAnswered(false);
    setSelectedOption(null);
    // Pick another random one
    const randIndex = Math.floor(Math.random() * questionsPool.length);
    setDailyQuestion(questionsPool[randIndex]);
  };

  return (
    <div className="dashboard-view fade-in">
      <div className="page-header">
        <h1 className="page-title">MyApti Workspace</h1>
        <p className="page-subtitle">Sharpen your cognitive skills with targeted learning and timed testing.</p>
      </div>

      {/* Statistics Row */}
      <div className="dashboard-grid">
        <div className="glass-card stat-card">
          <div className="stat-icon-wrapper" style={{ borderLeft: '4px solid var(--color-accent)' }}>
            <svg viewBox="0 0 24 24" className="nav-icon" style={{ color: 'var(--color-accent)' }}>
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2zm0 4H7v-2h10v2zm0-8H7V7h10v2z"/>
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{totalTests}</span>
            <span className="stat-label">Tests Completed</span>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon-wrapper" style={{ borderLeft: '4px solid #10b981' }}>
            <svg viewBox="0 0 24 24" className="nav-icon" style={{ color: '#10b981' }}>
              <path d="M9 13.75l-3.5-3.5L4.25 11.5l4.75 4.75 9-9-1.25-1.25L9 13.75z"/>
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{avgScore}%</span>
            <span className="stat-label">Average Score</span>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon-wrapper" style={{ borderLeft: '4px solid #f59e0b' }}>
            <svg viewBox="0 0 24 24" className="nav-icon" style={{ color: '#f59e0b' }}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{overallAccuracy}%</span>
            <span className="stat-label">Overall Accuracy</span>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon-wrapper" style={{ borderLeft: '4px solid #ef4444' }}>
            <svg viewBox="0 0 24 24" className="nav-icon" style={{ color: '#ef4444' }}>
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5.89 12.5L12 15.82l6.11-3.32L12 9.18 5.89 12.5z"/>
            </svg>
          </div>
          <div className="stat-info" style={{ width: '100%' }}>
            <span className="stat-value" style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              {readTopics.size} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ 27</span>
            </span>
            <span className="stat-label">Topics Explored</span>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
              <div 
                className="progress-bar-fill" 
                style={{ 
                  width: `${Math.round((readTopics.size / 27) * 100)}%`,
                  background: 'linear-gradient(90deg, var(--verbal-start), var(--verbal-end))'
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Categories & Daily Challenge */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', flexWrap: 'wrap' }} className="responsive-split">
        
        {/* Categories Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-primary)' }}>Learning Path</h2>
          
          {/* Quantitative Card */}
          <div className="glass-card quant-glow" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="category-badge badge-quant">Quantitative Aptitude</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Math & Number Tricks</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Master quick math formulas, ratio adjustments, successive changes, speed problems, and LCM shortcuts.
            </p>
            <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
              <button onClick={() => onNavigate('learn', 'quantitative')} className="glass-button primary" style={{ background: 'linear-gradient(135deg, var(--quant-start) 0%, var(--quant-end) 100%)', boxShadow: 'none' }}>
                Study Materials
              </button>
              <button onClick={() => onNavigate('test', 'quantitative')} className="glass-button">
                Start Test
              </button>
            </div>
          </div>

          {/* Logical Card */}
          <div className="glass-card logical-glow" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="category-badge badge-logical">Logical Reasoning</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Patterns & Deduction</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Solve syllogisms, blood relations, letter positions, sequences, and decoding structures using visual logic trees.
            </p>
            <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
              <button onClick={() => onNavigate('learn', 'logical')} className="glass-button primary" style={{ background: 'linear-gradient(135deg, var(--logical-start) 0%, var(--logical-end) 100%)', boxShadow: 'none' }}>
                Study Materials
              </button>
              <button onClick={() => onNavigate('test', 'logical')} className="glass-button">
                Start Test
              </button>
            </div>
          </div>

          {/* Verbal Card */}
          <div className="glass-card verbal-glow" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="category-badge badge-verbal">Verbal Ability</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Grammar & Comprehension</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Perfect your subject-verb agreements, modifiers, and sentence corrections using parenthetical elimination tricks.
            </p>
            <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
              <button onClick={() => onNavigate('learn', 'verbal')} className="glass-button primary" style={{ background: 'linear-gradient(135deg, var(--verbal-start) 0%, var(--verbal-end) 100%)', boxShadow: 'none' }}>
                Study Materials
              </button>
              <button onClick={() => onNavigate('test', 'verbal')} className="glass-button">
                Start Test
              </button>
            </div>
          </div>
        </div>

        {/* Daily Challenge Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-primary)' }}>Daily Challenge</h2>
          
          {dailyQuestion && (
            <div className="glass-card" style={{ border: '1px solid rgba(99, 102, 241, 0.2)', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <span className={`category-badge badge-${dailyQuestion.category}`}>
                  {dailyQuestion.category} • {dailyQuestion.subtopic}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Difficulty: {dailyQuestion.difficulty}</span>
              </div>
              
              <p style={{ fontSize: '1rem', fontWeight: '500', lineHeight: '1.6', marginBottom: '20px', whiteSpace: 'pre-wrap' }}>
                {dailyQuestion.question}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {dailyQuestion.options.map((option, idx) => {
                  let optionClass = "option-btn";
                  let style = {
                    width: '100%',
                    textAlign: 'left',
                    padding: '14px 16px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    cursor: isAnswered ? 'default' : 'pointer',
                    transition: 'var(--transition-fast)',
                  };

                  if (isAnswered) {
                    if (idx === dailyQuestion.answerIndex) {
                      style.background = 'var(--color-success-bg)';
                      style.borderColor = 'var(--color-success)';
                    } else if (idx === selectedOption) {
                      style.background = 'var(--color-error-bg)';
                      style.borderColor = 'var(--color-error)';
                    } else {
                      style.opacity = '0.5';
                    }
                  } else {
                    style[':hover'] = {
                      background: 'rgba(255, 255, 255, 0.08)'
                    };
                  }

                  return (
                    <button
                      key={idx}
                      disabled={isAnswered}
                      onClick={() => handleDailySubmit(idx)}
                      style={style}
                      className={!isAnswered ? "daily-option-hover" : ""}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ 
                          width: '24px', 
                          height: '24px', 
                          borderRadius: '50%', 
                          background: isAnswered && idx === dailyQuestion.answerIndex ? 'var(--color-success)' : 'rgba(255, 255, 255, 0.08)',
                          color: isAnswered && idx === dailyQuestion.answerIndex ? '#fff' : 'var(--text-secondary)',
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

              {isAnswered && (
                <div style={{ marginTop: 'auto', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ 
                      color: selectedOption === dailyQuestion.answerIndex ? 'var(--color-success)' : 'var(--color-error)',
                      fontWeight: 'bold',
                      fontSize: '1rem'
                    }}>
                      {selectedOption === dailyQuestion.answerIndex ? '✓ Correct Answer!' : '✗ Incorrect Answer'}
                    </span>
                  </div>
                  <div style={{ 
                    fontSize: '0.9rem', 
                    color: 'var(--text-secondary)', 
                    lineHeight: '1.5',
                    maxHeight: '180px',
                    overflowY: 'auto',
                    paddingRight: '5px',
                    maxHeight: '180px',
                    overflowY: 'auto',
                    paddingRight: '5px',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {dailyQuestion.explanation}
                  </div>
                  <button onClick={resetDaily} className="glass-button" style={{ width: '100%', marginTop: '15px', justifyContent: 'center' }}>
                    Try Another Challenge
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 900px) {
          .responsive-split {
            grid-template-columns: 1fr !important;
          }
        }
        .daily-option-hover:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          border-color: rgba(255, 255, 255, 0.2) !important;
        }
      `}} />
    </div>
  );
}
