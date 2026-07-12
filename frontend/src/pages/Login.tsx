import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
      formData.append('username', 'admin@demo.org'); // Default for demo
      formData.append('password', 'adminpass');

      const response = await api.post('/auth/login', formData);
      localStorage.setItem('token', response.data.access_token);
      
      // Also get current user details
      const userResponse = await api.get('/auth/me');
      localStorage.setItem('userRole', userResponse.data.role);
      
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Login failed. Ensure backend is running and seeded.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base">
      <div className="p-8 bg-surface rounded-lg shadow-sm border border-border max-w-sm w-full">
        <h1 className="text-2xl font-semibold mb-6 text-text-primary text-center">Login to EcoSphere</h1>
        <p className="text-sm text-text-secondary mb-4 text-center">
          For demo purposes, this will automatically log you in as <strong>admin@demo.org</strong>
        </p>
        
        {error && <div className="mb-4 text-red-500 text-sm text-center">{error}</div>}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-2 bg-brand-primary text-white rounded hover:bg-brand-primary-hover transition-colors disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Enter App'}
        </button>
      </div>
    </div>
  );
};

export default Login;
