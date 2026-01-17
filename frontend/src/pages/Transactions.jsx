/**
 * Transactions Page - Enhanced Dark Mode Finance Tracker
 * Professional transaction management with advanced filtering and insights
 */
import { useState, useEffect, useMemo } from 'react';
import { getTransactions, createTransaction, deleteTransaction, getCategories } from '../api';
import { clearInsightsCache } from '../utils/cache';
import { RefreshCw, TrendingUp, TrendingDown, Wallet, Hash, CirclePlus, Check, Trash2, Plus } from 'lucide-react';
import CategoryIconPicker from '../components/CategoryIconPicker';
import CustomCategoryCreator from '../components/CustomCategoryCreator';

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showCustomCategoryCreator, setShowCustomCategoryCreator] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [selectedCategoryIcon, setSelectedCategoryIcon] = useState('');

  // Form state
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isExpense, setIsExpense] = useState(true);

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'income', 'expense'
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('date'); // 'date', 'amount', 'category'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [dateRange, setDateRange] = useState('all'); // 'all', 'today', 'week', 'month', 'year'

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

      await createTransaction(parseInt(categoryId), finalAmount, description, date);
      
      const txns = await getTransactions();
      setTransactions(txns);
      
      // Reset form
      setCategoryId('');
      setAmount('');
      setDescription('');
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
    const income = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = Math.abs(
      transactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0)
    );

    return {
      income,
      expenses,
      net: income - expenses,
      count: transactions.length
    };
  }, [transactions]);

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

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups = {};
    filteredTransactions.forEach(txn => {
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
  }, [filteredTransactions]);

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
      <div className="flex justify-center items-center min-h-screen bg-[#0a0e27]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-400 text-lg">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e27] px-6 py-8">
      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in">
          <div className="bg-green-500/90 backdrop-blur-sm text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-green-400/30">
            <span className="text-xl">✓</span>
            <span className="font-medium">Transaction saved successfully!</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
          <span className="text-amber-400">💳</span>
          Transactions
        </h1>
        <p className="text-slate-400 text-lg">Manage your income and expenses</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-xl p-6 border border-slate-700 hover:border-green-500/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-400 uppercase tracking-wide">Total Income</span>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center border border-green-500/30">
              <span className="text-2xl">📈</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-green-400">
            ${totals.income.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-xl p-6 border border-slate-700 hover:border-red-500/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-400 uppercase tracking-wide">Total Expenses</span>
            <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center border border-red-500/30">
              <span className="text-2xl">📉</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-red-400">
            ${totals.expenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-xl p-6 border border-slate-700 hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-400 uppercase tracking-wide">Net Balance</span>
            <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center border border-amber-500/30">
              <span className="text-2xl">💰</span>
            </div>
          </div>
          <p className={`text-3xl font-bold ${totals.net >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
            ${Math.abs(totals.net).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-xl p-6 border border-slate-700 hover:border-blue-500/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-400 uppercase tracking-wide">Total Count</span>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
              <span className="text-2xl">📊</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-blue-400">{totals.count}</p>
        </div>
      </div>

      {/* Quick Add Button */}
      {!showForm && (
        <div className="mb-6">
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center gap-2"
          >
            <span className="text-xl">➕</span>
            Add New Transaction
          </button>
        </div>
      )}

      {/* Add Transaction Form */}
      {showForm && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-slate-700 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-amber-400">➕</span>
              Add New Transaction
            </h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              ✕
            </button>
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
                      : 'bg-slate-700/50 text-slate-400 border-slate-600 hover:bg-slate-700'
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
                      : 'bg-slate-700/50 text-slate-400 border-slate-600 hover:bg-slate-700'
                  }`}
                >
                  <span className="text-2xl mb-2 block">💰</span>
                  Income
                </button>
              </div>
            </div>

            {/* Quick Category Selection */}
            {recentCategories.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Quick Select (Recent)</label>
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
                            : 'bg-slate-700/50 text-slate-300 border-slate-600 hover:bg-slate-700'
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
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Category
                </label>
                <div className="flex gap-2">
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="flex-1 px-4 py-3 bg-slate-700/50 border-2 border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all"
                    required
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
                    onClick={() => setShowIconPicker(true)}
                    className="px-4 py-3 bg-slate-700/50 hover:bg-slate-600 border-2 border-slate-600 hover:border-amber-400/50 rounded-xl text-2xl transition-all"
                    title="Pick category icon"
                  >
                    {selectedCategoryIcon || '😀'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCustomCategoryCreator(true)}
                    className="px-4 py-3 bg-slate-700/50 hover:bg-slate-600 border-2 border-slate-600 hover:border-amber-400/50 rounded-xl text-white font-medium transition-all flex items-center gap-2"
                    title="Create custom category"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="hidden sm:inline">Create</span>
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-slate-400 font-semibold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 bg-slate-700/50 border-2 border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all placeholder-slate-500"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 border-2 border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all placeholder-slate-500"
                  placeholder="e.g., Grocery shopping"
                  required
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 border-2 border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 rounded-xl font-semibold hover:shadow-xl transition-all hover:scale-105"
              >
                ✓ Add Transaction
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 bg-slate-700/50 text-slate-300 rounded-xl font-medium hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Icon Picker Modal */}
      <CategoryIconPicker
        isOpen={showIconPicker}
        onClose={() => setShowIconPicker(false)}
        onSelect={(icon) => setSelectedCategoryIcon(icon)}
        type={isExpense ? 'expense' : 'income'}
      />

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
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-slate-700 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">Search</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-slate-400">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border-2 border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all placeholder-slate-500"
                placeholder="Search transactions..."
              />
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700/50 border-2 border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all"
            >
              <option value="all">All</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700/50 border-2 border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all"
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
            <label className="block text-sm font-medium text-slate-300 mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700/50 border-2 border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all"
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
            <label className="block text-sm font-medium text-slate-300 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-slate-700/50 border-2 border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all"
            >
              <option value="date">Date</option>
              <option value="amount">Amount</option>
              <option value="category">Category</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-4 py-2 bg-slate-700/50 border-2 border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all"
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
              className="px-4 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-all text-sm font-medium"
            >
              🔄 Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-xl border border-slate-700 overflow-hidden">
        <div className="p-6 bg-slate-700/30 border-b border-slate-600">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-amber-400">📊</span>
            Transactions ({filteredTransactions.length})
          </h2>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-block p-6 bg-slate-700/50 rounded-full mb-4">
              <span className="text-5xl">📝</span>
            </div>
            <p className="text-slate-400 text-lg mb-2">No transactions found</p>
            <p className="text-slate-500 text-sm">
              {searchQuery || filterType !== 'all' || filterCategory !== 'all' || dateRange !== 'all'
                ? 'Try adjusting your filters'
                : 'Add your first transaction above to get started!'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {Object.entries(groupedTransactions).map(([date, txns]) => (
              <div key={date}>
                <div className="px-6 py-3 bg-slate-700/20 border-b border-slate-600">
                  <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wide">
                    {date}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {txns.length} transaction{txns.length !== 1 ? 's' : ''} • 
                    Total: ${txns.reduce((sum, t) => sum + Math.abs(t.amount), 0).toFixed(2)}
                  </p>
                </div>
                {txns.map((txn) => (
                  <div
                    key={txn.id}
                    className="px-6 py-4 hover:bg-slate-700/20 transition-all border-b border-slate-700/50 last:border-b-0"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                          txn.amount > 0 
                            ? 'bg-green-500/20 border border-green-500/30' 
                            : 'bg-red-500/20 border border-red-500/30'
                        }`}>
                          {txn.category_icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <p className="font-semibold text-white">{txn.description}</p>
                            <span className="px-2 py-1 bg-slate-700/50 text-slate-300 rounded text-xs">
                              {txn.category_name}
                            </span>
                          </div>
                          <p className="text-sm text-slate-400 mt-1">
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
                          onClick={() => handleDelete(txn.id)}
                          className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-medium text-sm transition-all border border-red-500/30"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
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
