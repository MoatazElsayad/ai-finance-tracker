/**
 * Dashboard - Dark Mode Finance Tracker
 * Professional financial dashboard with unified dark theme
 */
import { useState, useEffect } from 'react';
import { getTransactions, getMonthlyAnalytics, generateAISummary } from '../api';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, AreaChart, Area } from 'recharts';

// Dark mode chart colors - professional finance palette
const CHART_COLORS = {
  income: '#10b981',
  expense: '#ef4444',
  savings: '#fbbf24',
  accent: '#3b82f6',
  categories: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#6366f1', '#14b8a6', '#f97316', '#06b6d4']
};

function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [aiSummary, setAiSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });

  useEffect(() => {
    loadDashboard();
  }, [selectedMonth]);

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
    setAiLoading(true);
    try {
      const result = await generateAISummary(selectedMonth.year, selectedMonth.month);
      setAiSummary(result.summary);
    } catch (error) {
      alert(error.message);
    } finally {
      setAiLoading(false);
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

  const formatAISummary = (text) => {
    if (!text) return null;
    const sections = text.split(/\*\*(.*?)\*\*/g);
    
    return (
      <div className="space-y-4">
        {sections.map((section, idx) => {
          if (idx % 2 === 1) {
            return (
              <h4 key={idx} className="font-bold text-white text-lg mt-4 flex items-center gap-2">
                {section.includes('Health') && '💎'}
                {section.includes('Win') && '✅'}
                {section.includes('Concern') && '⚠️'}
                {section.includes('Action') && '🎯'}
                {section}
              </h4>
            );
          }
          if (section.trim()) {
            if (section.includes('•') || section.includes('-')) {
              const lines = section.split('\n').filter(line => line.trim());
              return (
                <ul key={idx} className="space-y-2 ml-4">
                  {lines.map((line, i) => {
                    if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
                      return (
                        <li key={i} className="flex items-start gap-2 text-slate-300">
                          <span className="text-amber-400 font-bold">→</span>
                          <span>{line.replace(/^[•\-]\s*/, '').trim()}</span>
                        </li>
                      );
                    }
                    return <p key={i} className="text-slate-300">{line}</p>;
                  })}
                </ul>
              );
            }
            return <p key={idx} className="text-slate-300 leading-relaxed">{section.trim()}</p>;
          }
          return null;
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

  // Custom tooltip style for dark mode
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-slate-300 mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: ${entry.value.toFixed(2)}
            </p>
          ))}
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
          {/* Header with Month Selector */}
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-5xl font-bold text-white mb-2 flex items-center gap-3">
                <span className="text-amber-400">💼</span>
                Financial Dashboard
              </h1>
              <p className="text-xl text-slate-400">Complete financial overview & insights</p>
            </div>

            {/* Month Navigator */}
            <div className="flex items-center gap-3 bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg px-6 py-3 border border-slate-700">
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
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-slate-700">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-amber-400">💵</span>
                Income vs Expenses
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Chart */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-slate-700">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-amber-400">🥧</span>
                Spending by Category
              </h2>
              {pieData.length === 0 ? (
                <div className="flex items-center justify-center h-[300px] text-slate-400">
                  No expense data for this month
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS.categories[index % CHART_COLORS.categories.length]} />
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
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-slate-700">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-amber-400">📅</span>
                Daily Spending Trend (Last 14 Days)
              </h2>
              {dailySpendingData.length === 0 ? (
                <div className="flex items-center justify-center h-[300px] text-slate-400">
                  No spending data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailySpendingData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke={CHART_COLORS.expense} 
                      strokeWidth={2}
                      dot={{ fill: CHART_COLORS.expense, r: 4 }}
                      activeDot={{ r: 6, fill: CHART_COLORS.expense }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Weekly Spending Pattern */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-slate-700">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-amber-400">📆</span>
                Weekly Spending Pattern
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyPatternData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="day" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                    {weeklyPatternData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS.categories[index % CHART_COLORS.categories.length]} />
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
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-slate-700">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-amber-400">📊</span>
                Monthly Comparison
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ color: '#94a3b8' }} />
                  <Bar dataKey="income" fill={CHART_COLORS.income} radius={[8, 8, 0, 0]} name="Income" />
                  <Bar dataKey="expenses" fill={CHART_COLORS.expense} radius={[8, 8, 0, 0]} name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Cumulative Savings Trend */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-slate-700">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-amber-400">💎</span>
                Cumulative Savings Trend
              </h2>
              {cumulativeSavingsData.length === 0 ? (
                <div className="flex items-center justify-center h-[300px] text-slate-400">
                  No savings data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={cumulativeSavingsData}>
                    <defs>
                      <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.savings} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={CHART_COLORS.savings} stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="savings" 
                      stroke={CHART_COLORS.savings} 
                      fillOpacity={1} 
                      fill="url(#colorSavings)"
                      strokeWidth={2}
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
            
            <div className="relative p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-400/20 backdrop-blur-sm rounded-xl border border-amber-400/30">
                    <span className="text-3xl">🤖</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">AI Financial Insight</h2>
                    <p className="text-slate-400 text-sm">Powered by advanced AI analysis</p>
                  </div>
                </div>
                <button
                  onClick={handleGenerateAI}
                  disabled={aiLoading}
                  className="px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 rounded-xl hover:from-amber-500 hover:to-amber-600 disabled:opacity-50 font-semibold shadow-lg hover:shadow-xl transition-all disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {aiLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-900 border-t-transparent"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      Generate
                    </>
                  )}
                </button>
              </div>

              {aiSummary ? (
                <div className="bg-slate-800/80 backdrop-blur-md rounded-xl p-6 shadow-2xl border border-slate-700">
                  {formatAISummary(aiSummary)}
                  <div className="mt-6 pt-4 border-t border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <span>AI Analysis Complete</span>
                    </div>
                    <button
                      onClick={handleGenerateAI}
                      className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 transition-colors"
                    >
                      <span>🔄</span>
                      Refresh Analysis
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-800/80 backdrop-blur-md rounded-xl p-12 text-center shadow-2xl border border-slate-700">
                  <div className="inline-block p-4 bg-amber-400/20 rounded-full mb-4 border border-amber-400/30">
                    <span className="text-5xl">✨</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Get Personalized Financial Advice
                  </h3>
                  <p className="text-slate-400 mb-6 max-w-md mx-auto">
                    Our AI analyzes your spending patterns, compares to last month, and provides actionable insights.
                  </p>
                  <button
                    onClick={handleGenerateAI}
                    disabled={aiLoading}
                    className="px-8 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50"
                  >
                    {aiLoading ? 'Analyzing...' : 'Generate AI Insights'}
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
