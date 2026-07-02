import React, { useState } from 'react';

export default function LoginGate({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccessMsg, setResendSuccessMsg] = useState('');
  const [debugOtp, setDebugOtp] = useState('');

  const startResendTimer = () => {
    setResendCooldown(30);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    
    setErrorMsg('');
    setResendSuccessMsg('');
    setLoading(true);
    
    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to resend code.");
      }
      
      if (data.debug_otp) {
        setDebugOtp(data.debug_otp);
        setResendSuccessMsg("SMTP not configured. New test OTP generated!");
      } else {
        setDebugOtp('');
        setResendSuccessMsg("Verification code has been resent successfully!");
      }
      startResendTimer();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSignUp && showOtpScreen) {
      if (!otp.trim()) {
        setErrorMsg("Please enter the verification code.");
        return;
      }
      
      setErrorMsg('');
      setLoading(true);
      
      try {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: username.trim(),
            password: password.trim(),
            email: email.trim(),
            otp: otp.trim()
          })
        });
        
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Signup verification failed.");
        }
        
        onLoginSuccess(data.username);
      } catch (err) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!username.trim() || !password.trim() || (isSignUp && !email.trim())) {
      setErrorMsg("Please fill in all fields.");
      return;
    }

    setErrorMsg('');
    setLoading(true);

    if (isSignUp) {
      // Send OTP phase
      try {
        const res = await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: username.trim(),
            email: email.trim()
          })
        });
        
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to send verification code.");
        }
        
        if (data.debug_otp) {
          setDebugOtp(data.debug_otp);
        } else {
          setDebugOtp('');
        }
        setShowOtpScreen(true);
        startResendTimer();
      } catch (err) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      // Login phase
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: username.trim(),
            password: password.trim()
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Authentication failed.");
        }

        onLoginSuccess(data.username);
      } catch (err) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh', 
      padding: '20px',
      position: 'relative'
    }}>
      {/* Background blobs */}
      <div className="glow-blob blob-purple"></div>
      <div className="glow-blob blob-teal"></div>

      <div className="glass-card accent-glow login-gate-3d" style={{ 
        width: '100%', 
        maxWidth: '420px', 
        padding: '40px 30px', 
        textAlign: 'center',
        border: '1px solid rgba(255,255,255,0.08)'
      }}>
        {/* Logo and Brand */}
        <div className="brand-logo" style={{ 
          margin: '0 auto 20px auto', 
          width: '56px', 
          height: '56px', 
          fontSize: '1.8rem',
          borderRadius: '14px'
        }}>
          M
        </div>
        <h1 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '8px' }}>MyApti</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '30px' }}>
          {isSignUp ? "Create a workspace to track progress" : "Sign in to access your dashboard"}
        </p>

        {/* Error Message */}
        {errorMsg && (
          <div className="fade-in" style={{ 
            background: 'var(--color-error-bg)', 
            border: '1px solid var(--color-error)', 
            color: '#fca5a5', 
            padding: '12px', 
            borderRadius: '8px', 
            fontSize: '0.85rem', 
            marginBottom: '20px',
            textAlign: 'left',
            lineHeight: 1.4
          }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Form area */}
        {!showOtpScreen ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '500' }}>
                Username
              </label>
              <input 
                type="text" 
                className="glass-input" 
                placeholder="Enter your username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                disabled={loading}
                autoComplete="username"
              />
            </div>

            {isSignUp && (
              <div style={{ textAlign: 'left' }} className="fade-in">
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '500' }}>
                  Email Address
                </label>
                <input 
                  type="email" 
                  className="glass-input" 
                  placeholder="Enter your email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            )}

            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '500' }}>
                Password
              </label>
              <input 
                type="password" 
                className="glass-input" 
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            <button 
              type="submit" 
              className="glass-button primary" 
              style={{ 
                width: '100%', 
                height: '46px', 
                fontSize: '1rem', 
                fontWeight: '600', 
                justifyContent: 'center',
                marginTop: '10px'
              }}
              disabled={loading}
            >
              {loading ? "Authenticating..." : isSignUp ? "Sign Up" : "Sign In"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ textAlign: 'left' }} className="fade-in">
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px', fontWeight: '500', lineHeight: 1.4 }}>
                We've sent a 6-digit verification code to <strong style={{ color: '#fff' }}>{email}</strong>. 
                {debugOtp && (
                  <div style={{ 
                    marginTop: '10px', 
                    padding: '12px', 
                    background: 'rgba(234, 179, 8, 0.1)', 
                    border: '1px solid rgba(234, 179, 8, 0.3)', 
                    borderRadius: '8px', 
                    color: '#fef08a', 
                    fontSize: '0.85rem',
                    textAlign: 'left',
                    lineHeight: 1.4
                  }}>
                    ⚠️ <strong>Sandbox Mode:</strong> SMTP is not configured. Your test OTP is: <strong style={{ fontSize: '1.2rem', color: '#fff', display: 'block', marginTop: '6px', letterSpacing: '0.1em', textAlign: 'center' }}>{debugOtp}</strong>
                  </div>
                )}
                {!debugOtp && resendSuccessMsg && (
                  <span style={{ display: 'block', color: 'var(--color-success)', marginTop: '8px', fontWeight: 'bold' }}>✓ {resendSuccessMsg}</span>
                )}
                {!debugOtp && !resendSuccessMsg && (
                  <span style={{ display: 'block', color: 'var(--text-muted)', marginTop: '4px', fontSize: '0.78rem' }}>Check your email inbox (and spam folder) for the code.</span>
                )}
              </label>
              <input 
                type="text" 
                maxLength="6"
                className="glass-input" 
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                disabled={loading}
                style={{ textAlign: 'center', fontSize: '1.4rem', letterSpacing: '0.2em', fontWeight: 'bold' }}
              />
            </div>
            
            <button 
              type="submit" 
              className="glass-button primary" 
              style={{ 
                width: '100%', 
                height: '46px', 
                fontSize: '1rem', 
                fontWeight: '600', 
                justifyContent: 'center',
                marginTop: '10px'
              }}
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify & Create Account"}
            </button>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
              <button 
                type="button" 
                className="glass-button" 
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || loading}
                style={{ 
                  flex: 1,
                  height: '40px', 
                  fontSize: '0.9rem', 
                  justifyContent: 'center',
                  background: 'transparent',
                  borderColor: 'var(--border-color)',
                  opacity: resendCooldown > 0 ? 0.6 : 1
                }}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
              </button>
              
              <button 
                type="button" 
                className="glass-button" 
                onClick={() => {
                  setShowOtpScreen(false);
                  setErrorMsg('');
                  setResendSuccessMsg('');
                  setOtp('');
                }}
                style={{ 
                  flex: 1,
                  height: '40px', 
                  fontSize: '0.9rem', 
                  justifyContent: 'center',
                  background: 'transparent',
                  borderColor: 'var(--border-color)'
                }}
                disabled={loading}
              >
                ← Go Back
              </button>
            </div>
          </form>
        )}

        {/* Guest access alternative */}
        <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
          <button 
            onClick={() => onLoginSuccess('guest')}
            style={{ background: 'transparent', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline' }}
          >
            Continue as Guest (No sync)
          </button>
        </div>

        {/* Toggle Switch */}
        <div style={{ marginTop: '24px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          {isSignUp ? "Already have an account?" : "New to MyApti?"}{' '}
          <button 
            type="button" 
            onClick={() => {
              setIsSignUp(!isSignUp);
              setShowOtpScreen(false);
              setErrorMsg('');
              setEmail('');
              setOtp('');
            }}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: '#fff', 
              fontWeight: '600', 
              cursor: 'pointer', 
              textDecoration: 'underline',
              fontFamily: 'inherit'
            }}
          >
            {isSignUp ? "Sign In" : "Register"}
          </button>
        </div>
      </div>
    </div>
  );
}
