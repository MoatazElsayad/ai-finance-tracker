import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Landing() {
  const [year, setYear] = useState(new Date().getFullYear());

  // Animation styles converted to a <style> tag compatible with React
  const animations = `
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-25px); }
    }
    @keyframes pulse-glow {
      0%, 100% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.5); }
      50% { box-shadow: 0 0 60px rgba(139, 92, 246, 0.7); }
    }
    @keyframes gradient {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes shimmer {
      0% { background-position: -1000px 0; }
      100% { background-position: 1000px 0; }
    }
    .float-animation { animation: float 4s ease-in-out infinite; }
    .glow-animation { animation: pulse-glow 3s ease-in-out infinite; }
    .gradient-animation { background-size: 400% 400%; animation: gradient 15s ease infinite; }
    .shimmer { 
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent); 
      background-size: 1000px 100%; 
      animation: shimmer 3s infinite; 
    }
    .hover-lift { transition: transform 0.3s ease, box-shadow 0.3s ease; }
    .hover-lift:hover { transform: translateY(-5px); box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15); }
  `;

  return (
    <div className="bg-gray-50 antialiased font-sans">
      <style>{animations}</style>

      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-2xl">💰</span>
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AI Finance Tracker
                </span>
                <p className="text-xs text-gray-500 -mt-1">Powered by AI</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Features</a>
              <a href="#ai" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">AI Technology</a>
            </div>
            <div className="flex gap-3">
              <Link to="/login" className="px-5 py-2 text-gray-700 hover:text-gray-900 font-semibold transition-colors">Sign In</Link>
              <Link to="/register" className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold">
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 gradient-animation">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur rounded-full shadow-lg border border-gray-200">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-sm font-semibold text-gray-700">🔥 Now with GPT-4 & Gemini AI</span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 leading-tight">
                Master Your Money with
                <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mt-2">
                  AI Intelligence
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Track expenses, analyze patterns, and receive personalized insights from the world's most advanced AI.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/register" className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-2xl transition-all shadow-lg font-bold text-lg flex items-center justify-center gap-2">
                  Start Free Trial
                </Link>
                <a href="#features" className="px-8 py-4 bg-white text-gray-700 rounded-xl hover:shadow-xl transition-all border-2 border-gray-200 font-bold text-lg text-center">
                  Watch Demo
                </a>
              </div>
            </div>

            {/* Dashboard Preview Widget */}
            <div className="relative float-animation">
              <div className="bg-white rounded-3xl shadow-2xl p-6 border border-gray-100 glow-animation relative overflow-hidden">
                <div className="absolute inset-0 shimmer pointer-events-none"></div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Monthly Dashboard</h3>
                    <p className="text-sm text-gray-500">January 2026</p>
                  </div>
                  <span className="px-3 py-1.5 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-full text-sm font-bold shadow-lg">
                    +39% Savings
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                    <p className="text-xs text-green-600 font-semibold">Income</p>
                    <p className="text-2xl font-black text-green-700">$5,240</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                    <p className="text-xs text-red-600 font-semibold">Expenses</p>
                    <p className="text-2xl font-black text-red-700">$3,180</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <p className="text-xs text-blue-600 font-semibold">Saved</p>
                    <p className="text-2xl font-black text-blue-700">$2,060</p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-100 to-indigo-100 p-5 rounded-2xl border-2 border-purple-200">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">🤖</span>
                    <p className="font-bold text-gray-900">AI Financial Insight</p>
                  </div>
                  <p className="text-sm text-gray-700">
                    <strong>Excellent progress!</strong> You've saved 39% of your income this month. Consider investing the extra $560.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-gray-900">Everything You Need</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: "🤖", title: "AI Insights", desc: "Personalized advice from GPT-4 and Gemini." },
              { icon: "📊", title: "Analytics", desc: "Visualize your finances with interactive charts." },
              { icon: "💰", title: "Smart Tracking", desc: "Effortlessly track income and expenses." },
              { icon: "🚨", title: "Anomaly Detection", desc: "AI flags unusual transactions automatically." },
              { icon: "🎯", title: "Budget Goals", desc: "Set limits and get proactive alerts." },
              { icon: "🔒", title: "Secure", desc: "Bank-level 256-bit encryption for your data." },
            ].map((f, i) => (
              <div key={i} className="p-8 rounded-3xl border-2 border-gray-100 hover-lift bg-gray-50 cursor-pointer group">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform">
                  <span className="text-3xl">{f.icon}</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{f.title}</h3>
                <p className="text-gray-700">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="font-bold text-white mb-2">AI Finance Tracker</p>
          <div className="flex justify-center gap-6 mb-6">
            <Link to="/terms" className="hover:text-white">Terms</Link>
            <Link to="/privacy" className="hover:text-white">Privacy</Link>
            <Link to="/contact" className="hover:text-white">Contact</Link>
          </div>
          <p className="text-sm text-gray-500">&copy; {year} AI Finance Tracker. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}