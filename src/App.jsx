import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import LearnSection from './components/LearnSection';
import TestSection from './components/TestSection';
import AnalyticsSection from './components/AnalyticsSection';
import LoginGate from './components/LoginGate';
import AdminSection from './components/AdminSection';
import SolveTogether from './components/SolveTogether';
import './App.css';

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [subtopicFilter, setSubtopicFilter] = useState('all');
  
  // Auth Session State
  const [currentUser, setCurrentUser] = useState(() => {
    return localStorage.getItem('aptitude_current_user') || null;
  });

  const [questionsPool, setQuestionsPool] = useState([]);
  const [testHistory, setTestHistory] = useState([]);
  const [readTopics, setReadTopics] = useState(new Set());
  const [loading, setLoading] = useState(true);

  // Synchronize data with the backend database
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    async function loadWorkspaceData() {
      setLoading(true);
      try {
        const headers = { 'x-user-username': currentUser };
        const [qRes, histRes, progRes] = await Promise.all([
          fetch('/api/questions'),
          fetch('/api/history', { headers }),
          fetch('/api/progress', { headers })
        ]);
        
        const qData = await qRes.json();
        const histData = await histRes.json();
        const progData = await progRes.json();
        
        setQuestionsPool(qData);
        setTestHistory(histData);
        setReadTopics(new Set(progData));
      } catch (err) {
        console.error("Error synchronization full-stack database:", err);
      } finally {
        setLoading(false);
      }
    }
    loadWorkspaceData();
  }, [currentUser]);

  const handleLoginSuccess = (username) => {
    localStorage.setItem('aptitude_current_user', username);
    setCurrentUser(username);
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      localStorage.removeItem('aptitude_current_user');
      setCurrentUser(null);
      setTestHistory([]);
      setReadTopics(new Set());
    }
  };

  const handleAddTestRecord = async (record) => {
    try {
      const res = await fetch('/api/history', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-username': currentUser
        },
        body: JSON.stringify(record)
      });
      const data = await res.json();
      setTestHistory(prev => [data, ...prev]);
    } catch (err) {
      console.error("Error saving test record to database:", err);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm("Are you sure you want to delete all your test records and statistics from the database?")) {
      try {
        await fetch('/api/history', { 
          method: 'DELETE',
          headers: { 'x-user-username': currentUser }
        });
        setTestHistory([]);
      } catch (err) {
        console.error("Error clearing history:", err);
      }
    }
  };

  const handleToggleRead = async (topicId) => {
    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-username': currentUser
        },
        body: JSON.stringify({ topicId })
      });
      const data = await res.json();
      setReadTopics(new Set(data));
    } catch (err) {
      console.error("Error toggling progress:", err);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-dark)', color: '#fff' }}>
        <div className="glow-blob blob-purple"></div>
        <div className="glow-blob blob-teal"></div>
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', maxWidth: '420px' }}>
          <div className="brand-logo" style={{ margin: '0 auto 20px auto', width: '50px', height: '50px', fontSize: '1.6rem' }}>M</div>
          <h2 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '10px' }}>MyApti</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '25px', lineHeight: '1.5' }}>
            Synchronizing database and compiling 2,700+ aptitude questions...
          </p>
          <div className="spinner" style={{ width: '30px', height: '30px', border: '3px solid rgba(255,255,255,0.05)', borderTopColor: 'var(--color-accent)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
        </div>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}} />
      </div>
    );
  }

  if (!currentUser) {
    return <LoginGate onLoginSuccess={handleLoginSuccess} />;
  }

  // Navigates directly and sets up filters if needed (e.g. starting a specific test category from the dashboard)
  const handleNavigate = (view, filter = 'all') => {
    setSubtopicFilter(filter);
    setActiveView(view);
  };

  return (
    <div className="app-container">
      {/* Ambient background glows */}
      <div className="glow-blob blob-purple"></div>
      <div className="glow-blob blob-teal"></div>

      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">M</div>
          <span className="brand-name">MyApti</span>
        </div>

        <nav className="nav-links">
          <button 
            onClick={() => handleNavigate('dashboard')} 
            className={`nav-link ${activeView === 'dashboard' ? 'active' : ''}`}
            style={{ background: 'transparent', border: 'none', textAlign: 'left', font: 'inherit' }}
          >
            <svg viewBox="0 0 24 24" className="nav-icon">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
            </svg>
            Dashboard
          </button>

          <button 
            onClick={() => handleNavigate('learn')} 
            className={`nav-link ${activeView === 'learn' ? 'active' : ''}`}
            style={{ background: 'transparent', border: 'none', textAlign: 'left', font: 'inherit' }}
          >
            <svg viewBox="0 0 24 24" className="nav-icon">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5.89 12.5L12 15.82l6.11-3.32L12 9.18 5.89 12.5z"/>
            </svg>
            Learn & Shortcuts
          </button>

          <button 
            onClick={() => handleNavigate('test')} 
            className={`nav-link ${activeView === 'test' ? 'active' : ''}`}
            style={{ background: 'transparent', border: 'none', textAlign: 'left', font: 'inherit' }}
          >
            <svg viewBox="0 0 24 24" className="nav-icon">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm3.3 12.3L14 13.5V8h1.5v4.25l2.25 1.35-.75 1.2-1.71-.8z"/>
            </svg>
            Test Simulator
          </button>

          <button 
            onClick={() => handleNavigate('solve')} 
            className={`nav-link ${activeView === 'solve' ? 'active' : ''}`}
            style={{ background: 'transparent', border: 'none', textAlign: 'left', font: 'inherit' }}
          >
            <svg viewBox="0 0 24 24" className="nav-icon" style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            Solve With Jimmy
            <span style={{ fontSize: '0.65rem', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px', fontWeight: 600, display: 'inline-block' }}>Soon</span>
          </button>

          <button 
            onClick={() => handleNavigate('analytics')} 
            className={`nav-link ${activeView === 'analytics' ? 'active' : ''}`}
            style={{ background: 'transparent', border: 'none', textAlign: 'left', font: 'inherit' }}
          >
            <svg viewBox="0 0 24 24" className="nav-icon">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
            </svg>
            Progress Insights
          </button>

          {currentUser === 'admin' && (
            <button 
              onClick={() => handleNavigate('admin')} 
              className={`nav-link ${activeView === 'admin' ? 'active' : ''}`}
              style={{ background: 'transparent', border: 'none', textAlign: 'left', font: 'inherit' }}
            >
              <svg viewBox="0 0 24 24" className="nav-icon">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              </svg>
              Admin Panel
            </button>
          )}
        </nav>

        {/* User Profile Widget */}
        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 10px' }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, var(--color-accent) 0%, #4f46e5 100%)', 
              color: '#fff', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              fontSize: '0.85rem'
            }}>
              {currentUser.charAt(0)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active Profile</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="glass-button" 
            style={{ width: '100%', padding: '8px', fontSize: '0.8rem', justifyContent: 'center', borderColor: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5' }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Page Workspace */}
      <main className="main-content" key={activeView}>
        {activeView === 'dashboard' && (
          <Dashboard 
            testHistory={testHistory} 
            readTopics={readTopics}
            onNavigate={handleNavigate} 
            questionsPool={questionsPool}
          />
        )}
        
        {activeView === 'learn' && (
          <LearnSection 
            readTopics={readTopics} 
            onToggleRead={handleToggleRead}
            defaultCategoryFilter={subtopicFilter} 
            questionsPool={questionsPool}
          />
        )}
        
        {activeView === 'test' && (
          <TestSection 
            onAddTestRecord={handleAddTestRecord} 
            onNavigate={handleNavigate}
            defaultCategory={subtopicFilter} 
            questionsPool={questionsPool}
          />
        )}

        {activeView === 'solve' && (
          <SolveTogether 
            currentUser={currentUser}
            onNavigate={handleNavigate}
          />
        )}
        
        {activeView === 'analytics' && (
          <AnalyticsSection 
            testHistory={testHistory} 
            onClearHistory={handleClearHistory} 
            onNavigate={handleNavigate}
          />
        )}
        
        {activeView === 'admin' && currentUser === 'admin' && (
          <AdminSection 
            onNavigate={handleNavigate}
          />
        )}
      </main>
    </div>
  );
}
