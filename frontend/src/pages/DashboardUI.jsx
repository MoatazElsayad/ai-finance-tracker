import { useState, memo } from 'react';
import { ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, AreaChart, Area, ReferenceLine, Brush } from 'recharts';
import { RefreshCw, Sparkles, Bot, TrendingUp, TrendingDown, Wallet, Percent, LayoutDashboard, Scale, History, ArrowLeftRight, FileText, FileSpreadsheet, SendHorizonal, X, ChevronLeft, ChevronRight, ArrowRight, Landmark } from 'lucide-react';
import { CHART_COLORS, getModelInfo, formatAISummary } from './DashboardUtils';

export const CustomTooltip = memo(({ active, payload, label, theme }) => {
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
                EGP {typeof entry.value === 'number' ? entry.value.toLocaleString('en-EG', { maximumFractionDigits: 0 }) : entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
});

CustomTooltip.displayName = 'CustomTooltip';

export const SectionHeaderAndSummary = memo(({
  theme,
  user,
  viewMode,
  selectedMonth,
  setViewMode,
  changeMonth,
  changeYear,
  analytics,
  hasSavingsAccount
}) => {
  const isDark = theme === 'dark';

  return (
    <section
      className={`py-16 px-6 md:px-12 transition-colors duration-500 ${
        isDark ? 'bg-[#0a0e27]' : 'bg-slate-50'
      }`}
    >
      <div className="max-w-[1400px] mx-auto w-full">
        {user && (
          <div className="mb-8 animate-in fade-in duration-700">
            <h2
              className={`text-2xl md:text-3xl font-light ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              } mb-1`}
            >
              Welcome back,{' '}
              <span
                className={`font-black ${isDark ? 'text-white' : 'text-slate-900'}`}
              >
                {user.first_name}
              </span>
            </h2>
            <p
              className={`text-lg font-medium ${
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              Financial overview for{' '}
              {viewMode === 'monthly'
                ? new Date(selectedMonth.year, selectedMonth.month - 1).toLocaleDateString(
                    'en-US',
                    { month: 'long', year: 'numeric' }
                  )
                : `${selectedMonth.year}`}
            </p>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div>
            <h1 className="text-header-unified flex items-center gap-4">
              <div className="p-3 bg-amber-500 rounded-2xl shadow-xl shadow-amber-500/20">
                <LayoutDashboard className="w-8 h-8 text-white" />
              </div>
              Dashboard
            </h1>
            <p
              className={`${isDark ? 'text-slate-400' : 'text-slate-600'} mt-3 text-lg font-medium`}
            >
              Real-time insights into your spending habits and financial growth.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div
              className={`flex p-1.5 rounded-2xl ${
                isDark ? 'bg-slate-800/50' : 'bg-slate-200/50'
              } backdrop-blur-md border ${
                isDark ? 'border-slate-700' : 'border-slate-300'
              }`}
            >
              {['monthly', 'yearly', 'overall'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${
                    viewMode === mode
                      ? 'bg-amber-500 text-white shadow-lg'
                      : isDark
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {viewMode !== 'overall' && (
              <div
                className={`flex items-center justify-between gap-4 p-2 rounded-2xl ${
                  isDark ? 'bg-slate-800/50' : 'bg-slate-200/50'
                } border ${isDark ? 'border-slate-700' : 'border-slate-300'}`}
              >
                <button
                  onClick={() => (viewMode === 'monthly' ? changeMonth(-1) : changeYear(-1))}
                  className={`p-2 rounded-xl transition-all ${
                    isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-300 text-slate-600'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <span
                  className={`font-black uppercase tracking-[0.2em] text-[10px] ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {viewMode === 'monthly'
                    ? new Date(selectedMonth.year, selectedMonth.month - 1).toLocaleDateString(
                        'en-US',
                        { month: 'short', year: 'numeric' }
                      )
                    : selectedMonth.year}
                </span>

                <button
                  onClick={() => (viewMode === 'monthly' ? changeMonth(1) : changeYear(1))}
                  className={`p-2 rounded-xl transition-all ${
                    isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-300 text-slate-600'
                  }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <StatCard
            label="Total Income"
            value={analytics?.total_income ?? '—'}
            icon={<TrendingUp className="w-6 h-6" />}
            className="text-emerald-600 dark:text-emerald-400"
            color="green"
            isDark={isDark}
            analytics={analytics}
          />

          <StatCard
            label="Total Expenses"
            value={analytics?.total_expenses ?? '—'}
            icon={<TrendingDown className="w-6 h-6" />}
            className="text-rose-600 dark:text-rose-400"
            color="red"
            isDark={isDark}
            analytics={analytics}
          />

          <StatCard
            label="Available Balance"
            value={analytics?.net_savings ?? '—'}
            icon={<Wallet className="w-6 h-6" />}
            className="text-amber-500"
            color="amber"
            isDark={isDark}
            isCurrency={true}
            analytics={analytics}
          />

          {hasSavingsAccount && (
            <StatCard
              label="Savings Vault"
              value={analytics?.total_savings ?? '—'}
              icon={<Landmark className="w-6 h-6" />}
              className="text-blue-600 dark:text-blue-400"
              color="blue"
              isDark={isDark}
              isCurrency={true}
              analytics={analytics}
              history={analytics?.recent_savings}
            />
          )}

          {hasSavingsAccount && (
            <StatCard
              label="Savings Rate"
              value={analytics?.savings_rate ?? '—'}
              icon={<Percent className="w-6 h-6" />}
              className="text-indigo-600 dark:text-indigo-400"
              color="indigo"
              isDark={isDark}
              isPercent={true}
              analytics={analytics}
            />
          )}
        </div>
      </div>
    </section>
  );
});

ReportsSection.displayName = 'ReportsSection';

const StatCard = ({ label, value, icon, color, isDark, isPercent, isCurrency, className, history, analytics }) => {
  const colors = {
    green: isDark ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-green-600 bg-green-50 border-green-100',
    red: isDark ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-red-600 bg-red-50 border-red-100',
    amber: isDark ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-amber-600 bg-amber-50 border-amber-100',
    blue: isDark ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : 'text-blue-600 bg-blue-50 border-blue-100',
    indigo: isDark ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' : 'text-indigo-600 bg-indigo-50 border-indigo-100',
  };

  const textColors = {
    green: isDark ? 'text-green-400' : 'text-green-600',
    red: isDark ? 'text-red-400' : 'text-red-600',
    amber: isDark ? 'text-amber-400' : 'text-amber-600',
    blue: isDark ? 'text-blue-400' : 'text-blue-600',
    indigo: isDark ? 'text-indigo-400' : 'text-indigo-600',
  };

  const formatValue = (v) => {
    if (v === '—' || v === null || v === undefined) return '—';
    if (isPercent) {
      const num = typeof v === 'number' ? v : parseFloat(v);
      return isNaN(num) ? '—' : `${num.toFixed(1)}%`;
    }
    const formatted = Math.abs(v || 0)?.toLocaleString('en-EG', { 
      maximumFractionDigits: 0 
    }) || '0';
    return `EGP ${formatted}`;
  };

  const getTopUpSuggestion = () => {
    if (!isPercent || label !== 'Savings Rate' || value === '—') return null;
    const rate = typeof value === 'number' ? value : parseFloat(value);
    const availableBalance = analytics?.net_savings || 0;
    
    if (rate < 20 && availableBalance > 100) {
      const suggestedAmount = Math.min(availableBalance * 0.3, 500);
      return {
        message: `Boost your rate! Move EGP ${Math.round(suggestedAmount)} to your vault.`,
        type: 'boost'
      };
    }
    return null;
  };

  const suggestion = getTopUpSuggestion();

  return (
    <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'} flex flex-col relative group overflow-hidden`}>
      <div className="flex items-center justify-between mb-6">
        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          {label}
        </span>
        <div className={`p-3 rounded-2xl ${colors[color]} border shadow-sm group-hover:scale-110 transition-transform duration-500`}>
          {icon}
        </div>
      </div>
      
      <div className="flex flex-col gap-1">
        <p className={`text-3xl font-black tracking-tight ${className || textColors[color]}`}>
          {formatValue(value)}
        </p>
        
        {suggestion && (
          <div className="animate-in fade-in slide-in-from-left-4 duration-700 delay-300">
            <div className={`mt-2 flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
              isDark ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-600'
            }`}>
              <Sparkles className="w-3 h-3" />
              <span className="text-[10px] font-bold leading-tight">{suggestion.message}</span>
            </div>
          </div>
        )}
      </div>

      {history && history.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-500/10">
          <p className={`text-[9px] font-black uppercase tracking-[0.2em] mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Recent Activity
          </p>
          <div className="space-y-3">
            {history.map((txn, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className={`text-[11px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'} line-clamp-1`}>
                    {txn.description.split('||notes||')[0]}
                  </span>
                  <span className={`text-[9px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {new Date(txn.date).toLocaleDateString('en-EG', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <span className={`text-xs font-black ${
                  label === 'Savings Vault' 
                    ? 'text-blue-500'
                    : (txn.amount > 0 ? 'text-emerald-500' : 'text-rose-500')
                }`}>
                  {label === 'Savings Vault'
                    ? (txn.amount < 0 ? '+' : '-')
                    : (txn.amount > 0 ? '+' : '-')
                  }EGP {Math.abs(txn.amount).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={`absolute -right-12 -bottom-12 w-32 h-32 rounded-full blur-[50px] opacity-10 ${
        color === 'green' ? 'bg-green-500' : color === 'red' ? 'bg-red-500' : color === 'amber' ? 'bg-amber-500' : color === 'blue' ? 'bg-blue-500' : 'bg-indigo-500'
      }`} />
    </div>
  );
};

export const ReportsSection = memo(({ theme, reportLoading, reportProgress, reportStatus, handleDownloadReport }) => {
  const isDark = theme === 'dark';
  return (
    <section className={`py-16 px-6 md:px-12 transition-colors duration-500 ${isDark ? 'bg-[#0a0e27]' : 'bg-slate-50'}`}>
      <div className="max-w-[1400px] mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
          <div>
            <h2 className="text-header-unified flex items-center gap-4">
              <div className="p-3 bg-amber-500 rounded-2xl shadow-xl shadow-amber-500/20">
                <FileText className="w-8 h-8 text-white" />
              </div>
              Reports
            </h2>
            <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} mt-3 text-lg font-medium`}>
              Download professional financial reports with AI insights.
            </p>
          </div>
        </div>

        <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'} animate-in fade-in slide-in-from-bottom-8 duration-700`}>
          <div className="relative z-10">
            <h3 className={`text-2xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <span className="uppercase tracking-[0.2em]">Export Your Data</span>
            </h3>
            <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} mb-8 text-lg font-medium max-w-2xl`}>
              Your PDF report includes deep-dive AI recommendations, budget status, and visual data breakdowns.
            </p>
            
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => handleDownloadReport('pdf')}
                disabled={reportLoading}
                className="btn-primary-unified min-w-[200px] disabled:opacity-50"
              >
                {reportLoading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                {reportLoading ? 'Generating...' : 'Download PDF'}
              </button>
              
              <button
                onClick={() => handleDownloadReport('csv')}
                disabled={reportLoading}
                className={`flex items-center justify-center gap-2 px-8 py-4 rounded-[1.5rem] font-bold transition-all active:scale-95 disabled:opacity-50 text-[10px] uppercase tracking-[0.2em] ${
                  isDark 
                    ? 'bg-slate-800 hover:bg-slate-700 text-white border-2 border-slate-700' 
                    : 'bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-5 h-5" />
                {reportLoading ? 'Preparing...' : 'Download CSV'}
              </button>
            </div>

            <div className="mt-12 max-w-md">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {reportStatus}
                </span>
                <span className={`text-[10px] font-black tracking-[0.2em] ${isDark ? 'text-amber-500' : 'text-amber-600'}`}>
                  {Math.round(reportProgress)}%
                </span>
              </div>
              <div className={`w-full h-3 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                <div 
                  className="h-full bg-amber-500 transition-all duration-500" 
                  style={{ width: `${reportProgress}%` }} 
                />
              </div>
            </div>
          </div>
          
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-amber-500/10 blur-[100px]" />
        </div>
      </div>
    </section>
  );
});

ReportsSection.displayName = 'ReportsSection';

export const MainChartsSection = memo(({ theme, barData, pieData }) => {
  const isDark = theme === 'dark';
  return (
    <section className={`py-16 px-6 md:px-12 transition-colors duration-500 ${isDark ? 'bg-[#0a0e27]' : 'bg-slate-50'}`}>
      <div className="max-w-[1400px] mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
          <div>
            <h2 className="text-header-unified flex items-center gap-4">
              <div className="p-3 bg-amber-500 rounded-2xl shadow-xl shadow-amber-500/20">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              Analytics
            </h2>
            <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} mt-3 text-lg font-medium`}>
              Visual breakdowns of your financial performance.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'}`}>
            <h3 className={`text-xl font-black mb-8 flex items-center gap-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="uppercase tracking-[0.2em]">Income vs Expenses</span>
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.2} />
                    </linearGradient>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke={isDark ? '#64748b' : '#94a3b8'} 
                    fontSize={12} 
                    fontWeight="bold"
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                  />
                  <YAxis 
                    stroke={isDark ? '#64748b' : '#94a3b8'} 
                    fontSize={12} 
                    fontWeight="bold"
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `EGP ${value}`} 
                  />
                  <Tooltip content={<CustomTooltip theme={theme} />} cursor={{fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'}} />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]} maxBarSize={60}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.name === 'Income' ? 'url(#incomeGradient)' : 'url(#expenseGradient)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'}`}>
            <h3 className={`text-xl font-black mb-8 flex items-center gap-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <Percent className="w-5 h-5" />
              </div>
              <span className="uppercase tracking-[0.2em]">Spending by Category</span>
            </h3>
            <div className="h-[300px] w-full">
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
      </div>
    </section>
  );
});

MainChartsSection.displayName = 'MainChartsSection';

export const SpendingTrendsSection = memo(({ theme, dailySpendingData, avgDailySpending, dailySpendingChartData, weeklyPatternData }) => {
  const isDark = theme === 'dark';
  return (
    <section className={`py-16 px-6 md:px-12 transition-colors duration-500 ${isDark ? 'bg-[#0a0e27]' : 'bg-slate-50'}`}>
      <div className="max-w-[1400px] mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
          <div>
            <h2 className="text-header-unified flex items-center gap-4">
              <div className="p-3 bg-amber-500 rounded-2xl shadow-xl shadow-amber-500/20">
                <History className="w-8 h-8 text-white" />
              </div>
              Spending Trends
            </h2>
            <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} mt-3 text-lg font-medium`}>
              Analyze your daily patterns and weekly habits.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'}`}>
            <h3 className={`text-xl font-black mb-8 flex items-center gap-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="uppercase tracking-[0.2em]">Daily Trend (14 Days)</span>
            </h3>
            {dailySpendingData.length === 0 ? (
              <div className={`flex items-center justify-center h-[300px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'bg-slate-700/50' : 'bg-slate-200'} rounded-full flex items-center justify-center text-2xl`}>
                    📈
                  </div>
                  <p className="text-lg font-medium">No spending data available</p>
                </div>
              </div>
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailySpendingChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} syncId="dashboardSync">
                    <defs>
                      <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke={isDark ? '#64748b' : '#94a3b8'} 
                      fontSize={11} 
                      fontWeight="bold"
                      tickLine={false} 
                      axisLine={false} 
                      dy={10}
                    />
                    <YAxis 
                      stroke={isDark ? '#64748b' : '#94a3b8'} 
                      fontSize={11} 
                      fontWeight="bold"
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `EGP ${value}`} 
                    />
                    <Tooltip content={<CustomTooltip theme={theme} />} />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#f59e0b" 
                      strokeWidth={4} 
                      dot={{ fill: '#f59e0b', r: 4, strokeWidth: 2, stroke: isDark ? '#1e293b' : '#fff' }} 
                      activeDot={{ r: 6, fill: '#f59e0b', strokeWidth: 2, stroke: isDark ? '#1e293b' : '#fff' }} 
                    />
                    <ReferenceLine y={avgDailySpending} stroke={isDark ? '#94a3b8' : '#64748b'} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'}`}>
            <h3 className={`text-xl font-black mb-8 flex items-center gap-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <span className="uppercase tracking-[0.2em]">Weekly Patterns</span>
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyPatternData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} syncId="dashboardSync">
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} vertical={false} />
                  <XAxis 
                    dataKey="day" 
                    stroke={isDark ? '#64748b' : '#94a3b8'} 
                    fontSize={11} 
                    fontWeight="bold"
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                  />
                  <YAxis 
                    stroke={isDark ? '#64748b' : '#94a3b8'} 
                    fontSize={11} 
                    fontWeight="bold"
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `EGP ${value}`} 
                  />
                  <Tooltip content={<CustomTooltip theme={theme} />} />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]} maxBarSize={40}>
                    {weeklyPatternData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS.categories[index % CHART_COLORS.categories.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

MainChartsSection.displayName = 'MainChartsSection';

export const ProgressComparisonSection = memo(({ theme, cumulativeSavingsData, monthlyComparisonData, hasSavingsAccount }) => {
  const isDark = theme === 'dark';
  return (
    <section className={`py-16 px-6 md:px-12 transition-colors duration-500 ${isDark ? 'bg-[#0a0e27]' : 'bg-slate-50'}`}>
      <div className="max-w-[1400px] mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
          <div>
            <h2 className="text-header-unified flex items-center gap-4">
              <div className="p-3 bg-amber-500 rounded-2xl shadow-xl shadow-amber-500/20">
                <Scale className="w-8 h-8 text-white" />
              </div>
              Growth & Benchmarks
            </h2>
            <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} mt-3 text-lg font-medium`}>
              Compare your performance over time.
            </p>
          </div>
        </div>

        <div className={`grid grid-cols-1 ${hasSavingsAccount ? 'lg:grid-cols-2' : ''} gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700`}>
          <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'}`}>
            <h3 className={`text-xl font-black mb-8 flex items-center gap-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <History className="w-5 h-5" />
              </div>
              <span className="uppercase tracking-[0.2em]">Monthly Comparison</span>
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} syncId="dashboardSync">
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} vertical={false} />
                  <XAxis dataKey="month" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} fontWeight="bold" tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} fontWeight="bold" tickLine={false} axisLine={false} tickFormatter={(value) => `EGP ${value}`} />
                  <Tooltip content={<CustomTooltip theme={theme} />} />
                  <Legend verticalAlign="top" align="right" iconType="circle" />
                  <Bar dataKey="income" fill="#10b981" radius={[6, 6, 0, 0]} name="Income" maxBarSize={30} />
                  <Bar dataKey="expenses" fill="#ef4444" radius={[6, 6, 0, 0]} name="Expenses" maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {hasSavingsAccount && (
            <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'}`}>
              <h3 className={`text-xl font-black mb-8 flex items-center gap-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="uppercase tracking-[0.2em]">Cumulative Savings</span>
              </h3>
              <div className="h-[300px] w-full">
                {cumulativeSavingsData.length === 0 ? (
                  <div className={`flex items-center justify-center h-[300px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <div className="text-center">
                      <div className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'bg-slate-700/50' : 'bg-slate-200'} rounded-full flex items-center justify-center text-2xl`}>
                        💰
                      </div>
                      <p className="text-lg font-medium">No savings data yet</p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cumulativeSavingsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} syncId="dashboardSync">
                      <defs>
                        <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} vertical={false} />
                      <XAxis dataKey="date" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} fontWeight="bold" tickLine={false} axisLine={false} dy={10} />
                      <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} fontWeight="bold" tickLine={false} axisLine={false} tickFormatter={(value) => `EGP ${value}`} />
                      <Tooltip content={<CustomTooltip theme={theme} />} />
                      <Area type="monotone" dataKey="savings" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSavings)" strokeWidth={4} dot={{ fill: '#3b82f6', r: 4, strokeWidth: 2, stroke: isDark ? '#1e293b' : '#fff' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
});

ProgressComparisonSection.displayName = 'ProgressComparisonSection';

export const AIInsightsSection = memo(({
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
  const isDark = theme === 'dark';
  return (
    <section className={`py-16 px-6 md:px-12 transition-colors duration-500 ${isDark ? 'bg-[#0a0e27]' : 'bg-slate-50'}`}>
      <div className="max-w-[1400px] mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
          <div>
            <h2 className="text-header-unified flex items-center gap-4">
              <div className="p-3 bg-amber-500 rounded-2xl shadow-xl shadow-amber-500/20">
                <Bot className="w-8 h-8 text-white" />
              </div>
              AI Insights
            </h2>
            <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} mt-3 text-lg font-medium`}>
              Get personalized financial advice powered by advanced AI.
            </p>
          </div>
        </div>

        <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'} min-h-[600px] flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-700`}>
          {(aiMode === 'summary' ? aiModelUsed : chatModelUsed) && (
            <div className="absolute top-8 right-8 z-20">
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

          <div className="relative z-10 h-full flex flex-col">
            <div className="flex items-center justify-between mb-10">
              <div className={`flex items-center gap-2 ${isDark ? 'bg-slate-800/60' : 'bg-slate-200/60'} rounded-[1.5rem] p-1.5 border ${isDark ? 'border-slate-700' : 'border-slate-300'}`}>
                <button
                  onClick={() => setAiMode('summary')}
                  className={`px-8 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${
                    aiMode === 'summary'
                      ? 'bg-amber-500 text-white shadow-lg'
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Summary
                </button>
                <button
                  onClick={() => setAiMode('chat')}
                  className={`px-8 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${
                    aiMode === 'chat'
                      ? 'bg-amber-500 text-white shadow-lg'
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Chat
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              {aiMode === 'summary' ? (
                aiSummary ? (
                  <div className="space-y-8 flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                      {formatAISummary(aiSummary, theme)}
                    </div>
                    <div className="flex items-center justify-between pt-6 border-t border-slate-700/30">
                      <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        <span className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.2em]">Analysis Complete</span>
                      </div>
                      <button
                        onClick={handleGenerateAI}
                        className={`btn-primary-unified !px-6 !py-3 !rounded-xl !text-[10px] !uppercase !tracking-[0.2em]`}
                      >
                        <RefreshCw className="w-4 h-4" strokeWidth={3} />
                        Refresh
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="mb-8">
                      {aiLoading && currentTryingModel ? (
                        (() => {
                          const modelInfo = getModelInfo(currentTryingModel);
                          const isUrl = modelInfo.logo.startsWith('http');
                          return (
                            <div className="p-6 bg-amber-500/10 rounded-[2.5rem] border-2 border-amber-500/20 shadow-2xl shadow-amber-500/10">
                              {isUrl ? (
                                <img src={modelInfo.logo} alt={modelInfo.name} className="w-16 h-16 object-contain animate-pulse rounded-md" />
                              ) : (
                                <span className="text-6xl animate-pulse inline-block">{modelInfo.logo}</span>
                              )}
                            </div>
                          );
                        })()
                      ) : aiLoading ? (
                        <div className="p-6 bg-amber-500/10 rounded-[2.5rem] border-2 border-amber-500/20 shadow-2xl shadow-amber-500/10">
                          <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-500 border-t-transparent"></div>
                        </div>
                      ) : (
                        <div className="p-6 bg-amber-500/10 rounded-[2.5rem] border-2 border-amber-500/20 shadow-2xl shadow-amber-500/10">
                          <Sparkles className={`w-16 h-16 ${isDark ? 'text-amber-400' : 'text-amber-500'} animate-pulse`} strokeWidth={1.5} />
                        </div>
                      )}
                    </div>
                    <h3 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'} mb-4`}>
                      {aiLoading && currentTryingModel ? (
                        <span className="flex items-center justify-center gap-3">
                          Analyzing with <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">{getModelInfo(currentTryingModel).name}</span>
                        </span>
                      ) : aiLoading ? (
                        <span className="uppercase tracking-[0.2em]">Analyzing Your Finances...</span>
                      ) : (
                        <span className="uppercase tracking-[0.2em]">Unlock AI Insights</span>
                      )}
                    </h3>
                    <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} mb-10 max-w-lg mx-auto text-lg font-medium`}>
                      {aiLoading
                        ? 'Our AI is processing your financial data and generating personalized insights.'
                        : 'Our AI analyzes your spending patterns, compares to last month, and provides actionable insights.'}
                    </p>
                    <button
                      onClick={handleGenerateAI}
                      disabled={aiLoading}
                      className="btn-primary-unified min-w-[240px]"
                    >
                      {aiLoading ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Generate Insights
                        </>
                      )}
                    </button>
                  </div>
                )
              ) : (
                <div className="flex flex-col h-full space-y-6">
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                    {chatMessages.map((m, idx) => {
                      const isAssistant = m.role === 'assistant';
                      const isLast = idx === chatMessages.length - 1;
                      const modelInfo = chatModelUsed ? getModelInfo(chatModelUsed) : chatTryingModel ? getModelInfo(chatTryingModel) : null;
                      return (
                        <div key={idx} className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-[85%] p-5 rounded-[2rem] ${
                            isAssistant 
                              ? (isDark ? 'bg-slate-800/80 border border-slate-700/50 text-slate-100' : 'bg-slate-100 border border-slate-200 text-slate-800') 
                              : 'bg-amber-500 text-white shadow-lg'
                          }`}>
                            {isAssistant && isLast && modelInfo && (
                              <div className="flex items-center gap-2 mb-3 px-2 py-1 rounded-lg bg-black/10 w-fit">
                                {modelInfo.logo.startsWith('http') ? (
                                  <img src={modelInfo.logo} alt={modelInfo.name} className="w-4 h-4 rounded-sm object-contain" />
                                ) : (
                                  <span className="text-base">{modelInfo.logo}</span>
                                )}
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{chatModelUsed ? `Answered by ${modelInfo.name}` : `Using ${modelInfo.name}`}</span>
                              </div>
                            )}
                            <div className="text-sm whitespace-pre-wrap leading-relaxed font-bold">{m.text}</div>
                          </div>
                        </div>
                      );
                    })}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className={`p-5 rounded-[2rem] ${isDark ? 'bg-slate-800/80 border border-slate-700/50' : 'bg-slate-100 border border-slate-200'}`}>
                          <div className="typing">
                            <span className="typing-dot bg-amber-500"></span>
                            <span className="typing-dot bg-amber-500"></span>
                            <span className="typing-dot bg-amber-500"></span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-6 border-t border-slate-700/30">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={chatQuestion}
                          onChange={(e) => setChatQuestion(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && !chatLoading && chatQuestion.trim() && handleAskAI()}
                          placeholder="Ask anything about your finances..."
                          className={`input-unified ${isDark ? 'input-unified-dark' : 'input-unified-light'} pr-32`}
                          disabled={chatLoading}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                          {chatLoading && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                              <div className="animate-spin rounded-full h-3 w-3 border-2 border-amber-500 border-t-transparent"></div>
                              <span className="text-[10px] text-amber-500 font-black uppercase tracking-[0.2em]">Processing</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={handleAskAI}
                        disabled={chatLoading || !chatQuestion.trim()}
                        className={`p-5 rounded-[1.5rem] bg-amber-500 text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:grayscale`}
                      >
                        <SendHorizonal className="w-6 h-6" />
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
});

export const RecentActivitySection = ({ theme, recentTransactions }) => {
  const isDark = theme === 'dark';
  const [expanded, setExpanded] = useState(new Set());

  const toggleExpand = (id) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpanded(newExpanded);
  };

  return (
    <section className={`py-16 px-6 md:px-12 transition-colors duration-500 ${isDark ? 'bg-[#0a0e27]' : 'bg-slate-50'}`}>
      <div className="max-w-[1400px] mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
          <div>
            <h2 className="text-header-unified flex items-center gap-4">
              <div className="p-3 bg-amber-500 rounded-2xl shadow-xl shadow-amber-500/20">
                <History className="w-8 h-8 text-white" />
              </div>
              Recent Activity
            </h2>
            <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} mt-3 text-lg font-medium`}>
              Keep track of your latest transactions and movements.
            </p>
          </div>
        </div>

        <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'} animate-in fade-in slide-in-from-bottom-8 duration-700`}>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-3`}>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                  <ArrowLeftRight className="w-6 h-6" />
                </div>
                <span className="uppercase tracking-[0.2em]">Latest Transactions</span>
              </h3>
              <a 
                href="/history" 
                className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${
                  isDark 
                    ? 'bg-slate-800 text-amber-400 hover:bg-slate-700' 
                    : 'bg-slate-100 text-amber-600 hover:bg-slate-200'
                }`}
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="text-center py-20">
                <div className={`inline-flex items-center justify-center w-24 h-24 rounded-[2.5rem] mb-6 ${isDark ? 'bg-slate-800/50' : 'bg-slate-100'} text-5xl shadow-xl border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                  📊
                </div>
                <h4 className={`text-xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>No transactions yet</h4>
                <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} mb-8 font-medium`}>Start tracking your finances today!</p>
                <a href="/transactions" className="btn-primary-unified inline-flex">
                  Add Your First Transaction
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentTransactions.map((txn) => {
                  const isNote = txn.description.includes('||notes||');
                  const [desc, note] = isNote ? txn.description.split('||notes||') : [txn.description, ''];
                  const isExpanded = expanded.has(txn.id);

                  return (
                    <div 
                      key={txn.id} 
                      onClick={() => toggleExpand(txn.id)}
                      className={`group flex flex-col p-5 rounded-[2rem] border transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
                        isDark 
                          ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60 hover:border-slate-600' 
                          : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300 shadow-sm hover:shadow-md'
                      } ${isExpanded ? (isDark ? 'bg-slate-800/80 border-amber-500/50' : 'bg-white border-amber-500/50 shadow-lg') : ''}`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-5">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg transition-transform group-hover:rotate-12 ${
                            txn.amount > 0 
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                              : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                          }`}>
                            {txn.category_icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className={`font-black text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>{desc}</p>
                              {note && (
                                <div className={`p-1 rounded-md ${isExpanded ? 'bg-amber-500 text-white' : 'bg-slate-500/10 text-slate-500'} transition-all`}>
                                  <FileText className="w-3 h-3" />
                                </div>
                              )}
                            </div>
                            <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'} mt-1`}>{txn.category_name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {(() => {
                            const isSavings = txn.category_name && txn.category_name.toLowerCase().includes('savings');
                            const isPositive = txn.amount > 0;
                            
                            // For savings: negative amount = deposit (+ to vault), positive = withdrawal (- from vault)
                            // But for the general activity list, we should probably stick to what it does to the MAIN balance
                            // or make it clear. Let's use different colors for savings to distinguish them.
                            
                            let displayColor = isPositive ? 'text-emerald-400' : 'text-rose-400';
                            let displaySign = isPositive ? '+' : '-';
                            
                            if (isSavings) {
                              // If it's a savings transaction, let's make it blue to indicate a "transfer"
                              // but keep the sign relative to the MAIN balance
                              displayColor = 'text-blue-500';
                            }

                            return (
                              <p className={`text-xl font-black ${displayColor}`}>
                                {displaySign}{Math.abs(txn.amount).toLocaleString('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                              </p>
                            );
                          })()}
                          <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-600' : 'text-slate-400'} mt-1`}>
                            {new Date(txn.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      {note && isExpanded && (
                        <div className={`mt-4 p-4 rounded-2xl ${isDark ? 'bg-slate-900/50 text-slate-300' : 'bg-slate-100 text-slate-600'} border ${isDark ? 'border-slate-700' : 'border-slate-200'} text-sm font-bold animate-in fade-in slide-in-from-top-2 duration-300 shadow-inner`}>
                          <p className="flex items-center gap-2 mb-1 opacity-50 text-[10px] uppercase tracking-[0.2em]">
                            <FileText className="w-3 h-3" />
                            Transaction Note
                          </p>
                          {note}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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
        rounded-[1.5rem] p-5
        bg-amber-500
        text-white
        shadow-xl shadow-amber-500/25
        transition-all duration-400
        hover:shadow-amber-500/40 hover:-translate-y-1.5
        active:scale-95
        flex items-center justify-center
      `}
      aria-label="Open AI Chat"
    >
      <Bot className="w-6 h-6" />
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
  const isDark = theme === 'dark';
  const activeModel = chatWidgetModelUsed || chatWidgetTryingModel;
  const modelInfo = activeModel ? getModelInfo(activeModel) : null;
  return (
    <div className={`fixed bottom-24 right-6 z-50 w-[24rem] h-[32rem] flex flex-col ${isDark ? 'bg-slate-900/95 border-slate-700' : 'bg-white/95 border-slate-200'} backdrop-blur-xl shadow-2xl rounded-[2.5rem] border-2 overflow-hidden transition-all duration-500 animate-in fade-in slide-in-from-bottom-10`}>
      <div className={`flex items-center justify-between px-6 py-5 ${isDark ? 'bg-slate-800/50 border-b border-slate-700' : 'bg-slate-50 border-b border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500 rounded-xl shadow-lg shadow-amber-500/20">
            <Bot className="text-white w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className={`font-black text-xs uppercase tracking-[0.2em] ${isDark ? 'text-white' : 'text-slate-900'}`}>AI Assistant</span>
            {modelInfo && (
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                  {chatWidgetModelUsed ? modelInfo.name : `Trying ${modelInfo.name}`}
                </span>
            )}
          </div>
        </div>
        <button 
          onClick={() => setIsChatWidgetOpen(false)} 
          className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-4">
        {chatWidgetMessages.map((m, idx) => {
          const isAssistant = m.role === 'assistant';
          return (
            <div key={idx} className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl text-sm font-medium leading-relaxed ${
                isAssistant 
                  ? (isDark ? 'bg-slate-800/80 border border-slate-700/50 text-slate-100' : 'bg-slate-50 border border-slate-200 text-slate-800') 
                  : 'bg-amber-500 text-white shadow-lg'
              }`}>
                {m.text}
              </div>
            </div>
          );
        })}
        {chatWidgetLoading && (
          <div className="flex justify-start">
            <div className={`p-4 rounded-2xl ${isDark ? 'bg-slate-800/80 border border-slate-700/50' : 'bg-slate-50 border border-slate-200'}`}>
              <div className="typing">
                <span className="typing-dot bg-amber-500"></span>
                <span className="typing-dot bg-amber-500"></span>
                <span className="typing-dot bg-amber-500"></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={`p-4 border-t ${isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-50/50'}`}>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={chatWidgetInput}
            onChange={(e) => setChatWidgetInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !chatWidgetLoading && chatWidgetInput.trim() && handleWidgetAsk()}
            placeholder="Type your message..."
            className={`input-unified ${isDark ? 'input-unified-dark' : 'input-unified-light'} !text-sm !py-3 !px-4`}
            disabled={chatWidgetLoading}
          />
          <button
            onClick={handleWidgetAsk}
            disabled={chatWidgetLoading || !chatWidgetInput.trim()}
            className="p-3 bg-amber-500 text-white rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
          >
            <SendHorizonal className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
