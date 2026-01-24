import { ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, AreaChart, Area, ReferenceLine, Brush } from 'recharts';
import { RefreshCw, Sparkles, Bot, TrendingUp, TrendingDown, Wallet, Percent, LayoutDashboard, Scale, History, ArrowLeftRight } from 'lucide-react';
import { CHART_COLORS, getModelInfo } from './DashboardUtils';

export const CustomTooltip = ({ active, payload, label, theme }) => {
  if (active && payload && payload.length) {
    return (
      <div className={`${theme === 'dark' ? 'bg-slate-900/95 border-slate-600/50' : 'bg-white/95 border-slate-300/50'} backdrop-blur-md border rounded-xl p-4 shadow-2xl`}>
        <p className={`${theme === 'dark' ? 'text-white' : 'text-slate-900'} font-semibold mb-2 text-sm`}>{label}</p>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
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

export const formatAISummary = (text, theme) => {
  if (!text) return null;
  const sections = text.split(/\*\*(.*?)\*\*/g);
  let currentSection = null;
  let sectionContent = [];
  const formattedSections = [];

  sections.forEach((section, idx) => {
    if (idx % 2 === 1) {
      if (currentSection && sectionContent.length > 0) {
        formattedSections.push({ title: currentSection, content: sectionContent.join('\n') });
      }
      currentSection = section;
      sectionContent = [];
    } else if (section.trim() && currentSection) {
      let content = section.trim();
      if (content.startsWith(':')) {
        content = content.substring(1).trim();
      }
      if (content) {
        sectionContent.push(content);
      }
    }
  });

  if (currentSection && sectionContent.length > 0) {
    formattedSections.push({ title: currentSection, content: sectionContent.join('\n') });
  }

  const getSectionAccent = (title) => {
    if (title.includes('Health') || title.includes('Financial Health')) return 'emerald';
    if (title.includes('Win') || title.includes('Success') || title.includes('Positive')) return 'green';
    if (title.includes('Concern') || title.includes('Warning') || title.includes('Alert')) return 'red';
    if (title.includes('Action') || title.includes('Recommendation') || title.includes('Suggestion')) return 'amber';
    if (title.includes('Summary') || title.includes('Overview')) return 'blue';
    if (title.includes('Trend') || title.includes('Pattern')) return 'cyan';
    return 'slate';
  };

  const accentColors = {
    emerald: { border: 'border-emerald-500/50', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    green: { border: 'border-green-500/50', text: 'text-green-400', bg: 'bg-green-500/10' },
    red: { border: 'border-red-500/50', text: 'text-red-400', bg: 'bg-red-500/10' },
    amber: { border: 'border-amber-500/50', text: 'text-amber-400', bg: 'bg-amber-500/10' },
    blue: { border: 'border-blue-500/50', text: 'text-blue-400', bg: 'bg-blue-500/10' },
    cyan: { border: 'border-cyan-500/50', text: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    slate: { border: 'border-slate-500/30', text: 'text-slate-300', bg: 'bg-slate-500/5' },
  };

  return (
    <div className={`border ${theme === 'dark' ? 'border-slate-600/50 bg-slate-700/20' : 'border-slate-300/50 bg-slate-100/30'} rounded-lg p-6 space-y-6`}>
      {formattedSections.map((section, idx) => {
        const accentKey = getSectionAccent(section.title);
        const colors = accentColors[accentKey];
        const hasList = section.content.includes('•') || section.content.includes('-');
        return (
          <div key={idx} className={idx !== formattedSections.length - 1 ? `pb-6 ${theme === 'dark' ? 'border-b border-slate-600/30' : 'border-b border-slate-300/30'}` : ''}>
            <h4 className={`font-semibold text-base ${colors.text} mb-3 flex items-center gap-2`}>
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor:
                    colors.text.includes('emerald') ? '#10b981' :
                    colors.text.includes('green') ? '#22c55e' :
                    colors.text.includes('red') ? '#ef4444' :
                    colors.text.includes('amber') ? '#f59e0b' :
                    colors.text.includes('blue') ? '#3b82f6' :
                    colors.text.includes('cyan') ? '#06b6d4' :
                    '#cbd5e1',
                }}
              ></span>
              {section.title}
            </h4>
            <div className="pl-5">
              {hasList ? (
                <ul className="space-y-2">
                  {section.content.split('\n').filter((line) => line.trim()).map((line, i) => {
                    if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
                      const cleanLine = line.replace(/^[•\-]\s*/, '').trim();
                      return (
                        <li key={i} className={`flex items-start gap-3 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} leading-relaxed text-sm`}>
                          <span className={`${colors.text} font-semibold mt-0.5 flex-shrink-0`}>→</span>
                          <span className="flex-1">{cleanLine}</span>
                        </li>
                      );
                    }
                    return (
                      <p key={i} className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} leading-relaxed text-sm`}>{line.trim()}</p>
                    );
                  })}
                </ul>
              ) : (
                <p className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} leading-relaxed text-sm`}>{section.content}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const SectionHeaderAndSummary = ({
  theme,
  user,
  viewMode,
  selectedMonth,
  setViewMode,
  changeMonth,
  changeYear,
  analytics,
}) => {
  const savingsRate =
    analytics?.total_income > 0
      ? ((analytics.net_savings / analytics.total_income) * 100).toFixed(1)
      : 0;
  return (
    <section className={`min-h-screen flex flex-col justify-center px-6 py-12 ${theme === 'dark' ? 'bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#0f172a]' : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'}`}>
      <div className="max-w-7xl mx-auto w-full">
        {user && (
          <div className="mb-6 text-center">
            <h2 className={`text-3xl font-light ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'} mb-1`}>
              Welcome back, <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{user.first_name}</span>
            </h2>
            <p className={`text-lg ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Here's your financial overview for {viewMode === 'monthly' ? new Date(selectedMonth.year, selectedMonth.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : `${selectedMonth.year}`}
            </p>
          </div>
        )}
        <div className="text-center mb-12">
          <h1 className={`text-6xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-4 flex items-center justify-center gap-4`}>
            <span className="text-amber-400">💼</span>
            Financial Dashboard
          </h1>
          <p className={`text-xl ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} mb-8`}>Complete financial overview & insights</p>
          <div className="flex flex-col items-center justify-center gap-4 mb-6">
            <div className={`flex items-center gap-2 ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-200/50'} backdrop-blur-sm rounded-lg p-1 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-300'} border`}>
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
            <div className={`flex items-center justify-center gap-3 ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-200/50'} backdrop-blur-sm rounded-xl shadow-lg px-6 py-3 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-300'} border`}>
              {viewMode !== 'overall' && (
                <>
                  <button
                    onClick={() => (viewMode === 'monthly' ? changeMonth(-1) : changeYear(-1))}
                    className={`p-2 hover:${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-300'} rounded-lg transition-colors text-xl ${theme === 'dark' ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    ◀
                  </button>
                  <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} min-w-[160px] text-center text-lg`}>
                    {viewMode === 'monthly'
                      ? new Date(selectedMonth.year, selectedMonth.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                      : `Year ${selectedMonth.year}`}
                  </span>
                  <button
                    onClick={() => (viewMode === 'monthly' ? changeMonth(1) : changeYear(1))}
                    className={`p-2 hover:${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-300'} rounded-lg transition-colors text-xl ${theme === 'dark' ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    ▶
                  </button>
                </>
              )}
              {viewMode === 'overall' && (
                <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-lg`}>All Time Data</span>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-gradient-to-br from-white to-slate-50'} rounded-xl shadow-xl p-6 ${theme === 'dark' ? 'border-slate-700 hover:border-green-500/50' : 'border-slate-200 hover:border-green-400/50'} border transition-all hover:shadow-2xl hover:scale-105`}>
            <div className="flex items-center justify-between mb-4">
              <span className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wide`}>Income</span>
              <div className={`w-12 h-12 ${theme === 'dark' ? 'bg-green-500/20' : 'bg-green-100'} rounded-lg flex items-center justify-center`}>
                <TrendingUp className={`w-7 h-7 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} strokeWidth={2} />
              </div>
            </div>
            <p className={`text-4xl font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'} mb-2`}>
              ${analytics?.total_income?.toFixed(2) || '0.00'}
            </p>
            <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{viewMode === 'monthly' ? 'This month' : viewMode === 'yearly' ? 'This year' : 'All time'}</p>
          </div>
          <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-gradient-to-br from-white to-slate-50'} rounded-xl shadow-xl p-6 ${theme === 'dark' ? 'border-slate-700 hover:border-red-500/50' : 'border-slate-200 hover:border-red-400/50'} border transition-all hover:shadow-2xl hover:scale-105`}>
            <div className="flex items-center justify-between mb-4">
              <span className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wide`}>Expenses</span>
              <div className={`w-12 h-12 ${theme === 'dark' ? 'bg-red-500/20' : 'bg-red-100'} rounded-lg flex items-center justify-center`}>
                <TrendingDown className={`w-7 h-7 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} strokeWidth={2} />
              </div>
            </div>
            <p className={`text-4xl font-bold ${theme === 'dark' ? 'text-red-400' : 'text-red-600'} mb-2`}>
              ${analytics?.total_expenses?.toFixed(2) || '0.00'}
            </p>
            <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{viewMode === 'monthly' ? 'This month' : viewMode === 'yearly' ? 'This year' : 'All time'}</p>
          </div>
          <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-gradient-to-br from-white to-slate-50'} rounded-xl shadow-xl p-6 ${theme === 'dark' ? 'border-slate-700 hover:border-amber-500/50' : 'border-slate-200 hover:border-amber-400/50'} border transition-all hover:shadow-2xl hover:scale-105`}>
            <div className="flex items-center justify-between mb-4">
              <span className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wide`}>Net Savings</span>
              <div className={`w-12 h-12 ${theme === 'dark' ? 'bg-amber-500/20' : 'bg-amber-100'} rounded-lg flex items-center justify-center`}>
                <Wallet className={`w-7 h-7 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`} strokeWidth={2} />
              </div>
            </div>
            <p className={`text-4xl font-bold mb-2 ${(analytics?.net_savings || 0) >= 0 ? (theme === 'dark' ? 'text-amber-400' : 'text-amber-600') : (theme === 'dark' ? 'text-red-400' : 'text-red-600')}`}>
              ${Math.abs(analytics?.net_savings || 0).toFixed(2)}
            </p>
            <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{viewMode === 'monthly' ? 'This month' : viewMode === 'yearly' ? 'This year' : 'All time'}</p>
          </div>
          <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-gradient-to-br from-white to-slate-50'} rounded-xl shadow-xl p-6 ${theme === 'dark' ? 'border-slate-700 hover:border-blue-500/50' : 'border-slate-200 hover:border-blue-400/50'} border transition-all hover:shadow-2xl hover:scale-105`}>
            <div className="flex items-center justify-between mb-4">
              <span className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wide`}>Savings Rate</span>
              <div className={`w-12 h-12 ${theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'} rounded-lg flex items-center justify-center`}>
                <Percent className={`w-7 h-7 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} strokeWidth={2} />
              </div>
            </div>
            <p className={`text-4xl font-bold mb-2 ${savingsRate >= 0 ? (theme === 'dark' ? 'text-blue-400' : 'text-blue-600') : (theme === 'dark' ? 'text-red-400' : 'text-red-600')}`}>
              {savingsRate}%
            </p>
            <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Of income saved</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export const ReportsSection = ({ theme, reportLoading, reportProgress, reportStatus, handleDownloadReport }) => {
  return (
    <section className={`min-h-screen flex flex-col justify-center px-6 py-12 ${theme === 'dark' ? 'bg-[#0f172a]' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className={`text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-3 flex items-center justify-center gap-3`}>
            <Scale className={`w-10 h-10 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`} strokeWidth={1.8} />
            Reports
          </h2>
          <p className={`text-xl ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            Download a professional report with summary, charts, budgets, and AI recommendations.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8">
          <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-gradient-to-br from-white to-slate-50'} rounded-xl shadow-xl p-6 ${theme === 'dark' ? 'border-slate-700 hover:border-amber-500/50' : 'border-slate-200 hover:border-amber-400/50'} border transition-all`}>
            <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-4`}>Download</h3>
            <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} mb-4`}>
              PDF includes AI recommendations with model credit, budgets status, charts and transactions.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleDownloadReport('pdf')}
                disabled={reportLoading}
                className={`px-5 py-3 rounded-lg font-semibold shadow transition-all ${theme === 'dark' ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 hover:from-amber-500 hover:to-amber-600' : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700'} disabled:opacity-50`}
              >
                {reportLoading ? 'Generating...' : 'Download PDF'}
              </button>
              <button
                onClick={() => handleDownloadReport('csv')}
                disabled={reportLoading}
                className={`px-5 py-3 rounded-lg font-semibold shadow transition-all ${theme === 'dark' ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-100'} disabled:opacity-50`}
              >
                {reportLoading ? 'Preparing...' : 'Download CSV'}
              </button>
            </div>
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} text-sm`}>{reportStatus}</span>
                <span className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} text-sm`}>{Math.round(reportProgress)}%</span>
              </div>
              <div className={`w-full h-2 rounded-full ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'}`}>
                <div className={`h-2 rounded-full ${theme === 'dark' ? 'bg-amber-400' : 'bg-amber-600'} transition-all`} style={{ width: `${reportProgress}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export const MainChartsSection = ({ theme, barData, pieData }) => {
  return (
    <section className={`min-h-screen flex flex-col justify-center px-6 py-12 ${theme === 'dark' ? 'bg-[#0f172a]' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className={`text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-3 flex items-center justify-center gap-3`}>
            <LayoutDashboard className={`w-11 h-11 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`} strokeWidth={2} />
            Financial Overview
          </h2>
          <p className={`text-xl ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Income, expenses, and spending breakdown</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-slate-800/60 to-slate-900/60' : 'bg-gradient-to-br from-white to-slate-50'} backdrop-blur-sm rounded-xl shadow-xl p-6 ${theme === 'dark' ? 'border-slate-700/50 hover:border-slate-600/50' : 'border-slate-200/50 hover:border-slate-300/50'} border transition-all`}>
            <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-4 flex items-center gap-2`}>
              <span className="text-emerald-400">💵</span>
              Income vs Expenses
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4aa" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#00d4aa" stopOpacity={0.4} />
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff6b6b" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ff6b6b" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#cbd5e1'} opacity={0.3} />
                <XAxis dataKey="name" stroke={theme === 'dark' ? '#94a3b8' : '#475569'} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={theme === 'dark' ? '#94a3b8' : '#475569'} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip content={<CustomTooltip theme={theme} />} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={80}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'Income' ? 'url(#incomeGradient)' : 'url(#expenseGradient)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-slate-800/60 to-slate-900/60' : 'bg-gradient-to-br from-white to-slate-50'} backdrop-blur-sm rounded-xl shadow-xl p-6 ${theme === 'dark' ? 'border-slate-700/50 hover:border-slate-600/50' : 'border-slate-200/50 hover:border-slate-300/50'} border transition-all`}>
            <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-4 flex items-center gap-2`}>
              <span className="text-teal-400">🥧</span>
              Spending by Category
            </h2>
            {pieData.length === 0 ? (
              <div className={`flex items-center justify-center h-[300px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-200'} rounded-full flex items-center justify-center`}>
                    <span className="text-2xl">📊</span>
                  </div>
                  <p className="text-lg font-medium">No expense data for this month</p>
                  <p className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'} mt-1`}>Add some transactions to see the breakdown</p>
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
                    label={({ name, percent }) => (percent > 0.05 ? `${name.split(' ')[0]}: ${(percent * 100).toFixed(0)}%` : '')}
                    outerRadius={90}
                    innerRadius={40}
                    fill="#8884d8"
                    dataKey="value"
                    stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'}
                    strokeWidth={2}
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS.categories[index % CHART_COLORS.categories.length]}
                        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))', transition: 'all 0.3s ease' }}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip theme={theme} />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export const SpendingTrendsSection = ({ theme, dailySpendingData, avgDailySpending, dailySpendingChartData, weeklyPatternData }) => {
  return (
    <section className={`min-h-screen flex flex-col justify-center px-6 py-12 ${theme === 'dark' ? 'bg-gradient-to-br from-[#0a0e27] to-[#1a1f3a]' : 'bg-gradient-to-br from-slate-50 to-white'}`}>
      <div className="max-w-7xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className={`text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-3 flex items-center justify-center gap-3`}>
            <TrendingUp className={`w-11 h-11 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} strokeWidth={2} />
            Spending Trends
          </h2>
          <p className={`text-xl ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Daily patterns and weekly insights</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-slate-800/60 to-slate-900/60' : 'bg-gradient-to-br from-white to-slate-50'} backdrop-blur-sm rounded-xl shadow-xl p-6 ${theme === 'dark' ? 'border-slate-700/50 hover:border-slate-600/50' : 'border-slate-200/50 hover:border-slate-300/50'} border transition-all`}>
            <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-4 flex items-center gap-2`}>
              <span className="text-orange-400">📅</span>
              Daily Spending Trend (Last 14 Days)
            </h2>
            {dailySpendingData.length === 0 ? (
              <div className={`flex items-center justify-center h-[300px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-200'} rounded-full flex items-center justify-center`}>
                    <span className="text-2xl">📈</span>
                  </div>
                  <p className="text-lg font-medium">No spending data available</p>
                  <p className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'} mt-1`}>Add expenses to see daily trends</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailySpendingChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} syncId="dashboardSync">
                  <defs>
                    <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff6b6b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ff6b6b" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="maGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#cbd5e1'} opacity={0.3} />
                  <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} stroke={theme === 'dark' ? '#94a3b8' : '#475569'} fontSize={11} tick={{ fill: theme === 'dark' ? '#f59e0b' : '#334155' }} tickLine={false} axisLine={false} />
                  <YAxis stroke={theme === 'dark' ? '#94a3b8' : '#475569'} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip content={<CustomTooltip theme={theme} />} />
                  <Line type="monotone" dataKey="amount" stroke="#ff6b6b" strokeWidth={3} dot={{ fill: '#ff6b6b', r: 5, strokeWidth: 2, stroke: '#ffffff' }} activeDot={{ r: 7, fill: '#ff6b6b', strokeWidth: 2, stroke: '#ffffff' }} fill="url(#spendingGradient)" />
                  <Line type="monotone" dataKey="ma3" name="3-day MA" stroke="#f59e0b" strokeDasharray="6 4" strokeWidth={2} dot={false} activeDot={{ r: 6, fill: '#f59e0b' }} fill="url(#maGradient)" />
                  <ReferenceLine y={avgDailySpending} stroke="#94a3b8" strokeDasharray="3 3" label={{ value: 'Avg', position: 'right', fill: theme === 'dark' ? '#94a3b8' : '#475569' }} />
                  <Brush dataKey="date" travellerWidth={10} height={24} stroke={theme === 'dark' ? '#94a3b8' : '#475569'} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-slate-800/60 to-slate-900/60' : 'bg-gradient-to-br from-white to-slate-50'} backdrop-blur-sm rounded-xl shadow-xl p-6 ${theme === 'dark' ? 'border-slate-700/50 hover:border-slate-600/50' : 'border-slate-200/50 hover:border-slate-300/50'} border transition-all`}>
            <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-4 flex items-center gap-2`}>
              <span className="text-purple-400">📆</span>
              Weekly Spending Pattern
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyPatternData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} syncId="dashboardSync">
                <defs>
                  <linearGradient id="weeklyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ecdc4" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#4ecdc4" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#cbd5e1'} opacity={0.3} />
                <XAxis dataKey="day" stroke={theme === 'dark' ? '#94a3b8' : '#475569'} fontSize={12} tick={{ fill: theme === 'dark' ? '#f59e0b' : '#334155' }} tickLine={false} axisLine={false} />
                <YAxis stroke={theme === 'dark' ? '#94a3b8' : '#475569'} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip content={<CustomTooltip theme={theme} />} />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={60}>
                  {weeklyPatternData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS.categories[index % CHART_COLORS.categories.length]}
                      style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))', transition: 'all 0.3s ease' }}
                    />
                  ))}
                </Bar>
                <Brush dataKey="day" travellerWidth={10} height={24} stroke={theme === 'dark' ? '#94a3b8' : '#475569'} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
};

export const ProgressComparisonSection = ({ theme, cumulativeSavingsData, monthlyComparisonData }) => {
  return (
    <section className={`min-h-screen flex flex-col justify-center px-6 py-12 ${theme === 'dark' ? 'bg-[#0f172a]' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className={`text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-3 flex items-center justify-center gap-3`}>
            <Scale className={`w-11 h-11 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`} strokeWidth={2} />
            Progress & Comparison
          </h2>
          <p className={`text-xl ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Monthly comparison and savings growth</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-slate-800/60 to-slate-900/60' : 'bg-gradient-to-br from-white to-slate-50'} backdrop-blur-sm rounded-xl shadow-xl p-6 ${theme === 'dark' ? 'border-slate-700/50 hover:border-slate-600/50' : 'border-slate-200/50 hover:border-slate-300/50'} border transition-all`}>
            <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-4 flex items-center gap-2`}>
              <span className="text-blue-400">📊</span>
              Monthly Comparison
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyComparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} syncId="dashboardSync">
                <defs>
                  <linearGradient id="incomeCompareGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4aa" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#00d4aa" stopOpacity={0.4} />
                  </linearGradient>
                  <linearGradient id="expenseCompareGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff6b6b" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ff6b6b" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#cbd5e1'} opacity={0.3} />
                <XAxis dataKey="month" stroke={theme === 'dark' ? '#94a3b8' : '#475569'} fontSize={12} tick={{ fill: theme === 'dark' ? '#f59e0b' : '#334155' }} tickLine={false} axisLine={false} />
                <YAxis stroke={theme === 'dark' ? '#94a3b8' : '#475569'} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip content={<CustomTooltip theme={theme} />} />
                <Legend wrapperStyle={{ color: theme === 'dark' ? '#94a3b8' : '#475569', fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="income" fill="url(#incomeCompareGradient)" radius={[4, 4, 0, 0]} name="Income" maxBarSize={50} />
                <Bar dataKey="expenses" fill="url(#expenseCompareGradient)" radius={[4, 4, 0, 0]} name="Expenses" maxBarSize={50} />
                <Brush dataKey="month" travellerWidth={10} height={24} stroke={theme === 'dark' ? '#94a3b8' : '#475569'} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className={`bg-gradient-to-br ${theme === 'dark' ? 'from-slate-800/60 to-slate-900/60' : 'from-slate-200/60 to-slate-300/60'} backdrop-blur-sm rounded-xl shadow-xl p-6 ${theme === 'dark' ? 'border border-slate-700/50 hover:border-slate-600/50' : 'border border-slate-400/50 hover:border-slate-300/50'} transition-all`}>
            <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-4 flex items-center gap-2`}>
              <span className="text-yellow-400">💎</span>
              Cumulative Savings Trend
            </h2>
            {cumulativeSavingsData.length === 0 ? (
              <div className={`flex items-center justify-center h-[300px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-300/50'} rounded-full flex items-center justify-center`}>
                    <span className="text-2xl">💰</span>
                  </div>
                  <p className="text-lg font-medium">No savings data available</p>
                  <p className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600'} mt-1`}>Add income transactions to see savings growth</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={cumulativeSavingsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} syncId="dashboardSync">
                  <defs>
                    <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffd93d" stopOpacity={0.3} />
                      <stop offset="50%" stopColor="#ffd93d" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#ffd93d" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#ffd93d" />
                      <stop offset="100%" stopColor="#ffb347" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#cbd5e1'} opacity={0.3} />
                  <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} stroke={theme === 'dark' ? '#94a3b8' : '#475569'} fontSize={11} tick={{ fill: theme === 'dark' ? '#f59e0b' : '#334155' }} tickLine={false} axisLine={false} />
                  <YAxis stroke={theme === 'dark' ? '#94a3b8' : '#475569'} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip content={<CustomTooltip theme={theme} />} />
                  <Area type="monotone" dataKey="savings" stroke="url(#strokeGradient)" fillOpacity={1} fill="url(#colorSavings)" strokeWidth={3} dot={{ fill: '#ffd93d', r: 4, strokeWidth: 2, stroke: theme === 'dark' ? '#ffffff' : '#000000' }} activeDot={{ r: 6, fill: '#ffd93d', strokeWidth: 2, stroke: theme === 'dark' ? '#ffffff' : '#000000' }} />
                  <Brush dataKey="date" travellerWidth={10} height={24} stroke={theme === 'dark' ? '#94a3b8' : '#475569'} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export const AIInsightsSection = ({
  theme,
  aiMode,
  setAiMode,
  aiSummary,
  aiLoading,
  aiModelUsed,
  currentTryingModel,
  handleGenerateAI,
  chatMessages,
  chatQuestion,
  chatModelUsed,
  chatTryingModel,
  chatLoading,
  setChatQuestion,
  handleAskAI,
}) => {
  return (
    <section className={`min-h-screen flex flex-col justify-center px-6 py-12 ${theme === 'dark' ? 'bg-[#0f172a]' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto w-full">
        <div className={`${theme === 'dark' ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'} rounded-3xl shadow-xl border relative overflow-hidden`}>
          {(aiMode === 'summary' ? aiModelUsed : chatModelUsed) && (
            <div className="absolute top-6 right-6 z-10">
              {(() => {
                const activeModel = aiMode === 'summary' ? aiModelUsed : chatModelUsed;
                const modelInfo = getModelInfo(activeModel);
                const colorMap = {
                  emerald: 'from-emerald-500/20 to-green-500/20 border-emerald-400/50 text-emerald-300',
                  blue: 'from-blue-500/20 to-cyan-500/20 border-blue-400/50 text-blue-300',
                  purple: 'from-purple-500/20 to-pink-500/20 border-purple-400/50 text-purple-300',
                  cyan: 'from-cyan-500/20 to-blue-500/20 border-cyan-400/50 text-cyan-300',
                  pink: 'from-pink-500/20 to-rose-500/20 border-pink-400/50 text-pink-300',
                  amber: 'from-amber-500/20 to-yellow-500/20 border-amber-400/50 text-amber-300',
                  green: 'from-green-500/20 to-emerald-500/20 border-green-400/50 text-green-300',
                  orange: 'from-orange-500/20 to-amber-500/20 border-orange-400/50 text-orange-300',
                  gray: 'from-slate-400/20 to-slate-600/20 border-slate-400/50 text-slate-200',
                  'blue-700': 'from-blue-700/20 to-cyan-600/20 border-blue-600/50 text-blue-300',
                  'blue-600': 'from-blue-600/20 to-cyan-500/20 border-blue-500/50 text-blue-300',
                  'slate-100': 'from-slate-200/20 to-slate-400/20 border-slate-300/50 text-slate-800',
                };
                const colorClass = colorMap[modelInfo.color] || colorMap.amber;
                return (
                  <div className={`bg-gradient-to-br ${colorClass} backdrop-blur-md rounded-xl px-4 py-2.5 border shadow-xl flex items-center gap-2.5`}>
                    {modelInfo.logo.startsWith('http') ? (
                      <img src={modelInfo.logo} alt={modelInfo.name} className="w-5 h-5 object-contain rounded-sm" />
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
          <div className="p-8">
            <div className="max-w-4xl mx-auto w-full">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-amber-500/10' : 'bg-amber-100'}`}>
                    <Bot className={`w-9 h-9 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`} strokeWidth={1.8} />
                  </div>
                  <div className="flex flex-col">
                    <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>AI Financial Insights</h2>
                    <span className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} text-xs`}>Based on your actual transactions</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 ${theme === 'dark' ? 'bg-slate-800/60' : 'bg-slate-200/60'} rounded-lg p-1 border ${theme === 'dark' ? 'border-slate-700' : 'border-slate-300'}`}>
                    <button
                      onClick={() => setAiMode('summary')}
                      className={`px-4 py-2 rounded-md font-medium transition-all ${
                        aiMode === 'summary'
                          ? 'bg-amber-500/80 text-slate-900 shadow'
                          : theme === 'dark'
                          ? 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
                      }`}
                    >
                      Summary
                    </button>
                    <button
                      onClick={() => setAiMode('chat')}
                      className={`px-4 py-2 rounded-md font-medium transition-all ${
                        aiMode === 'chat'
                          ? 'bg-blue-500/80 text-white shadow'
                          : theme === 'dark'
                          ? 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
                      }`}
                    >
                      Chat
                    </button>
                  </div>
                </div>
              </div>
              {aiMode === 'summary' ? (
                aiSummary ? (
                  <div className="space-y-6">
                    <div className={`${theme === 'dark' ? 'bg-slate-800/90 border-slate-700/50' : 'bg-white border-slate-200/50'} rounded-2xl p-6 shadow-md border max-h-[340px] overflow-y-auto`}>
                      {formatAISummary(aiSummary, theme)}
                    </div>
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-green-500/30">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                        <span className="text-xs text-green-400 font-medium">Analysis Complete</span>
                      </div>
                      <button
                        onClick={handleGenerateAI}
                        className={`px-4 py-2 ${theme === 'dark' ? 'bg-slate-700/60 hover:bg-slate-700 border-slate-600' : 'bg-slate-200 hover:bg-slate-300 border-slate-300'} text-amber-400 font-medium rounded-lg flex items-center gap-2 transition-all border`}
                      >
                        <RefreshCw className="w-5 h-5" strokeWidth={2.2} />
                        <span>Refresh</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={`${theme === 'dark' ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'} rounded-xl p-8 text-center shadow-md border`}>
                    <div className="inline-block p-4">
                      {aiLoading && currentTryingModel ? (
                        (() => {
                          const modelInfo = getModelInfo(currentTryingModel);
                          const isUrl = modelInfo.logo.startsWith('http');
                          return isUrl ? (
                            <img src={modelInfo.logo} alt={modelInfo.name} className="w-12 h-12 object-contain animate-pulse-fast rounded-md" />
                          ) : (
                            <span className="text-5xl animate-pulse-fast">{modelInfo.logo}</span>
                          );
                        })()
                      ) : aiLoading ? (
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-400 border-t-transparent"></div>
                      ) : (
                        <Sparkles className={`w-10 h-10 ${theme === 'dark' ? 'text-amber-300' : 'text-amber-600'} animate-pulse`} strokeWidth={1.5} />
                      )}
                    </div>
                    <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-2`}>
                      {aiLoading && currentTryingModel ? (
                        <span className="flex items-center justify-center gap-2">
                          Analyzing with <span className={theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}>{getModelInfo(currentTryingModel).name}</span>
                        </span>
                      ) : aiLoading ? (
                        'Analyzing Your Finances...'
                      ) : (
                        'Get Personalized Financial Advice'
                      )}
                    </h3>
                    <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} mb-6 max-w-md mx-auto`}>
                      {aiLoading
                        ? 'Our AI is processing your financial data and generating personalized insights.'
                        : 'Our AI analyzes your spending patterns, compares to last month, and provides actionable insights.'}
                    </p>
                    <button
                      onClick={handleGenerateAI}
                      disabled={aiLoading}
                      className="px-8 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 rounded-xl font-semibold shadow transition-all hover:scale-105 disabled:opacity-50"
                    >
                      {aiLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-900 border-t-transparent"></div>
                          <span>Analyzing...</span>
                        </div>
                      ) : (
                        'Generate AI Insights'
                      )}
                    </button>
                  </div>
                )
              ) : (
                <div className="space-y-4">
                  <div className={`${theme === 'dark' ? 'bg-slate-800/90 border-slate-700/50' : 'bg-white border-slate-200/50'} rounded-2xl p-6 shadow-md border max-h-[340px] overflow-y-auto`}>
                    {chatMessages.map((m, idx) => {
                      const isAssistant = m.role === 'assistant';
                      const isLast = idx === chatMessages.length - 1;
                      const modelInfo = chatModelUsed ? getModelInfo(chatModelUsed) : chatTryingModel ? getModelInfo(chatTryingModel) : null;
                      return (
                        <div key={idx} className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} mb-3`}>
                          <div className={`max-w-[75%] ${isAssistant ? (theme === 'dark' ? 'bg-slate-700/60 text-slate-100' : 'bg-slate-100 text-slate-800') : (theme === 'dark' ? 'bg-blue-600/80 text-white' : 'bg-blue-500/90 text-white')} rounded-xl px-4 py-3`}>
                            {isAssistant && isLast && modelInfo && (
                              <div className="flex items-center gap-2 mb-2">
                                {modelInfo.logo.startsWith('http') ? (
                                  <img src={modelInfo.logo} alt={modelInfo.name} className="w-4 h-4 rounded-sm object-contain" />
                                ) : (
                                  <span className="text-base">{modelInfo.logo}</span>
                                )}
                                <span className="text-[11px] font-semibold">{chatModelUsed ? `Answered by ${modelInfo.name}` : `Using ${modelInfo.name}`}</span>
                              </div>
                            )}
                            <div className="text-sm whitespace-pre-wrap leading-relaxed">{m.text}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {chatLoading && (
                    <div className={`flex justify-start mb-3`}>
                      <div className={`max-w-[75%] ${theme === 'dark' ? 'bg-slate-800/60 text-slate-100' : 'bg-slate-100 text-slate-800'} rounded-xl px-4 py-3`}>
                        <div className="typing">
                          <span className="typing-dot"></span>
                          <span className="typing-dot"></span>
                          <span className="typing-dot"></span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="h-6 flex items-center">
                      {chatLoading && (
                        <>
                          {chatTryingModel ? (
                            <div className="h-6 flex items-center">
                              {chatLoading && (
                                <>
                                  {chatTryingModel ? (
                                    <span className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} text-sm flex items-center gap-1.5`}>
                                      <span>Trying</span>
                                      {(() => {
                                        const model = getModelInfo(chatTryingModel);
                                        return model ? (
                                          <>
                                            {model.logo ? (
                                              <img src={model.logo} alt={model.name || 'Model'} className="w-4 h-4 rounded-sm object-contain" />
                                            ) : (
                                              <span className="w-4 h-4 rounded-sm bg-gray-200 dark:bg-gray-700 inline-block" />
                                            )}
                                            <span>{model.name || chatTryingModel}...</span>
                                          </>
                                        ) : (
                                          <span>{chatTryingModel || 'AI'}...</span>
                                        );
                                      })()}
                                    </span>
                                  ) : (
                                    <span className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} text-sm`}>Connecting to AI...</span>
                                  )}
                                </>
                              )}
                            </div>
                          ) : (
                            <span className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} text-sm`}>Connecting to AI...</span>
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={chatQuestion}
                        onChange={(e) => setChatQuestion(e.target.value)}
                        placeholder="Type your message..."
                        className={`w-64 px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-slate-900/60 border-slate-700 text-slate-200 placeholder:text-slate-500' : 'bg-white border-slate-300 text-slate-800 placeholder:text-slate-400'}`}
                        disabled={chatLoading}
                      />
                      <button
                        onClick={handleAskAI}
                        disabled={chatLoading || !chatQuestion.trim()}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-semibold shadow transition-all hover:scale-105 disabled:opacity-50"
                      >
                        {chatLoading ? 'Send...' : 'Send'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export const RecentActivitySection = ({ theme, recentTransactions }) => {
  return (
    <section className={`min-h-screen flex flex-col justify-center px-6 py-12 ${theme === 'dark' ? 'bg-[#0a0e27]' : 'bg-slate-50'}`}>
      <div className="max-w-7xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className={`text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-3 flex items-center justify-center gap-3`}>
            <History className={`w-10 h-10 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`} strokeWidth={1.8} />
            Recent Activity
          </h2>
          <p className={`text-xl ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Your latest transactions</p>
        </div>
        <div className={`${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} backdrop-blur-sm rounded-2xl shadow-xl p-8 border`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
              <ArrowLeftRight className={`w-7 h-7 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`} strokeWidth={1.8} />
              Recent Transactions
            </h2>
            <a href="/history" className={`${theme === 'dark' ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700'} font-medium text-sm flex items-center gap-1 transition-colors`}>
              View All
              <span>→</span>
            </a>
          </div>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-12">
              <div className={`inline-block p-4 ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-200/50'} rounded-full mb-4`}>
                <span className="text-4xl">📊</span>
              </div>
              <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} mb-4`}>No transactions yet</p>
              <a href="/transactions" className={`inline-block px-6 py-3 ${theme === 'dark' ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 hover:from-amber-500 hover:to-amber-600' : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700'} rounded-lg font-semibold transition-all`}>
                Add Your First Transaction
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((txn) => (
                <div key={txn.id} className={`flex items-center justify-between p-4 ${theme === 'dark' ? 'bg-slate-700/30 hover:bg-slate-700/50 border-slate-600/50' : 'bg-slate-100/50 hover:bg-slate-200/50 border-slate-300/50'} rounded-xl transition-all border`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${txn.amount > 0 ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'}`}>
                      {txn.category_icon}
                    </div>
                    <div>
                      <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{txn.description}</p>
                      <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{txn.category_name}</p>
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
  );
};

export const ChatWidgetButton = ({ theme, isChatWidgetOpen, setIsChatWidgetOpen }) => {
  return (
    <button
      onClick={() => setIsChatWidgetOpen((prev) => !prev)}
      className={`
        fixed bottom-6 right-6 z-50
        rounded-full p-4
        bg-gradient-to-tr from-blue-500 to-cyan-400
        text-white
        shadow-[0_8px_32px_rgba(245,158,11,0.35)]
        backdrop-blur-sm
        transition-all duration-400
        hover:shadow-[0_16px_48px_rgba(245,158,11,0.45)] hover:-translate-y-1.5
        active:scale-95 active:shadow-inner
        flex items-center justify-center
      `}
      aria-label="Open AI Chat"
    >
      <span className="absolute inset-0 rounded-full bg-white/20 scale-0 opacity-0 group-active:scale-150 group-active:opacity-0 group-active:transition-all group-active:duration-500 group-active:ease-out" />
      <Bot className="w-6 h-6 relative z-10" />
    </button>
  );
};

export const ChatWidgetPopup = ({
  theme,
  isChatWidgetOpen,
  chatWidgetMessages,
  chatWidgetInput,
  setChatWidgetInput,
  chatWidgetLoading,
  chatWidgetTryingModel,
  chatWidgetModelUsed,
  handleWidgetAsk,
  setIsChatWidgetOpen,
}) => {
  if (!isChatWidgetOpen) return null;
  const activeModel = chatWidgetModelUsed || chatWidgetTryingModel;
  const modelInfo = activeModel ? getModelInfo(activeModel) : null;
  return (
    <div className={`fixed bottom-20 right-6 z-50 w-96 ${theme === 'dark' ? 'bg-slate-900/90 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-800'} backdrop-blur-md shadow-2xl rounded-2xl border`}>
      <div className={`flex items-center justify-between px-4 py-3 ${theme === 'dark' ? 'bg-slate-800/70 border-b border-slate-700' : 'bg-slate-100/70 border-b border-slate-300'} rounded-t-2xl`}>
        <div className="flex items-center gap-2">
          <Bot className={`${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} w-5 h-5`} />
          <span className="font-semibold text-sm">AI Chat</span>
        </div>
        {modelInfo && (
          <div className={`flex items-center gap-2 rounded-md px-2 py-1 border ${theme === 'dark' ? 'bg-slate-800/60 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-700'}`}>
            {modelInfo.logo.startsWith('http') ? (
              <img src={modelInfo.logo} alt={modelInfo.name} className="w-3.5 h-3.5 object-contain rounded-sm" />
            ) : (
              <span className="text-sm">{modelInfo.logo}</span>
            )}
            <span className="text-[10px] font-semibold">{chatWidgetModelUsed ? modelInfo.name : `Trying ${modelInfo.name}`}</span>
          </div>
        )}
        <button onClick={() => setIsChatWidgetOpen(false)} className={`${theme === 'dark' ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'} text-sm`}>×</button>
      </div>
      <div className="p-4 max-h-[320px] overflow-y-auto">
        {chatWidgetMessages.map((m, idx) => {
          const isAssistant = m.role === 'assistant';
          const isLast = idx === chatWidgetMessages.length - 1;
          return (
            <div key={idx} className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} mb-3`}>
              <div className={`max-w-[80%] ${isAssistant ? (theme === 'dark' ? 'bg-slate-800/60 text-slate-100' : 'bg-slate-100 text-slate-800') : (theme === 'dark' ? 'bg-blue-600/80 text-white' : 'bg-blue-500/90 text-white')} rounded-xl px-4 py-3`}>
                {isAssistant && isLast && modelInfo && (
                  <div className="flex items-center gap-2 mb-2">
                    {modelInfo.logo.startsWith('http') ? (
                      <img src={modelInfo.logo} alt={modelInfo.name} className="w-3.5 h-3.5 rounded-sm object-contain" />
                    ) : (
                      <span className="text-sm">{modelInfo.logo}</span>
                    )}
                    <span className="text-[10px] font-semibold">{chatWidgetModelUsed ? `Answered by ${modelInfo.name}` : `Using ${modelInfo.name}`}</span>
                  </div>
                )}
                <div className="text-sm whitespace-pre-wrap leading-relaxed">{m.text}</div>
              </div>
            </div>
          );
        })}
        {chatWidgetLoading && (
          <div className="flex justify-start mb-3">
            <div className={`${theme === 'dark' ? 'bg-slate-800/60 text-slate-100' : 'bg-slate-100 text-slate-800'} rounded-xl px-4 py-3 max-w-[80%]`}>
              <div className="typing">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className={`flex items-center gap-2 px-4 py-3 border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-300'} rounded-b-2xl`}>
        <input
          type="text"
          value={chatWidgetInput}
          onChange={(e) => setChatWidgetInput(e.target.value)}
          placeholder="Type your message..."
          className={`flex-1 px-3 py-2 rounded-lg border ${theme === 'dark' ? 'bg-slate-900/60 border-slate-700 text-slate-200 placeholder:text-slate-500' : 'bg-white border-slate-300 text-slate-800 placeholder:text-slate-400'}`}
          disabled={chatWidgetLoading}
        />
        <button
          onClick={handleWidgetAsk}
          disabled={chatWidgetLoading || !chatWidgetInput.trim()}
          className="px-3 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-semibold shadow transition-all hover:scale-105 disabled:opacity-50"
        >
          {chatWidgetLoading ? 'Send...' : 'Send'}
        </button>
      </div>
    </div>
  );
};
