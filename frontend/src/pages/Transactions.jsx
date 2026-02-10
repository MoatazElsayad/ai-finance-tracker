/**
 * Transactions Page - Enhanced Dark Mode Finance Tracker
 * Professional transaction management with advanced filtering and insights
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getTransactions, createTransaction, deleteTransaction, getCategories, createCategory, suggestEmoji } from '../api';
import { useTheme } from '../context/ThemeContext';
import { clearInsightsCache } from '../utils/cache';
import { useDebounce } from '../utils/debounce';
import { RefreshCw, TrendingUp, TrendingDown, Wallet, Hash, CirclePlus, Check, Trash2, Plus, CreditCard, BarChart3, DollarSign, Search, FileText, ArrowLeftRight, ArrowRight, ArrowLeft, Filter, ArrowDownAZ, SortDesc, Type, Sparkles } from 'lucide-react';
import CustomCategoryCreator from '../components/CustomCategoryCreator';

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showCustomCategoryCreator, setShowCustomCategoryCreator] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [viewMode, setViewMode] = useState('monthly'); // 'monthly', 'yearly', or 'overall'
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(new Set());
  const [showInitialSetup, setShowInitialSetup] = useState(false);
  const [initialCategories, setInitialCategories] = useState([
    { name: '', type: 'expense', icon: '🛍️' },
    { name: '', type: 'expense', icon: '🍔' },
    { name: '', type: 'income', icon: '💰' }
  ]);

  const handleInitialSetupSubmit = async () => {
    try {
      setLoading(true);
      // Filter out empty names and create categories
      const categoriesToCreate = initialCategories.filter(cat => cat.name.trim() !== '');
      
      for (const cat of categoriesToCreate) {
        await createCategory(cat.name.trim(), cat.type, cat.icon);
      }
      
      localStorage.setItem('initial_setup_completed', 'true');
      setShowInitialSetup(false);
      await loadData(1, false);
    } catch (error) {
      console.error(error);
      alert('Failed to save categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateInitialCategory = (index, field, value) => {
    const newCats = [...initialCategories];
    newCats[index][field] = value;
    setInitialCategories(newCats);
  };

  // AI Emoji suggestions for initial setup
  useEffect(() => {
    if (!showInitialSetup) return;

    const timers = initialCategories.map((cat, idx) => {
      if (!cat.name.trim() || cat.name.length < 2) return null;

      return setTimeout(async () => {
        try {
          const { suggestions } = await suggestEmoji(cat.name.trim(), cat.type || 'expense');
          if (suggestions && suggestions.length > 0) {
            updateInitialCategory(idx, 'icon', suggestions[0]);
          }
        } catch (err) {
          console.error('Emoji Suggestion failed for initial setup:', err);
        }
      }, 300);
    });

    return () => timers.forEach(t => t && clearTimeout(t));
  }, [showInitialSetup, initialCategories[0].name, initialCategories[1].name, initialCategories[2].name]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 1 });
  const [loadingMore, setLoadingMore] = useState(false);

  const toggleExpand = (id) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpanded(newExpanded);
  };

  // Form state
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isExpense, setIsExpense] = useState(true);

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300); // 300ms debounce
  const [filterType, setFilterType] = useState('all'); // 'all', 'income', 'expense'
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('date'); // 'date', 'amount', 'category'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'

  // Get date range based on view mode (using YYYY-MM-DD strings for safe comparison)
  const getDateRange = () => {
    const pad = (num) => String(num).padStart(2, '0');
    
    if (viewMode === 'monthly') {
      const start = `${selectedMonth.year}-${pad(selectedMonth.month)}-01`;
      const lastDay = new Date(selectedMonth.year, selectedMonth.month, 0).getDate();
      const end = `${selectedMonth.year}-${pad(selectedMonth.month)}-${pad(lastDay)}`;
      return { startDate: start, endDate: end };
    } else if (viewMode === 'yearly') {
      const start = `${selectedMonth.year}-01-01`;
      const end = `${selectedMonth.year}-12-31`;
      return { startDate: start, endDate: end };
    } else {
      return { startDate: '1900-01-01', endDate: '2100-12-31' };
    }
  };

  const changeMonth = (offset) => {
    let newMonth = selectedMonth.month + offset;
    let newYear = selectedMonth.year;
    
    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }
    
    setSelectedMonth({ year: newYear, month: newMonth });
  };

  const changeYear = (offset) => {
    setSelectedMonth(prev => ({ ...prev, year: prev.year + offset }));
  };

  // Load data function defined before use
  const loadData = useCallback(async (page = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      console.log(`[Transactions] Fetching transactions page ${page}...`);
      
      // Ensure api.js functions are used properly
      const [txnsData, cats] = await Promise.all([
        getTransactions(page, 50).catch(err => {
          console.error("[Transactions] Error in getTransactions:", err);
          return { transactions: [], pagination: { page: 1, limit: 50, total: 0, pages: 1 } };
        }),
        getCategories().catch(err => {
          console.error("[Transactions] Error in getCategories:", err);
          return [];
        })
      ]);
      
      console.log('[Transactions] Received data:', { 
        txnsCount: txnsData?.transactions?.length || (Array.isArray(txnsData) ? txnsData.length : 0), 
        catsCount: cats?.length 
      });

      // Robust parsing of transactions
      let txns = [];
      if (txnsData && txnsData.transactions) {
        txns = txnsData.transactions;
      } else if (Array.isArray(txnsData)) {
        txns = txnsData;
      }
      
      // Robust parsing of pagination
      const paginationData = (txnsData && txnsData.pagination) 
        ? txnsData.pagination 
        : { page: 1, limit: txns.length || 50, total: txns.length || 0, pages: 1 };
      
      if (append) {
        setTransactions(prev => [...(Array.isArray(prev) ? prev : []), ...txns]);
      } else {
        setTransactions(txns);
      }
      
      setPagination(paginationData);
      const fetchedCategories = Array.isArray(cats) ? cats : [];
      setCategories(fetchedCategories);

      // Trigger initial setup if user has only "Savings" category (which is system default)
      // or no categories at all. System categories usually have id 100 or user_id null.
      const userCategories = fetchedCategories.filter(c => c && c.user_id !== null && c.name !== 'Savings');
      if (userCategories.length === 0 && !localStorage.getItem('initial_setup_completed')) {
        setShowInitialSetup(true);
      }
    } catch (error) {
      console.error('[Transactions] Failed to load data:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    
    const initLoad = async () => {
      if (mounted) {
        await loadData(1, false);
      }
    };
    
    initLoad();

    // Listen for transaction-added event (e.g., from Receipt Upload)
    const handleTransactionAdded = () => {
      loadData(1, false);
    };
    window.addEventListener('transaction-added', handleTransactionAdded);
    
    return () => {
      mounted = false;
      window.removeEventListener('transaction-added', handleTransactionAdded);
    };
  }, [loadData]);
  
  // Load more transactions when scrolling (optional infinite scroll)
  const loadMore = useCallback(() => {
    if (!loadingMore && currentPage < pagination.pages) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      loadData(nextPage, true);
    }
  }, [currentPage, pagination.pages, loadingMore, loadData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const finalAmount = isExpense ? -Math.abs(parseFloat(amount)) : Math.abs(parseFloat(amount));
      const combinedDescription = notes && notes.trim()
        ? `${description.trim()} ||notes|| ${notes.trim()}`
        : description.trim();

      await createTransaction(parseInt(categoryId), finalAmount, combinedDescription, date);
      
      // Reload transactions from first page
      await loadData(1, false);
      
      // Reset form
      setCategoryId('');
      setAmount('');
      setDescription('');
      setNotes('');
      setDate(new Date().toISOString().split('T')[0]);
      setShowForm(false);

      // Clear AI insights cache for Budget page
      clearInsightsCache();
      
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;

    try {
      await deleteTransaction(id);
      setTransactions(transactions.filter(t => t.id !== id));
      // Clear AI insights cache for Budget page
      clearInsightsCache();
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (error) {
      alert(error.message);
    }
  };

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    try {
      if (!Array.isArray(transactions)) return [];
      let filtered = [...transactions];

      if (debouncedSearchQuery && typeof debouncedSearchQuery === 'string') {
        const query = debouncedSearchQuery.toLowerCase();
        filtered = filtered.filter(txn => {
          if (!txn) return false;
          const desc = (txn.description || "").toLowerCase();
          const cat = (txn.category_name || "").toLowerCase();
          return desc.includes(query) || cat.includes(query);
        });
      }

      if (filterType === 'income') {
        filtered = filtered.filter(t => t && t.amount > 0);
      } else if (filterType === 'expense') {
        filtered = filtered.filter(t => t && t.amount < 0);
      }

      if (filterCategory !== 'all') {
        filtered = filtered.filter(t => t && t.category_id === parseInt(filterCategory));
      }

      // Apply date range filter based on viewMode and selectedMonth
      const range = getDateRange();
      const startDate = range?.startDate || '1900-01-01';
      const endDate = range?.endDate || '2100-12-31';
      
      filtered = filtered.filter(t => {
        if (!t || !t.date) return false;
        try {
          const dateStr = typeof t.date === 'string' ? t.date.split('T')[0] : new Date(t.date).toISOString().split('T')[0];
          return dateStr >= startDate && dateStr <= endDate;
        } catch (e) {
          return false;
        }
      });

      // Sort transactions
      filtered.sort((a, b) => {
        if (!a || !b) return 0;
        let comparison = 0;
        try {
          if (sortBy === 'date') {
            const dateA = a.date ? new Date(a.date) : new Date(0);
            const dateB = b.date ? new Date(b.date) : new Date(0);
            comparison = dateA - dateB;
          } else if (sortBy === 'amount') {
            comparison = Math.abs(a.amount || 0) - Math.abs(b.amount || 0);
          } else if (sortBy === 'category') {
            comparison = (a.category_name || '').localeCompare(b.category_name || '');
          }
        } catch (e) {
          comparison = 0;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });

      return filtered;
    } catch (error) {
      console.error("[Transactions] Error in filteredTransactions useMemo:", error);
      return [];
    }
  }, [transactions, debouncedSearchQuery, filterType, filterCategory, viewMode, selectedMonth, sortBy, sortOrder]);

  // Calculate totals based on current filters
  const totals = useMemo(() => {
    try {
      if (!Array.isArray(filteredTransactions)) return { income: 0, expenses: 0, net: 0, count: 0 };
      const res = filteredTransactions.reduce((acc, t) => {
        if (!t || typeof t.amount !== 'number') return acc;
        if (t.amount > 0) acc.income += t.amount;
        else acc.expenses += Math.abs(t.amount);
        return acc;
      }, { income: 0, expenses: 0, net: 0, count: filteredTransactions.length });
      res.net = res.income - res.expenses;
      return res;
    } catch (error) {
      console.error("[Transactions] Error in totals useMemo:", error);
      return { income: 0, expenses: 0, net: 0, count: 0 };
    }
  }, [filteredTransactions]);

  // Display transactions
  const displayTransactions = useMemo(() => {
    try {
      if (!Array.isArray(filteredTransactions)) return [];
      // Always show all filtered transactions, the limit: 5 was confusing for users
      return filteredTransactions;
    } catch (error) {
      console.error("[Transactions] Error in displayTransactions useMemo:", error);
      return [];
    }
  }, [filteredTransactions]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    try {
      const groups = {};
      if (!Array.isArray(displayTransactions)) return groups;
      displayTransactions.forEach(txn => {
        if (!txn || !txn.date) return;
        try {
          const dateStr = typeof txn.date === 'string' ? txn.date.split('T')[0] : new Date(txn.date).toISOString().split('T')[0];
          const dateParts = dateStr.split('-');
          if (dateParts.length !== 3) return;
          const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
          if (isNaN(dateObj.getTime())) return;
          
          const dateKey = dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          if (!groups[dateKey]) {
            groups[dateKey] = [];
          }
          groups[dateKey].push(txn);
        } catch (e) {
          // Skip malformed dates
        }
      });
      return groups;
    } catch (error) {
      console.error("[Transactions] Error in groupedTransactions useMemo:", error);
      return {};
    }
  }, [displayTransactions]);

  // Filter categories by type
  const filteredCategories = Array.isArray(categories) ? categories.filter(
    cat => cat && (cat.type === (isExpense ? 'expense' : 'income') || (cat?.name && cat.name.toLowerCase().includes('savings')))
  ) : [];

  // Get recent categories (last 5 used)
  const recentCategories = useMemo(() => {
    if (!Array.isArray(transactions) || !Array.isArray(categories)) return [];
    const categoryCounts = {};
    transactions.slice(0, 20).forEach(txn => {
      if (txn && txn.category_id) {
        categoryCounts[txn.category_id] = (categoryCounts[txn.category_id] || 0) + 1;
      }
    });
    return Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => categories.find(c => c && c.id === parseInt(id)))
      .filter(Boolean);
  }, [transactions, categories]);

  // --- Initial Setup Modal ---
  const renderInitialSetupModal = () => {
    if (!showInitialSetup) return null;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 overflow-y-auto">
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-700" />
        
        <div className={`relative w-full max-w-2xl card-unified ${theme === 'dark' ? 'card-unified-dark border-slate-800' : 'card-unified-light border-slate-200'} shadow-2xl animate-in zoom-in slide-in-from-bottom-10 duration-500`}>
          <div className="p-8 md:p-12">
            <div className="flex flex-col items-center text-center mb-12">
              <div className="w-20 h-20 rounded-3xl bg-amber-500/10 flex items-center justify-center border-2 border-amber-500/20 mb-6 animate-bounce-slow">
                <Sparkles className="w-10 h-10 text-amber-500" />
              </div>
              <h1 className={`text-3xl md:text-4xl font-black tracking-tight mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Let's personalize your tracker
              </h1>
              <p className={`text-lg ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} max-w-md`}>
                Add the categories you spend on most to get started with your financial journey.
              </p>
            </div>

            <div className="space-y-6 mb-12">
              {initialCategories.map((cat, idx) => (
                <div key={idx} className={`p-6 rounded-3xl border-2 transition-all duration-300 ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'} focus-within:border-amber-500/50 group`}>
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg transition-transform group-hover:scale-110 duration-300 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
                        {cat.icon}
                      </div>
                      <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-amber-500 text-[10px] font-black text-white uppercase tracking-widest">
                        {cat.type}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <input
                        type="text"
                        value={cat.name}
                        onChange={(e) => updateInitialCategory(idx, 'name', e.target.value)}
                        placeholder={idx === 0 ? "e.g., Grocery" : idx === 1 ? "e.g., Transport" : "e.g., Salary"}
                        className={`w-full bg-transparent border-none outline-none text-xl font-bold p-0 ${theme === 'dark' ? 'text-white placeholder:text-slate-700' : 'text-slate-900 placeholder:text-slate-300'}`}
                      />
                      <div className="h-0.5 w-full bg-slate-800/50 mt-2 rounded-full overflow-hidden">
                        <div className={`h-full bg-amber-500 transition-all duration-500 ${cat.name ? 'w-full' : 'w-0'}`} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-4">
              <button
                onClick={handleInitialSetupSubmit}
                disabled={loading || initialCategories.filter(c => c.name.trim()).length < 3}
                className="w-full h-16 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black text-lg rounded-2xl transition-all shadow-xl shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-3"
              >
                {loading ? <RefreshCw className="w-6 h-6 animate-spin" /> : (
                  <>
                    Continue to add transaction
                    <ArrowRight className="w-6 h-6" />
                  </>
                )}
              </button>
              <p className={`text-center text-sm font-medium ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                Add at least 3 categories to continue
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center min-h-screen ${theme === 'dark' ? 'bg-[#0a0e27]' : 'bg-slate-50'}`}>
        <div className="text-center p-12 card-unified bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] shadow-2xl">
          <div className="relative mb-8">
            <div className="animate-spin rounded-full h-24 w-24 border-b-4 border-amber-500 mx-auto"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <CreditCard className="w-8 h-8 text-amber-500 animate-pulse" />
            </div>
          </div>
          <h2 className={`text-2xl font-black mb-2 uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Loading Transactions</h2>
          <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} font-bold`}>Crunching your financial data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-16 px-6 md:px-12 ${theme === 'dark' ? 'bg-[#0a0e27]' : 'bg-slate-50'} transition-colors duration-500`}>
      {renderInitialSetupModal()}
      <div className="max-w-[1400px] mx-auto w-full">
      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-20 right-4 z-50 animate-in fade-in slide-in-from-right-10 duration-500">
          <div className={`${theme === 'dark' ? 'bg-emerald-500/90' : 'bg-emerald-100'} backdrop-blur-sm ${theme === 'dark' ? 'text-white' : 'text-emerald-900'} px-8 py-4 rounded-[1.5rem] shadow-2xl flex items-center gap-4 border-2 ${theme === 'dark' ? 'border-emerald-400/30' : 'border-emerald-300'}`}>
            <div className="p-2 bg-white/20 rounded-lg">
              <Check className="w-6 h-6" strokeWidth={3} />
            </div>
            <span className="font-black uppercase tracking-[0.1em]">Transaction saved!</span>
          </div>
        </div>
      )}

      {/* Initial Setup Modal */}
      {renderInitialSetupModal()}

      {/* Header */}
      <div className="mb-12 animate-in fade-in slide-in-from-top-10 duration-700">
        <div className="flex items-center gap-6 mb-4">
          <div className="p-5 bg-amber-500 rounded-[2rem] shadow-2xl shadow-amber-500/20 rotate-3 group-hover:rotate-6 transition-transform duration-500">
            <CreditCard className="w-10 h-10 text-white" strokeWidth={2.5} />
          </div>
          <h1 className={`text-6xl md:text-7xl font-black tracking-[-0.04em] ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            Transactions
          </h1>
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <p className={`text-xl font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} tracking-tight max-w-2xl`}>
            Manage your income and expenses with AI-powered insights and professional tracking.
          </p>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${theme === 'dark' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-600'} animate-pulse`}>
            <Wallet className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Tip: Record savings as an "Expense" to grow your balance!</span>
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="mb-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8 animate-in fade-in slide-in-from-top-20 duration-700 delay-100">
        <div className={`p-2 rounded-[2rem] ${theme === 'dark' ? 'bg-slate-800/40' : 'bg-white'} border-2 ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200'} flex gap-2 w-fit shadow-xl shadow-black/5`}>
          {['monthly', 'yearly', 'overall'].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-10 py-4 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] transition-all duration-500 ${
                viewMode === mode
                  ? 'bg-amber-500 text-white shadow-xl shadow-amber-500/30 scale-105'
                  : `${theme === 'dark' ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-700/30' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
        
        {viewMode !== 'overall' && (
          <div className={`flex items-center gap-4 p-2 rounded-[2rem] ${theme === 'dark' ? 'bg-slate-800/40' : 'bg-white'} border-2 ${theme === 'dark' ? 'border-amber-500/20' : 'border-amber-500/10'} shadow-xl shadow-black/5`}>
            {viewMode === 'monthly' && (
              <>
                <button
                  onClick={() => changeMonth(-1)}
                  className={`p-4 rounded-[1.25rem] ${theme === 'dark' ? 'bg-slate-700/50 text-slate-400 hover:text-amber-400 hover:bg-slate-700' : 'bg-slate-50 text-slate-500 hover:text-amber-500 hover:bg-white'} transition-all shadow-sm group`}
                >
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                </button>
                <span className={`text-xl font-black tracking-[0.1em] uppercase min-w-[200px] text-center ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {new Date(selectedMonth.year, selectedMonth.month - 1, 1).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long'
                  })}
                </span>
                <button
                  onClick={() => changeMonth(1)}
                  className={`p-4 rounded-[1.25rem] ${theme === 'dark' ? 'bg-slate-700/50 text-slate-400 hover:text-amber-400 hover:bg-slate-700' : 'bg-slate-50 text-slate-500 hover:text-amber-500 hover:bg-white'} transition-all shadow-sm group`}
                >
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </>
            )}
            {viewMode === 'yearly' && (
              <>
                <button
                  onClick={() => changeYear(-1)}
                  className={`p-4 rounded-[1.25rem] ${theme === 'dark' ? 'bg-slate-700/50 text-slate-400 hover:text-amber-400 hover:bg-slate-700' : 'bg-slate-50 text-slate-500 hover:text-amber-500 hover:bg-white'} transition-all shadow-sm group`}
                >
                  <ArrowLeftRight className="w-5 h-5 rotate-180 group-hover:-translate-x-1 transition-transform" />
                </button>
                <span className={`text-xl font-black tracking-[0.1em] uppercase min-w-[120px] text-center ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {selectedMonth.year}
                </span>
                <button
                  onClick={() => changeYear(1)}
                  className={`p-4 rounded-[1.25rem] ${theme === 'dark' ? 'bg-slate-700/50 text-slate-400 hover:text-amber-400 hover:bg-slate-700' : 'bg-slate-50 text-slate-500 hover:text-amber-500 hover:bg-white'} transition-all shadow-sm group`}
                >
                  <ArrowLeftRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16 animate-in fade-in slide-in-from-top-20 duration-700 delay-200">
        {[
          { label: 'Total Income', value: totals.income, icon: TrendingUp, color: 'emerald' },
          { label: 'Total Expenses', value: totals.expenses, icon: TrendingDown, color: 'rose' },
          { label: 'Net Balance', value: totals.net, icon: Wallet, color: 'amber' },
          { label: 'Total Count', value: totals.count, icon: Hash, color: 'blue' }
        ].map((stat, i) => (
          <div key={i} className={`card-unified ${theme === 'dark' ? 'card-unified-dark' : 'card-unified-light'} p-8 group hover:-translate-y-2 transition-all duration-500`}>
            <div className="flex items-center justify-between mb-6">
              <span className={`text-xs font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{stat.label}</span>
              <div className={`p-4 rounded-2xl bg-${stat.color}-500/10 border-2 border-${stat.color}-500/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                <stat.icon className={`w-7 h-7 text-${stat.color}-500`} strokeWidth={2.5} />
              </div>
            </div>
            <p className={`text-4xl font-black tracking-tight ${
              stat.color === 'emerald' ? 'text-emerald-500' : 
              stat.color === 'rose' ? 'text-rose-500' : 
              stat.color === 'amber' ? 'text-amber-500' : 
              'text-blue-500'
            }`}>
              {stat.label === 'Total Count' ? stat.value : `EGP ${Math.abs(stat.value).toLocaleString()}`}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Add Button */}
      {!showForm && (
        <div className="mb-16 flex justify-center animate-in fade-in zoom-in duration-500 delay-300">
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary-unified !rounded-[2rem] !py-6 !px-12 shadow-2xl shadow-amber-500/20 hover:scale-[1.05] active:scale-95 transition-all duration-500 group flex items-center gap-4"
          >
            <div className="p-2 bg-white/20 rounded-xl group-hover:rotate-90 transition-transform duration-500">
              <CirclePlus className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-black tracking-[0.1em] uppercase">Record New Transaction</span>
          </button>
        </div>
      )}

      {/* Add Transaction Form */}
      {showForm && (
        <div className={`card-unified ${theme === 'dark' ? 'card-unified-dark' : 'card-unified-light'} p-10 mb-16 animate-in slide-in-from-top-10 duration-700 shadow-2xl relative overflow-hidden`}>
          {/* Decorative Background Element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-12 relative z-10">
            <h2 className={`text-3xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'} flex items-center gap-6`}>
              <div className="p-4 bg-amber-500 rounded-2xl shadow-xl shadow-amber-500/20 rotate-3">
                <Plus className="w-8 h-8 text-white" strokeWidth={3} />
              </div>
              <span className="uppercase tracking-[0.1em]">New Transaction</span>
            </h2>
            <button
              onClick={() => setShowForm(false)}
              className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-slate-800/50 hover:bg-rose-500/10 text-slate-500 hover:text-rose-500' : 'bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500'} transition-all group`}
            >
              <Trash2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
            <div className={`p-2 rounded-[2rem] ${theme === 'dark' ? 'bg-slate-900/50' : 'bg-slate-50'} border-2 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'} flex gap-2 w-fit mb-12 shadow-inner`}>
              <button
                type="button"
                onClick={() => setIsExpense(true)}
                className={`px-10 py-4 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] transition-all duration-500 ${
                  isExpense
                    ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/30 scale-105'
                    : `${theme === 'dark' ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setIsExpense(false)}
                className={`px-10 py-4 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] transition-all duration-500 ${
                  !isExpense
                    ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/30 scale-105'
                    : `${theme === 'dark' ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`
                }`}
              >
                Income
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              <div className="space-y-4">
                <label className={`block text-xs font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Amount (EGP)</label>
                <div className="relative group">
                  <span className={`absolute left-8 top-1/2 -translate-y-1/2 text-2xl font-black ${isExpense ? 'text-rose-500' : 'text-emerald-500'} transition-colors duration-500`}>EGP</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="input-unified w-full !pl-16 !text-2xl"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className={`block text-xs font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Category</label>
                <div className="flex gap-3">
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setCategoryId(id);
                      const selectedCat = categories.find(c => c.id === parseInt(id));
                      if (selectedCat && selectedCat.name.toLowerCase().includes('savings')) {
                        setIsExpense(true);
                      }
                    }}
                    className="input-unified flex-1"
                  >
                    <option value="">Select category</option>
                    {filteredCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowCustomCategoryCreator(!showCustomCategoryCreator)}
                    className={`p-4 rounded-[1.25rem] ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-amber-400' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-amber-600'} border-2 transition-all shadow-sm`}
                    title="Create custom category"
                  >
                    <CirclePlus className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className={`block text-xs font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input-unified w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className={`block text-xs font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Description</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-unified w-full"
                  placeholder="What was this for?"
                />
              </div>
              <div className="space-y-4">
                <label className={`block text-xs font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Notes (Optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-unified w-full"
                  placeholder="Additional details..."
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary-unified w-full !rounded-[2rem] !py-6 shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 group"
            >
              <div className="p-2 bg-white/20 rounded-xl group-hover:scale-110 transition-transform">
                <Check className="w-7 h-7 text-white" strokeWidth={3} />
              </div>
              <span className="text-xl font-black tracking-[0.1em] uppercase">Complete Transaction</span>
            </button>
          </form>
        </div>
      )}

      {/* Custom Category Creator Modal */}
      <CustomCategoryCreator
        isOpen={showCustomCategoryCreator}
        onClose={() => setShowCustomCategoryCreator(false)}
        onSuccess={() => {
          setShowCustomCategoryCreator(false);
          loadData();
        }}
        type={isExpense ? 'expense' : 'income'}
      />

      {/* Transactions History Card */}
      <div className={`card-unified ${theme === 'dark' ? 'card-unified-dark' : 'card-unified-light'} overflow-hidden mb-16 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-500 shadow-2xl relative`}>
        {/* Integrated Minimal Filter */}
        <div className={`px-10 py-8 border-b-2 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'} flex flex-col lg:flex-row items-center gap-8 ${theme === 'dark' ? 'bg-slate-800/20' : 'bg-slate-50/50'} backdrop-blur-md`}>
          {/* Search with Aa icon */}
          <div className="flex-1 w-full relative group">
            <Type className={`absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} group-focus-within:text-amber-500 transition-all duration-300`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search history..."
              className={`w-full pl-16 pr-6 py-4 rounded-2xl border-2 transition-all outline-none text-sm font-bold ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800 text-white focus:border-amber-500/50' : 'bg-white border-slate-200 text-slate-900 focus:border-amber-500/50'}`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            {/* Type Filter */}
            <div className="relative group flex-1 md:flex-none">
              <Filter className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} pointer-events-none`} />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className={`w-full pl-11 pr-10 py-4 rounded-2xl border-2 appearance-none text-xs font-black uppercase tracking-widest outline-none cursor-pointer transition-all ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
              >
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            {/* Sort By with A-Z icon */}
            <div className="relative group flex-1 md:flex-none">
              <ArrowDownAZ className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-amber-500' : 'text-amber-600'} pointer-events-none`} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`w-full pl-12 pr-10 py-4 rounded-2xl border-2 appearance-none text-xs font-black uppercase tracking-widest outline-none cursor-pointer transition-all ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
              >
                <option value="date">Date</option>
                <option value="amount">Amount</option>
                <option value="category">Category</option>
              </select>
            </div>

            {/* Sort Order with Descending icon */}
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className={`p-4 rounded-2xl border-2 transition-all group ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              <SortDesc className={`w-6 h-6 transition-all duration-500 ${sortOrder === 'asc' ? 'rotate-180 text-amber-500' : 'text-amber-500'}`} />
            </button>
          </div>
        </div>
        <div className={`overflow-x-auto transition-all duration-700 ${!showAllTransactions ? 'max-h-[600px]' : 'max-h-[1200px]'} overflow-y-auto custom-scrollbar`}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`${theme === 'dark' ? 'bg-slate-800/40' : 'bg-slate-50'} border-b-2 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'} sticky top-0 z-20 backdrop-blur-md`}>
                <th className="px-10 py-8 text-xs font-black uppercase tracking-[0.2em] text-slate-500">Transaction</th>
                <th className="px-10 py-8 text-xs font-black uppercase tracking-[0.2em] text-slate-500">Category</th>
                <th className="px-10 py-8 text-xs font-black uppercase tracking-[0.2em] text-slate-500">Date</th>
                <th className="px-10 py-8 text-xs font-black uppercase tracking-[0.2em] text-slate-500 text-right">Amount</th>
                <th className="px-10 py-8 text-xs font-black uppercase tracking-[0.2em] text-slate-500 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-800/5">
              {groupedTransactions && Object.entries(groupedTransactions).length > 0 ? (
                Object.entries(groupedTransactions).map(([dateLabel, txns]) => (
                  <React.Fragment key={dateLabel}>
                    <tr className={`${theme === 'dark' ? 'bg-slate-800/20' : 'bg-slate-100/30'} backdrop-blur-sm sticky top-[84px] z-10`}>
                      <td colSpan="5" className="px-10 py-4 border-y border-slate-800/10">
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                          <span className={`text-sm font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`}>
                            {dateLabel}
                          </span>
                          <div className={`ml-auto px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.1em] ${theme === 'dark' ? 'bg-slate-800 text-slate-500' : 'bg-slate-200 text-slate-500'}`}>
                            {txns?.length || 0} {txns?.length === 1 ? 'Transaction' : 'Transactions'}
                          </div>
                        </div>
                      </td>
                    </tr>
                    {Array.isArray(txns) && txns.map((txn) => {
                    const description = txn.description || '';
                    const isNote = description.includes('||notes||');
                    const [desc, note] = isNote ? description.split('||notes||') : [description, ''];
                    const isExpanded = expanded.has(txn.id);
                    const isSavings = txn.category_name && txn.category_name.toLowerCase().includes('savings');
                    
                    return (
                      <tr 
                        key={txn.id} 
                        onClick={() => toggleExpand(txn.id)}
                        className={`${theme === 'dark' ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/50'} transition-all group border-b border-slate-800/5 cursor-pointer ${isExpanded ? (theme === 'dark' ? 'bg-slate-800/20' : 'bg-slate-100/50') : ''} ${isSavings ? (theme === 'dark' ? 'bg-blue-500/5 border-l-4 border-l-blue-500' : 'bg-blue-50/50 border-l-4 border-l-blue-500') : ''}`}
                      >
                        <td className="px-10 py-8">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                              <span className={`font-black text-xl ${theme === 'dark' ? 'text-white' : 'text-slate-900'} group-hover:text-amber-500 transition-colors duration-300 ${isSavings ? '!text-blue-500' : ''}`}>{desc}</span>
                              {note && (
                                <div className={`p-1 rounded-md ${isExpanded ? 'bg-amber-500 text-white' : 'bg-slate-500/10 text-slate-500'} transition-all`}>
                                  <FileText className="w-3.5 h-3.5" />
                                </div>
                              )}
                            </div>
                            {note && isExpanded && (
                              <div className={`mt-3 p-4 rounded-2xl ${theme === 'dark' ? 'bg-slate-800/50 text-slate-300' : 'bg-white text-slate-600'} border ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'} text-sm font-bold animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm`}>
                                <p className="flex items-center gap-2 mb-1 opacity-50 text-[10px] uppercase tracking-[0.2em]">
                                  <FileText className="w-3 h-3" />
                                  Transaction Note
                                </p>
                                {note}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <span className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl text-sm font-black ${
                            isSavings 
                              ? (theme === 'dark' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-blue-500/10 text-blue-600 border-blue-500/20')
                              : (theme === 'dark' ? 'bg-slate-800/50 text-slate-300 border-slate-700/50' : 'bg-white text-slate-600 border-slate-100')
                          } border-2 shadow-sm group-hover:border-amber-500/30 transition-all duration-300`}>
                            <span className="text-xl">{txn.category_icon}</span>
                            <span className="uppercase tracking-[0.1em]">{txn.category_name}</span>
                          </span>
                        </td>
                        <td className="px-10 py-8">
                          <span className={`font-black uppercase tracking-[0.1em] text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                            {(() => {
                              try {
                                if (!txn.date || typeof txn.date !== 'string') return 'No Date';
                                const dateParts = txn.date.split('T')[0].split('-');
                                if (dateParts.length !== 3) return txn.date;
                                const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
                                if (isNaN(dateObj.getTime())) return txn.date;
                                return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                              } catch (e) {
                                console.error("Error formatting date in table:", e, txn);
                                return 'Invalid Date';
                              }
                            })()}
                          </span>
                        </td>
                        <td className={`px-10 py-8 text-right font-black text-2xl ${
                          isSavings 
                            ? 'text-blue-500' 
                            : ((txn.amount || 0) > 0 ? 'text-emerald-500' : 'text-rose-500')
                        }`}>
                          <div className="flex items-center justify-end gap-2">
                            <span>{(txn.amount || 0) > 0 ? '+' : '-'}</span>
                            <span>EGP {Math.abs(txn.amount || 0).toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="px-10 py-8 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(txn.id);
                            }}
                            className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white' : 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white'} transition-all shadow-sm group/btn hover:scale-110 active:scale-95`}
                          >
                            <Trash2 className="w-6 h-6 group-hover/btn:rotate-12 transition-transform" />
                          </button>
                        </td>
                      </tr>
                    );
                    })}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-10 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-50">
                      <Hash className="w-12 h-12" />
                      <p className="text-xl font-bold uppercase tracking-widest">No transactions found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {!showAllTransactions && filteredTransactions.length > displayTransactions.length && (
          <div className={`absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t ${theme === 'dark' ? 'from-[#0a0e27] via-[#0a0e27]/80' : 'from-slate-50 via-slate-50/80'} to-transparent z-20 flex items-end justify-center pb-10`}>
            <button
              onClick={() => setShowAllTransactions(true)}
              className={`px-12 py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] transition-all duration-500 flex items-center gap-4 ${
                theme === 'dark' 
                  ? 'bg-amber-500 text-white shadow-[0_20px_50px_rgba(245,158,11,0.3)] hover:scale-105 active:scale-95' 
                  : 'bg-amber-500 text-white shadow-[0_20px_50px_rgba(245,158,11,0.2)] hover:scale-105 active:scale-95'
              }`}
            >
              <span>View All History</span>
              <div className="p-2 bg-white/20 rounded-lg">
                <Plus className="w-4 h-4" strokeWidth={3} />
              </div>
            </button>
          </div>
        )}

        {showAllTransactions && filteredTransactions.length > 5 && (
          <div className={`p-10 border-t-2 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'} text-center ${theme === 'dark' ? 'bg-slate-800/20' : 'bg-slate-50/50'}`}>
            <button
              onClick={() => setShowAllTransactions(false)}
              className={`px-10 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all duration-500 ${
                theme === 'dark' ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-900'
              }`}
            >
              Minimize History
            </button>
          </div>
        )}

        {filteredTransactions.length === 0 && (
          <div className="p-24 text-center">
            <div className={`w-32 h-32 rounded-[3rem] ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50'} flex items-center justify-center mx-auto mb-10 rotate-12 shadow-inner border-2 ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200'}`}>
              <Search className="w-16 h-16 text-slate-500/50" />
            </div>
            <h3 className={`text-3xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-4 uppercase tracking-[0.1em]`}>No Transactions Found</h3>
            <p className={`text-xl font-bold ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} max-w-md mx-auto`}>
              Try adjusting your search or filters to find what you're looking for.
            </p>
          </div>
        )}
      </div>
    </div>
  </div>
);
}

export default Transactions;
