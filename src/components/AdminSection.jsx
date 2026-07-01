import React, { useState, useEffect } from 'react';
import TiltCard3D from './TiltCard3D';

export default function AdminSection({ onNavigate }) {
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  // Fetch admin summary data on mount
  useEffect(() => {
    async function fetchAdminSummary() {
      try {
        const res = await fetch('/api/admin/summary', {
          headers: { 'x-user-username': 'admin' }
        });
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Failed to load admin summary.");
        }
        
        setAdminData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAdminSummary();
  }, []);

  const handleDeleteUser = async (username) => {
    const isGuest = username === 'guest';
    const confirmMsg = isGuest 
      ? "Are you sure you want to clear all guest session test records and completed topics progress?"
      : `Are you sure you want to permanently delete user "${username}"? All completed progress and test history will be deleted.`;
      
    if (!window.confirm(confirmMsg)) {
      return;
    }
    
    try {
      const res = await fetch(`/api/admin/user/${username}`, {
        method: 'DELETE',
        headers: { 'x-user-username': 'admin' }
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete user.");
      }
      
      // Update local state
      setAdminData(prev => {
        if (!prev) return prev;
        
        let newUsers;
        if (isGuest) {
          newUsers = prev.users.map(u => 
            u.username === 'guest' 
              ? { ...u, completedCount: 0, completedTopics: [], testCount: 0, avgScore: 0, history: [] }
              : u
          );
        } else {
          newUsers = prev.users.filter(u => u.username !== username);
        }
        
        const activeUsersList = newUsers.filter(u => u.username !== 'guest');
        const activeTests = newUsers.reduce((sum, u) => sum + u.testCount, 0);
        
        let scoreSum = 0.0;
        let testSum = 0;
        newUsers.forEach(u => {
          u.history.forEach(h => {
            const scorePercent = h.total > 0 ? (h.score / h.total * 100) : 0.0;
            scoreSum += scorePercent;
            testSum += 1;
          });
        });
        const overallAvg = testSum > 0 ? Math.round(scoreSum / testSum * 10) / 10 : 0.0;
        
        return {
          ...prev,
          users: newUsers,
          stats: {
            ...prev.stats,
            totalUsers: activeUsersList.length + (newUsers.some(u => u.username === 'guest' && (u.testCount > 0 || u.completedCount > 0)) ? 1 : 0),
            totalTests: activeTests,
            overallAvgScore: overallAvg
          }
        };
      });
      
      if (selectedUser?.username === username) {
        if (isGuest) {
          setSelectedUser(prev => prev ? { ...prev, completedCount: 0, completedTopics: [], testCount: 0, avgScore: 0, history: [] } : null);
        } else {
          setSelectedUser(null);
        }
      }
      
      alert(data.message || "Operation completed successfully.");
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.05)', borderTopColor: 'var(--color-accent)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '20px' }}></div>
        <p style={{ color: 'var(--text-secondary)' }}>Gathering platform aggregates and user statistics...</p>
        <style dangerouslySetInnerHTML={{__html: `@keyframes spin { to { transform: rotate(360deg); } }`}} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card" style={{ padding: '30px', textAlign: 'center', margin: '40px auto', maxWidth: '500px', borderColor: 'var(--color-error)' }}>
        <span style={{ fontSize: '3rem', display: 'block', marginBottom: '10px' }}>⚠️</span>
        <h2 style={{ color: '#fff', marginBottom: '10px', fontSize: '1.4rem' }}>Administrative Access Denied</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '20px', lineHeight: 1.5 }}>{error}</p>
        <button className="glass-button" onClick={() => onNavigate('dashboard')}>Return to Dashboard</button>
      </div>
    );
  }

  const { users = [], stats = {} } = adminData || {};

  // Filter users by search query
  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 className="page-title">Admin Control Center</h1>
          <p className="page-subtitle">Inspect registered users, completed milestones, and simulated test histories.</p>
        </div>
        <button className="glass-button" onClick={() => onNavigate('dashboard')} style={{ fontSize: '0.85rem' }}>
          ← Back to Dashboard
        </button>
      </div>

      {/* Stats Cards Row */}
      <div className="dashboard-grid" style={{ marginBottom: '30px' }}>
        <TiltCard3D className="glass-card stat-card accent-glow pop-in-3d" style={{ padding: '20px' }}>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--color-accent)', borderColor: 'rgba(99, 102, 241, 0.3)' }}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 8 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalUsers || 0}</span>
            <span className="stat-label">Registered Users</span>
          </div>
        </TiltCard3D>

        <TiltCard3D className="glass-card stat-card logical-glow pop-in-3d delay-100" style={{ padding: '20px' }}>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(20, 184, 166, 0.15)', color: '#2dd4bf', borderColor: 'rgba(20, 184, 166, 0.3)' }}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M9 13.75c-1.24 0-2.25-1.01-2.25-2.25s1.01-2.25 2.25-2.25 2.25 1.01 2.25 2.25-1.01 2.25-2.25 2.25zm6-5c-1.24 0-2.25-1.01-2.25-2.25S13.76 4.25 15 4.25s2.25 1.01 2.25 2.25S16.24 8.75 15 8.75zm0 11c-1.24 0-2.25-1.01-2.25-2.25s1.01-2.25 2.25-2.25 2.25 1.01 2.25 2.25-1.01 2.25-2.25 2.25zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.88 9.54c-.21.14-.37.35-.44.6-.21.72-.87 1.21-1.61 1.21-.19 0-.37-.03-.54-.1-.58-.23-.97-.79-.97-1.42a1.83 1.83 0 0 1 1.28-1.74l1.9-.62c.2-.07.38-.2.49-.38.25-.4.25-.9 0-1.3l-.22-.36c-.44-.72.04-1.66.89-1.74.88-.08 1.58.64 1.54 1.52l-.08 1.94c-.01.32.13.63.38.83l1.52 1.22c.67.54.49 1.63-.35 1.92-.85.29-1.75-.41-1.75-1.31v-.64h-.05z"/>
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalTests || 0}</span>
            <span className="stat-label">Total Tests Taken</span>
          </div>
        </TiltCard3D>

        <TiltCard3D className="glass-card stat-card quant-glow pop-in-3d delay-200" style={{ padding: '20px' }}>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', borderColor: 'rgba(139, 92, 246, 0.3)' }}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.overallAvgScore || 0}%</span>
            <span className="stat-label">Average Score</span>
          </div>
        </TiltCard3D>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedUser ? '1fr 1fr' : '1fr', gap: '24px', alignItems: 'start' }}>
        {/* Users List Card */}
        <TiltCard3D className="glass-card pop-in-3d delay-300" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>User Database</h3>
            <input 
              type="text" 
              className="glass-input" 
              placeholder="Search user profile..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ maxWidth: '240px', padding: '8px 12px', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '12px 10px', fontWeight: '500' }}>Username</th>
                  <th style={{ padding: '12px 10px', fontWeight: '500' }}>Completed Topics</th>
                  <th style={{ padding: '12px 10px', fontWeight: '500' }}>Tests Taken</th>
                  <th style={{ padding: '12px 10px', fontWeight: '500' }}>Avg. Score</th>
                  <th style={{ padding: '12px 10px', fontWeight: '500', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '30px 10px', textSpacing: 'center', color: 'var(--text-muted)', textAlign: 'center' }}>
                      No active user records found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, idx) => (
                    <tr 
                      key={user.username} 
                      style={{ 
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        background: selectedUser?.username === user.username ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                        transition: 'var(--transition-fast)',
                        cursor: 'pointer'
                      }}
                      onClick={() => setSelectedUser(user)}
                    >
                      <td style={{ padding: '14px 10px', fontWeight: '600', color: '#fff' }}>
                        {user.username === 'guest' ? (
                          <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>guest (session)</span>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span>{user.username}</span>
                            {user.email && <span style={{ fontSize: '0.75rem', fontWeight: '400', color: 'var(--text-muted)' }}>{user.email}</span>}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 10px' }}>
                        <span style={{ 
                          padding: '2px 8px', 
                          borderRadius: '12px', 
                          fontSize: '0.8rem', 
                          background: 'rgba(20, 184, 166, 0.1)', 
                          color: '#2dd4bf',
                          border: '1px solid rgba(20, 184, 166, 0.2)'
                        }}>
                          {user.completedCount} / 27
                        </span>
                      </td>
                      <td style={{ padding: '14px 10px', color: 'var(--text-secondary)' }}>
                        {user.testCount}
                      </td>
                      <td style={{ padding: '14px 10px', fontWeight: '600', color: user.avgScore >= 70 ? 'var(--color-success)' : user.avgScore >= 40 ? 'var(--color-warning)' : 'var(--color-error)' }}>
                        {user.testCount > 0 ? `${user.avgScore}%` : '—'}
                      </td>
                      <td style={{ padding: '14px 10px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button 
                          className={`glass-button ${selectedUser?.username === user.username ? 'primary' : ''}`}
                          style={{ padding: '4px 12px', fontSize: '0.8rem', minHeight: 'auto' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUser(user);
                          }}
                        >
                          Inspect
                        </button>
                        <button 
                          className="glass-button"
                          style={{ 
                            padding: '4px 8px', 
                            fontSize: '0.8rem', 
                            minHeight: 'auto', 
                            borderColor: 'rgba(239, 68, 68, 0.2)', 
                            color: '#fca5a5',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteUser(user.username);
                          }}
                          title="Delete User Profile"
                        >
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TiltCard3D>

        {/* Detailed Inspector Card */}
        {selectedUser && (
          <TiltCard3D className="glass-card flip-in-3d" style={{ padding: '24px', borderLeft: '3px solid var(--color-accent)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-accent)', fontWeight: 'bold', letterSpacing: '0.05em' }}>User Details Inspector</span>
                <h3 style={{ fontSize: '1.4rem', color: '#fff', marginTop: '4px', fontWeight: 'bold' }}>
                  {selectedUser.username === 'guest' ? 'Guest Access' : selectedUser.username}
                </h3>
                {selectedUser.email && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                    📧 {selectedUser.email}
                  </span>
                )}
              </div>
              <button 
                onClick={() => setSelectedUser(null)} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem', padding: '4px' }}
              >
                ✕
              </button>
            </div>

            {/* Quick Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Progress Completed</span>
                <span style={{ fontSize: '1.25rem', color: '#fff', fontWeight: 'bold' }}>{selectedUser.completedCount} subtopics</span>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Mock Performance</span>
                <span style={{ fontSize: '1.25rem', color: '#fff', fontWeight: 'bold' }}>{selectedUser.testCount > 0 ? `${selectedUser.avgScore}%` : 'No tests'}</span>
              </div>
            </div>

            {/* Completed Subtopics list */}
            <div style={{ marginBottom: '25px' }}>
              <h4 style={{ fontSize: '0.9rem', color: '#fff', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>Completed Topics List</h4>
              {selectedUser.completedTopics.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No topics marked completed yet.</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '120px', overflowY: 'auto', paddingRight: '5px' }}>
                  {selectedUser.completedTopics.map(topic => (
                    <span 
                      key={topic} 
                      style={{ 
                        fontSize: '0.75rem', 
                        padding: '4px 10px', 
                        borderRadius: '6px', 
                        background: 'rgba(99,102,241,0.1)', 
                        color: '#a5b4fc', 
                        border: '1px solid rgba(99,102,241,0.2)'
                      }}
                    >
                      {topic.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Test History List */}
            <div>
              <h4 style={{ fontSize: '0.9rem', color: '#fff', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>Simulated Test History</h4>
              {selectedUser.history.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No simulated mock tests found for this user.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto', paddingRight: '5px' }}>
                  {selectedUser.history.map((record, idx) => {
                    const scorePercent = record.total > 0 ? Math.round((record.score / record.total) * 100) : 0;
                    return (
                      <div 
                        key={idx} 
                        style={{ 
                          padding: '12px', 
                          borderRadius: '8px', 
                          background: 'rgba(255,255,255,0.02)', 
                          border: '1px solid rgba(255,255,255,0.04)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#fff' }}>
                            {record.category === 'all' ? 'Full Mock Test' : record.category.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {record.date} • {record.elapsed || '—'}s
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ 
                            fontSize: '0.9rem', 
                            fontWeight: 'bold', 
                            color: scorePercent >= 70 ? 'var(--color-success)' : scorePercent >= 40 ? 'var(--color-warning)' : 'var(--color-error)'
                          }}>
                            {scorePercent}%
                          </span>
                          <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {record.score}/{record.total} Qs
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TiltCard3D>
        )}
      </div>
    </div>
  );
}
