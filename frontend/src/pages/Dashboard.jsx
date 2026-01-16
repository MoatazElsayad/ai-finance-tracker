/**
 * Dashboard - Dark Mode Finance Tracker
 * Professional financial dashboard with unified dark theme
 */
import { useState, useEffect } from 'react';
import { getTransactions, getMonthlyAnalytics, generateAISummary, getCurrentUser } from '../api';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, AreaChart, Area } from 'recharts';

// Dark mode chart colors - professional finance palette with unified design
const CHART_COLORS = {
  // Primary metrics - high contrast, professional colors
  income: '#00d4aa',     // Bright emerald green
  expense: '#ff6b6b',    // Soft coral red
  savings: '#ffd93d',    // Bright golden yellow
  accent: '#4ecdc4',     // Teal accent

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

const ALL_AI_MODELS = [
    "openai/gpt-oss-120b:free",
    "google/gemini-2.0-flash-exp:free",
    "google/gemma-3-27b-it:free",
    "deepseek/deepseek-r1-0528:free",
    "tngtech/deepseek-r1t2-chimera:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "mistralai/mistral-7b-instruct:free",
    "mistralai/devstral-2512:free",
    "nvidia/nemotron-3-nano-30b-a3b:free",
    "qwen/qwen-2.5-vl-7b-instruct:free",
    "xiaomi/mimo-v2-flash:free",
    "tngtech/tng-r1t-chimera:free",
];

function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [aiSummary, setAiSummary] = useState('');
  const [aiModelUsed, setAiModelUsed] = useState(null);
  const [currentTryingModel, setCurrentTryingModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });

  useEffect(() => {
    loadDashboard();
  }, [selectedMonth]);

  useEffect(() => {
    // Load user information
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

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [txns, stats] = await Promise.all([
        getTransactions(),
        getMonthlyAnalytics(selectedMonth.year, selectedMonth.month)
      ]);

      setTransactions(txns);
      setAnalytics(stats);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAI = async () => {
    setAiSummary(''); // Clear previous summary
    setAiModelUsed(null); // Clear previous model
    setAiLoading(true);
    setCurrentTryingModel(null); // Reset trying model

    try {
      // Use Server-Sent Events for real-time progress
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('token');

      if (!token) {
        console.error('❌ No token found in localStorage');
        alert('Please log in again');
        setAiLoading(false);
        return;
      }

      const eventSourceUrl = `${apiUrl}/ai/progress?year=${selectedMonth.year}&month=${selectedMonth.month}&token=${token}`;

      console.log('🔗 Attempting SSE connection to:', eventSourceUrl);
      console.log('📝 Token exists:', !!token, 'Length:', token.length);

      const eventSource = new EventSource(eventSourceUrl);
      let hasReceivedMessage = false;

      // Timeout for SSE connection
      const timeout = setTimeout(() => {
        if (!hasReceivedMessage) {
          console.warn('SSE timeout, falling back to regular API');
          eventSource.close();
          fallbackToRegularAPI();
        }
      }, 5000); // 5 second timeout

      const fallbackToRegularAPI = async () => {
        try {
          console.log('Using fallback API call');
      const result = await generateAISummary(selectedMonth.year, selectedMonth.month);
          console.log('✅ Fallback API Response received:', result);
      setAiSummary(result.summary);
          setAiModelUsed(result.model_used || null);
        } catch (fallbackError) {
          console.error('Fallback API also failed:', fallbackError);
          alert(fallbackError.message);
        } finally {
          setAiLoading(false);
        }
      };

      eventSource.onmessage = (event) => {
        hasReceivedMessage = true;
        clearTimeout(timeout);

        console.log('SSE Message received:', event.data);
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'trying_model':
              console.log('Trying model:', data.model);
              setCurrentTryingModel(data.model);
              break;
            case 'model_failed':
              console.log(`Model ${data.model} failed: ${data.reason}`);
              // Could show failed models differently if needed
              break;
            case 'success':
              console.log('AI Success with model:', data.model);
              setAiSummary(data.summary);
              setAiModelUsed(data.model);
              setAiLoading(false);
              eventSource.close();
              break;
            case 'error':
              console.log('AI Error:', data.message);
              // Show "all models busy" message in the card instead of alert
              setAiSummary(`**All Models Busy**\n\n${data.message}\n\nPlease try again in a few minutes.`);
              setAiLoading(false);
              eventSource.close();
              break;
          }
        } catch (e) {
          console.error('Failed to parse SSE data:', event.data, e);
        }
      };

      eventSource.onopen = () => {
        console.log('SSE Connection opened');
      };

      eventSource.onerror = (error) => {
        console.error('SSE Error:', error);
        console.error('SSE ReadyState:', eventSource.readyState);
        clearTimeout(timeout);
        if (!hasReceivedMessage) {
          console.warn('SSE failed on connection, using fallback');
          fallbackToRegularAPI();
        } else {
          setAiLoading(false);
        }
        eventSource.close();
      };

    } catch (error) {
      // Fallback to regular API call if SSE setup fails
      console.warn('SSE setup failed, falling back to regular API call');
      try {
        const result = await generateAISummary(selectedMonth.year, selectedMonth.month);
        console.log('✅ Fallback API Response received:', result);
        setAiSummary(result.summary);
        setAiModelUsed(result.model_used || null);
      } catch (fallbackError) {
        console.error('Fallback API also failed:', fallbackError);
        // Show "all models busy" message in the card instead of alert
        setAiSummary(`**All Models Busy**\n\nUnable to connect to AI services. Please try again in a few minutes.`);
        setAiLoading(false);
        alert(fallbackError.message);
      } finally {
        setAiLoading(false);
      }
    }

    /*
    // SSE CODE - COMMENTED OUT FOR DEBUGGING
    try {
      // Use Server-Sent Events for real-time progress
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('token');

      if (!token) {
        console.error('❌ No token found in localStorage');
        alert('Please log in again');
        setAiLoading(false);
        return;
      }

      const eventSourceUrl = `${apiUrl}/ai/progress?year=${selectedMonth.year}&month=${selectedMonth.month}&token=${token}`;

      console.log('🔗 Attempting SSE connection to:', eventSourceUrl);
      console.log('📝 Token exists:', !!token, 'Length:', token.length);

      const eventSource = new EventSource(eventSourceUrl);
      let hasReceivedMessage = false;

      // Timeout for SSE connection
      const timeout = setTimeout(() => {
        if (!hasReceivedMessage) {
          console.warn('SSE timeout, falling back to regular API');
          eventSource.close();
          fallbackToRegularAPI();
        }
      }, 5000); // 5 second timeout

      const fallbackToRegularAPI = async () => {
        try {
          console.log('Using fallback API call');
          const result = await generateAISummary(selectedMonth.year, selectedMonth.month);
          setAiSummary(result.summary);
          setAiModelUsed(result.model_used || null);
        } catch (fallbackError) {
          console.error('Fallback API also failed:', fallbackError);
          alert(fallbackError.message);
    } finally {
      setAiLoading(false);
    }
      };

      eventSource.onmessage = (event) => {
        hasReceivedMessage = true;
        clearTimeout(timeout);

        console.log('SSE Message received:', event.data);
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'trying_model':
              console.log('Trying model:', data.model);
              setCurrentTryingModel(data.model);
              break;
            case 'model_failed':
              console.log(`Model ${data.model} failed: ${data.reason}`);
              // Could show failed models differently if needed
              break;
            case 'success':
              console.log('AI Success with model:', data.model);
              setAiSummary(data.summary);
              setAiModelUsed(data.model);
              setAiLoading(false);
              eventSource.close();
              break;
            case 'error':
              console.log('AI Error:', data.message);
              // Show "all models busy" message in the card instead of alert
              setAiSummary(`**All Models Busy**\n\n${data.message}\n\nPlease try again in a few minutes.`);
              setAiLoading(false);
              eventSource.close();
              break;
          }
        } catch (e) {
          console.error('Failed to parse SSE data:', event.data, e);
        }
      };

      eventSource.onopen = () => {
        console.log('SSE Connection opened');
      };

      eventSource.onerror = (error) => {
        console.error('SSE Error:', error);
        console.error('SSE ReadyState:', eventSource.readyState);
        clearTimeout(timeout);
        if (!hasReceivedMessage) {
          console.warn('SSE failed on connection, using fallback');
          fallbackToRegularAPI();
        } else {
          setAiLoading(false);
        }
        eventSource.close();
      };

    } catch (error) {
      // Fallback to regular API call if SSE setup fails
      console.warn('SSE setup failed, falling back to regular API call');
      try {
        const result = await generateAISummary(selectedMonth.year, selectedMonth.month);
        setAiSummary(result.summary);
        setAiModelUsed(result.model_used || null);
      } catch (fallbackError) {
        alert(fallbackError.message);
      } finally {
        setAiLoading(false);
      }
    }
    */
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

  const formatAISummary = (text) => {
    if (!text) return null;
    const sections = text.split(/\*\*(.*?)\*\*/g);
    
    let currentSection = null;
    let sectionContent = [];
    const formattedSections = [];
    
    sections.forEach((section, idx) => {
      if (idx % 2 === 1) {
        // This is a header
        if (currentSection && sectionContent.length > 0) {
          formattedSections.push({ title: currentSection, content: sectionContent.join('\n') });
        }
        currentSection = section;
        sectionContent = [];
      } else if (section.trim() && currentSection) {
        sectionContent.push(section.trim());
      }
    });
    
    // Add the last section
    if (currentSection && sectionContent.length > 0) {
      formattedSections.push({ title: currentSection, content: sectionContent.join('\n') });
    }
    
    const getSectionIcon = (title) => {
      if (title.includes('Health') || title.includes('Financial Health')) return '💎';
      if (title.includes('Win') || title.includes('Success') || title.includes('Positive')) return '✅';
      if (title.includes('Concern') || title.includes('Warning') || title.includes('Alert')) return '⚠️';
      if (title.includes('Action') || title.includes('Recommendation') || title.includes('Suggestion')) return '🎯';
      if (title.includes('Summary') || title.includes('Overview')) return '📊';
      if (title.includes('Trend') || title.includes('Pattern')) return '📈';
      return '💡';
    };
    
    const getSectionColor = (title) => {
      if (title.includes('Health') || title.includes('Financial Health')) return 'from-emerald-500/20 to-green-500/20 border-emerald-500/30';
      if (title.includes('Win') || title.includes('Success') || title.includes('Positive')) return 'from-green-500/20 to-emerald-500/20 border-green-500/30';
      if (title.includes('Concern') || title.includes('Warning') || title.includes('Alert')) return 'from-red-500/20 to-rose-500/20 border-red-500/30';
      if (title.includes('Action') || title.includes('Recommendation') || title.includes('Suggestion')) return 'from-amber-500/20 to-yellow-500/20 border-amber-500/30';
      if (title.includes('Summary') || title.includes('Overview')) return 'from-blue-500/20 to-indigo-500/20 border-blue-500/30';
      return 'from-purple-500/20 to-pink-500/20 border-purple-500/30';
    };
    
    return (
      <div className="space-y-6">
        {formattedSections.map((section, idx) => {
          const icon = getSectionIcon(section.title);
          const colorClass = getSectionColor(section.title);
          const hasList = section.content.includes('•') || section.content.includes('-');
          
            return (
            <div
              key={idx}
              className={`bg-gradient-to-br ${colorClass} rounded-xl p-6 border backdrop-blur-sm shadow-lg hover:shadow-xl transition-all`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center text-2xl">
                  {icon}
                </div>
                <h4 className="font-bold text-white text-xl">
                  {section.title}
              </h4>
              </div>
              
              <div className="pl-12">
                {hasList ? (
                  <ul className="space-y-3">
                    {section.content.split('\n').filter(line => line.trim()).map((line, i) => {
                      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
                        const cleanLine = line.replace(/^[•\-]\s*/, '').trim();
                        return (
                          <li key={i} className="flex items-start gap-3 text-slate-200 leading-relaxed">
                            <span className="text-amber-400 font-bold mt-1 flex-shrink-0">▸</span>
                            <span className="flex-1">{cleanLine}</span>
                          </li>
                        );
                      }
                      return (
                        <p key={i} className="text-slate-300 leading-relaxed mb-2">
                          {line.trim()}
                        </p>
                      );
                  })}
                </ul>
                ) : (
                  <p className="text-slate-200 leading-relaxed text-base">
                    {section.content}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#0a0e27]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-400 text-lg">Loading financial data...</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const barData = [
    { name: 'Income', value: analytics?.total_income || 0, color: CHART_COLORS.income },
    { name: 'Expenses', value: analytics?.total_expenses || 0, color: CHART_COLORS.expense },
  ];

  const pieData = (analytics?.category_breakdown || []).map(cat => ({
    name: cat.name,
    value: cat.amount
  }));

  const savingsRate = analytics?.total_income > 0
    ? ((analytics.net_savings / analytics.total_income) * 100).toFixed(1)
    : 0;

  // Recent 5 transactions
  const recentTransactions = transactions.slice(0, 5);

  // Daily spending trend (last 30 days)
  const getDailySpendingData = () => {
    const dailyData = {};
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    transactions
      .filter(txn => {
        const txnDate = new Date(txn.date);
        return txnDate >= thirtyDaysAgo && txnDate <= today && txn.amount < 0;
      })
      .forEach(txn => {
        const date = new Date(txn.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dailyData[date] = (dailyData[date] || 0) + Math.abs(txn.amount);
      });

    return Object.entries(dailyData)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-14);
  };

  // Weekly spending pattern
  const getWeeklyPatternData = () => {
    const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyData = dayOfWeek.map(day => ({ day, amount: 0 }));

    transactions
      .filter(txn => {
        const txnDate = new Date(txn.date);
        const monthStart = new Date(selectedMonth.year, selectedMonth.month - 1, 1);
        const monthEnd = new Date(selectedMonth.year, selectedMonth.month, 0);
        return txnDate >= monthStart && txnDate <= monthEnd && txn.amount < 0;
      })
      .forEach(txn => {
        const dayIndex = new Date(txn.date).getDay();
        weeklyData[dayIndex].amount += Math.abs(txn.amount);
      });

    return weeklyData;
  };

  // Cumulative net savings trend
  const getCumulativeSavingsData = () => {
    const monthStart = new Date(selectedMonth.year, selectedMonth.month - 1, 1);
    const monthEnd = new Date(selectedMonth.year, selectedMonth.month, 0);
    
    const dailySavings = {};
    let cumulative = 0;

    transactions
      .filter(txn => {
        const txnDate = new Date(txn.date);
        return txnDate >= monthStart && txnDate <= monthEnd;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .forEach(txn => {
        const date = new Date(txn.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        cumulative += txn.amount;
        dailySavings[date] = cumulative;
      });

    return Object.entries(dailySavings)
      .map(([date, savings]) => ({ date, savings: Math.max(0, savings) }))
      .slice(-14);
  };

  // Monthly comparison (current vs previous month)
  const getMonthlyComparisonData = () => {
    const prevMonth = selectedMonth.month === 1 ? { year: selectedMonth.year - 1, month: 12 } : { year: selectedMonth.year, month: selectedMonth.month - 1 };
    
    const currentMonthIncome = analytics?.total_income || 0;
    const currentMonthExpenses = analytics?.total_expenses || 0;
    
    const prevMonthStart = new Date(prevMonth.year, prevMonth.month - 1, 1);
    const prevMonthEnd = new Date(prevMonth.year, prevMonth.month, 0);
    
    let prevMonthIncome = 0;
    let prevMonthExpenses = 0;
    
    transactions.forEach(txn => {
      const txnDate = new Date(txn.date);
      if (txnDate >= prevMonthStart && txnDate <= prevMonthEnd) {
        if (txn.amount > 0) {
          prevMonthIncome += txn.amount;
        } else {
          prevMonthExpenses += Math.abs(txn.amount);
        }
      }
    });
    
    return [
      { month: 'Previous', income: prevMonthIncome, expenses: prevMonthExpenses },
      { month: 'Current', income: currentMonthIncome, expenses: currentMonthExpenses },
    ];
  };

  const dailySpendingData = getDailySpendingData();
  const weeklyPatternData = getWeeklyPatternData();
  const cumulativeSavingsData = getCumulativeSavingsData();
  const monthlyComparisonData = getMonthlyComparisonData();

  // Enhanced custom tooltip style for dark mode with better visual hierarchy
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-600/50 rounded-xl p-4 shadow-2xl">
          <p className="text-white font-semibold mb-2 text-sm">{label}</p>
          <div className="space-y-1">
            {payload.map((entry, index) => (
              <div key={index} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className="text-slate-300 text-sm">{entry.name}:</span>
                </div>
                <span className="text-white font-medium text-sm">
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

  return (
    <div className="overflow-x-hidden bg-[#0a0e27]">
      {/* Section 1: Header & Summary Cards */}
      <section className="min-h-screen flex flex-col justify-center px-6 py-12 bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#0f172a]">
        <div className="max-w-7xl mx-auto w-full">
      {/* Personalized Greeting */}
      {user && (
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-light text-slate-300 mb-1">
            Welcome back, <span className="font-semibold text-white">{user.username}</span>
          </h2>
          <p className="text-lg text-slate-400">
            Here's your financial overview for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      )}

      {/* Main Header */}
      <div className="text-center mb-12">
        <h1 className="text-6xl font-bold text-white mb-4 flex items-center justify-center gap-4">
          <span className="text-amber-400">💼</span>
          Financial Dashboard
        </h1>
        <p className="text-xl text-slate-400 mb-8">Complete financial overview & insights</p>

        {/* Month Navigator */}
        <div className="flex items-center justify-center gap-3 bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg px-6 py-3 border border-slate-700 max-w-md mx-auto">
          <button
            onClick={() => changeMonth(-1)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-xl text-slate-300 hover:text-white"
          >
            ◀
          </button>
              <span className="font-bold text-white min-w-[160px] text-center text-lg">
            {new Date(selectedMonth.year, selectedMonth.month - 1).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </span>
          <button
            onClick={() => changeMonth(1)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-xl text-slate-300 hover:text-white"
          >
            ▶
          </button>
        </div>
      </div>

      {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Income Card */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-xl p-6 border border-slate-700 hover:border-green-500/50 transition-all hover:shadow-2xl hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-400 uppercase tracking-wide">Income</span>
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📈</span>
                </div>
          </div>
              <p className="text-4xl font-bold text-green-400 mb-2">
            ${analytics?.total_income?.toFixed(2) || '0.00'}
          </p>
              <p className="text-sm text-slate-400">This month</p>
        </div>

            {/* Expenses Card */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-xl p-6 border border-slate-700 hover:border-red-500/50 transition-all hover:shadow-2xl hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-400 uppercase tracking-wide">Expenses</span>
                <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📉</span>
                </div>
          </div>
              <p className="text-4xl font-bold text-red-400 mb-2">
            ${analytics?.total_expenses?.toFixed(2) || '0.00'}
          </p>
              <p className="text-sm text-slate-400">This month</p>
        </div>

            {/* Net Savings Card */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-xl p-6 border border-slate-700 hover:border-amber-500/50 transition-all hover:shadow-2xl hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-400 uppercase tracking-wide">Net Savings</span>
                <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">💰</span>
                </div>
          </div>
              <p className={`text-4xl font-bold mb-2 ${(analytics?.net_savings || 0) >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
            ${Math.abs(analytics?.net_savings || 0).toFixed(2)}
          </p>
              <p className="text-sm text-slate-400">This month</p>
        </div>

            {/* Savings Rate Card */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-xl p-6 border border-slate-700 hover:border-blue-500/50 transition-all hover:shadow-2xl hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-400 uppercase tracking-wide">Savings Rate</span>
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
          </div>
              <p className={`text-4xl font-bold mb-2 ${savingsRate >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
            {savingsRate}%
          </p>
              <p className="text-sm text-slate-400">Of income saved</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Main Charts - Income vs Expenses & Category Breakdown */}
      <section className="min-h-screen flex flex-col justify-center px-6 py-12 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-3 flex items-center justify-center gap-3">
              <span className="text-amber-400">📊</span>
              Financial Overview
            </h2>
            <p className="text-xl text-slate-400">Income, expenses, and spending breakdown</p>
      </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bar Chart */}
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-emerald-400">💵</span>
                Income vs Expenses
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d4aa" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#00d4aa" stopOpacity={0.4}/>
                    </linearGradient>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
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
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={80}>
                    {barData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.name === 'Income' ? 'url(#incomeGradient)' : 'url(#expenseGradient)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

        {/* Pie Chart */}
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-teal-400">🥧</span>
                Spending by Category
              </h2>
          {pieData.length === 0 ? (
                <div className="flex items-center justify-center h-[300px] text-slate-400">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-slate-700/50 rounded-full flex items-center justify-center">
                      <span className="text-2xl">📊</span>
                    </div>
                    <p className="text-lg font-medium">No expense data for this month</p>
                    <p className="text-sm text-slate-500 mt-1">Add some transactions to see the breakdown</p>
                  </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => percent > 0.05 ? `${name.split(' ')[0]}: ${(percent * 100).toFixed(0)}%` : ''}
                  outerRadius={90}
                  innerRadius={40}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="#1e293b"
                  strokeWidth={2}
                >
                  {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS.categories[index % CHART_COLORS.categories.length]}
                          style={{
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                            transition: 'all 0.3s ease'
                          }}
                        />
                  ))}
                </Pie>
                    <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
        </div>
      </section>

      {/* Section 3: Spending Trends & Patterns */}
      <section className="min-h-screen flex flex-col justify-center px-6 py-12 bg-gradient-to-br from-[#0a0e27] to-[#1a1f3a]">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-3 flex items-center justify-center gap-3">
              <span className="text-amber-400">📈</span>
              Spending Trends
            </h2>
            <p className="text-xl text-slate-400">Daily patterns and weekly insights</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Daily Spending Trend */}
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-orange-400">📅</span>
                Daily Spending Trend (Last 14 Days)
              </h2>
              {dailySpendingData.length === 0 ? (
                <div className="flex items-center justify-center h-[300px] text-slate-400">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-slate-700/50 rounded-full flex items-center justify-center">
                      <span className="text-2xl">📈</span>
                    </div>
                    <p className="text-lg font-medium">No spending data available</p>
                    <p className="text-sm text-slate-500 mt-1">Add expenses to see daily trends</p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailySpendingData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff6b6b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ff6b6b" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis
                      dataKey="date"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      stroke="#94a3b8"
                      fontSize={11}
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
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#ff6b6b"
                      strokeWidth={3}
                      dot={{ fill: '#ff6b6b', r: 5, strokeWidth: 2, stroke: '#ffffff' }}
                      activeDot={{ r: 7, fill: '#ff6b6b', strokeWidth: 2, stroke: '#ffffff' }}
                      fill="url(#spendingGradient)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Weekly Spending Pattern */}
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-purple-400">📆</span>
                Weekly Spending Pattern
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyPatternData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="weeklyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4ecdc4" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#4ecdc4" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis
                    dataKey="day"
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
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={60}>
                    {weeklyPatternData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS.categories[index % CHART_COLORS.categories.length]}
                        style={{
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                          transition: 'all 0.3s ease'
                        }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Monthly Comparison & Savings Trend */}
      <section className="min-h-screen flex flex-col justify-center px-6 py-12 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-3 flex items-center justify-center gap-3">
              <span className="text-amber-400">⚖️</span>
              Progress & Comparison
            </h2>
            <p className="text-xl text-slate-400">Monthly comparison and savings growth</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Monthly Comparison */}
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-blue-400">📊</span>
                Monthly Comparison
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyComparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="incomeCompareGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d4aa" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#00d4aa" stopOpacity={0.4}/>
                    </linearGradient>
                    <linearGradient id="expenseCompareGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff6b6b" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ff6b6b" stopOpacity={0.4}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis
                    dataKey="month"
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
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{
                      color: '#94a3b8',
                      fontSize: '12px',
                      paddingTop: '10px'
                    }}
                  />
                  <Bar
                    dataKey="income"
                    fill="url(#incomeCompareGradient)"
                    radius={[4, 4, 0, 0]}
                    name="Income"
                    maxBarSize={50}
                  />
                  <Bar
                    dataKey="expenses"
                    fill="url(#expenseCompareGradient)"
                    radius={[4, 4, 0, 0]}
                    name="Expenses"
                    maxBarSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Cumulative Savings Trend */}
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-yellow-400">💎</span>
                Cumulative Savings Trend
              </h2>
              {cumulativeSavingsData.length === 0 ? (
                <div className="flex items-center justify-center h-[300px] text-slate-400">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-slate-700/50 rounded-full flex items-center justify-center">
                      <span className="text-2xl">💰</span>
                    </div>
                    <p className="text-lg font-medium">No savings data available</p>
                    <p className="text-sm text-slate-500 mt-1">Add income transactions to see savings growth</p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={cumulativeSavingsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ffd93d" stopOpacity={0.3}/>
                        <stop offset="50%" stopColor="#ffd93d" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#ffd93d" stopOpacity={0.05}/>
                      </linearGradient>
                      <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#ffd93d" />
                        <stop offset="100%" stopColor="#ffb347" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis
                      dataKey="date"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      stroke="#94a3b8"
                      fontSize={11}
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
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="savings"
                      stroke="url(#strokeGradient)"
                      fillOpacity={1}
                      fill="url(#colorSavings)"
                      strokeWidth={3}
                      dot={{ fill: '#ffd93d', r: 4, strokeWidth: 2, stroke: '#ffffff' }}
                      activeDot={{ r: 6, fill: '#ffd93d', strokeWidth: 2, stroke: '#ffffff' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: AI Financial Insights */}
      <section className="min-h-screen flex flex-col justify-center px-6 py-12 bg-gradient-to-br from-[#1a1f3a] via-[#0f172a] to-[#0a0e27]">
        <div className="max-w-7xl mx-auto w-full">
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-3xl shadow-2xl border border-slate-700">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/5 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full -ml-24 -mb-24"></div>
            
            {/* Model Badge - Top Right Corner */}
            {aiModelUsed && (
              <div className="absolute top-6 right-6 z-10">
                {(() => {
                  const modelInfo = getModelInfo(aiModelUsed);
                  const colorMap = {
                    emerald: 'from-emerald-500/20 to-green-500/20 border-emerald-400/50 text-emerald-300',
                    blue: 'from-blue-500/20 to-cyan-500/20 border-blue-400/50 text-blue-300',
                    purple: 'from-purple-500/20 to-pink-500/20 border-purple-400/50 text-purple-300',
                    cyan: 'from-cyan-500/20 to-blue-500/20 border-cyan-400/50 text-cyan-300',
                    pink: 'from-pink-500/20 to-rose-500/20 border-pink-400/50 text-pink-300',
                    amber: 'from-amber-500/20 to-yellow-500/20 border-amber-400/50 text-amber-300'
                  };
                  const colorClass = colorMap[modelInfo.color] || colorMap.amber;
                  
                  return (
                    <div className={`bg-gradient-to-br ${colorClass} backdrop-blur-md rounded-xl px-4 py-2.5 border shadow-xl flex items-center gap-2.5 hover:scale-105 transition-transform`}>
                      {modelInfo.logo.startsWith('http') ? (
                      <img
                        src={modelInfo.logo}
                        alt={modelInfo.name}
                        className="w-5 h-5 object-contain rounded-sm"
                      />
                    ) : (
                      <span className="text-lg">{modelInfo.logo}</span>
                    )}
                      <div className="flex flex-col">
                        <span className="text-xs font-bold leading-tight">{modelInfo.name}</span>
                        <span className="text-[10px] opacity-75 leading-tight font-medium">Powered by</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
        
        <div className="relative p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-400/20 backdrop-blur-sm rounded-xl border border-amber-400/30">
                <span className="text-3xl">🤖</span>
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white">AI Financial Insight</h2>
                    <p className="text-slate-400 text-sm">Powered by multiple frontier models</p>
              </div>
            </div>
          </div>

          {aiSummary ? (
                <div className="space-y-6">
                  <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-slate-700/50">
              {formatAISummary(aiSummary)}
                  </div>
                  
                  {/* Footer with actions */}
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-lg border border-green-500/30">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                        <span className="text-sm text-green-400 font-medium">Analysis Complete</span>
                      </div>
                      <div className="text-xs text-slate-400">
                        Generated {new Date().toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                </div>
                <button
                  onClick={handleGenerateAI}
                      className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-amber-400 hover:text-amber-300 font-medium rounded-lg flex items-center gap-2 transition-all border border-slate-600 hover:border-amber-400/30"
                >
                  <span>🔄</span>
                      <span>Refresh Analysis</span>
                </button>
              </div>
            </div>
          ) : (
                <div className="bg-slate-800/80 backdrop-blur-md rounded-xl p-12 text-center shadow-2xl border border-slate-700">
                  <div className="inline-block p-4 bg-amber-400/20 rounded-full mb-4 border border-amber-400/30">
                    {aiLoading && currentTryingModel ? (
                      (() => {
                        const modelInfo = getModelInfo(currentTryingModel);
                        const isUrl = modelInfo.logo.startsWith('http');
                        return isUrl ? (
                          <img
                            src={modelInfo.logo}
                            alt={modelInfo.name}
                            className="w-12 h-12 object-contain animate-pulse-fast rounded"
                          />
                        ) : (
                          <span className="text-5xl animate-pulse-fast">{modelInfo.logo}</span>
                        );
                      })()
                    ) : aiLoading ? (
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-400 border-t-transparent"></div>
                    ) : (
                <span className="text-5xl">✨</span>
                    )}
              </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {aiLoading && currentTryingModel ? (
                      <span className="flex items-center justify-center gap-2">
                        Analyzing with <span className="text-amber-400">{getModelInfo(currentTryingModel).name}</span>
                      </span>
                    ) : aiLoading ? (
                      'Analyzing Your Finances...'
                    ) : (
                      'Get Personalized Financial Advice'
                    )}
              </h3>
                  <p className="text-slate-400 mb-6 max-w-md mx-auto">
                    {aiLoading
                      ? 'Our AI is processing your financial data and generating personalized insights.'
                      : 'Our AI analyzes your spending patterns, compares to last month, and provides actionable insights.'
                    }
              </p>
              <button
                onClick={handleGenerateAI}
                disabled={aiLoading}
                    className="px-8 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50"
                  >
                    {aiLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-900 border-t-transparent"></div>
                        <span>Analyzing...</span>
                        {currentTryingModel && (() => {
                          const modelInfo = getModelInfo(currentTryingModel);
                          return (
                            <span className="ml-2 text-xs text-slate-700">
                              ({modelInfo.logo.startsWith('http') ? modelInfo.name : modelInfo.logo} {modelInfo.name})
                            </span>
                          );
                        })()}
                      </div>
                    ) : 'Generate AI Insights'}
              </button>
            </div>
          )}
        </div>
      </div>
        </div>
      </section>

      {/* Section 6: Recent Activity */}
      <section className="min-h-screen flex flex-col justify-center px-6 py-12 bg-[#0a0e27]">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-3 flex items-center justify-center gap-3">
              <span className="text-amber-400">📝</span>
            Recent Activity
            </h2>
            <p className="text-xl text-slate-400">Your latest transactions</p>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-amber-400">💳</span>
                Recent Transactions
          </h2>
          <a
            href="/history"
                className="text-amber-400 hover:text-amber-300 font-medium text-sm flex items-center gap-1 transition-colors"
          >
            View All
            <span>→</span>
          </a>
        </div>
        
        {recentTransactions.length === 0 ? (
          <div className="text-center py-12">
                <div className="inline-block p-4 bg-slate-700/50 rounded-full mb-4">
              <span className="text-4xl">📊</span>
            </div>
                <p className="text-slate-400 mb-4">No transactions yet</p>
            <a
              href="/transactions"
                  className="inline-block px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 rounded-lg font-semibold hover:from-amber-500 hover:to-amber-600 transition-all"
            >
              Add Your First Transaction
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTransactions.map((txn) => (
              <div
                key={txn.id}
                    className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-all border border-slate-600/50"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                        txn.amount > 0 ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'
                  }`}>
                    {txn.category_icon}
                  </div>
                  <div>
                        <p className="font-semibold text-white">{txn.description}</p>
                        <p className="text-sm text-slate-400">{txn.category_name}</p>
                  </div>
                </div>
                    <p className={`text-lg font-bold ${txn.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {txn.amount > 0 ? '+' : ''}${Math.abs(txn.amount).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
