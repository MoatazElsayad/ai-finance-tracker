import { Link } from "react-router-dom";
import { LineChart, Line, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useTheme } from '../context/ThemeContext';
import { 
  Rocket, 
  Brain, 
  TrendingUp, 
  PieChart, 
  Shield, 
  Bell, 
  Target, 
  Zap,
  Github,
  ChevronRight,
  Sparkles,
  Layout,
  Cpu,
  Smartphone,
  Globe
} from 'lucide-react';
import Footer from '../components/Footer';
import FloatingIcons from '../components/FloatingIcons';

export default function Landing() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const year = new Date().getFullYear();

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0a0e27]' : 'bg-slate-50'} antialiased font-sans transition-colors duration-500 relative`}>
      <FloatingIcons isDark={isDark} />

      {/* Navigation */}
      <nav className={`${isDark ? 'bg-[#0a0e27]/80' : 'bg-white/80'} backdrop-blur-md border-b ${isDark ? 'border-slate-800' : 'border-slate-200'} sticky top-0 z-50 shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-amber-500 rounded-xl shadow-lg shadow-amber-500/20 rotate-3">
                <Rocket className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className={`font-black text-2xl tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Finance<span className="text-amber-500">AI</span>
                </span>
                <p className={`text-[10px] uppercase tracking-[0.2em] font-black ${isDark ? 'text-slate-500' : 'text-slate-400'} -mt-1`}>Powered by Intelligence</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-10">
              <a href="#features" className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'} font-black uppercase tracking-[0.2em] text-xs transition-colors`}>Features</a>
              <a href="#ai" className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'} font-black uppercase tracking-[0.2em] text-xs transition-colors`}>AI Engine</a>
              <a href="#contact" className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'} font-black uppercase tracking-[0.2em] text-xs transition-colors`}>Contact</a>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login" className={`px-6 py-2.5 ${isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'} font-black uppercase tracking-[0.2em] text-[10px] transition-colors`}>Sign In</Link>
              <Link to="/register" className="px-8 py-4 bg-amber-500 text-white rounded-[1.5rem] hover:bg-amber-600 hover:shadow-2xl hover:shadow-amber-500/30 transition-all font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-amber-500/10 hover:-translate-y-0.5">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[calc(100vh-80px)] flex items-center py-20">
        <div className={`absolute inset-0 z-0 opacity-30 ${isDark ? 'bg-[radial-gradient(circle_at_top_right,#fbbf24_0%,transparent_40%)]' : 'bg-[radial-gradient(circle_at_top_right,#fbbf24_0%,transparent_50%)]'}`}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-10 text-center lg:text-left animate-in fade-in slide-in-from-left-8 duration-1000">
              <div className={`inline-flex items-center gap-3 px-5 py-2.5 ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} backdrop-blur rounded-2xl shadow-xl border-2`}>
                <div className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </div>
                <span className={`text-xs font-black uppercase tracking-[0.2em] ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>Next-Gen AI Finance</span>
              </div>

              <h1 className={`text-6xl md:text-7xl lg:text-8xl font-black ${isDark ? 'text-white' : 'text-slate-900'} leading-[0.9] tracking-tighter`}>
                Master Your <br />
                <span className="text-amber-500 relative">
                  Money
                  <Sparkles className="absolute -top-6 -right-10 w-12 h-12 text-amber-400/30 animate-pulse" />
                </span>
              </h1>

              <p className={`text-xl md:text-2xl ${isDark ? 'text-slate-400' : 'text-slate-600'} leading-relaxed max-w-xl font-medium tracking-tight mx-auto lg:mx-0`}>
                Stop guessing and start growing. Get AI-powered insights, real-time tracking, and reach your goals faster.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
                <Link to="/register" className="group px-12 py-6 bg-amber-500 text-white rounded-[2rem] hover:bg-amber-600 hover:shadow-2xl hover:shadow-amber-500/40 transition-all shadow-2xl shadow-amber-500/20 font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-4 hover:-translate-y-1">
                  Start Journey
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/login" className={`px-12 py-6 ${isDark ? 'bg-slate-800/50 text-white border-slate-700 hover:bg-slate-800' : 'bg-white text-slate-900 border-slate-200 hover:bg-slate-50'} rounded-[2rem] transition-all border-2 font-black uppercase tracking-[0.2em] text-xs text-center shadow-2xl shadow-black/5 hover:-translate-y-1`}>
                  Login
                </Link>
              </div>
            </div>

            {/* Dashboard Preview Widget */}
            <div className="relative animate-in fade-in slide-in-from-right-8 duration-1000 delay-300">
              <div className={`card-unified ${isDark ? 'card-unified-dark border-slate-700/50' : 'card-unified-light border-slate-200'} p-8 shadow-2xl relative overflow-hidden group`}>
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className={`font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'} text-2xl`}>Monthly Overview</h3>
                    <p className={`text-xs uppercase tracking-[0.2em] font-black ${isDark ? 'text-slate-500' : 'text-slate-400'} mt-1`}>January {year}</p>
                  </div>
                  <div className="px-4 py-2 bg-emerald-500/10 border-2 border-emerald-500/20 text-emerald-500 rounded-2xl text-xs font-black uppercase tracking-[0.2em]">
                    +39% Savings
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 mb-8">
                  <div className={`${isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200'} p-5 rounded-3xl border-2 transition-transform hover:scale-105 duration-300`}>
                    <p className={`text-[10px] uppercase tracking-[0.2em] font-black ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-1`}>Income</p>
                    <p className="text-2xl font-black text-emerald-500">£5,240</p>
                  </div>
                  <div className={`${isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200'} p-5 rounded-3xl border-2 transition-transform hover:scale-105 duration-300`}>
                    <p className={`text-[10px] uppercase tracking-[0.2em] font-black ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-1`}>Expenses</p>
                    <p className="text-2xl font-black text-rose-500">£3,180</p>
                  </div>
                  <div className={`${isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200'} p-5 rounded-3xl border-2 transition-transform hover:scale-105 duration-300`}>
                    <p className={`text-[10px] uppercase tracking-[0.2em] font-black ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-1`}>Saved</p>
                    <p className="text-2xl font-black text-amber-500">£2,060</p>
                  </div>
                </div>

                <div className={`${isDark ? 'bg-amber-500/5 border-amber-500/10' : 'bg-amber-50 border-amber-500/10'} p-6 rounded-[2rem] border-2 mb-6 relative group/ai`}>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="p-2 bg-amber-500 rounded-lg shadow-lg shadow-amber-500/20">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <p className={`font-black uppercase tracking-[0.2em] text-xs ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>AI Financial Insight</p>
                  </div>
                  <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'} leading-relaxed font-medium italic`}>
                    "Excellent progress! Your savings rate is strong. The AI suggests reviewing your subscription costs for potential savings of £150/mo."
                  </p>
                </div>

                {/* Mini Chart */}
                <div className={`${isDark ? 'bg-slate-800/20 border-slate-700/30' : 'bg-slate-50/50 border-slate-200'} p-5 rounded-3xl border-2`}>
                  <div className="flex items-center justify-between mb-4">
                    <p className={`text-[10px] uppercase tracking-[0.2em] font-black ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Savings Trend</p>
                    <div className="flex items-center gap-1 text-emerald-500 font-black text-xs">
                      <TrendingUp className="w-3 h-3" />
                      +12.4%
                    </div>
                  </div>
                  <div className="h-20 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[
                        { day: 1, value: 1800 },
                        { day: 5, value: 1950 },
                        { day: 10, value: 1850 },
                        { day: 15, value: 2000 },
                        { day: 20, value: 2100 },
                        { day: 25, value: 2060 }
                      ]}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#fbbf24"
                          fill="url(#colorValue)"
                          strokeWidth={3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className={`py-32 ${isDark ? 'bg-[#0a0e27]' : 'bg-slate-50'} relative overflow-hidden`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-24 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h2 className={`text-5xl md:text-6xl font-black ${isDark ? 'text-white' : 'text-slate-900'} tracking-tighter mb-6`}>
              Everything You <span className="text-amber-500">Need</span>
            </h2>
            <p className={`text-xl ${isDark ? 'text-slate-400' : 'text-slate-600'} font-medium max-w-2xl mx-auto`}>
              Powerful tools designed for your financial success.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[
              { icon: <Brain />, title: "AI Insights", desc: "Personalized financial advice and smart recommendations from advanced models.", color: "amber" },
              { icon: <PieChart />, title: "Smart Visuals", desc: "Beautiful, interactive charts that tell the story of your money.", color: "purple" },
              { icon: <Layout />, title: "Rich Details", desc: "Effortlessly log and categorize transactions with advanced filtering.", color: "emerald" },
              { icon: <Bell />, title: "Smart Alerts", desc: "Proactive notifications for unusual spending or budget limits.", color: "rose" },
              { icon: <Target />, title: "Goal Tracking", desc: "Set and achieve financial milestones with precision tracking.", color: "blue" },
              { icon: <Shield />, title: "Bank-Grade Security", desc: "Your data is protected with industry-leading encryption.", color: "slate" },
            ].map((f, i) => (
              <div key={i} className={`group p-12 rounded-[2.5rem] border-2 ${isDark ? 'bg-slate-800/30 border-slate-700/50 hover:border-amber-500/50' : 'bg-white border-slate-100 hover:border-amber-500/30'} transition-all duration-500 hover:shadow-[0_20px_50px_-12px_rgba(251,191,36,0.15)] hover:-translate-y-2`}>
                <div className={`w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mb-10 shadow-xl shadow-amber-500/20 group-hover:rotate-6 group-hover:scale-110 transition-all duration-500`}>
                  <div className="text-white">
                    {f.icon}
                  </div>
                </div>
                <h3 className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'} mb-6`}>{f.title}</h3>
                <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} leading-relaxed font-medium text-lg`}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Engine Section */}
      <section id="ai" className={`py-32 ${isDark ? 'bg-slate-900/50' : 'bg-white'} border-y ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-amber-500/10 rounded-2xl mb-8">
            <Cpu className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-amber-500">Multimodal Engine</span>
          </div>
          
          <h2 className={`text-5xl md:text-6xl font-black ${isDark ? 'text-white' : 'text-slate-900'} tracking-tighter mb-8`}>
            Unified <span className="text-amber-500">AI Intelligence</span>
          </h2>
          <p className={`text-xl ${isDark ? 'text-slate-400' : 'text-slate-600'} max-w-3xl mx-auto mb-20 font-medium leading-relaxed`}>
            We combine the strengths of the world's most powerful language models to deliver unmatched financial analysis.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-24 max-w-5xl mx-auto">
            {[
              { name: 'GPT-4o', img: 'openai.png' },
              { name: 'Gemini 2', img: 'gemini-color.png' },
              { name: 'Gemma 3', img: 'gemma-color.png' },
              { name: 'DeepSeek', img: 'deepseek-color.png' },
              { name: 'Llama 3.3', img: 'meta-color.png' },
              { name: 'Mistral 7B', img: 'mistral-color.png' },
              { name: 'Nemotron', img: 'nvidia-color.png' },
              { name: 'Qwen 2.5', img: 'qwen-color.png' },
            ].map((ai) => (
              <div key={ai.name} className={`flex items-center gap-4 ${isDark ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60' : 'bg-white border-slate-200 hover:bg-slate-50'} border-2 rounded-[1.5rem] px-6 py-5 shadow-sm hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300 group hover:-translate-y-1`}>
                <img 
                  src={`https://raw.githubusercontent.com/lobehub/lobe-icons/master/packages/static-png/dark/${ai.img}`} 
                  alt={ai.name} 
                  className="w-8 h-8 group-hover:scale-110 transition-transform" 
                />
                <span className={`font-black uppercase tracking-[0.2em] text-[10px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{ai.name}</span>
              </div>
            ))}
          </div>

          <Link to="/register" className="group px-16 py-8 bg-amber-500 text-white rounded-[2.5rem] hover:bg-amber-600 hover:shadow-2xl hover:shadow-amber-500/40 transition-all shadow-2xl shadow-amber-500/20 font-black uppercase tracking-[0.2em] text-xs inline-flex items-center justify-center gap-6 hover:-translate-y-1">
            Try AI Insights
            <Zap className="w-6 h-6 fill-current" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}