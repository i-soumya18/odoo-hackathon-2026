import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, ChevronRight } from 'lucide-react';
import api from '../lib/api';

/* ── Odoo-style login accounts for the demo switcher ─────────── */
const DEMO_ACCOUNTS = [
  { label: 'Administrator',  email: 'admin@demo.org',  password: 'adminpass',    role: 'Admin' },
  { label: 'Manufacturing Manager', email: 'snair@demo.org', password: 'managerpass', role: 'Manager' },
  { label: 'Employee (Aditi)', email: 'aditi@demo.org', password: 'employeepass', role: 'Employee' },
];

const OdooLogo = () => (
  <svg viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 110, height: 33 }}>
    {/* Odoo "honeycomb" mark */}
    <circle cx="24" cy="30" r="14" fill="white" fillOpacity="0.18"/>
    <circle cx="24" cy="30" r="8"  fill="white"/>
    {/* wordmark */}
    <text x="46" y="40" fontFamily="Inter,sans-serif" fontWeight="700" fontSize="28" fill="white" letterSpacing="-0.5">EcoSphere</text>
  </svg>
);

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail]       = useState('admin@demo.org');
  const [password, setPassword] = useState('adminpass');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);

      const response = await api.post('/auth/login', formData);
      localStorage.setItem('token', response.data.access_token);

      const userResponse = await api.get('/auth/me');
      localStorage.setItem('userRole', userResponse.data.role);
      navigate('/dashboard');
    } catch {
      setError('Invalid credentials. Try one of the demo accounts below.');
    } finally {
      setLoading(false);
    }
  };

  const fillAccount = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError('');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── LEFT PANEL — Odoo-purple brand column ──────────────── */}
      <div style={{
        width: '42%',
        minWidth: 360,
        background: 'linear-gradient(160deg, #714B67 0%, #4E3050 55%, #2D1B3D 100%)',
        display: 'flex',
        flexDirection: 'column',
        padding: '48px 52px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background geometry */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.06,
          backgroundImage: 'radial-gradient(circle at 70% 20%, #ffffff 0%, transparent 55%), radial-gradient(circle at 20% 80%, #ffffff 0%, transparent 55%)',
        }} />
        <div style={{
          position: 'absolute', bottom: -80, right: -80,
          width: 360, height: 360, borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
        }} />
        <div style={{
          position: 'absolute', bottom: -30, right: -30,
          width: 220, height: 220, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
        }} />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 4 }}>
            {/* EcoSphere leaf icon */}
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'rgba(255,255,255,0.18)',
              border: '1px solid rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ width: 22, height: 22 }}>
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10" strokeLinecap="round"/>
                <path d="M12 2c0 5.5 4.5 10 10 10" strokeLinecap="round"/>
                <path d="M12 12v10" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: 22, lineHeight: 1, letterSpacing: '-0.4px' }}>EcoSphere</div>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 3, fontWeight: 400, letterSpacing: 0.3 }}>ESG Operating System</div>
            </div>
          </div>
        </div>

        {/* Mid content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 20, padding: '5px 14px', marginBottom: 28,
            fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: 500, width: 'fit-content',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ADE80', display: 'inline-block' }}/>
            Built for Odoo Hackathon 2026
          </div>

          <h1 style={{ color: 'white', fontWeight: 700, fontSize: 34, lineHeight: 1.2, letterSpacing: '-0.8px', margin: 0, marginBottom: 16 }}>
            Measure what<br/>matters most.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.65, margin: 0, maxWidth: 300 }}>
            Turn your ESG data into a live score your organization tracks, improves, and celebrates — every day.
          </p>

          {/* Pillar pills */}
          <div style={{ display: 'flex', gap: 10, marginTop: 36, flexWrap: 'wrap' }}>
            {[
              { label: 'Environmental', color: '#4ADE80' },
              { label: 'Social',        color: '#60A5FA' },
              { label: 'Governance',    color: '#C084FC' },
              { label: 'Gamification', color: '#FCD34D' },
            ].map(p => (
              <span key={p.label} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 12px',
                borderRadius: 20,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.14)',
                fontSize: 12, color: 'rgba(255,255,255,0.82)', fontWeight: 500,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.color, flexShrink: 0 }}/>
                {p.label}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ position: 'relative', zIndex: 1, color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
          © 2026 EcoSphere · Powered by Odoo
        </div>
      </div>

      {/* ── RIGHT PANEL — login form ────────────────────────────── */}
      <div style={{
        flex: 1,
        background: '#FAFAFA',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 40px',
      }}>

        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#101828', margin: 0, letterSpacing: '-0.4px' }}>
              Sign in to EcoSphere
            </h2>
            <p style={{ fontSize: 14, color: '#667085', marginTop: 6, marginBottom: 0 }}>
              Welcome back! Enter your credentials to continue.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '12px 14px',
              background: '#FEF3F2', border: '1px solid #FECDCA',
              borderRadius: 8, marginBottom: 20,
              fontSize: 13, color: '#B42318',
            }}>
              <AlertCircle size={15} style={{ marginTop: 1, flexShrink: 0 }} />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin}>
            {/* Email */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#344054', marginBottom: 6 }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@company.com"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '10px 14px',
                  border: '1px solid #D0D5DD',
                  borderRadius: 8,
                  fontSize: 14, color: '#101828',
                  background: 'white',
                  outline: 'none',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                  boxShadow: '0 1px 2px rgba(16,24,40,0.05)',
                }}
                onFocus={e => { e.target.style.borderColor = '#714B67'; e.target.style.boxShadow = '0 0 0 3px rgba(113,75,103,0.12)'; }}
                onBlur={e  => { e.target.style.borderColor = '#D0D5DD'; e.target.style.boxShadow = '0 1px 2px rgba(16,24,40,0.05)'; }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#344054' }}>Password</label>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '10px 40px 10px 14px',
                    border: '1px solid #D0D5DD',
                    borderRadius: 8,
                    fontSize: 14, color: '#101828',
                    background: 'white',
                    outline: 'none',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                    boxShadow: '0 1px 2px rgba(16,24,40,0.05)',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#714B67'; e.target.style.boxShadow = '0 0 0 3px rgba(113,75,103,0.12)'; }}
                  onBlur={e  => { e.target.style.borderColor = '#D0D5DD'; e.target.style.boxShadow = '0 1px 2px rgba(16,24,40,0.05)'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#98A2B3', padding: 0,
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            {/* Sign in button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '11px 20px',
                background: loading ? '#9B7A95' : '#714B67',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s, box-shadow 0.15s',
                boxShadow: '0 1px 2px rgba(16,24,40,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
              onMouseEnter={e => { if (!loading) (e.target as HTMLButtonElement).style.background = '#5C3B54'; }}
              onMouseLeave={e => { if (!loading) (e.target as HTMLButtonElement).style.background = '#714B67'; }}
            >
              {loading ? (
                <>
                  <svg style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
                    <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                  Signing in…
                </>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#E4E7EC' }}/>
            <span style={{ fontSize: 12, color: '#98A2B3', whiteSpace: 'nowrap' }}>Demo accounts</span>
            <div style={{ flex: 1, height: 1, background: '#E4E7EC' }}/>
          </div>

          {/* Demo account switcher */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {DEMO_ACCOUNTS.map(acc => (
              <button
                key={acc.email}
                type="button"
                onClick={() => fillAccount(acc)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: email === acc.email ? '#F4EEF3' : 'white',
                  border: email === acc.email ? '1px solid #C8A8C0' : '1px solid #E4E7EC',
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  textAlign: 'left',
                }}
                onMouseEnter={e => { if (email !== acc.email) (e.currentTarget as HTMLButtonElement).style.borderColor = '#C8A8C0'; }}
                onMouseLeave={e => { if (email !== acc.email) (e.currentTarget as HTMLButtonElement).style.borderColor = '#E4E7EC'; }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#101828' }}>{acc.label}</div>
                  <div style={{ fontSize: 12, color: '#667085', marginTop: 1 }}>{acc.email}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                    background: acc.role === 'Admin' ? '#F4EEF3' : acc.role === 'Manager' ? '#EFF6FF' : '#F0FDF4',
                    color:      acc.role === 'Admin' ? '#714B67' : acc.role === 'Manager' ? '#3B82F6' : '#16A34A',
                  }}>
                    {acc.role}
                  </span>
                  <ChevronRight size={14} style={{ color: '#98A2B3' }}/>
                </div>
              </button>
            ))}
          </div>

          <p style={{ fontSize: 12, color: '#98A2B3', textAlign: 'center', marginTop: 28 }}>
            Hackathon demo — credentials auto-filled
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .login-left { display: none !important; }
          .login-right { flex: 1 !important; }
        }
      `}</style>
    </div>
  );
};

export default Login;
