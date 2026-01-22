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

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#0f172a]' : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'} pb-20`}>
      {/* Hero */}
      <section className={`relative pt-16 pb-24 px-6 ${isDark ? 'bg-gradient-to-br from-[#1a1f3a] via-[#0f172a] to-[#0a0e27]' : 'bg-gradient-to-br from-slate-100 via-white to-slate-50'}`}>
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-400/30 to-purple-500/30 rounded-2xl mb-6 border border-amber-400/30 shadow-lg">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-500"></div>
          </div>
          <h1 className={`text-4xl md:text-5xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-3`}>
            About AI Finance Tracker
          </h1>
          <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} text-lg`}>
            How it’s built, the tools behind it, and space for your bio.
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 -mt-16 relative z-10">
        <div className={`${isDark ? 'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 border-slate-700' : 'bg-gradient-to-br from-white via-slate-50 to-white border-slate-200'} rounded-3xl shadow-2xl border overflow-hidden`}>
          <div className="p-8 md:p-10">
            {/* Project Overview */}
            <section className="mb-12">
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-3`}>Project Overview</h2>
              <p className={`${isDark ? 'text-slate-300' : 'text-slate-700'} leading-relaxed`}>
                AI Finance Tracker helps you log and analyze personal finances with smart receipt parsing.
                Upload a receipt image, the backend extracts text and uses AI models to identify merchant, amount, date,
                and category. Transactions and budgets are managed with a clean UI and Dark/Light theme support.
              </p>
            </section>

            {/* Architecture */}
            <section className="mb-12">
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-3`}>Architecture</h2>
              <ul className={`${isDark ? 'text-slate-300' : 'text-slate-700'} space-y-2`}>
                <li>
                  Frontend: React + Vite + Tailwind CSS, using a custom Theme system and Sidebar layout. Auth handled via JWT.
                </li>
                <li>
                  Backend: FastAPI serving authentication, transactions, budgets, and receipt parsing endpoints.
                </li>
                <li>
                  Database: SQLite via SQLAlchemy ORM, with simple schema and default categories seeded on startup.
                </li>
                <li>
                  AI Integration: OpenRouter models (vision/text) to parse receipts and classify categories. OCR via EasyOCR / Tesseract with an online fallback.
                </li>
                <li>
                  Docker: docker-compose entries for backend and frontend to ease local development.
                </li>
              </ul>
            </section>

            {/* Tools & Languages */}
            <section className="mb-12">
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-4`}>Tools & Languages</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className={`p-4 rounded-xl border ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-100/50'} flex items-center gap-3`}>
                  <TechIcon src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" alt="React" />
                  <div>
                    <p className={`${isDark ? 'text-white' : 'text-slate-900'} font-semibold`}>React</p>
                    <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} text-sm`}>Frontend UI</p>
                  </div>
                </div>
                <div className={`p-4 rounded-xl border ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-100/50'} flex items-center gap-3`}>
                  <TechIcon src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vitejs/vitejs-original.svg" alt="Vite" />
                  <div>
                    <p className={`${isDark ? 'text-white' : 'text-slate-900'} font-semibold`}>Vite</p>
                    <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} text-sm`}>Dev/Build</p>
                  </div>
                </div>
                <div className={`p-4 rounded-xl border ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-100/50'} flex items-center gap-3`}>
                  <TechIcon src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-plain.svg" alt="Tailwind" />
                  <div>
                    <p className={`${isDark ? 'text-white' : 'text-slate-900'} font-semibold`}>Tailwind</p>
                    <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} text-sm`}>Styling</p>
                  </div>
                </div>
                <div className={`p-4 rounded-xl border ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-100/50'} flex items-center gap-3`}>
                  <TechIcon src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" alt="Python" />
                  <div>
                    <p className={`${isDark ? 'text-white' : 'text-slate-900'} font-semibold`}>Python</p>
                    <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} text-sm`}>Backend</p>
                  </div>
                </div>
                <div className={`p-4 rounded-xl border ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-100/50'} flex items-center gap-3`}>
                  <TechIcon src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/fastapi/fastapi-original.svg" alt="FastAPI" />
                  <div>
                    <p className={`${isDark ? 'text-white' : 'text-slate-900'} font-semibold`}>FastAPI</p>
                    <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} text-sm`}>Web API</p>
                  </div>
                </div>
                <div className={`p-4 rounded-xl border ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-100/50'} flex items-center gap-3`}>
                  <TechIcon src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sqlite/sqlite-original.svg" alt="SQLite" />
                  <div>
                    <p className={`${isDark ? 'text-white' : 'text-slate-900'} font-semibold`}>SQLite</p>
                    <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} text-sm`}>Database</p>
                  </div>
                </div>
                <div className={`p-4 rounded-xl border ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-100/50'} flex items-center gap-3`}>
                  <TechIcon src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sqlalchemy/sqlalchemy-original.svg" alt="SQLAlchemy" />
                  <div>
                    <p className={`${isDark ? 'text-white' : 'text-slate-900'} font-semibold`}>SQLAlchemy</p>
                    <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} text-sm`}>ORM</p>
                  </div>
                </div>
                <div className={`p-4 rounded-xl border ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-100/50'} flex items-center gap-3`}>
                  <TechIcon src="https://avatars.githubusercontent.com/u/12627020?s=200&v=4" alt="OpenRouter" />
                  <div>
                    <p className={`${isDark ? 'text-white' : 'text-slate-900'} font-semibold`}>OpenRouter</p>
                    <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} text-sm`}>AI Models</p>
                  </div>
                </div>
              </div>
            </section>

            {/* About Me (Placeholder) */}
            <section>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-3`}>About Me</h2>
              <p className={`${isDark ? 'text-slate-300' : 'text-slate-700'} leading-relaxed`}>
                [Add your personal bio here: background, interests, and your motivation for building AI Finance Tracker.]
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default About;
