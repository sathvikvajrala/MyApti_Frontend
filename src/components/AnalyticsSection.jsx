import React from 'react';
import TiltCard3D from './TiltCard3D';

export default function AnalyticsSection({ testHistory, onClearHistory, onNavigate }) {
  const totalTests = testHistory.length;

  // Compute overall statistics
  const totalCorrect = testHistory.reduce((acc, curr) => acc + curr.correctAnswers, 0);
  const totalQuestions = testHistory.reduce((acc, curr) => acc + curr.totalQuestions, 0);
  const averageAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  
  const averageTimeSeconds = totalTests > 0 
    ? Math.round(testHistory.reduce((acc, curr) => acc + curr.timeSpentSeconds, 0) / totalTests) 
    : 0;

  // Format time (seconds to MM:SS)
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}m ${remainingSecs}s`;
  };

  // Group by category to analyze strengths and weaknesses
  const categoryStats = {
    quantitative: { correct: 0, total: 0 },
    logical: { correct: 0, total: 0 },
    verbal: { correct: 0, total: 0 }
  };

  testHistory.forEach(record => {
    const cat = record.category;
    if (categoryStats[cat]) {
      categoryStats[cat].correct += record.correctAnswers;
      categoryStats[cat].total += record.totalQuestions;
    } else if (cat === 'all') {
      // If it was a mixed test, distribute based on an estimate or skip for category specifics
      // For simplicity, we just count them if category is specified
    }
  });

  const getCategoryStatus = (accuracy) => {
    if (accuracy >= 75) return { text: "Strong 💪", color: "var(--color-success)" };
    if (accuracy >= 50) return { text: "Moderate ⚖️", color: "var(--color-warning)" };
    return { text: "Needs Practice ⚠️", color: "var(--color-error)" };
  };

  const getCategoryAccuracy = (cat) => {
    const stats = categoryStats[cat];
    return stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : null;
  };

  // Render SVG Line Chart for Trend Analysis
  const renderTrendChart = () => {
    if (totalTests < 2) {
      return (
        <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
          Complete at least 2 tests to visualize your learning curve trend line.
        </div>
      );
    }

    // Prepare chart points (take last 8 tests)
    const chartData = [...testHistory].reverse().slice(-8);
    const width = 600;
    const height = 200;
    const padding = 30;

    const points = chartData.map((d, index) => {
      const x = padding + (index * (width - 2 * padding)) / (chartData.length - 1);
      // Invert Y because SVG origin is top-left
      const y = height - padding - (d.scorePercent * (height - 2 * padding)) / 100;
      return { x, y, score: d.scorePercent, date: d.date };
    });

    // Create path string
    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      pathD += ` L ${points[i].x} ${points[i].y}`;
    }

    return (
      <div style={{ width: '100%', overflowX: 'auto', marginTop: '10px' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', minWidth: '500px', height: 'auto', background: 'rgba(0,0,0,0.15)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(val => {
            const y = height - padding - (val * (height - 2 * padding)) / 100;
            return (
              <g key={val}>
                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                <text x={padding - 8} y={y + 4} fill="var(--text-muted)" fontSize="9" textAnchor="end">{val}%</text>
              </g>
            );
          })}

          {/* Fill Area below line */}
          <path
            d={`${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`}
            fill="url(#chartGradient)"
          />

          {/* Trend Line */}
          <path d={pathD} fill="none" stroke="var(--color-accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data Points */}
          {points.map((p, idx) => (
            <g key={idx}>
              <circle cx={p.x} cy={p.y} r="5" fill="#fff" stroke="var(--color-accent)" strokeWidth="3" style={{ cursor: 'pointer' }} />
              <text x={p.x} y={p.y - 12} fill="var(--text-primary)" fontSize="10" fontWeight="bold" textAnchor="middle">
                {p.score}%
              </text>
              {/* X Axis Labels */}
              <text x={p.x} y={height - 10} fill="var(--text-muted)" fontSize="9" textAnchor="middle">
                Test {idx + 1}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div className="analytics-view fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 className="page-title">Performance Insights</h1>
          <p className="page-subtitle">Track your accuracy trends and identify focus areas for improvement.</p>
        </div>
        {totalTests > 0 && (
          <button onClick={onClearHistory} className="glass-button" style={{ borderColor: 'var(--color-error)', color: '#fca5a5' }}>
            🗑 Reset Test History
          </button>
        )}
      </div>

      {totalTests === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '20px' }}>📊</div>
          <h2 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '10px' }}>No Analytics Available Yet</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 24px auto', fontSize: '0.95rem' }}>
            Once you complete a timed mock test, your scores, speeds, and strength matrices will display here.
          </p>
          <button onClick={() => onNavigate('test')} className="glass-button primary">
            Take Your First Test
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }} className="analytics-split">
          
          {/* Left Column: Trend & History */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {/* Chart Widget */}
            <TiltCard3D className="glass-card pop-in-3d">
              <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '15px' }}>Score Trajectory</h3>
              {renderTrendChart()}
            </TiltCard3D>

            {/* Test Log List */}
            <TiltCard3D className="glass-card pop-in-3d delay-100">
              <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '15px' }}>Recent Attempts</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto', paddingRight: '5px' }}>
                {testHistory.map((record) => (
                  <div 
                    key={record.id} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      background: 'rgba(255,255,255,0.02)', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '10px', 
                      padding: '12px 16px' 
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', textTransform: 'capitalize' }}>
                        {record.category === 'all' ? 'Mixed' : record.category} Aptitude Test
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{record.date}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Accuracy</div>
                        <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: record.scorePercent >= 70 ? 'var(--color-success)' : 'var(--text-primary)' }}>
                          {record.correctAnswers}/{record.totalQuestions} ({record.scorePercent}%)
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Duration</div>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                          {formatTime(record.timeSpentSeconds)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TiltCard3D>
          </div>

          {/* Right Column: Strengths and Weaknesses */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <TiltCard3D className="glass-card pop-in-3d delay-200">
              <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '20px' }}>Topic Proficiency Matrix</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {['quantitative', 'logical', 'verbal'].map(cat => {
                  const accuracy = getCategoryAccuracy(cat);
                  const status = accuracy !== null ? getCategoryStatus(accuracy) : null;
                  
                  return (
                    <div key={cat} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span className={`category-badge badge-${cat}`} style={{ textTransform: 'capitalize' }}>
                          {cat}
                        </span>
                        {status ? (
                          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: status.color }}>
                            {status.text}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No data yet</span>
                        )}
                      </div>

                      {accuracy !== null ? (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                            <span>Topic Accuracy</span>
                            <span>{accuracy}%</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', marginTop: '4px' }}>
                            <div 
                              className="progress-bar-fill"
                              style={{ 
                                width: `${accuracy}%`, 
                                background: cat === 'quantitative' 
                                  ? 'linear-gradient(90deg, var(--quant-start), var(--quant-end))'
                                  : cat === 'logical'
                                  ? 'linear-gradient(90deg, var(--logical-start), var(--logical-end))'
                                  : 'linear-gradient(90deg, var(--verbal-start), var(--verbal-end))'
                              }}
                            ></div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0' }}>Take a {cat} practice test to unlock stats.</p>
                          <button onClick={() => onNavigate('test', cat)} className="glass-button" style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '6px' }}>
                            Test Now
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </TiltCard3D>

            {/* Quick Tips Box */}
            <TiltCard3D className="glass-card pop-in-3d delay-300" style={{ background: 'rgba(245, 158, 11, 0.03)', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
              <h4 style={{ color: '#fbbf24', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                ⚡ Actionable Insights
              </h4>
              <ul style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: 1.5 }}>
                <li>Focus study efforts on topics marked as <strong>Needs Practice ⚠️</strong> in the Learning Center.</li>
                <li>Always utilize <strong>Learn Mode</strong> in testing to walk through step-by-step math shortcut structures.</li>
                <li>Aim for a target accuracy of <strong>80% or higher</strong> to build robust placement-level speed.</li>
              </ul>
            </TiltCard3D>
          </div>

        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 950px) {
          .analytics-split {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />
    </div>
  );
}
