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
  updateSavingsGoal,
  setLongTermSavingsGoal
} from '../api';
import confetti from 'canvas-confetti';

// --- Sub-components ---

const WealthChangeIndicator = ({ change, percent, isDark }) => {
  const isPositive = change >= 0;
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'} border ${isPositive ? 'border-emerald-500/20' : 'border-rose-500/20'} animate-in slide-in-from-left duration-500`}>
      {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
      <span className="text-[11px] font-black uppercase tracking-wider">
        {isPositive ? '+' : ''}{change.toLocaleString()} EGP ({isPositive ? '+' : ''}{percent}%)
      </span>
    </div>
  );
};

const GoalTrackerCard = ({ goal, currentAmount, isDark, onEdit }) => {
  const progress = goal ? Math.min(100, (currentAmount / goal.target_amount) * 100) : 0;
  const remaining = goal ? Math.max(0, goal.target_amount - currentAmount) : 0;
  
  // Estimate completion date based on progress and time since creation
  const getEstimatedDate = () => {
    if (!goal || currentAmount <= 0) return 'TBD';
    const created = new Date(goal.created_at);
    const now = new Date();
    const target = new Date(goal.target_date);
    const elapsedDays = Math.max(1, (now - created) / (1000 * 60 * 60 * 24));
    const egpPerDay = currentAmount / elapsedDays;
    
    if (egpPerDay <= 0) return 'TBD';
    const remainingDays = remaining / egpPerDay;
    const estDate = new Date();
    estDate.setDate(estDate.getDate() + remainingDays);
    
    return estDate.toLocaleDateString('en-EG', { month: 'short', year: 'numeric' });
  };

  const getStatus = () => {
    if (progress >= 100) return { label: 'Mission Accomplished', color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
    if (progress >= 75) return { label: 'Final Stretch', color: 'text-blue-500', bg: 'bg-blue-500/10' };
    return { label: 'In Progress', color: 'text-amber-500', bg: 'bg-amber-500/10' };
  };
  const status = getStatus();

  return (
    <div className={`relative overflow-hidden p-8 rounded-[2.5rem] border ${isDark ? 'bg-slate-900/50 border-slate-700/50' : 'bg-white border-slate-200'} group hover:border-amber-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/10`}>
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className={`inline-flex items-center gap-2 px-2 py-0.5 rounded-lg ${status.bg} ${status.color} mb-1 animate-pulse`}>
             <div className={`w-1 h-1 rounded-full bg-current`} />
             <span className="text-[10px] font-black uppercase tracking-tighter">{status.label}</span>
          </div>
          <p className="text-xs font-black uppercase tracking-[0.4em] text-slate-500 mb-1">Financial Mission</p>
          <h3 className="text-2xl font-black tracking-tight">{goal ? 'Fortress of Solitude' : 'Set a Goal'}</h3>
        </div>
        <button onClick={onEdit} className="p-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-2xl transition-all active:scale-95">
          <Target className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-8">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full -rotate-90 transform">
            <circle
              cx="64"
              cy="64"
              r="58"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="10"
              className={`${isDark ? 'text-slate-800' : 'text-slate-100'}`}
            />
            <circle
              cx="64"
              cy="64"
              r="58"
              fill="transparent"
              stroke="url(#progressGradient)"
              strokeWidth="10"
              strokeDasharray={364.4}
              strokeDashoffset={364.4 - (364.4 * progress) / 100}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black">{Math.round(progress)}%</span>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Remaining</p>
            <p className="text-xl font-black text-amber-500">{remaining.toLocaleString()} <span className="text-xs opacity-60">EGP</span></p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-1">ETA</p>
            <p className="text-lg font-black">{getEstimatedDate()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const WealthDonutChart = ({ data, isDark }) => {
  const COLORS = {
    Cash: '#3b82f6',
    Gold: '#fbbf24',
    Silver: '#94a3b8',
    USD: '#10b981',
    EUR: '#6366f1',
    GBP: '#ef4444'
  };

  return (
    <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-slate-900/50 border-slate-700/50' : 'bg-white border-slate-200'} group hover:border-blue-500/30 transition-all duration-500`}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.4em] text-slate-500 mb-1">Asset Distribution</p>
          <h3 className="text-xl font-black tracking-tight">Wealth Split</h3>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
          <PieChartIcon className="w-5 h-5" />
        </div>
      </div>

      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={8}
              dataKey="value"
              animationBegin={0}
              animationDuration={1500}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#cbd5e1'} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'} shadow-2xl`}>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">{payload[0].name}</p>
                      <p className="text-lg font-black">{payload[0].value.toLocaleString()} <span className="text-xs opacity-60">EGP</span></p>
                      <p className="text-xs font-bold text-blue-500">{( (payload[0].value / data.reduce((a,b) => a + b.value, 0)) * 100).toFixed(1)}% of total</p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        {data.filter(d => d.value > 0).map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[entry.name] }} />
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const LongTermGoalModal = ({ isOpen, onClose, onSave, currentGoal, isDark }) => {
  const [amount, setAmount] = useState(currentGoal?.target_amount || '');
  const [date, setDate] = useState(currentGoal?.target_date?.split('T')[0] || '');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-md bg-slate-950/40">
      <div className="absolute inset-0" onClick={onClose} />
      <div className={`relative w-full max-w-md ${isDark ? 'bg-slate-900 border-slate-700/50' : 'bg-white border-slate-200'} border p-8 rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300`}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-black tracking-tight">Set Long-term Target</h3>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Secure Your Future</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-500/10 rounded-xl transition-colors text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Target Amount (EGP)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 1,000,000"
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-6 py-4 focus:outline-none focus:border-amber-500/50 transition-all font-bold text-lg"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Target Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-6 py-4 focus:outline-none focus:border-amber-500/50 transition-all font-bold"
            />
          </div>
          <button 
            onClick={() => onSave(amount, date)}
            className="w-full py-5 bg-amber-500 hover:bg-amber-600 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-amber-500/20 transition-all active:scale-95"
          >
            Lock Mission Target
          </button>
        </div>
      </div>
    </div>
  );
};

const InvestmentModal = ({ isOpen, onClose, onAdd, type, isDark }) => {
  const [amount, setAmount] = useState('');
  const [buyDate, setBuyDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Enter a valid amount');
      return;
    }

    onAdd({
      type,
      amount: numAmount,
      buy_date: buyDate
    });
    setAmount('');
    onClose();
  };

  const isCurrency = !['Gold', 'Silver'].includes(type);
  const flagMap = {
    'USD': '🇺🇸', 'EUR': '🇪🇺', 'GBP': '🇬🇧', 'SAR': '🇸🇦', 'AED': '🇦🇪',
    'KWD': '🇰🇼', 'QAR': '🇶🇦', 'BHD': '🇧🇭', 'OMR': '🇴🇲', 'JOD': '🇯🇴',
    'TRY': '🇹🇷', 'CAD': '🇨🇦', 'AUD': '🇦🇺',
  };

  const getIcon = () => {
    if (type === 'Gold') return <Coins className="w-6 h-6 text-amber-500" />;
    if (type === 'Silver') return <Coins className="w-6 h-6 text-slate-400" />;
    return (
      <div className="flex items-center gap-1.5">
        <DollarSign className="w-5 h-5 text-emerald-500" />
        <span className="text-lg">{flagMap[type]}</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-slate-950/40">
      <div className="absolute inset-0" onClick={onClose} />
      <div className={`relative w-full max-w-md ${isDark ? 'bg-slate-900 border-slate-700/50' : 'bg-white border-slate-200'} border p-8 rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300`}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-12 rounded-2xl bg-slate-800/50 flex items-center justify-center border border-slate-700/50 shadow-inner px-2">
              {getIcon()}
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight">Secure {type}</h3>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Vault Acquisition</p>
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
            <label className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 ml-1">
              {isCurrency ? `Amount in ${type}` : 'Grams of Metal'}
            </label>
            <div className="relative">
              <input
                type="number"
                required
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={isCurrency ? "e.g. 500" : "e.g. 10.5"}
                className={`w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-6 py-4 focus:outline-none focus:border-amber-500/50 transition-all font-bold text-lg`}
              />
              {isCurrency && (
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-black text-slate-500">
                  {type}
                </div>
              )}
            </div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-2 ml-1">
              * Buy price will be automatically fetched at current market rate
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Acquisition Date</label>
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
    <div className="py-20 text-center text-slate-500 font-black uppercase tracking-[0.4em] text-xs">Vault History Empty</div>
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
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{item.date.toLocaleDateString('en-EG', { day: 'numeric', month: 'short' })}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-lg font-black ${item.color === 'blue' ? 'text-blue-500' : 'text-amber-500'}`}>
              {item.amount.toLocaleString()} <span className="text-xs uppercase opacity-60 ml-1">{item.assetType || 'EGP'}</span>
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
  const [showLongTermGoalModal, setShowLongTermGoalModal] = useState(false);

  // For milestone tracking
  const prevProgressRef = useRef(0);

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
      // Ensure ratesResp is the source of truth for rates
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

  // Asset Breakdown for Donut Chart
  const assetBreakdown = useMemo(() => {
    if (!savingsData) return [];
    const breakdown = [
      { name: 'Cash', value: savingsData.cash_balance },
      { name: 'Gold', value: 0 },
      { name: 'Silver', value: 0 },
      { name: 'USD', value: 0 },
      { name: 'EUR', value: 0 },
      { name: 'GBP', value: 0 },
      { name: 'SAR', value: 0 },
      { name: 'AED', value: 0 },
      { name: 'KWD', value: 0 },
      { name: 'QAR', value: 0 },
      { name: 'BHD', value: 0 },
      { name: 'OMR', value: 0 },
      { name: 'JOD', value: 0 },
      { name: 'TRY', value: 0 },
      { name: 'CAD', value: 0 },
      { name: 'AUD', value: 0 },
    ];

    savingsData.investments.forEach(inv => {
      const type = inv.type.toUpperCase();
      const item = breakdown.find(b => b.name === (type === 'GOLD' ? 'Gold' : type === 'SILVER' ? 'Silver' : type));
      if (item) item.value += inv.current_value;
    });

    return breakdown.filter(b => b.value > 0);
  }, [savingsData]);

  // Wealth Change Indicators (Daily/Weekly)
  const wealthChange = useMemo(() => {
    if (!savingsData?.rate_history || savingsData.rate_history.length < 2) return { daily: { change: 0, percent: 0 }, weekly: { change: 0, percent: 0 } };
    
    const history = savingsData.rate_history;
    const latestRates = history[history.length - 1];
    const yesterdayRates = history[history.length - 2];
    const weekAgoRates = history[0];

    const calculateWealthWithRates = (targetRates) => {
      const cash = savingsData.cash_balance;
      const invValue = savingsData.investments.reduce((sum, inv) => {
        const rate = targetRates[inv.type.toLowerCase()] || 0;
        return sum + (inv.amount * rate);
      }, 0);
      return cash + invValue;
    };

    const currentWealth = totalOverallSavings;
    const yesterdayWealth = calculateWealthWithRates(yesterdayRates);
    const weekAgoWealth = calculateWealthWithRates(weekAgoRates);

    const dailyChange = currentWealth - yesterdayWealth;
    const dailyPercent = yesterdayWealth > 0 ? ((dailyChange / yesterdayWealth) * 100).toFixed(1) : 0;

    const weeklyChange = currentWealth - weekAgoWealth;
    const weeklyPercent = weekAgoWealth > 0 ? ((weeklyChange / weekAgoWealth) * 100).toFixed(1) : 0;

    return {
      daily: { change: dailyChange, percent: dailyPercent },
      weekly: { change: weeklyChange, percent: weeklyPercent }
    };
  }, [savingsData, totalOverallSavings]);

  // Milestone tracking
  useEffect(() => {
    if (!savingsData?.long_term_goal) return;
    const progress = (totalOverallSavings / savingsData.long_term_goal.target_amount) * 100;
    const milestones = [25, 50, 75, 100];
    
    milestones.forEach(m => {
      if (progress >= m && prevProgressRef.current < m) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#3b82f6', '#fbbf24', '#ffffff']
        });
        // Success toast would go here
      }
    });
    prevProgressRef.current = progress;
  }, [totalOverallSavings, savingsData?.long_term_goal]);

  const handleSetLongTermGoal = async (amount, date) => {
    try {
      await setLongTermSavingsGoal(amount, date);
      setShowLongTermGoalModal(false);
      loadAllData();
      confetti({ particleCount: 100, spread: 50, origin: { y: 0.8 } });
    } catch (err) {
      console.error("Failed to set long-term goal", err);
      setError("Failed to secure mission target.");
    }
  };

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
          <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 animate-pulse">Building Financial Fortress...</p>
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
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/40 border border-slate-700/50 mb-6 animate-in fade-in slide-in-from-top-4 duration-1000">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Total Net Worth</span>
          </div>

          <h1 className="text-xs font-black uppercase tracking-[0.5em] text-slate-500 mb-2">Liquidity & Assets Summary</h1>
          
          <div className="relative inline-block group">
            {/* Animated Number with Glow */}
            <div className="flex items-baseline justify-center gap-4 mb-2">
              <span className="text-6xl md:text-8xl font-black tracking-tighter text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.1)] group-hover:drop-shadow-[0_0_50px_rgba(59,130,246,0.3)] transition-all duration-700">
                {displaySavings.toLocaleString()}
              </span>
              <span className="text-2xl md:text-4xl font-black text-blue-500/80 tracking-tight">EGP</span>
            </div>
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-amber-500/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-1000" />
          </div>

          <div className="mt-8 flex items-center justify-center gap-8">
            <div className="flex flex-col items-center">
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Daily Change</p>
              <WealthChangeIndicator 
                change={wealthChange.daily.change} 
                percent={wealthChange.daily.percent} 
                isDark={isDark} 
              />
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="flex flex-col items-center">
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Weekly Change</p>
              <div className={`px-3 py-1.5 rounded-xl ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-100 border-slate-200'} border text-[11px] font-black uppercase tracking-wider ${wealthChange.weekly.change >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                {wealthChange.weekly.change >= 0 ? '+' : ''}{wealthChange.weekly.change.toLocaleString()} ({wealthChange.weekly.percent}%)
              </div>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <button 
              onClick={() => loadAllData(true)}
              className="group flex flex-col items-center"
            >
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 group-hover:text-amber-500 transition-colors">Sync Vault</p>
              <RefreshCw className={`w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-all ${refreshing ? 'animate-spin text-amber-500' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 -mt-12 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Actions & Summary */}
          <div className="lg:col-span-4 space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000">
            
            {/* Long-term Goal Tracker */}
            <GoalTrackerCard 
              goal={savingsData?.long_term_goal} 
              currentAmount={totalOverallSavings} 
              isDark={isDark} 
              onEdit={() => setShowLongTermGoalModal(true)} 
            />

            {/* Cash Allocation Card */}
            <div className={`p-8 rounded-[2.5rem] ${isDark ? 'bg-slate-900/80 border-slate-700/50' : 'bg-white border-slate-200'} border shadow-2xl backdrop-blur-xl group`}>
              <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20">
                      <Wallet className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold tracking-tight">Cash Vault</h3>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-500">Monthly Allocation</p>
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
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Monthly Goal Progress</p>
                    <p className="text-2xl font-black">{progressPercent.toFixed(0)}% <span className="text-xs text-slate-500 font-bold uppercase ml-2">Complete</span></p>
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
                <p className="text-xs font-bold text-slate-500">
                  <span className="text-white">{monthlySaved.toLocaleString()}</span> / {monthlyGoal.toLocaleString()} EGP target
                </p>
              </div>
            </div>

            {/* Portfolio Summary Minimal */}
            <div className={`p-8 rounded-[2.5rem] ${isDark ? 'bg-slate-900/80 border-slate-700/50' : 'bg-white border-slate-200'} border shadow-2xl`}>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-bold tracking-tight">Performance Summary</h3>
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
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Asset Valuation</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-xl font-black">{totalInvestmentsValue.toLocaleString()}</p>
                    <span className="text-[10px] text-slate-500 font-black uppercase">EGP</span>
                  </div>
                </div>
                <PieChartIcon className="w-8 h-8 text-amber-500/20" />
              </div>
              <div className="flex items-center justify-between p-6 rounded-3xl bg-slate-800/30 border border-slate-700/30">
                <div>
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Cash Reserve</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-xl font-black">{(savingsData?.cash_balance || 0).toLocaleString()}</p>
                    <span className="text-[10px] text-slate-500 font-black uppercase">EGP</span>
                  </div>
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
            <div className={`flex items-center gap-2 p-2 rounded-[2rem] ${isDark ? 'bg-slate-900/80 border-slate-700/50' : 'bg-white'} border shadow-xl backdrop-blur-xl overflow-x-auto no-scrollbar snap-x snap-mandatory`}>
              {[
                { id: 'cash', label: 'Cash', icon: <Wallet className="w-5 h-5" /> },
                { id: 'gold', label: 'Gold', icon: <Coins className="w-5 h-5" /> },
                { id: 'silver', label: 'Silver', icon: <Coins className="w-5 h-5" /> },
                { id: 'currencies', label: 'Forex', icon: <Landmark className="w-5 h-5" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-500 whitespace-nowrap snap-start ${
                    activeTab === tab.id
                      ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20 scale-105'
                      : 'text-slate-500 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <div className={`${activeTab === tab.id ? 'text-white' : 'text-amber-500'}`}>
                    {tab.icon}
                  </div>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Charts Section: Growth & Distribution */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Growth Trend - Premium Chart */}
              <div className={`p-10 rounded-[2.5rem] ${isDark ? 'bg-slate-900/80 border-slate-700/50' : 'bg-white border-slate-200'} border shadow-2xl relative overflow-hidden group`}>
                <div className="flex items-center justify-between mb-12">
                  <div>
                      <h3 className="text-xl font-bold tracking-tight">Growth Trajectory</h3>
                      <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Wealth Accumulation Trend</p>
                    </div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <TrendingUp className="w-6 h-6 text-blue-500" />
                  </div>
                </div>

                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={savingsTransactions.length > 0 ? savingsTransactions.slice(-7).reverse().map((t, i) => ({
                      date: new Date(t.date).toLocaleDateString('en-EG', { day: 'numeric', month: 'short' }),
                      val: Math.abs(t.amount)
                    })) : [
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
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1e293b" : "#e2e8f0"} opacity={0.3} />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#64748b', fontSize: 11, fontWeight: '900'}} 
                        dy={15} 
                      />
                      <YAxis hide domain={['auto', 'auto']} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: isDark ? '#0f172a' : '#fff', 
                          borderRadius: '1.5rem', 
                          border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, 
                          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)',
                          padding: '1.5rem'
                        }} 
                        itemStyle={{ color: isDark ? '#fff' : '#0f172a', fontWeight: '900', fontSize: '1.1rem' }}
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
                        dot={{ r: 6, fill: '#3b82f6', strokeWidth: 3, stroke: isDark ? '#0f172a' : '#fff' }}
                        activeDot={{ r: 8, fill: '#fff', strokeWidth: 3, stroke: '#3b82f6' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Wealth Distribution - Donut Chart */}
              <WealthDonutChart data={assetBreakdown} isDark={isDark} />
            </div>

            {/* Quick-Add Grid - Modern Minimal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { type: 'Gold', label: '24K Gold', icon: <Coins className="w-8 h-8 text-amber-500" />, rate: rates.gold },
                { type: 'Silver', label: 'Pure Silver', icon: <Coins className="w-8 h-8 text-slate-400" />, rate: rates.silver },
                { type: 'USD', label: 'USD 🇺🇸', icon: <div className="flex items-center gap-1"><DollarSign className="w-8 h-8 text-blue-500" /><span className="text-2xl">🇺🇸</span></div>, rate: rates.usd },
                { type: 'EUR', label: 'EUR 🇪🇺', icon: <div className="flex items-center gap-1"><DollarSign className="w-8 h-8 text-indigo-500" /><span className="text-2xl">🇪🇺</span></div>, rate: rates.eur },
                { type: 'SAR', label: 'SAR 🇸🇦', icon: <div className="flex items-center gap-1"><DollarSign className="w-8 h-8 text-emerald-500" /><span className="text-2xl">🇸🇦</span></div>, rate: rates.sar },
                { type: 'AED', label: 'AED 🇦🇪', icon: <div className="flex items-center gap-1"><DollarSign className="w-8 h-8 text-teal-500" /><span className="text-2xl">🇦🇪</span></div>, rate: rates.aed },
                { type: 'GBP', label: 'GBP 🇬🇧', icon: <div className="flex items-center gap-1"><DollarSign className="w-8 h-8 text-purple-500" /><span className="text-2xl">🇬🇧</span></div>, rate: rates.gbp },
                { type: 'KWD', label: 'KWD 🇰🇼', icon: <div className="flex items-center gap-1"><DollarSign className="w-8 h-8 text-amber-600" /><span className="text-2xl">🇰🇼</span></div>, rate: rates.kwd }
              ].map((item) => (
                <button 
                  key={item.type}
                  onClick={() => {
                    setSelectedInvestmentType(item.type);
                    setShowInvestmentModal(true);
                  }}
                  className={`relative p-8 rounded-[2.5rem] ${isDark ? 'bg-slate-900/80 border-slate-700/50' : 'bg-white border-slate-200'} border group transition-all duration-500 hover:-translate-y-2 hover:border-amber-500/50 hover:shadow-2xl hover:shadow-amber-500/10 overflow-hidden text-left`}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="mb-6 transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 flex justify-start">{item.icon}</div>
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 mb-2">{item.label}</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-xl font-black text-white group-hover:text-amber-500 transition-colors">
                      {item.rate?.toLocaleString() || '---'}
                    </p>
                    <span className="text-[10px] text-slate-500 font-black uppercase">EGP</span>
                  </div>
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
                      <p className="text-xs font-black uppercase tracking-widest text-slate-500 mt-1">Live Asset Valuation</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-widest text-emerald-500">Market Open</span>
                  </div>
                </div>

                <div className="divide-y divide-slate-800/50">
                {savingsData?.investments
                    .filter(inv => activeTab === 'currencies' ? ![ 'gold', 'silver' ].includes(inv.type.toLowerCase()) : inv.type.toLowerCase() === activeTab)
                    .map((inv) => {
                      const profit = inv.current_value - (inv.buy_price * inv.amount);
                      const isProfit = profit >= 0;
                      const yieldPercent = ( (profit / (inv.buy_price * inv.amount)) * 100).toFixed(1);
                      const flagMap = {
                        'USD': '🇺🇸', 'EUR': '🇪🇺', 'GBP': '🇬🇧', 'SAR': '🇸🇦', 'AED': '🇦🇪',
                        'KWD': '🇰🇼', 'QAR': '🇶🇦', 'BHD': '🇧🇭', 'OMR': '🇴🇲', 'JOD': '🇯🇴',
                        'TRY': '🇹🇷', 'CAD': '🇨🇦', 'AUD': '🇦🇺',
                      };
                      const flag = flagMap[inv.type.toUpperCase()] || '';
                      
                      const getIcon = () => {
                        if (inv.type.toLowerCase() === 'gold') return <Coins className="w-6 h-6 text-amber-500" />;
                        if (inv.type.toLowerCase() === 'silver') return <Coins className="w-6 h-6 text-slate-400" />;
                        return (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-5 h-5 text-emerald-500" />
                            <span className="text-xl">{flag}</span>
                          </div>
                        );
                      };

                      return (
                        <div key={inv.id} className="p-10 flex flex-col md:flex-row md:items-center justify-between group hover:bg-slate-800/20 transition-all duration-300">
                          <div className="flex items-center gap-8 mb-6 md:mb-0">
                            <div className="w-20 h-16 rounded-[1.5rem] bg-slate-800 flex items-center justify-center text-3xl border border-slate-700 group-hover:scale-110 group-hover:border-amber-500/30 transition-all duration-500 shadow-xl px-2">
                              {getIcon()}
                            </div>
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <p className="text-xl font-black">
                                  {inv.amount.toLocaleString()} {['gold', 'silver'].includes(inv.type.toLowerCase()) ? 'Grams' : inv.type}
                                </p>
                                <div className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter ${isProfit ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                  {isProfit ? '+' : ''}{yieldPercent}%
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-slate-500">
                                <span>Buy @ {inv.buy_price.toLocaleString()}</span>
                                <div className="w-1 h-1 rounded-full bg-slate-700" />
                                <span>{new Date(inv.buy_date).toLocaleDateString('en-EG', { day: '2-digit', month: 'short' })}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-12">
                            <div className="text-right">
                              <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Live Value</p>
                              <div className="flex items-baseline justify-end gap-2">
                                <p className="text-2xl font-black text-white">{inv.current_value.toLocaleString()}</p>
                                <span className="text-[10px] text-slate-500 font-black uppercase">EGP</span>
                              </div>
                            </div>
                            <div className="text-right min-w-[120px]">
                              <div className="flex items-center justify-end gap-2 mb-1">
                                {isProfit ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-rose-500" />}
                                <p className={`text-xl font-black ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                                  {isProfit ? '+' : ''}{profit.toLocaleString()}
                                </p>
                              </div>
                              <p className={`text-xs font-black uppercase tracking-widest ${isProfit ? 'text-emerald-500/60' : 'text-rose-500/60'}`}>
                                Total Yield
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
                  {savingsData?.investments.filter(inv => activeTab === 'currencies' ? ![ 'gold', 'silver' ].includes(inv.type.toLowerCase()) : inv.type.toLowerCase() === activeTab).length === 0 && (
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
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">Monthly Savings Goal</p>
              </div>
            </div>
            <form onSubmit={handleUpdateGoal} className="space-y-8">
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Target Amount (EGP)</label>
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
          <span className="text-xs font-bold uppercase tracking-[0.2em]">
            Market rates are automatically synced 3 times daily (8AM, 2PM, 8PM EET)
          </span>
        </div>
      </div>
    </div>
  );
};

export default Savings;