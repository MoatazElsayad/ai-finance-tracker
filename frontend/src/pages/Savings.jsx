import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Landmark, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  ArrowUpRight, 
  Coins, 
  CircleDollarSign, 
  PieChart as PieChartIcon,
  ChevronRight,
  RefreshCw,
  History,
  Info,
  Wallet,
  Target,
  Trophy,
  AlertCircle,
  X,
  Calendar,
  DollarSign
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useTheme } from '../context/ThemeContext';
import { 
  getTransactions, 
  getCategories, 
  createTransaction, 
  initSavingsCategory,
  getCurrentUser,
  getSavingsData,
  getSavingsRates,
  createInvestment,
  deleteInvestment,
  updateSavingsGoal
} from '../api';
import confetti from 'canvas-confetti';

// --- Sub-components ---

const InvestmentModal = ({ isOpen, onClose, onAdd, type, isDark }) => {
  const [amount, setAmount] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [buyDate, setBuyDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    const numPrice = parseFloat(buyPrice);

    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }
    if (isNaN(numPrice) || numPrice <= 0) {
      setError('Please enter a valid buy price greater than 0');
      return;
    }

    onAdd({
      type,
      amount: numAmount,
      buy_price: numPrice,
      buy_date: buyDate
    });
    setAmount('');
    setBuyPrice('');
    setError('');
    onClose();
  };

  const isCurrency = ['USD', 'GBP', 'EUR'].includes(type);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-md card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'} p-8 animate-in zoom-in-95 duration-300 shadow-2xl border-2 ${isDark ? 'border-amber-500/20' : 'border-amber-400/20'}`}>
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-slate-500/10 rounded-full transition-colors">
          <X className="w-6 h-6" />
        </button>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-amber-500 rounded-2xl shadow-lg shadow-amber-500/20">
            {isCurrency ? <Landmark className="w-6 h-6 text-white" /> : <Coins className="w-6 h-6 text-white" />}
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tight">Add {type}</h3>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 text-rose-500" />
            <p className="text-xs font-bold text-rose-500">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
              {isCurrency ? 'Amount' : 'Grams'}
            </label>
            <input
              type="number"
              required
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={isCurrency ? "e.g. 500" : "e.g. 10.5"}
              className="input-unified w-full !py-4"
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Buy Price (EGP per {isCurrency ? 'unit' : 'gram'})</label>
            <input
              type="number"
              required
              step="0.01"
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              placeholder="e.g. 48.50"
              className="input-unified w-full !py-4"
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Purchase Date</label>
            <input
              type="date"
              required
              value={buyDate}
              onChange={(e) => setBuyDate(e.target.value)}
              className="input-unified w-full !py-4"
            />
          </div>
          <button type="submit" className="btn-primary-unified w-full !py-5 !rounded-2xl !bg-amber-500 hover:!bg-amber-600 shadow-xl shadow-amber-500/20 font-black uppercase tracking-widest">
            Confirm Purchase
          </button>
        </form>
      </div>
    </div>
  );
};

const SavingsHistory = ({ transactions, investments, isDark }) => {
  const allHistory = useMemo(() => {
    const txns = transactions.map(t => ({
      id: `t-${t.id}`,
      type: 'allocation',
      amount: Math.abs(t.amount),
      description: t.description,
      date: new Date(t.date),
      icon: <Wallet className="w-5 h-5 text-blue-500" />,
      color: 'blue'
    }));

    const invs = investments.map(i => ({
      id: `i-${i.id}`,
      type: 'investment',
      amount: i.amount,
      assetType: i.type,
      description: `Bought ${i.amount} ${['gold', 'silver'].includes(i.type.toLowerCase()) ? 'g' : ''} ${i.type}`,
      date: new Date(i.buy_date),
      icon: i.type.toLowerCase() === 'gold' ? <Coins className="w-5 h-5 text-amber-500" /> : <Landmark className="w-5 h-5 text-blue-500" />,
      color: 'amber'
    }));

    return [...txns, ...invs].sort((a, b) => b.date - a.date);
  }, [transactions, investments]);

  if (allHistory.length === 0) return (
    <div className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest">No history found</div>
  );

  return (
    <div className="divide-y divide-slate-700/10 max-h-[600px] overflow-y-auto no-scrollbar">
      {allHistory.map((item) => (
        <div key={item.id} className="p-6 flex items-center justify-between hover:bg-slate-500/5 transition-colors group">
          <div className="flex items-center gap-5">
            <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'} group-hover:scale-110 transition-transform`}>
              {item.icon}
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-tight">{item.description}</p>
              <p className="text-[10px] font-bold text-slate-500">{item.date.toLocaleDateString('en-EG', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-lg font-black ${item.color === 'blue' ? 'text-blue-500' : 'text-amber-500'}`}>
              {item.amount.toLocaleString()} {item.assetType || 'EGP'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

// --- Main Page ---

const Savings = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [ratesOutdated, setRatesOutdated] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [savingsData, setSavingsData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [monthlyInput, setMonthlyInput] = useState('');
  const [monthlyGoalInput, setMonthlyGoalInput] = useState('');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);
  const [selectedInvestmentType, setSelectedInvestmentType] = useState(null);
  const [activeTab, setActiveTab] = useState('cash');

  useEffect(() => {
    loadAllData();
    // Refresh every hour
    const interval = setInterval(loadAllData, 3600000);
    return () => clearInterval(interval);
  }, []);

  const loadAllData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else if (!savingsData) setLoading(true);
    
    setError(null);
    try {
      // Fetch rates first or in parallel
      // For manual refresh, we force the backend to bypass its 8-hour cache
      const [cats, data, txns, ratesResp] = await Promise.all([
        getCategories(),
        getSavingsData(),
        getTransactions(),
        getSavingsRates(isManual) // isManual true adds ?force=true
      ]);
      
      setCategories(cats);
      setSavingsData({ ...data, rates: ratesResp });
      setAllTransactions(txns || []);
      
      if (ratesResp.last_updated) {
        const updateTime = new Date(ratesResp.last_updated);
        setLastUpdated(updateTime);
        // If rates are older than 8.5 hours (cached logic is 8h), mark as outdated
        const diffHours = (new Date() - updateTime) / (1000 * 60 * 60);
        setRatesOutdated(diffHours > 8.5);
      }
      
      if (data.monthly_goal) setMonthlyGoalInput(data.monthly_goal.toString());
    } catch (err) {
      console.error("Failed to load savings data", err);
      setError("Unable to connect to your vault. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const totalInvestmentsValue = useMemo(() => {
    if (!savingsData) return 0;
    return savingsData.investments.reduce((sum, inv) => sum + inv.current_value, 0);
  }, [savingsData]);

  const totalOverallSavings = (savingsData?.cash_balance || 0) + totalInvestmentsValue;

  const savingsTransactions = useMemo(() => {
    return allTransactions.filter(t => 
      t.category_name?.toLowerCase().includes('savings') || 
      t.description?.toLowerCase().includes('savings allocation')
    );
  }, [allTransactions]);

  const [displaySavings, setDisplaySavings] = useState(0);
  useEffect(() => {
    let start = displaySavings;
    const end = totalOverallSavings;
    const duration = 1500;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const currentCount = Math.floor(start + (end - start) * easeProgress);
      setDisplaySavings(currentCount);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [totalOverallSavings]);

  const handleMonthlySavingsSubmit = async (e) => {
    e.preventDefault();
    if (!monthlyInput || isNaN(monthlyInput)) return;

    const amount = parseFloat(monthlyInput);
    let savingsCat = categories.find(c => c.name?.toLowerCase().includes('savings'));
    
    if (!savingsCat) {
      try {
        const newCat = await initSavingsCategory();
        savingsCat = newCat;
      } catch (err) {
        console.error("Failed to init savings category", err);
        return;
      }
    }

    try {
      await createTransaction(
        savingsCat.id,
        -amount,
        "Monthly savings allocation",
        new Date().toISOString().split('T')[0]
      );
      
      // Milestone celebration
      if (Math.floor(totalOverallSavings / 5000) < Math.floor((totalOverallSavings + amount) / 5000)) {
        confetti({
          particleCount: 200,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#3b82f6', '#fbbf24', '#ffffff']
        });
      }

      setMonthlyInput('');
      loadAllData();
    } catch (err) {
      console.error("Failed to add savings", err);
    }
  };

  const handleAddInvestment = async (investmentData) => {
    try {
      await createInvestment(investmentData);
      loadAllData();
      confetti({ particleCount: 100, spread: 50, origin: { y: 0.8 } });
    } catch (err) {
      console.error("Failed to add investment", err);
      setError("Failed to secure asset. Please verify your input.");
    }
  };

  const handleDeleteInvestment = async (id) => {
    if (!window.confirm("Are you sure you want to remove this asset from your vault?")) return;
    try {
      await deleteInvestment(id);
      loadAllData();
    } catch (err) {
      console.error("Failed to delete investment", err);
      setError("Failed to remove asset. Please try again.");
    }
  };

  const handleUpdateGoal = async (e) => {
    e.preventDefault();
    try {
      await updateSavingsGoal(monthlyGoalInput);
      setShowGoalModal(false);
      loadAllData();
    } catch (err) {
      console.error("Failed to update goal", err);
    }
  };

  if (loading && !savingsData) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0a0f1d]' : 'bg-slate-50'}`}>
        <div className="flex flex-col items-center gap-6">
          <RefreshCw className="w-16 h-16 text-amber-500 animate-spin" />
          <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-500 animate-pulse">Building Financial Fortress...</p>
        </div>
      </div>
    );
  }

  if (error && !savingsData) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0a0f1d]' : 'bg-slate-50'}`}>
        <div className="flex flex-col items-center gap-6 max-w-md text-center px-6">
          <div className="p-6 bg-rose-500/10 rounded-full">
            <AlertCircle className="w-16 h-16 text-rose-500" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight">Security Protocol Breach</h2>
          <p className="text-slate-500 font-bold leading-relaxed">{error}</p>
          <button 
            onClick={loadAllData}
            className="btn-primary-unified !py-4 !px-10 !rounded-2xl !bg-rose-500 hover:!bg-rose-600 shadow-xl shadow-rose-500/20 font-black uppercase tracking-widest text-xs"
          >
            Retry Authentication
          </button>
        </div>
      </div>
    );
  }

  const rates = savingsData?.rates || {};
  const monthlyGoal = savingsData?.monthly_goal || 1;
  const monthlySaved = savingsData?.monthly_saved || 0;
  const progressPercent = Math.min(100, (monthlySaved / monthlyGoal) * 100);

  return (
    <div className={`min-h-screen pb-20 ${isDark ? 'bg-[#0a0e27] text-white' : 'bg-slate-50 text-slate-900'} transition-colors duration-500`}>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1e3a8a] to-[#0f172a] pt-16 pb-28 px-6 md:px-12 rounded-b-[4rem] shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full -mr-48 -mt-48 blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-400/5 rounded-full -ml-32 -mb-32 blur-[100px]" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-12">
            <div className="animate-in fade-in slide-in-from-left-8 duration-1000">
              <div className="flex items-center gap-4 mb-4">
                <p className="text-blue-400 font-black uppercase tracking-[0.4em] text-[10px]">Portfolio Overview</p>
                {lastUpdated && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full animate-pulse">
                    <AlertCircle className="w-3 h-3 text-amber-500" />
                    <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">
                      {ratesOutdated 
                        ? `Rates from ${Math.floor((new Date() - lastUpdated) / (1000 * 60 * 60))}h ago` 
                        : `Rates updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    </span>
                  </div>
                )}
              </div>
              
              <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter mb-6">
                Total <span className="text-amber-400">Wealth</span>
              </h1>
              
              <div className="flex items-center gap-6">
                <div className="flex items-baseline gap-4">
                  <span className="text-7xl md:text-9xl font-black text-white drop-shadow-2xl">
                    {displaySavings.toLocaleString()}
                  </span>
                  <span className="text-3xl md:text-4xl font-black text-blue-400/80">EGP</span>
                </div>
                
                <button 
                  onClick={() => loadAllData(true)}
                  disabled={refreshing}
                  className={`p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-95 group ${refreshing ? 'cursor-not-allowed opacity-50' : ''}`}
                  title="Refresh Market Rates"
                >
                  <RefreshCw className={`w-8 h-8 text-amber-400 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
                </button>
              </div>
              
              {refreshing && (
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 mt-4 animate-pulse">
                  Syncing with Global Markets...
                </p>
              )}
            </div>
            
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-8 duration-1000 delay-200">
              <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[3rem] shadow-2xl min-w-[280px]">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-emerald-500/20 rounded-2xl">
                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                  </div>
                  <span className="text-blue-200 font-black uppercase tracking-widest text-[10px]">Net Growth</span>
                </div>
                <p className="text-4xl font-black text-white">+{(totalOverallSavings * 0.05).toLocaleString()} <span className="text-sm font-bold text-emerald-400">+5.2%</span></p>
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-300/50 mt-2">Estimated Monthly Increase</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 -mt-16 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Input and Goal */}
          <div className="lg:col-span-4 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            {/* Monthly Allocation */}
            <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'} p-8 shadow-2xl overflow-hidden relative`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-2xl" />
              
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/30">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-black tracking-tight uppercase">Monthly Allocation</h3>
                </div>
                <button onClick={() => setShowGoalModal(true)} className="p-2 hover:bg-slate-500/10 rounded-xl transition-colors">
                  <Target className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              
              <form onSubmit={handleMonthlySavingsSubmit} className="space-y-6">
                <div>
                  <div className="relative">
                    <input
                      type="number"
                      value={monthlyInput}
                      onChange={(e) => setMonthlyInput(e.target.value)}
                      placeholder="Amount to save..."
                      className="input-unified w-full !pl-16 !py-5 !rounded-[2rem] text-2xl font-black"
                    />
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-black text-slate-400">EGP</span>
                  </div>
                </div>
                <button 
                  type="submit"
                  className="btn-primary-unified w-full !py-5 !rounded-[2rem] !bg-blue-600 hover:!bg-blue-700 shadow-xl shadow-blue-600/20 group overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                  <span className="font-black uppercase tracking-[0.2em] text-xs">Allocate Savings</span>
                </button>
              </form>

              <div className="mt-10 p-8 bg-slate-500/5 rounded-[2.5rem] border border-slate-500/10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Target Progress</span>
                    <span className="text-2xl font-black text-blue-500">{progressPercent.toFixed(1)}%</span>
                  </div>
                  <div className="relative w-20 h-20">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-200 dark:text-slate-800" />
                      <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={213.6} strokeDashoffset={213.6 - (213.6 * progressPercent) / 100} strokeLinecap="round" className="text-blue-500 transition-all duration-1000 ease-out" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Target className="w-6 h-6 text-blue-500 opacity-30" />
                    </div>
                  </div>
                </div>
                
                <p className="text-[10px] font-black text-slate-500 text-center uppercase tracking-widest leading-relaxed">
                  Saved <span className="text-blue-500">{monthlySaved.toLocaleString()}</span> of {monthlyGoal.toLocaleString()} EGP goal
                </p>
              </div>
            </div>

            {/* Quick Investment Access */}
            <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'} p-8`}>
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 mb-8">Vault Quick-Add</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { type: 'Gold', icon: <Coins className="w-6 h-6 text-amber-500" /> },
                  { type: 'Silver', icon: <Coins className="w-6 h-6 text-slate-400" /> },
                  { type: 'USD', icon: <Landmark className="w-6 h-6 text-blue-500" /> },
                  { type: 'EUR', icon: <Landmark className="w-6 h-6 text-indigo-500" /> }
                ].map((item) => (
                  <button 
                    key={item.type}
                    onClick={() => {
                      setSelectedInvestmentType(item.type);
                      setShowInvestmentModal(true);
                    }}
                    className={`flex flex-col items-center gap-4 p-6 rounded-[2rem] border-2 transition-all duration-500 group ${
                      isDark ? 'bg-slate-800/40 border-slate-700/50 hover:border-amber-500/50 hover:bg-slate-800' : 'bg-white border-slate-100 hover:border-amber-400'
                    }`}
                  >
                    <div className="p-4 bg-slate-500/5 rounded-2xl group-hover:scale-110 group-hover:bg-amber-500/10 transition-all duration-500">
                      {item.icon}
                    </div>
                    <span className="font-black uppercase tracking-widest text-[10px]">{item.type}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Portfolio & History */}
          <div className="lg:col-span-8 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-400">
            {/* Navigation Tabs */}
            <div className={`flex items-center gap-3 p-3 ${isDark ? 'bg-slate-800/40' : 'bg-white'} backdrop-blur-2xl rounded-[2.5rem] border-2 ${isDark ? 'border-slate-700/50' : 'border-slate-200'} shadow-xl overflow-x-auto no-scrollbar`}>
              {[
                { id: 'cash', label: 'Cash Vault', icon: Wallet },
                { id: 'gold', label: 'Gold Vault', icon: Coins },
                { id: 'silver', label: 'Silver Vault', icon: Coins },
                { id: 'currencies', label: 'FX Assets', icon: Landmark }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-8 py-4 rounded-full font-black text-xs uppercase tracking-[0.2em] transition-all duration-500 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-amber-500 text-white shadow-xl shadow-amber-500/30 scale-105'
                      : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700/50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Stats Card */}
              <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'} p-8 min-h-[450px] flex flex-col`}>
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-2xl font-black tracking-tight uppercase">{activeTab === 'cash' ? 'Growth Trend' : 'Breakdown'}</h3>
                  <div className="p-4 bg-amber-500/10 rounded-2xl">
                    <PieChartIcon className="w-8 h-8 text-amber-500" />
                  </div>
                </div>

                <div className="flex-1 min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    {activeTab === 'cash' ? (
                      <AreaChart data={[
                        { date: '1 Jan', val: 5000 },
                        { date: '15 Jan', val: 12000 },
                        { date: '1 Feb', val: 18000 },
                        { date: 'Today', val: totalOverallSavings },
                      ]}>
                        <defs>
                          <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#e2e8f0'} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 'bold'}} dy={10} />
                        <YAxis hide />
                        <Tooltip contentStyle={{ backgroundColor: isDark ? '#0f172a' : '#fff', borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.5)' }} />
                        <Area type="monotone" dataKey="val" stroke="#3b82f6" strokeWidth={5} fillOpacity={1} fill="url(#colorVal)" />
                      </AreaChart>
                    ) : (
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Cash', value: savingsData?.cash_balance || 0 },
                            { name: 'Assets', value: totalInvestmentsValue }
                          ]}
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={10}
                          dataKey="value"
                          stroke="none"
                        >
                          <Cell fill="#3b82f6" />
                          <Cell fill="#fbbf24" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    )}
                  </ResponsiveContainer>
                </div>

                <div className="flex justify-center gap-10 mt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-blue-600 shadow-lg shadow-blue-600/20" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Cash Vault</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-amber-500 shadow-lg shadow-amber-500/20" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Assets Vault</span>
                  </div>
                </div>
              </div>

              {/* Rate Card / Asset Info */}
              <div className="space-y-8">
                {activeTab !== 'cash' && rates && (
                  <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'} p-8 relative overflow-hidden group`}>
                    <div className="absolute -right-12 -bottom-12 w-48 h-48 opacity-5 group-hover:scale-125 transition-transform duration-1000">
                      {activeTab === 'currencies' ? <Landmark className="w-full h-full" /> : <Coins className="w-full h-full" />}
                    </div>
                    <div className="flex items-center justify-between mb-8">
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Real-time Index</span>
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black ${rates.changes?.[activeTab === 'currencies' ? 'usd' : activeTab] >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        {rates.changes?.[activeTab === 'currencies' ? 'usd' : activeTab] >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {Math.abs(rates.changes?.[activeTab === 'currencies' ? 'usd' : activeTab] || 0)}%
                      </div>
                    </div>
                    <h3 className="text-5xl font-black mb-3">
                      {(rates[activeTab === 'currencies' ? 'usd' : activeTab] || 0).toLocaleString()} 
                      <span className="text-sm font-bold text-slate-500 ml-3">EGP / {activeTab === 'currencies' ? 'USD' : 'g'}</span>
                    </h3>
                    {activeTab === 'currencies' && (
                      <div className="flex gap-4 mt-4">
                        {['EUR', 'GBP'].map(sym => (
                          <div key={sym} className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-slate-500">{sym}</span>
                            <span className="text-sm font-black text-amber-500">{(rates[sym.toLowerCase()] || 0).toLocaleString()} EGP</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 mt-4">Market Price Refreshed Recently</p>
                  </div>
                )}

                <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'} p-8`}>
                   <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black uppercase tracking-tight">Financial History</h3>
                    <button 
                      onClick={() => setShowHistory(!showHistory)}
                      className={`p-3 rounded-2xl transition-all duration-500 ${showHistory ? 'bg-amber-500 text-white' : 'bg-slate-500/10 text-slate-400 hover:text-amber-500'}`}
                    >
                      <History className="w-6 h-6" />
                    </button>
                  </div>
                  {showHistory ? (
                    <SavingsHistory 
                      transactions={savingsTransactions} 
                      investments={savingsData?.investments || []}
                      isDark={isDark}
                    />
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-6 rounded-3xl bg-slate-500/5 border border-slate-500/10">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Total Assets</p>
                          <p className="text-2xl font-black">{totalInvestmentsValue.toLocaleString()} EGP</p>
                        </div>
                        <PieChartIcon className="w-10 h-10 text-amber-500/20" />
                      </div>
                      <div className="flex items-center justify-between p-6 rounded-3xl bg-slate-500/5 border border-slate-500/10">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Cash Balance</p>
                          <p className="text-2xl font-black">{(savingsData?.cash_balance || 0).toLocaleString()} EGP</p>
                        </div>
                        <Wallet className="w-10 h-10 text-blue-500/20" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Asset List Detail */}
            {activeTab !== 'cash' && (
              <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'} p-0 overflow-hidden animate-in fade-in duration-1000`}>
                <div className="p-10 border-b border-slate-700/10 flex items-center justify-between bg-slate-500/5">
                  <h3 className="text-2xl font-black tracking-tight uppercase">Current {activeTab} Holdings</h3>
                  <div className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </div>
                </div>
                <div className="divide-y divide-slate-700/10">
                  {savingsData?.investments
                    .filter(inv => activeTab === 'currencies' ? ['usd', 'eur', 'gbp'].includes(inv.type.toLowerCase()) : inv.type.toLowerCase() === activeTab)
                    .map((inv) => {
                      const profit = inv.current_value - (inv.buy_price * inv.amount);
                      const isProfit = profit >= 0;
                      return (
                        <div key={inv.id} className="p-10 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-500/5 transition-all duration-500 group">
                          <div className="flex items-center gap-8 mb-6 md:mb-0">
                            <div className={`p-5 rounded-3xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'} group-hover:scale-110 group-hover:bg-amber-500/10 transition-all duration-500`}>
                              {inv.type.toLowerCase() === 'gold' ? <Coins className="w-8 h-8 text-amber-500" /> : <Landmark className="w-8 h-8 text-blue-500" />}
                            </div>
                            <div>
                              <p className="text-2xl font-black uppercase tracking-tight mb-1">{inv.amount} {['gold', 'silver'].includes(inv.type.toLowerCase()) ? 'grams' : inv.type}</p>
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Buy: {inv.buy_price.toLocaleString()} EGP</span>
                                <div className="w-1 h-1 rounded-full bg-slate-700" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{new Date(inv.buy_date).toLocaleDateString('en-EG')}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col md:flex-row md:items-center gap-12">
                            <div className="text-right">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Live Value</p>
                              <p className="text-2xl font-black text-white">
                                {inv.current_value.toLocaleString()} <span className="text-xs text-slate-500">EGP</span>
                              </p>
                            </div>
                            
                            <div className="text-right min-w-[140px]">
                              <div className="flex items-center justify-end gap-3 mb-1">
                                {isProfit ? <TrendingUp className="w-5 h-5 text-emerald-500" /> : <TrendingDown className="w-5 h-5 text-rose-500" />}
                                <p className={`text-2xl font-black ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                                  {isProfit ? '+' : ''}{profit.toLocaleString()} <span className="text-xs">EGP</span>
                                </p>
                              </div>
                              <p className={`text-[10px] font-black uppercase tracking-widest ${isProfit ? 'text-emerald-500/60' : 'text-rose-500/60'}`}>
                                {isProfit ? 'Profit' : 'Loss'}: {((profit / (inv.buy_price * inv.amount)) * 100).toFixed(2)}%
                              </p>
                            </div>

                            <button 
                              onClick={() => handleDeleteInvestment(inv.id)}
                              className="p-3 rounded-xl bg-rose-500/10 text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white"
                              title="Delete Investment"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  {savingsData?.investments.filter(inv => activeTab === 'currencies' ? ['usd', 'eur', 'gbp'].includes(inv.type.toLowerCase()) : inv.type.toLowerCase() === activeTab).length === 0 && (
                    <div className="p-32 text-center">
                      <div className="p-8 bg-slate-500/5 rounded-[3rem] w-24 h-24 flex items-center justify-center mx-auto mb-8">
                        <Info className="w-12 h-12 text-slate-500" />
                      </div>
                      <p className="text-xl font-black text-slate-500 uppercase tracking-[0.2em] mb-4">No holdings detected</p>
                      <button 
                        onClick={() => {
                          setSelectedInvestmentType(activeTab === 'currencies' ? 'USD' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1));
                          setShowInvestmentModal(true);
                        }}
                        className="btn-primary-unified !py-4 !px-10 !rounded-2xl !bg-amber-500/10 !text-amber-500 hover:!bg-amber-500 hover:!text-white border-2 border-amber-500/20 transition-all font-black uppercase tracking-widest text-xs"
                      >
                        Secure your first asset
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <InvestmentModal 
        isOpen={showInvestmentModal}
        onClose={() => setShowInvestmentModal(false)}
        onAdd={handleAddInvestment}
        type={selectedInvestmentType}
        isDark={isDark}
      />

      {/* Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowGoalModal(false)} />
          <div className={`relative w-full max-w-md card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'} p-10 animate-in zoom-in-95 duration-300 shadow-2xl border-2 ${isDark ? 'border-blue-500/20' : 'border-blue-400/20'}`}>
            <button onClick={() => setShowGoalModal(false)} className="absolute top-8 right-8 p-2 hover:bg-slate-500/10 rounded-full transition-colors">
              <X className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-5 mb-10">
              <div className="p-4 bg-blue-600 rounded-3xl shadow-xl shadow-blue-600/20">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-black uppercase tracking-tight">Set Monthly Goal</h3>
            </div>
            <form onSubmit={handleUpdateGoal} className="space-y-8">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4">Target Amount (EGP)</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    value={monthlyGoalInput}
                    onChange={(e) => setMonthlyGoalInput(e.target.value)}
                    placeholder="e.g. 5000"
                    className="input-unified w-full !py-6 !pl-20 !text-3xl !rounded-3xl font-black"
                  />
                  <span className="absolute left-8 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400">EGP</span>
                </div>
              </div>
              <button type="submit" className="btn-primary-unified w-full !py-6 !rounded-3xl !bg-blue-600 hover:!bg-blue-700 shadow-2xl shadow-blue-600/30 font-black uppercase tracking-[0.2em] text-sm">
                Lock in Goal
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Savings;