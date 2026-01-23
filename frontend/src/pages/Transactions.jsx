/**
 * Transactions Page - Enhanced Dark Mode Finance Tracker
 * Professional transaction management with advanced filtering and insights
 */
import { useState, useEffect, useMemo } from 'react';
import { getTransactions, createTransaction, deleteTransaction, getCategories } from '../api';
import { useTheme } from '../context/ThemeContext';
import { clearInsightsCache } from '../utils/cache';
import { RefreshCw, TrendingUp, TrendingDown, Wallet, Hash, CirclePlus, Check, Trash2, Plus, CreditCard, BarChart3, DollarSign, Search, FileText, ArrowLeftRight } from 'lucide-react';
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
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(new Set());

  // Form state
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isExpense, setIsExpense] = useState(true);

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'income', 'expense'
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('date'); // 'date', 'amount', 'category'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [dateRange, setDateRange] = useState('all'); // 'all', 'today', 'week', 'month', 'year'

  // Get date range based on view mode
  const getDateRange = () => {
    if (viewMode === 'monthly') {
      const start = new Date(selectedMonth.year, selectedMonth.month, 1);
      const end = new Date(selectedMonth.year, selectedMonth.month + 1, 0);
      return { startDate: start, endDate: end };
    } else if (viewMode === 'yearly') {
      const start = new Date(selectedMonth.year, 0, 1);
      const end = new Date(selectedMonth.year, 11, 31);
      return { startDate: start, endDate: end };
    } else {
      return { startDate: new Date(1900, 0, 1), endDate: new Date(2100, 11, 31) };
    }
  };

  const changeMonth = (offset) => {
    const newDate = new Date(selectedMonth.year, selectedMonth.month + offset, 1);
    setSelectedMonth({ year: newDate.getFullYear(), month: newDate.getMonth() });
  };

  const changeYear = (offset) => {
    setSelectedMonth(prev => ({ ...prev, year: prev.year + offset }));
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [txns, cats] = await Promise.all([
        getTransactions(),
        getCategories()
      ]);
      
      setTransactions(txns);
      setCategories(cats);
    } catch (error) {
      console.error('Failed to load:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const finalAmount = isExpense ? -Math.abs(parseFloat(amount)) : Math.abs(parseFloat(amount));
      const combinedDescription = notes && notes.trim()
        ? `${description.trim()} ||notes|| ${notes.trim()}`
        : description.trim();

      await createTransaction(parseInt(categoryId), finalAmount, combinedDescription, date);
      
      const txns = await getTransactions();
      setTransactions(txns);
      
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

  // Calculate totals
  const totals = useMemo(() => {
    const { startDate, endDate } = getDateRange();
    
    const periodTransactions = transactions.filter(t => {
      const txnDate = new Date(t.date);
      return txnDate >= startDate && txnDate <= endDate;
    });
    
    const income = periodTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = Math.abs(
      periodTransactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0)
    );

    return {
      income,
      expenses,
      net: income - expenses,
      count: periodTransactions.length
    };
  }, [transactions, viewMode, selectedMonth]);

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(txn =>
        txn.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        txn.category_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Type filter
    if (filterType === 'income') {
      filtered = filtered.filter(t => t.amount > 0);
    } else if (filterType === 'expense') {
      filtered = filtered.filter(t => t.amount < 0);
    }

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(t => t.category_id === parseInt(filterCategory));
    }

    // Date range filter
    const now = new Date();
    if (dateRange === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      filtered = filtered.filter(t => new Date(t.date) >= today);
    } else if (dateRange === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(t => new Date(t.date) >= weekAgo);
    } else if (dateRange === 'month') {
      const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
      filtered = filtered.filter(t => new Date(t.date) >= monthAgo);
    } else if (dateRange === 'year') {
      const yearAgo = new Date(now.getFullYear(), 0, 1);
      filtered = filtered.filter(t => new Date(t.date) >= yearAgo);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'date') {
        comparison = new Date(a.date) - new Date(b.date);
      } else if (sortBy === 'amount') {
        comparison = Math.abs(a.amount) - Math.abs(b.amount);
      } else if (sortBy === 'category') {
        comparison = a.category_name.localeCompare(b.category_name);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [transactions, searchQuery, filterType, filterCategory, dateRange, sortBy, sortOrder]);

  // Filter to last 3 days if not showing all
  const displayTransactions = useMemo(() => {
    if (showAllTransactions) return filteredTransactions;
    
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    return filteredTransactions.filter(txn => new Date(txn.date) >= threeDaysAgo);
  }, [filteredTransactions, showAllTransactions]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups = {};
    displayTransactions.forEach(txn => {
      const dateKey = new Date(txn.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(txn);
    });
    return groups;
  }, [displayTransactions]);

  // Filter categories by type
  const filteredCategories = categories.filter(
    cat => cat.type === (isExpense ? 'expense' : 'income')
  );

  // Get recent categories (last 5 used)
  const recentCategories = useMemo(() => {
    const categoryCounts = {};
    transactions.slice(0, 20).forEach(txn => {
      if (txn.category_id) {
        categoryCounts[txn.category_id] = (categoryCounts[txn.category_id] || 0) + 1;
      }
    });
    return Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => categories.find(c => c.id === parseInt(id)))
      .filter(Boolean);
  }, [transactions, categories]);

  if (loading) {
    return (
      <div className={`flex justify-center items-center min-h-screen ${theme === 'dark' ? 'bg-[#0a0e27]' : 'bg-slate-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-400 border-t-transparent mx-auto mb-4"></div>
          <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} text-lg`}>Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen px-6 py-8 ${theme === 'dark' ? 'bg-[#0a0e27]' : 'bg-slate-50'}`}>
      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in">
          <div className={`${theme === 'dark' ? 'bg-green-500/90' : 'bg-green-100'} backdrop-blur-sm ${theme === 'dark' ? 'text-white' : 'text-green-900'} px-6 py-3 rounded-xl shadow-xl flex items-center gap-2 ${theme === 'dark' ? 'border-green-400/30' : 'border-green-300'} border`}>
            <Check className="w-8 h-8" strokeWidth={1.8} />
            <span className="font-medium">Transaction saved successfully!</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-2 flex items-center gap-3`}>
          <div className={`p-2 ${theme === 'dark' ? 'bg-amber-400/20' : 'bg-amber-100'} rounded-lg`}>
            <CreditCard className={`w-8 h-8 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`} />
          </div>
          Transactions
        </h1>
        <p className={`text-lg ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Manage your income and expenses</p>
      </div>

      {/* View Mode Toggle */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('monthly')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              viewMode === 'monthly'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 shadow-lg scale-105'
                : `${theme === 'dark' ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-700' : 'bg-slate-200/50 text-slate-700 hover:bg-slate-300'}`
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setViewMode('yearly')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              viewMode === 'yearly'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 shadow-lg scale-105'
                : `${theme === 'dark' ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-700' : 'bg-slate-200/50 text-slate-700 hover:bg-slate-300'}`
            }`}
          >
            Yearly
          </button>
          <button
            onClick={() => setViewMode('overall')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              viewMode === 'overall'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 shadow-lg scale-105'
                : `${theme === 'dark' ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-700' : 'bg-slate-200/50 text-slate-700 hover:bg-slate-300'}`
            }`}
          >
            Overall
          </button>
        </div>
        
        {viewMode !== 'overall' && (
          <div className="flex items-center gap-3 ml-auto">
            {viewMode === 'monthly' && (
              <>
                <button
                  onClick={() => changeMonth(-1)}
                  className="px-4 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-all"
                >
                  ← Previous
                </button>
                <span className="text-slate-300 font-semibold min-w-[180px] text-center">
                  {new Date(selectedMonth.year, selectedMonth.month, 1).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long'
                  })}
                </span>
                <button
                  onClick={() => changeMonth(1)}
                  className="px-4 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-all"
                >
                  Next →
                </button>
              </>
            )}
            {viewMode === 'yearly' && (
              <>
                <button
                  onClick={() => changeYear(-1)}
                  className="px-4 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-all"
                >
                  ← Previous
                </button>
                <span className="text-slate-300 font-semibold min-w-[100px] text-center">
                  {selectedMonth.year}
                </span>
                <button
                  onClick={() => changeYear(1)}
                  className="px-4 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-all"
                >
                  Next →
                </button>
              </>
            )}
          </div>
        )}
        
        {viewMode === 'overall' && (
          <span className="ml-auto text-slate-300 font-semibold">All Time Data</span>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-gradient-to-br from-white to-slate-50'} rounded-xl shadow-xl p-6 ${theme === 'dark' ? 'border-slate-700 hover:border-green-500/50' : 'border-slate-200 hover:border-green-400/50'} border transition-all`}>
          <div className="flex items-center justify-between mb-4">
            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wide`}>Total Income</span>
            <div className={`w-12 h-12 ${theme === 'dark' ? 'bg-green-500/20' : 'bg-green-100'} rounded-lg flex items-center justify-center ${theme === 'dark' ? 'border-green-500/30' : 'border-green-300'} border`}>
              <TrendingUp className={`w-6 h-6 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
            </div>
          </div>
          <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
            ${totals.income.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-gradient-to-br from-white to-slate-50'} rounded-xl shadow-xl p-6 ${theme === 'dark' ? 'border-slate-700 hover:border-red-500/50' : 'border-slate-200 hover:border-red-400/50'} border transition-all`}>
          <div className="flex items-center justify-between mb-4">
            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wide`}>Total Expenses</span>
            <div className={`w-12 h-12 ${theme === 'dark' ? 'bg-red-500/20' : 'bg-red-100'} rounded-lg flex items-center justify-center ${theme === 'dark' ? 'border-red-500/30' : 'border-red-300'} border`}>
              <TrendingDown className={`w-6 h-6 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />
            </div>
          </div>
          <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
            ${totals.expenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-gradient-to-br from-white to-slate-50'} rounded-xl shadow-xl p-6 ${theme === 'dark' ? 'border-slate-700 hover:border-amber-500/50' : 'border-slate-200 hover:border-amber-400/50'} border transition-all`}>
          <div className="flex items-center justify-between mb-4">
            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wide`}>Net Balance</span>
            <div className={`w-12 h-12 ${theme === 'dark' ? 'bg-amber-500/20' : 'bg-amber-100'} rounded-lg flex items-center justify-center ${theme === 'dark' ? 'border-amber-500/30' : 'border-amber-300'} border`}>
              <Wallet className={`w-7 h-7 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`} strokeWidth={2} />
            </div>
          </div>
          <p className={`text-3xl font-bold ${totals.net >= 0 ? (theme === 'dark' ? 'text-amber-400' : 'text-amber-600') : (theme === 'dark' ? 'text-red-400' : 'text-red-600')}`}>
            ${Math.abs(totals.net).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-gradient-to-br from-white to-slate-50'} rounded-xl shadow-xl p-6 ${theme === 'dark' ? 'border-slate-700 hover:border-blue-500/50' : 'border-slate-200 hover:border-blue-400/50'} border transition-all`}>
          <div className="flex items-center justify-between mb-4">
            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wide`}>Total Count</span>
            <div className={`w-12 h-12 ${theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'} rounded-lg flex items-center justify-center ${theme === 'dark' ? 'border-blue-500/30' : 'border-blue-300'} border`}>
              <Hash className={`w-6 h-6 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
          </div>
          <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>{totals.count}</p>
        </div>
      </div>

      {/* Quick Add Button */}
      {!showForm && (
        <div className="mb-6">
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center gap-2"
          >
            <CirclePlus className="w-7 h-7" strokeWidth={2} />
            Add New Transaction
          </button>
        </div>
      )}

      {/* Add Transaction Form */}
      {showForm && (
        <div className={`${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white/50 border-slate-200'} backdrop-blur-sm rounded-xl shadow-xl p-6 border mb-8`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
              <span className="text-amber-400">➕</span>
              Add New Transaction
            </h2>
            <button
              onClick={() => setShowForm(false)}
              className={`${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'} transition-colors`}
            >
              ✕
            </button>
          </div>
          <div className={`mb-4 rounded-xl border ${theme === 'dark' ? 'border-slate-700 bg-slate-900/30' : 'border-slate-300 bg-slate-100/40'} px-4 py-3 flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              {(() => {
                const selected = categories.find(c => c.id === parseInt(categoryId));
                if (!selected) return <span className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} text-sm`}>No category selected</span>;
                const isImage = typeof selected.icon === 'string' && (selected.icon.startsWith('http') || selected.icon.startsWith('data:'));
                return (
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center border border-slate-600/40">
                      {isImage ? (
                        <img src={selected.icon} alt={selected.name} className="w-7 h-7 rounded-md object-cover" />
                      ) : (
                        <span className="text-2xl">{selected.icon}</span>
                      )}
                    </div>
                    <span className={`text-sm ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'} font-semibold`}>{selected.name}</span>
                  </div>
                );
              })()}
            </div>
            <div className="flex items-center gap-4">
              <div className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                {amount ? `${isExpense ? '-' : '+'}$${Math.abs(parseFloat(amount)).toFixed(2)}` : '$0.00'}
              </div>
              <div className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                {date}
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type Toggle */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">Transaction Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsExpense(true);
                    setCategoryId('');
                  }}
                  className={`p-4 rounded-xl font-semibold transition-all border-2 ${
                    isExpense
                      ? 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-400 border-red-500/50 shadow-lg scale-105'
                      : `${theme === 'dark' ? 'bg-slate-700/50 text-slate-400 border-slate-600 hover:bg-slate-700' : 'bg-slate-200/50 text-slate-600 border-slate-300 hover:bg-slate-300'}`
                  }`}
                >
                  <span className="text-2xl mb-2 block">💸</span>
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsExpense(false);
                    setCategoryId('');
                  }}
                  className={`p-4 rounded-xl font-semibold transition-all border-2 ${
                    !isExpense
                      ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/50 shadow-lg scale-105'
                      : `${theme === 'dark' ? 'bg-slate-700/50 text-slate-400 border-slate-600 hover:bg-slate-700' : 'bg-slate-200/50 text-slate-600 border-slate-300 hover:bg-slate-300'}`
                  }`}
                >
                  <DollarSign className="w-6 h-6 mb-2 mx-auto" />
                  Income
                </button>
              </div>
            </div>

            {/* Quick Category Selection */}
            {recentCategories.length > 0 && (
              <div>
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} mb-2`}>Quick Select (Recent)</label>
                <div className="flex flex-wrap gap-2">
                  {recentCategories.map(cat => (
                    cat.type === (isExpense ? 'expense' : 'income') && (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategoryId(cat.id.toString())}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                          categoryId === cat.id.toString()
                            ? 'bg-amber-400/20 text-amber-400 border-amber-400/50'
                            : `${theme === 'dark' ? 'bg-slate-700/50 text-slate-300 border-slate-600 hover:bg-slate-700' : 'bg-slate-200/50 text-slate-700 border-slate-300 hover:bg-slate-200'}`
                        }`}
                      >
                        {cat.icon} {cat.name}
                      </button>
                    )
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    Category
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCustomCategoryCreator(true)}
                    className={`px-2 py-1 text-xs rounded-lg flex items-center gap-1 ${
                      theme === 'dark'
                        ? 'bg-slate-700/50 text-slate-300 border border-slate-600 hover:bg-slate-700'
                        : 'bg-slate-200/50 text-slate-700 border border-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <Plus className="w-3 h-3" />
                    New
                  </button>
                </div>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className={`w-full px-4 py-3 ${theme === 'dark' ? 'bg-slate-700/50 border-slate-600 text-white' : 'bg-slate-100/50 border-slate-300 text-slate-900'} border-2 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all`}
                  required
                >
                  <option value="">Select category</option>
                  {filteredCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
                  Amount
                </label>
                <div className="relative">
                  <span className={`absolute left-4 top-3 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} font-semibold`}>$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={`w-full pl-8 pr-4 py-3 ${theme === 'dark' ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-500' : 'bg-slate-100/50 border-slate-300 text-slate-900 placeholder-slate-500'} border-2 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all`}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Description */}
              <div>
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full px-4 py-3 ${theme === 'dark' ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-500' : 'bg-slate-100/50 border-slate-300 text-slate-900 placeholder-slate-500'} border-2 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all`}
                  placeholder="e.g., Grocery shopping"
                  required
                />
              </div>

              {/* Date */}
              <div>
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`w-full px-4 py-3 ${theme === 'dark' ? 'bg-slate-700/50 border-slate-600 text-white' : 'bg-slate-100/50 border-slate-300 text-slate-900'} border-2 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all`}
                  required
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Add details you want to remember..."
                className={`w-full px-4 py-3 ${theme === 'dark' ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-500' : 'bg-slate-100/50 border-slate-300 text-slate-900 placeholder-slate-500'} border-2 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all`}
              />
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 rounded-xl font-semibold hover:shadow-xl transition-all hover:scale-105"
              >
                ✓ Add Transaction
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className={`px-6 py-3 ${theme === 'dark' ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-700' : 'bg-slate-200/50 text-slate-700 hover:bg-slate-200'} rounded-xl font-medium transition-all`}
              >
                Cancel
              </button>
              <span className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Tip: use “New” near Category to add custom ones
              </span>
            </div>
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

      {/* Filters and Search */}
      <div className={`${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white/50 border-slate-200'} backdrop-blur-sm rounded-xl shadow-xl p-6 border mb-8`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} mb-2`}>Search</label>
            <div className="relative">
              <Search className={`absolute left-3 top-2.5 w-5 h-5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 ${theme === 'dark' ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-500' : 'bg-slate-100/50 border-slate-300 text-slate-900 placeholder-slate-500'} border-2 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all`}
                placeholder="Search transactions..."
              />
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} mb-2`}>Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`w-full px-4 py-2 ${theme === 'dark' ? 'bg-slate-700/50 border-slate-600 text-white' : 'bg-slate-100/50 border-slate-300 text-slate-900'} border-2 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all`}
            >
              <option value="all">All</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} mb-2`}>Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className={`w-full px-4 py-2 ${theme === 'dark' ? 'bg-slate-700/50 border-slate-600 text-white' : 'bg-slate-100/50 border-slate-300 text-slate-900'} border-2 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all`}
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} mb-2`}>Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className={`w-full px-4 py-2 ${theme === 'dark' ? 'bg-slate-700/50 border-slate-600 text-white' : 'bg-slate-100/50 border-slate-300 text-slate-900'} border-2 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all`}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>

        {/* Sort Options */}
        <div className="mt-4 flex flex-wrap gap-4 items-end">
          <div>
            <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} mb-2`}>Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`px-4 py-2 ${theme === 'dark' ? 'bg-slate-700/50 border-slate-600 text-white' : 'bg-slate-100/50 border-slate-300 text-slate-900'} border-2 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all`}
            >
              <option value="date">Date</option>
              <option value="amount">Amount</option>
              <option value="category">Category</option>
            </select>
          </div>
          <div>
            <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} mb-2`}>Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className={`px-4 py-2 ${theme === 'dark' ? 'bg-slate-700/50 border-slate-600 text-white' : 'bg-slate-100/50 border-slate-300 text-slate-900'} border-2 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all`}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
          <div className="ml-auto">
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterType('all');
                setFilterCategory('all');
                setDateRange('all');
                setSortBy('date');
                setSortOrder('desc');
              }}
              className={`px-4 py-2 ${theme === 'dark' ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-700' : 'bg-slate-200/50 text-slate-700 hover:bg-slate-200'} rounded-lg transition-all text-sm font-medium flex gap-2`}
            >
              <RefreshCw className="w-5 h-5" strokeWidth={2} /> Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className={`${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white/50 border-slate-200'} backdrop-blur-sm rounded-xl shadow-xl border overflow-hidden`}>
        <div className={`p-6 ${theme === 'dark' ? 'bg-slate-700/30 border-b border-slate-600' : 'bg-slate-100/30 border-b border-slate-300'}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
              <ArrowLeftRight className="w-7 h-7 text-amber-400" strokeWidth={1.8} />
              Transactions ({displayTransactions.length})
            </h2>
            <button
              onClick={() => setShowAllTransactions(!showAllTransactions)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                showAllTransactions
                  ? 'bg-amber-400/20 text-amber-400 border border-amber-400/50'
                  : `${theme === 'dark' ? 'bg-slate-700/50 text-slate-300 border border-slate-600 hover:bg-slate-700' : 'bg-slate-200/50 text-slate-700 border border-slate-300 hover:bg-slate-200'}`
              }`}
            >
              {showAllTransactions ? 'Show Last 3 Days' : 'View All'}
            </button>
          </div>
        </div>

        {displayTransactions.length === 0 ? (
          <div className="text-center py-16">
            <div className={`inline-block p-6 ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-200/50'} rounded-full mb-4`}>
              <FileText className={`w-12 h-12 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`} />
            </div>
            <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} text-lg mb-2`}>No transactions found</p>
            <p className={`${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'} text-sm`}>
              {searchQuery || filterType !== 'all' || filterCategory !== 'all' || dateRange !== 'all'
                ? 'Try adjusting your filters'
                : 'Add your first transaction above to get started!'}
            </p>
          </div>
        ) : (
          <div className={`divide-y ${theme === 'dark' ? 'divide-slate-700' : 'divide-slate-200'}`}>
            {Object.entries(groupedTransactions).map(([date, txns]) => (
              <div key={date}>
                <div className={`px-6 py-3 ${theme === 'dark' ? 'bg-slate-700/20 border-b border-slate-600' : 'bg-slate-100/30 border-b border-slate-300'}`}>
                  <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wide">
                    {date}
                  </h3>
                  <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} mt-1`}>
                    {txns.length} transaction{txns.length !== 1 ? 's' : ''} • 
                    Total: ${txns.reduce((sum, t) => sum + Math.abs(t.amount), 0).toFixed(2)}
                  </p>
                </div>
                {txns.map((txn) => (
                  <div
                    key={txn.id}
                    className={`px-6 py-4 transition-all ${theme === 'dark' ? 'hover:bg-slate-700/20 border-b border-slate-700/50 last:border-b-0' : 'hover:bg-slate-100/20 border-b border-slate-200/50 last:border-b-0'}`}
                  >
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => {
                        setExpanded(prev => {
                          const next = new Set(prev);
                          if (next.has(txn.id)) next.delete(txn.id); else next.add(txn.id);
                          return next;
                        });
                      }}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                          txn.amount > 0 
                            ? 'bg-green-500/20 border border-green-500/30' 
                            : 'bg-red-500/20 border border-red-500/30'
                        }`}>
                          {typeof txn.category_icon === 'string' && (txn.category_icon.startsWith('http') || txn.category_icon.startsWith('data:')) ? (
                            <img src={txn.category_icon} alt={txn.category_name} className="w-8 h-8 rounded-md object-cover" />
                          ) : (
                            txn.category_icon
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                              {(() => {
                                const parts = (txn.description || '').split('||notes||');
                                return parts[0]?.trim() || '';
                              })()}
                            </p>
                            <span className={`px-2 py-1 ${theme === 'dark' ? 'bg-slate-700/50 text-slate-300' : 'bg-slate-200/50 text-slate-700'} rounded text-xs`}>
                              {txn.category_name}
                            </span>
                          </div>
                          <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} mt-1`}>
                            {new Date(txn.date).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-lg font-bold ${
                          txn.amount > 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {txn.amount > 0 ? '+' : ''}${Math.abs(txn.amount).toFixed(2)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(txn.id);
                          }}
                          className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-medium text-sm transition-all border border-red-500/30"
                        >
                          <Trash2 className="w-5 h-5 text-red-400 hover:text-red-300 transition-colors" strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                    {expanded.has(txn.id) && (
                      <div className={`mt-3 ml-16 mr-6 p-3 rounded-lg border ${theme === 'dark' ? 'bg-slate-700/30 border-slate-600 text-slate-300' : 'bg-slate-100/50 border-slate-300 text-slate-700'}`}>
                        {(() => {
                          const parts = (txn.description || '').split('||notes||');
                          const notesText = parts[1]?.trim();
                          return notesText ? (
                            <div>
                              <div className="text-xs font-semibold mb-1">Notes</div>
                              <div className="text-sm whitespace-pre-wrap leading-relaxed">{notesText}</div>
                            </div>
                          ) : (
                            <div className="text-sm italic opacity-70">No notes</div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Transactions;
