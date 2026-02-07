import React, { useState, useEffect, useMemo, useCallback } from "react";
import confetti from 'canvas-confetti';
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
  getSavingsAnalysis,
  createSavingsAIProgressStream,
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
  TrendingUp, 
  Landmark, 
  ArrowRight,
  PieChart as PieChartIcon,
  Trash2,
  Calendar,
  ChevronRight,
  History,
  Bot,
  Gem,
  Banknote,
  ArrowUpRight
} from "lucide-react";
import { formatAISummary, getModelInfo } from './DashboardUtils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";


/* --------------------------------------------------------------- *
 *  TRADINGVIEW CHART COMPONENT
 * --------------------------------------------------------------- */
const TradingViewChart = ({ symbol, isDark }) => (
  <div className="w-full h-[240px] rounded-2xl overflow-hidden border border-slate-200/10 bg-slate-900/50">
    <iframe
      title="Market Chart"
      src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_762ae&symbol=${symbol}&interval=D&hidesidetoolbar=1&hidetoptoolbar=1&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=[]&theme=${isDark ? 'dark' : 'light'}&style=3&timezone=Etc%2FUTC&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=en&utm_source=localhost&utm_medium=widget&utm_campaign=chart&utm_term=${symbol}`}
      style={{ width: '100%', height: '100%', border: 'none' }}
    />
  </div>
);

/* --------------------------------------------------------------- *
 *  INVESTMENT FORM (INLINE)
 * --------------------------------------------------------------- */
const InvestmentForm = ({ onClose, onAddInvestment, isDark, rates }) => {
  const [activeTab, setActiveTab] = useState('gold'); // 'gold', 'silver', 'currency'
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [amount, setAmount] = useState('');
  const [buyDate, setBuyDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const currencyOptions = useMemo(() => [
    { id: 'USD', name: 'US Dollar', code: 'us', symbol: 'FX:USDEGP' },
    { id: 'EUR', name: 'Euro', code: 'eu', symbol: 'FX:EUREGP' },
    { id: 'GBP', name: 'British Pound', code: 'gb', symbol: 'FX:GBPEGP' },
    { id: 'SAR', name: 'Saudi Riyal', code: 'sa', symbol: 'FX:SAREGP' },
    { id: 'AED', name: 'UAE Dirham', code: 'ae', symbol: 'FX:AEDEGP' },
    { id: 'KWD', name: 'Kuwaiti Dinar', code: 'kw', symbol: 'FX:KWDEGP' },
    { id: 'QAR', name: 'Qatari Rial', code: 'qa', symbol: 'FX:QAREGP' },
    { id: 'BHD', name: 'Bahraini Dinar', code: 'bh', symbol: 'FX:BHDEGP' },
    { id: 'OMR', name: 'Omani Rial', code: 'om', symbol: 'FX:OMREGP' },
    { id: 'JOD', name: 'Jordanian Dinar', code: 'jo', symbol: 'FX:JODEGP' },
    { id: 'CAD', name: 'Canadian Dollar', code: 'ca', symbol: 'FX:CADEGP' },
    { id: 'AUD', name: 'Australian Dollar', code: 'au', symbol: 'FX:AUDEGP' },
    { id: 'TRY', name: 'Turkish Lira', code: 'tr', symbol: 'FX:TRYEGP' },
  ], []);

  const currentRate = useMemo(() => {
    if (!rates) return 0;
    if (activeTab === 'gold') return rates.gold || 0;
    if (activeTab === 'silver') return rates.silver || 0;
    return rates[selectedCurrency.toLowerCase()] || 0;
  }, [activeTab, selectedCurrency, rates]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    const type = activeTab === 'currency' ? selectedCurrency : activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
    try {
      await onAddInvestment({ type, amount: numAmount, buy_date: buyDate });
      setSuccess(true);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#10b981', '#fbbf24']
      });
      setAmount('');
      setBuyDate(new Date().toISOString().split('T')[0]);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError('Failed to add investment. Please try again.');
    }
  };

  const activeTheme = useMemo(() => {
    if (activeTab === 'gold') return {
      primary: 'amber-500',
      secondary: 'amber-600',
      bg: isDark ? 'bg-amber-500/10' : 'bg-amber-50',
      text: 'text-amber-500',
      shadow: 'shadow-amber-500/20',
      accent: 'amber'
    };
    if (activeTab === 'silver') return {
      primary: 'slate-400',
      secondary: 'slate-500',
      bg: isDark ? 'bg-slate-400/10' : 'bg-slate-50',
      text: 'text-slate-400',
      shadow: 'shadow-slate-400/20',
      accent: 'slate'
    };
    return {
      primary: 'blue-600',
      secondary: 'blue-700',
      bg: isDark ? 'bg-blue-600/10' : 'bg-blue-50',
      text: 'text-blue-600',
      shadow: 'shadow-blue-600/20',
      accent: 'blue'
    };
  }, [activeTab, isDark]);

  const accentColor = activeTheme.accent;

  return (
    <div className={`relative w-full overflow-hidden flex flex-col lg:flex-row rounded-[2.5rem] border ${isDark ? 'bg-slate-900 border-slate-700 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'} z-10 animate-in fade-in slide-in-from-top-4 duration-500 mb-8`}>
      
      {/* Decorative Background Gradients */}
      <div className={`absolute top-0 right-0 w-96 h-96 blur-[120px] opacity-20 -z-10 ${
        accentColor === 'amber' ? 'bg-amber-500' : 
        accentColor === 'slate' ? 'bg-slate-400' : 
        'bg-blue-600'
      }`} />

      {/* Left Sidebar - Navigation */}
      <div className={`w-full lg:w-72 p-8 flex flex-col border-b lg:border-b-0 lg:border-r ${isDark ? 'border-slate-700 bg-slate-900/40' : 'border-slate-100 bg-slate-50/50'}`}>
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
            <ArrowUpRight className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>New Asset</h3>
            <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Investment Portal</p>
          </div>
        </div>

        <div className="space-y-3 flex-1">
          <button 
            onClick={() => setActiveTab('gold')}
            className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all duration-300 ${activeTab === 'gold' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-white text-slate-500'}`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeTab === 'gold' ? 'bg-white/20' : isDark ? 'bg-slate-800' : 'bg-white'}`}>
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-black uppercase tracking-wider">Gold</span>
            </div>
          </button>

          <button 
            onClick={() => setActiveTab('silver')}
            className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all duration-300 ${activeTab === 'silver' ? 'bg-slate-400 text-white shadow-lg shadow-slate-400/20' : isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-white text-slate-500'}`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeTab === 'silver' ? 'bg-white/20' : isDark ? 'bg-slate-800' : 'bg-white'}`}>
              <Gem className="w-5 h-5" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-black uppercase tracking-wider">Silver</span>
            </div>
          </button>

          <button 
            onClick={() => setActiveTab('currency')}
            className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all duration-300 ${activeTab === 'currency' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-white text-slate-500'}`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeTab === 'currency' ? 'bg-white/20' : isDark ? 'bg-slate-800' : 'bg-white'}`}>
              <Banknote className="w-5 h-5" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-black uppercase tracking-wider">Currency</span>
            </div>
          </button>
        </div>

        <div className={`mt-8 p-6 rounded-3xl border ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-100 shadow-sm'}`}>
          <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Live Rate</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{currentRate.toLocaleString()}</span>
            <span className="text-[10px] font-black text-blue-500">EGP</span>
          </div>
        </div>
      </div>

      {/* Right Content - Form */}
      <div className={`flex-1 p-8 lg:p-10 ${isDark ? 'bg-slate-900/50' : 'bg-white'}`}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Add {activeTab === 'currency' ? selectedCurrency : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h2>
          </div>
          <button onClick={onClose} className={`p-3 rounded-2xl ${isDark ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-100 text-slate-400'} transition-all`}>
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl text-sm font-bold flex items-center gap-3">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-6 bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-500 rounded-3xl text-sm font-black flex items-center justify-between animate-in zoom-in slide-in-from-top-4 duration-500 shadow-lg shadow-emerald-500/10">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-emerald-500 rounded-xl text-white">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-lg">Success!</p>
                <p className="text-xs opacity-70 font-bold uppercase tracking-widest">Investment secured in vault</p>
              </div>
            </div>
            <button onClick={() => setSuccess(false)} className="p-2 hover:bg-emerald-500/20 rounded-xl transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {activeTab === 'currency' && (
            <div>
              <label className={`block text-xs font-black uppercase tracking-[0.2em] mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Select Currency</label>
              <div className="grid grid-cols-4 md:grid-cols-7 gap-2 p-2 rounded-2xl border border-slate-200/10 bg-slate-900/20 overflow-x-auto">
                {currencyOptions.map((curr) => (
                  <button
                    key={curr.id}
                    type="button"
                    onClick={() => setSelectedCurrency(curr.id)}
                    className={`p-2 rounded-xl flex flex-col items-center gap-1 transition-all min-w-[60px] ${selectedCurrency === curr.id ? 'bg-blue-600 text-white shadow-lg' : isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-white text-slate-500'}`}
                  >
                    <img 
                      src={`https://flagcdn.com/w40/${curr.code}.png`} 
                      alt={curr.name}
                      className="w-6 h-4 object-cover rounded-sm shadow-sm"
                    />
                    <span className="text-[10px] font-black">{curr.id}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={`block text-xs font-black uppercase tracking-[0.2em] mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'} flex items-center gap-2`}>
                Amount {['gold', 'silver'].includes(activeTab) ? '(Grams)' : (
                  <div className="flex items-center gap-2">
                    <span>({selectedCurrency})</span>
                    <img 
                      src={`https://flagcdn.com/w20/${currencyOptions.find(c => c.id === selectedCurrency)?.code}.png`} 
                      alt=""
                      className="w-4 h-3 rounded-sm"
                    />
                  </div>
                )}
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.01" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  className={`w-full p-4 rounded-2xl text-lg font-black outline-none border-2 transition-all ${isDark ? 'bg-slate-800/50 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-blue-600'}`} 
                  placeholder="0.00" 
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500">
                  {['gold', 'silver'].includes(activeTab) ? 'g' : selectedCurrency}
                </div>
              </div>
            </div>
            <div>
              <label className={`block text-xs font-black uppercase tracking-[0.2em] mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Date</label>
              <input 
                type="date" 
                value={buyDate} 
                onChange={(e) => setBuyDate(e.target.value)} 
                className={`w-full p-4 rounded-2xl text-lg font-black outline-none border-2 transition-all ${isDark ? 'bg-slate-800/50 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-blue-600'}`} 
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6 pt-4">
            <div className={`flex-1 p-5 rounded-2xl border-2 border-dashed ${isDark ? 'border-slate-800 bg-slate-900/30' : 'border-slate-100 bg-slate-50/50'}`}>
              <div className="flex justify-between items-center">
                <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Value</span>
                <span className="text-xl font-black text-blue-600">{(currentRate * (parseFloat(amount) || 0)).toLocaleString()} EGP</span>
              </div>
            </div>
            <button type="submit" className={`w-full md:w-auto px-10 py-5 rounded-2xl text-sm font-black uppercase tracking-[0.3em] text-white transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-blue-600/20 ${activeTab === 'gold' ? 'bg-amber-500 hover:bg-amber-600' : activeTab === 'silver' ? 'bg-slate-500 hover:bg-slate-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
              Secure Investment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* --------------------------------------------------------------- *
 *  MAIN SAVINGS PAGE COMPONENT
 * --------------------------------------------------------------- */
export default function Savings() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Helper for currency formatting with enhanced precision for small changes
  const fmt = (n) => (n ?? 0).toLocaleString('en-EG', { 
    style: 'currency', 
    currency: 'EGP',
    maximumFractionDigits: 0 
  });

  const fmtPrecise = (n) => (n ?? 0).toLocaleString('en-EG', { 
    style: 'currency', 
    currency: 'EGP',
    maximumFractionDigits: 2
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savings, setSavings] = useState(null);
  const [rates, setRates] = useState({});
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // UI state
  const [monthlyInput, setMonthlyInput] = useState("");
  const [monthlyGoalInput, setMonthlyGoalInput] = useState("");
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiModelUsed, setAiModelUsed] = useState(null);
  const [currentTryingModel, setCurrentTryingModel] = useState(null);
  const [showInvestmentForm, setShowInvestmentForm] = useState(false);
  const [shouldRenderForm, setShouldRenderForm] = useState(false);

  useEffect(() => {
    if (showInvestmentForm) {
      setShouldRenderForm(true);
    }
  }, [showInvestmentForm]);

  const handleFormClose = () => {
    setShowInvestmentForm(false);
    setTimeout(() => setShouldRenderForm(false), 500); // Match transition duration
  };
  const [selectedInvestmentType, setSelectedInvestmentType] = useState('Gold'); // Default to Gold

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
          <ArrowRight className="w-4 h-4" />
        )}
        <span className="text-sm font-black uppercase tracking-wider">
          {positive ? "+" : ""}{fmtPrecise(change)} ({positive ? "+" : ""}{percent}%)
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
  }, [totalWealth]); // Recalculate if totalWealth changes

  // Quick allocate into savings
  const handleAllocate = async (e) => {
    e?.preventDefault();
    const amount = parseFloat(monthlyInput);
    if (!amount || isNaN(amount) || amount <= 0) return;
    try {
      let savingsCat = categories.find(c => c.name?.toLowerCase().includes("savings"));
      if (!savingsCat) savingsCat = await initSavingsCategory();
      await createTransaction(savingsCat.id, -Math.abs(amount), "Quick savings allocation", new Date().toISOString().split("T")[0]);
      setMonthlyInput("");
      await loadAll();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddInvestment = async (investmentData) => {
    try {
      await createInvestment(investmentData);
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
    if (isNaN(val) || val < 0) return;
    try {
      await updateSavingsGoal(val);
      setIsEditingGoal(false);
      await loadAll();
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAISummary = async () => {
    setAiLoading(true);
    setAiText("");
    setAiModelUsed(null);
    setCurrentTryingModel(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setAiText("Please log in again to use AI insights.");
        setAiLoading(false);
        return;
      }

      let hasReceivedMessage = false;
      let eventSource = null;

      const fallbackToRegularAPI = async () => {
        try {
          const res = await getSavingsAnalysis();
          setAiText(res?.summary || "No specialized savings analysis available.");
          setAiModelUsed(res?.model_used || null);
        } catch (e) {
          setAiText("AI service unavailable.");
        } finally {
          setAiLoading(false);
        }
      };

      const timeout = setTimeout(() => {
        if (!hasReceivedMessage) {
          if (eventSource) eventSource.close();
          fallbackToRegularAPI();
        }
      }, 5000);

      eventSource = createSavingsAIProgressStream(
        (data) => {
          hasReceivedMessage = true;
          clearTimeout(timeout);
          switch (data.type) {
            case 'trying_model':
              setCurrentTryingModel(data.model);
              break;
            case 'success':
              setAiText(data.summary);
              setAiModelUsed(data.model);
              setAiLoading(false);
              eventSource.close();
              break;
            case 'error':
              setAiText(`**Error**\n\n${data.message}`);
              setAiLoading(false);
              eventSource.close();
              break;
          }
        },
        (error) => {
          clearTimeout(timeout);
          if (!hasReceivedMessage) {
            fallbackToRegularAPI();
          } else {
            setAiLoading(false);
          }
        }
      );

    } catch (e) {
      console.error(e);
      setAiText("AI service connection failed.");
      setAiLoading(false);
    }
  };

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-[#0a0f1d]" : "bg-slate-50"}`}>
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <RefreshCw className="w-16 h-16 animate-spin text-blue-600 opacity-20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Landmark className="w-8 h-8 text-blue-600 animate-pulse" />
          </div>
        </div>
        <div className={`font-black uppercase tracking-[0.3em] text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Securing your vault...
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-[#0a0f1d]" : "bg-slate-50"}`}>
      <div className={`max-w-md w-full p-12 text-center card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'}`}>
        <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-rose-500/10 border-2 border-rose-500/20">
          <AlertCircle className="w-10 h-10 text-rose-500" />
        </div>
        <h2 className={`font-black text-2xl mb-3 uppercase tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Vault Access Denied
        </h2>
        <p className={`mb-8 text-lg ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{error}</p>
        <button 
          onClick={loadAll} 
          className="btn-primary-unified w-full flex items-center justify-center gap-3 !bg-blue-600 hover:!bg-blue-700"
        >
          <RefreshCw className="w-5 h-5" />
          Retry Connection
        </button>
      </div>
    </div>
  );

  return (
    <div className={`${isDark ? "bg-[#0a0e27] text-slate-200" : "bg-slate-50 text-slate-900"} min-h-screen transition-colors duration-500 pb-24`}>
      {/* Header Section */}
      <section className="pt-24 pb-12 px-6 md:px-12">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
            <div>
              <h1 className="text-header-unified flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-2xl shadow-xl shadow-blue-600/20">
                  <Landmark className="w-8 h-8 text-white" />
                </div>
                Savings Vault
              </h1>
              <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} mt-3 text-lg font-medium`}>
                Manage your financial future, investments, and long-term goals.
              </p>
            </div>
            
            <div className="flex items-center gap-4">
               <button 
                onClick={loadAll}
                title="Refresh Vault Data"
                className={`p-4 rounded-2xl transition-all ${isDark ? 'bg-slate-800/50 hover:bg-slate-700 border-slate-700' : 'bg-white hover:bg-slate-50 border-slate-200'} border-2 shadow-sm group`}
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500 text-blue-600`} />
              </button>
              <button 
                className="btn-primary-unified !px-8 !bg-blue-600 hover:!bg-blue-700 relative overflow-hidden group" 
                onClick={() => {
                  if (showInvestmentForm) {
                    handleFormClose();
                  } else {
                    setShowInvestmentForm(true);
                  }
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-10 transition-opacity" />
                <Plus className={`w-5 h-5 transition-transform duration-500 ${showInvestmentForm ? 'rotate-45' : 'group-hover:rotate-90'}`} />
                {showInvestmentForm ? 'Close Form' : 'Add Investment'}
              </button>
            </div>
          </div>

          {/* Top Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Total Wealth Card */}
            <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'} relative overflow-hidden group border-2 ${isDark ? 'hover:border-blue-500/30' : 'hover:border-blue-200'} transition-all duration-500`}>
              <div className="flex items-center justify-between mb-6">
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Total Net Worth
                </span>
                <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-500 shadow-sm group-hover:scale-110 transition-transform duration-500">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-3xl font-black tracking-tight text-emerald-500">
                  {fmt(totalWealth)}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <div className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                    +12.4%
                  </div>
                  <span className={`text-[10px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>from last month</span>
                </div>
              </div>
              <div className="absolute -right-12 -bottom-12 w-32 h-32 rounded-full bg-emerald-500 blur-[60px] opacity-10" />
            </div>

            {/* Cash Balance Card */}
            <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'} relative overflow-hidden group border-2 ${isDark ? 'hover:border-blue-500/30' : 'hover:border-blue-200'} transition-all duration-500`}>
              <div className="flex items-center justify-between mb-6">
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Liquid Cash
                </span>
                <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-600/20 text-blue-600 shadow-sm group-hover:scale-110 transition-transform duration-500">
                  <Wallet className="w-6 h-6" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <h2 className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {fmt(savings?.cash_balance || 0)}
                </h2>
                <p className={`text-[10px] font-medium mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Ready for allocation</p>
              </div>
              <div className="absolute -right-12 -bottom-12 w-32 h-32 rounded-full bg-blue-600 blur-[60px] opacity-10" />
            </div>

            {/* Monthly Goal Card */}
            <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'} md:col-span-2 relative overflow-hidden group border-2 ${isDark ? 'hover:border-blue-500/30' : 'hover:border-blue-200'} transition-all duration-500`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex flex-col">
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    Monthly Savings Goal
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {fmt(monthlySaved)} / {fmt(monthlyGoal)}
                    </span>
                    <button 
                      onClick={() => setIsEditingGoal(!isEditingGoal)}
                      className={`p-1.5 rounded-lg transition-all ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                    >
                      <Target className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`text-2xl font-black ${monthlyProgress >= 100 ? 'text-emerald-500' : 'text-blue-600'} animate-in zoom-in duration-500`}>
                    {Math.round(monthlyProgress)}%
                  </span>
                  <span className={`text-[10px] font-black uppercase tracking-[0.1em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {monthlyProgress >= 100 ? 'Goal Reached!' : 'Achieved'}
                  </span>
                </div>
              </div>

              <div className="relative pt-2">
                <div className={`w-full h-4 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <div 
                    className={`h-full transition-all duration-1000 ease-out rounded-full shadow-lg ${
                      monthlyProgress >= 100 ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-blue-600 shadow-blue-600/20'
                    }`}
                    style={{ width: `${monthlyProgress}%` }}
                  />
                </div>
                {isEditingGoal && (
                  <div className="absolute inset-0 flex items-center gap-2 bg-inherit animate-in fade-in duration-300">
                    <form onSubmit={saveMonthlyGoal} className="flex-1 flex items-center gap-2">
                      <input 
                        autoFocus
                        value={monthlyGoalInput} 
                        onChange={(e)=>setMonthlyGoalInput(e.target.value)} 
                        placeholder="Set target EGP" 
                        className={`flex-1 rounded-xl px-4 py-2 text-sm font-bold ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'} border-2 outline-none focus:border-blue-600 transition-all`} 
                      />
                      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-wider shadow-lg shadow-blue-600/20 transition-all active:scale-95">
                        Update
                      </button>
                    </form>
                    <button type="button" onClick={() => setIsEditingGoal(false)} className={`p-2 rounded-xl ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-500'}`}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full bg-blue-600 blur-[80px] opacity-10" />
            </div>
        </div>

        {shouldRenderForm && (
          <div className={`mb-10 transition-all duration-500 ease-in-out transform ${
            showInvestmentForm 
              ? 'opacity-100 translate-y-0 scale-100' 
              : 'opacity-0 -translate-y-8 scale-95 pointer-events-none'
          }`}>
            <InvestmentForm 
              onClose={handleFormClose}
              onAddInvestment={handleAddInvestment}
              isDark={isDark}
              rates={rates}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Area - 2 columns */}
            <div className="lg:col-span-2 space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000">
              {/* Investments Section */}
              <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'}`}>
                <div className="flex items-center justify-between mb-8">
                  <h3 className={`text-xl font-black flex items-center gap-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600">
                      <Coins className="w-5 h-5" />
                    </div>
                    <span className="uppercase tracking-[0.2em]">Asset Portfolio</span>
                  </h3>
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                    {investments.length} Active Assets
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {investments.length === 0 ? (
                    <div className={`col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed ${isDark ? 'border-slate-800' : 'border-slate-100'} rounded-[2rem]`}>
                      <PieChartIcon className={`w-12 h-12 mb-4 ${isDark ? 'text-slate-700' : 'text-slate-200'}`} />
                      <p className={`text-sm font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No investments tracked yet</p>
                      <button onClick={() => setShowInvestmentForm(true)} className="mt-4 text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] hover:underline">Start building your portfolio</button>
                    </div>
                  ) : (
                    investments.map((inv) => {
                      if (!inv) return null;
                      const type = (inv.type || "Investment").toLowerCase();
                      const isMetal = ["gold", "silver"].includes(type);
                      return (
                        <div key={inv.id} className={`group p-6 rounded-[2rem] border-2 transition-all duration-300 ${isDark ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800' : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-600/5'}`}>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                type === 'gold' ? 'bg-yellow-500/10 text-yellow-500' : 
                                type === 'silver' ? 'bg-slate-400/10 text-slate-400' : 
                                'bg-blue-600/10 text-blue-600'
                              }`}>
                                {type === 'gold' ? <Sparkles className="w-5 h-5" /> : 
                                 type === 'silver' ? <Gem className="w-5 h-5" /> : 
                                 <Banknote className="w-5 h-5" />}
                              </div>
                              <div className="flex flex-col">
                                <span className={`text-sm font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                  {inv.type}
                                </span>
                                <span className={`text-[10px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                  {inv.amount} {isMetal ? 'grams' : 'units'}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => removeInvestment(inv.id)}
                              className="p-2 opacity-0 group-hover:opacity-100 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex items-end justify-between">
                            <div className="flex flex-col">
                              <span className={`text-[10px] font-black uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Current Value</span>
                              <span className="text-xl font-black text-blue-600">{fmt(inv.current_value)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-emerald-500">
                              <TrendingUp className="w-3 h-3" />
                              <span className="text-[10px] font-black">+4.2%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Transactions Section */}
              <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'}`}>
                <div className="flex items-center justify-between mb-8">
                  <h3 className={`text-xl font-black flex items-center gap-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600">
                      <History className="w-5 h-5" />
                    </div>
                    <span className="uppercase tracking-[0.2em]">Recent Vault Activity</span>
                  </h3>
                  <button className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'} transition-colors`}>
                    View All
                  </button>
                </div>

                <div className="space-y-2">
                  {transactions.filter(t => t.category_name?.toLowerCase()?.includes('savings')).length === 0 ? (
                    <div className="py-8 text-center">
                      <p className={`text-sm font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No vault activity found</p>
                    </div>
                  ) : (
                    transactions.filter(t => t.category_name?.toLowerCase()?.includes('savings')).slice(0, 5).map(tx => (
                      <div key={tx.id} className={`flex items-center justify-between p-4 rounded-2xl transition-all ${isDark ? 'hover:bg-slate-800/50 border border-transparent hover:border-slate-700' : 'hover:bg-slate-50 border border-transparent hover:border-slate-100'}`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.amount < 0 ? 'bg-blue-600/10 text-blue-600' : 'bg-rose-500/10 text-rose-500'}`}>
                            {tx.amount < 0 ? <Plus className="w-5 h-5" /> : <ArrowRight className="w-5 h-5 rotate-45" />}
                          </div>
                          <div className="flex flex-col">
                            <span className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{tx.description}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Calendar className="w-3 h-3 text-slate-500" />
                              <span className={`text-[10px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{new Date(tx.date).toLocaleDateString('en-EG', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className={`font-black ${tx.amount < 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {tx.amount < 0 ? '+' : '-'}{fmt(Math.abs(tx.amount))}
                          </span>
                          <span className={`text-[9px] font-black uppercase tracking-wider ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>Processed</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar Widgets - 1 column */}
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-1000">
              {/* Quick Deposit */}
              <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'} border-2 ${isDark ? 'border-blue-500/20' : 'border-blue-100'}`}>
                <h3 className={`text-sm font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                  <Wallet className="w-4 h-4" /> Quick Deposit
                </h3>
                <form onSubmit={handleAllocate} className="space-y-4">
                  <div className="relative">
                    <input 
                      type="number"
                      value={monthlyInput} 
                      onChange={(e)=>setMonthlyInput(e.target.value)} 
                      placeholder="0.00" 
                      className={`w-full rounded-[1.5rem] pl-12 pr-6 py-4 text-2xl font-black ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'} border-2 outline-none focus:border-blue-600 transition-all`} 
                    />
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-black text-slate-500">£</span>
                  </div>
                  <button type="submit" className="btn-primary-unified w-full !py-4 !rounded-[1.5rem] !text-xs !uppercase !tracking-[0.2em] !bg-blue-600 hover:!bg-blue-700 shadow-xl shadow-blue-600/20">
                    Allocate to Vault
                  </button>
                  <p className={`text-[10px] text-center font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    Instantly updates your monthly goals and balance.
                  </p>
                </form>
              </div>

              {/* AI Suggestions Card */}
              <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'} bg-gradient-to-br ${isDark ? 'from-slate-900/90 to-blue-600/5' : 'from-white to-blue-50'}`}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    <Bot className="w-4 h-4 text-blue-600" /> AI Vault Insights
                  </h3>
                  {aiLoading && <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />}
                </div>
                
                {aiLoading ? (
                  <div className="flex flex-col items-center py-10 space-y-6 animate-in fade-in duration-500">
                    <div className="relative">
                      {currentTryingModel ? (
                        (() => {
                          try {
                            const modelInfo = getModelInfo(currentTryingModel);
                            const isUrl = modelInfo.logo.startsWith('http');
                            return (
                              <div className={`p-6 rounded-[2rem] border-2 shadow-2xl transition-all duration-500 ${
                                isDark ? 'bg-blue-500/10 border-blue-500/20 shadow-blue-500/10' : 'bg-blue-50 border-blue-100 shadow-blue-200/50'
                              }`}>
                                {isUrl ? (
                                  <img src={modelInfo.logo} alt={modelInfo.name} className="w-12 h-12 object-contain animate-pulse rounded-lg" />
                                ) : (
                                  <span className="text-4xl animate-pulse inline-block">{modelInfo.logo}</span>
                                )}
                              </div>
                            );
                          } catch (e) {
                            return (
                              <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                            );
                          }
                        })()
                      ) : (
                        <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                      )}
                      {!currentTryingModel && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Sparkles className="w-6 h-6 text-blue-600 animate-pulse" />
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                        {currentTryingModel ? (
                          (() => {
                            try {
                              const mInfo = getModelInfo(currentTryingModel);
                              return (
                                <span className="flex items-center justify-center gap-2">
                                  Analyzing with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">{mInfo.name}</span>
                                </span>
                              );
                            } catch (e) {
                              return 'Analyzing Vault...';
                            }
                          })()
                        ) : 'Analyzing Vault...'}
                      </p>
                      <p className={`text-[9px] font-medium mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Consulting financial algorithms
                      </p>
                    </div>
                  </div>
                ) : !aiText ? (
                  <div className="space-y-4">
                    <p className={`text-xs font-medium leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Let our AI analyze your vault strategy and provide personalized growth recommendations.
                    </p>
                    <button 
                      onClick={fetchAISummary} 
                      className={`w-full flex items-center justify-center gap-3 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${
                        isDark ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700' : 'bg-white border-2 border-slate-100 hover:border-blue-200 text-slate-900'
                      }`}
                    >
                      Generate Analysis
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className={`text-xs font-medium leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'} max-h-[300px] overflow-y-auto pr-2 custom-scrollbar`}>
                      {formatAISummary(aiText, theme, true)}
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                      <span className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                        {aiModelUsed && (
                          (() => {
                            try {
                              const mInfo = getModelInfo(aiModelUsed);
                              const isUrl = mInfo.logo.startsWith('http');
                              return (
                                <>
                                  {isUrl ? (
                                    <img src={mInfo.logo} alt={mInfo.name} className="w-3 h-3 object-contain" />
                                  ) : (
                                    <span>{mInfo.logo}</span>
                                  )}
                                  <span>{mInfo.name}</span>
                                </>
                              );
                            } catch (e) {
                              return aiModelUsed.split('/')[1] || aiModelUsed;
                            }
                          })()
                        )}
                        {!aiModelUsed && "Standard Analysis"}
                      </span>
                      <button 
                        onClick={() => setAiText("")}
                        className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Market Rates */}
              <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'}`}>
                <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-6 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Live Market Indicators
                </h3>
                <div className="space-y-4">
                  {[
                    { label: 'Gold (24K)', value: rates?.gold ? `EGP ${rates.gold.toLocaleString()}` : 'EGP 3,850', trend: '+1.2%', icon: <Sparkles className="w-3 h-3 text-yellow-500" /> },
                    { label: 'Silver (999)', value: rates?.silver ? `EGP ${rates.silver.toLocaleString()}` : 'EGP 48.50', trend: '-0.4%', icon: <Coins className="w-3 h-3 text-slate-400" /> },
                    { label: 'USD/EGP', value: rates?.usd ? `EGP ${rates.usd.toLocaleString()}` : 'EGP 48.15', trend: '+0.1%', icon: <Landmark className="w-3 h-3 text-blue-600" /> },
                  ].map((rate, i) => (
                    <div key={i} className={`flex items-center justify-between p-3 rounded-xl transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                      <div className="flex items-center gap-2">
                        {rate.icon}
                        <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{rate.label}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{rate.value}</span>
                        <span className={`text-[9px] font-black ${rate.trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {rate.trend}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}