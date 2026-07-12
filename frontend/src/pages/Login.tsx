import React from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base">
      <div className="p-8 bg-surface rounded-lg shadow-sm border border-border max-w-sm w-full">
        <h1 className="text-2xl font-semibold mb-6 text-text-primary text-center">Login to EcoSphere</h1>
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full py-2 bg-brand-primary text-white rounded hover:bg-brand-primary-hover transition-colors"
        >
          Enter App
        </button>
      </div>
    </div>
  );
};

export default Login;
