/**
 * Transactions Page - Enhanced Dark Mode Finance Tracker
 * Professional transaction management with advanced filtering and insights
 */
import { useState, useEffect, useMemo } from 'react';
import { getTransactions, createTransaction, deleteTransaction, getCategories } from '../api';
import { useTheme } from '../context/ThemeContext';
import { clearInsightsCache } from '../utils/cache';
import { RefreshCw, TrendingUp, TrendingDown, Wallet, Hash, CirclePlus, Check, Trash2, Plus, CreditCard, BarChart3, DollarSign, Search, FileText, ArrowLeftRight, ArrowRight, ArrowLeft } from 'lucide-react';
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

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    if (searchQuery) {
      filtered = filtered.filter(txn =>
        txn.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        txn.category_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterType === 'income') {
      filtered = filtered.filter(t => t.amount > 0);
    } else if (filterType === 'expense') {
      filtered = filtered.filter(t => t.amount < 0);
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(t => t.category_id === parseInt(filterCategory));
    }

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

  // Calculate totals based on current filters
  const totals = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = Math.abs(
      filteredTransactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0)
    );
    return {
      income,
      expenses,
      net: income - expenses,
      count: filteredTransactions.length
    };
  }, [filteredTransactions]);


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
    <div className={`min-h-screen px-6 py-8 ${theme === 'dark' ? 'bg-[#0a0e27]' : 'bg-slate-50'} transition-colors duration-500`}>
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
        <p className={`text-xl font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} tracking-tight max-w-2xl`}>
          Manage your income and expenses with AI-powered insights and professional tracking.
        </p>
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
                  {new Date(selectedMonth.year, selectedMonth.month, 1).toLocaleDateString('en-US', {
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
              {stat.label === 'Total Count' ? stat.value : `£${Math.abs(stat.value).toLocaleString()}`}
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
                <label className={`block text-xs font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Amount (£)</label>
                <div className="relative group">
                  <span className={`absolute left-8 top-1/2 -translate-y-1/2 text-2xl font-black ${isExpense ? 'text-rose-500' : 'text-emerald-500'} transition-colors duration-500`}>£</span>
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
                    onChange={(e) => setCategoryId(e.target.value)}
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

          {showCustomCategoryCreator && (
            <div className={`mt-12 pt-10 border-t-2 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
              <CustomCategoryCreator
                onCategoryCreated={(newCat) => {
                  setCategories([...categories, newCat]);
                  setCategoryId(newCat.id);
                  setShowCustomCategoryCreator(false);
                }}
              />
            </div>
          )}
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
      <div className={`card-unified ${theme === 'dark' ? 'card-unified-dark' : 'card-unified-light'} p-10 mb-16 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-400`}>
        <div className="flex flex-col lg:flex-row gap-10 items-end">
          <div className="flex-1 space-y-4 w-full">
            <label className={`block text-xs font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Search Transactions</label>
            <div className="relative group">
              <Search className={`absolute left-6 top-1/2 -translate-y-1/2 w-7 h-7 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} group-focus-within:text-amber-500 transition-all duration-500 group-focus-within:scale-110`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by description or category..."
                className="input-unified w-full !pl-16"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full lg:w-auto">
            <div className="space-y-4">
              <label className={`block text-xs font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="input-unified w-full"
              >
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            <div className="space-y-4">
              <label className={`block text-xs font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="input-unified w-full"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              <label className={`block text-xs font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input-unified w-full"
              >
                <option value="date">Date</option>
                <option value="amount">Amount</option>
                <option value="category">Category</option>
              </select>
            </div>

            <div className="space-y-4">
              <label className={`block text-xs font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Order</label>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className={`w-full px-8 py-4 rounded-[1.5rem] font-black transition-all duration-500 ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-900 hover:bg-white'} border-2 flex items-center justify-between group shadow-sm`}
              >
                <span className="uppercase tracking-[0.1em] text-xs">{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
                <ArrowLeftRight className={`w-5 h-5 transition-transform duration-500 ${sortOrder === 'asc' ? '' : 'rotate-180'} text-amber-500`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table/List */}
      <div className={`card-unified ${theme === 'dark' ? 'card-unified-dark' : 'card-unified-light'} overflow-hidden mb-16 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-500 shadow-2xl`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`${theme === 'dark' ? 'bg-slate-800/40' : 'bg-slate-50'} border-b-2 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
                <th className="px-10 py-8 text-xs font-black uppercase tracking-[0.2em] text-slate-500">Transaction</th>
                <th className="px-10 py-8 text-xs font-black uppercase tracking-[0.2em] text-slate-500">Category</th>
                <th className="px-10 py-8 text-xs font-black uppercase tracking-[0.2em] text-slate-500">Date</th>
                <th className="px-10 py-8 text-xs font-black uppercase tracking-[0.2em] text-slate-500 text-right">Amount</th>
                <th className="px-10 py-8 text-xs font-black uppercase tracking-[0.2em] text-slate-500 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-800/5">
              {Object.entries(groupedTransactions).map(([dateLabel, txns]) => (
                <tr key={dateLabel} className={`${theme === 'dark' ? 'bg-slate-900/30' : 'bg-slate-50/30'}`}>
                  <td colSpan="5" className="px-10 py-5">
                    <span className={`text-xs font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-amber-500/80' : 'text-amber-600/80'}`}>
                      {dateLabel}
                    </span>
                  </td>
                </tr>
              ))}
              {displayTransactions.map((txn) => {
                const isNote = txn.description.includes('||notes||');
                const [desc, note] = isNote ? txn.description.split('||notes||') : [txn.description, ''];
                const isExpanded = expanded.has(txn.id);
                
                return (
                  <tr 
                    key={txn.id} 
                    onClick={() => toggleExpand(txn.id)}
                    className={`${theme === 'dark' ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/50'} transition-all group border-b border-slate-800/5 cursor-pointer ${isExpanded ? (theme === 'dark' ? 'bg-slate-800/20' : 'bg-slate-100/50') : ''}`}
                  >
                    <td className="px-10 py-8">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                          <span className={`font-black text-xl ${theme === 'dark' ? 'text-white' : 'text-slate-900'} group-hover:text-amber-500 transition-colors duration-300`}>{desc}</span>
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
                        theme === 'dark' ? 'bg-slate-800/50 text-slate-300' : 'bg-white text-slate-600'
                      } border-2 ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-100'} shadow-sm group-hover:border-amber-500/30 transition-all duration-300`}>
                        <span className="text-xl">{txn.category_icon}</span>
                        <span className="uppercase tracking-[0.1em]">{txn.category_name}</span>
                      </span>
                    </td>
                    <td className="px-10 py-8">
                      <span className={`font-black uppercase tracking-[0.1em] text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        {new Date(txn.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>
                    <td className={`px-10 py-8 text-right font-black text-2xl ${
                      txn.amount > 0 ? 'text-emerald-500' : 'text-rose-500'
                    }`}>
                      <div className="flex items-center justify-end gap-2">
                        <span>{txn.amount > 0 ? '+' : '-'}</span>
                        <span>£{Math.abs(txn.amount).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-10 py-8 text-center">
                      <button
                        onClick={() => handleDelete(txn.id)}
                        className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white' : 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white'} transition-all shadow-sm group/btn hover:scale-110 active:scale-95`}
                      >
                        <Trash2 className="w-6 h-6 group-hover/btn:rotate-12 transition-transform" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredTransactions.length > displayTransactions.length && (
          <div className="p-10 border-t-2 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'} text-center bg-slate-800/10">
            <button
              onClick={() => setShowAllTransactions(true)}
              className={`px-12 py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] transition-all duration-500 ${
                theme === 'dark' ? 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 shadow-xl shadow-black/20' : 'bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              Load {filteredTransactions.length - displayTransactions.length} More Transactions
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
  );
}

export default Transactions;
