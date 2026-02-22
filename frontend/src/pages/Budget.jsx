/**
 * Budget Planning & Management Page
 * Dark Mode Finance Tracker - Professional budget management with AI insights
 */
import { useState, useEffect } from 'react';
import { getMonthlyAnalytics, getTransactions, getBudgets, createBudget, updateBudget, deleteBudget, getCategories, copyLastMonthBudgets, createTransaction, getCurrentUser } from '../api';
import { getModelInfo } from '../pages/DashboardUtils';
import { useTheme } from '../context/ThemeContext';
import { Card, Button } from '../components/UI';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, LineChart, Line } from 'recharts';
import { getCacheKey, clearInsightsCache, loadCachedInsights, saveInsightsToCache } from '../utils/cache';
import { RefreshCw, Target, DollarSign, Wallet, HeartPulse, Bot, Trash2, Pencil, Copy, History, ArrowUpRight, ArrowDownLeft, TrendingUp, AlertCircle } from 'lucide-react';

// Dark mode chart colors - professional finance palette with unified design
const CHART_COLORS = {
  income: '#10b981', // emerald-500
  expense: '#ef4444', // red-500
  savings: '#3b82f6', // blue-500
  accent: '#3b82f6',  // blue-500
  budget: '#6366f1',     // Indigo 500 for budget
  actual: '#f43f5e',     // Rose 500 for actual spending
  overBudget: '#f59e0b', // Amber 500 for over budget
  underBudget: '#10b981', // Emerald 500 for under budget
  categories: [
    '#f59e0b', // amber-500
    '#fbbf24', // amber-400
    '#fcd34d', // amber-300
    '#fb923c', // orange-400
    '#f97316', // orange-500
    '#10b981', // emerald-500
    '#34d399', // emerald-400
    '#0ea5e9', // sky-500
    '#38bdf8', // sky-400
    '#8b5cf6', // violet-500
    '#a78bfa', // violet-400
    '#ec4899', // pink-500
    '#f472b6', // pink-400
  ],
};

// Enhanced custom tooltip style with theme support
const CustomTooltipComponent = (theme) => ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className={`${theme === 'dark' ? 'bg-slate-900/95 border-slate-700' : 'bg-white/95 border-slate-200'} backdrop-blur-xl border-2 rounded-3xl p-4 shadow-2xl animate-in fade-in zoom-in duration-300`}>
        <p className={`${theme === 'dark' ? 'text-white' : 'text-slate-900'} font-black mb-3 text-base tracking-tight`}>{label}</p>
        <div className="space-y-2">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full shadow-sm"
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} text-sm font-bold`}>{entry.name}:</span>
              </div>
              <span className={`${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'} font-black text-sm`}>
                  {entry.value.toLocaleString('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

function BudgetPlanning() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const [viewMode, setViewMode] = useState('monthly'); // 'monthly', 'yearly', or 'overall'
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [newBudget, setNewBudget] = useState({ category_id: '', amount: '' });
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [aiBudgetInsights, setAiBudgetInsights] = useState('');
  const [budgetModelUsed, setBudgetModelUsed] = useState(null);
  const [currentTryingBudgetModel, setCurrentTryingBudgetModel] = useState(null);
  const [budgetInsightsLoading, setBudgetInsightsLoading] = useState(false);
  const { theme } = useTheme();

  // Check if categories are loaded
  useEffect(() => {
    console.log('🔄 Categories updated:', categories.length);
  }, [categories]);

  // Log state changes for debugging
  useEffect(() => {
    console.log('💎 Selected month changed to:', selectedMonth);
  }, [selectedMonth]);


  useEffect(() => {
    loadData();

    // Listen for transaction-added event to refresh data
    const handleTransactionAdded = () => {
      loadData(false); // Load without full screen loading state
    };
    window.addEventListener('transaction-added', handleTransactionAdded);

    return () => {
      window.removeEventListener('transaction-added', handleTransactionAdded);
    };
  }, [selectedMonth, viewMode]);

  // Generate AI insights when budgets or transactions change
  useEffect(() => {
    if (!loading && budgets.length > 0) {
      generateBudgetInsights();
    } else if (!loading && budgets.length === 0) {
      // If no budgets, display a default message
      setAiBudgetInsights('💰 <strong>No Budgets Set:</strong> Create some budgets to get AI insights!\n\n🎯 <strong>Get Started:</strong> Set monthly spending limits for your categories.\n\n📊 <strong>Tip:</strong> Budgeting helps you take control of your finances.');
      setBudgetModelUsed(null);
      setBudgetInsightsLoading(false);
      // Clear AI insights cache since budget data changed
      clearInsightsCache(); // Clear any partial or invalid cache
    }
  }, [budgets, loading, transactions, selectedMonth, viewMode]);

  // Get date range based on view mode
  const getDateRange = () => {
    if (viewMode === 'monthly') {
      // Monthly: from 1st to last day of selected month
      const startDate = new Date(selectedMonth.year, selectedMonth.month - 1, 1);
      const endDate = new Date(selectedMonth.year, selectedMonth.month, 0);
      return { startDate, endDate };
    } else if (viewMode === 'yearly') {
      // Yearly: entire year
      const startDate = new Date(selectedMonth.year, 0, 1);
      const endDate = new Date(selectedMonth.year, 11, 31);
      return { startDate, endDate };
    } else {
      // Overall: all time (very far past to future)
      return { startDate: new Date(1900, 0, 1), endDate: new Date(2100, 11, 31) };
    }
  };

  const loadData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [analyticsData, transactionsData, budgetsData, categoriesData, userData] = await Promise.all([
        getMonthlyAnalytics(selectedMonth.year, selectedMonth.month),
        getTransactions(),
        getBudgets(selectedMonth.year, selectedMonth.month),
        getCategories(),
        getCurrentUser()
      ]);

      // Handle both old format (array) and new format (object with pagination)
      const allTransactions = transactionsData?.transactions || (Array.isArray(transactionsData) ? transactionsData : []);
      
      // Calculate filtered transactions for current view period
      const { startDate, endDate } = getDateRange();
      const filteredTransactions = allTransactions.filter(t => {
        const d = new Date(t.date);
        return d >= startDate && d <= endDate;
      });
      
      console.log(`🔍 Data loaded. Total transactions: ${allTransactions.length}, Period transactions: ${filteredTransactions.length}`);

  // Calculate Available Balance for Sidebar
      const totalIncome = allTransactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);
      const actualSpending = allTransactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      const availableBalance = totalIncome - actualSpending;

      setAnalytics(analyticsData);
      setTransactions(allTransactions); 
      setBudgets(budgetsData);
      setCategories(categoriesData);
      
      // Update local user state for sidebar
      if (userData) {
        const userWithBalance = {
          ...userData,
          available_balance: availableBalance
        };
        setUser(userWithBalance);
        
        // Also update the global user state if it exists (for sidebar sync)
        if (window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('user-updated', { detail: userWithBalance }));
        }
      }

    } catch (error) {
      console.error('Failed to load data:', error);
      throw error; // Rethrow so callers know it failed
    } finally {
      setLoading(false);
    }
  };

  // Add function to get currency symbol
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const generateBudgetInsights = async () => {
    if (budgetInsightsLoading) return; // Prevent multiple simultaneous calls

    // Reset states before potential generation
    setBudgetInsightsLoading(true);
    setAiBudgetInsights('');
    setBudgetModelUsed(null);
    setCurrentTryingBudgetModel(null);

    // Generate current cache key
    const currentCacheKey = getCacheKey(budgets, transactions, selectedMonth);

    // Try to load from cache first
    const cachedData = loadCachedInsights(currentCacheKey);
    if (cachedData) {
      setAiBudgetInsights(cachedData.insights);
      setBudgetModelUsed(cachedData.model);
      setBudgetInsightsLoading(false);
      console.log('✅ Loaded cached insights, no API call.');
      return; // Exit if successfully loaded from cache
    }

    if (!budgets || budgets.length === 0) {
      console.log('No budgets to analyze, skipping insights generation');
      setAiBudgetInsights('💰 <strong>No Budgets Set:</strong> Create some budgets to get AI insights!\n\n🎯 <strong>Get Started:</strong> Set monthly spending limits for your categories.\n\n📊 <strong>Tip:</strong> Budgeting helps you take control of your finances.');
      setBudgetModelUsed(null);
      setBudgetInsightsLoading(false);
      clearInsightsCache(); // Clear any partial or invalid cache
      return;
    }

    // Maximum timeout to prevent infinite loading
    const maxTimeout = setTimeout(() => {
      console.warn('Budget insights generation timed out, using fallback');
      setAiBudgetInsights('💰 <strong>Budget Check:</strong> Monitor your spending to stay within budget limits.\n\n🎯 <strong>Savings Goal:</strong> Focus on consistent saving habits.\n\n📊 <strong>Tip:</strong> Regular budget reviews help maintain financial health.');
      setBudgetInsightsLoading(false);
    }, 15000); // 15 second maximum timeout

    try {
      // Use Server-Sent Events for real-time progress (similar to main AI)
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('token');

      if (!token) {
        console.error('❌ No token found');
        setBudgetInsightsLoading(false);
        return;
      }

      const eventSourceUrl = `${API_URL}/ai/progress?year=${selectedMonth.year}&month=${selectedMonth.month}&token=${token}`;

      const eventSource = new EventSource(eventSourceUrl);
      let hasReceivedMessage = false;

      const timeout = setTimeout(() => {
        if (!hasReceivedMessage) {
          console.warn('SSE timeout, using fallback');
          eventSource.close();
          generateBudgetInsightsFallback();
        }
      }, 5000);

      const generateBudgetInsightsFallback = async () => {
        try {
          // Calculate budget stats for fallback message
          const actualSpending = getActualSpending();
          const overBudgetCount = budgets.filter(budget => {
            const categoryName = budget.category?.name || 'Unknown';
            const actual = actualSpending[categoryName] || 0;
            const budgeted = budget.amount;
            return actual > budgeted;
          }).length;

          const fallbackMessage = `💰 **Budget Check:** ${overBudgetCount > 0 ? `${overBudgetCount} categories are over budget. Consider adjusting spending.` : 'Your budgets are on track! Great financial discipline.'}\n\n🎯 **Savings Goal:** Aim to save at least 20% of your income.\n\n📊 **Tip:** Track your expenses daily for better control.`;

          // Convert markdown to HTML in fallback message
          const htmlMessage = fallbackMessage.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          setAiBudgetInsights(htmlMessage);
          setBudgetModelUsed('fallback-model');
        } catch (error) {
          setAiBudgetInsights('💰 <strong>Budget Check:</strong> Monitor your spending to stay within budget limits.\n\n🎯 <strong>Savings Goal:</strong> Focus on consistent saving habits.\n\n📊 <strong>Tip:</strong> Regular budget reviews help maintain financial health.');
        } finally {
          clearTimeout(maxTimeout);
          setBudgetInsightsLoading(false);
        }
      };

      eventSource.onmessage = (event) => {
        hasReceivedMessage = true;
        clearTimeout(timeout);

        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'trying_model':
              setCurrentTryingBudgetModel(data.model);
              break;
            case 'success':
              clearTimeout(maxTimeout);
              // Use the actual AI summary if available, otherwise generate simple insights
              const aiSummary = data.summary;
              let insights = '';
              
              if (aiSummary) {
                // Convert markdown-style bold to HTML strong tags
                insights = aiSummary
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\n/g, '<br/>');
              } else {
                const context = data.context;
                const budgetStatus = context.budget_status || [];

                if (budgetStatus.length > 0) {
                  const overBudget = budgetStatus.filter(b => b.status === 'over').length;
                  const onTrack = budgetStatus.filter(b => b.status === 'on_track').length;

                  if (overBudget > 0) {
                    insights += `💰 <strong>Budget Alert:</strong> ${overBudget} categories are over budget. Time to adjust spending!\n\n`;
                  } else if (onTrack > 0) {
                    insights += `✅ <strong>Great Job:</strong> ${onTrack} categories are on track. Keep it up!\n\n`;
                  }
                } else {
                  insights += `💰 <strong>Budget Check:</strong> Start creating budgets to track your spending.\n\n`;
                }

                insights += `🎯 <strong>Savings Focus:</strong> Aim for 20% savings rate this month.\n\n`;
                insights += `📊 <strong>Pro Tip:</strong> Review budgets weekly for better control.`;
              }

              setAiBudgetInsights(insights);
              setBudgetModelUsed(data.model);
              setBudgetInsightsLoading(false);
              eventSource.close();

              // Cache the successful result and update last used cache key
              saveInsightsToCache(currentCacheKey, insights, data.model, selectedMonth);
              break;
            case 'model_failed':
              console.warn(`Model ${data.model} failed: ${data.reason}`);
              setCurrentTryingBudgetModel(`Failed: ${data.model}. Trying next...`);
              break;
            case 'error':
              clearTimeout(maxTimeout);
              setAiBudgetInsights(`💰 <strong>AI Busy:</strong> ${data.message || 'All AI models are currently busy.'}<br/><br/>🎯 <strong>Tip:</strong> Try again in a few moments or check your internet connection.`);
              setBudgetInsightsLoading(false);
              eventSource.close();
              break;
          }
        } catch (e) {
          console.error('Failed to parse SSE data:', event.data, e);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE Error:', error);
        clearTimeout(timeout);
        if (!hasReceivedMessage) {
          generateBudgetInsightsFallback();
        } else {
          setBudgetInsightsLoading(false);
        }
        eventSource.close();
      };

    } catch (error) {
      clearTimeout(maxTimeout);
      console.error('Budget insights generation failed:', error);
      setAiBudgetInsights('💰 <strong>Budget Check:</strong> Track your spending patterns.\n\n🎯 <strong>Savings Goal:</strong> Build consistent saving habits.\n\n📊 <strong>Tip:</strong> Regular financial reviews are key.\n\n<span class="text-red-400">Error: Unable to generate insights.</span>');
      setBudgetInsightsLoading(false);
    }
  };

  // Calculate actual spending by category for current period (month or year)
  const getActualSpending = () => {
    const { startDate, endDate } = getDateRange();
    const periodTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate &&
             transactionDate <= endDate &&
             t.amount < 0; // Negative amounts = expenses
    });

    console.log('💸 Period expense transactions:', periodTransactions.length);

    const spendingByCategory = {};
    periodTransactions.forEach(t => {
      const category = t.category_name || 'Uncategorized';
      spendingByCategory[category] = (spendingByCategory[category] || 0) + Math.abs(t.amount);
    });

    console.log('📊 Spending by category:', spendingByCategory);
    return spendingByCategory;
  };

  // Prepare budget vs actual data
  const prepareBudgetData = () => {
    const actualSpending = getActualSpending();
    const budgetData = budgets.map(budget => {
      const categoryName = budget.category?.name || 'Unknown';
      const actual = actualSpending[categoryName] || 0;
      const budgeted = budget.amount;
      const percentage = budgeted > 0 ? ((actual / budgeted) * 100).toFixed(1) : 0;
      const remaining = Math.max(0, budgeted - actual);
      const overBudget = actual > budgeted;

      console.log(`🎯 Budget for ${categoryName}: Budgeted $${budgeted}, Actual $${actual}, ${percentage}% used`);

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

    console.log('📈 Final budget data:', budgetData);
    return budgetData;
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

        // Clear AI insights cache since budget data changed
        clearInsightsCache();
        setAiBudgetInsights(''); // Clear current insights to trigger regeneration

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

  const handleCopyLastMonth = async () => {
    setBudgetLoading(true);
    try {
      const result = await copyLastMonthBudgets(selectedMonth.year, selectedMonth.month);
      
      // Reload budgets
      const budgetsData = await getBudgets(selectedMonth.year, selectedMonth.month);
      setBudgets(budgetsData);
      
      // Clear AI insights cache
      clearInsightsCache();
      setAiBudgetInsights('');

      // Show success message
      setToastMessage(result.message);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (error) {
      console.error('Failed to copy budgets:', error);
      alert(error.detail || 'Failed to copy budgets from last month');
    } finally {
      setBudgetLoading(false);
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

        // Clear AI insights cache since budget data changed
        clearInsightsCache();
        setAiBudgetInsights(''); // Clear current insights to trigger regeneration

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

      // Clear AI insights cache since budget data changed
      clearInsightsCache();
      setAiBudgetInsights(''); // Clear current insights to trigger regeneration
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

  const changeMonth = (offset) => {
    let newMonth = selectedMonth.month + offset;
    let newYear = selectedMonth.year;

    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }

    setSelectedMonth({ year: newYear, month: newMonth });
  };

  const changeYear = (offset) => {
    setSelectedMonth({ ...selectedMonth, year: selectedMonth.year + offset });
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
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-[#0a0f1d]' : 'bg-slate-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-[2rem] h-20 w-20 border-4 border-amber-500 border-t-transparent mx-auto mb-8 shadow-2xl shadow-amber-500/20"></div>
          <p className={`${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'} text-2xl font-black tracking-tight animate-pulse`}>Loading your budget...</p>
        </div>
      </div>
    );
  }

  console.log('🎨 Rendering BudgetPlanning. categories count:', categories.length);

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#0a0e27] text-white' : 'bg-slate-50 text-slate-900'} transition-colors duration-500 overflow-x-hidden selection:bg-amber-500/30`}>
      {/* Global Background Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 ${theme === 'dark' ? 'bg-amber-500/30' : 'bg-amber-200/40'}`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 ${theme === 'dark' ? 'bg-amber-600/20' : 'bg-amber-100/30'}`} />
      </div>

      <div className="relative z-10">
        {/* Success Toast */}
        {showSuccessToast && (
          <div className="fixed top-24 right-8 z-[100] animate-in fade-in slide-in-from-right-10 duration-500">
            <div className="bg-emerald-500 text-white px-8 py-4 rounded-[1.5rem] shadow-2xl shadow-emerald-500/40 flex items-center gap-3 border-2 border-emerald-400/50">
              <div className="bg-white/20 p-1.5 rounded-lg">
                <RefreshCw className="w-5 h-5 animate-spin-slow" />
              </div>
              <span className="font-black uppercase tracking-[0.2em]">{toastMessage}</span>
            </div>
          </div>
        )}

        {/* Section 1: Header and Overview */}
        <section className="relative py-16 px-6 md:px-12">
          <div className="max-w-[1400px] mx-auto w-full">
            <div className="text-center mb-20 animate-in fade-in slide-in-from-top-10 duration-700">
              <div className="flex flex-col items-center gap-6 mb-8">
                <div className="p-6 bg-amber-500 rounded-[2.5rem] shadow-2xl shadow-amber-500/40 transform -rotate-6 hover:rotate-0 transition-all duration-500">
                  <Target className="w-12 h-12 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h1 className={`text-header-unified mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    Budget <span className="text-amber-500">Planning</span>
                  </h1>
                  <p className={`text-xl md:text-2xl font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} max-w-2xl mx-auto tracking-tight`}>
                    Master your cash flow and hit your financial goals with AI-powered budgeting.
                  </p>
                </div>
              </div>

              {/* View Mode Toggle & Date Selector */}
              <div className="flex flex-wrap items-center justify-center gap-6">
                {/* View Mode Toggle */}
                <div className={`flex items-center gap-2 ${theme === 'dark' ? 'bg-slate-800/40 border-slate-700/50' : 'bg-white/80 border-slate-200'} backdrop-blur-xl rounded-[2rem] p-2 border-2 shadow-xl`}>
                  {['monthly', 'yearly', 'overall'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-8 py-3 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] transition-all duration-500 ${
                        viewMode === mode
                          ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-105'
                          : theme === 'dark'
                          ? 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                {/* Date Selector */}
                {viewMode !== 'overall' && (
                  <div className={`flex items-center justify-center gap-6 ${theme === 'dark' ? 'bg-slate-800/40 border-slate-700/50' : 'bg-white/80 border-slate-200'} backdrop-blur-xl rounded-[2rem] px-8 py-3 border-2 shadow-xl`}>
                    <button
                      onClick={() => viewMode === 'monthly' ? changeMonth(-1) : changeYear(-1)}
                      className={`p-3 ${theme === 'dark' ? 'hover:bg-slate-700 text-amber-500' : 'hover:bg-slate-100 text-amber-600'} rounded-2xl transition-all active:scale-90 shadow-sm`}
                    >
                      <span className="text-xl font-black">◀</span>
                    </button>
                    <span className={`text-xl font-black tracking-[0.2em] uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-900'} min-w-[180px] text-center`}>
                      {viewMode === 'monthly'
                        ? new Date(selectedMonth.year, selectedMonth.month - 1).toLocaleDateString('en-US', {
                            month: 'long',
                            year: 'numeric',
                          })
                        : `Year ${selectedMonth.year}`
                      }
                    </span>
                    <button
                      onClick={() => viewMode === 'monthly' ? changeMonth(1) : changeYear(1)}
                      className={`p-3 ${theme === 'dark' ? 'hover:bg-slate-700 text-amber-500' : 'hover:bg-slate-100 text-amber-600'} rounded-2xl transition-all active:scale-90 shadow-sm`}
                    >
                      <span className="text-xl font-black">▶</span>
                    </button>
                  </div>
                )}
                {viewMode === 'overall' && (
                  <div className={`flex items-center justify-center gap-3 ${theme === 'dark' ? 'bg-slate-800/40 border-slate-700/50' : 'bg-white/80 border-slate-200'} backdrop-blur-xl rounded-[2rem] px-8 py-4 border-2 shadow-xl`}>
                    <span className={`text-xl font-black tracking-[0.2em] uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>All Time Data</span>
                  </div>
                )}
              </div>
            </div>

            {/* Budget Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
              {[
                { label: 'Total Budget', value: totalBudgeted, icon: Target, color: 'blue', desc: 'Monthly allocation' },
                { label: 'Total Spent', value: totalActual, icon: DollarSign, color: 'rose', desc: 'This period' },
                { label: 'Remaining', value: totalRemaining, icon: Wallet, color: 'emerald', desc: 'Left to spend' },
                { label: 'Budget Health', value: totalBudgeted > 0 ? (totalActual / totalBudgeted) * 100 : 0, icon: HeartPulse, color: 'amber', isPercent: true, desc: 'Of budget used' }
              ].map((card, i) => (
                <Card 
                  key={i}
                  className="group animate-in fade-in slide-in-from-bottom-10 duration-700 overflow-hidden relative"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="flex items-center justify-between mb-8">
                    <span className={`text-sm font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                      {card.label}
                    </span>
                    <div className={`w-14 h-14 bg-${card.color}-500/20 rounded-[1.25rem] flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-${card.color}-500/10`}>
                      <card.icon 
                        className={`w-8 h-8 text-${card.color}-500`} 
                        strokeWidth={2.5} 
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 relative z-10">
                    <p 
                      className={`text-4xl font-black tracking-tight text-${card.color}-500`}
                    >
                      {card.isPercent 
                        ? `${card.value.toFixed(0)}%` 
                        : `EGP ${card.value.toLocaleString('en-EG', { maximumFractionDigits: 0 })}`}
                    </p>
                    <p className={`text-sm font-bold ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                      {card.desc}
                    </p>
                  </div>

                  {/* Decorative background icon – same color as icon but faded */}
                  <card.icon 
                    className={`absolute -bottom-8 -right-8 w-40 h-40 text-slate-500 -rotate-12 group-hover:rotate-0 transition-all duration-700 ease-out`}
                  />
                </Card>
              ))}
            </div>

            {/* AI Budget Insights - Smart Caching */}
            <Card className="p-10 animate-in fade-in slide-in-from-bottom-10 duration-700 relative overflow-hidden mb-16" style={{ animationDelay: '400ms' }}>
              {/* Model Badge */}
              {budgetModelUsed && (
                <div className="absolute top-8 right-8 z-10">
                  {(() => {
                    const modelInfo = getModelInfo(budgetModelUsed);
                    const colorMap = {
                      emerald: 'from-emerald-500/20 to-green-500/20 border-emerald-400/50 text-emerald-300',
                      blue: 'from-blue-500/20 to-cyan-500/20 border-blue-400/50 text-blue-300',
                      cyan: 'from-cyan-500/20 to-blue-500/20 border-cyan-400/50 text-cyan-300',
                      purple: 'from-purple-500/20 to-pink-500/20 border-purple-400/50 text-purple-300',
                      green: 'from-green-500/20 to-emerald-500/20 border-green-400/50 text-green-300',
                      orange: 'from-orange-500/20 to-yellow-500/20 border-orange-400/50 text-orange-300',
                      pink: 'from-pink-500/20 to-rose-500/20 border-pink-400/50 text-pink-300',
                      gray: 'from-gray-500/20 to-slate-500/20 border-gray-400/50 text-gray-300',
                      yellow: 'from-yellow-500/20 to-amber-500/20 border-yellow-400/50 text-yellow-300',
                      amber: 'from-amber-500/20 to-yellow-500/20 border-amber-400/50 text-amber-300'
                    };
                    const colorClass = colorMap[modelInfo.color] || colorMap.amber;

                    return (
                      <div className={`bg-gradient-to-br ${colorClass} backdrop-blur-xl rounded-2xl px-5 py-2.5 border-2 shadow-xl flex items-center gap-3 transform hover:scale-105 transition-transform duration-300`}>
                        {modelInfo.logo.startsWith('http') ? (
                          <img src={modelInfo.logo} alt={modelInfo.name} className="w-5 h-5 object-contain rounded-lg" />
                        ) : (
                          <span className="text-lg">{modelInfo.logo}</span>
                        )}
                        <span className="font-black tracking-[0.2em] text-sm uppercase">{modelInfo.name}</span>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="flex items-center gap-4 mb-10">
                <div className="p-4 bg-amber-500/10 rounded-2xl border-2 border-amber-500/20 shadow-inner">
                  {budgetInsightsLoading && currentTryingBudgetModel ? (
                    (() => {
                      const modelInfo = getModelInfo(currentTryingBudgetModel);
                      return modelInfo.logo.startsWith('http') ? (
                        <img src={modelInfo.logo} alt={modelInfo.name} className="w-8 h-8 object-contain animate-pulse rounded-lg" />
                      ) : (
                        <span className="text-3xl animate-pulse">{modelInfo.logo}</span>
                      );
                    })()
                  ) : budgetInsightsLoading ? (
                    <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
                  ) : (
                    (() => {
                      // Check for insight sentiment and return appropriate icon/color
                      const insightText = aiBudgetInsights?.toLowerCase() || '';
                      
                      // Keywords for positive sentiment
                      const isPositive = 
                        insightText.includes('great job') || 
                        insightText.includes('on track') || 
                        insightText.includes('well done') || 
                        insightText.includes('excellent') ||
                        insightText.includes('healthy') ||
                        insightText.includes('discipline');
                        
                      // Keywords for negative/bad sentiment
                      const isBad = 
                        insightText.includes('alert') || 
                        insightText.includes('over budget') || 
                        insightText.includes('warning') || 
                        insightText.includes('critical') ||
                        insightText.includes('danger');
                        
                      // Keywords for moderate sentiment (if not positive or bad)
                      const isModerate = 
                        insightText.includes('careful') || 
                        insightText.includes('monitor') || 
                        insightText.includes('adjust') ||
                        insightText.includes('attention');
                      
                      if (isPositive) return <TrendingUp className="w-8 h-8 text-emerald-500" strokeWidth={2.5} />;
                      if (isBad) return <Target className="w-8 h-8 text-rose-500" strokeWidth={2.5} />;
                      if (isModerate) return <AlertCircle className="w-8 h-8 text-amber-500" strokeWidth={2.5} />;
                      
                      // Default to Bot if unclear
                      return <Bot className="w-8 h-8 text-amber-500" strokeWidth={2.5} />;
                    })()
                  )}
                </div>
                <h3 className={`text-3xl font-black tracking-[0.2em] uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>AI Smart Insights</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
                <div className="md:col-span-8 space-y-6 pr-10 border-r-2 border-slate-700/10">
                  {budgetInsightsLoading ? (
                    <div className="space-y-4">
                      <div className={`h-6 ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-200/50'} rounded-[1rem] animate-pulse w-full`}></div>
                      <div className={`h-6 ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-200/50'} rounded-[1rem] animate-pulse w-5/6`}></div>
                      <div className={`h-6 ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-200/50'} rounded-[1rem] animate-pulse w-4/6`}></div>
                    </div>
                  ) : aiBudgetInsights ? (
                    aiBudgetInsights.split('\n\n').map((line, index) => (
                      <div 
                        key={index} 
                        className={`text-lg font-bold leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} animate-in fade-in slide-in-from-left-5 duration-500`}
                        style={{ animationDelay: `${index * 100}ms` }}
                        dangerouslySetInnerHTML={{ __html: line }}
                      />
                    ))
                  ) : (
                    <p className={`text-xl font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} italic`}>Waiting for financial data to analyze...</p>
                  )}
                </div>

                <div className="md:col-span-4 flex flex-col justify-center h-full gap-6">
                  <div className={`p-6 rounded-[2rem] ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-100/50'} border-2 border-amber-500/10 shadow-inner`}>
                    <p className={`text-sm font-black uppercase tracking-[0.2em] mb-4 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Analysis Status</p>
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-3 h-3 rounded-full ${budgetInsightsLoading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'} shadow-lg shadow-current/20`}></div>
                      <span className="font-black text-lg tracking-[0.2em] uppercase">{budgetInsightsLoading ? 'Analyzing...' : 'Ready'}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-500 leading-tight">Your financial health is being monitored in real-time by AI models.</p>
                  </div>

                  <Button
                    onClick={() => {
                      clearInsightsCache();
                      generateBudgetInsights();
                    }}
                    loading={budgetInsightsLoading}
                    className="w-full !rounded-[1.5rem] !py-5 shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1"
                  >
                    <RefreshCw className={`w-6 h-6 ${budgetInsightsLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} strokeWidth={3} />
                    <span className="uppercase tracking-[0.2em]">{budgetInsightsLoading ? 'RECALCULATING...' : 'REFRESH INSIGHTS'}</span>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Section 2: Budget vs Actual Analysis */}
        <section className={`py-16 px-6 md:px-12 relative overflow-hidden ${theme === 'dark' ? 'bg-slate-900/40' : 'bg-white shadow-inner shadow-slate-100'}`}>
          <div className="max-w-[1400px] mx-auto w-full">
            <div className="text-center mb-20 animate-in fade-in slide-in-from-bottom-10 duration-700">
              <h2 className={`text-header-unified mb-6 ${theme === 'dark' ? 'text-white' : 'text-slate-900'} flex items-center justify-center gap-6`}>
                <div className="p-4 bg-amber-500 rounded-2xl shadow-xl rotate-3">
                  <Wallet className="w-10 h-10 text-white" strokeWidth={2.5} />
                </div>
                Budget <span className="text-amber-500">Analysis</span>
              </h2>
              <p className={`text-xl md:text-2xl font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} max-w-2xl mx-auto tracking-tight`}>
                Visualizing your spending patterns against your goals.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-16">
              {/* Budget vs Actual Bar Chart */}
              <Card className="lg:col-span-8 p-8 hover:shadow-2xl transition-all duration-700 relative overflow-hidden">
                <div className="flex items-center justify-between mb-10">
                  <h3 className={`text-2xl font-black tracking-[0.2em] uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Spending vs Limit</h3>
                  <div className={`px-4 py-2 rounded-xl ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-100/50'} border-2 border-slate-700/10 flex items-center gap-2`}>
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Real-time Data</span>
                  </div>
                </div>
                <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-4 flex items-center gap-2 uppercase tracking-[0.2em]`}>
                  <span className="text-blue-400">📈</span>
                  Monthly Comparison
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} opacity={0.3} vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke={theme === 'dark' ? '#94a3b8' : '#64748b'}
                      fontSize={12}
                      fontWeight="bold"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke={theme === 'dark' ? '#94a3b8' : '#64748b'}
                      fontSize={12}
                      fontWeight="bold"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `EGP ${value}`}
                    />
                    <Tooltip content={CustomTooltipComponent(theme)} cursor={{ fill: theme === 'dark' ? '#334155' : '#f1f5f9', opacity: 0.4 }} />
                    <Legend
                      wrapperStyle={{
                        color: theme === 'dark' ? '#94a3b8' : '#475569',
                        fontSize: '12px',
                        paddingTop: '20px',
                        fontWeight: 'bold'
                      }}
                    />
                    <Bar
                      dataKey="Budgeted"
                      fill={CHART_COLORS.budget}
                      radius={[10, 10, 0, 0]}
                      name="Budgeted"
                      maxBarSize={50}
                    />
                    <Bar
                      dataKey="Actual"
                      fill={CHART_COLORS.actual}
                      radius={[10, 10, 0, 0]}
                      name="Actual"
                      maxBarSize={50}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* Budget Performance Pie Chart */}
              <Card className="lg:col-span-4 p-8 hover:shadow-2xl transition-all duration-700 relative overflow-hidden">
                <h3 className={`text-2xl font-black tracking-[0.2em] uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-10`}>Performance</h3>
                <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-4 flex items-center gap-2 uppercase tracking-[0.2em]`}>
                  <span className="text-green-400">🎯</span>
                  Budget Health
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'On Track', value: budgetData.filter(b => !b.overBudget).length, color: CHART_COLORS.underBudget },
                        { name: 'Over Budget', value: budgetData.filter(b => b.overBudget).length, color: CHART_COLORS.overBudget }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={8}
                      dataKey="value"
                      stroke={theme === 'dark' ? '#1e293b' : '#ffffff'}
                      strokeWidth={4}
                    >
                      {[
                        { name: 'On Track', value: budgetData.filter(b => !b.overBudget).length, color: CHART_COLORS.underBudget },
                        { name: 'Over Budget', value: budgetData.filter(b => b.overBudget).length, color: CHART_COLORS.overBudget }
                      ].map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          style={{
                            filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))',
                            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                          }}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={CustomTooltipComponent(theme)} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      wrapperStyle={{
                        color: theme === 'dark' ? '#94a3b8' : '#475569',
                        fontSize: '12px',
                        paddingTop: '20px',
                        fontWeight: 'bold'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* Create/Edit Budget Form */}
            {showBudgetForm && (
              <Card className="p-10 mb-16 animate-in slide-in-from-top-10 duration-500 relative overflow-hidden">
                <h3 className={`text-2xl font-black tracking-[0.2em] uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-8`}>
                  {editingBudget ? 'Update Budget Plan' : 'New Budget Strategy'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <label className={`block text-xs font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} mb-3`}>Category</label>
                    <select
                      value={newBudget.category_id}
                      onChange={(e) => setNewBudget({...newBudget, category_id: e.target.value})}
                      className={`w-full px-6 py-4 rounded-[1.5rem] border-2 transition-all outline-none font-black text-sm ${
                        theme === 'dark' 
                          ? 'bg-slate-900/50 border-slate-800 text-white focus:border-amber-500/50' 
                          : 'bg-white border-slate-200 text-slate-900 focus:border-amber-500/50'
                      }`}
                    >
                      <option value="">Select category</option>
                      {categories
                        .filter(cat => cat.type === 'expense')
                        .map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.icon} {cat.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className={`block text-xs font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} mb-3`}>Monthly Budget (EGP)</label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-black text-amber-500">EGP</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newBudget.amount}
                        onChange={(e) => setNewBudget({...newBudget, amount: e.target.value})}
                        className={`w-full pl-16 pr-6 py-4 rounded-[1.5rem] border-2 transition-all outline-none font-black text-sm ${
                          theme === 'dark' 
                            ? 'bg-slate-900/50 border-slate-800 text-white focus:border-amber-500/50' 
                            : 'bg-white border-slate-200 text-slate-900 focus:border-amber-500/50'
                        }`}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={editingBudget ? handleUpdateBudget : handleCreateBudget}
                    loading={budgetLoading}
                    disabled={!newBudget.category_id || !newBudget.amount}
                    className="flex-1 !rounded-[1.5rem] !py-5 shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1"
                  >
                    <Target className="w-6 h-6" strokeWidth={3} />
                    <span className="uppercase tracking-[0.2em] font-black">{editingBudget ? 'SAVE CHANGES' : 'ESTABLISH BUDGET'}</span>
                  </Button>
                  <Button
                    onClick={cancelForm}
                    variant="secondary"
                    className="px-10 py-5 rounded-[1.5rem] font-black text-sm tracking-[0.2em] transition-all duration-500 uppercase hover:scale-[1.02] hover:-translate-y-1"
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            )}

            {/* Budget Categories Table */}
            <Card className="overflow-hidden shadow-2xl relative">
              <div className={`p-8 ${theme === 'dark' ? 'border-b-2 border-slate-700/30' : 'border-b-2 border-slate-100'}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h3 className={`text-2xl font-black tracking-[0.2em] uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Allocation Strategy</h3>
                    <p className={`text-sm font-bold ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} mt-1`}>Manage your spending limits by category</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <Button
                      onClick={handleCopyLastMonth}
                      loading={budgetLoading}
                      variant="secondary"
                      className="!px-6 !py-3 !rounded-2xl !text-xs uppercase tracking-[0.2em] transition-all duration-500 flex items-center gap-3 hover:scale-105"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copy Previous</span>
                    </Button>
                    <Button
                      onClick={() => setShowBudgetForm(true)}
                      className="!px-6 !py-3 !rounded-2xl !text-xs shadow-xl hover:scale-105"
                    >
                      <Target className="w-4 h-4" strokeWidth={3} />
                      <span className="uppercase tracking-[0.2em]">ADD CATEGORY</span>
                    </Button>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                {budgetData.length > 0 ? (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className={theme === 'dark' ? 'bg-slate-800/30' : 'bg-slate-50/50'}>
                        <th className={`px-8 py-6 text-left text-xs font-black ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-[0.2em]`}>Category</th>
                        <th className={`px-8 py-6 text-right text-xs font-black ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-[0.2em]`}>Allocated</th>
                        <th className={`px-8 py-6 text-right text-xs font-black ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-[0.2em]`}>Utilized</th>
                        <th className={`px-8 py-6 text-right text-xs font-black ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-[0.2em]`}>Remaining</th>
                        <th className={`px-8 py-6 text-center text-xs font-black ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-[0.2em]`}>Efficiency</th>
                        <th className={`px-8 py-6 text-center text-xs font-black ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-[0.2em]`}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y-2 ${theme === 'dark' ? 'divide-slate-700/20' : 'divide-slate-100'}`}>
                      {budgetData.map((budget) => (
                        <tr key={budget.category} className={`${theme === 'dark' ? 'hover:bg-slate-800/20' : 'hover:bg-slate-50/30'} transition-all duration-500 group`}>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-2xl shadow-inner border border-amber-500/20 group-hover:scale-110 transition-transform duration-500 group-hover:rotate-6">
                                {budget.icon}
                              </div>
                              <span className={`font-black text-lg tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{budget.category}</span>
                            </div>
                          </td>
                          <td className={`px-8 py-6 text-right font-black text-lg tracking-tight ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                            EGP {budget.budgeted.toLocaleString('en-EG', { maximumFractionDigits: 0 })}
                          </td>
                          <td className={`px-8 py-6 text-right font-black text-lg tracking-tight ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                            EGP {budget.actual.toLocaleString('en-EG', { maximumFractionDigits: 0 })}
                          </td>
                          <td className={`px-8 py-6 text-right font-black text-lg tracking-tight ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                            EGP {budget.remaining.toLocaleString('en-EG', { maximumFractionDigits: 0 })}
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4 min-w-[150px]">
                              <div className={`flex-1 ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'} rounded-full h-4 p-1 overflow-hidden shadow-inner`}>
                                <div
                                  className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${
                                    budget.overBudget ? 'bg-rose-500 shadow-rose-500/20' : 'bg-emerald-500 shadow-emerald-500/20'
                                  }`}
                                  style={{ width: `${Math.min(100, (budget.actual / budget.budgeted) * 100)}%` }}
                                />
                              </div>
                              <span className={`text-sm font-black min-w-[45px] ${
                                budget.overBudget ? 'text-rose-500' : 'text-emerald-500'
                              }`}>
                                {budget.percentage}%
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <div className="flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 transform group-hover:translate-x-0 translate-x-4">
                              <Button
                                onClick={() => handleEditBudget(budget)}
                                variant="secondary"
                                className={`!p-3 !rounded-xl transition-all duration-300 ${theme === 'dark' ? '!bg-slate-800 hover:!bg-slate-700 !text-amber-400 !border-slate-700' : '!bg-slate-100 hover:!bg-slate-200 !text-amber-600 !border-slate-200'} border-2 hover:scale-110 shadow-lg`}
                                title="Edit Strategy"
                              >
                                <Pencil className="w-5 h-5" />
                              </Button>
                              <Button
                                onClick={() => handleDeleteBudget(budget.id)}
                                variant="secondary"
                                className={`!p-3 !rounded-xl transition-all duration-300 ${theme === 'dark' ? '!bg-slate-800 hover:!bg-rose-900/40 !text-rose-400 !border-slate-700' : '!bg-slate-100 hover:!bg-rose-100 !text-rose-600 !border-slate-200'} border-2 hover:scale-110 shadow-lg`}
                                title="Dissolve Allocation"
                              >
                                <Trash2 className="w-5 h-5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-24 text-center">
                    <div className="w-24 h-24 bg-amber-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border-2 border-amber-500/20 shadow-inner animate-bounce-slow">
                      <Target className="w-12 h-12 text-amber-500" strokeWidth={2.5} />
                    </div>
                    <h4 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-4 uppercase tracking-[0.2em]`}>No budgets set for this period</h4>
                    <p className={`text-lg font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} mb-12 max-w-md mx-auto leading-relaxed`}>
                      Take control of your spending by setting monthly limits for your expense categories.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-6">
                      <Button
                        onClick={handleCopyLastMonth}
                        variant="secondary"
                        loading={budgetLoading}
                        className="!px-8 !py-4 !rounded-[1.5rem] !text-sm tracking-[0.2em] transition-all duration-500 flex items-center gap-3 uppercase hover:scale-105 hover:-translate-y-1"
                      >
                        <History className="w-5 h-5" />
                        <span>Copy Previous</span>
                      </Button>
                      <Button
                        onClick={() => setShowBudgetForm(true)}
                        className="!px-8 !py-4 !rounded-[1.5rem] !text-sm shadow-2xl hover:scale-105"
                      >
                        <Target className="w-5 h-5" strokeWidth={3} />
                        <span className="uppercase tracking-[0.2em]">Create First Budget</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </section>

      </div>
    </div>
  );
}

export default BudgetPlanning;
