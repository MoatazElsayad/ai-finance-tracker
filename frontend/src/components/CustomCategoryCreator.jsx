import { useState, useEffect, useRef } from 'react';
import { X, Sparkles, RefreshCw } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

function CustomCategoryCreator({ isOpen, onClose, onSuccess, type = 'expense' }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggesting, setSuggesting] = useState(false);
  const suggestTimer = useRef(null);
  const lastNameRef = useRef('');
  const lastEmojiRef = useRef('');

  const localSuggestEmoji = (text) => {
    const t = (text || '').toLowerCase();
    const map = [
      [/food|restaurant|coffee|cafe|meal|grocery|pizza|burger/, '🍔'],
      [/transport|car|uber|taxi|bus|train|fuel|gas|parking/, '🚗'],
      [/shop|shopping|mall|clothes|fashion|store|retail/, '🛍️'],
      [/bill|utility|electric|water|internet|phone|wifi/, '💡'],
      [/health|doctor|hospital|medicine|pharmacy|fitness|gym/, '🏥'],
      [/entertain|movie|cinema|netflix|game|games|fun/, '🎮'],
      [/travel|flight|hotel|trip|vacation|holiday/, '✈️'],
      [/education|school|course|book|books|study|tuition/, '🎓'],
      [/rent|house|home|mortgage|apartment/, '🏠'],
      [/salary|pay|income|bonus|freelance|cash/, '💰'],
      [/gift|present/, '🎁'],
      [/interest|investment|stock|crypto|bitcoin/, '📈'],
      [/refund|return/, '🏷️'],
      [/pet|dog|cat/, '🐶'],
      [/kids|baby|child|children/, '🍼'],
      [/beauty|salon|makeup|hair|spa/, '💄'],
      [/clean|laundry|wash|soap/, '🧽'],
    ];
    for (const [regex, emoji] of map) {
      if (regex.test(t)) return emoji;
    }
    return '📦';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Category name is required');
      return;
    }

    setLoading(true);

    try {
      const { createCategory } = await import('../api');
      const chosenIcon = icon || localSuggestEmoji(name);
      await createCategory(name.trim(), type, chosenIcon);
      
      // Reset form
      setName('');
      setIcon('');
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (suggestTimer.current) {
      clearTimeout(suggestTimer.current);
    }
    const text = name.trim();
    if (!text) {
      setIcon('');
      return;
    }
    suggestTimer.current = setTimeout(async () => {
      setSuggesting(true);
      try {
        const token = localStorage.getItem('token');
        const normalized = text.toLowerCase();
        if (normalized.length < 3) {
          setIcon(localSuggestEmoji(text));
          return;
        }
        if (lastNameRef.current === normalized) {
          if (lastEmojiRef.current) setIcon(lastEmojiRef.current);
          else setIcon(localSuggestEmoji(text));
          return;
        }
        if (token) {
          const { askAIQuestion } = await import('../api');
          const now = new Date();
          const { answer } = await askAIQuestion(
            now.getFullYear(),
            now.getMonth() + 1,
            `Return a single emoji that best represents the category "${text}". Only respond with the emoji, nothing else.`
          );
          const emoji = (answer || '').trim();
          if (emoji && emoji.length <= 2) {
            setIcon(emoji);
            lastNameRef.current = normalized;
            lastEmojiRef.current = emoji;
          } else {
            setIcon(localSuggestEmoji(text));
          }
        }
      } catch {
        const fallback = localSuggestEmoji(text);
        setIcon(fallback);
        lastNameRef.current = text.toLowerCase();
        lastEmojiRef.current = fallback;
      } finally {
        setSuggesting(false);
      }
    }, 1000);
    return () => {
      if (suggestTimer.current) clearTimeout(suggestTimer.current);
    };
  }, [name, type]);

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
        <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'} w-full max-w-md shadow-2xl`}>
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
                  AI-Powered Suggestions
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

            <div className="flex items-center gap-6">
              <div className="flex-1">
                <label className={`block text-[10px] font-black uppercase tracking-[0.2em] mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Smart Icon
                </label>
                <div
                  className={`w-24 h-24 rounded-3xl border-2 flex items-center justify-center text-4xl shadow-sm transition-all duration-500 ${
                    icon
                      ? 'bg-amber-500/10 border-amber-500/30 shadow-amber-500/5'
                      : isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  {suggesting ? (
                    <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
                  ) : (
                    <span className="animate-in zoom-in duration-300">{icon || '🔖'}</span>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <p className={`text-[10px] font-bold leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  AI will automatically suggest an icon based on your category name.
                </p>
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
                disabled={loading || !name.trim() || !icon}
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
