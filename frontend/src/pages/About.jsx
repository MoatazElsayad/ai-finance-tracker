import { useTheme } from '../context/ThemeContext';

function TechIcon({ src, alt }) {
  return (
    <img
      src={src}
      alt={alt}
      className="w-10 h-10 object-contain"
      loading="lazy"
    />
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
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#0f172a]' : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'} pb-20`}>
      <main className="max-w-6xl mx-auto px-6 pt-16">
        <div className="grid lg:grid-cols-2 gap-10">
          <div className={`${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'} rounded-3xl shadow-xl border p-8`}>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-4`}>About AI Finance Tracker</h1>
            <blockquote className={`${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-100/60 border-slate-200'} rounded-2xl border p-6 mb-8`}>
              <p className={`${isDark ? 'text-slate-300' : 'text-slate-700'} leading-relaxed`}>
                AI Finance Tracker is a clean app for logging and analyzing personal finances with smart receipt parsing.
                It showcases full‑stack development, AI model integration, and pragmatic database handling in a simple, educational tool.
              </p>
              <span className={`${isDark ? 'text-slate-400' : 'text-slate-600'} block mt-3`}>[Your Name] — Developer & Creator</span>
            </blockquote>

            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'} mb-3`}>Languages & Tools Used</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-xl border ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-100/50'} flex items-center gap-3`}>
                <TechIcon src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" alt="React" />
                <span className={`${isDark ? 'text-white' : 'text-slate-900'} font-medium`}>React</span>
              </div>
              <div className={`p-4 rounded-xl border ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-100/50'} flex items-center gap-3`}>
                <TechIcon src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vitejs/vitejs-original.svg" alt="Vite" />
                <span className={`${isDark ? 'text-white' : 'text-slate-900'} font-medium`}>Vite</span>
              </div>
              <div className={`p-4 rounded-xl border ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-100/50'} flex items-center gap-3`}>
                <TechIcon src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-plain.svg" alt="Tailwind" />
                <span className={`${isDark ? 'text-white' : 'text-slate-900'} font-medium`}>Tailwind</span>
              </div>
              <div className={`p-4 rounded-xl border ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-100/50'} flex items-center gap-3`}>
                <TechIcon src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" alt="Python" />
                <span className={`${isDark ? 'text-white' : 'text-slate-900'} font-medium`}>Python</span>
              </div>
              <div className={`p-4 rounded-xl border ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-100/50'} flex items-center gap-3`}>
                <TechIcon src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/fastapi/fastapi-original.svg" alt="FastAPI" />
                <span className={`${isDark ? 'text-white' : 'text-slate-900'} font-medium`}>FastAPI</span>
              </div>
              <div className={`p-4 rounded-xl border ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-100/50'} flex items-center gap-3`}>
                <TechIcon src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sqlite/sqlite-original.svg" alt="SQLite" />
                <span className={`${isDark ? 'text-white' : 'text-slate-900'} font-medium`}>SQLite</span>
              </div>
              <div className={`p-4 rounded-xl border ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-100/50'} flex items-center gap-3`}>
                <TechIcon src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sqlalchemy/sqlalchemy-original.svg" alt="SQLAlchemy" />
                <span className={`${isDark ? 'text-white' : 'text-slate-900'} font-medium`}>SQLAlchemy</span>
              </div>
              <div className={`p-4 rounded-xl border ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-100/50'} flex items-center gap-3`}>
                <TechIcon src="https://avatars.githubusercontent.com/u/12627020?s=200&v=4" alt="OpenRouter" />
                <span className={`${isDark ? 'text-white' : 'text-slate-900'} font-medium`}>OpenRouter</span>
              </div>
            </div>
          </div>

          <div className="space-y-10">
            <div className={`${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'} rounded-3xl shadow-xl border p-8`}>
              <div className="mb-6">
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-1`}>Languages Percentage</h2>
                <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Language usage distribution in this project.</p>
              </div>
              <div className="w-full h-10 rounded-lg overflow-hidden flex">
                {usage.map((u) => (
                  <div
                    key={u.label}
                    className={`${u.color} h-full`}
                    style={{ width: `${u.pct}%` }}
                    title={`${u.label} ${u.pct}%`}
                  />
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                {usage.map((u) => (
                  <div key={u.label} className="flex items-center gap-2">
                    <span className={`inline-block w-3 h-3 rounded ${u.color}`} />
                    <span className={`${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{u.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={`${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'} rounded-3xl shadow-xl border p-8`}>
              <p className={`${isDark ? 'text-slate-300' : 'text-slate-700'} mb-4`}>
                To explore the source code, visit the GitHub repository below.
              </p>
              <div className="flex items-center gap-3">
                <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="GitHub" className="w-8 h-8" />
                <a
                  href="https://github.com/your-username/ai-finance-tracker"
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-500 hover:text-amber-400 font-semibold"
                >
                  https://github.com/your-username/ai-finance-tracker
                </a>
              </div>
            </div>

            <div className={`${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'} rounded-3xl shadow-xl border p-8`}>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-3`}>About Me</h2>
              <p className={`${isDark ? 'text-slate-300' : 'text-slate-700'} leading-relaxed`}>
                [Add your personal bio here.]
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default About;
