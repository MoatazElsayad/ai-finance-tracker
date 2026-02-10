import { useState, useEffect, useRef } from 'react';
import { X, Sparkles, RefreshCw, Search } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { createCategory } from '../api';
import EmojiPicker from './EmojiPicker';
import { getSmartSuggestions } from '../utils/emojiData';

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

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-all duration-500 animate-in fade-in"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in zoom-in duration-300">
        <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'} w-full max-w-md shadow-2xl relative`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                <Sparkles className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h2 className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  New {type === 'expense' ? 'Expense' : 'Income'} Category
                </h2>
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Personalize Your Tracker
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-all ${
                isDark ? 'hover:bg-slate-700 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-900'
              }`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-black uppercase tracking-[0.2em] animate-in shake">
                {error}
              </div>
            )}

            {/* Category Name */}
            <div>
              <label className={`block text-xs font-black uppercase tracking-[0.2em] ml-2 ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-4`}>
                Category Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Coffee, Freelance Project"
                className={`input-unified ${isDark ? 'input-unified-dark' : 'input-unified-light'}`}
                disabled={loading}
              />
            </div>

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

                <button
                  type="button"
                  onClick={() => setShowPicker(!showPicker)}
                  className={`text-[10px] font-black uppercase tracking-[0.2em] px-6 py-3 rounded-xl border-2 transition-all ${
                    isDark 
                      ? 'border-slate-800 text-slate-400 hover:border-amber-500/30 hover:text-amber-500 hover:bg-amber-500/5' 
                      : 'border-slate-100 text-slate-500 hover:border-amber-500/30 hover:text-amber-500 hover:bg-amber-500/5'
                  }`}
                >
                  {showPicker ? 'Close Picker' : 'Choose Icon'}
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all ${
                  isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="btn-primary-unified flex-1 text-xs uppercase tracking-[0.2em] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  'Create'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default CustomCategoryCreator;
