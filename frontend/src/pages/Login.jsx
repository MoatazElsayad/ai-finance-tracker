import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { login, register } from '../api';
import { useTheme } from '../context/ThemeContext';
import { Card, Button } from '../components/UI';
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
import Footer from '../components/Footer';
import FloatingIcons from '../components/FloatingIcons';

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
    <div className={`min-h-screen ${isDark ? 'bg-[#0a0e27]' : 'bg-slate-50'} flex flex-col transition-colors duration-500 relative`}>
      <FloatingIcons isDark={isDark} />
      <div className="flex-grow flex items-center justify-center px-6 py-20 relative z-10">
        <div className="max-w-xl w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
          {/* Logo & Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl mb-6 shadow-xl shadow-amber-500/20 rotate-3">
              <Rocket className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>
            <h1 className={`text-5xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'} mb-3`}>
              Finance<span className="text-amber-500">AI</span>
            </h1>
            <p className={`text-lg font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {isLogin ? 'Welcome back to your intelligence hub.' : 'Start your intelligent financial journey.'}
            </p>
          </div>

          {/* Form Card */}
          <Card 
            animate={true}
            className={`!p-8 md:!p-12 !rounded-[3rem] transition-all border-2 duration-500 relative overflow-hidden group shadow-2xl ${
              isDark ? 'shadow-black/20' : 'shadow-slate-200/50'
            }`}
          >
            {/* Decorative element */}
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-colors duration-700" />
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
              <Bot className="w-32 h-32" />
            </div>

            {error && (
              <div className="mb-8 p-5 bg-rose-500/10 border-2 border-rose-500/20 rounded-2xl text-rose-500 text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3 animate-in shake duration-500">
                <AlertTriangle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
              {/* Email */}
              <div>
                <label className={`block text-[10px] font-black uppercase tracking-[0.2em] ml-2 ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-4`}>
                  Email Address
                </label>
                <div className="relative group/input">
                  <Mail className={`absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-slate-500' : 'text-slate-400'} group-focus-within/input:text-amber-500 transition-colors z-10`} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-14 pr-6 py-4 rounded-2xl border-2 transition-all outline-none text-sm font-bold ${isDark ? 'bg-slate-900/50 border-slate-800 text-white focus:border-amber-500/50' : 'bg-white border-slate-200 text-slate-900 focus:border-amber-500/50'}`}
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              {/* Username (only for registration) */}
              {!isLogin && (
                <div>
                  <label className={`block text-[10px] font-black uppercase tracking-[0.2em] ml-2 ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-4`}>
                    Username
                  </label>
                  <div className="relative group/input">
                    <User className={`absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-slate-500' : 'text-slate-400'} group-focus-within/input:text-amber-500 transition-colors z-10`} />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={`w-full pl-14 pr-6 py-4 rounded-2xl border-2 transition-all outline-none text-sm font-bold ${isDark ? 'bg-slate-900/50 border-slate-800 text-white focus:border-amber-500/50' : 'bg-white border-slate-200 text-slate-900 focus:border-amber-500/50'}`}
                      placeholder="johndoe"
                      required
                    />
                  </div>
                </div>
              )}

              {/* First Name & Last Name (only for registration) */}
              {!isLogin && (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-[0.2em] ml-2 ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-4`}>
                      First Name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className={`w-full px-6 py-4 rounded-2xl border-2 transition-all outline-none text-sm font-bold ${isDark ? 'bg-slate-900/50 border-slate-800 text-white focus:border-amber-500/50' : 'bg-white border-slate-200 text-slate-900 focus:border-amber-500/50'}`}
                      placeholder="John"
                      required
                    />
                  </div>
                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-[0.2em] ml-2 ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-4`}>
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className={`w-full px-6 py-4 rounded-2xl border-2 transition-all outline-none text-sm font-bold ${isDark ? 'bg-slate-900/50 border-slate-800 text-white focus:border-amber-500/50' : 'bg-white border-slate-200 text-slate-900 focus:border-amber-500/50'}`}
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Registration specific fields grid */}
              {!isLogin && (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-[0.2em] ml-2 ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-4`}>
                      Phone (Optional)
                    </label>
                    <div className="relative group/input">
                      <Phone className={`absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-slate-500' : 'text-slate-400'} group-focus-within/input:text-amber-500 transition-colors z-10`} />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={`w-full pl-14 pr-6 py-4 rounded-2xl border-2 transition-all outline-none text-sm font-bold ${isDark ? 'bg-slate-900/50 border-slate-800 text-white focus:border-amber-500/50' : 'bg-white border-slate-200 text-slate-900 focus:border-amber-500/50'}`}
                        placeholder="+20..."
                      />
                    </div>
                  </div>
                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-[0.2em] ml-2 ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-4`}>
                      Gender
                    </label>
                    <div className="relative group/input">
                      <Users className={`absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-slate-500' : 'text-slate-400'} group-focus-within/input:text-amber-500 transition-colors z-10`} />
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className={`w-full pl-14 pr-12 py-4 rounded-2xl border-2 appearance-none cursor-pointer outline-none text-sm font-bold transition-all ${isDark ? 'bg-slate-900/50 border-slate-800 text-white focus:border-amber-500/50' : 'bg-white border-slate-200 text-slate-900 focus:border-amber-500/50'}`}
                      >
                        <option value="male" className={isDark ? 'bg-slate-900' : 'bg-white'}>Male</option>
                        <option value="female" className={isDark ? 'bg-slate-900' : 'bg-white'}>Female</option>
                      </select>
                      <ChevronRight className={`absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-slate-500' : 'text-slate-400'} pointer-events-none rotate-90 transition-transform group-hover/input:scale-110`} />
                    </div>
                  </div>
                </div>
              )}

              {/* Password */}
              <div>
                <label className={`block text-[10px] font-black uppercase tracking-[0.2em] ml-2 ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-4`}>
                  Password
                </label>
                <div className="relative group/input">
                  <Lock className={`absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-slate-500' : 'text-slate-400'} group-focus-within/input:text-amber-500 transition-colors z-10`} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-14 pr-6 py-4 rounded-2xl border-2 transition-all outline-none text-sm font-bold ${isDark ? 'bg-slate-900/50 border-slate-800 text-white focus:border-amber-500/50' : 'bg-white border-slate-200 text-slate-900 focus:border-amber-500/50'}`}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                loading={loading}
                variant="primary"
                size="lg"
                className="w-full !py-8 !rounded-[2.5rem] !font-black !uppercase !tracking-[0.2em] !text-xs !shadow-2xl !shadow-amber-500/20 group/btn"
                icon={ChevronRight}
                iconPosition="right"
              >
                {isLogin ? 'Sign In to Dashboard' : 'Create Intelligence Account'}
              </Button>
            </form>

            {/* Toggle Login/Register */}
            <div className="mt-12 text-center relative z-10">
              <p className={`text-sm font-bold ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                {isLogin ? "New to FinanceAI?" : "Already have an account?"}
                <Button
                  variant="link"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                  }}
                  className="!ml-3 !p-0 !h-auto !text-amber-500 hover:!text-amber-600 !font-black !uppercase !tracking-[0.2em] !text-[10px] !transition-all hover:!scale-105 active:!scale-95"
                >
                  {isLogin ? 'Create one here' : 'Sign in instead'}
                </Button>
              </p>
            </div>

            {/* Back to Landing */}
            <div className="mt-8 text-center relative z-10">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                icon={ArrowLeft}
                className={`!inline-flex !items-center !gap-3 !text-[10px] !font-black !uppercase !tracking-[0.2em] ${isDark ? '!text-slate-600 hover:!text-slate-400' : '!text-slate-400 hover:!text-slate-600'} !transition-all group/back active:!scale-95`}
              >
                Back to landing
              </Button>
            </div>
          </Card>

          {/* Features Preview */}
          <div className="mt-12 grid grid-cols-3 gap-6">
            {[
              { icon: <Bot />, label: 'AI Insights' },
              { icon: <PieChartIcon />, label: 'Visuals' },
              { icon: <Target />, label: 'Goals' }
            ].map((item, idx) => (
              <Card 
                key={idx} 
                animate={true}
                className={`!p-6 !rounded-3xl border-2 flex flex-col items-center justify-center gap-3 transition-all hover:-translate-y-1 duration-300 shadow-lg shadow-black/5 group`}
              >
                <div className="text-amber-500 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'} group-hover:text-amber-500 transition-colors`}>{item.label}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Login;
