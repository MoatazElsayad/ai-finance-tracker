/**
 * Dashboard - Dark Mode Finance Tracker
 * Professional financial dashboard with unified dark theme
 */
import { useState, useEffect, useMemo } from 'react';
import { 
  getTransactions, 
  getMonthlyAnalytics, 
  generateAISummary, 
  getCurrentUser, 
  askAIQuestion, 
  generateReport,
  getCategories,
  initSavingsCategory 
} from '../api';
import { useTheme } from '../context/ThemeContext';
import { CHART_COLORS } from './DashboardUtils';
import {
  SectionHeaderAndSummary,
  ReportsSection,
  MainChartsSection,
  SpendingTrendsSection,
  ProgressComparisonSection,
  AIInsightsSection,
  RecentActivitySection,
  ChatWidgetButton,
  ChatWidgetPopup
} from './DashboardUI';

function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [aiSummary, setAiSummary] = useState('');
  const [aiModelUsed, setAiModelUsed] = useState(null);
  const [currentTryingModel, setCurrentTryingModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMode, setAiMode] = useState('summary'); // 'summary' | 'chat'
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatModelUsed, setChatModelUsed] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatTryingModel, setChatTryingModel] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [isChatWidgetOpen, setIsChatWidgetOpen] = useState(false);
  const [chatWidgetMessages, setChatWidgetMessages] = useState([]);
  const [chatWidgetInput, setChatWidgetInput] = useState('');
  const [chatWidgetLoading, setChatWidgetLoading] = useState(false);
  const [chatWidgetTryingModel, setChatWidgetTryingModel] = useState(null);
  const [chatWidgetModelUsed, setChatWidgetModelUsed] = useState(null);
  const [user, setUser] = useState(null);
  const [hasSavingsAccount, setHasSavingsAccount] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const [viewMode, setViewMode] = useState('monthly'); // 'monthly', 'yearly', or 'overall'
  const { theme } = useTheme();
  const [reportLoading, setReportLoading] = useState(false);
  const [reportProgress, setReportProgress] = useState(0);
  const [reportStatus, setReportStatus] = useState('Idle');

  useEffect(() => {
    loadDashboard();

    // Listen for transaction-added event to refresh data
    const handleTransactionAdded = () => {
      loadDashboard();
    };
    window.addEventListener('transaction-added', handleTransactionAdded);

    return () => {
      window.removeEventListener('transaction-added', handleTransactionAdded);
    };
  }, [selectedMonth, viewMode]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Failed to load user:', error);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (aiMode === 'chat' && chatMessages.length === 0) {
      setChatMessages([{ role: 'assistant', text: 'Hi! How can I help you?' }]);
    }
  }, [aiMode]);

  useEffect(() => {
    if (isChatWidgetOpen && chatWidgetMessages.length === 0) {
      setChatWidgetMessages([{ role: 'assistant', text: 'Hi! How can I help you?' }]);
    }
  }, [isChatWidgetOpen]);

  const getDateRange = () => {
    if (viewMode === 'monthly') {
      const startDate = new Date(selectedMonth.year, selectedMonth.month - 1, 1);
      const endDate = new Date(selectedMonth.year, selectedMonth.month, 0);
      return { startDate, endDate };
    } else if (viewMode === 'yearly') {
      const startDate = new Date(selectedMonth.year, 0, 1);
      const endDate = new Date(selectedMonth.year, 11, 31);
      return { startDate, endDate };
    } else {
      return { startDate: new Date(1900, 0, 1), endDate: new Date(2100, 11, 31) };
    }
  };
  
  const handleDownloadReport = async (format = 'pdf') => {
    try {
      setReportLoading(true);
      setReportProgress(0);
      setReportStatus('Starting');
      const startTime = Date.now();
      let phase = 0;
      const phases = [
        { name: 'Preparing data', max: 25 },
        { name: 'Rendering charts', max: 50 },
        { name: 'Building report', max: 75 },
        { name: 'Downloading', max: 90 },
      ];
      const timer = setInterval(() => {
        phase = Math.min(phase, phases.length - 1);
        const target = phases[phase].max;
        setReportStatus(phases[phase].name);
        setReportProgress((p) => {
          const next = Math.min(target, p + Math.random() * 7);
          if (next >= target && phase < phases.length - 1) phase += 1;
          return Math.min(95, next);
        });
      }, 250);
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to download reports.');
        clearInterval(timer);
        return;
      }
      const { startDate, endDate } = getDateRange();
      const payload = {
        startDate: startDate.toISOString().slice(0, 10),
        endDate: endDate.toISOString().slice(0, 10),
        format,
      };
      setReportStatus('Generating');
      const { blob, filename } = await generateReport(payload);
      setReportStatus('Finalizing');
      setReportProgress(98);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      setReportStatus(`Done in ${elapsed}s`);
      setReportProgress(100);
      setTimeout(() => {
        setReportStatus('Idle');
        setReportProgress(0);
      }, 2000);
      clearInterval(timer);
    } catch (err) {
      alert(err.message);
    } finally {
      setReportLoading(false);
    }
  };

  const handleWidgetAsk = async () => {
    if (!chatWidgetInput.trim()) return;
    setChatWidgetMessages(prev => [...prev, { role: 'user', text: chatWidgetInput }]);
    const question = chatWidgetInput;
    setChatWidgetInput('');
    setChatWidgetModelUsed(null);
    setChatWidgetLoading(true);
    setChatWidgetTryingModel(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001';
      const token = localStorage.getItem('token');
      if (!token) {
        setChatWidgetMessages(prev => [...prev, { role: 'assistant', text: 'Please log in again to use AI chat.' }]);
        setChatWidgetLoading(false);
        return;
      }

      const eventSourceUrl = `${apiUrl}/ai/chat_progress?year=${selectedMonth.year}&month=${selectedMonth.month}&question=${encodeURIComponent(question)}&token=${token}`;
      const eventSource = new EventSource(eventSourceUrl);
      let hasReceivedMessage = false;

      const timeout = setTimeout(() => {
        if (!hasReceivedMessage) {
          eventSource.close();
          fallbackToRegularChat();
        }
      }, 5000);

      const fallbackToRegularChat = async () => {
        try {
          const result = await askAIQuestion(selectedMonth.year, selectedMonth.month, question);
          setChatWidgetMessages(prev => [...prev, { role: 'assistant', text: result.answer }]);
          setChatWidgetModelUsed(result.model_used || null);
        } catch {
          setChatWidgetMessages(prev => [...prev, { role: 'assistant', text: 'Unable to connect to AI services. Please try again later.' }]);
        } finally {
          setChatWidgetLoading(false);
        }
      };

      eventSource.onmessage = (event) => {
        hasReceivedMessage = true;
        clearTimeout(timeout);
        try {
          const data = JSON.parse(event.data);
          switch (data.type) {
            case 'trying_model':
              setChatWidgetTryingModel(data.model);
              break;
            case 'success':
              setChatWidgetMessages(prev => [...prev, { role: 'assistant', text: data.answer }]);
              setChatWidgetModelUsed(data.model);
              setChatWidgetLoading(false);
              eventSource.close();
              break;
            case 'error':
              setChatWidgetMessages(prev => [...prev, { role: 'assistant', text: `All Models Busy\n\n${data.message}\n\nPlease try again in a few minutes.` }]);
              setChatWidgetLoading(false);
              eventSource.close();
              break;
          }
        } catch {}
      };

      eventSource.onerror = () => {
        clearTimeout(timeout);
        if (!hasReceivedMessage) {
          fallbackToRegularChat();
        } else {
          setChatWidgetLoading(false);
        }
        eventSource.close();
      };
    } catch {
      try {
        const result = await askAIQuestion(selectedMonth.year, selectedMonth.month, question);
        setChatWidgetMessages(prev => [...prev, { role: 'assistant', text: result.answer }]);
        setChatWidgetModelUsed(result.model_used || null);
      } catch {
        setChatWidgetMessages(prev => [...prev, { role: 'assistant', text: 'Unable to connect to AI services. Please try again later.' }]);
      } finally {
        setChatWidgetLoading(false);
      }
    }
  };

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [txnsData, categories, userData] = await Promise.all([
        getTransactions(1, 1000), // Get more transactions for dashboard
        getCategories(),
        getCurrentUser()
      ]);

      // Handle both old format (array) and new format (object with pagination)
      const txns = txnsData?.transactions || (Array.isArray(txnsData) ? txnsData : []);

      setUser(userData);
      console.log('🔄 Dashboard categories updated, checking for savings category...');
      console.log('📁 Categories list:', categories.map(c => c.name));
      const savingsCat = categories.find(c => c.name && c.name.toLowerCase().includes('savings'));
      console.log('🔍 Savings category found in Dashboard:', savingsCat ? `${savingsCat.name} (ID: ${savingsCat.id})` : 'NO');
      setHasSavingsAccount(!!savingsCat);

      // Log state changes for debugging
      console.log('💎 Dashboard hasSavingsAccount state set to:', !!savingsCat);

      let periodStart, periodEnd;
      if (viewMode === 'monthly') {
        periodStart = new Date(selectedMonth.year, selectedMonth.month - 1, 1);
        periodEnd = new Date(selectedMonth.year, selectedMonth.month, 0);
      } else if (viewMode === 'yearly') {
        periodStart = new Date(selectedMonth.year, 0, 1);
        periodEnd = new Date(selectedMonth.year, 11, 31);
      } else {
        periodStart = new Date(1900, 0, 1);
        periodEnd = new Date(2100, 11, 31);
      }

      const periodTransactions = txns.filter(txn => {
        const txnDate = new Date(txn.date);
        return txnDate >= periodStart && txnDate <= periodEnd;
      });

      // separation of regular expenses and special savings
      const totalIncome = periodTransactions
        .filter(t => t.amount > 0 && !(t.category_name && t.category_name.toLowerCase().includes('savings')))
        .reduce((sum, t) => sum + t.amount, 0);

      // Total of all negative amounts (Expenses + Savings)
      const totalOutflow = Math.abs(
        periodTransactions
          .filter(t => t.amount < 0)
          .reduce((sum, t) => sum + t.amount, 0)
      );

      // Total dedicated savings (deposits minus withdrawals) - PERIOD
      const totalSavingsTx = periodTransactions
          .filter(t => t.category_name && t.category_name.toLowerCase().includes('savings'))
          .reduce((sum, t) => sum + (-t.amount), 0);

      // Total dedicated savings (deposits minus withdrawals) - OVERALL (Lifetime)
      const totalSavingsOverall = txns
          .filter(t => t.category_name && t.category_name.toLowerCase().includes('savings'))
          .reduce((sum, t) => sum + (-t.amount), 0);

      // Actual spending (regular expenses only, excluding ALL savings-related transactions)
      const actualSpending = periodTransactions
        .filter(t => t.amount < 0 && !(t.category_name && t.category_name.toLowerCase().includes('savings')))
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      // Total lifetime balance calculation
      const lifetimeIncome = txns
        .filter(t => t.amount > 0 && !(t.category_name && t.category_name.toLowerCase().includes('savings')))
        .reduce((sum, t) => sum + t.amount, 0);
      const lifetimeSpending = txns
        .filter(t => t.amount < 0 && !(t.category_name && t.category_name.toLowerCase().includes('savings')))
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      const lifetimeAvailableBalance = lifetimeIncome - lifetimeSpending - totalSavingsOverall;

      // Net Savings = Income - Actual Spending (this is what's left over for potential savings in THIS period)
      const periodNetSavings = totalIncome - actualSpending;
      
      const savingsRateValue = totalIncome > 0 ? ((periodNetSavings / totalIncome) * 100) : 0;

      const categoryBreakdown = {};
      periodTransactions
        .filter(t => t.amount < 0)
        .forEach(t => {
          const isSavings = t.category_name && t.category_name.toLowerCase().includes('savings');
          const category = isSavings ? 'Savings' : (t.category_name || 'Uncategorized');
          categoryBreakdown[category] = (categoryBreakdown[category] || 0) + Math.abs(t.amount);
        });

      const categoryBreakdownArray = Object.entries(categoryBreakdown)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount);

      const recentSavings = txns
        .filter(t => t.category_name && t.category_name.toLowerCase().includes('savings'))
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3);

      setTransactions(txns);
      setAnalytics({
        total_income: totalIncome,
        total_expenses: actualSpending, // Show only regular expenses
        total_savings: totalSavingsOverall, // Show lifetime total savings in the card
        net_savings: lifetimeAvailableBalance, // This is the "Available Balance" card
        period_net_savings: periodNetSavings, // Use this for internal logic if needed
        savings_rate: savingsRateValue,
        category_breakdown: categoryBreakdownArray,
        recent_savings: recentSavings
      });

      // Update global user state with lifetime available balance
      if (userData) {
        const updatedUser = {
          ...userData,
          available_balance: lifetimeAvailableBalance
        };
        setUser(updatedUser);
        
        // Sync with sidebar
        if (window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('user-updated', { detail: updatedUser }));
        }
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAI = async () => {
    setAiLoading(true);
    setAiSummary('');
    setAiModelUsed(null);
    setCurrentTryingModel(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001';
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in again');
        setAiLoading(false);
        return;
      }

      const eventSourceUrl = `${apiUrl}/ai/progress?year=${selectedMonth.year}&month=${selectedMonth.month}&token=${token}`;
      const eventSource = new EventSource(eventSourceUrl);
      let hasReceivedMessage = false;

      const timeout = setTimeout(() => {
        if (!hasReceivedMessage) {
          eventSource.close();
          fallbackToRegularAPI();
        }
      }, 5000);

      const fallbackToRegularAPI = async () => {
        try {
          const result = await generateAISummary(selectedMonth.year, selectedMonth.month);
          setAiSummary(result.summary);
          setAiModelUsed(result.model_used || null);
        } catch (fallbackError) {
          alert(fallbackError.message);
        } finally {
          setAiLoading(false);
        }
      };

      eventSource.onmessage = (event) => {
        hasReceivedMessage = true;
        clearTimeout(timeout);
        try {
          const data = JSON.parse(event.data);
          switch (data.type) {
            case 'trying_model':
              setCurrentTryingModel(data.model);
              break;
            case 'success':
              setAiSummary(data.summary);
              setAiModelUsed(data.model);
              setAiLoading(false);
              eventSource.close();
              break;
            case 'error':
              setAiSummary(`**All Models Busy**\n\n${data.message}\n\nPlease try again in a few minutes.`);
              setAiLoading(false);
              eventSource.close();
              break;
          }
        } catch (e) {}
      };

      eventSource.onerror = () => {
        clearTimeout(timeout);
        if (!hasReceivedMessage) {
          fallbackToRegularAPI();
        } else {
          setAiLoading(false);
        }
        eventSource.close();
      };
    } catch (error) {
      try {
        const result = await generateAISummary(selectedMonth.year, selectedMonth.month);
        setAiSummary(result.summary);
        setAiModelUsed(result.model_used || null);
      } catch (fallbackError) {
        setAiSummary(`**All Models Busy**\n\nUnable to connect to AI services. Please try again in a few minutes.`);
        setAiLoading(false);
      } finally {
        setAiLoading(false);
      }
    }
  };

  const handleAskAI = async () => {
    if (!chatQuestion.trim()) return;
    setChatMessages(prev => [...prev, { role: 'user', text: chatQuestion }]);
    const question = chatQuestion;
    setChatQuestion('');
    setChatModelUsed(null);
    setChatLoading(true);
    setChatTryingModel(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001';
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in again');
        setChatLoading(false);
        return;
      }

      const eventSourceUrl = `${apiUrl}/ai/chat_progress?year=${selectedMonth.year}&month=${selectedMonth.month}&question=${encodeURIComponent(question)}&token=${token}`;
      const eventSource = new EventSource(eventSourceUrl);
      let hasReceivedMessage = false;

      const timeout = setTimeout(() => {
        if (!hasReceivedMessage) {
          eventSource.close();
          fallbackToRegularChat();
        }
      }, 5000);

      const fallbackToRegularChat = async () => {
        try {
          const result = await askAIQuestion(selectedMonth.year, selectedMonth.month, question);
          setChatMessages(prev => [...prev, { role: 'assistant', text: result.answer }]);
          setChatModelUsed(result.model_used || null);
        } catch (err) {
          setChatMessages(prev => [...prev, { role: 'assistant', text: 'Unable to connect to AI services. Please try again later.' }]);
        } finally {
          setChatLoading(false);
        }
      };

      eventSource.onmessage = (event) => {
        hasReceivedMessage = true;
        clearTimeout(timeout);
        try {
          const data = JSON.parse(event.data);
          switch (data.type) {
            case 'trying_model':
              setChatTryingModel(data.model);
              break;
            case 'success':
              setChatMessages(prev => [...prev, { role: 'assistant', text: data.answer }]);
              setChatModelUsed(data.model);
              setChatLoading(false);
              eventSource.close();
              break;
            case 'error':
              setChatMessages(prev => [...prev, { role: 'assistant', text: `All Models Busy\n\n${data.message}\n\nPlease try again in a few minutes.` }]);
              setChatLoading(false);
              eventSource.close();
              break;
          }
        } catch (e) {}
      };

      eventSource.onerror = () => {
        clearTimeout(timeout);
        if (!hasReceivedMessage) {
          fallbackToRegularChat();
        } else {
          setChatLoading(false);
        }
        eventSource.close();
      };
    } catch {
      try {
        const result = await askAIQuestion(selectedMonth.year, selectedMonth.month, question);
        setChatMessages(prev => [...prev, { role: 'assistant', text: result.answer }]);
        setChatModelUsed(result.model_used || null);
      } catch {
        setChatMessages(prev => [...prev, { role: 'assistant', text: 'Unable to connect to AI services. Please try again later.' }]);
      } finally {
        setChatLoading(false);
      }
    }
  };

  const changeMonth = (direction) => {
    setSelectedMonth(prev => {
      let newMonth = prev.month + direction;
      let newYear = prev.year;
      if (newMonth > 12) { newMonth = 1; newYear += 1; }
      else if (newMonth < 1) { newMonth = 12; newYear -= 1; }
      return { year: newYear, month: newMonth };
    });
  };

  const changeYear = (offset) => {
    setSelectedMonth(prev => ({ ...prev, year: prev.year + offset }));
  };

  // Prepare chart data
  const barData = useMemo(() => [
    { name: 'Income', value: analytics?.total_income || 0, color: CHART_COLORS.income },
    { name: 'Expenses', value: analytics?.total_expenses || 0, color: CHART_COLORS.expense },
  ], [analytics]);

  const pieData = useMemo(() => (analytics?.category_breakdown || []).map(cat => ({
    name: cat.name,
    value: cat.amount
  })), [analytics]);

  const dailySpendingData = useMemo(() => {
    const expenses = transactions.filter(t => t.amount < 0 && !(t.category_name && t.category_name.toLowerCase().includes('savings')));
    const daily = {};
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    
    expenses.forEach(t => {
      const d = new Date(t.date);
      if (d >= fourteenDaysAgo) {
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        daily[dateStr] = (daily[dateStr] || 0) + Math.abs(t.amount);
      }
    });
    return Object.entries(daily).map(([date, amount]) => ({ date, amount })).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [transactions]);

  const dailySpendingChartData = useMemo(() => {
    return dailySpendingData.map((d, i, arr) => {
      const window = arr.slice(Math.max(0, i - 2), i + 1);
      const ma3 = window.reduce((sum, item) => sum + item.amount, 0) / window.length;
      return { ...d, ma3 };
    });
  }, [dailySpendingData]);

  const avgDailySpending = useMemo(() => 
    dailySpendingData.length > 0 
      ? dailySpendingData.reduce((sum, d) => sum + d.amount, 0) / dailySpendingData.length 
      : 0
  , [dailySpendingData]);

  const weeklyPatternData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const pattern = days.map(day => ({ day, amount: 0 }));
    transactions
      .filter(t => t.amount < 0 && !(t.category_name && t.category_name.toLowerCase().includes('savings')))
      .forEach(t => {
        const dayIndex = new Date(t.date).getDay();
        pattern[dayIndex].amount += Math.abs(t.amount);
      });
    return pattern;
  }, [transactions]);

  const monthlyComparisonData = useMemo(() => {
    const monthly = {};
    transactions.forEach(t => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      if (!monthly[key]) monthly[key] = { month: d.toLocaleDateString('en-US', { month: 'short' }), income: 0, expenses: 0 };
      
      if (t.amount > 0) {
        const isSavings = t.category_name && t.category_name.toLowerCase().includes('savings');
        if (!isSavings) {
          monthly[key].income += t.amount;
        }
      } else {
        // Only include in expenses if NOT a savings transaction
        const isSavings = t.category_name && t.category_name.toLowerCase().includes('savings');
        if (!isSavings) {
          monthly[key].expenses += Math.abs(t.amount);
        }
      }
    });
    return Object.entries(monthly).sort((a, b) => a[0].localeCompare(b[0])).map(e => e[1]).slice(-6);
  }, [transactions]);

  const cumulativeSavingsData = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    let cumulative = 0;
    const dateGroups = {};
    
    sorted.forEach(t => {
      const dateStr = new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      if (hasSavingsAccount) {
        // If they have a savings account, track specifically the vault growth
        // Deposits are negative (outflow from main, but increase vault)
        // Withdrawals are positive (inflow to main, but decrease vault)
        if (t.category_name && t.category_name.toLowerCase().includes('savings')) {
          cumulative += (-t.amount); // Flip the sign: deposit (-100) becomes +100 in vault
          dateGroups[dateStr] = cumulative;
        }
      } else {
        // Default: track overall net balance (income - expenses)
        cumulative += t.amount;
        dateGroups[dateStr] = cumulative;
      }
    });
    
    const data = Object.entries(dateGroups).map(([date, savings]) => ({ date, savings }));
    return data.slice(-15);
  }, [transactions, hasSavingsAccount]);

  const recentTransactions = useMemo(() => [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5), [transactions]);

  if (loading) {
    return (
      <div className={`flex justify-center items-center min-h-screen ${theme === 'dark' ? 'bg-[#0a0e27]' : 'bg-slate-50'} transition-colors duration-500`}>
        <div className="text-center animate-in fade-in duration-700">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-[2rem] border-4 border-slate-200/10 dark:border-slate-700/30 mx-auto"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 rounded-[2rem] border-4 border-amber-500 border-t-transparent animate-spin duration-[1.5s]"></div>
          </div>
          <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} text-lg font-bold tracking-tight`}>
            Loading financial <span className="text-amber-500">intelligence...</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#0a0e27] text-white' : 'bg-slate-50 text-slate-900'} transition-colors duration-500`}>
      <SectionHeaderAndSummary 
        theme={theme}
        user={user}
        viewMode={viewMode}
        selectedMonth={selectedMonth}
        setViewMode={setViewMode}
        changeMonth={changeMonth}
        changeYear={changeYear}
        analytics={analytics}
        hasSavingsAccount={hasSavingsAccount}
      />

      <ReportsSection 
        theme={theme}
        reportLoading={reportLoading}
        reportProgress={reportProgress}
        reportStatus={reportStatus}
        handleDownloadReport={handleDownloadReport}
      />

      <MainChartsSection 
        theme={theme}
        barData={barData}
        pieData={pieData}
      />

      <SpendingTrendsSection 
        theme={theme}
        dailySpendingData={dailySpendingData}
        avgDailySpending={avgDailySpending}
        dailySpendingChartData={dailySpendingChartData}
        weeklyPatternData={weeklyPatternData}
      />

      <ProgressComparisonSection 
        theme={theme}
        cumulativeSavingsData={cumulativeSavingsData}
        monthlyComparisonData={monthlyComparisonData}
        hasSavingsAccount={hasSavingsAccount}
      />

      <AIInsightsSection 
        theme={theme}
        aiMode={aiMode}
        setAiMode={setAiMode}
        aiSummary={aiSummary}
        aiLoading={aiLoading}
        aiModelUsed={aiModelUsed}
        currentTryingModel={currentTryingModel}
        handleGenerateAI={handleGenerateAI}
        chatMessages={chatMessages}
        chatQuestion={chatQuestion}
        chatModelUsed={chatModelUsed}
        chatTryingModel={chatTryingModel}
        chatLoading={chatLoading}
        setChatQuestion={setChatQuestion}
        handleAskAI={handleAskAI}
      />

      <RecentActivitySection 
        theme={theme}
        recentTransactions={recentTransactions}
      />

      <ChatWidgetButton 
        theme={theme}
        isChatWidgetOpen={isChatWidgetOpen}
        setIsChatWidgetOpen={setIsChatWidgetOpen}
      />

      <ChatWidgetPopup 
        theme={theme}
        isChatWidgetOpen={isChatWidgetOpen}
        chatWidgetMessages={chatWidgetMessages}
        chatWidgetInput={chatWidgetInput}
        setChatWidgetInput={setChatWidgetInput}
        chatWidgetLoading={chatWidgetLoading}
        chatWidgetTryingModel={chatWidgetTryingModel}
        chatWidgetModelUsed={chatWidgetModelUsed}
        handleWidgetAsk={handleWidgetAsk}
        setIsChatWidgetOpen={setIsChatWidgetOpen}
      />
    </div>
  );
}

export default Dashboard;
