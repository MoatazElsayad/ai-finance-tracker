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
} from "lucide-react";

const fmt = (n) => (n ?? 0).toLocaleString();

export default function Savings() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savings, setSavings] = useState(null);
  const [rates, setRates] = useState({});
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);

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
        getSavingsRates(false),
      ]);
      setCategories(cats || []);
      setSavings(sData || {});
      setTransactions(txns?.transactions || []);
      setRates(r || {});
      if (sData?.monthly_goal) setMonthlyGoalInput(String(sData.monthly_goal));
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
          <div className={`card-unified ${isDark ? "card-unified-dark" : "card-unified-light"} p-8`}>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Total Wealth</p>
            <div className="flex items-center justify-between mt-4">
              <div>
                <p className="text-3xl font-black">EGP {fmt(totalWealth)}</p>
                <p className="text-xs text-slate-400 mt-1">Net liquidity & assets</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
                <Target className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className={`card-unified ${isDark ? "card-unified-dark" : "card-unified-light"} p-8`}>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Monthly Goal</p>
            <div className="mt-4">
              <p className="text-2xl font-black">{monthlyGoal ? `EGP ${fmt(monthlySaved)} / ${fmt(monthlyGoal)}` : "No goal set"}</p>
              <div className="h-2 bg-slate-800 rounded mt-3 overflow-hidden">
                <div style={{ width: `${monthlyProgress}%` }} className="h-2 bg-amber-500" />
              </div>
              <form onSubmit={saveMonthlyGoal} className="mt-3 flex gap-2">
                <input value={monthlyGoalInput} onChange={(e)=>setMonthlyGoalInput(e.target.value)} placeholder="Monthly goal EGP" className="flex-1 rounded px-3 py-2 bg-transparent border border-slate-700" />
                <button type="submit" className="px-4 py-2 bg-amber-500 text-white rounded">Save</button>
              </form>
            </div>
          </div>

          <div className={`card-unified ${isDark ? "card-unified-dark" : "card-unified-light"} p-8`}>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Quick Savings</p>
            <form onSubmit={handleAllocate} className="mt-3 flex gap-2">
              <input value={monthlyInput} onChange={(e)=>setMonthlyInput(e.target.value)} placeholder="EGP amount" className="flex-1 rounded px-3 py-2 bg-transparent border border-slate-700" />
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2"><Plus /> Allocate</button>
            </form>
            <p className="text-xs text-slate-400 mt-3">Creates a transaction — dashboard and goals update automatically.</p>
          </div>

          <div className={`card-unified ${isDark ? "card-unified-dark" : "card-unified-light"} p-8`}>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">AI Suggestions</p>
            <div className="mt-3 flex gap-2">
              <button onClick={fetchAISummary} disabled={aiLoading} className="px-4 py-2 bg-amber-500 text-white rounded flex items-center gap-2">
                {aiLoading ? <RefreshCw className="animate-spin" /> : <Sparkles />} Get Insights
              </button>
            </div>
            {aiText && <div className="mt-3 text-sm whitespace-pre-wrap">{aiText}</div>}
          </div>
        </div>

        {/* Investments & History */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`lg:col-span-2 card-unified ${isDark ? "card-unified-dark" : "card-unified-light"} p-8`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black">Investments</h3>
              <div className="flex items-center gap-3">
                <button onClick={() => alert("Add investment flow")} className="px-4 py-2 rounded bg-amber-500 text-white">Add</button>
                <button onClick={() => loadAll()} className="p-2 rounded bg-slate-800/30"><RefreshCw className="w-4 h-4" /></button>
              </div>
            </div>
            {investments.length === 0 ? (
              <div className="py-12 text-center text-slate-400">No investments yet</div>
            ) : (
              <div className="space-y-4">
                {investments.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between p-4 rounded-lg bg-transparent border border-slate-800/20">
                    <div>
                      <div className="font-black">{inv.type} — {inv.amount}{["gold","silver"].includes((inv.type||"").toLowerCase())?"g":""}</div>
                      <div className="text-xs text-slate-400">Value: EGP {fmt(inv.current_value)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={()=>removeInvestment(inv.id)} className="px-3 py-1 rounded bg-rose-500 text-white">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={`card-unified ${isDark ? "card-unified-dark" : "card-unified-light"} p-8`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-black">Recent Savings</h3>
              <button onClick={() => window.location.href = "/transactions"} className="text-sm flex items-center gap-2"><History className="w-4 h-4" /> View all</button>
            </div>
            <div className="space-y-3">
              {transactions.filter(t => t.category_name?.toLowerCase()?.includes('savings')).slice(0,10).map(tx => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
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
