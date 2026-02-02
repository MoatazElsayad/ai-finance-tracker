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
  AlertCircle
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
  getCurrentUser
} from '../api';
import confetti from 'canvas-confetti';

// Mock/Assuming these API helpers will be implemented in api.js
const getSavingsData = async () => {
  // In a real app, this would fetch from GET /savings
  return {
    cash_balance: 5000,
    investments: [
      { id: 1, type: 'gold', amount: 10, buy_price: 3200, buy_date: '2024-01-15' },
      { id: 2, type: 'USD', amount: 500, buy_price: 48.5, buy_date: '2024-01-20' }
    ],
    monthly_goal: 2000
  };
};

const Savings = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [loading, setLoading] = useState(true);
  const [savingsData, setSavingsData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [monthlyInput, setMonthlyInput] = useState('');
  const [showAddInvestment, setShowAddInvestment] = useState(false);
  const [activeTab, setActiveTab] = useState('cash'); // 'cash', 'gold', 'silver', 'currencies'
  
  // Real-time rates (Mocking API response for now)
  const [rates, setRates] = useState({
    gold: 3850, // EGP per gram
    silver: 45,  // EGP per gram
    usd: 48.9,
    eur: 52.8,
    egp: 1.0,
    changes: {
      gold: 1.2,
      silver: -0.5,
      usd: 0.1,
      eur: 0.3,
      egp: 0
    }
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [txns, cats, savings] = await Promise.all([
        getTransactions(),
        getCategories(),
        getSavingsData()
      ]);
      setTransactions(txns);
      setCategories(cats);
      setSavingsData(savings);
    } catch (err) {
      console.error("Failed to load savings data", err);
    } finally {
      setLoading(false);
    }
  };

  const currentMonthSavings = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return transactions
      .filter(t => {
        const d = new Date(t.date);
        const isSavings = t.category_name?.toLowerCase().includes('savings') || 
                         categories.find(c => c.id === t.category_id)?.name?.toLowerCase().includes('savings');
        return isSavings && d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.amount < 0;
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }, [transactions, categories]);

  const totalInvestmentsValue = useMemo(() => {
    if (!savingsData) return 0;
    return savingsData.investments.reduce((sum, inv) => {
      const rate = rates[inv.type.toLowerCase()] || 0;
      return sum + (inv.amount * rate);
    }, 0);
  }, [savingsData, rates]);

  const totalOverallSavings = (savingsData?.cash_balance || 0) + totalInvestmentsValue;

  // Animated Counter Logic
  const [displaySavings, setDisplaySavings] = useState(0);
  useEffect(() => {
    let start = displaySavings;
    const end = totalOverallSavings;
    const duration = 1500;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (easeOutExpo)
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      const currentCount = Math.floor(start + (end - start) * easeProgress);
      setDisplaySavings(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [totalOverallSavings]);

  const handleMonthlySavingsSubmit = async (e) => {
    e.preventDefault();
    if (!monthlyInput || isNaN(monthlyInput)) return;

    const amount = parseFloat(monthlyInput);
    let savingsCat = categories.find(c => c.name?.toLowerCase().includes('savings'));
    
    if (!savingsCat) {
      const newCat = await initSavingsCategory();
      savingsCat = newCat;
    }

    try {
      await createTransaction(
        savingsCat.id,
        -amount,
        "Monthly savings allocation",
        new Date().toISOString().split('T')[0]
      );
      
      // Check for milestone
      if (Math.floor(totalOverallSavings / 5000) < Math.floor((totalOverallSavings + amount) / 5000)) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#fbbf24', '#f59e0b', '#3b82f6']
        });
      }

      setMonthlyInput('');
      loadAllData();
    } catch (err) {
      console.error("Failed to add savings", err);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0a0f1d]' : 'bg-slate-50'}`}>
        <RefreshCw className="w-12 h-12 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-20 ${isDark ? 'bg-[#0a0e27] text-white' : 'bg-slate-50 text-slate-900'} transition-colors duration-500`}>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-900 pt-12 pb-24 px-6 md:px-12 rounded-b-[4rem] shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-400/10 rounded-full -ml-12 -mb-12 blur-2xl" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <p className="text-blue-100 font-black uppercase tracking-[0.3em] text-xs mb-3">Your Financial Fortress</p>
              <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-4">
                Total <span className="text-amber-400">Savings</span>
              </h1>
              <div className="flex items-baseline gap-3">
                <span className="text-6xl md:text-8xl font-black text-white">
                  {displaySavings.toLocaleString()}
                </span>
                <span className="text-2xl md:text-3xl font-bold text-blue-200">EGP</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-[2.5rem] shadow-xl">
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-2 bg-emerald-500/20 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                  </div>
                  <span className="text-blue-100 font-bold uppercase tracking-widest text-xs">Monthly Growth</span>
                </div>
                <p className="text-3xl font-black text-white">+12.4%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 -mt-12 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Input and Goal */}
          <div className="lg:col-span-4 space-y-8">
            {/* Monthly Savings Form */}
            <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'} p-8 shadow-2xl`}>
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-blue-500 rounded-2xl shadow-lg shadow-blue-500/30">
                  <CircleDollarSign className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-black tracking-tight uppercase">Monthly Allocation</h3>
              </div>
              
              <form onSubmit={handleMonthlySavingsSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Amount to Save</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={monthlyInput}
                      onChange={(e) => setMonthlyInput(e.target.value)}
                      placeholder="e.g. 1000"
                      className="input-unified w-full !pl-14 !py-5 !rounded-2xl text-xl font-black"
                    />
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-lg font-black text-slate-400">EGP</span>
                  </div>
                </div>
                <button 
                  type="submit"
                  className="btn-primary-unified w-full !py-5 !rounded-2xl !bg-blue-600 hover:!bg-blue-700 shadow-xl shadow-blue-500/20 group"
                >
                  <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                  <span className="font-black uppercase tracking-widest">Allocate Savings</span>
                </button>
              </form>

              <div className="mt-10 p-6 bg-slate-500/5 rounded-3xl border border-slate-500/10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">Month Progress</span>
                  <span className="text-sm font-black text-blue-500">
                    {Math.min(100, (currentMonthSavings / (savingsData?.monthly_goal || 1)) * 100).toFixed(0)}%
                  </span>
                </div>
                
                <div className="flex justify-center mb-6">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="58"
                        stroke="currentColor"
                        strokeWidth="10"
                        fill="transparent"
                        className="text-slate-200 dark:text-slate-800"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="58"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="transparent"
                        strokeDasharray={364.4}
                        strokeDashoffset={364.4 - (364.4 * Math.min(100, (currentMonthSavings / (savingsData?.monthly_goal || 1)) * 100)) / 100}
                        strokeLinecap="round"
                        className="text-blue-500 transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-black text-blue-500">
                        {Math.min(100, (currentMonthSavings / (savingsData?.monthly_goal || 1)) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-4">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-1000" 
                    style={{ width: `${Math.min(100, (currentMonthSavings / (savingsData?.monthly_goal || 1)) * 100)}%` }}
                  />
                </div>
                <p className="text-xs font-bold text-slate-500 text-center">
                  Saved <span className="text-blue-500 font-black">{currentMonthSavings.toLocaleString()}</span> of {savingsData?.monthly_goal.toLocaleString()} EGP goal
                </p>
              </div>
            </div>

            {/* Investment Quick Actions */}
            <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'} p-8`}>
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 mb-6">Quick Add</h3>
              <div className="grid grid-cols-2 gap-4">
                {['Gold', 'Silver', 'USD', 'EUR'].map((type) => (
                  <button 
                    key={type}
                    onClick={() => setShowAddInvestment(true)}
                    className={`flex flex-col items-center gap-3 p-5 rounded-3xl border-2 transition-all duration-300 ${
                      isDark ? 'bg-slate-800/40 border-slate-700 hover:border-amber-500/50' : 'bg-white border-slate-100 hover:border-amber-400'
                    }`}
                  >
                    <div className="p-3 bg-amber-500/10 rounded-2xl">
                      {type === 'Gold' || type === 'Silver' ? <Coins className="w-6 h-6 text-amber-500" /> : <Landmark className="w-6 h-6 text-blue-500" />}
                    </div>
                    <span className="font-black uppercase tracking-widest text-[10px]">{type}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Charts and Investments */}
          <div className="lg:col-span-8 space-y-8">
            {/* Tabs Navigation */}
            <div className={`flex items-center gap-2 p-2 ${isDark ? 'bg-slate-800/40' : 'bg-white'} backdrop-blur-xl rounded-[2.5rem] border-2 ${isDark ? 'border-slate-700/50' : 'border-slate-200'} shadow-xl overflow-x-auto no-scrollbar`}>
              {[
                { id: 'cash', label: 'Cash Savings', icon: Wallet },
                { id: 'gold', label: 'Gold Vault', icon: Coins },
                { id: 'silver', label: 'Silver Vault', icon: Coins },
                { id: 'currencies', label: 'Foreign Assets', icon: Landmark }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-8 py-4 rounded-full font-black text-xs uppercase tracking-[0.2em] transition-all duration-500 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-105'
                      : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700/50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Investment Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeTab === 'cash' && (
                <div className={`col-span-2 card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'} p-8 min-h-[400px]`}>
                   <div className="flex items-center justify-between mb-10">
                    <div>
                      <h3 className="text-2xl font-black tracking-tight uppercase mb-2">Savings Growth</h3>
                      <p className="text-sm font-bold text-slate-500">Track your cash accumulation over time</p>
                    </div>
                    <div className="p-4 bg-emerald-500/10 rounded-2xl">
                      <TrendingUp className="w-8 h-8 text-emerald-500" />
                    </div>
                  </div>
                  
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[
                        { date: 'Jan 1', savings: 1000 },
                        { date: 'Jan 15', savings: 2500 },
                        { date: 'Feb 1', savings: 3200 },
                        { date: 'Feb 15', savings: 5000 },
                      ]}>
                        <defs>
                          <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#e2e8f0'} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 'bold'}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 'bold'}} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: isDark ? '#0f172a' : '#fff', borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                          itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                        />
                        <Area type="monotone" dataKey="savings" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorSavings)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Investment Cards */}
              {activeTab !== 'cash' && rates && (
                <>
                  <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'} p-8 relative overflow-hidden group`}>
                    <div className="absolute -right-8 -bottom-8 w-32 h-32 opacity-10 group-hover:scale-125 transition-transform duration-700">
                      <Coins className="w-full h-full text-amber-500" />
                    </div>
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Real-time Rate</span>
                      <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black ${rates.changes.gold >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        {rates.changes.gold >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(rates.changes.gold)}%
                      </div>
                    </div>
                    <h3 className="text-3xl font-black mb-2">{rates.gold.toLocaleString()} <span className="text-sm font-bold text-slate-500">EGP/g</span></h3>
                    <p className="text-xs font-black uppercase tracking-widest text-amber-500">24K Gold Price</p>
                  </div>
                  
                  <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'} p-8`}>
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 mb-6">Portfolio Breakdown</h3>
                    <div className="h-[150px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Cash', value: savingsData?.cash_balance || 0 },
                              { name: 'Investments', value: totalInvestmentsValue }
                            ]}
                            innerRadius={40}
                            outerRadius={60}
                            paddingAngle={8}
                            dataKey="value"
                          >
                            <Cell fill="#3b82f6" />
                            <Cell fill="#fbbf24" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-6 mt-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cash</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Assets</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Assets List */}
            {activeTab !== 'cash' && (
              <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'} p-0 overflow-hidden`}>
                <div className="p-8 border-b border-slate-700/10 flex items-center justify-between">
                  <h3 className="text-xl font-black tracking-tight uppercase">Your {activeTab} Assets</h3>
                  <button className="text-blue-500 font-black text-xs uppercase tracking-widest hover:underline flex items-center gap-2">
                    View All <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="divide-y divide-slate-700/10">
                  {savingsData?.investments
                    .filter(inv => activeTab === 'currencies' ? ['usd', 'eur', 'gbp'].includes(inv.type.toLowerCase()) : inv.type.toLowerCase() === activeTab)
                    .map((inv) => (
                      <div key={inv.id} className="p-8 flex items-center justify-between hover:bg-slate-500/5 transition-colors group">
                        <div className="flex items-center gap-6">
                          <div className={`p-4 rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'} group-hover:scale-110 transition-transform`}>
                            {inv.type.toLowerCase() === 'gold' ? <Coins className="w-6 h-6 text-amber-500" /> : <CircleDollarSign className="w-6 h-6 text-blue-500" />}
                          </div>
                          <div>
                            <p className="text-lg font-black uppercase tracking-tight">{inv.amount} {inv.type === 'gold' || inv.type === 'silver' ? 'grams' : inv.type}</p>
                            <p className="text-xs font-bold text-slate-500">Bought at {inv.buy_price} EGP on {new Date(inv.buy_date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-emerald-500">
                            +{( (rates[inv.type.toLowerCase()] * inv.amount) - (inv.buy_price * inv.amount) ).toLocaleString()} EGP
                          </p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Profit</p>
                        </div>
                      </div>
                    ))}
                  {savingsData?.investments.filter(inv => activeTab === 'currencies' ? ['usd', 'eur', 'gbp'].includes(inv.type.toLowerCase()) : inv.type.toLowerCase() === activeTab).length === 0 && (
                    <div className="p-20 text-center">
                      <div className="p-6 bg-slate-500/5 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                        <Info className="w-10 h-10 text-slate-400" />
                      </div>
                      <p className="text-lg font-black text-slate-400 uppercase tracking-widest">No assets found</p>
                      <button 
                        onClick={() => setShowAddInvestment(true)}
                        className="mt-4 text-blue-500 font-black text-sm uppercase tracking-widest hover:underline"
                      >
                        Add your first investment
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Savings;
