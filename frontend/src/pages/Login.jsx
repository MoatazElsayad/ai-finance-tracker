/**
 * Login Page - Simple form with registration option
 */
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { login, register } from '../api';
import { useTheme } from '../context/ThemeContext';
import { AlertTriangle, ArrowLeft, Bot, PieChartIcon, Target } from 'lucide-react';

function Login() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Form state - check if we're on register route
  const [isLogin, setIsLogin] = useState(location.pathname !== '/register'); // Toggle between login/register
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
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
        // Register - include all new fields
        await register(email, username, firstName, lastName, phone, password);
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
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#0f172a]' : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'} flex items-center justify-center px-6 py-12`}>
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="inline-block p-4 bg-amber-400/20 backdrop-blur-sm rounded-2xl mb-6 border border-amber-400/30 shadow-lg">
            <span className="text-5xl">💼</span>
          </div>
          <h1 className={`text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-2`}>AI Finance Tracker</h1>
          <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} style={{ fontSize: '1.125rem' }}>
            {isLogin ? 'Welcome back!' : 'Join the community'}
          </p>
          <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'} mt-1`}>Powered by AI</p>
        </div>

        {/* Form Card */}
        <div className={`${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white/50 border-slate-200'} backdrop-blur-sm rounded-3xl shadow-2xl p-8 border`}>
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
              <label className={`block text-sm font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3 ${theme === 'dark' ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-400' : 'bg-slate-100/50 border-slate-300 text-slate-900 placeholder-slate-500'} border-2 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all`}
                placeholder="you@example.com"
                required
              />
            </div>

            {/* Username (only for registration) */}
            {!isLogin && (
              <div>
                <label className={`block text-sm font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`w-full px-4 py-3 ${theme === 'dark' ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-400' : 'bg-slate-100/50 border-slate-300 text-slate-900 placeholder-slate-500'} border-2 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all`}
                  placeholder="johndoe"
                  required
                />
              </div>
            )}

            {/* First Name & Last Name (only for registration) */}
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={`w-full px-4 py-3 ${theme === 'dark' ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-400' : 'bg-slate-100/50 border-slate-300 text-slate-900 placeholder-slate-500'} border-2 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all`}
                    placeholder="John"
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={`w-full px-4 py-3 ${theme === 'dark' ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-400' : 'bg-slate-100/50 border-slate-300 text-slate-900 placeholder-slate-500'} border-2 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all`}
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>
            )}

            {/* Phone (only for registration) */}
            {!isLogin && (
              <div>
                <label className={`block text-sm font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`w-full px-4 py-3 ${theme === 'dark' ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-400' : 'bg-slate-100/50 border-slate-300 text-slate-900 placeholder-slate-500'} border-2 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all`}
                  placeholder="+201234567890"
                />
              </div>
            )}

            {/* Password */}
            <div>
              <label className={`block text-sm font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 ${theme === 'dark' ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-400' : 'bg-slate-100/50 border-slate-300 text-slate-900 placeholder-slate-500'} border-2 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all`}
                placeholder="Watch ur back.."
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
                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
              )}
            </button>
          </form>

          {/* Toggle Login/Register */}
          <div className="mt-8 text-center">
            <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
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
              className={`text-sm ${theme === 'dark' ? 'text-slate-500 hover:text-slate-400' : 'text-slate-600 hover:text-slate-700'} transition-colors inline-flex hover:gap-1`}
            >
              <ArrowLeft className={`w-6 h-6 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`} strokeWidth={2} /> Back to home
            </button>
          </div>
        </div>

        {/* Features Preview */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          {/* AI Insights */}
          <div className={`p-5 ${theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-slate-200/30 border-slate-300/50'} rounded-xl border flex flex-col items-center justify-center gap-3`}>
            <Bot className={`w-8 h-8 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`} strokeWidth={2} />
            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>AI Insights</p>
          </div>

          {/* Smart Charts */}
          <div className={`p-5 ${theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-slate-200/30 border-slate-300/50'} rounded-xl border flex flex-col items-center justify-center gap-3`}>
            <PieChartIcon className={`w-8 h-8 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`} strokeWidth={2} />
            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Smart Charts</p>
          </div>

          {/* Budget Tracking */}
          <div className={`p-5 ${theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-slate-200/30 border-slate-300/50'} rounded-xl border flex flex-col items-center justify-center gap-3`}>
            <Target className={`w-8 h-8 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`} strokeWidth={2} />
            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Budget Tracking</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
