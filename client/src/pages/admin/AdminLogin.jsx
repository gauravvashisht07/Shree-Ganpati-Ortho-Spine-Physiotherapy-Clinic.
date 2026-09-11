import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If already authenticated, redirect straight to dashboard
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      const destination = location.state?.from?.pathname || '/admin';
      navigate(destination, { replace: true });
    } catch (err) {
      setErrorMsg(err.message || 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col justify-center items-center px-4 py-12">
      {/* Top Header / Return link */}
      <div className="mb-8 text-center">
        <Link to="/" className="inline-flex items-center gap-3 group">
          <img 
            src="/LOGO.jpeg" 
            alt="Logo" 
            className="w-12 h-12 rounded-full object-contain border-2 border-[#1F8A82] shadow-sm group-hover:scale-105 transition-transform" 
          />
          <div className="text-left">
            <span className="font-display font-black text-[#221B26] text-xl leading-tight block">
              Shree Ganpati
            </span>
            <span className="text-[#1F8A82] text-xs font-bold tracking-wider uppercase block">
              Ortho &amp; Spine Physiotherapy Clinic
            </span>
          </div>
        </Link>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-coral/10 text-coral flex items-center justify-center font-bold text-lg">
            🔒
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-ink">Admin Portal</h1>
            <p className="text-xs text-gray-500 font-body">Restricted to clinic staff & administrators</p>
          </div>
        </div>

        <hr className="my-6 border-gray-100" />

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl font-bold flex items-start gap-3">
            <span className="text-red-500 text-base leading-none mt-0.5">⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 font-display">
              Admin Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@shreeganpati.com"
              className="w-full bg-gray-50 border border-gray-200 px-4 py-3.5 rounded-2xl focus:border-coral focus:outline-none font-bold text-ink transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 font-display">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-gray-50 border border-gray-200 px-4 py-3.5 rounded-2xl focus:border-coral focus:outline-none text-ink font-bold transition-colors pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-ink text-sm font-bold transition-colors"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-coral hover:bg-[#E55A39] text-white font-bold py-4 rounded-2xl font-display text-base transition-all shadow-md hover:shadow-lg disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign in to Dashboard →</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <Link to="/" className="text-sm font-bold text-teal hover:underline inline-flex items-center gap-1">
            ← Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
