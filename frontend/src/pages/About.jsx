import { useTheme } from '../context/ThemeContext';
import { Info, Code2, User, Github, Layers } from 'lucide-react';

function TechIcon({ src, alt }) {
  return (
    <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm group-hover:scale-110 transition-transform duration-500">
      <img
        src={src}
        alt={alt}
        className="w-8 h-8 object-contain"
        loading="lazy"
      />
    </div>
  );
}

function About() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const usage = [
    { label: 'React/Tailwind', color: 'bg-amber-500', pct: 40 },
    { label: 'FastAPI/Python', color: 'bg-purple-500', pct: 40 },
    { label: 'SQLite/SQLAlchemy', color: 'bg-slate-500', pct: 20 },
  ];

  return (
    <div className={`min-h-screen px-6 py-6 ${isDark ? 'bg-[#0a0e27]' : 'bg-slate-50'} transition-colors duration-500`}>
      {/* Header */}
      <div className="mb-10 animate-in fade-in slide-in-from-top-8 duration-700">
        <h1 className={`text-2xl md:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'} mb-3 flex items-center gap-4`}>
          <div className="p-3 bg-amber-500 rounded-xl shadow-xl shadow-amber-500/20 rotate-3 transition-transform hover:rotate-0 duration-500">
            <Info className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>
          About Project
        </h1>
        <p className={`text-lg font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'} tracking-tight max-w-2xl`}>
          Learn more about the AI Finance Tracker and the technologies behind it.
        </p>
      </div>

      <main className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="grid lg:grid-cols-2 gap-10">
          {/* Main Info Card */}
          <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'} p-6 md:p-10 relative overflow-hidden group`}>
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-colors duration-700" />
            
            <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'} mb-6 flex items-center gap-3`}>
              <div className="p-2.5 bg-amber-500/10 rounded-xl border-2 border-amber-500/20">
                <Layers className="w-5 h-5 text-amber-500" strokeWidth={3} />
              </div>
              Overview
            </h2>
            
            <blockquote className={`${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-100/40 border-slate-200'} rounded-2xl border-2 p-6 mb-10 relative overflow-hidden group/quote`}>
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover/quote:opacity-10 transition-opacity duration-500">
                <Info className="w-24 h-24" />
              </div>
              <p className={`text-lg font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'} leading-relaxed relative z-10 italic`}>
                "AI Finance Tracker is a clean app for logging and analyzing personal finances with smart receipt parsing.
                It showcases full‑stack development, AI model integration, and pragmatic database handling in a simple, educational tool."
              </p>
              <div className="mt-6 flex items-center gap-4 relative z-10">
                <div className="w-10 h-1 bg-amber-500 rounded-full shadow-lg shadow-amber-500/20"></div>
                <span className={`${isDark ? 'text-amber-400' : 'text-amber-600'} font-black uppercase tracking-[0.2em] text-[10px]`}>Developer & Creator</span>
              </div>
            </blockquote>

            <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-6`}>Languages & Tools Used</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { name: 'React', icon: 'react/react-original.svg' },
                { name: 'Vite', icon: 'vitejs/vitejs-original.svg' },
                { name: 'Tailwind', icon: 'tailwindcss/tailwindcss-plain.svg' },
                { name: 'Python', icon: 'python/python-original.svg' },
                { name: 'FastAPI', icon: 'fastapi/fastapi-original.svg' },
                { name: 'SQLite', icon: 'sqlite/sqlite-original.svg' },
                { name: 'SQLAlchemy', icon: 'sqlalchemy/sqlalchemy-original.svg' },
                { name: 'OpenRouter', icon: 'https://avatars.githubusercontent.com/u/12627020?s=200&v=4', custom: true }
              ].map((tech) => (
                <div key={tech.name} className={`group p-5 rounded-2xl border-2 ${isDark ? 'border-slate-700/50 hover:border-amber-500/50 bg-slate-800/30' : 'border-slate-200 hover:border-amber-500/30 bg-white'} transition-all duration-500 flex flex-col items-center gap-3 hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-1`}>
                  <TechIcon 
                    src={tech.custom ? tech.icon : `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${tech.icon}`} 
                    alt={tech.name} 
                  />
                  <span className={`${isDark ? 'text-slate-300' : 'text-slate-700'} font-black text-[9px] uppercase tracking-[0.2em]`}>{tech.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-10">
            {/* Stats Card */}
            <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'} p-6 md:p-8 relative overflow-hidden group`}>
              <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-colors duration-700" />
              
              <div className="mb-6 relative z-10">
                <h2 className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'} mb-1.5 flex items-center gap-3`}>
                  <div className="p-2.5 bg-purple-500/10 rounded-xl border-2 border-purple-500/20">
                    <Code2 className="w-5 h-5 text-purple-500" strokeWidth={3} />
                  </div>
                  Tech Stack
                </h2>
                <p className={`font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'} text-xs`}>Language distribution in this project.</p>
              </div>
              
              <div className="w-full h-10 rounded-xl overflow-hidden flex shadow-inner border-4 border-slate-700/10 relative z-10">
                {usage.map((u) => (
                  <div
                    key={u.label}
                    className={`${u.color} h-full transition-all duration-1000 ease-out hover:opacity-80 cursor-help`}
                    style={{ width: `${u.pct}%` }}
                    title={`${u.label} ${u.pct}%`}
                  />
                ))}
              </div>
              
              <div className="mt-8 grid grid-cols-1 gap-3 relative z-10">
                {usage.map((u) => (
                  <div key={u.label} className={`flex items-center justify-between p-4 rounded-xl ${isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-100'} border-2 transition-all hover:border-amber-500/20`}>
                    <div className="flex items-center gap-3">
                      <span className={`inline-block w-4 h-4 rounded-full ${u.color} shadow-lg shadow-${u.color.split('-')[1]}-500/20`} />
                      <span className={`${isDark ? 'text-slate-300' : 'text-slate-700'} font-black text-[9px] uppercase tracking-[0.2em]`}>{u.label}</span>
                    </div>
                    <span className={`font-black ${isDark ? 'text-white' : 'text-slate-900'} text-base`}>{u.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* GitHub Card */}
            <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'} p-6 md:p-8 group overflow-hidden relative`}>
              <div className="absolute -right-8 -bottom-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500 group-hover:scale-110">
                <Github className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <p className={`text-lg font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-6 leading-relaxed`}>
                  The source code is open-source. Explore the architecture on GitHub.
                </p>
                <a
                  href="https://github.com/your-username/ai-finance-tracker"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-3 px-6 py-4 rounded-xl bg-amber-500 text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-amber-600 transition-all duration-500 shadow-xl shadow-amber-500/20 group/btn hover:-translate-y-1"
                >
                  <Github className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" />
                  View Repository
                </a>
              </div>
            </div>

            {/* About Me Card */}
            <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'} p-6 md:p-8 relative overflow-hidden group`}>
              <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors duration-700" />
              
              <h2 className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'} mb-4 flex items-center gap-3 relative z-10`}>
                <div className="p-2.5 bg-emerald-500/10 rounded-xl border-2 border-emerald-500/20">
                  <User className="w-5 h-5 text-emerald-500" strokeWidth={3} />
                </div>
                The Developer
              </h2>
              <p className={`text-lg font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'} leading-relaxed italic relative z-10`}>
                "Passionate about building clean, efficient, and user-centric applications that solve real-world problems through technology."
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
  );
}


export default About;
