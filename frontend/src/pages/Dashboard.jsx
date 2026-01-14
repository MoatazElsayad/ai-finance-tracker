/**
 * Dashboard - Complete Financial Overview with Charts & AI
 * Combines: Summary, Charts, Analytics, AI Insights
 */
import { useState, useEffect } from 'react';
import { getTransactions, getMonthlyAnalytics, generateAISummary } from '../api';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#6366f1', '#14b8a6'];

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
              <h4 key={idx} className="font-bold text-gray-900 text-lg mt-4 flex items-center gap-2">
                {section.includes('Health') && '💰'}
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
                        <li key={i} className="flex items-start gap-2 text-gray-700">
                          <span className="text-blue-600 font-bold">→</span>
                          <span>{line.replace(/^[•\-]\s*/, '').trim()}</span>
                        </li>
                      );
                    }
                    return <p key={i} className="text-gray-700">{line}</p>;
                  })}
                </ul>
              );
            }
            return <p key={idx} className="text-gray-700 leading-relaxed">{section.trim()}</p>;
          }
          return null;
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Prepare chart data
  const barData = [
    { name: 'Income', value: analytics?.total_income || 0, color: '#10b981' },
    { name: 'Expenses', value: analytics?.total_expenses || 0, color: '#ef4444' },
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

  return (
    <div className="space-y-6">
      {/* Header with Month Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Complete financial overview & insights</p>
        </div>

        {/* Month Navigator */}
        <div className="flex items-center gap-3 bg-white rounded-xl shadow-sm px-4 py-2 border border-gray-200">
          <button
            onClick={() => changeMonth(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ◀
          </button>
          <span className="font-bold text-gray-900 min-w-[120px] text-center">
            {new Date(selectedMonth.year, selectedMonth.month - 1).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </span>
          <button
            onClick={() => changeMonth(1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ▶
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm p-6 border border-green-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-700">Income</span>
            <span className="text-3xl">📈</span>
          </div>
          <p className="text-3xl font-bold text-green-700">
            ${analytics?.total_income?.toFixed(2) || '0.00'}
          </p>
          <p className="text-sm text-green-600 mt-1">This month</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl shadow-sm p-6 border border-red-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-red-700">Expenses</span>
            <span className="text-3xl">📉</span>
          </div>
          <p className="text-3xl font-bold text-red-700">
            ${analytics?.total_expenses?.toFixed(2) || '0.00'}
          </p>
          <p className="text-sm text-red-600 mt-1">This month</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm p-6 border border-blue-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700">Net Savings</span>
            <span className="text-3xl">💰</span>
          </div>
          <p className={`text-3xl font-bold ${(analytics?.net_savings || 0) >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
            ${Math.abs(analytics?.net_savings || 0).toFixed(2)}
          </p>
          <p className="text-sm text-blue-600 mt-1">This month</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl shadow-sm p-6 border border-purple-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-700">Savings Rate</span>
            <span className="text-3xl">📊</span>
          </div>
          <p className={`text-3xl font-bold ${savingsRate >= 0 ? 'text-purple-700' : 'text-red-700'}`}>
            {savingsRate}%
          </p>
          <p className="text-sm text-purple-600 mt-1">Of income saved</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">📊</span>
            Income vs Expenses
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">🥧</span>
            Spending by Category
          </h2>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
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
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* AI Summary Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 rounded-2xl shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
        
        <div className="relative p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <span className="text-3xl">🤖</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">AI Financial Insight</h2>
                <p className="text-blue-100 text-sm">Powered by advanced AI analysis</p>
              </div>
            </div>
            <button
              onClick={handleGenerateAI}
              disabled={aiLoading}
              className="px-6 py-3 bg-white text-purple-600 rounded-xl hover:bg-blue-50 disabled:opacity-50 font-semibold shadow-lg hover:shadow-xl transition-all disabled:cursor-not-allowed flex items-center gap-2"
            >
              {aiLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
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
            <div className="bg-white/95 backdrop-blur-md rounded-xl p-6 shadow-2xl border border-white/20">
              {formatAISummary(aiSummary)}
              <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span>AI Analysis Complete</span>
                </div>
                <button
                  onClick={handleGenerateAI}
                  className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                >
                  <span>🔄</span>
                  Refresh Analysis
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white/95 backdrop-blur-md rounded-xl p-12 text-center shadow-2xl border border-white/20">
              <div className="inline-block p-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full mb-4">
                <span className="text-5xl">✨</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Get Personalized Financial Advice
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Our AI analyzes your spending patterns, compares to last month, and provides actionable insights.
              </p>
              <button
                onClick={handleGenerateAI}
                disabled={aiLoading}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50"
              >
                {aiLoading ? 'Analyzing...' : 'Generate AI Insights'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="text-2xl">📝</span>
            Recent Activity
          </h2>
          <a
            href="/history"
            className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
          >
            View All
            <span>→</span>
          </a>
        </div>
        
        {recentTransactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
              <span className="text-4xl">📊</span>
            </div>
            <p className="text-gray-500 mb-4">No transactions yet</p>
            <a
              href="/transactions"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Add Your First Transaction
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTransactions.map((txn) => (
              <div
                key={txn.id}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:shadow-md transition-all border border-gray-200"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                    txn.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {txn.category_icon}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{txn.description}</p>
                    <p className="text-sm text-gray-500">{txn.category_name}</p>
                  </div>
                </div>
                <p className={`text-lg font-bold ${txn.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {txn.amount > 0 ? '+' : ''}${Math.abs(txn.amount).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;