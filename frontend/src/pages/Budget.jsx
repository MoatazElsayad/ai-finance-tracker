/**
 * Budget Planning & Management Page
 * Dark Mode Finance Tracker - Professional budget management with AI insights
 */
import { useState, useEffect } from 'react';
import { getMonthlyAnalytics, getTransactions, getBudgets, createBudget, updateBudget, deleteBudget, getCategories } from '../api';
import { useTheme } from '../context/ThemeContext';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, LineChart, Line } from 'recharts';
import { getCacheKey, clearInsightsCache, loadCachedInsights, saveInsightsToCache } from '../utils/cache';
import { RefreshCw, Target, DollarSign, Wallet, HeartPulse, Bot, Trash2, Pencil } from 'lucide-react';

// Dark mode chart colors - professional finance palette with unified design
const CHART_COLORS = {
  // Primary metrics - high contrast, professional colors
  income: '#00d4aa',     // Bright emerald green
  expense: '#ff6b6b',    // Soft coral red
  savings: '#ffd93d',    // Bright golden yellow
  accent: '#4ecdc4',     // Teal accent

  // Budget-specific colors
  budget: '#4ecdc4',     // Teal for budget
  actual: '#ff6b6b',     // Coral red for actual spending
  overBudget: '#f59e0b', // Orange for over budget
  underBudget: '#00d4aa', // Green for under budget

  // Unified category color palette - cohesive and visually appealing
  categories: [
    '#4ecdc4',  // Teal
    '#45b7d1',  // Sky blue
    '#96ceb4',  // Sage green
    '#ffeaa7',  // Cream yellow
    '#dda0dd',  // Plum
    '#98d8c8',  // Mint green
    '#f7dc6f',  // Golden yellow
    '#bb8fce',  // Light purple
    '#85c1e9',  // Light blue
    '#f8c471',  // Orange
    '#82e0aa',  // Light green
    '#f1948a',  // Light coral
    '#85c1e9',  // Powder blue
    '#d7bde2',  // Lavender
    '#a9dfbf',  // Pale green
  ],

  // Chart-specific colors for better visual hierarchy
  primary: '#00d4aa',    // Main positive color
  secondary: '#ff6b6b',  // Main negative color
  tertiary: '#ffd93d',   // Accent/highlight color
  neutral: '#64748b',    // Neutral gray for backgrounds
};

// Enhanced custom tooltip style with theme support
const CustomTooltipComponent = (theme) => ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className={`${theme === 'dark' ? 'bg-slate-900/95 border-slate-600/50' : 'bg-white/95 border-slate-300/50'} backdrop-blur-md border rounded-xl p-4 shadow-2xl`}>
        <p className={`${theme === 'dark' ? 'text-white' : 'text-slate-900'} font-semibold mb-2 text-sm`}>{label}</p>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} text-sm`}>{entry.name}:</span>
              </div>
              <span className={`${theme === 'dark' ? 'text-white' : 'text-slate-900'} font-medium text-sm`}>
                ${typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// Get model info (name and icon)
const getModelInfo = (modelId) => {
  if (!modelId) return { name: 'AI Model', logo: '🤖', color: 'amber' };

  const modelLower = modelId.toLowerCase();
  const lobeBase = "https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/dark";

  if (modelLower.includes('openai') || modelLower.includes('gpt')) {
    return {
      name: modelLower.includes('oss') ? 'GPT-OSS' : 'ChatGPT-4o',
      logo: `${lobeBase}/openai.png`,
      color: 'emerald'
    };
  } else if (modelLower.includes('google') || modelLower.includes('gemini') || modelLower.includes('gemma')) {
    return {
      name: modelLower.includes('gemma') ? 'Gemma 3' : 'Gemini 2.0',
      logo: modelLower.includes('gemma') ? `${lobeBase}/gemma-color.png` : `${lobeBase}/gemini-color.png`,
      color: 'blue'
    };
  } else if (modelLower.includes('deepseek') || modelLower.includes('chimera')) {
    return {
      name: modelLower.includes('chimera') ? 'DeepSeek Chimera' : 'DeepSeek R1',
      logo: `${lobeBase}/deepseek-color.png`,
      color: 'cyan'
    };
  } else if (modelLower.includes('meta') || modelLower.includes('llama')) {
    return {
      name: 'Llama 3.3',
      logo: `${lobeBase}/meta-color.png`,
      color: 'purple'
    };
  } else if (modelLower.includes('nvidia') || modelLower.includes('nemotron')) {
    return {
      name: 'Nemotron',
      logo: `${lobeBase}/nvidia-color.png`,
      color: 'green'
    };
  } else if (modelLower.includes('mistral') || modelLower.includes('devstral')) {
    return {
      name: modelLower.includes('devstral') ? 'Devstral' : 'Mistral 7B',
      logo: `${lobeBase}/mistral-color.png`,
      color: 'orange'
    };
  } else if (modelLower.includes('qwen')) {
    return {
      name: 'Qwen 2.5',
      logo: `${lobeBase}/qwen-color.png`,
      color: 'pink'
    };
  } else if (modelLower.includes('xiaomi') || modelLower.includes('mimo')) {
    return {
      name: 'MiMo-V2',
      logo: `${lobeBase}/xiaomimimo.png`,
      color: 'gray'
    };
  } else if (modelLower.includes('tngtech')) {
    return {
      name: 'TNG Chimera',
      logo: `${lobeBase}/tngtech.png`,
      color: 'yellow'
    };
  }

  // Default fallback
  const modelName = modelId.split('/').pop().split(':')[0].replace(/-/g, ' ');
  return {
    name: modelName,
    logo: '🤖',
    color: 'amber'
  };
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


  useEffect(() => {
    loadData();
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

  const loadData = async () => {
    setLoading(true);
    try {
      const [analyticsData, transactionsData, budgetsData, categoriesData] = await Promise.all([
        getMonthlyAnalytics(selectedMonth.year, selectedMonth.month),
        getTransactions(),
        getBudgets(selectedMonth.year, selectedMonth.month),
        getCategories()
      ]);

      // Filter transactions based on view mode
      let periodStart, periodEnd;
      if (viewMode === 'monthly') {
        periodStart = new Date(selectedMonth.year, selectedMonth.month - 1, 1);
        periodEnd = new Date(selectedMonth.year, selectedMonth.month, 0);
      } else {
        // Yearly view
        periodStart = new Date(selectedMonth.year, 0, 1);
        periodEnd = new Date(selectedMonth.year, 11, 31);
      }

      const filteredTransactions = transactionsData.filter(txn => {
        const txnDate = new Date(txn.date);
        return txnDate >= periodStart && txnDate <= periodEnd;
      });

      setAnalytics(analyticsData);
      setTransactions(filteredTransactions);
      setBudgets(budgetsData);
      setCategories(categoriesData);

      // Debug logging
      console.log('🔍 Budget Connection Debug:');
      console.log('📊 Transactions loaded:', filteredTransactions.length);
      console.log('💰 Budgets loaded:', budgetsData.length);
      console.log('📂 Categories loaded:', categoriesData.length);

      // Show sample data
      if (filteredTransactions.length > 0) {
        console.log('📋 Sample transaction:', filteredTransactions[0]);
      }
      if (budgetsData.length > 0) {
        console.log('🎯 Sample budget:', budgetsData[0]);
      }

    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
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
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('token');

      if (!token) {
        console.error('❌ No token found');
        setBudgetInsightsLoading(false);
        return;
      }

      const eventSourceUrl = `${apiUrl}/ai/progress?year=${selectedMonth.year}&month=${selectedMonth.month}&token=${token}`;

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
              // Generate simple budget insights from the context
              const context = data.context;
              const budgetStatus = context.budget_status || [];

              let insights = '';
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

              setAiBudgetInsights(insights);
              setBudgetModelUsed(data.model);
              setBudgetInsightsLoading(false);
              eventSource.close();

              // Cache the successful result and update last used cache key
              saveInsightsToCache(currentCacheKey, insights, data.model, selectedMonth);
              break;
            case 'error':
              setAiBudgetInsights(`💰 <strong>Budget Check:</strong> Monitor your spending to stay within budget limits.\n\n🎯 <strong>Savings Goal:</strong> Focus on consistent saving habits.\n\n📊 <strong>Tip:</strong> Regular budget reviews help maintain financial health.`);
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
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-white via-slate-100 to-white'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-400 border-t-transparent mx-auto mb-4"></div>
          <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} text-lg`}>Loading budget data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-white via-slate-100 to-white'}`}>
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
                <h1 className={`text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Budget Planning</h1>
                <p className={`text-xl ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Take control of your finances</p>
              </div>
            </div>

            {/* View Mode Toggle & Date Selector */}
            <div className="flex flex-col items-center justify-center gap-4 mb-6">
              {/* View Mode Toggle */}
              <div className={`flex items-center gap-2 ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-200/50 border-slate-300'} backdrop-blur-sm rounded-lg p-1 border`}>
                <button
                  onClick={() => setViewMode('monthly')}
                  className={`px-4 py-2 rounded-md font-medium transition-all ${
                    viewMode === 'monthly'
                      ? 'bg-blue-500/80 text-white shadow-lg'
                      : theme === 'dark'
                      ? 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setViewMode('yearly')}
                  className={`px-4 py-2 rounded-md font-medium transition-all ${
                    viewMode === 'yearly'
                      ? 'bg-blue-500/80 text-white shadow-lg'
                      : theme === 'dark'
                      ? 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  Yearly
                </button>
                <button
                  onClick={() => setViewMode('overall')}
                  className={`px-4 py-2 rounded-md font-medium transition-all ${
                    viewMode === 'overall'
                      ? 'bg-blue-500/80 text-white shadow-lg'
                      : theme === 'dark'
                      ? 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  Overall
                </button>
              </div>

              {/* Date Selector */}
              <div className={`flex items-center justify-center gap-3 ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-200/50 border-slate-300'} backdrop-blur-sm rounded-xl px-6 py-3 border`}>
                {viewMode !== 'overall' && (
                  <>
                    <button
                      onClick={() => viewMode === 'monthly' ? changeMonth(-1) : changeYear(-1)}
                      className={`p-2 ${theme === 'dark' ? 'hover:bg-slate-700 text-slate-400 hover:text-white' : 'hover:bg-slate-300 text-slate-600 hover:text-slate-900'} rounded-lg transition-colors`}
                    >
                      ◀
                    </button>
                    <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'} min-w-[140px] text-center`}>
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
                      className={`p-2 ${theme === 'dark' ? 'hover:bg-slate-700 text-slate-400 hover:text-white' : 'hover:bg-slate-300 text-slate-600 hover:text-slate-900'} rounded-lg transition-colors`}
                    >
                      ▶
                    </button>
                  </>
                )}
                {viewMode === 'overall' && (
                  <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>All Time Data</span>
                )}
              </div>
            </div>
          </div>

          {/* Budget Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30 hover:border-blue-400/50 transition-all hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-400 uppercase tracking-wide">Total Budget</span>
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Target className="w-7 h-7 text-blue-400" strokeWidth={2} />
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
                  <DollarSign className="w-7 h-7 text-red-400" strokeWidth={2} />
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
                  <Wallet className="w-7 h-7 text-green-400" strokeWidth={2} />
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
                  <HeartPulse className="w-7 h-7 text-amber-400" strokeWidth={1.7} />
                </div>
              </div>
              <p className={`text-3xl font-bold mb-2 ${totalActual > totalBudgeted ? 'text-red-400' : 'text-green-400'}`}>
                {((totalActual / totalBudgeted) * 100).toFixed(0)}%
              </p>
              <p className="text-sm text-slate-400">Of budget used</p>
            </div>
          </div>

          {/* AI Budget Insights - Smart Caching */}
          {/* Caches insights based on budget + transaction data. Only regenerates when data changes. */}
          <div className={`bg-gradient-to-br ${theme === 'dark' ? 'from-slate-800 to-slate-900 border-slate-700' : 'from-slate-100 to-slate-200 border-slate-300'} rounded-xl shadow-xl p-6 border hover:border-blue-500/50 transition-all hover:shadow-2xl relative`}>
            {/* Model Badge - Top Right Corner */}
            {budgetModelUsed && (
              <div className="absolute top-4 right-4 z-10">
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
                    <div className={`bg-gradient-to-br ${colorClass} backdrop-blur-md rounded-lg px-3 py-1.5 border shadow-lg flex items-center gap-1.5 text-xs`}>
                      {modelInfo.logo.startsWith('http') ? (
                        <img
                          src={modelInfo.logo}
                          alt={modelInfo.name}
                          className="w-3 h-3 object-contain rounded-sm"
                        />
                      ) : (
                        <span className="text-xs">{modelInfo.logo}</span>
                      )}
                      <span className="font-medium">{modelInfo.name}</span>
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="flex items-center gap-1 mb-4">
              <div className="p-2">
                {budgetInsightsLoading && currentTryingBudgetModel ? (
                  (() => {
                    const modelInfo = getModelInfo(currentTryingBudgetModel);
                    return modelInfo.logo.startsWith('http') ? (
                      <img
                        src={modelInfo.logo}
                        alt={modelInfo.name}
                        className="w-5 h-5 object-contain animate-pulse-fast rounded"
                      />
                    ) : (
                      <span className="text-lg animate-pulse-fast">{modelInfo.logo}</span>
                    );
                  })()
                ) : budgetInsightsLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-amber-400 border-t-transparent"></div>
                ) : (
                <Bot className="w-7 h-7 text-amber-400" strokeWidth={1.5} />
                )}
              </div>
              <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>AI Budget Insights</h3>
            </div>

            <div className="space-y-2 pr-20">
              {budgetInsightsLoading ? (
                <div className="space-y-2">
                  <div className={`h-4 ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-200/50'} rounded animate-pulse`}></div>
                  <div className={`h-4 ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-200/50'} rounded animate-pulse w-3/4`}></div>
                  <div className={`h-4 ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-200/50'} rounded animate-pulse w-1/2`}></div>
                </div>
              ) : aiBudgetInsights ? (
                aiBudgetInsights.split('\n\n').map((line, index) => (
                  <p
                    key={index}
                    className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} leading-relaxed`}
                    dangerouslySetInnerHTML={{ __html: line }}
                  />
                ))
              ) : (
                <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Loading budget insights...</p>
              )}
            </div>

            {/* Regenerate Button - bottom right */}
            <button
              onClick={() => {
                clearInsightsCache();           // Force fresh generation
                generateBudgetInsights();       // Trigger the full regeneration flow
              }}
              disabled={budgetInsightsLoading}
              title="Regenerate AI insights"
              className={`
                absolute bottom-4 right-4
                p-2.5 rounded-full
                ${theme === 'dark' ? 'bg-slate-700/80 hover:bg-slate-600/90 text-slate-300 hover:text-amber-400' : 'bg-slate-300/80 hover:bg-slate-400/90 text-slate-700 hover:text-amber-600'}
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                ${budgetInsightsLoading ? 'animate-pulse' : 'hover:rotate-180 hover:scale-110'}
                focus:outline-none focus:ring-2 focus:ring-amber-400/50
              `}
            >
              <RefreshCw 
                className="w-5 h-5" 
                strokeWidth={2.2}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Section 2: Budget vs Actual Analysis */}
      <section className={`min-h-screen flex flex-col justify-center px-6 py-12 ${theme === 'dark' ? 'bg-[#0f172a]' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-12">
            <h2 className={`text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-3 flex items-center justify-center gap-3`}>
              <Wallet className={`w-11 h-11 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`} strokeWidth={1.8} />
              Budget vs Actual Spending
            </h2>
            <p className={`text-xl ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Track your financial discipline</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Budget vs Actual Bar Chart */}
            <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-slate-700/50 hover:border-slate-600/50' : 'bg-gradient-to-br from-slate-100/60 to-white/60 border-slate-300/50 hover:border-slate-400/50'} backdrop-blur-sm rounded-xl shadow-xl p-6 border transition-all`}>
              <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-4 flex items-center gap-2`}>
                <span className="text-blue-400">📈</span>
                Monthly Comparison
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="budgetGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4ecdc4" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#4ecdc4" stopOpacity={0.4}/>
                    </linearGradient>
                    <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff6b6b" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ff6b6b" stopOpacity={0.4}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip content={CustomTooltipComponent(theme)} />
                  <Legend
                    wrapperStyle={{
                      color: theme === 'dark' ? '#94a3b8' : '#475569',
                      fontSize: '12px',
                      paddingTop: '10px'
                    }}
                  />
                  <Bar
                    dataKey="Budgeted"
                    fill="url(#budgetGradient)"
                    radius={[4, 4, 0, 0]}
                    name="Budgeted"
                    maxBarSize={50}
                  />
                  <Bar
                    dataKey="Actual"
                    fill="url(#actualGradient)"
                    radius={[4, 4, 0, 0]}
                    name="Actual"
                    maxBarSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Budget Performance Pie Chart */}
            <div className={`bg-gradient-to-br ${theme === 'dark' ? 'from-slate-800/60 to-slate-900/60 border-slate-700/50 hover:border-slate-600/50' : 'from-slate-100/60 to-white/60 border-slate-300/50 hover:border-slate-400/50'} backdrop-blur-sm rounded-xl shadow-xl p-6 border transition-all`}>
              <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-4 flex items-center gap-2`}>
                <span className="text-green-400">🎯</span>
                Budget Performance
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'On Track', value: budgetData.filter(b => !b.overBudget).length, color: '#00d4aa' },
                      { name: 'Over Budget', value: budgetData.filter(b => b.overBudget).length, color: '#ff6b6b' }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="#1e293b"
                    strokeWidth={2}
                  >
                    {[
                      { name: 'On Track', value: budgetData.filter(b => !b.overBudget).length, color: '#00d4aa' },
                      { name: 'Over Budget', value: budgetData.filter(b => b.overBudget).length, color: '#ff6b6b' }
                    ].map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        style={{
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                          transition: 'all 0.3s ease'
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={CustomTooltipComponent(theme)} />
                  <Legend
                    wrapperStyle={{
                      color: theme === 'dark' ? '#94a3b8' : '#475569',
                      fontSize: '12px',
                      paddingTop: '10px'
                    }}
                  />
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
                  <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} mb-2`}>Category</label>
                  <select
                    value={newBudget.category_id}
                    onChange={(e) => setNewBudget({...newBudget, category_id: e.target.value})}
                    className={`w-full px-3 py-2 ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'} border rounded-lg focus:outline-none focus:border-amber-400`}
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
                  <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} mb-2`}>Monthly Budget ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newBudget.amount}
                    onChange={(e) => setNewBudget({...newBudget, amount: e.target.value})}
                    className={`w-full px-3 py-2 ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'} border rounded-lg focus:outline-none focus:border-amber-400`}
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
                  className={`px-6 py-2 ${theme === 'dark' ? 'bg-slate-600 hover:bg-slate-500 text-white' : 'bg-slate-300 hover:bg-slate-400 text-slate-900'} rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Budget Categories Table */}
          <div className={`${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white/50 border-slate-200'} backdrop-blur-sm rounded-xl shadow-xl border overflow-hidden`}>
            <div className={`p-6 ${theme === 'dark' ? 'border-b border-slate-700' : 'border-b border-slate-300'}`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Budget Categories</h3>
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
                <thead className={theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-200/50'}>
                  <tr>
                    <th className={`px-6 py-4 text-left text-xs font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} uppercase`}>Category</th>
                    <th className={`px-6 py-4 text-right text-xs font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} uppercase`}>Budgeted</th>
                    <th className={`px-6 py-4 text-right text-xs font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} uppercase`}>Spent</th>
                    <th className={`px-6 py-4 text-right text-xs font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} uppercase`}>Remaining</th>
                    <th className={`px-6 py-4 text-center text-xs font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} uppercase`}>Progress</th>
                    <th className={`px-6 py-4 text-center text-xs font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} uppercase`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-700' : 'divide-slate-300'}`}>
                  {budgetData.map((budget) => (
                    <tr key={budget.category} className={`${theme === 'dark' ? 'hover:bg-slate-700/30' : 'hover:bg-slate-200/30'} transition-colors`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{budget.icon}</span>
                          <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{budget.category}</span>
                        </div>
                      </td>
                      <td className={`px-6 py-4 text-right font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                        ${budget.budgeted.toFixed(2)}
                      </td>
                      <td className={`px-6 py-4 text-right font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                        ${budget.actual.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-green-400">
                        ${budget.remaining.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`flex-1 ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-300'} rounded-full h-2`}>
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
                            <Pencil className="w-5 h-5" strokeWidth={2.2} />
                          </button>
                          <button
                            onClick={() => handleDeleteBudget(budget.id)}
                            className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-5 h-5 text-red-400 hover:text-red-300 transition-colors" strokeWidth={2} />
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