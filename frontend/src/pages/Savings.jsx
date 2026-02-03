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
  const flagMap = {
    'USD': '🇺🇸',
    'EUR': '🇪🇺',
    'GBP': '🇬🇧',
    'Gold': '🪙',
    'Silver': '🥈'
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-md card-unified ${isDark ? 'card-unified-dark bg-[#0f172a]' : 'card-unified-light'} p-8 animate-in zoom-in-95 duration-300 shadow-2xl border-2 ${isDark ? 'border-amber-500/20' : 'border-amber-400/20'} rounded-3xl`}>
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-slate-500/10 rounded-full transition-colors">
          <X className="w-6 h-6" />
        </button>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-amber-500 rounded-2xl shadow-lg shadow-amber-500/20 text-2xl">
            {flagMap[type] || (isCurrency ? '💵' : '💰')}
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
              className={`input-unified w-full !py-4 ${isDark ? 'bg-slate-900 border-slate-700' : ''}`}
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
              className={`input-unified w-full !py-4 ${isDark ? 'bg-slate-900 border-slate-700' : ''}`}
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Purchase Date</label>
            <input
              type="date"
              required
              value={buyDate}
              onChange={(e) => setBuyDate(e.target.value)}
              className={`input-unified w-full !py-4 ${isDark ? 'bg-slate-900 border-slate-700' : ''}`}
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
      icon: <Wallet className="w-6 h-6 text-blue-500" />,
      color: 'blue'
    }));

    const invs = investments.map(i => ({
      id: `i-${i.id}`,
      type: 'investment',
      amount: i.amount,
      assetType: i.type,
      description: `Bought ${i.amount} ${['gold', 'silver'].includes(i.type.toLowerCase()) ? 'g' : ''} ${i.type}`,
      date: new Date(i.buy_date),
      icon: i.type.toLowerCase() === 'gold' ? <Coins className="w-6 h-6 text-amber-500" /> : <Landmark className="w-6 h-6 text-blue-500" />,
      color: 'amber'
    }));

    return [...txns, ...invs].sort((a, b) => b.date - a.date);
  }, [transactions, investments]);

  if (allHistory.length === 0) return (
    <div className="p-16 text-center text-slate-500 font-black uppercase tracking-[0.4em] text-[10px]">No historical data found</div>
  );

  return (
    <div className="divide-y divide-slate-700/20 max-h-[500px] overflow-y-auto no-scrollbar pr-2">
      {allHistory.map((item) => (
        <div key={item.id} className="py-8 flex items-center justify-between hover:bg-slate-500/5 transition-all duration-500 group rounded-2xl px-4 -mx-4">
          <div className="flex items-center gap-6">
            <div className={`p-4 rounded-2xl ${isDark ? 'bg-slate-900' : 'bg-slate-100'} border border-slate-700/30 group-hover:scale-110 transition-transform duration-500 shadow-xl`}>
              {item.icon}
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-tight mb-1">{item.description}</p>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.date.toLocaleDateString('en-EG', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-xl font-black ${item.color === 'blue' ? 'text-blue-500' : 'text-amber-500'}`}>
              {item.amount.toLocaleString()} <span className="text-[10px] uppercase">{item.assetType || 'EGP'}</span>
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
    <div className={`min-h-screen pb-20 ${isDark ? 'bg-[#0f172a] text-white' : 'bg-slate-50 text-slate-900'} transition-colors duration-500`}>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] pt-16 pb-28 px-6 md:px-12 rounded-b-[4rem] shadow-2xl">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full -mr-48 -mt-48 blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-400/5 rounded-full -ml-32 -mb-32 blur-[100px]" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-12">
            <div className="animate-in fade-in slide-in-from-left-8 duration-1000">
              <div className="flex items-center gap-4 mb-4">
                <p className="text-blue-400 font-black uppercase tracking-[0.4em] text-[10px]">Financial Fortress</p>
                {lastUpdated && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full animate-pulse">
                    <AlertCircle className="w-3 h-3 text-amber-500" />
                    <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">
                      {ratesOutdated 
                        ? `Rates from ${Math.floor((new Date() - lastUpdated) / (1000 * 60 * 60))}h ago` 
                        : `Rates synced ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    </span>
                  </div>
                )}
              </div>
              
              <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-6">
                Total <span className="text-amber-500">Savings</span>
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
                  className={`p-4 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-95 group ${refreshing ? 'cursor-not-allowed opacity-50' : ''}`}
                  title="Force Sync Markets"
                >
                  <RefreshCw className={`w-8 h-8 text-amber-500 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
                </button>
              </div>
              
              {refreshing && (
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 mt-4 animate-pulse">
                  Updating Live Market Indices...
                </p>
              )}
            </div>
            
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-8 duration-1000 delay-200">
              <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/10 p-10 rounded-[3.5rem] shadow-2xl min-w-[320px] relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-emerald-500/20 rounded-2xl">
                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                  </div>
                  <span className="text-blue-200 font-black uppercase tracking-widest text-[10px]">Net Appreciation</span>
                </div>
                <p className="text-5xl font-black text-white relative z-10">+{(totalOverallSavings * 0.052).toLocaleString()} <span className="text-sm font-bold text-emerald-400 block mt-2">+5.2% Total Growth</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 -mt-16 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Allocation & Goal */}
          <div className="lg:col-span-4 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            {/* Monthly Allocation Card */}
            <div className={`card-unified ${isDark ? 'card-unified-dark bg-[#1e293b]' : 'card-unified-light'} p-10 shadow-2xl rounded-[3rem] border-slate-700/50 hover:border-amber-500/30 transition-all duration-500 group relative overflow-hidden`}>
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full -mr-24 -mt-24 blur-3xl group-hover:bg-blue-500/10 transition-colors" />
              
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-blue-600 rounded-2xl shadow-xl shadow-blue-600/30">
                    <Wallet className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-black tracking-tight uppercase">Monthly Allocation</h3>
                </div>
                <button onClick={() => setShowGoalModal(true)} className="p-3 hover:bg-slate-500/10 rounded-2xl transition-colors">
                  <Target className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              
              <form onSubmit={handleMonthlySavingsSubmit} className="space-y-8">
                <div className="relative">
                  <input
                    type="number"
                    value={monthlyInput}
                    onChange={(e) => setMonthlyInput(e.target.value)}
                    placeholder="EGP Amount to save..."
                    className={`input-unified w-full !pl-10 !py-6 !rounded-[2.5rem] text-2xl font-black ${isDark ? 'bg-slate-900/50 border-slate-700' : ''}`}
                  />
                </div>
                <button 
                  type="submit"
                  className="btn-primary-unified w-full !py-6 !rounded-[2.5rem] !bg-blue-600 hover:!bg-blue-700 shadow-2xl shadow-blue-600/40 group overflow-hidden relative flex items-center justify-center gap-3"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <Plus className="w-7 h-7 group-hover:rotate-90 transition-transform duration-500" />
                  <span className="font-black uppercase tracking-[0.2em] text-sm">+ Allocate Savings</span>
                </button>
              </form>

              <div className="mt-12 p-10 bg-slate-900/30 rounded-[3rem] border border-slate-700/50 relative overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 block mb-2">Target Progress</span>
                    <span className="text-4xl font-black text-blue-500">{progressPercent.toFixed(1)}%</span>
                  </div>
                  <div className="relative w-24 h-24">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                      <circle cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray={263.9} strokeDashoffset={263.9 - (263.9 * progressPercent) / 100} strokeLinecap="round" className="text-blue-500 transition-all duration-1000 ease-out" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Target className="w-8 h-8 text-blue-500 opacity-40" />
                    </div>
                  </div>
                </div>
                
                <p className="text-[11px] font-black text-slate-400 text-center uppercase tracking-widest leading-relaxed">
                  Saved <span className="text-blue-500 text-sm">{monthlySaved.toLocaleString()}</span> of {monthlyGoal.toLocaleString()} EGP goal
                </p>
              </div>
            </div>

            {/* Financial History Summary Card */}
            <div className={`card-unified ${isDark ? 'card-unified-dark bg-[#1e293b]' : 'card-unified-light'} p-10 rounded-[3rem] border-slate-700/50`}>
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-2xl font-black uppercase tracking-tight">Portfolio Summary</h3>
                <button 
                  onClick={() => setShowHistory(!showHistory)}
                  className={`p-4 rounded-2xl transition-all duration-500 ${showHistory ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-slate-500/10 text-slate-400 hover:text-amber-500'}`}
                >
                  <History className="w-7 h-7" />
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
                  <div className="flex items-center justify-between p-8 rounded-[2.5rem] bg-slate-900/50 border border-slate-700/50 group hover:border-amber-500/30 transition-all">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">Total Assets</p>
                      <p className="text-3xl font-black">{totalInvestmentsValue.toLocaleString()} <span className="text-sm text-slate-500 uppercase">EGP</span></p>
                    </div>
                    <PieChartIcon className="w-12 h-12 text-amber-500/20 group-hover:text-amber-500/40 transition-colors" />
                  </div>
                  <div className="flex items-center justify-between p-8 rounded-[2.5rem] bg-slate-900/50 border border-slate-700/50 group hover:border-blue-500/30 transition-all">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">Cash Balance</p>
                      <p className="text-3xl font-black">{(savingsData?.cash_balance || 0).toLocaleString()} <span className="text-sm text-slate-500 uppercase">EGP</span></p>
                    </div>
                    <Wallet className="w-12 h-12 text-blue-500/20 group-hover:text-blue-500/40 transition-all" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Growth & Assets */}
          <div className="lg:col-span-8 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-400">
            {/* Top horizontal tabs */}
            <div className={`flex items-center gap-4 p-4 ${isDark ? 'bg-[#1e293b]/60' : 'bg-white'} backdrop-blur-3xl rounded-[3rem] border-2 ${isDark ? 'border-slate-700/50' : 'border-slate-200'} shadow-2xl overflow-x-auto no-scrollbar`}>
              {[
                { id: 'cash', label: 'CASH VAULT', icon: Wallet, emoji: '💵' },
                { id: 'gold', label: 'GOLD VAULT', icon: Coins, emoji: '🪙' },
                { id: 'silver', label: 'SILVER VAULT', icon: Coins, emoji: '🥈' },
                { id: 'currencies', label: 'FX ASSETS', icon: Landmark, emoji: '🌍' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-10 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] transition-all duration-500 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-amber-500 text-white shadow-2xl shadow-amber-500/40 scale-105'
                      : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700/50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-lg">{tab.emoji}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Growth Trend Line Chart */}
            <div className={`card-unified ${isDark ? 'card-unified-dark bg-[#1e293b]' : 'card-unified-light'} p-10 rounded-[3.5rem] min-h-[500px] flex flex-col border-slate-700/50 relative overflow-hidden`}>
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full -mr-32 -mt-32 blur-[100px]" />
              
              <div className="flex items-center justify-between mb-12 relative z-10">
                <div>
                  <h3 className="text-3xl font-black tracking-tighter uppercase mb-2">Growth Trend</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Asset Valuation Over Time</p>
                </div>
                <div className="p-5 bg-blue-500/10 rounded-[2rem] border border-blue-500/20">
                  <TrendingUp className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="flex-1 min-h-[350px] relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { date: '1 Jan', val: (totalOverallSavings * 0.7) },
                    { date: '15 Jan', val: (totalOverallSavings * 0.85) },
                    { date: '1 Feb', val: (totalOverallSavings * 0.95) },
                    { date: 'Today', val: totalOverallSavings },
                  ]}>
                    <defs>
                      <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity="0.4"/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#e2e8f0'} opacity="0.5" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11, fontWeight: '900'}} dy={15} />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0f172a', 
                        borderRadius: '2rem', 
                        border: '1px solid #334155', 
                        boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.8)',
                        padding: '1.5rem'
                      }} 
                      itemStyle={{ color: '#fff', fontWeight: '900', fontSize: '1.2rem' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="val" 
                      stroke="#3b82f6" 
                      strokeWidth={8} 
                      fillOpacity={1} 
                      fill="url(#colorVal)" 
                      animationDuration={2000}
                      dot={{ r: 8, fill: '#3b82f6', strokeWidth: 4, stroke: '#1e293b' }}
                      activeDot={{ r: 12, fill: '#fff', strokeWidth: 4, stroke: '#3b82f6' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick-Add Grid with Flags */}
            <div className={`card-unified ${isDark ? 'card-unified-dark bg-[#1e293b]' : 'card-unified-light'} p-10 rounded-[3.5rem] border-slate-700/50`}>
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-xl font-black uppercase tracking-[0.3em] text-slate-500">Vault Quick-Add</h3>
                <span className="p-2 bg-amber-500/10 rounded-xl text-amber-500"><Plus className="w-5 h-5" /></span>
              </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {[
                { type: 'Gold', label: '24K GOLD', emoji: '🪙', color: 'amber' },
                { type: 'Silver', label: 'PURE SILVER', emoji: '🥈', color: 'slate' },
                { type: 'USD', label: 'USD 🇺🇸', emoji: '💵', color: 'blue' },
                { type: 'EUR', label: 'EUR 🇪🇺', emoji: '💶', color: 'indigo' },
                { type: 'GBP', label: 'GBP 🇬🇧', emoji: '💷', color: 'emerald' }
              ].map((item) => (
                <button 
                  key={item.type}
                  onClick={() => {
                    setSelectedInvestmentType(item.type);
                    setShowInvestmentModal(true);
                  }}
                  className={`flex flex-col items-center gap-5 p-8 rounded-[2.5rem] border-2 transition-all duration-500 group relative overflow-hidden ${
                    isDark 
                      ? 'bg-slate-900/50 border-slate-700/50 hover:border-amber-500/50 hover:bg-slate-900 hover:scale-105' 
                      : 'bg-white border-slate-100 hover:border-amber-400 hover:scale-105 shadow-sm'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center text-4xl bg-slate-800/50 border border-slate-700 group-hover:bg-amber-500/20 group-hover:border-amber-500/50 transition-all duration-500 shadow-xl`}>
                    {item.emoji}
                  </div>
                  <span className="font-black uppercase tracking-[0.2em] text-[10px] text-slate-400 group-hover:text-amber-500 transition-colors">{item.label}</span>
                </button>
              ))}
            </div>
            </div>

            {/* Asset Detail List */}
            {activeTab !== 'cash' && (
              <div className={`card-unified ${isDark ? 'card-unified-dark bg-[#1e293b]' : 'card-unified-light'} p-0 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-1000 rounded-[3.5rem] border-slate-700/50 shadow-2xl`}>
                <div className="p-12 border-b border-slate-700/30 flex items-center justify-between bg-slate-900/40">
                  <div className="flex items-center gap-5">
                    <div className="p-4 bg-amber-500/10 rounded-2xl">
                      <Landmark className="w-8 h-8 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black tracking-tight uppercase">{activeTab} Holdings</h3>
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mt-1">Detailed Asset Inventory</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 px-6 py-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                    <div className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Market Active</span>
                  </div>
                </div>
                <div className="divide-y divide-slate-700/30">
                  {savingsData?.investments
                    .filter(inv => activeTab === 'currencies' ? ['usd', 'eur', 'gbp'].includes(inv.type.toLowerCase()) : inv.type.toLowerCase() === activeTab)
                    .map((inv) => {
                      const profit = inv.current_value - (inv.buy_price * inv.amount);
                      const isProfit = profit >= 0;
                      const flag = inv.type.toLowerCase() === 'usd' ? '🇺🇸' : inv.type.toLowerCase() === 'eur' ? '🇪🇺' : inv.type.toLowerCase() === 'gbp' ? '🇬🇧' : '';
                      
                      return (
                        <div key={inv.id} className="p-12 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-900/60 transition-all duration-500 group relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="flex items-center gap-10 mb-8 md:mb-0 relative z-10">
                            <div className={`p-6 rounded-[2rem] ${isDark ? 'bg-slate-900' : 'bg-slate-100'} border border-slate-700 group-hover:scale-110 group-hover:bg-amber-500/10 group-hover:border-amber-500/30 transition-all duration-500 shadow-xl text-3xl`}>
                              {inv.type.toLowerCase() === 'gold' ? '🪙' : inv.type.toLowerCase() === 'silver' ? '🥈' : flag || '💵'}
                            </div>
                            <div>
                              <p className="text-3xl font-black uppercase tracking-tight mb-2">
                                {inv.amount.toLocaleString()} {['gold', 'silver'].includes(inv.type.toLowerCase()) ? 'Grams' : inv.type} {flag}
                              </p>
                              <div className="flex items-center gap-4">
                                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 bg-slate-800/50 px-3 py-1 rounded-lg">Buy: {inv.buy_price.toLocaleString()} EGP</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">{new Date(inv.buy_date).toLocaleDateString('en-EG', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col md:flex-row md:items-center gap-16 relative z-10">
                            <div className="text-right">
                              <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 mb-2">Current Valuation</p>
                              <p className="text-4xl font-black text-white">
                                {inv.current_value.toLocaleString()} <span className="text-sm text-slate-500 font-bold">EGP</span>
                              </p>
                            </div>
                            
                            <div className="text-right min-w-[180px]">
                              <div className="flex items-center justify-end gap-3 mb-2">
                                {isProfit ? <TrendingUp className="w-6 h-6 text-emerald-500" /> : <TrendingDown className="w-6 h-6 text-rose-500" />}
                                <p className={`text-3xl font-black ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                                  {isProfit ? '+' : ''}{profit.toLocaleString()} <span className="text-sm font-bold">EGP</span>
                                </p>
                              </div>
                              <p className={`text-[11px] font-black uppercase tracking-[0.3em] ${isProfit ? 'text-emerald-500/60' : 'text-rose-500/60'}`}>
                                {isProfit ? 'Net Profit' : 'Net Loss'}: {((profit / (inv.buy_price * inv.amount)) * 100).toFixed(2)}%
                              </p>
                            </div>

                            <button 
                              onClick={() => handleDeleteInvestment(inv.id)}
                              className="p-4 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all duration-300 shadow-lg hover:shadow-rose-500/20"
                            >
                              <X className="w-6 h-6" />
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