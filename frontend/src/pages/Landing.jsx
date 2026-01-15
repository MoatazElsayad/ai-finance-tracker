import { Link } from "react-router-dom";
import { LineChart, Line, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function Landing() {
  const year = new Date().getFullYear();

  return (
    <div className="bg-[#0a0e27] antialiased font-sans text-slate-300">

      {/* Navigation */}
      <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-400/20 rounded-lg flex items-center justify-center border border-amber-400/30 shadow-md">
                <span className="text-xl">💼</span>
              </div>
              <span className="font-bold text-xl text-white">
                AI Finance Tracker
              </span>
              <p className="text-xs text-slate-400 -mt-1">Powered by AI</p>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-300 hover:text-amber-400 font-medium transition-colors">Features</a>
              <a href="#ai" className="text-slate-300 hover:text-amber-400 font-medium transition-colors">AI Insights</a>
              <a href="#contact" className="text-slate-300 hover:text-amber-400 font-medium transition-colors">Contact</a>
            </div>
            <div className="flex gap-3">
              <Link to="/login" className="px-5 py-2 text-slate-300 hover:text-white font-semibold transition-colors">Sign In</Link>
              <Link to="/register" className="px-6 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 rounded-xl hover:shadow-lg transition-all font-semibold">
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-screen flex items-center bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#0f172a] py-20">
        <div className="absolute inset-0 z-0 opacity-10">
          <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: 'url(/path/to/dark-dashboard-screenshot.jpg)' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/80 backdrop-blur rounded-full shadow-lg border border-slate-700">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
                <span className="text-sm font-semibold text-white">Powered by Latest AI Models</span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight">
                Master Your Money with
                <span className="block bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent mt-2">
                  Intelligent Finance
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-slate-400 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Track expenses, gain AI-powered insights, and achieve your financial goals with ease.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/register" className="group px-8 py-4 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 rounded-xl hover:shadow-2xl transition-all shadow-lg font-bold text-lg flex items-center justify-center gap-2">
                  Start Free Trial
                </Link>
                <Link to="/login" className="px-8 py-4 bg-slate-800/80 text-white rounded-xl hover:shadow-xl transition-all border-2 border-slate-700 font-bold text-lg text-center">
                  Login
                </Link>
              </div>
            </div>

            {/* Dashboard Preview Widget (Dark Mode) */}
            <div className="relative">
              <div className="bg-slate-800/80 rounded-3xl shadow-2xl p-6 border border-slate-700 glow-gold relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent shimmer-animation pointer-events-none"></div>

                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-white text-xl">Monthly Dashboard</h3>
                    <p className="text-sm text-slate-400">January {year}</p>
                  </div>
                  <span className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full text-sm font-bold shadow-lg">
                    +39% Savings
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-500/20 p-4 rounded-xl border border-green-500/30">
                    <p className="text-xs text-green-400 font-semibold">Income</p>
                    <p className="text-2xl font-black text-green-300">$5,240</p>
                  </div>
                  <div className="bg-red-500/20 p-4 rounded-xl border border-red-500/30">
                    <p className="text-xs text-red-400 font-semibold">Expenses</p>
                    <p className="text-2xl font-black text-red-300">$3,180</p>
                  </div>
                  <div className="bg-amber-500/20 p-4 rounded-xl border border-amber-500/30">
                    <p className="text-xs text-amber-400 font-semibold">Saved</p>
                    <p className="text-2xl font-black text-amber-300">$2,060</p>
                  </div>
                </div>

                <div className="bg-slate-700/50 p-5 rounded-2xl border-2 border-slate-600 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">🤖</span>
                    <p className="font-bold text-white">AI Financial Insight</p>
                  </div>
                  <p className="text-sm text-slate-300">
                    <strong>Excellent progress!</strong> Your savings rate is strong. The AI suggests reviewing 'Eating Out' expenses.
                  </p>
                </div>

                {/* Mini Chart below AI box */}
                <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-600/50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-slate-400 font-medium">Savings Trend</p>
                    <span className="text-xs text-amber-400 font-semibold">+12%</span>
                  </div>
                  <ResponsiveContainer width="100%" height={60}>
                    <AreaChart data={[
                      { day: 1, value: 1800 },
                      { day: 5, value: 1950 },
                      { day: 10, value: 1850 },
                      { day: 15, value: 2000 },
                      { day: 20, value: 2100 },
                      { day: 25, value: 2060 }
                    ]}>
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#fbbf24"
                        fill="#fbbf24"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-white">Everything You Need</h2>
            <p className="text-xl text-slate-400 mt-4">Powerful tools to manage your money efficiently.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: "🧠", title: "AI Insights", desc: "Get personalized financial advice and smart recommendations from advanced AI models." },
              { icon: "📈", title: "Interactive Charts", desc: "Visualize your income, expenses, and savings with dynamic and easy-to-understand charts." },
              { icon: "📝", title: "Detailed Transactions", desc: "Effortlessly log and categorize your income and expenses with advanced filtering." },
              { icon: "🚨", title: "Smart Alerts", desc: "Receive proactive notifications for unusual spending or when nearing budget limits." },
              { icon: "🎯", title: "Budget Management", desc: "Set and track budgets for different categories to stay on top of your spending." },
              { icon: "🔒", title: "Secure & Private", desc: "Your financial data is protected with industry-leading encryption and security measures." },
            ].map((f, i) => (
              <div key={i} className="p-8 rounded-3xl border border-slate-700 hover:border-amber-400/50 transition-all bg-slate-800/50 backdrop-blur-sm shadow-xl hover:shadow-2xl hover:scale-[1.02] group">
                <div className="w-14 h-14 bg-amber-400/10 rounded-2xl flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform border border-amber-400/30">
                  <span className="text-3xl">{f.icon}</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">{f.title}</h3>
                <p className="text-slate-300">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Technology Section */}
      <section id="ai" className="py-24 bg-gradient-to-br from-[#1a1f3a] to-[#0a0e27]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl font-black text-white mb-4">Intelligent AI at Your Fingertips</h2>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-12">
            Our platform leverages a blend of advanced AI models to provide you with the most accurate and personalized financial insights.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 bg-slate-800/50 border-2 border-slate-700 rounded-xl px-4 py-3 shadow-lg hover:border-amber-400/50 transition-all">
              <img src="https://raw.githubusercontent.com/lobehub/lobe-icons/master/packages/static-png/dark/openai.png" alt="OpenAI" className="w-6 h-6" />
              <span className="text-white font-medium text-sm">ChatGPT-4o</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-800/50 border-2 border-slate-700 rounded-xl px-4 py-3 shadow-lg hover:border-amber-400/50 transition-all">
              <img src="https://raw.githubusercontent.com/lobehub/lobe-icons/master/packages/static-png/dark/gemini-color.png" alt="Google" className="w-6 h-6" />
              <span className="text-white font-medium text-sm">Gemini 2.0</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-800/50 border-2 border-slate-700 rounded-xl px-4 py-3 shadow-lg hover:border-amber-400/50 transition-all">
              <img src="https://raw.githubusercontent.com/lobehub/lobe-icons/master/packages/static-png/dark/gemma-color.png" alt="Google" className="w-6 h-6" />
              <span className="text-white font-medium text-sm">Gemma 3</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-800/50 border-2 border-slate-700 rounded-xl px-4 py-3 shadow-lg hover:border-amber-400/50 transition-all">
              <img src="https://raw.githubusercontent.com/lobehub/lobe-icons/master/packages/static-png/dark/deepseek-color.png" alt="DeepSeek" className="w-6 h-6" />
              <span className="text-white font-medium text-sm">DeepSeek R1</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-800/50 border-2 border-slate-700 rounded-xl px-4 py-3 shadow-lg hover:border-amber-400/50 transition-all">
              <img src="https://raw.githubusercontent.com/lobehub/lobe-icons/master/packages/static-png/dark/meta-color.png" alt="Meta" className="w-6 h-6" />
              <span className="text-white font-medium text-sm">Llama 3.3</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-800/50 border-2 border-slate-700 rounded-xl px-4 py-3 shadow-lg hover:border-amber-400/50 transition-all">
              <img src="https://raw.githubusercontent.com/lobehub/lobe-icons/master/packages/static-png/dark/mistral-color.png" alt="Mistral" className="w-6 h-6" />
              <span className="text-white font-medium text-sm">Mistral 7B</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-800/50 border-2 border-slate-700 rounded-xl px-4 py-3 shadow-lg hover:border-amber-400/50 transition-all">
              <img src="https://raw.githubusercontent.com/lobehub/lobe-icons/master/packages/static-png/dark/nvidia-color.png" alt="Nvidia" className="w-6 h-6" />
              <span className="text-white font-medium text-sm">Nemotron</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-800/50 border-2 border-slate-700 rounded-xl px-4 py-3 shadow-lg hover:border-amber-400/50 transition-all">
              <img src="https://raw.githubusercontent.com/lobehub/lobe-icons/master/packages/static-png/dark/qwen-color.png" alt="Qwen" className="w-6 h-6" />
              <span className="text-white font-medium text-sm">Qwen 2.5</span>
            </div>
          </div>
          <Link to="/register" className="group px-8 py-4 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 rounded-xl hover:shadow-2xl transition-all shadow-lg font-bold text-lg inline-flex items-center justify-center gap-2">
            Explore AI Insights
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="font-bold text-white mb-2 text-lg">AI Finance Tracker</p>
          <div className="flex justify-center gap-6 mb-6">
            <a href="#" className="hover:text-amber-400 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-amber-400 transition-colors">Privacy Policy</a>
            <a href="mailto:support@financeai.com" className="hover:text-amber-400 transition-colors">Support</a>
          </div>
          <p className="text-sm text-slate-500">&copy; {year} AI Finance Tracker. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}