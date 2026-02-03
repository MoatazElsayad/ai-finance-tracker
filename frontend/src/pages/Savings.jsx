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
      setError('Enter a valid amount');
      return;
    }
    if (isNaN(numPrice) || numPrice <= 0) {
      setError('Enter a valid price');
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
    onClose();
  };

  const isCurrency = ['USD', 'GBP', 'EUR'].includes(type);
  const flagMap = {
    'USD': '🇺🇸',
    'EUR': '🇪🇺',
    'GBP': '🇬🇧',
    'Gold': '🪙',
    'Silver': '🥈'
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-slate-950/40">
      <div className="absolute inset-0" onClick={onClose} />
      <div className={`relative w-full max-w-md ${isDark ? 'bg-slate-900 border-slate-700/50' : 'bg-white border-slate-200'} border p-8 rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300`}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-2xl border border-amber-500/20">
              {flagMap[type] || '💰'}
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight">Secure {type}</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Vault Acquisition</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-500/10 rounded-xl transition-colors text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <p className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">
              {isCurrency ? 'Units' : 'Grams'}
            </label>
            <input
              type="number"
              required
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={isCurrency ? "e.g. 500" : "e.g. 10.5"}
              className={`w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-6 py-4 focus:outline-none focus:border-amber-500/50 transition-all font-bold text-lg`}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Buy Price (EGP)</label>
            <input
              type="number"
              required
              step="0.01"
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              placeholder="Price per unit/gram"
              className={`w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-6 py-4 focus:outline-none focus:border-amber-500/50 transition-all font-bold text-lg`}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Acquisition Date</label>
            <input
              type="date"
              required
              value={buyDate}
              onChange={(e) => setBuyDate(e.target.value)}
              className={`w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-6 py-4 focus:outline-none focus:border-amber-500/50 transition-all font-bold`}
            />
          </div>
          <button type="submit" className="w-full py-5 bg-amber-500 hover:bg-amber-600 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-amber-500/20 transition-all active:scale-95">
            Lock into Vault
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
      description: `Bought ${i.amount}${['gold', 'silver'].includes(i.type.toLowerCase()) ? 'g' : ''} ${i.type}`,
      date: new Date(i.buy_date),
      icon: i.type.toLowerCase() === 'gold' ? <Coins className="w-5 h-5 text-amber-500" /> : <Landmark className="w-5 h-5 text-blue-500" />,
      color: 'amber'
    }));

    return [...txns, ...invs].sort((a, b) => b.date - a.date);
  }, [transactions, investments]);

  if (allHistory.length === 0) return (
    <div className="py-20 text-center text-slate-500 font-black uppercase tracking-[0.4em] text-[10px]">Vault History Empty</div>
  );

  return (
    <div className="space-y-4 max-h-[500px] overflow-y-auto no-scrollbar pr-2">
      {allHistory.map((item) => (
        <div key={item.id} className={`flex items-center justify-between p-6 rounded-3xl ${isDark ? 'bg-slate-800/30 border-slate-700/30' : 'bg-slate-50 border-slate-200'} border group hover:border-amber-500/30 transition-all duration-300`}>
          <div className="flex items-center gap-5">
            <div className={`w-12 h-12 rounded-2xl ${isDark ? 'bg-slate-900' : 'bg-white'} border border-slate-700/50 flex items-center justify-center group-hover:scale-110 transition-transform`}>
              {item.icon}
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight mb-1">{item.description}</p>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.date.toLocaleDateString('en-EG', { day: 'numeric', month: 'short' })}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-lg font-black ${item.color === 'blue' ? 'text-blue-500' : 'text-amber-500'}`}>
              {item.amount.toLocaleString()} <span className="text-[10px] uppercase opacity-60 ml-1">{item.assetType || 'EGP'}</span>
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
    // Refresh every 1 hour as requested
    const interval = setInterval(() => {
      loadAllData(true); // isManual=true to force fresh rates
    }, 3600000);
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

  const rates = useMemo(() => {
    return savingsData?.rates || {
      gold: 0,
      silver: 0,
      usd: 0,
      eur: 0,
      gbp: 0,
      egp: 1.0
    };
  }, [savingsData]);

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

  const monthlyGoal = savingsData?.monthly_goal || 1;
  const monthlySaved = savingsData?.monthly_saved || 0;
  const progressPercent = Math.min(100, (monthlySaved / monthlyGoal) * 100);

  return (
    <div className={`min-h-screen pb-24 ${isDark ? 'bg-[#0f172a] text-slate-200' : 'bg-slate-50 text-slate-900'} transition-colors duration-700`}>
      {/* Hero Section - Total Wealth */}
      <div className="relative pt-24 pb-32 px-6 overflow-hidden">
        {/* Abstract Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-96 bg-blue-600/10 blur-[120px] rounded-full -mt-48 pointer-events-none" />
        <div className="absolute top-48 right-0 w-96 h-96 bg-amber-500/5 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/40 border border-slate-700/50 mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Vault Total Balance</span>
          </div>

          <h1 className="text-sm font-black uppercase tracking-[0.5em] text-slate-500 mb-4">Net Liquidity & Assets</h1>
          
          <div className="relative inline-block group">
            {/* Animated Number with Glow */}
            <div className="flex items-baseline justify-center gap-4 mb-2">
              <span className="text-8xl md:text-[10rem] font-black tracking-tighter text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.1)] group-hover:drop-shadow-[0_0_50px_rgba(59,130,246,0.3)] transition-all duration-700">
                {displaySavings.toLocaleString()}
              </span>
              <span className="text-3xl md:text-5xl font-black text-blue-500/80 tracking-tight">EGP</span>
            </div>
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-amber-500/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-1000" />
          </div>

          <div className="mt-8 flex items-center justify-center gap-8">
            <div className="flex flex-col items-center">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Live Market Index</p>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-emerald-500">+5.2%</span>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <button 
              onClick={() => loadAllData(true)}
              className="group flex flex-col items-center"
            >
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 group-hover:text-amber-500 transition-colors">Sync Vault</p>
              <RefreshCw className={`w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-all ${refreshing ? 'animate-spin text-amber-500' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 -mt-12 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Actions & Summary */}
          <div className="lg:col-span-4 space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000">
            
            {/* Cash Allocation Card */}
            <div className={`p-8 rounded-[2.5rem] ${isDark ? 'bg-slate-900/80 border-slate-700/50' : 'bg-white border-slate-200'} border shadow-2xl backdrop-blur-xl group`}>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20">
                    <Wallet className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold tracking-tight">Cash Vault</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Monthly Allocation</p>
                  </div>
                </div>
                <button onClick={() => setShowGoalModal(true)} className="p-2 hover:bg-slate-500/10 rounded-xl transition-colors">
                  <Target className="w-5 h-5 text-slate-500 hover:text-amber-500 transition-colors" />
                </button>
              </div>

              <form onSubmit={handleMonthlySavingsSubmit} className="space-y-6">
                <div className="relative group">
                  <input
                    type="number"
                    value={monthlyInput}
                    onChange={(e) => setMonthlyInput(e.target.value)}
                    placeholder="EGP to Secure..."
                    className={`w-full bg-slate-800/30 border-2 border-slate-700/30 rounded-2xl px-6 py-5 focus:outline-none focus:border-blue-500/50 transition-all font-black text-2xl placeholder:text-slate-600`}
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-black text-slate-500">EGP</div>
                </div>
                <button 
                  type="submit"
                  className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                  Allocate to Savings
                </button>
              </form>

              {/* Progress Minimal */}
              <div className="mt-10 pt-10 border-t border-slate-800/50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Monthly Goal Progress</p>
                    <p className="text-2xl font-black">{progressPercent.toFixed(0)}% <span className="text-[10px] text-slate-500 font-bold uppercase ml-2">Complete</span></p>
                  </div>
                  <div className="relative w-16 h-16">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-800" />
                      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={175.9} strokeDashoffset={175.9 - (175.9 * progressPercent) / 100} strokeLinecap="round" className="text-blue-500 transition-all duration-1000" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                    </div>
                  </div>
                </div>
                <p className="text-[11px] font-bold text-slate-500">
                  <span className="text-white">{monthlySaved.toLocaleString()}</span> / {monthlyGoal.toLocaleString()} EGP target
                </p>
              </div>
            </div>

            {/* Portfolio Summary Minimal */}
            <div className={`p-8 rounded-[2.5rem] ${isDark ? 'bg-slate-900/80 border-slate-700/50' : 'bg-white border-slate-200'} border shadow-2xl`}>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-bold tracking-tight">Portfolio Alpha</h3>
                <button 
                  onClick={() => setShowHistory(!showHistory)}
                  className={`p-2 rounded-xl transition-all duration-300 ${showHistory ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-amber-500'}`}
                >
                  <History className="w-5 h-5" />
                </button>
              </div>
              
              {showHistory ? (
                <SavingsHistory 
                  transactions={savingsTransactions} 
                  investments={savingsData?.investments || []}
                  isDark={isDark}
                />
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-6 rounded-3xl bg-slate-800/30 border border-slate-700/30">
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Asset Valuation</p>
                      <p className="text-xl font-black">{totalInvestmentsValue.toLocaleString()} <span className="text-[10px] text-slate-500">EGP</span></p>
                    </div>
                    <PieChartIcon className="w-8 h-8 text-amber-500/20" />
                  </div>
                  <div className="flex items-center justify-between p-6 rounded-3xl bg-slate-800/30 border border-slate-700/30">
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Cash Reserve</p>
                      <p className="text-xl font-black">{(savingsData?.cash_balance || 0).toLocaleString()} <span className="text-[10px] text-slate-500">EGP</span></p>
                    </div>
                    <Wallet className="w-8 h-8 text-blue-500/20" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Growth & Asset Vaults */}
          <div className="lg:col-span-8 space-y-8 animate-in fade-in slide-in-from-right-8 duration-1000">
            
            {/* Asset Tabs Minimal */}
            <div className={`flex items-center gap-2 p-2 rounded-[2rem] ${isDark ? 'bg-slate-900/80 border-slate-700/50' : 'bg-white'} border shadow-xl backdrop-blur-xl overflow-x-auto no-scrollbar`}>
              {[
                { id: 'cash', label: 'Cash', emoji: '💵' },
                { id: 'gold', label: 'Gold', emoji: '🪙' },
                { id: 'silver', label: 'Silver', emoji: '🥈' },
                { id: 'currencies', label: 'Forex', emoji: '🌍' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-500 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20 scale-105'
                      : 'text-slate-500 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span className="text-lg">{tab.emoji}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Growth Trend - Premium Chart */}
            <div className={`p-10 rounded-[2.5rem] ${isDark ? 'bg-slate-900/80 border-slate-700/50' : 'bg-white border-slate-200'} border shadow-2xl relative overflow-hidden group`}>
              <div className="flex items-center justify-between mb-12">
                <div>
                  <h3 className="text-xl font-bold tracking-tight">Growth Trajectory</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Wealth Accumulation Trend</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <TrendingUp className="w-6 h-6 text-blue-500" />
                </div>
              </div>

              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { date: 'Q1', val: (totalOverallSavings * 0.65) },
                    { date: 'Q2', val: (totalOverallSavings * 0.82) },
                    { date: 'Q3', val: (totalOverallSavings * 0.94) },
                    { date: 'Live', val: totalOverallSavings },
                  ]}>
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#64748b', fontSize: 10, fontWeight: '900'}} 
                      dy={15} 
                    />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0f172a', 
                        borderRadius: '1.5rem', 
                        border: '1px solid #334155', 
                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)',
                        padding: '1.5rem'
                      }} 
                      itemStyle={{ color: '#fff', fontWeight: '900', fontSize: '1.1rem' }}
                      cursor={{ stroke: '#3b82f6', strokeWidth: 2 }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="val" 
                      stroke="#3b82f6" 
                      strokeWidth={5} 
                      fillOpacity={1} 
                      fill="url(#chartGradient)" 
                      animationDuration={2500}
                      dot={{ r: 6, fill: '#3b82f6', strokeWidth: 3, stroke: '#0f172a' }}
                      activeDot={{ r: 8, fill: '#fff', strokeWidth: 3, stroke: '#3b82f6' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick-Add Grid - Modern Minimal */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { type: 'Gold', label: '24K Gold', emoji: '🪙', color: 'amber', rate: rates.gold },
                { type: 'Silver', label: 'Pure Silver', emoji: '🥈', color: 'slate', rate: rates.silver },
                { type: 'USD', label: 'USD 🇺🇸', emoji: '💵', color: 'blue', rate: rates.usd },
                { type: 'EUR', label: 'EUR 🇪🇺', emoji: '💶', color: 'indigo', rate: rates.eur }
              ].map((item) => (
                <button 
                  key={item.type}
                  onClick={() => {
                    setSelectedInvestmentType(item.type);
                    setShowInvestmentModal(true);
                  }}
                  className={`relative p-8 rounded-[2.5rem] ${isDark ? 'bg-slate-900/80 border-slate-700/50' : 'bg-white border-slate-200'} border group transition-all duration-500 hover:-translate-y-2 hover:border-amber-500/50 hover:shadow-2xl hover:shadow-amber-500/10 overflow-hidden`}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="text-4xl mb-6 transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">{item.emoji}</div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">{item.label}</p>
                  <p className="text-lg font-black text-white group-hover:text-amber-500 transition-colors">
                    {item.rate?.toLocaleString()} <span className="text-[10px] text-slate-500">EGP</span>
                  </p>
                </button>
              ))}
            </div>

            {/* Detailed Asset Vault List */}
            {activeTab !== 'cash' && (
              <div className={`rounded-[2.5rem] overflow-hidden ${isDark ? 'bg-slate-900/80 border-slate-700/50' : 'bg-white border-slate-200'} border shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700`}>
                <div className="p-10 border-b border-slate-800/50 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                      <Landmark className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold tracking-tight uppercase">{activeTab} Holdings</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Live Asset Valuation</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Market Open</span>
                  </div>
                </div>

                <div className="divide-y divide-slate-800/50">
                  {savingsData?.investments
                    .filter(inv => activeTab === 'currencies' ? ['usd', 'eur', 'gbp'].includes(inv.type.toLowerCase()) : inv.type.toLowerCase() === activeTab)
                    .map((inv) => {
                      const profit = inv.current_value - (inv.buy_price * inv.amount);
                      const isProfit = profit >= 0;
                      const flag = inv.type.toLowerCase() === 'usd' ? '🇺🇸' : inv.type.toLowerCase() === 'eur' ? '🇪🇺' : inv.type.toLowerCase() === 'gbp' ? '🇬🇧' : '';
                      
                      return (
                        <div key={inv.id} className="p-10 flex flex-col md:flex-row md:items-center justify-between group hover:bg-slate-800/20 transition-all duration-300">
                          <div className="flex items-center gap-8 mb-6 md:mb-0">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-slate-800 flex items-center justify-center text-3xl border border-slate-700 group-hover:scale-110 group-hover:border-amber-500/30 transition-all duration-500 shadow-xl">
                              {inv.type.toLowerCase() === 'gold' ? '🪙' : inv.type.toLowerCase() === 'silver' ? '🥈' : flag || '💵'}
                            </div>
                            <div>
                              <p className="text-xl font-black mb-1">
                                {inv.amount.toLocaleString()} {['gold', 'silver'].includes(inv.type.toLowerCase()) ? 'Grams' : inv.type} {flag}
                              </p>
                              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                <span>Buy @ {inv.buy_price.toLocaleString()}</span>
                                <div className="w-1 h-1 rounded-full bg-slate-700" />
                                <span>{new Date(inv.buy_date).toLocaleDateString('en-EG', { day: '2-digit', month: 'short' })}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-12">
                            <div className="text-right">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Live Value</p>
                              <p className="text-2xl font-black text-white">{inv.current_value.toLocaleString()} <span className="text-[10px] text-slate-500">EGP</span></p>
                            </div>
                            <div className="text-right min-w-[120px]">
                              <div className="flex items-center justify-end gap-2 mb-1">
                                {isProfit ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-rose-500" />}
                                <p className={`text-xl font-black ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                                  {isProfit ? '+' : ''}{profit.toLocaleString()}
                                </p>
                              </div>
                              <p className={`text-[10px] font-black uppercase tracking-widest ${isProfit ? 'text-emerald-500/60' : 'text-rose-500/60'}`}>
                                {((profit / (inv.buy_price * inv.amount)) * 100).toFixed(1)}% Yield
                              </p>
                            </div>
                            <button 
                              onClick={() => handleDeleteInvestment(inv.id)}
                              className="p-3 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  {savingsData?.investments.filter(inv => activeTab === 'currencies' ? ['usd', 'eur', 'gbp'].includes(inv.type.toLowerCase()) : inv.type.toLowerCase() === activeTab).length === 0 && (
                    <div className="p-24 text-center">
                      <div className="w-20 h-20 rounded-[2rem] bg-slate-800/50 flex items-center justify-center mx-auto mb-6">
                        <Info className="w-10 h-10 text-slate-600" />
                      </div>
                      <p className="text-sm font-black text-slate-500 uppercase tracking-[0.3em] mb-8">Vault Section Empty</p>
                      <button 
                        onClick={() => {
                          setSelectedInvestmentType(activeTab === 'currencies' ? 'USD' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1));
                          setShowInvestmentModal(true);
                        }}
                        className="px-8 py-4 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-500 hover:text-white transition-all"
                      >
                        Secure Asset
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

      {/* Goal Modal Premium */}
      {showGoalModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-slate-950/40">
          <div className="absolute inset-0" onClick={() => setShowGoalModal(false)} />
          <div className={`relative w-full max-w-md ${isDark ? 'bg-slate-900 border-slate-700/50' : 'bg-white border-slate-200'} border p-10 rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300`}>
            <div className="flex items-center gap-5 mb-10">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-600/20">
                <Target className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight">Set Target</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Monthly Savings Goal</p>
              </div>
            </div>
            <form onSubmit={handleUpdateGoal} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Target Amount (EGP)</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    value={monthlyGoalInput}
                    onChange={(e) => setMonthlyGoalInput(e.target.value)}
                    placeholder="e.g. 10,000"
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-[1.5rem] px-8 py-6 text-3xl font-black focus:outline-none focus:border-blue-500 transition-all"
                  />
                  <span className="absolute right-8 top-1/2 -translate-y-1/2 text-sm font-black text-slate-500">EGP</span>
                </div>
              </div>
              <button type="submit" className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-sm shadow-2xl shadow-blue-600/30 transition-all active:scale-95">
                Lock Goal
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Market Rates Disclaimer */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 pb-12">
        <div className="flex items-center justify-center gap-2 text-slate-500/60">
          <AlertCircle className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
            Market rates are automatically synced 3 times daily (8AM, 2PM, 8PM EET)
          </span>
        </div>
      </div>
    </div>
  );
};

export default Savings;