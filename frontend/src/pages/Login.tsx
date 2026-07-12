import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, LogIn, AlertCircle } from 'lucide-react';
import api from '../lib/api';

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('username', 'admin@demo.org');
      formData.append('password', 'adminpass');

      const response = await api.post('/auth/login', formData);
      localStorage.setItem('token', response.data.access_token);

      const userResponse = await api.get('/auth/me');
      localStorage.setItem('userRole', userResponse.data.role);

      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Login failed. Ensure the backend is running and the database is seeded.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #F7F7FA 0%, #EDE9F5 100%)' }}>
      <div className="w-full max-w-sm">
        {/* Logo Card */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #714B67, #5C3B54)' }}>
            <Leaf size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--brand-primary)' }}>EcoSphere</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>ESG Operating System</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-[var(--border)] p-8">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Welcome back</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            Demo login as <span className="font-semibold text-[var(--brand-primary)]">admin@demo.org</span>
          </p>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="form-label">Email</label>
              <input
                type="email"
                defaultValue="admin@demo.org"
                readOnly
                className="form-input opacity-60 cursor-not-allowed"
              />
            </div>
            <div className="mb-6">
              <label className="form-label">Password</label>
              <input
                type="password"
                defaultValue="adminpass"
                readOnly
                className="form-input opacity-60 cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base disabled:opacity-60"
            >
              <LogIn size={18} />
              {loading ? 'Signing in…' : 'Sign in to Dashboard'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[var(--border)] text-center">
            <p className="text-xs text-[var(--text-secondary)]">
              This is a hackathon demo. Credentials are pre-filled.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-[var(--text-secondary)] mt-6">
          EcoSphere · Built for Odoo Hackathon 2026
        </p>
      </div>
    </div>
  );
};

export default Login;
