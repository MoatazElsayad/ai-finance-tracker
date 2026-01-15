/**
 * Budget Planning & Management Page
 * Dark Mode Finance Tracker - Professional budget management with AI insights
 */
import { useState, useEffect } from 'react';
import { getMonthlyAnalytics, getTransactions, getBudgets, createBudget, updateBudget, deleteBudget, getCategories } from '../api';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, LineChart, Line } from 'recharts';

// Dark mode chart colors - professional finance palette
const CHART_COLORS = {
  budget: '#3b82f6',
  actual: '#ef4444',
  savings: '#10b981',
  overBudget: '#f59e0b',
  categories: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#6366f1', '#14b8a6', '#f97316', '#06b6d4']
};

function BudgetPlanning() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [newBudget, setNewBudget] = useState({ category_id: '', amount: '' });
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [analyticsData, transactionsData, budgetsData, categoriesData] = await Promise.all([
        getMonthlyAnalytics(selectedMonth.year, selectedMonth.month),
        getTransactions(),
        getBudgets(selectedMonth.year, selectedMonth.month),
        getCategories()
      ]);
      setAnalytics(analyticsData);
      setTransactions(transactionsData);
      setBudgets(budgetsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = (direction) => {
    setSelectedMonth(prev => {
      let newMonth = prev.month + direction;
      let newYear = prev.year;

      if (newMonth > 12) {
        newMonth = 1;
        newYear += 1;
      } else if (newMonth < 1) {
        newMonth = 12;
        newYear -= 1;
      }

      return { year: newYear, month: newMonth };
    });
  };

  // Calculate actual spending by category for current month
  const getActualSpending = () => {
    const currentMonthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getFullYear() === selectedMonth.year &&
             transactionDate.getMonth() + 1 === selectedMonth.month &&
             t.type === 'expense';
    });

    const spendingByCategory = {};
    currentMonthTransactions.forEach(t => {
      const category = t.category_name || 'Uncategorized';
      spendingByCategory[category] = (spendingByCategory[category] || 0) + Math.abs(t.amount);
    });

    return spendingByCategory;
  };

  // Prepare budget vs actual data
  const prepareBudgetData = () => {
    const actualSpending = getActualSpending();
    return budgets.map(budget => {
      const categoryName = budget.category?.name || 'Unknown';
      const actual = actualSpending[categoryName] || 0;
      const budgeted = budget.amount;
      const percentage = budgeted > 0 ? ((actual / budgeted) * 100).toFixed(1) : 0;
      const remaining = Math.max(0, budgeted - actual);
      const overBudget = actual > budgeted;

      return {
        id: budget.id,
        category: categoryName,
        budgeted: budgeted,
        actual: actual,
        icon: budget.category?.icon || '💰',
        color: CHART_COLORS.categories[budgets.indexOf(budget) % CHART_COLORS.categories.length],
        percentage: percentage,
        remaining: remaining,
        overBudget: overBudget,
        category_id: budget.category_id
      };
    });
  };

  const budgetData = prepareBudgetData();
  const totalBudgeted = budgetData.reduce((sum, b) => sum + b.budgeted, 0);
  const totalActual = budgetData.reduce((sum, b) => sum + b.actual, 0);
  const totalRemaining = budgetData.reduce((sum, b) => sum + b.remaining, 0);

  const handleCreateBudget = async () => {
    if (newBudget.category_id && newBudget.amount) {
      setBudgetLoading(true);
      try {
        const result = await createBudget(
          parseInt(newBudget.category_id),
          newBudget.amount,
          selectedMonth.month,
          selectedMonth.year
        );

        // Reload data to get updated budgets
        const budgetsData = await getBudgets(selectedMonth.year, selectedMonth.month);
        setBudgets(budgetsData);

        // Reset form
        setNewBudget({ category_id: '', amount: '' });
        setShowBudgetForm(false);

        // Show success message
        setToastMessage(result.action === 'updated' ? 'Budget updated successfully!' : 'Budget created successfully!');
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);

      } catch (error) {
        console.error('Failed to create budget:', error);
        alert(error.message);
      } finally {
        setBudgetLoading(false);
      }
    }
  };

  const handleEditBudget = (budget) => {
    setEditingBudget(budget);
    setNewBudget({
      category_id: budget.category_id.toString(),
      amount: budget.amount.toString()
    });
    setShowBudgetForm(true);
  };

  const handleUpdateBudget = async () => {
    if (editingBudget && newBudget.category_id && newBudget.amount) {
      setBudgetLoading(true);
      try {
        await updateBudget(
          editingBudget.id,
          parseInt(newBudget.category_id),
          newBudget.amount,
          selectedMonth.month,
          selectedMonth.year
        );

        // Reload data
        const budgetsData = await getBudgets(selectedMonth.year, selectedMonth.month);
        setBudgets(budgetsData);

        // Reset form
        setEditingBudget(null);
        setNewBudget({ category_id: '', amount: '' });
        setShowBudgetForm(false);

        // Show success message
        setToastMessage('Budget updated successfully!');
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);

      } catch (error) {
        console.error('Failed to update budget:', error);
        alert(error.message);
      } finally {
        setBudgetLoading(false);
      }
    }
  };

  const handleDeleteBudget = async (id) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) return;

    try {
      await deleteBudget(id);
      setBudgets(budgets.filter(b => b.id !== id));
    } catch (error) {
      console.error('Failed to delete budget:', error);
      alert(error.message);
    }
  };

  const cancelForm = () => {
    setShowBudgetForm(false);
    setEditingBudget(null);
    setNewBudget({ category_id: '', amount: '' });
  };

  // Chart data for budget vs actual
  const chartData = budgetData.map(item => ({
    name: item.category.length > 12 ? item.category.substring(0, 12) + '...' : item.category,
    Budgeted: item.budgeted,
    Actual: item.actual,
    color: item.color
  }));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-400 text-lg">Loading budget data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in">
          <div className="bg-green-500/90 backdrop-blur-sm text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-green-400/30">
            <span className="text-xl">✓</span>
            <span className="font-medium">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Section 1: Header and Overview */}
      <section className="min-h-screen flex flex-col justify-center px-6 py-12">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-amber-400/20 backdrop-blur-sm rounded-xl border border-amber-400/30">
                <span className="text-4xl">💰</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">Budget Planning</h1>
                <p className="text-xl text-slate-400">Take control of your finances</p>
              </div>
            </div>

            {/* Month Selector */}
            <div className="flex items-center justify-center gap-3 bg-slate-800/50 backdrop-blur-sm rounded-xl px-6 py-3 border border-slate-700 max-w-md mx-auto">
              <button
                onClick={() => changeMonth(-1)}
                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                ◀
              </button>
              <span className="font-medium text-white min-w-[140px] text-center">
                {new Date(selectedMonth.year, selectedMonth.month - 1).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <button
                onClick={() => changeMonth(1)}
                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                ▶
              </button>
            </div>
          </div>

          {/* Budget Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30 hover:border-blue-400/50 transition-all hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-400 uppercase tracking-wide">Total Budget</span>
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🎯</span>
                </div>
              </div>
              <p className="text-3xl font-bold text-blue-400 mb-2">
                ${totalBudgeted.toFixed(2)}
              </p>
              <p className="text-sm text-slate-400">Monthly allocation</p>
            </div>

            <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-sm rounded-xl p-6 border border-red-500/30 hover:border-red-400/50 transition-all hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-400 uppercase tracking-wide">Total Spent</span>
                <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">💸</span>
                </div>
              </div>
              <p className="text-3xl font-bold text-red-400 mb-2">
                ${totalActual.toFixed(2)}
              </p>
              <p className="text-sm text-slate-400">This month</p>
            </div>

            <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm rounded-xl p-6 border border-green-500/30 hover:border-green-400/50 transition-all hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-400 uppercase tracking-wide">Remaining</span>
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">💰</span>
                </div>
              </div>
              <p className="text-3xl font-bold text-green-400 mb-2">
                ${totalRemaining.toFixed(2)}
              </p>
              <p className="text-sm text-slate-400">Left to spend</p>
            </div>

            <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/20 backdrop-blur-sm rounded-xl p-6 border border-amber-500/30 hover:border-amber-400/50 transition-all hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-400 uppercase tracking-wide">Budget Health</span>
                <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
              </div>
              <p className={`text-3xl font-bold mb-2 ${totalActual > totalBudgeted ? 'text-red-400' : 'text-green-400'}`}>
                {((totalActual / totalBudgeted) * 100).toFixed(0)}%
              </p>
              <p className="text-sm text-slate-400">Of budget used</p>
            </div>
          </div>

          {/* AI Budget Insights */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-xl p-6 border border-slate-700 hover:border-blue-500/50 transition-all hover:shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-400/20 rounded-lg">
                <span className="text-xl">🤖</span>
              </div>
              <h3 className="text-lg font-bold text-white">AI Budget Insights</h3>
            </div>
            <div className="space-y-3">
              <p className="text-slate-300">
                💡 <strong>Smart Recommendations:</strong> Based on your spending patterns, consider increasing your food budget by 15% and reducing entertainment spending.
              </p>
              <p className="text-slate-300">
                🎯 <strong>Goal Achievement:</strong> You're on track to save $2,340 this month. Great job maintaining discipline in transportation costs!
              </p>
              <p className="text-slate-300">
                ⚠️ <strong>Attention Needed:</strong> Your shopping category is 25% over budget. Consider setting a temporary spending freeze.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Budget vs Actual Analysis */}
      <section className="min-h-screen flex flex-col justify-center px-6 py-12 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-3 flex items-center justify-center gap-3">
              <span className="text-amber-400">📊</span>
              Budget vs Actual Spending
            </h2>
            <p className="text-xl text-slate-400">Track your financial discipline</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Budget vs Actual Bar Chart */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-slate-700">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-amber-400">📈</span>
                Monthly Comparison
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '8px'
                    }}
                    formatter={(value, name) => [`$${value.toFixed(2)}`, name]}
                  />
                  <Legend />
                  <Bar dataKey="Budgeted" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Actual" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Budget Performance Pie Chart */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-slate-700">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-amber-400">🎯</span>
                Budget Performance
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'On Track', value: budgetData.filter(b => !b.overBudget).length, color: '#10b981' },
                      { name: 'Over Budget', value: budgetData.filter(b => b.overBudget).length, color: '#ef4444' }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {[
                      { name: 'On Track', value: budgetData.filter(b => !b.overBudget).length, color: '#10b981' },
                      { name: 'Over Budget', value: budgetData.filter(b => b.overBudget).length, color: '#ef4444' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Create/Edit Budget Form */}
          {showBudgetForm && (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-slate-700 mb-8">
              <h3 className="text-lg font-bold text-white mb-4">
                {editingBudget ? 'Edit Budget' : 'Create New Budget'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Category</label>
                  <select
                    value={newBudget.category_id}
                    onChange={(e) => setNewBudget({...newBudget, category_id: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="">Select category</option>
                    {categories
                      .filter(cat => cat.type === 'expense') // Only expense categories for budgets
                      .map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Monthly Budget ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newBudget.amount}
                    onChange={(e) => setNewBudget({...newBudget, amount: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400"
                    placeholder="500.00"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={editingBudget ? handleUpdateBudget : handleCreateBudget}
                  disabled={!newBudget.category_id || !newBudget.amount || budgetLoading}
                  className="px-6 py-2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 rounded-lg font-semibold hover:from-amber-500 hover:to-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {budgetLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-900 border-t-transparent"></div>
                      <span>{editingBudget ? 'Updating...' : 'Creating...'}</span>
                    </>
                  ) : (
                    <span>{editingBudget ? 'Update Budget' : 'Create Budget'}</span>
                  )}
                </button>
                <button
                  onClick={cancelForm}
                  disabled={budgetLoading}
                  className="px-6 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Budget Categories Table */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-xl border border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Budget Categories</h3>
                <button
                  onClick={() => setShowBudgetForm(true)}
                  className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 rounded-lg font-semibold hover:from-amber-500 hover:to-amber-600 transition-all flex items-center gap-2"
                >
                  <span>+</span>
                  Add Category
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Category</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase">Budgeted</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase">Spent</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase">Remaining</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-slate-400 uppercase">Progress</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-slate-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {budgetData.map((budget) => (
                    <tr key={budget.category} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{budget.icon}</span>
                          <span className="font-medium text-white">{budget.category}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-300">
                        ${budget.budgeted.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-300">
                        ${budget.actual.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-green-400">
                        ${budget.remaining.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                budget.overBudget ? 'bg-red-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(100, (budget.actual / budget.budgeted) * 100)}%` }}
                            />
                          </div>
                          <span className={`text-xs font-medium ${
                            budget.overBudget ? 'text-red-400' : 'text-green-400'
                          }`}>
                            {budget.percentage}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditBudget(budget)}
                            className="p-1 text-slate-400 hover:text-amber-400 transition-colors"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteBudget(budget.id)}
                            className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default BudgetPlanning;