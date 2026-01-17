/**
 * Category Badge Component
 * Displays category with icon in a compact, reusable format
 */

function CategoryBadge({ icon, name, size = 'md', type = 'expense' }) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base',
  };

  const bgColors = {
    expense: 'bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20',
    income: 'bg-green-500/10 border-green-500/30 text-green-300 hover:bg-green-500/20',
    default: 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700',
  };

  const color = bgColors[type] || bgColors.default;

  return (
    <div className={`inline-flex items-center gap-2 rounded-lg border ${sizeClasses[size]} ${color} transition-all`}>
      <span className="text-lg leading-none">{icon}</span>
      <span className="font-medium whitespace-nowrap">{name}</span>
    </div>
  );
}

export default CategoryBadge;
