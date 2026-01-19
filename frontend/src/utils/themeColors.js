/**
 * Theme Colors - Color definitions for light and dark modes
 */

export const themeColors = {
  dark: {
    // Background colors
    bg: {
      primary: 'bg-[#0a0e27]',
      secondary: 'bg-slate-900/80',
      tertiary: 'bg-slate-800/50',
      card: 'from-slate-800 to-slate-900',
      cardHover: 'hover:border-amber-500/50',
      input: 'bg-slate-700/50',
    },
    // Text colors
    text: {
      primary: 'text-white',
      secondary: 'text-slate-400',
      tertiary: 'text-slate-300',
      muted: 'text-slate-500',
    },
    // Border colors
    border: {
      primary: 'border-slate-700',
      light: 'border-slate-600',
    },
    // Accent colors
    accent: {
      amber: 'text-amber-400',
      green: 'text-green-400',
      red: 'text-red-400',
      blue: 'text-blue-400',
    },
  },
  light: {
    // Background colors
    bg: {
      primary: 'bg-slate-50',
      secondary: 'bg-white/90',
      tertiary: 'bg-slate-100/50',
      card: 'from-white to-slate-50',
      cardHover: 'hover:border-amber-400/70',
      input: 'bg-slate-100',
    },
    // Text colors
    text: {
      primary: 'text-slate-900',
      secondary: 'text-slate-600',
      tertiary: 'text-slate-700',
      muted: 'text-slate-400',
    },
    // Border colors
    border: {
      primary: 'border-slate-200',
      light: 'border-slate-300',
    },
    // Accent colors
    accent: {
      amber: 'text-amber-600',
      green: 'text-green-600',
      red: 'text-red-600',
      blue: 'text-blue-600',
    },
  },
};

// Helper function to get theme class
export const getThemeClass = (theme, category, key) => {
  return themeColors[theme]?.[category]?.[key] || '';
};
