import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, Star, Banknote, Utensils, Car, Home, Activity, Gamepad2, GraduationCap, ShoppingBag, Plane, MoreHorizontal } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { EMOJI_CATEGORIES, getSmartSuggestions, SMART_SUGGESTIONS } from '../utils/emojiData';

const ICON_MAP = {
  Star,
  Banknote,
  Utensils,
  Car,
  Home,
  Activity,
  Gamepad2,
  GraduationCap,
  ShoppingBag,
  Plane,
  MoreHorizontal
};

function EmojiPicker({ onSelect, onClose, categoryName = '' }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('popular');
  const pickerRef = useRef(null);

  const smartSuggestions = useMemo(() => getSmartSuggestions(categoryName), [categoryName]);

  const filteredEmojis = useMemo(() => {
    if (!search) {
      return EMOJI_CATEGORIES.find(c => c.id === activeTab)?.emojis || [];
    }
    
    // Search across all categories and suggestions
    const results = new Set();
    const lowerSearch = search.toLowerCase();
    
    // 1. Check categories by name
    EMOJI_CATEGORIES.forEach(cat => {
      if (cat.name.toLowerCase().includes(lowerSearch)) {
        cat.emojis.forEach(emoji => results.add(emoji));
      }
    });

    // 2. Check SMART_SUGGESTIONS by keywords
    SMART_SUGGESTIONS.forEach(s => {
      if (s.keywords.some(k => k.includes(lowerSearch) || lowerSearch.includes(k))) {
        s.emojis.forEach(emoji => results.add(emoji));
      }
    });

    // 3. If no results yet, return a few default ones or empty
    return Array.from(results);
  }, [search, activeTab]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div 
      ref={pickerRef}
      className={`w-full max-w-[320px] rounded-3xl border shadow-2xl overflow-hidden animate-in zoom-in duration-200 ${
        isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
      }`}
    >
      {/* Search Header */}
      <div className={`p-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          <input
            autoFocus
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search emojis..."
            className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm transition-all outline-none ${
              isDark 
                ? 'bg-slate-800 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-amber-500/20' 
                : 'bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500/20'
            }`}
          />
        </div>
      </div>

      {/* Smart Suggestions */}
      {!search && (
        <div className={`px-4 py-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Suggestions
          </p>
          <div className="flex gap-2">
            {smartSuggestions.map((emoji, idx) => (
              <button
                key={`smart-${idx}`}
                onClick={() => {
                  onSelect(emoji);
                  onClose();
                }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all hover:scale-110 hover:shadow-lg hover:shadow-amber-500/20 ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      {!search && (
        <div className={`flex overflow-x-auto no-scrollbar p-2 gap-1 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          {EMOJI_CATEGORIES.map(cat => {
            const Icon = ICON_MAP[cat.icon];
            return (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`flex-shrink-0 p-2 rounded-lg transition-all ${
                  activeTab === cat.id
                    ? 'bg-amber-500 text-white'
                    : isDark ? 'text-slate-500 hover:bg-slate-800' : 'text-slate-400 hover:bg-slate-50'
                }`}
                title={cat.name}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      )}

      {/* Grid */}
      <div className="p-4 h-[200px] overflow-y-auto custom-scrollbar">
        {filteredEmojis.length > 0 ? (
          <div className="grid grid-cols-6 gap-2">
            {filteredEmojis.map((emoji, idx) => (
              <button
                key={`${activeTab}-${idx}`}
                onClick={() => {
                  onSelect(emoji);
                  onClose();
                }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all hover:scale-110 hover:shadow-lg hover:shadow-amber-500/20 ${
                  isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-50'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
            <MoreHorizontal className={`w-8 h-8 mb-2 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {search ? 'No emojis found' : 'Select a category'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmojiPicker;
