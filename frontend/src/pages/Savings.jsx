import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import {
  getSavingsData,
  getSavingsRates,
  getCategories,
  getTransactions,
  createTransaction,
  initSavingsCategory,
  createInvestment,
  deleteInvestment,
  updateSavingsGoal,
  setLongTermSavingsGoal,
  generateAISummary,
  askAIQuestion,
} from "../api";
import {
  RefreshCw,
  Plus,
  Wallet,
  Target,
  Coins,
  X,
  AlertCircle,
  Sparkles,
  History,
  TrendingUp,
  TrendingDown,
  Info,
  DollarSign,
  PieChart as PieChartIcon,
} from "lucide-react";
import { getModelInfo } from "../pages/DashboardUtils"; // Assuming DashboardUtils has getModelInfo
import { clearInsightsCache, loadCachedInsights, saveInsightsToCache } from "../utils/cache"; // For AI caching

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const fmt = (n) => (n ?? 0).toLocaleString();

// Custom Tooltip Component (consistent with other pages)
const CustomTooltipComponent = (isDark) => ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className={`${isDark ? 'bg-slate-900/95 border-slate-700' : 'bg-white/95 border-slate-200'} backdrop-blur-xl border-2 rounded-3xl p-4 shadow-2xl animate-in fade-in zoom-in duration-300`}>
        <p className={`${isDark ? 'text-white' : 'text-slate-900'} font-black mb-3 text-base tracking-tight`}>{label}</p>
        <div className="space-y-2">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full shadow-sm"
                  style={{ backgroundColor: entry.color || entry.fill }}
                ></div>
                <span className={`${isDark ? 'text-slate-400' : 'text-slate-600'} text-sm font-bold`}>{entry.name}:</span>
              </div>
              <span className={`${isDark ? 'text-amber-400' : 'text-amber-600'} font-black text-sm`}>
                  EGP {entry.value.toLocaleString('en-EG', { maximumFractionDigits: 0 })}
                </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function Savings() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savings, setSavings] = useState(null);
  const [rates, setRates] = useState({});
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [longTermGoal, setLongTermGoal] = useState(null);

  // UI state
  const [monthlyInput, setMonthlyInput] = useState("");
  const [monthlyGoalInput, setMonthlyGoalInput] = useState("");
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiModelUsed, setAiModelUsed] = useState(null);
  const [aiTryingModel, setAiTryingModel] = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
      setError(null);
      try {
      const [cats, sData, txns, r] = await Promise.all([
          getCategories(),
        getSavingsData(),
        getTransactions(),
        // Long term goal is now part of getSavingsData, remove separate call if it exists
        getSavingsRates(false),
      ]);
      setCategories(cats || []);
      setSavings(sData || {});
      setTransactions(txns?.transactions || []);
      setRates(r || {});
      if (sData?.monthly_goal) setMonthlyGoalInput(String(sData.monthly_goal));
      setLongTermGoal(sData?.long_term_goal || null);
    } catch (e) {
      console.error("Load savings error", e);
      setError("Unable to load savings data.");
      } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const investments = useMemo(() => savings?.investments || [], [savings]);
  const totalWealth = useMemo(
    () => (savings?.cash_balance || 0) + investments.reduce((s, i) => s + (i?.current_value || 0), 0),
    [savings, investments]
  );
  const monthlySaved = savings?.monthly_saved ?? 0;
  const monthlyGoal = (parseFloat(savings?.monthly_goal) || parseFloat(monthlyGoalInput)) || 0;
  const monthlyProgress = monthlyGoal ? Math.min(100, (monthlySaved / monthlyGoal) * 100) : 0;

  const longTermGoalProgress = useMemo(() => {
    if (!longTermGoal || !longTermGoal.target_amount) return 0;
    return Math.min(100, (totalWealth / longTermGoal.target_amount) * 100);
  }, [longTermGoal, totalWealth]);

  const longTermGoalRemaining = useMemo(() => {
    if (!longTermGoal || !longTermGoal.target_amount) return 0;
    return Math.max(0, longTermGoal.target_amount - totalWealth);
  }, [longTermGoal, totalWealth]);

  const longTermGoalETA = useMemo(() => {
    if (!longTermGoal || totalWealth <= 0) return "TBD";
    const created = new Date(longTermGoal.created_at);
    const now = new Date();
    const days = Math.max(1, (now.getTime() - created.getTime()) / 86400000);
    const perDay = totalWealth / days;
    const daysLeft = longTermGoalRemaining / perDay;
    const est = new Date();
    est.setDate(est.getDate() + daysLeft);
    return est.toLocaleDateString("en-EG", {
      month: "short",
      year: "numeric",
    });
  }, [longTermGoal, totalWealth, longTermGoalRemaining]);

  // Data for Investment Distribution Pie Chart
  const investmentPieData = useMemo(() => {
    if (!investments.length) return [];
    const dataMap = {};
    investments.forEach(inv => {
      const type = inv.type.toUpperCase();
      dataMap[type] = (dataMap[type] || 0) + (inv.current_value || 0);
    });
    return Object.entries(dataMap).map(([name, value], idx) => ({
      name,
      value,
      color: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#6366f1'][idx % 5] // Reuse existing colors
    }));
  }, [investments]);

  // Data for Savings Growth Area Chart (using savings-related transactions)
  const savingsGrowthData = useMemo(() => {
    const sortedSavingsTxns = transactions
      .filter(t => t.category_name?.toLowerCase().includes('savings'))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    let cumulativeSavings = 0;
    const data = [];
    sortedSavingsTxns.forEach(txn => {
      cumulativeSavings += Math.abs(txn.amount); // Assuming negative for expenses into savings
      const dateLabel = new Date(txn.date).toLocaleDateString("en-EG", { month: "short", day: "numeric" });
      // Group by date, taking the last cumulative value for that day
      if (data.length > 0 && data[data.length - 1].date === dateLabel) {
        data[data.length - 1].value = cumulativeSavings;
      } else {
        data.push({ date: dateLabel, value: cumulativeSavings });
      }
    });
    return data;
  }, [transactions]);

  // Wealth Change Indicator (copied from DashboardUI for consistency)
  const WealthChangeIndicator = ({ change, percent, positive, label }) => (
    <div
      className={`flex flex-col items-center gap-1 ${
        positive ? "text-emerald-500" : "text-rose-500"
      }`}
      aria-live="polite"
    >
      <div className="flex items-center gap-1">
        {positive ? (
          <TrendingUp className="w-4 h-4" />
        ) : (
          <TrendingDown className="w-4 h-4" />
        )}
        <span className="text-sm font-black uppercase tracking-wider">
          {positive ? "+" : ""}{fmt(change)} EGP ({positive ? "+" : ""}{percent}%)
        </span>
      </div>
      <p className="text-xs text-slate-500 uppercase tracking-widest">{label}</p>
    </div>
  );

  // Mock/Example data for wealth changes if real-time rates are not integrated yet
  const mockWealthChange = useMemo(() => {
    // This would ideally come from backend analytics on `getSavingsData`
    const dailyChange = totalWealth * 0.001 * (Math.random() > 0.5 ? 1 : -1);
    const dailyPercent = totalWealth ? ((dailyChange / totalWealth) * 100).toFixed(2) : 0;

    const weeklyChange = totalWealth * 0.005 * (Math.random() > 0.5 ? 1 : -1);
    const weeklyPercent = totalWealth ? ((weeklyChange / totalWealth) * 100).toFixed(2) : 0;

    return {
      daily: {
        change: dailyChange,
        percent: parseFloat(dailyPercent),
        positive: dailyChange >= 0,
      },
      weekly: {
        change: weeklyChange,
        percent: parseFloat(weeklyPercent),
        positive: weeklyChange >= 0,
      },
    };
  }, [totalWealth]);

  /* ------------------ Handlers ------------------ */
  const handleAllocate = async (e) => {
    e?.preventDefault();
    const amount = parseFloat(monthlyInput);
    if (!amount || isNaN(amount) || amount <= 0) return alert("Enter a valid amount");
    try {
      let savingsCat = categories.find(c => c.name?.toLowerCase().includes("savings"));
      if (!savingsCat) savingsCat = await initSavingsCategory();
      await createTransaction(savingsCat.id, -Math.abs(amount), "Quick savings allocation", new Date().toISOString().split("T")[0]);
      setMonthlyInput("");
      await loadAll();
    } catch (e) {
      console.error(e);
      alert("Failed to allocate savings.");
    }
  };

  const addInvestment = async (payload) => {
    try {
      await createInvestment(payload);
      await loadAll();
    } catch (e) {
      console.error(e);
      alert("Failed to add investment.");
    }
  };
  const removeInvestment = async (id) => {
    if (!confirm("Remove investment?")) return;
    try {
      await deleteInvestment(id);
      await loadAll();
    } catch (e) {
      console.error(e);
      alert("Failed to remove investment.");
    }
  };

  const saveMonthlyGoal = async (ev) => {
    ev?.preventDefault();
    const val = parseFloat(monthlyGoalInput);
    if (isNaN(val) || val < 0) return alert("Enter valid goal");
    try {
      await updateSavingsGoal(val);
      await loadAll();
    } catch (e) {
      console.error(e);
      alert("Failed to save monthly goal.");
    }
  };

  const setLongGoal = async (amount, date) => {
    try {
      await setLongTermSavingsGoal(parseFloat(amount), date);
      await loadAll();
    } catch (e) {
      console.error(e);
      alert("Failed to set long-term goal.");
    }
  };

  /* ------------------ AI with SSE fallback (like Dashboard/Budget) ------------------ */
  const fetchAISummary = async () => {
    setAiLoading(true);
    setAiText("");
    setAiModelUsed(null);
    setAiTryingModel(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8001";
      const token = localStorage.getItem("token");
      if (!token) {
        setAiText("Please log in to use AI features.");
        setAiLoading(false);
          return;
      }

      const eventSourceUrl = `${apiUrl}/ai/progress?year=${new Date().getFullYear()}&month=${new Date().getMonth() + 1}&token=${token}`;
      const es = new EventSource(eventSourceUrl);
      let received = false;

      const timeout = setTimeout(() => {
        if (!received) {
          es.close();
          fallback();
        }
      }, 5000);

      const fallback = async () => {
        try {
          const res = await generateAISummary(new Date().getFullYear(), new Date().getMonth() + 1);
          setAiText(res?.summary || "No AI summary available.");
          setAiModelUsed(res?.model_used || null);
        } catch (e) {
          console.error("AI fallback error", e);
          setAiText("AI service unavailable.");
        } finally {
          setAiLoading(false);
        }
      };

      es.onmessage = (evt) => {
        received = true;
        clearTimeout(timeout);
        try {
          const data = JSON.parse(evt.data);
          if (data.type === "trying_model") {
            setAiTryingModel(data.model);
          } else if (data.type === "success") {
            setAiText(data.summary || data.answer || "No summary.");
            setAiModelUsed(data.model || null);
            setAiLoading(false);
            es.close();
          } else if (data.type === "error") {
            setAiText(`AI Error: ${data.message || "unknown"}`);
            setAiLoading(false);
            es.close();
          }
        } catch (e) {}
      };

      es.onerror = () => {
        clearTimeout(timeout);
        if (!received) fallback();
        else setAiLoading(false);
        es.close();
      };
    } catch (e) {
      // final fallback
      try {
        const res = await generateAISummary(new Date().getFullYear(), new Date().getMonth() + 1);
        setAiText(res?.summary || "No AI summary available.");
        setAiModelUsed(res?.model_used || null);
      } catch (err) {
        console.error("AI final fallback", err);
        setAiText("AI service unavailable.");
      } finally {
        setAiLoading(false);
      }
    }
  };

  /* ------------------ Render ------------------ */
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-[#0a0f1d]" : "bg-slate-50"}`}>
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-12 h-12 animate-spin text-amber-500" />
          <div className="font-black">Loading savings…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-[#0a0f1d]" : "bg-slate-50"}`}>
        <div className="text-center p-6">
          <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-500/10 mx-auto">
            <AlertCircle className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="font-black text-xl mb-2">Unable to load savings</h2>
          <p className="mb-4">{error}</p>
          <button onClick={loadAll} className="px-6 py-2 bg-amber-500 text-white rounded">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#0a0e27] text-white" : "bg-slate-50 text-slate-900"} transition-colors duration-500`}>
      {/* Background glows (same pattern used on other pages) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 ${isDark ? "bg-amber-500/30" : "bg-amber-200/40"}`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 ${isDark ? "bg-amber-600/20" : "bg-amber-100/30"}`} />
          </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-12 pt-24 pb-16">
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-10 duration-700">
          <div className="flex flex-col items-center gap-6 mb-6">
            <div className="p-6 bg-amber-500 rounded-[2.5rem] shadow-2xl shadow-amber-500/40 transform -rotate-6 hover:rotate-0 transition-all duration-500">
              <Wallet className="w-12 h-12 text-white" />
                  </div>
                  <div>
              <h1 className="text-header-unified mb-4">Savings <span className="text-amber-500">Overview</span></h1>
              <p className={`text-xl md:text-2xl font-bold ${isDark ? "text-slate-400" : "text-slate-600"} max-w-2xl mx-auto tracking-tight`}>
                Manage your vault, investments and goals — fully integrated with transactions and the dashboard.
                    </p>
                  </div>
                </div>
              </div>

        {/* Top cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className={`card-unified ${isDark ? "card-unified-dark" : "card-unified-light"} p-8 group hover:shadow-xl hover:shadow-amber-500/10 hover:border-amber-500/30 transition-all duration-300`}>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Total Wealth</p>
            <div className="flex items-center justify-between mt-4">
              <div>
                <p className="text-3xl font-black">EGP {fmt(totalWealth)}</p>
                <p className="text-xs text-slate-400 mt-1">Net liquidity & assets</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform duration-300">
                <Target className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800/50 flex justify-between items-center">
              <WealthChangeIndicator
                change={mockWealthChange.daily.change}
                percent={mockWealthChange.daily.percent}
                positive={mockWealthChange.daily.positive}
                label="Daily Change"
              />
              <WealthChangeIndicator
                change={mockWealthChange.weekly.change}
                percent={mockWealthChange.weekly.percent}
                positive={mockWealthChange.weekly.positive}
                label="Weekly Change"
              />
            </div>
          </div>

          <div className={`card-unified ${isDark ? "card-unified-dark" : "card-unified-light"} p-8 group hover:shadow-xl hover:shadow-amber-500/10 hover:border-amber-500/30 transition-all duration-300`}>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Monthly Goal</p>
            <div className="mt-4">
              <p className="text-2xl font-black">{monthlyGoal ? `EGP ${fmt(monthlySaved)} / ${fmt(monthlyGoal)}` : "No goal set"}</p>
              <div className="h-2 bg-slate-800 rounded mt-3 overflow-hidden shadow-inner-dark">
                <div style={{ width: `${monthlyProgress}%` }} className="h-full bg-amber-500 rounded transition-all duration-500 ease-out" />
              </div>
              <form onSubmit={saveMonthlyGoal} className="mt-4 flex gap-2">
                <input value={monthlyGoalInput} onChange={(e)=>setMonthlyGoalInput(e.target.value)} placeholder="Monthly goal EGP" className="flex-1 input-unified-small" />
                <button type="submit" className="btn-secondary-unified-small">Save</button>
              </form>
              {longTermGoal && (
                <div className="mt-4 pt-4 border-t border-slate-800/50">
                  <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Long-Term Mission: {longTermGoal.target_name || "Untitled"}</p>
                  <div className="text-sm font-bold text-slate-300">Remaining: EGP {fmt(longTermGoalRemaining)}</div>
                  <div className="text-sm font-bold text-slate-300">ETA: {longTermGoalETA}</div>
                  <div className="h-2 bg-slate-800 rounded mt-2 overflow-hidden shadow-inner-dark">
                    <div style={{ width: `${longTermGoalProgress}%` }} className="h-full bg-blue-500 rounded transition-all duration-500 ease-out" />
                  </div>
                  <button onClick={() => alert("Edit long-term goal flow")} className="text-xs text-amber-500 mt-2 hover:underline">Edit Long-Term Goal</button>
                </div>
              )}
            </div>
          </div>

          <div className={`card-unified ${isDark ? "card-unified-dark" : "card-unified-light"} p-8 group hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-500/30 transition-all duration-300`}>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Quick Savings</p>
            <form onSubmit={handleAllocate} className="mt-3 flex gap-2">
              <input value={monthlyInput} onChange={(e)=>setMonthlyInput(e.target.value)} placeholder="EGP amount" className={`flex-1 input-unified-small ${isDark ? 'input-unified-small.dark' : 'input-unified-small.light'}`} />
              <button type="submit" className="btn-primary-unified-small"><Plus className="w-4 h-4"/> Allocate</button>
            </form>
            <p className="text-xs text-slate-400 mt-3">Creates a transaction — dashboard and goals update automatically.</p>
          </div>

          <div className={`card-unified ${isDark ? "card-unified-dark" : "card-unified-light"} p-8 group hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-500/30 transition-all duration-300`}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">AI Suggestions</p>
              {aiModelUsed && (
                <div className="text-xs uppercase px-2 py-1 rounded-full bg-slate-800/50 border border-slate-700/50 text-slate-400">
                  Model: {getModelInfo(aiModelUsed)?.name || aiModelUsed}
                </div>
              )}
            </div>
            <div className="mt-3 flex flex-col gap-3">
              <button onClick={fetchAISummary} disabled={aiLoading} className="btn-primary-unified-small">
                {aiLoading ? <RefreshCw className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />} Get Insights
              </button>
            </div>
            {aiLoading && aiTryingModel && ( /* Show trying model */
              <div className="text-xs text-slate-500 mt-2 animate-pulse flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-emerald-400" /> Trying: {getModelInfo(aiTryingModel)?.name || aiTryingModel}...
              </div>
            )}
            {aiText && <div className="mt-3 text-sm whitespace-pre-wrap p-2 rounded bg-slate-800/50 border border-slate-700/50 leading-relaxed text-slate-300">{aiText}</div>}
          </div>
                </div>

        {/* Investments & History */}
        {/* Data Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* Savings Growth Chart */}
          <div className={`card-unified ${isDark ? "card-unified-dark" : "card-unified-light"} p-8`}>
            <h3 className="text-2xl font-black mb-4">Savings Growth</h3>
            {savingsGrowthData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={savingsGrowthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.5} vertical={false} />
                  <XAxis dataKey="date" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={12} tickLine={false} axisLine={false} tickFormatter={value => `EGP ${fmt(value)}`} />
                  <Tooltip content={CustomTooltipComponent(isDark)} />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="url(#colorSavings)" strokeWidth={2} />
                  <defs>
                    <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-10 text-slate-500">
                <Info className="w-10 h-10 mx-auto mb-4" />
                No savings transactions to display growth.
              </div>
            )}
          </div>

          {/* Investment Distribution Chart */}
          <div className={`card-unified ${isDark ? "card-unified-dark" : "card-unified-light"} p-8`}>
            <h3 className="text-2xl font-black mb-4">Investment Distribution</h3>
            {investmentPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={investmentPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    labelLine={false}
                  >
                    {investmentPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={CustomTooltipComponent(isDark)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-10 text-slate-500">
                <Info className="w-10 h-10 mx-auto mb-4" />
                No investments to display distribution.
              </div>
            )}
          </div>
        </div>

        {/* Investments & History Section (already exists, but can be improved) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className={`lg:col-span-2 card-unified ${isDark ? "card-unified-dark" : "card-unified-light"} p-8`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black">All Investments</h3>
              <div className="flex items-center gap-3">
                <button onClick={() => alert("Add investment flow")} className="btn-primary-unified-small">Add Investment</button>
                <button onClick={() => loadAll()} className="btn-secondary-unified-small p-2"><RefreshCw className="w-4 h-4" /></button>
              </div>
            </div>
            {investments.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Info className="w-10 h-10 mx-auto mb-4" />
                No investments recorded yet.
              </div>
            ) : (
              <div className="space-y-4">
                {investments.map(inv => (
                  <div key={inv.id} className={`flex items-center justify-between p-4 rounded-lg border ${isDark ? 'border-slate-800/30 bg-slate-800/20' : 'border-slate-200 bg-slate-50/50'} hover:border-amber-500/50 transition-all duration-300`}>
                    <div>
                      <div className="font-black text-lg">{inv.type} — {inv.amount}{["gold","silver"].includes((inv.type||"").toLowerCase())?"g":""}</div>
                      <div className="text-xs text-slate-400 mt-1">Buy: EGP {fmt(inv.buy_price)} on {new Date(inv.buy_date).toLocaleDateString()}</div>
                      <div className="text-xs text-slate-400 mt-1">Current Value: EGP {fmt(inv.current_value)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={()=>removeInvestment(inv.id)} className="btn-secondary-unified-small p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={`card-unified ${isDark ? "card-unified-dark" : "card-unified-light"} p-8`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-black">Recent Savings Transactions</h3>
              <button onClick={() => window.location.href = "/transactions"} className="btn-secondary-unified-small flex items-center gap-2"><History className="w-4 h-4" /> View all</button>
            </div>
            <div className="space-y-3">
              {transactions.filter(t => t.category_name?.toLowerCase()?.includes('savings')).slice(0,10).map(tx => (
                <div key={tx.id} className={`flex items-center justify-between py-2 border-b ${isDark ? 'border-slate-800/30' : 'border-slate-200'} last:border-b-0`}>
                  <div>
                    <div className="font-bold">{tx.description}</div>
                    <div className="text-xs text-slate-400">{new Date(tx.date).toLocaleDateString()}</div>
                  </div>
                  <div className={`font-black ${tx.amount < 0 ? 'text-blue-400' : 'text-rose-500'}`}>EGP {fmt(Math.abs(tx.amount))}</div>
                </div>
              ))}
              {transactions.filter(t => t.category_name?.toLowerCase()?.includes('savings')).length === 0 && <p className="text-sm text-slate-400">No recent savings transactions</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
