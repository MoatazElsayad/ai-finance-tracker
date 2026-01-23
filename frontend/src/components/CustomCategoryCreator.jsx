/**
 * Custom Category Creator Modal
 * Allows users to create their own categories with custom icons
 */
import { useState } from 'react';
import { X } from 'lucide-react';
import CategoryIconPicker from './CategoryIconPicker';

function CustomCategoryCreator({ isOpen, onClose, onSuccess, type = 'expense' }) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Category name is required');
      return;
    }

    if (!icon) {
      setError('Please select an icon');
      return;
    }

    setLoading(true);

    try {
      const { createCategory } = await import('../api');
      await createCategory(name.trim(), type, icon);
      
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

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-md">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">✨</span>
              New {type === 'expense' ? 'Expense' : 'Income'} Category
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Category Name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Category Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Coffee, Freelance Project"
                className="w-full px-4 py-3 bg-slate-700/50 border-2 border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all placeholder-slate-500"
                disabled={loading}
              />
            </div>

            {/* Icon Selection */}
            <div className="relative">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Choose Icon
              </label>
              <button
                type="button"
                onClick={() => setShowIconPicker(prev => !prev)}
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all text-4xl flex items-center justify-center ${
                  icon
                    ? 'bg-amber-500/20 border-amber-400/50 hover:bg-amber-500/30'
                    : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700'
                }`}
              >
                {icon || '👆 Click to pick icon'}
              </button>
              <CategoryIconPicker
                isOpen={showIconPicker}
                onClose={() => setShowIconPicker(false)}
                onSelect={(selectedIcon) => {
                  setIcon(selectedIcon);
                  setShowIconPicker(false);
                }}
                type={type}
                variant="inline"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim() || !icon}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Category'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Inline picker rendered above within the button's container */}
    </>
  );
}

export default CustomCategoryCreator;
