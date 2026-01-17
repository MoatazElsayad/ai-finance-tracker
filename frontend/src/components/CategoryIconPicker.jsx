/**
 * Category Icon Picker Modal
 * Allows users to pick emoji icons for categories
 */
import { X } from 'lucide-react';

// Popular emoji icons for different categories
const EMOJI_ICONS = {
  expense: [
    { emoji: '🍔', label: 'Food & Dining' },
    { emoji: '🚗', label: 'Transportation' },
    { emoji: '🛍️', label: 'Shopping' },
    { emoji: '💡', label: 'Utilities' },
    { emoji: '🏥', label: 'Health' },
    { emoji: '🎮', label: 'Entertainment' },
    { emoji: '📱', label: 'Phone & Internet' },
    { emoji: '🏠', label: 'Rent & Housing' },
    { emoji: '🎓', label: 'Education' },
    { emoji: '✈️', label: 'Travel' },
    { emoji: '🍕', label: 'Restaurant' },
    { emoji: '⚽', label: 'Sports' },
    { emoji: '🎬', label: 'Movies' },
    { emoji: '📚', label: 'Books' },
    { emoji: '💇', label: 'Personal Care' },
    { emoji: '🚴', label: 'Recreation' },
    { emoji: '👕', label: 'Clothing' },
    { emoji: '💄', label: 'Beauty' },
    { emoji: '🎪', label: 'Fun' },
    { emoji: '⚖️', label: 'Legal' },
  ],
  income: [
    { emoji: '💰', label: 'Salary' },
    { emoji: '💼', label: 'Freelance' },
    { emoji: '📈', label: 'Investment' },
    { emoji: '🎁', label: 'Gift' },
    { emoji: '🏆', label: 'Bonus' },
    { emoji: '💵', label: 'Cash' },
    { emoji: '🎲', label: 'Gambling' },
    { emoji: '💎', label: 'Royalty' },
    { emoji: '🏷️', label: 'Refund' },
    { emoji: '📊', label: 'Interest' },
  ]
};

function CategoryIconPicker({ isOpen, onClose, onSelect, type = 'expense' }) {
  if (!isOpen) return null;

  const icons = EMOJI_ICONS[type] || EMOJI_ICONS.expense;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-md max-h-96 overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">
                {type === 'expense' ? '💸' : '💰'}
              </span>
              Pick Icon
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Icon Grid */}
          <div className="p-6">
            <div className="grid grid-cols-5 gap-3">
              {icons.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onSelect(item.emoji);
                    onClose();
                  }}
                  title={item.label}
                  className="aspect-square flex items-center justify-center text-3xl bg-slate-700/50 hover:bg-slate-600 rounded-lg transition-all hover:scale-110 border border-slate-600 hover:border-amber-400/50 cursor-pointer"
                >
                  {item.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-3 border-t border-slate-700">
            <p className="text-xs text-slate-400 text-center">
              Click to select an icon for your {type}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default CategoryIconPicker;
