/**
 * Login Page - Simple form with registration option
 */
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { login, register } from '../api';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  // Form state - check if we're on register route
  const [isLogin, setIsLogin] = useState(location.pathname !== '/register'); // Toggle between login/register
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        await login(email, password);
      } else {
        // Register - make sure username is included!
        await register(email, username, password);
      }
      
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      console.error('Auth error:', err);  // Add this for debugging
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#0f172a] flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="inline-block p-4 bg-amber-400/20 backdrop-blur-sm rounded-2xl mb-6 border border-amber-400/30 shadow-lg">
            <span className="text-5xl">💼</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">AI Finance Tracker</h1>
          <p className="text-slate-400 text-lg">
            {isLogin ? 'Welcome back!' : 'Join the community'}
          </p>
          <p className="text-xs text-slate-500 mt-1">Powered by AI</p>
        </div>

        {/* Form Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-slate-700">
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-xl text-red-300 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border-2 border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all"
                placeholder="you@example.com"
                required
              />
            </div>

            {/* Username (only for registration) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 border-2 border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all"
                  placeholder="johndoe"
                  required
                />
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border-2 border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 rounded-xl font-bold text-lg hover:shadow-2xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-900 border-t-transparent"></div>
                  <span>Please wait...</span>
                </>
              ) : (
                <span>{isLogin ? '🚀 Sign In' : '✨ Create Account'}</span>
              )}
            </button>
          </form>

          {/* Toggle Login/Register */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-400">
              {isLogin ? "New to AI Finance Tracker?" : "Already have an account?"}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="ml-2 text-amber-400 hover:text-amber-300 font-semibold transition-colors"
              >
                {isLogin ? 'Create one here' : 'Sign in instead'}
              </button>
            </p>
          </div>

          {/* Back to Landing */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-slate-500 hover:text-slate-400 transition-colors"
            >
              ← Back to home
            </button>
          </div>
        </div>

        {/* Features Preview */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
            <span className="text-2xl mb-2 block">🤖</span>
            <p className="text-xs text-slate-400">AI Insights</p>
          </div>
          <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
            <span className="text-2xl mb-2 block">📊</span>
            <p className="text-xs text-slate-400">Smart Charts</p>
          </div>
          <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
            <span className="text-2xl mb-2 block">🎯</span>
            <p className="text-xs text-slate-400">Budget Tracking</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;