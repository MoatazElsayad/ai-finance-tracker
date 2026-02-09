/**
 * Transactions Page - Professional Finance Tracker
 * Advanced transaction management with filtering, bulk actions, and export.
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  getTransactions, 
  createTransaction, 
  updateTransaction,
  deleteTransaction, 
  bulkDeleteTransactions,
  getCategories 
} from '../api';
import { useTheme } from '../context/ThemeContext';
import { clearInsightsCache } from '../utils/cache';
import { useDebounce } from '../utils/debounce';
import { 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Hash, 
  CirclePlus, 
  Check, 
  Trash2, 
  Plus, 
  CreditCard, 
  Search, 
  FileText, 
  ArrowLeftRight, 
  ArrowRight, 
  ArrowLeft,
  Download,
  Filter,
  MoreVertical,
  Edit2,
  X,
  ChevronDown,
  Calendar,
  AlertCircle,
  Utensils,
  ShoppingBag,
  Car,
  Zap,
  Home,
  Film,
  Activity,
  PiggyBank,
  Banknote,
  BarChart2,
  Plane,
  Gift,
  MoreHorizontal
} from 'lucide-react';
import CustomCategoryCreator from '../components/CustomCategoryCreator';

function Transactions() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Data state
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState({ show: false, message: '' });
  
  // UI state
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showCustomCategoryCreator, setShowCustomCategoryCreator] = useState(false);
  const [viewMode, setViewMode] = useState('monthly'); // 'monthly', 'yearly', or 'overall'
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const [expanded, setExpanded] = useState(new Set());
  const [selectedTxns, setSelectedTxns] = useState(new Set());
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 1 });

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Category Icon Mapping
  const categoryIcons = {
    'food': 'Utensils',
    'dining': 'Utensils',
    'shopping': 'ShoppingBag',
    'transport': 'Car',
    'transportation': 'Car',
    'utilities': 'Zap',
    'rent': 'Home',
    'housing': 'Home',
    'entertainment': 'Film',
    'health': 'Activity',
    'medical': 'Activity',
    'savings': 'PiggyBank',
    'income': 'TrendingUp',
    'salary': 'Banknote',
    'investment': 'BarChart2',
    'travel': 'Plane',
    'gift': 'Gift',
    'other': 'MoreHorizontal'
  };

  const getCategoryIcon = (categoryName) => {
    const name = (categoryName || 'other').toLowerCase();
    const iconName = Object.keys(categoryIcons).find(key => name.includes(key)) || 'other';
    return iconName;
  };

  const IconComponent = ({ name, className }) => {
    const icons = {
      Utensils, ShoppingBag, Car, Zap, Home, Film, Activity, PiggyBank, 
      TrendingUp, Banknote, BarChart2, Plane, Gift, MoreHorizontal
    };
    const Icon = icons[name] || MoreHorizontal;
    return <Icon className={className} />;
  };

  // Form state
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    description: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
    isExpense: true
  });

  // Helpers
  const toggleExpand = (id) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpanded(newExpanded);
  };

  const toggleSelect = (id) => {
    const newSelected = new Set(selectedTxns);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedTxns(newSelected);
  };

  const toggleSelectAll = (filteredTxns) => {
    if (selectedTxns.size === filteredTxns.length) {
      setSelectedTxns(new Set());
    } else {
      setSelectedTxns(new Set(filteredTxns.map(t => t.id)));
    }
  };

  const getDateRange = () => {
    if (viewMode === 'custom' && customDateRange.start && customDateRange.end) {
      return { startDate: customDateRange.start, endDate: customDateRange.end };
    }
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
    }
    return { startDate: '1900-01-01', endDate: '2100-12-31' };
  };

  const loadData = useCallback(async (page = 1, append = false) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);
      
      const [txnsData, cats] = await Promise.all([
        getTransactions(page, 50),
        getCategories()
      ]);
      
      const txns = txnsData.transactions || txnsData;
      const paginationData = txnsData.pagination || { page: 1, limit: txns.length, total: txns.length, pages: 1 };
      
      if (append) setTransactions(prev => [...prev, ...txns]);
      else setTransactions(txns);
      
      setPagination(paginationData);
      setCategories(Array.isArray(cats) ? cats : []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadData(1, false);
    const handleTransactionAdded = () => loadData(1, false);
    window.addEventListener('transaction-added', handleTransactionAdded);
    return () => window.removeEventListener('transaction-added', handleTransactionAdded);
  }, [loadData]);

  const showToast = (message) => {
    setShowSuccessToast({ show: true, message });
    setTimeout(() => setShowSuccessToast({ show: false, message: '' }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const finalAmount = formData.isExpense ? -Math.abs(parseFloat(formData.amount)) : Math.abs(parseFloat(formData.amount));
      const combinedDescription = formData.notes.trim()
        ? `${formData.description.trim()} ||notes|| ${formData.notes.trim()}`
        : formData.description.trim();

      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, parseInt(formData.categoryId), finalAmount, combinedDescription, formData.date);
        showToast('Transaction updated successfully');
      } else {
        await createTransaction(parseInt(formData.categoryId), finalAmount, combinedDescription, formData.date);
        showToast('Transaction created successfully');
      }
      
      await loadData(1, false);
      resetForm();
      clearInsightsCache();
    } catch (error) {
      alert(error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      categoryId: '',
      amount: '',
      description: '',
      notes: '',
      date: new Date().toISOString().split('T')[0],
      isExpense: true
    });
    setShowForm(false);
    setEditingTransaction(null);
  };

  const handleEdit = (txn) => {
    const description = txn.description || '';
    const isNote = description.includes('||notes||');
    const [desc, note] = isNote ? description.split('||notes||') : [description, ''];
    
    setFormData({
      categoryId: txn.category_id,
      amount: Math.abs(txn.amount),
      description: desc.trim(),
      notes: note.trim(),
      date: txn.date.split('T')[0],
      isExpense: txn.amount < 0
    });
    setEditingTransaction(txn);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await deleteTransaction(id);
      setTransactions(transactions.filter(t => t.id !== id));
      clearInsightsCache();
      showToast('Transaction deleted');
    } catch (error) {
      alert(error.message);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedTxns.size} transactions?`)) return;
    try {
      await bulkDeleteTransactions(Array.from(selectedTxns));
      setTransactions(transactions.filter(t => !selectedTxns.has(t.id)));
      setSelectedTxns(new Set());
      clearInsightsCache();
      showToast(`${selectedTxns.size} transactions deleted`);
    } catch (error) {
      alert(error.message);
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Description', 'Category', 'Amount', 'Type'];
    const rows = filteredTransactions.map(t => [
      t.date.split('T')[0],
      t.description.replace('||notes||', ' - '),
      t.category_name,
      Math.abs(t.amount),
      t.amount < 0 ? 'Expense' : 'Income'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `transactions_${viewMode}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered & Sorted Data
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];
    if (debouncedSearchQuery) {
      const q = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        (t.description || '').toLowerCase().includes(q) || 
        (t.category_name || '').toLowerCase().includes(q)
      );
    }
    if (filterType !== 'all') filtered = filtered.filter(t => filterType === 'income' ? t.amount > 0 : t.amount < 0);
    if (filterCategory !== 'all') filtered = filtered.filter(t => t.category_id === parseInt(filterCategory));
    
    // Amount range filter
    if (minAmount !== '') filtered = filtered.filter(t => Math.abs(t.amount) >= parseFloat(minAmount));
    if (maxAmount !== '') filtered = filtered.filter(t => Math.abs(t.amount) <= parseFloat(maxAmount));

    const range = getDateRange();
    filtered = filtered.filter(t => {
      const d = t.date.split('T')[0];
      return d >= range.startDate && d <= range.endDate;
    });

    filtered.sort((a, b) => {
      let res = 0;
      if (sortBy === 'date') res = new Date(a.date) - new Date(b.date);
      else if (sortBy === 'amount') res = Math.abs(a.amount) - Math.abs(b.amount);
      else if (sortBy === 'category') res = (a.category_name || '').localeCompare(b.category_name || '');
      return sortOrder === 'asc' ? res : -res;
    });
    return filtered;
  }, [transactions, debouncedSearchQuery, filterType, filterCategory, viewMode, selectedMonth, sortBy, sortOrder, minAmount, maxAmount, customDateRange]);

  const totals = useMemo(() => {
    const res = filteredTransactions.reduce((acc, t) => {
      if (t.amount > 0) acc.income += t.amount;
      else acc.expenses += Math.abs(t.amount);
      return acc;
    }, { income: 0, expenses: 0 });
    return { ...res, net: res.income - res.expenses, count: filteredTransactions.length };
  }, [filteredTransactions]);

  const groupedTransactions = useMemo(() => {
    const groups = {};
    filteredTransactions.forEach(t => {
      const dateKey = new Date(t.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(t);
    });
    return groups;
  }, [filteredTransactions]);

  if (loading && transactions.length === 0) {
    return (
      <div className={`flex justify-center items-center min-h-screen ${isDark ? 'bg-[#0a0e27]' : 'bg-slate-50'}`}>
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-amber-500 rounded-full mb-4"></div>
          <div className="h-4 w-48 bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-12 px-4 md:px-12 ${isDark ? 'bg-[#0a0e27]' : 'bg-slate-50'}`}>
      <div className="max-w-7xl mx-auto">
        
        {/* Toast */}
        {showSuccessToast.show && (
          <div className="fixed top-24 right-8 z-50 animate-in slide-in-from-right-10">
            <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${isDark ? 'bg-emerald-500/90 border-emerald-400/30 text-white' : 'bg-white border-emerald-100 text-emerald-900'}`}>
              <Check className="w-5 h-5" />
              <span className="font-bold uppercase tracking-wider text-sm">{showSuccessToast.message}</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-amber-500 rounded-2xl shadow-lg shadow-amber-500/20">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <h1 className={`text-4xl md:text-5xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Transactions</h1>
            </div>
            <p className={`text-lg font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Manage and track your daily finances with precision.</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={exportToCSV}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider border transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button 
              onClick={() => { resetForm(); setShowForm(true); }}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider bg-amber-500 text-white shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              <Plus className="w-5 h-5" /> New Transaction
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Income', value: totals.income, icon: TrendingUp, color: 'emerald' },
            { label: 'Expenses', value: totals.expenses, icon: TrendingDown, color: 'rose' },
            { label: 'Balance', value: totals.net, icon: Wallet, color: 'amber' },
            { label: 'Total', value: totals.count, icon: Hash, color: 'blue' }
          ].map((stat, i) => (
            <div key={i} className={`p-6 rounded-[2rem] border transition-all ${isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center justify-between mb-4">
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{stat.label}</span>
                <div className={`p-2 rounded-lg bg-${stat.color}-500/10`}>
                  <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
                </div>
              </div>
              <div className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {stat.label === 'Total' ? stat.value : `EGP ${Math.abs(stat.value).toLocaleString()}`}
              </div>
            </div>
          ))}
        </div>

        {/* Filter Section */}
        <div className={`p-8 rounded-[2rem] border mb-12 ${isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col lg:flex-row gap-6 items-center">
              <div className="flex-1 w-full relative">
                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                <input 
                  type="text" 
                  placeholder="Search description or category..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border outline-none transition-all ${isDark ? 'bg-slate-900 border-slate-800 text-white focus:border-amber-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500/50'}`}
                />
              </div>
              
              <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-900/50 border border-slate-800">
                  {['monthly', 'yearly', 'overall', 'custom'].map(m => (
                    <button 
                      key={m} 
                      onClick={() => setViewMode(m)}
                      className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === m ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                {viewMode !== 'overall' && viewMode !== 'custom' && (
                  <div className="flex items-center gap-3">
                    <button onClick={() => viewMode === 'monthly' ? setSelectedMonth(p => p.month === 1 ? {year: p.year-1, month: 12} : {...p, month: p.month-1}) : setSelectedMonth(p => ({...p, year: p.year-1}))} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition-all"><ArrowLeft className="w-4 h-4" /></button>
                    <span className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {viewMode === 'monthly' ? new Date(selectedMonth.year, selectedMonth.month-1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : selectedMonth.year}
                    </span>
                    <button onClick={() => viewMode === 'monthly' ? setSelectedMonth(p => p.month === 12 ? {year: p.year+1, month: 1} : {...p, month: p.month+1}) : setSelectedMonth(p => ({...p, year: p.year+1}))} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition-all"><ArrowRight className="w-4 h-4" /></button>
                  </div>
                )}

                {viewMode === 'custom' && (
                  <div className="flex items-center gap-2">
                    <input 
                      type="date" 
                      value={customDateRange.start}
                      onChange={e => setCustomDateRange(p => ({ ...p, start: e.target.value }))}
                      className={`px-3 py-2 rounded-xl border text-xs font-bold outline-none ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                    />
                    <span className="text-slate-500">-</span>
                    <input 
                      type="date" 
                      value={customDateRange.end}
                      onChange={e => setCustomDateRange(p => ({ ...p, end: e.target.value }))}
                      className={`px-3 py-2 rounded-xl border text-xs font-bold outline-none ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                    />
                  </div>
                )}

                <button 
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${showAdvancedFilters ? 'bg-amber-500 border-amber-500 text-white' : (isDark ? 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white')}`}
                >
                  <Filter className="w-4 h-4" /> {showAdvancedFilters ? 'Hide' : 'More'} Filters
                </button>
              </div>
            </div>

            {showAdvancedFilters && (
              <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6 rounded-2xl animate-in slide-in-from-top-2 duration-300 ${isDark ? 'bg-slate-900/50 border border-slate-800/50' : 'bg-slate-50/50 border border-slate-100'}`}>
                <div className="flex flex-col gap-2">
                  <label className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Type</label>
                  <select 
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider outline-none ${isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                  >
                    <option value="all">All Types</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Category</label>
                  <select 
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider outline-none ${isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Min Amount (EGP)</label>
                  <input 
                    type="number" 
                    placeholder="Min..." 
                    value={minAmount}
                    onChange={e => setMinAmount(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border text-xs font-bold outline-none ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Max Amount (EGP)</label>
                  <input 
                    type="number" 
                    placeholder="Max..." 
                    value={maxAmount}
                    onChange={e => setMaxAmount(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border text-xs font-bold outline-none ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                  />
                </div>

                <div className="lg:col-span-4 flex justify-end gap-3 mt-2 pt-4 border-t border-slate-800/50">
                  <button 
                    onClick={() => {
                      setMinAmount('');
                      setMaxAmount('');
                      setFilterType('all');
                      setFilterCategory('all');
                      setSearchQuery('');
                      setCustomDateRange({ start: '', end: '' });
                      setViewMode('monthly');
                    }}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-900'}`}
                  >
                    Reset All Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedTxns.size > 0 && (
          <div className="mb-6 animate-in slide-in-from-top-4">
            <div className={`flex items-center justify-between px-8 py-4 rounded-2xl border ${isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex items-center gap-4">
                <span className={`text-sm font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>{selectedTxns.size} selected</span>
                <button onClick={() => setSelectedTxns(new Set())} className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-900'}`}>Deselect All</button>
              </div>
              <button 
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-6 py-2 rounded-xl bg-rose-500 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:scale-105 active:scale-95 transition-all"
              >
                <Trash2 className="w-4 h-4" /> Delete Selected
              </button>
            </div>
          </div>
        )}

        {/* Transaction Table */}
        <div className={`rounded-[2rem] border overflow-hidden ${isDark ? 'bg-slate-800/20 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className={`${isDark ? 'bg-slate-800/40' : 'bg-slate-50'} border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                  <th className="px-8 py-6">
                    <input 
                      type="checkbox" 
                      checked={selectedTxns.size === filteredTransactions.length && filteredTransactions.length > 0}
                      onChange={() => toggleSelectAll(filteredTransactions)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-800 accent-amber-500"
                    />
                  </th>
                  <th className="px-4 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Transaction</th>
                  <th className="px-4 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Category</th>
                  <th className="px-4 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Date</th>
                  <th className="px-4 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">Amount</th>
                  <th className="px-4 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-800/50' : 'divide-slate-100'}`}>
                {Object.entries(groupedTransactions).map(([dateLabel, txns]) => (
                  <React.Fragment key={dateLabel}>
                    <tr className={isDark ? 'bg-slate-800/10' : 'bg-slate-50/50'}>
                      <td colSpan="6" className="px-8 py-3">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-amber-500/70' : 'text-amber-600'}`}>{dateLabel}</span>
                      </td>
                    </tr>
                    {txns.map(t => {
                      const description = t.description || '';
                      const isNote = description.includes('||notes||');
                      const [desc, note] = isNote ? description.split('||notes||') : [description, ''];
                      const isExpanded = expanded.has(t.id);
                      
                      return (
                        <tr key={t.id} className={`group transition-all ${isDark ? 'hover:bg-slate-700/20' : 'hover:bg-slate-50'} ${selectedTxns.has(t.id) ? (isDark ? 'bg-amber-500/5' : 'bg-amber-50') : ''}`}>
                          <td className="px-8 py-5">
                            <input 
                              type="checkbox" 
                              checked={selectedTxns.has(t.id)}
                              onChange={() => toggleSelect(t.id)}
                              className="w-4 h-4 rounded border-slate-700 bg-slate-800 accent-amber-500"
                            />
                          </td>
                          <td className="px-4 py-5">
                            <div className="flex flex-col">
                              <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{desc}</span>
                              {note && isExpanded && <span className="text-xs text-slate-500 mt-1 italic">{note}</span>}
                            </div>
                          </td>
                          <td className="px-4 py-5">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-xl border ${t.amount > 0 ? (isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-emerald-50 border-emerald-100 text-emerald-600') : (isDark ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-rose-50 border-rose-100 text-rose-600')}`}>
                                <IconComponent name={getCategoryIcon(t.category_name)} className="w-4 h-4" />
                              </div>
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                                {t.category_name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-5 text-xs font-medium text-slate-500">
                            {new Date(t.date).toLocaleDateString()}
                          </td>
                          <td className={`px-4 py-5 text-right font-black text-sm ${t.amount > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {t.amount > 0 ? '+' : ''}{Math.abs(t.amount).toLocaleString()} EGP
                          </td>
                          <td className="px-4 py-5">
                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => toggleExpand(t.id)} className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-slate-700 text-slate-500' : 'hover:bg-slate-200 text-slate-400'}`}><FileText className="w-4 h-4" /></button>
                              <button onClick={() => handleEdit(t)} className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-amber-500/10 text-amber-500' : 'hover:bg-amber-50 text-amber-600'}`}><Edit2 className="w-4 h-4" /></button>
                              <button onClick={() => handleDelete(t.id)} className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-rose-500/10 text-rose-500' : 'hover:bg-rose-50 text-rose-600'}`}><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          {filteredTransactions.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className={`p-6 rounded-full mb-6 ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <Search className="w-12 h-12 text-slate-600" />
              </div>
              <h3 className={`text-xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>No transactions found</h3>
              <p className="text-slate-500 max-w-xs">Try adjusting your filters or search terms to find what you're looking for.</p>
            </div>
          )}
        </div>

        {/* Modal Form */}
        {showForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-[#0a0e27]/80 backdrop-blur-sm" onClick={resetForm} />
            <div className={`relative w-full max-w-2xl rounded-[2.5rem] border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 ${isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="px-10 py-8 border-b border-slate-800/50 flex items-center justify-between">
                <h2 className={`text-2xl font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {editingTransaction ? 'Edit Transaction' : 'New Transaction'}
                </h2>
                <button onClick={resetForm} className="p-2 rounded-xl hover:bg-slate-800 transition-all text-slate-500"><X className="w-6 h-6" /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-10 space-y-8">
                <div className="flex p-1.5 rounded-2xl bg-slate-900/50 border border-slate-800">
                  <button type="button" onClick={() => setFormData(p => ({...p, isExpense: true}))} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${formData.isExpense ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Expense</button>
                  <button type="button" onClick={() => setFormData(p => ({...p, isExpense: false}))} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${!formData.isExpense ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Income</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-2">Amount</label>
                    <div className="relative">
                      <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-black ${formData.isExpense ? 'text-rose-500' : 'text-emerald-500'}`}>EGP</span>
                      <input 
                        type="number" step="0.01" required 
                        value={formData.amount}
                        onChange={e => setFormData(p => ({...p, amount: e.target.value}))}
                        className={`w-full pl-14 pr-4 py-4 rounded-2xl border outline-none font-black text-xl transition-all ${isDark ? 'bg-slate-900 border-slate-800 text-white focus:border-amber-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500/50'}`}
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-2">Category</label>
                    <div className="flex gap-2">
                      <select 
                        required 
                        value={formData.categoryId}
                        onChange={e => setFormData(p => ({...p, categoryId: e.target.value}))}
                        className={`flex-1 px-4 py-4 rounded-2xl border outline-none font-bold text-sm transition-all ${isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                      >
                        <option value="">Select Category</option>
                        {categories.filter(c => c.type === (formData.isExpense ? 'expense' : 'income') || c.name.toLowerCase().includes('savings')).map(c => (
                          <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                        ))}
                      </select>
                      <button type="button" onClick={() => setShowCustomCategoryCreator(true)} className="p-4 rounded-2xl bg-slate-800 border border-slate-700 text-amber-500"><Plus className="w-5 h-5" /></button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-2">Description</label>
                  <input 
                    type="text" required 
                    value={formData.description}
                    onChange={e => setFormData(p => ({...p, description: e.target.value}))}
                    className={`w-full px-6 py-4 rounded-2xl border outline-none font-bold text-sm transition-all ${isDark ? 'bg-slate-900 border-slate-800 text-white focus:border-amber-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500/50'}`}
                    placeholder="e.g. Grocery shopping"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-2">Date</label>
                    <input 
                      type="date" required 
                      value={formData.date}
                      onChange={e => setFormData(p => ({...p, date: e.target.value}))}
                      className={`w-full px-6 py-4 rounded-2xl border outline-none font-bold text-sm transition-all ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-2">Notes (Optional)</label>
                    <input 
                      type="text" 
                      value={formData.notes}
                      onChange={e => setFormData(p => ({...p, notes: e.target.value}))}
                      className={`w-full px-6 py-4 rounded-2xl border outline-none font-bold text-sm transition-all ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`}
                      placeholder="Add more details..."
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-5 rounded-2xl bg-amber-500 text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {editingTransaction ? 'Update Transaction' : 'Save Transaction'}
                </button>
              </form>
            </div>
          </div>
        )}

        <CustomCategoryCreator
          isOpen={showCustomCategoryCreator}
          onClose={() => setShowCustomCategoryCreator(false)}
          onSuccess={() => { setShowCustomCategoryCreator(false); loadData(); }}
          type={formData.isExpense ? 'expense' : 'income'}
        />

      </div>
    </div>
  );
}

export default Transactions;
