import React from 'react';
import { GitHub, Linkedin, Twitter, Rocket } from 'lucide-react';

const Footer = () => {
  const year = new Date().getFullYear();
  
  return (
    <footer className="bg-gradient-to-br from-amber-500 to-amber-600 text-white py-12 px-6 md:px-12 mt-auto border-t border-white/10 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 p-24 opacity-10 rotate-12 pointer-events-none">
        <Rocket className="w-64 h-64" />
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-10">
          {/* Brand and Rights */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-lg shadow-black/10">
                <Rocket className="w-6 h-6 text-amber-500" />
              </div>
              <span className="font-black text-2xl tracking-tight">
                Finance<span className="text-amber-100">AI</span>
              </span>
            </div>
            <div className="flex flex-col items-center md:items-start">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/80">
                Next-Gen Intelligence
              </p>
              <p className="text-xs font-bold text-white/60 mt-1">
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
              className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-[1.25rem] flex items-center justify-center hover:bg-white/20 hover:scale-110 hover:-translate-y-1 transition-all duration-300 border border-white/20 shadow-xl group"
              title="GitHub"
            >
              <GitHub className="w-6 h-6 text-white group-hover:rotate-6 transition-transform" />
            </a>
            <a 
              href="https://linkedin.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-[1.25rem] flex items-center justify-center hover:bg-white/20 hover:scale-110 hover:-translate-y-1 transition-all duration-300 border border-white/20 shadow-xl group"
              title="LinkedIn"
            >
              <Linkedin className="w-6 h-6 text-white group-hover:rotate-6 transition-transform" />
            </a>
            <a 
              href="https://x.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-[1.25rem] flex items-center justify-center hover:bg-white/20 hover:scale-110 hover:-translate-y-1 transition-all duration-300 border border-white/20 shadow-xl group"
              title="X (Twitter)"
            >
              <Twitter className="w-6 h-6 text-white group-hover:rotate-6 transition-transform" />
            </a>
          </div>
        </div>

        {/* Bottom divider for mobile */}
        <div className="md:hidden w-full h-px bg-white/10 mt-10 mb-2"></div>
      </div>
    </footer>
  );
};

export default Footer;
