/**
 * Category Badge Component
 * Displays category with icon in a compact, reusable format
 */

import { useTheme } from '../context/ThemeContext';

function CategoryBadge({ icon, name, size = 'md', type = 'expense' }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const sizeClasses = {
    sm: 'px-3 py-1 text-[10px]',
    md: 'px-4 py-2 text-xs',
    lg: 'px-5 py-3 text-sm',
  };

  const bgColors = {
    expense: isDark 
      ? 'bg-red-500/10 border-red-500/20 text-red-400' 
      : 'bg-red-50 border-red-100 text-red-600',
    income: isDark 
      ? 'bg-green-500/10 border-green-500/20 text-green-400' 
      : 'bg-green-50 border-green-100 text-green-600',
    default: isDark 
      ? 'bg-slate-800 border-slate-700 text-slate-400' 
      : 'bg-slate-50 border-slate-200 text-slate-600',
  };

  const color = bgColors[type] || bgColors.default;
  const isImage = typeof icon === 'string' && (icon.startsWith('http') || icon.startsWith('data:'));

  return (
    <div className={`inline-flex items-center gap-2 rounded-xl border font-black uppercase tracking-[0.2em] transition-all duration-300 ${sizeClasses[size]} ${color}`}>
      {isImage ? (
        <img src={icon} alt={name || 'icon'} className="w-4 h-4 rounded-lg object-cover" />
      ) : (
        <span className="text-sm leading-none">{icon}</span>
      )}
      <span className="whitespace-nowrap">{name}</span>
    </div>
  );
}

export default CategoryBadge;
