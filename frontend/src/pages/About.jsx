import { useTheme } from '../context/ThemeContext';
import FloatingIcons from '../components/FloatingIcons';
import { 
  Info, 
  Code2, 
  User, 
  GitHub, 
  Layers, 
  ImagePlus, 
  BarChart3, 
  Target, 
  Wallet, 
  ShieldCheck, 
  Zap, 
  Database,
  Cpu
} from 'lucide-react';

function TechIcon({ src, alt, isDark }) {
  return (
    <div className={`p-3 ${isDark ? 'bg-slate-700/50' : 'bg-slate-100'} rounded-xl transition-all group-hover:scale-110 duration-500`}>
      <img
        src={src}
        alt={alt}
        className="w-10 h-10 object-contain"
        loading="lazy"
      />
    </div>
  );
}

function SectionTitle({ icon: Icon, title, subtitle, isDark }) {
  return (
    <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
      <h2 className="text-header-unified flex items-center gap-4">
        <div className="p-3 bg-amber-500 rounded-2xl shadow-xl shadow-amber-500/20">
          <Icon className="w-8 h-8 text-white" />
        </div>
        {title}
      </h2>
      <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} mt-3 text-lg font-medium`}>
        {subtitle}
      </p>
    </div>
  );
}

function About() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const usage = [
    { label: 'Frontend Architecture', color: 'bg-amber-500', pct: 30 },
    { label: 'Backend Intelligence', color: 'bg-purple-500', pct: 55 },
    { label: 'Data Persistence', color: 'bg-slate-500', pct: 15 },
  ];

  const features = [
    {
      title: 'Smart AI Parsing',
      desc: 'Our engine uses advanced Vision LLMs via OpenRouter to scan receipts. It doesn\'t just "read" text; it understands merchants, taxes, and dates with human-level accuracy.',
      icon: ImagePlus,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    {
      title: 'Executive Reporting',
      desc: 'Generate boardroom-ready PDF reports. Features high-fidelity Matplotlib charts, automated executive summaries, and conditional financial formatting.',
      icon: BarChart3,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20'
    },
    {
      title: 'Savings & Milestones',
      desc: 'Define complex financial goals. The system calculates real-time velocity and provides visual feedback on your journey to financial freedom.',
      icon: Target,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20'
    },
    {
      title: 'Budget Intelligence',
      desc: 'Set category-aware limits. Our algorithm monitors spending patterns and warns you before you hit your limits, not just after.',
      icon: Wallet,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20'
    }
  ];

  return (
    <div className={`transition-colors duration-500 ${isDark ? 'bg-[#0a0e27]' : 'bg-slate-50'} relative`}>
      <FloatingIcons isDark={isDark} />
      
      {/* 1. OVERVIEW SECTION */}
      <section className="min-h-screen flex flex-col justify-center px-6 py-12">
        <div className="max-w-7xl mx-auto w-full">
          <SectionTitle 
            icon={Info} 
            title="Project Overview" 
            subtitle="The mission behind FinanceFT Intelligence."
            isDark={isDark}
          />
          
          <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'} grid lg:grid-cols-2 gap-12 items-center`}>
            <div className="relative z-10">
              <h3 className={`text-3xl font-black mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <span className="uppercase tracking-[0.15em]">Unified Intelligence</span>
              </h3>
              <p className={`text-xl font-medium leading-relaxed mb-8 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                FinanceFT is more than just a tracker. It's a professional-grade financial intelligence platform designed for individuals who value precision and privacy. 
              </p>
              <div className="space-y-4">
                {[
                  { icon: ShieldCheck, text: "Privacy-First Local Database Architecture" },
                  { icon: Zap, text: "Real-time AI Financial Analysis & Coaching" },
                  { icon: Database, text: "High-Fidelity Reporting & Data Export" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <item.icon className="w-5 h-5 text-amber-500" />
                    </div>
                    <span className={`font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <blockquote className={`${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200'} rounded-[2.5rem] border-2 p-10 shadow-2xl relative overflow-hidden group`}>
                <p className={`text-2xl font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'} leading-relaxed italic relative z-10`}>
                  "The goal was to bridge the gap between simple mobile tracking apps and complex accounting software, providing a powerful yet intuitive interface for financial growth."
                </p>
                <div className="mt-8 flex items-center gap-4">
                  <div className="w-12 h-1.5 bg-amber-500 rounded-full shadow-lg shadow-amber-500/20"></div>
                  <span className={`${isDark ? 'text-amber-400' : 'text-amber-600'} font-black uppercase tracking-[0.2em] text-xs`}>Lead Developer</span>
                </div>
                <Info className="absolute -right-10 -bottom-10 w-40 h-40 opacity-5 group-hover:scale-110 transition-transform duration-700" />
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CAPABILITIES SECTION */}
      <section className="min-h-screen flex flex-col justify-center px-6 py-12">
        <div className="max-w-7xl mx-auto w-full">
          <SectionTitle 
            icon={Layers} 
            title="Core Capabilities" 
            subtitle="Advanced tools built for deep financial insight."
            isDark={isDark}
          />
          
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, i) => (
              <div key={i} className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'} group hover:-translate-y-2 transition-all duration-500`}>
                <div className={`w-16 h-16 rounded-2xl ${feature.bgColor} ${feature.borderColor} border-2 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-8 h-8 ${feature.color}`} />
                </div>
                <h4 className={`text-xl font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-slate-900'} mb-4`}>{feature.title}</h4>
                <p className={`text-lg font-medium leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. SYSTEM ARCHITECTURE SECTION */}
      <section className="min-h-screen flex flex-col justify-center px-6 py-12">
        <div className="max-w-7xl mx-auto w-full">
          <SectionTitle 
            icon={Code2} 
            title="System Architecture" 
            subtitle="Built with modern full-stack engineering principles."
            isDark={isDark}
          />
          
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Engineering Bar Card */}
            <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'} lg:col-span-2`}>
              <h3 className={`text-xs font-black uppercase tracking-[0.25em] ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-10`}>Development Distribution</h3>
              
              <div className="w-full h-12 rounded-2xl overflow-hidden flex shadow-inner border-4 border-slate-700/10 mb-10">
                {usage.map((u) => (
                  <div
                    key={u.label}
                    className={`${u.color} h-full transition-all duration-1000 ease-out hover:opacity-80 cursor-help`}
                    style={{ width: `${u.pct}%` }}
                    title={`${u.label} ${u.pct}%`}
                  />
                ))}
              </div>
              
              <div className="grid sm:grid-cols-3 gap-4">
                {usage.map((u) => (
                  <div key={u.label} className={`p-6 rounded-2xl ${isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-100'} border transition-all hover:border-amber-500/20`}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`inline-block w-4 h-4 rounded-full ${u.color} shadow-lg shadow-${u.color.split('-')[1]}-500/20`} />
                      <span className={`${isDark ? 'text-slate-400' : 'text-slate-600'} font-black text-[10px] uppercase tracking-[0.15em]`}>{u.label.split(' ')[0]}</span>
                    </div>
                    <span className={`font-black ${isDark ? 'text-white' : 'text-slate-900'} text-2xl`}>{u.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tech Stack Icons Card */}
            <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'}`}>
              <h3 className={`text-xs font-black uppercase tracking-[0.25em] ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-10`}>The Tech Stack</h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { name: 'React', icon: 'react/react-original.svg' },
                  { name: 'FastAPI', icon: 'fastapi/fastapi-original.svg' },
                  { name: 'Python', icon: 'python/python-original.svg' },
                  { name: 'SQLite', icon: 'sqlite/sqlite-original.svg' },
                  { name: 'Tailwind', icon: 'tailwindcss/tailwindcss-plain.svg' },
                  { name: 'SQLAlchemy', icon: 'sqlalchemy/sqlalchemy-original.svg' },
                  { name: 'Matplotlib', icon: 'matplotlib/matplotlib-original.svg' },
                  { name: 'Vite', icon: 'vitejs/vitejs-original.svg' },
                  { name: 'OpenRouter', icon: 'https://avatars.githubusercontent.com/u/12627020?s=200&v=4', custom: true }
                ].map((tech) => (
                  <div key={tech.name} className={`group p-3 rounded-2xl border ${isDark ? 'border-slate-700/50 hover:border-amber-500/50 bg-slate-800/30' : 'border-slate-200 hover:border-amber-500/30 bg-white'} transition-all duration-500 flex flex-col items-center gap-2`}>
                    <TechIcon 
                      src={tech.custom ? tech.icon : `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${tech.icon}`} 
                      alt={tech.name} 
                      isDark={isDark}
                    />
                    <span className={`${isDark ? 'text-slate-400' : 'text-slate-600'} font-black text-[8px] uppercase tracking-tighter`}>{tech.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. REPOSITORY & CONNECT SECTION */}
      <section className="min-h-screen flex flex-col justify-center px-6 py-12">
        <div className="max-w-7xl mx-auto w-full">
          <SectionTitle 
            icon={Cpu} 
            title="Open Source" 
            subtitle="The architecture is fully transparent and extensible."
            isDark={isDark}
          />
          
          <div className="grid lg:grid-cols-2 gap-8">
            <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'} p-12 group overflow-hidden relative flex flex-col justify-center items-center text-center`}>
              <div className="absolute -right-8 -bottom-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500 group-hover:scale-110">
                <GitHub className="w-64 h-64" />
              </div>
              <p className={`text-2xl font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-10 leading-relaxed max-w-lg`}>
                The source code is open for review and contributions. Help us build the future of private finance.
              </p>
              <a
                href="https://github.com/moataz-finance/ai-finance-tracker"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-4 px-10 py-6 rounded-[2rem] bg-amber-500 text-white font-black text-sm uppercase tracking-[0.2em] hover:bg-amber-600 transition-all duration-500 shadow-xl shadow-amber-500/20 group/btn hover:-translate-y-1"
              >
                <GitHub className="w-6 h-6 group-hover/btn:rotate-12 transition-transform" />
                Explore Repository
              </a>
            </div>

            <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'} p-12 relative overflow-hidden group flex flex-col justify-center items-center text-center`}>
              <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px] group-hover:bg-emerald-500/10 transition-colors duration-700" />
              <div className="p-6 bg-emerald-500/10 rounded-3xl border-2 border-emerald-500/20 mb-8">
                <User className="w-12 h-12 text-emerald-500" strokeWidth={3} />
              </div>
              <h2 className={`text-3xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'} mb-6`}>
                The Creator
              </h2>
              <p className={`text-xl font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'} leading-relaxed max-w-lg italic`}>
                "Dedicated to crafting high-performance applications that empower users with actionable data and beautiful interfaces."
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

export default About;
