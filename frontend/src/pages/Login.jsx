import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { login, register } from '../api';
import { useTheme } from '../context/ThemeContext';
import { 
  AlertTriangle, 
  ArrowLeft, 
  Bot, 
  PieChartIcon, 
  Target, 
  Rocket, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Users,
  ChevronRight,
  Loader2
} from 'lucide-react';

function Login() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const location = useLocation();

  // Form state - check if we're on register route
  const [isLogin, setIsLogin] = useState(location.pathname !== '/register');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('male');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, username, firstName, lastName, phone, gender, password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0a0e27]' : 'bg-slate-50'} flex items-center justify-center px-6 py-12 transition-colors duration-500`}>
      <div className="max-w-md w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Logo & Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-2 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl mb-3 shadow-xl shadow-amber-500/20 rotate-3">
            <Rocket className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <h1 className={`text-header-unified !text-2xl ${isDark ? 'text-white' : 'text-slate-900'} mb-1.5`}>
            Finance<span className="text-amber-500">AI</span>
          </h1>
          <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {isLogin ? 'Welcome back to your intelligence hub.' : 'Start your intelligent financial journey.'}
          </p>
        </div>

        {/* Form Card */}
        <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'} !p-5 md:!p-6 shadow-2xl relative overflow-hidden group`}>
          {/* Decorative element */}
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-colors duration-700" />
          <div className="absolute top-0 right-0 p-5 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
            <Bot className="w-16 h-16" />
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border-2 border-rose-500/20 rounded-xl text-rose-500 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2.5 animate-in shake duration-500">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            {/* Email */}
            <div>
              <label className={`block text-[8px] font-black uppercase tracking-[0.2em] ml-2 ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-2`}>
                Email Address
              </label>
              <div className="relative group/input">
                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDark ? 'text-slate-500' : 'text-slate-400'} group-focus-within/input:text-amber-500 transition-colors z-10`} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`input-unified ${isDark ? 'input-unified-dark' : 'input-unified-light'} w-full pl-11 !py-3 !rounded-xl !text-[11px]`}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Username (only for registration) */}
            {!isLogin && (
              <div>
                <label className={`block text-[8px] font-black uppercase tracking-[0.2em] ml-2 ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-2`}>
                  Username
                </label>
                <div className="relative group/input">
                  <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDark ? 'text-slate-500' : 'text-slate-400'} group-focus-within/input:text-amber-500 transition-colors z-10`} />
                  <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`input-unified ${isDark ? 'input-unified-dark' : 'input-unified-light'} w-full pl-11 !py-3 !rounded-xl !text-[11px]`}
                  placeholder="johndoe"
                  required
                />
              </div>
            </div>
          )}

          {/* First Name & Last Name (only for registration) */}
          {!isLogin && (
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className={`block text-[8px] font-black uppercase tracking-[0.2em] ml-2 ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-2`}>
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={`input-unified ${isDark ? 'input-unified-dark' : 'input-unified-light'} w-full !py-3 !rounded-xl !text-[11px]`}
                  placeholder="John"
                  required
                />
              </div>
              <div>
                <label className={`block text-[8px] font-black uppercase tracking-[0.2em] ml-2 ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-2`}>
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={`input-unified ${isDark ? 'input-unified-dark' : 'input-unified-light'} w-full !py-3 !rounded-xl !text-[11px]`}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>
          )}

          {/* Registration specific fields grid */}
          {!isLogin && (
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className={`block text-[8px] font-black uppercase tracking-[0.2em] ml-2 ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-2`}>
                  Phone (Optional)
                </label>
                <div className="relative group/input">
                  <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDark ? 'text-slate-500' : 'text-slate-400'} group-focus-within/input:text-amber-500 transition-colors z-10`} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`input-unified ${isDark ? 'input-unified-dark' : 'input-unified-light'} w-full pl-11 !py-3 !rounded-xl !text-[11px]`}
                    placeholder="+20..."
                  />
                </div>
              </div>
              <div>
                <label className={`block text-[8px] font-black uppercase tracking-[0.2em] ml-2 ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-2`}>
                  Gender
                </label>
                <div className="relative group/input">
                  <Users className={`absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDark ? 'text-slate-500' : 'text-slate-400'} group-focus-within/input:text-amber-500 transition-colors z-10`} />
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className={`input-unified ${isDark ? 'input-unified-dark' : 'input-unified-light'} w-full pl-11 !py-3 !rounded-xl !text-[11px] appearance-none cursor-pointer relative z-0 pr-10`}
                  >
                    <option value="male" className={isDark ? 'bg-slate-900' : 'bg-white'}>Male</option>
                    <option value="female" className={isDark ? 'bg-slate-900' : 'bg-white'}>Female</option>
                  </select>
                  <ChevronRight className={`absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDark ? 'text-slate-500' : 'text-slate-400'} pointer-events-none rotate-90 transition-transform group-hover/input:scale-110`} />
                </div>
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <label className={`block text-[8px] font-black uppercase tracking-[0.2em] ml-2 ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-2`}>
              Password
            </label>
            <div className="relative group/input">
              <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDark ? 'text-slate-500' : 'text-slate-400'} group-focus-within/input:text-amber-500 transition-colors z-10`} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`input-unified ${isDark ? 'input-unified-dark' : 'input-unified-light'} w-full pl-11 !py-3 !rounded-xl !text-[11px]`}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary-unified w-full !py-4 !rounded-xl !text-[9px] uppercase tracking-[0.2em] group/btn"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? 'Sign In to Dashboard' : 'Create Intelligence Account'}</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1.5 transition-transform" strokeWidth={3} />
                </>
              )}
            </button>
          </form>

          {/* Toggle Login/Register */}
          <div className="mt-6 text-center relative z-10">
            <p className={`text-[11px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
              {isLogin ? "New to FinanceAI?" : "Already have an account?"}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="ml-2 text-amber-500 hover:text-amber-600 font-black uppercase tracking-[0.2em] text-[8px] transition-all hover:scale-105 active:scale-95"
              >
                {isLogin ? 'Create one here' : 'Sign in instead'}
              </button>
            </p>
          </div>

          {/* Back to Landing */}
          <div className="mt-4 text-center relative z-10">
            <button
              onClick={() => navigate('/')}
              className={`inline-flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-600 hover:text-slate-400' : 'text-slate-400 hover:text-slate-600'} transition-all group/back active:scale-95`}
            >
              <ArrowLeft className="w-3 h-3 group-hover/back:-translate-x-1.5 transition-transform" strokeWidth={3} />
              Back to landing
            </button>
          </div>
        </div>

        {/* Features Preview */}
        <div className="mt-6 grid grid-cols-3 gap-3.5">
          {[
            { icon: <Bot className="w-4 h-4" />, label: 'AI Insights' },
            { icon: <PieChartIcon className="w-4 h-4" />, label: 'Visuals' },
            { icon: <Target className="w-4 h-4" />, label: 'Goals' }
          ].map((item, idx) => (
            <div key={idx} className={`p-3.5 ${isDark ? 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/50' : 'bg-white border-slate-100 hover:bg-slate-50'} rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all hover:-translate-y-1 duration-300 shadow-lg shadow-black/5 group`}>
              <div className="text-amber-500 group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <p className={`text-[8px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'} group-hover:text-amber-500 transition-colors`}>{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Login;
