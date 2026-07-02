import React, { useState } from 'react';
import { topicsData } from '../data/aptitudeData';
import TiltCard3D from './TiltCard3D';

export default function LearnSection({ readTopics, onToggleRead, defaultCategoryFilter = 'all', questionsPool }) {
  const [activeCategory, setActiveCategory] = useState(defaultCategoryFilter);
  const [expandedTopicId, setExpandedTopicId] = useState(null);
  
  // State maps for practice exercises (topicId as key)
  const [activePracticeIndex, setActivePracticeIndex] = useState({}); // { topicId: index }
  const [practiceAnswers, setPracticeAnswers] = useState({}); // { topicId: { qIndex: selectedOpt } }
  const [practiceSubmitted, setPracticeSubmitted] = useState({}); // { topicId: { qIndex: boolean } }

  // Filter topics
  const filteredTopics = activeCategory === 'all' 
    ? topicsData 
    : topicsData.filter(t => t.category === activeCategory);

  const toggleTopic = (id) => {
    if (expandedTopicId === id) {
      setExpandedTopicId(null);
    } else {
      setExpandedTopicId(id);
    }
  };

  // Get 15 practice questions matching the topic title
  const getTopicQuestions = (topicTitle) => {
    if (!questionsPool) return [];
    return questionsPool.filter(q => {
      const qSub = q.subtopic.toLowerCase();
      const tTitle = topicTitle.toLowerCase();
      return qSub === tTitle || qSub.includes(tTitle) || tTitle.includes(qSub);
    }).slice(0, 15); // Take exactly 15 questions
  };

  const handlePracticeSubmit = (topicId, qIdx, optionIdx) => {
    setPracticeAnswers(prev => ({
      ...prev,
      [topicId]: {
        ...(prev[topicId] || {}),
        [qIdx]: optionIdx
      }
    }));
    
    setPracticeSubmitted(prev => ({
      ...prev,
      [topicId]: {
        ...(prev[topicId] || {}),
        [qIdx]: true
      }
    }));
  };

  const resetPracticeQuestion = (topicId, qIdx) => {
    setPracticeAnswers(prev => {
      const copy = { ...prev };
      if (copy[topicId]) {
        delete copy[topicId][qIdx];
      }
      return copy;
    });
    setPracticeSubmitted(prev => {
      const copy = { ...prev };
      if (copy[topicId]) {
        delete copy[topicId][qIdx];
      }
      return copy;
    });
  };

  const setQuestionIndex = (topicId, idx) => {
    setActivePracticeIndex(prev => ({
      ...prev,
      [topicId]: idx
    }));
  };

  return (
    <div className="learn-view fade-in">
      <div className="page-header">
        <h1 className="page-title">Learning Center</h1>
        <p className="page-subtitle font-body">Master shortcuts, formulas, and solving methodologies with hands-on practice.</p>
      </div>

      {/* Category Pills Filter */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap' }}>
        {['all', 'quantitative', 'logical', 'verbal'].map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`glass-button ${activeCategory === cat ? 'primary' : ''}`}
            style={activeCategory === cat && cat !== 'all' ? {
              background: cat === 'quantitative' 
                ? 'linear-gradient(135deg, var(--quant-start) 0%, var(--quant-end) 100%)'
                : cat === 'logical'
                ? 'linear-gradient(135deg, var(--logical-start) 0%, var(--logical-end) 100%)'
                : 'linear-gradient(135deg, var(--verbal-start) 0%, var(--verbal-end) 100%)',
              border: 'none',
              boxShadow: 'none'
            } : {}}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Topics List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {filteredTopics.map((topic, index) => {
          const isExpanded = expandedTopicId === topic.id;
          const isCompleted = readTopics.has(topic.id);
          const topicQs = getTopicQuestions(topic.title);
          const activeQIdx = activePracticeIndex[topic.id] || 0;
          const activeQ = topicQs[activeQIdx];

          const topicAnswers = practiceAnswers[topic.id] || {};
          const topicSubmitted = practiceSubmitted[topic.id] || {};
          const selectedOpt = topicAnswers[activeQIdx];
          const isSubmitted = topicSubmitted[activeQIdx];
          const delayClass = index < 6 ? `delay-${index * 100}` : '';

          return (
            <TiltCard3D 
              key={topic.id} 
              className={`glass-card ${isExpanded ? 'expanded-card' : ''} pop-in-3d ${delayClass}`}
              style={{ 
                padding: '0', 
                overflow: 'hidden',
                borderColor: isExpanded ? 'rgba(99, 102, 241, 0.25)' : 'var(--border-color)',
                boxShadow: isExpanded ? 'var(--glow-shadow)' : 'var(--card-shadow)'
              }}
            >
              {/* Card Header (Clickable toggle) */}
              <div 
                onClick={() => toggleTopic(topic.id)}
                style={{ 
                  padding: '24px', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  background: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent',
                  transition: 'var(--transition-fast)'
                }}
                className="learn-header-hover"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {/* Category bullet indicator */}
                  <span className={`category-badge badge-${topic.category}`}>
                    {topic.category}
                  </span>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {topic.title}
                      {isCompleted && (
                        <svg viewBox="0 0 24 24" style={{ width: '18px', height: '18px', fill: 'var(--color-success)' }}>
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                        </svg>
                      )}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                      {topic.description}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{topic.difficulty}</span>
                  <svg 
                    viewBox="0 0 24 24" 
                    style={{ 
                      width: '24px', 
                      height: '24px', 
                      fill: 'var(--text-secondary)',
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'var(--transition-smooth)'
                    }}
                  >
                    <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/>
                  </svg>
                </div>
              </div>

              {/* Card Expandable Body */}
              <div 
                style={{ 
                  padding: isExpanded ? '24px' : '0 24px', 
                  borderTop: isExpanded ? '1px solid var(--border-color)' : 'none', 
                  background: 'rgba(0,0,0,0.1)',
                  maxHeight: isExpanded ? '3000px' : '0px',
                  overflow: 'hidden',
                  opacity: isExpanded ? 1 : 0,
                  transition: 'max-height 0.5s cubic-bezier(0.16, 1, 0.3, 1), padding 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease-out'
                }}
              >
                  
                  {/* Conceptual Theory */}
                  <div style={{ marginBottom: '25px' }}>
                    <h4 style={{ color: '#fff', fontSize: '1.05rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '6px', height: '14px', borderRadius: '3px', background: 'var(--color-accent)' }}></span>
                      Concept Overview
                    </h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                      {topic.theory}
                    </p>
                  </div>

                  {/* Shortcuts Section */}
                  {topic.shortcuts && topic.shortcuts.length > 0 && (
                    <div style={{ marginBottom: '25px' }}>
                      <h4 style={{ color: '#fff', fontSize: '1.05rem', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '6px', height: '14px', borderRadius: '3px', background: '#f59e0b' }}></span>
                        ⚡ Shortcut Hacks & Tricks
                      </h4>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {topic.shortcuts.map((shortcut, sIdx) => (
                          <div key={sIdx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
                            <h5 style={{ color: '#f59e0b', fontSize: '0.95rem', fontWeight: 600, marginBottom: '6px' }}>
                              {shortcut.title}
                            </h5>
                            <div style={{ 
                              background: 'rgba(245, 158, 11, 0.08)', 
                              borderLeft: '3px solid #f59e0b', 
                              padding: '10px 12px', 
                              fontSize: '0.9rem', 
                              fontFamily: 'monospace', 
                              color: '#fbbf24', 
                              borderRadius: '0 8px 8px 0',
                              marginBottom: '10px'
                            }}>
                              {shortcut.formula}
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '12px', lineHeight: '1.5' }}>
                              {shortcut.explanation}
                            </p>
                            
                            {shortcut.example && (
                              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.05)' }}>
                                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff', marginBottom: '6px' }}>Example Walkthrough:</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '8px', fontStyle: 'italic' }}>
                                  Q: {shortcut.example.problem}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: '1.5', fontFamily: 'monospace' }}>
                                  {shortcut.example.stepByStep}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Interactive Quick Practice Questions (5 items) */}
                  {topicQs.length > 0 && activeQ && (
                    <div style={{ 
                      marginTop: '30px', 
                      background: 'rgba(99, 102, 241, 0.03)', 
                      border: '1px solid rgba(99, 102, 241, 0.15)', 
                      borderRadius: '12px', 
                      padding: '20px'
                    }}>
                      {/* Workbook header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                        <h4 style={{ color: '#fff', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                          <span style={{ width: '6px', height: '14px', borderRadius: '3px', background: 'var(--color-accent)' }}></span>
                          🎯 Interactive Practice Quiz
                        </h4>
                        
                        {/* Pagination indicator */}
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          Question {activeQIdx + 1} of {topicQs.length}
                        </span>
                      </div>

                      {/* Question Content */}
                      <div className="fade-in" key={activeQIdx}>
                        <p style={{ fontSize: '0.95rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '15px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                          {activeQ.question}
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                          {activeQ.options.map((option, idx) => {
                            const isCorrectOpt = idx === activeQ.answerIndex;
                            const isSelected = selectedOpt === idx;
                            
                            let btnStyle = {
                              textAlign: 'left',
                              padding: '12px 14px',
                              borderRadius: '8px',
                              background: 'rgba(0,0,0,0.2)',
                              border: '1px solid var(--border-color)',
                              color: 'var(--text-primary)',
                              cursor: isSubmitted ? 'default' : 'pointer',
                              fontSize: '0.9rem',
                              width: '100%',
                              transition: 'var(--transition-fast)'
                            };

                            if (isSubmitted) {
                              if (isCorrectOpt) {
                                btnStyle.background = 'var(--color-success-bg)';
                                btnStyle.borderColor = 'var(--color-success)';
                              } else if (isSelected) {
                                btnStyle.background = 'var(--color-error-bg)';
                                btnStyle.borderColor = 'var(--color-error)';
                              } else {
                                btnStyle.opacity = 0.5;
                              }
                            } else if (isSelected) {
                              btnStyle.background = 'rgba(99, 102, 241, 0.1)';
                              btnStyle.borderColor = 'var(--color-accent)';
                            }

                            return (
                              <button
                                key={idx}
                                disabled={isSubmitted}
                                onClick={() => handlePracticeSubmit(topic.id, activeQIdx, idx)}
                                style={btnStyle}
                                className={!isSubmitted ? "practice-opt-hover" : ""}
                              >
                                {String.fromCharCode(65 + idx)}. {option}
                              </button>
                            );
                          })}
                        </div>

                        {/* Submission solution feedback */}
                        {isSubmitted && (
                          <div className="flip-in-3d" style={{ background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <span style={{ 
                                color: selectedOpt === activeQ.answerIndex ? 'var(--color-success)' : 'var(--color-error)',
                                fontWeight: 'bold',
                                fontSize: '0.95rem'
                              }}>
                                {selectedOpt === activeQ.answerIndex ? '✓ Correct Answer!' : '✗ Incorrect Answer'}
                              </span>
                              <button onClick={() => resetPracticeQuestion(topic.id, activeQIdx)} className="glass-button" style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '6px' }}>
                                Retry Question
                              </button>
                            </div>
                            <div style={{ 
                              fontSize: '0.85rem', 
                              color: 'var(--text-secondary)', 
                              lineHeight: '1.5',
                              whiteSpace: 'pre-wrap',
                              fontFamily: 'monospace'
                            }}>
                              {activeQ.explanation}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Pagination Controls */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                        <button 
                          onClick={() => setQuestionIndex(topic.id, activeQIdx - 1)}
                          disabled={activeQIdx === 0}
                          className="glass-button"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '6px' }}
                        >
                          ← Previous Ex.
                        </button>
                        <button 
                          onClick={() => setQuestionIndex(topic.id, activeQIdx + 1)}
                          disabled={activeQIdx === topicQs.length - 1}
                          className="glass-button"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '6px' }}
                        >
                          Next Ex. →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Actions Footer */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '30px', paddingTop: '15px', borderTop: '1px solid var(--border-color)' }}>
                    <button 
                      onClick={() => onToggleRead(topic.id)}
                      className="glass-button"
                      style={isCompleted ? { borderColor: 'var(--color-success)', color: 'var(--color-success)' } : {}}
                    >
                      {isCompleted ? '✓ Completed' : 'Mark as Completed'}
                    </button>
                  </div>

              </div>
            </TiltCard3D>
          );
        })}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .learn-header-hover:hover {
          background: rgba(255, 255, 255, 0.04) !important;
        }
        .practice-opt-hover:hover {
          background: rgba(255, 255, 255, 0.05) !important;
          border-color: rgba(99, 102, 241, 0.4) !important;
          transform: translateX(4px);
        }
      `}} />
    </div>
  );
}
