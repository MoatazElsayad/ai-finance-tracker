/**
 * Category Icon Picker Modal
 * Allows users to pick emoji icons for categories
 */
import { X, ImagePlus, Search as SearchIcon } from 'lucide-react';
import { useMemo, useState, useRef } from 'react';

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
    { emoji: '🧽', label: 'Cleaning' },
    { emoji: '🧺', label: 'Laundry' },
    { emoji: '🍼', label: 'Kids' },
    { emoji: '🐶', label: 'Pets' },
    { emoji: '🍻', label: 'Drinks' },
    { emoji: '🍩', label: 'Snacks' },
    { emoji: '🧠', label: 'Courses' },
    { emoji: '🧰', label: 'Repairs' },
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
    { emoji: '🧾', label: 'Invoice' },
    { emoji: '🪙', label: 'Crypto' },
  ]
};

function isImageIcon(str) {
  return typeof str === 'string' && (str.startsWith('http') || str.startsWith('data:'));
}

function CategoryIconPicker({ isOpen, onClose, onSelect, type = 'expense' }) {
  const [query, setQuery] = useState('');
  const fileInputRef = useRef(null);
  if (!isOpen) return null;

  const icons = EMOJI_ICONS[type] || EMOJI_ICONS.expense;
  const filteredIcons = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return icons;
    return icons.filter(i => i.label.toLowerCase().includes(q) || i.emoji.includes(q));
  }, [icons, query]);

  const handleUploadClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        if (typeof dataUrl === 'string') {
          onSelect(dataUrl);
          onClose();
        }
      };
      reader.readAsDataURL(file);
    } catch {
      // swallow; keep UI simple
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}>
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-md max-h-[70vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-3 border-b border-slate-700 flex items-center gap-2">
            <span className="text-2xl">{type === 'expense' ? '💸' : '💰'}</span>
            <div className="relative flex-1">
              <SearchIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search icons..."
                className="w-full pl-9 pr-10 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              />
              <button
                type="button"
                title="Add photo"
                onClick={handleUploadClick}
                className="absolute right-2 top-1.5 p-1.5 rounded-md bg-slate-700/60 border border-slate-600 hover:bg-slate-700 text-slate-200"
              >
                <ImagePlus className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            <button
              onClick={onClose}
              className="ml-2 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Icon Grid */}
          <div className="p-4 overflow-y-auto max-h-[55vh]">
            <div className="grid grid-cols-6 gap-2">
              {filteredIcons.map((item, idx) => (
                <button
                  key={`${item.emoji}-${idx}`}
                  type="button"
                  onClick={() => {
                    onSelect(item.emoji);
                    onClose();
                  }}
                  title={item.label}
                  className="aspect-square flex items-center justify-center text-2xl bg-slate-700/50 hover:bg-slate-600 rounded-lg transition-all hover:scale-105 border border-slate-600 hover:border-amber-400/50 cursor-pointer"
                >
                  {item.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-3 border-t border-slate-700">
            <p className="text-xs text-slate-400 text-center">
              Pick an emoji or tap the small photo icon to upload
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default CategoryIconPicker;
