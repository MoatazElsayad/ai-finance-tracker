import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { themeColors } from '../utils/themeColors';

/**
 * Animated Card Component
 */
export const Card = ({ children, className = '', animate = true, ...props }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const Component = animate ? motion.div : 'div';
  const animationProps = animate ? {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  } : {};

  return (
    <Component
      {...animationProps}
      {...props}
      className={`
        relative overflow-hidden rounded-3xl border p-6
        transition-all duration-300
        ${isDark 
          ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 shadow-2xl shadow-black/20 hover:border-slate-600/50' 
          : 'bg-gradient-to-br from-white to-slate-50 border-slate-200 shadow-xl shadow-slate-200/50 hover:border-slate-300/50'
        }
        ${className}
      `}
    >
      {children}
    </Component>
  );
};

/**
 * Standard Button Component
 */
export const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', // 'primary', 'secondary', 'outline', 'danger', 'ghost'
  size = 'md', // 'sm', 'md', 'lg'
  disabled = false,
  loading = false,
  className = '',
  icon: Icon,
  type = 'button',
  ...props
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const variants = {
    primary: 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20',
    secondary: isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-900',
    outline: isDark 
      ? 'border border-slate-600 hover:border-slate-500 text-slate-300 bg-transparent' 
      : 'border border-slate-300 hover:border-slate-400 text-slate-600 bg-transparent',
    danger: 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20',
    ghost: isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-8 py-4 text-base',
  };

  return (
    <motion.button
      whileHover={disabled || loading ? {} : { scale: 1.02 }}
      whileTap={disabled || loading ? {} : { scale: 0.98 }}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
      className={`
        flex items-center justify-center gap-2 rounded-2xl font-bold transition-all
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : Icon && <Icon className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />}
      {children}
    </motion.button>
  );
};

/**
 * Standard Input Component
 */
export const Input = ({ 
  label, 
  error, 
  icon: Icon, 
  className = '', 
  ...props 
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="w-full space-y-2">
      {label && (
        <label className={`block text-xs font-black uppercase tracking-[0.2em] ml-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          {label}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <div className="absolute left-6 top-1/2 -translate-y-1/2">
            <Icon className={`w-5 h-5 transition-colors ${isDark ? 'text-slate-600 group-focus-within:text-amber-500' : 'text-slate-400 group-focus-within:text-amber-500'}`} />
          </div>
        )}
        <input
          {...props}
          className={`
            w-full rounded-2xl border-2 transition-all outline-none font-bold
            ${Icon ? 'pl-14 pr-6' : 'px-6'} py-4
            ${isDark 
              ? 'bg-slate-900/50 border-slate-800 text-white focus:border-amber-500/50 focus:bg-slate-900' 
              : 'bg-white border-slate-200 text-slate-900 focus:border-amber-500/50 focus:bg-white'
            }
            ${error ? 'border-red-500/50 focus:border-red-500' : ''}
            ${className}
          `}
        />
      </div>
      {error && (
        <p className="text-[10px] font-black uppercase tracking-widest text-red-500 ml-2 animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
};

/**
 * Standard Modal Component
 */
export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  children, 
  maxWidth = 'max-w-md',
  showClose = true
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-all duration-500 animate-in fade-in"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in zoom-in duration-300">
        <Card className={`w-full ${maxWidth} shadow-2xl relative p-0 overflow-visible`} animate={false}>
          <div className="p-8 md:p-10">
            {/* Header */}
            {(title || showClose) && (
              <div className="flex items-center justify-between mb-8">
                <div>
                  {title && (
                    <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {title}
                    </h2>
                  )}
                  {subtitle && (
                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {subtitle}
                    </p>
                  )}
                </div>
                {showClose && (
                  <button
                    onClick={onClose}
                    className={`p-2 rounded-xl transition-all ${
                      isDark ? 'hover:bg-slate-700 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <div className="w-6 h-6 flex items-center justify-center">✕</div>
                  </button>
                )}
              </div>
            )}
            {children}
          </div>
        </Card>
      </div>
    </>
  );
};

/**
 * Skeleton Loader
 */
export const Skeleton = ({ className = '', circle = false }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <div 
      className={`
        animate-pulse
        ${isDark ? 'bg-slate-800' : 'bg-slate-200'}
        ${circle ? 'rounded-full' : 'rounded-xl'}
        ${className}
      `}
    />
  );
};

/**
 * Empty State Component
 */
export const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action 
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className={`p-6 rounded-full mb-4 ${isDark ? 'bg-slate-800/50 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>
        {Icon && <Icon className="w-12 h-12" />}
      </div>
      <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
      <p className={`text-sm max-w-xs mx-auto mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{description}</p>
      {action}
    </div>
  );
};
