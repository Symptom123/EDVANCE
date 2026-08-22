import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const API = (import.meta.env.VITE_API_URL || 'https://edvance-1v00.onrender.com').replace(/\/+$/, '');

// Shared design tokens (Balanced template style)
const T = {
  bg: '#f5f3ef',
  white: '#ffffff',
  border: '#e8e4dc',
  text: '#1a1a1a',
  muted: '#6b6b6b',
  light: '#a0998c',
  fontSerif: '"DM Serif Text", Georgia, serif',
  fontSans: '"DM Sans", system-ui, sans-serif',
};

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [userId, setUserId] = useState(null);
  const [schoolConfigCache, setSchoolConfigCache] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const routeUser = (cfg) => {
    if (cfg.userRole === 'Admin') navigate('/admin');
    else if (cfg.userRole === 'Teacher') navigate('/teacher');
    else if (cfg.userRole === 'Student') navigate('/student');
    else if (cfg.userRole === 'Parent') navigate('/parent');
    else navigate('/login');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error('Invalid email or password. Please check your credentials.');
      const data = await res.json();
      const school = data.school || {};
      let cfg = {};
      try { cfg = JSON.parse(school.configJson || '{}'); } catch (_) {}

      const configToCache = {
        schoolId: school.ID || school.id || data.schoolId || data.school_id || '',
        schoolName: school.name || school.Name || 'Edvance School',
        primaryColor: school.primaryColor || '#2563eb',
        levels: { primary: school.hasPrimary, secondary: school.hasSecondary },
        features: school.features || {},
        userRole: data.role,
        userId: data.userId,
        id: data.userId,
        name: data.name,
        email: data.email,
      };

      if (data.firstLogin) {
        setIsFirstLogin(true);
        setUserId(data.userId);
        setSchoolConfigCache(configToCache);
      } else {
        localStorage.setItem('edvance_school_config', JSON.stringify(configToCache));
        routeUser(configToCache);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    
    const isParent = schoolConfigCache?.userRole === 'Parent';
    if (isParent && !newEmail) { setError('Email is required.'); return; }

    setLoading(true);
    setError('');
    try {
      if (isParent) {
        const res = await fetch(`${API}/api/parents/claim`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parentId: userId, newEmail, newPassword }),
        });
        if (!res.ok) throw new Error('Failed to claim account. Please try again.');
        const updatedParent = await res.json();
        const updatedConfig = { ...schoolConfigCache, email: updatedParent.email };
        localStorage.setItem('edvance_school_config', JSON.stringify(updatedConfig));
        routeUser(updatedConfig);
      } else {
        const res = await fetch(`${API}/api/auth/set-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, newPassword }),
        });
        if (!res.ok) throw new Error('Failed to set password. Please try again.');
        localStorage.setItem('edvance_school_config', JSON.stringify(schoolConfigCache));
        routeUser(schoolConfigCache);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    width: '100%', padding: '13px 16px',
    fontFamily: T.fontSans, fontSize: 15,
    border: `1.5px solid ${T.border}`, borderRadius: 10,
    background: T.white, color: T.text, outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.2s',
  };

  const accentColor = schoolConfigCache?.primaryColor || '#2D8C8C';

  return (
    <div className="login-page-root">
      {/* LEFT PANEL — Branding (Desktop) */}
      <div className="login-branding-panel">
        {/* Logo */}
        <div className="login-branding-logo">
          <Link to="/">
            <img
              src="/images/logo-horizontal.png"
              alt="Edvance Logo"
              style={{ height: 52, width: 'auto', objectFit: 'contain' }}
              onError={(e) => { e.target.src = '/logo.png'; }}
            />
          </Link>
        </div>

        {/* Hero Text */}
        <div className="login-branding-text">
          <h1 className="login-branding-heading">
            Excellence in <br />
            <span>Education Management.</span>
          </h1>
          <p className="login-branding-sub">
            A comprehensive, secure, and intuitive platform designed to elevate the administrative and academic experience for your institution.
          </p>
        </div>

        {/* Footer */}
        <div className="login-branding-footer">
          <div className="login-branding-line" />
          <p>
            Edvance Global Educational Solutions
          </p>
        </div>
      </div>

      {/* RIGHT PANEL — Form */}
      <div className="login-form-panel">
        <div className="login-form-card">

          {/* Mobile brand header (visible on <= 900px) */}
          <div className="login-mobile-brand-header">
            <Link to="/">
              <img
                src="/images/logo-horizontal.png"
                alt="Edvance Logo"
                className="login-mobile-logo"
                onError={(e) => { e.target.src = '/logo.png'; }}
              />
            </Link>
            <span className="login-mobile-badge">Enterprise School Portal</span>
          </div>

          {!isFirstLogin ? (
            <>
              <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 'clamp(24px, 3.5vw, 32px)', color: T.text, margin: '0 0 6px', fontWeight: 400 }}>
                  Welcome back
                </h2>
                <p style={{ color: T.muted, fontSize: 14, margin: 0 }}>
                  Sign in with your school-issued credentials.
                </p>
              </div>

              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', color: '#b91c1c', fontSize: 14, marginBottom: 20, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span>⚠️</span> {error}
                </div>
              )}

              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 8, letterSpacing: '0.2px' }}>Email address</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="name@school.edvance.com" style={inp} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 8, letterSpacing: '0.2px' }}>Password</label>
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" style={inp} />
                </div>

                <button type="submit" disabled={loading} style={{
                  marginTop: 8, padding: '15px', borderRadius: 100, border: 'none',
                  background: accentColor, color: 'white', fontFamily: T.fontSans,
                  fontSize: 15, fontWeight: 600, cursor: loading ? 'wait' : 'pointer',
                  letterSpacing: '0.2px', transition: 'opacity 0.2s',
                  opacity: loading ? 0.7 : 1,
                }}>
                  {loading ? 'Signing in…' : 'Sign In →'}
                </button>
              </form>

              <p style={{ textAlign: 'center', marginTop: 32, fontSize: 14, color: T.muted }}>
                Setting up a new school?{' '}
                <Link to="/register" style={{ color: T.text, fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                  Register here
                </Link>
              </p>
            </>
          ) : (
            <>
              <div style={{ marginBottom: 40 }}>
                <div style={{ width: 52, height: 52, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 20 }}>
                  {schoolConfigCache?.userRole === 'Parent' ? '👪' : '🔑'}
                </div>
                <h2 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 34, color: T.text, margin: '0 0 10px', fontWeight: 400 }}>
                  {schoolConfigCache?.userRole === 'Parent' ? 'Claim Your Account' : 'Set your password'}
                </h2>
                <p style={{ color: T.muted, fontSize: 15, margin: 0, lineHeight: 1.6 }}>
                  {schoolConfigCache?.userRole === 'Parent' ? 'Welcome to Edvance! Please set your personal email and a secure password to access your parent portal.' : `Welcome to ${schoolConfigCache?.schoolName}! Create a secure password to access your portal.`}
                </p>
              </div>

              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', color: '#b91c1c', fontSize: 14, marginBottom: 20, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span>⚠️</span> {error}
                </div>
              )}

              <form onSubmit={handleSetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {schoolConfigCache?.userRole === 'Parent' && (
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 8 }}>Your Email Address</label>
                    <input type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)}
                      placeholder="parent@example.com" style={inp} />
                  </div>
                )}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 8 }}>New Password</label>
                  <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters" style={inp} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 8 }}>Confirm Password</label>
                  <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password" style={inp} />
                </div>
                <button type="submit" disabled={loading} style={{
                  marginTop: 8, padding: '15px', borderRadius: 100, border: 'none',
                  background: accentColor, color: 'white', fontFamily: T.fontSans,
                  fontSize: 15, fontWeight: 600, cursor: loading ? 'wait' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}>
                  {loading ? 'Saving…' : 'Set Password & Enter Portal →'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
