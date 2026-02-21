import React from 'react';
import { Github, Linkedin, Twitter, Rocket } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Footer = () => {
  const year = new Date().getFullYear();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <footer className={`${isDark ? 'bg-[#0a0e27] border-slate-800' : 'bg-slate-50 border-slate-200'} py-12 px-6 md:px-12 mt-auto border-t relative overflow-hidden transition-colors duration-500`}>
      {/* Decorative background elements */}
      <div className={`absolute top-0 right-0 p-24 opacity-5 rotate-12 pointer-events-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
        <Rocket className="w-64 h-64" />
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-10">
          {/* Brand and Rights */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500 rounded-xl shadow-lg shadow-amber-500/20">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <span className={`font-black text-2xl tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Finance<span className="text-amber-500">AI</span>
              </span>
            </div>
            <div className="flex flex-col items-center md:items-start">
              <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Next-Gen Intelligence
              </p>
              <p className={`text-xs font-bold ${isDark ? 'text-slate-600' : 'text-slate-500'} mt-1`}>
                &copy; {year} FinanceAI. All Rights Reserved.
              </p>
            </div>
          </div>

          {/* Social Media Links */}
          <div className="flex items-center gap-5">
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className={`w-14 h-14 ${isDark ? 'bg-slate-800/50 hover:bg-slate-800 text-white border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'} backdrop-blur-md rounded-[1.25rem] flex items-center justify-center hover:scale-110 hover:-translate-y-1 transition-all duration-300 border shadow-xl group`}
              title="GitHub"
            >
              <Github className="w-6 h-6 group-hover:rotate-6 transition-transform" />
            </a>
            <a 
              href="https://linkedin.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className={`w-14 h-14 ${isDark ? 'bg-slate-800/50 hover:bg-slate-800 text-white border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'} backdrop-blur-md rounded-[1.25rem] flex items-center justify-center hover:scale-110 hover:-translate-y-1 transition-all duration-300 border shadow-xl group`}
              title="LinkedIn"
            >
              <Linkedin className="w-6 h-6 group-hover:rotate-6 transition-transform" />
            </a>
            <a 
              href="https://x.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className={`w-14 h-14 ${isDark ? 'bg-slate-800/50 hover:bg-slate-800 text-white border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'} backdrop-blur-md rounded-[1.25rem] flex items-center justify-center hover:scale-110 hover:-translate-y-1 transition-all duration-300 border shadow-xl group`}
              title="X (Twitter)"
            >
              <Twitter className="w-6 h-6 group-hover:rotate-6 transition-transform" />
            </a>
          </div>
        </div>

        {/* Bottom divider for mobile */}
        <div className={`md:hidden w-full h-px ${isDark ? 'bg-slate-800' : 'bg-slate-200'} mt-10 mb-2`}></div>
      </div>
    </footer>
  );
};

export default Footer;
