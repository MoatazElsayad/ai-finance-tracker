import { useState, useEffect, useRef } from 'react';
import { X, Sparkles, RefreshCw, Search } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { createCategory } from '../api';
import EmojiPicker from './EmojiPicker';
import { getSmartSuggestions } from '../utils/emojiData';
import { Button, Card, Modal, Input } from './UI';

function CustomCategoryCreator({ isOpen, onClose, onSuccess, type = 'expense' }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('💰');
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Category name is required');
      return;
    }

    setLoading(true);

    try {
      await createCategory(name.trim(), type, icon);
      
      // Reset form
      setName('');
      setIcon('💰');
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`New ${type === 'expense' ? 'Expense' : 'Income'} Category`}
      subtitle="Personalize Your Tracker"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category Name */}
        <Input
          label="Category Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Coffee, Freelance Project"
          disabled={loading}
          error={error}
        />

        <div className="space-y-6">
          <label className={`block text-[10px] font-black uppercase tracking-[0.2em] ml-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Category Icon
          </label>
          
          <div className="flex flex-col items-center gap-6">
            {/* Selected Icon Display & Picker Trigger */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => setShowPicker(!showPicker)}
                className={`w-28 h-28 rounded-[2rem] border-4 flex items-center justify-center text-5xl shadow-2xl transition-all duration-500 relative overflow-hidden ${
                  icon
                    ? 'bg-amber-500/10 border-amber-500/30 shadow-amber-500/10'
                    : isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className="animate-in zoom-in duration-300 z-10">{icon || '💰'}</span>
                <div className="absolute inset-0 bg-amber-500/0 group-hover:bg-amber-500/5 transition-all flex items-center justify-center">
                  <Search className="w-8 h-8 text-amber-500 opacity-0 group-hover:opacity-100 transition-all transform scale-50 group-hover:scale-100" />
                </div>
              </button>

              {/* Picker Popover */}
              {showPicker && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 z-[70]">
                  <EmojiPicker 
                    onSelect={(emoji) => {
                      setIcon(emoji);
                      setShowPicker(false);
                    }}
                    onClose={() => setShowPicker(false)}
                    categoryName={name}
                  />
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPicker(!showPicker)}
              className="!text-[10px] !uppercase !tracking-[0.2em]"
            >
              {showPicker ? 'Close Picker' : 'Choose Icon'}
            </Button>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-4">
          <Button
            variant="secondary"
            className="flex-1 !text-xs !uppercase !tracking-[0.2em]"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={!name.trim()}
            className="flex-1 !text-xs !uppercase !tracking-[0.2em]"
          >
            Create Category
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default CustomCategoryCreator;
