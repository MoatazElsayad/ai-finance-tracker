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
} from "../api";
import { RefreshCw, Plus, Wallet, Target, Coins, X, AlertCircle, Sparkles } from "lucide-react";

// Simplified, maintainable Savings page
const fmt = (n) => (n ?? 0).toLocaleString();
const card = (isDark) => `p-6 rounded-2xl border ${isDark ? "bg-slate-900/70 border-slate-700/50" : "bg-white border-slate-200"} shadow`;

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
  const totalWealth = useMemo(() => (savings?.cash_balance || 0) + investments.reduce((s, i) => s + (i?.current_value || 0), 0), [savings, investments]);
  const monthlySaved = savings?.monthly_saved ?? 0;
  const monthlyGoal = (parseFloat(savings?.monthly_goal) || parseFloat(monthlyGoalInput)) || 0;
  const monthlyProgress = monthlyGoal ? Math.min(100, (monthlySaved / monthlyGoal) * 100) : 0;

  // Quick allocate into savings (creates a transaction categorized as Savings)
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

  const fetchAISummary = async () => {
    setAiLoading(true);
    setAiText("");
    try {
      const res = await generateAISummary(new Date().getFullYear(), new Date().getMonth());
      setAiText(res?.summary || "No AI summary available.");
    } catch (e) {
      console.error(e);
      setAiText("AI service unavailable.");
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-[#0a0f1d]" : "bg-slate-50"}`}>
      <div className="flex flex-col items-center gap-4">
        <RefreshCw className="w-12 h-12 animate-spin text-amber-500" />
        <div className="font-bold">Loading savings...</div>
      </div>
    </div>
  );

  if (error) return (
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

  return (
    <div className={`${isDark ? "bg-[#0f172a] text-slate-200" : "bg-slate-50 text-slate-900"} min-h-screen pb-24`}>
      <div className="max-w-5xl mx-auto px-6 pt-24">
        <header className="mb-8">
          <h1 className="text-3xl font-black">Savings</h1>
          <p className="text-sm text-slate-400 mt-1">Manage your vault, goals and investments - integrated with transactions and dashboard.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={card(isDark)}>
            <p className="text-xs uppercase text-slate-500">Total Wealth</p>
            <h2 className="text-2xl font-black mt-2">EGP {fmt(totalWealth)}</h2>
            <div className="mt-4">
              <p className="text-xs text-slate-400">Monthly Goal</p>
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <div className="font-bold">{monthlyGoal ? `EGP ${fmt(monthlySaved)} / ${fmt(monthlyGoal)}` : "No goal set"}</div>
                  <div className="h-2 bg-slate-800 rounded mt-2 overflow-hidden">
                    <div style={{ width: `${monthlyProgress}%` }} className="h-2 bg-amber-500" />
                  </div>
                </div>
                <button onClick={() => setMonthlyGoalInput(String(monthlyGoal || ""))} className="px-3 py-2 bg-slate-800 text-white rounded">Edit</button>
              </div>
              <form onSubmit={saveMonthlyGoal} className="mt-3 flex gap-2">
                <input value={monthlyGoalInput} onChange={(e)=>setMonthlyGoalInput(e.target.value)} placeholder="Monthly goal EGP" className="flex-1 rounded px-3 py-2 bg-transparent border border-slate-700" />
                <button type="submit" className="px-4 py-2 bg-amber-500 text-white rounded">Save</button>
              </form>
            </div>
          </div>

          <div className={card(isDark)}>
            <p className="text-xs uppercase text-slate-500">Quick Savings</p>
            <form onSubmit={handleAllocate} className="mt-3 flex gap-2">
              <input value={monthlyInput} onChange={(e)=>setMonthlyInput(e.target.value)} placeholder="EGP amount" className="flex-1 rounded px-3 py-2 bg-transparent border border-slate-700" />
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2"><Plus /> Allocate</button>
            </form>
            <p className="text-xs text-slate-400 mt-3">This creates a transaction and backend will update goals and dashboard integrations.</p>
          </div>

          <div className={card(isDark)}>
            <p className="text-xs uppercase text-slate-500">AI Suggestions</p>
            <div className="mt-3 flex gap-2">
              <button onClick={fetchAISummary} disabled={aiLoading} className="px-4 py-2 bg-amber-500 text-white rounded flex items-center gap-2">
                {aiLoading ? <RefreshCw className="animate-spin" /> : <Sparkles />} Get Insights
              </button>
            </div>
            {aiText && <div className="mt-3 text-sm whitespace-pre-wrap">{aiText}</div>}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className={card(isDark)}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black">Investments</h3>
              <button onClick={()=>alert("Use Add Investment flow")} className="text-sm">Add</button>
            </div>
            <div className="space-y-4">
              {investments.length === 0 ? (
                <p className="text-sm text-slate-400">No investments yet</p>
              ) : (
                investments.map((inv) => {
                  if (!inv) return null;
                  return (
                    <div key={inv.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div>
                        <div className="font-bold">
                          {inv.type || "Investment"} - {inv.amount}
                          {["gold", "silver"].includes((inv.type || "").toLowerCase()) ? "g" : ""}
                        </div>
                        <div className="text-xs text-slate-400">Value: EGP {fmt(inv.current_value)}</div>
                      </div>
                      <button
                        onClick={() => removeInvestment(inv.id)}
                        className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className={card(isDark)}>
            <h3 className="font-black mb-3">Recent Savings Transactions</h3>
            {transactions.filter(t => t.category_name?.toLowerCase()?.includes('savings')).slice(0, 10).map(tx => (
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
  );
}

