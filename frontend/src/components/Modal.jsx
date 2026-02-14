import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { createPortal } from 'react-dom';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md', // 'sm', 'md', 'lg', 'xl', 'full'
  showClose = true
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
    full: 'max-w-[95vw]',
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`
            relative w-full ${sizes[size]} max-h-[90vh] overflow-hidden flex flex-col
            rounded-[2.5rem] border shadow-2xl
            ${isDark 
              ? 'bg-slate-900 border-slate-700 shadow-black/50' 
              : 'bg-white border-slate-200 shadow-slate-200/50'
            }
          `}
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-6 md:p-8 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <h2 className={`text-xl md:text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {title}
            </h2>
            {showClose && (
              <button
                onClick={onClose}
                className={`
                  p-2 rounded-xl transition-colors
                  ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}
                `}
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
            {children}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default Modal;
