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
  ArrowUpRight,
  Flag
} from "lucide-react";
import { formatAISummary, getModelInfo } from './DashboardUtils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";


/* --------------------------------------------------------------- *
 *  TRADINGVIEW CHART COMPONENT
 * --------------------------------------------------------------- */
const TradingViewChart = ({ symbol, isDark, height = 300, dateRange = "12M" }) => {
  const container = React.useRef();

  useEffect(() => {
    if (!container.current) return;
    
    // Clear previous chart
    container.current.innerHTML = '';
    
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      "symbol": symbol,
      "width": "100%",
      "height": height,
      "locale": "en",
      "dateRange": dateRange,
      "colorTheme": isDark ? "dark" : "light",
      "trendLineColor": "#3b82f6",
      "underLineColor": isDark ? "rgba(59, 130, 246, 0.15)" : "rgba(59, 130, 246, 0.1)",
      "underLineBottomColor": "rgba(59, 130, 246, 0)",
      "isTransparent": false,
      "autosize": true,
      "largeChartUrl": ""
    });
    container.current.appendChild(script);
  }, [symbol, isDark, height, dateRange]);

  return (
    <div 
      key={`${symbol}-${isDark}-${dateRange}`}
      className="tradingview-widget-container rounded-2xl overflow-hidden" 
      ref={container} 
      style={{ height: `${height}px`, width: '100%' }}
    >
      <div className="tradingview-widget-container__widget"></div>
    </div>
  );
};

/* --------------------------------------------------------------- *
 *  INVESTMENT FORM (INLINE)
 * --------------------------------------------------------------- */
const InvestmentForm = ({ onClose, onAddInvestment, isDark, rates, categories, cashBalance, monthlyGoal, monthlySaved, loadAll }) => {
  const [activeTab, setActiveTab] = useState('gold'); // 'gold', 'silver', 'currency', 'cash'
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [amount, setAmount] = useState('');
  const [buyDate, setBuyDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [chartRange, setChartRange] = useState('12M');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [isExpense, setIsExpense] = useState(false);
  const [withdrawalReason, setWithdrawalReason] = useState('');
  const [showWithdrawalWarning, setShowWithdrawalWarning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savingsCat = categories.find(c => c.name?.toLowerCase().includes("savings"));
    const isSavings = selectedCategoryId === String(savingsCat?.id);
    const numAmount = parseFloat(amount);
    const isWithdrawal = isSavings && !isExpense && numAmount > 0 && !isNaN(numAmount);
    setShowWithdrawalWarning(isWithdrawal);
    if (!isWithdrawal) setWithdrawalReason('');
  }, [selectedCategoryId, isExpense, amount, categories]);

  useEffect(() => {
    if (activeTab === 'cash') {
      const savingsCat = categories.find(c => c.name?.toLowerCase().includes("savings"));
      if (savingsCat) setSelectedCategoryId(String(savingsCat.id));
    } else {
      setSelectedCategoryId('');
      setIsExpense(false);
      setWithdrawalReason('');
    }
  }, [activeTab, categories]);

  const currencyOptions = useMemo(() => [
    { id: 'USD', name: 'US Dollar', code: 'us', symbol: 'FX_IDC:USDEGP' },
    { id: 'EUR', name: 'Euro', code: 'eu', symbol: 'FX_IDC:EUREGP' },
    { id: 'GBP', name: 'British Pound', code: 'gb', symbol: 'FX_IDC:GBPEGP' },
    { id: 'SAR', name: 'Saudi Riyal', code: 'sa', symbol: 'FX_IDC:SAREGP' },
    { id: 'AED', name: 'UAE Dirham', code: 'ae', symbol: 'FX_IDC:AEDEGP' },
    { id: 'KWD', name: 'Kuwaiti Dinar', code: 'kw', symbol: 'FX_IDC:KWDEGP' },
    { id: 'QAR', name: 'Qatari Rial', code: 'qa', symbol: 'FX_IDC:QAREGP' },
    { id: 'BHD', name: 'Bahraini Dinar', code: 'bh', symbol: 'FX_IDC:BHDEGP' },
    { id: 'OMR', name: 'Omani Rial', code: 'om', symbol: 'FX_IDC:OMREGP' },
    { id: 'JOD', name: 'Jordanian Dinar', code: 'jo', symbol: 'FX_IDC:JODEGP' },
    { id: 'CAD', name: 'Canadian Dollar', code: 'ca', symbol: 'FX_IDC:CADEGP' },
    { id: 'AUD', name: 'Australian Dollar', code: 'au', symbol: 'FX_IDC:AUDEGP' },
    { id: 'TRY', name: 'Turkish Lira', code: 'tr', symbol: 'FX_IDC:TRYEGP' },
  ], []);

  const currentRate = useMemo(() => {
    if (!rates) return 0;
    if (activeTab === 'gold') return rates.gold || 0;
    if (activeTab === 'silver') return rates.silver || 0;
    if (activeTab === 'cash') return 1;
    return rates[selectedCurrency.toLowerCase()] || 0;
  }, [activeTab, selectedCurrency, rates]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError('');
    setSuccess(false);
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    if (showWithdrawalWarning && !withdrawalReason) {
      alert("Please select a withdrawal reason");
      return;
    }

    setIsSubmitting(true);
    const type = activeTab === 'currency' ? selectedCurrency : activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
    try {
      if (activeTab === 'cash') {
        const finalAmount = isExpense ? Math.abs(numAmount) : -Math.abs(numAmount);
        const finalDescription = showWithdrawalWarning 
          ? `Withdrawal: ${withdrawalReason}` 
          : "Savings transaction";
        
        await createTransaction(selectedCategoryId, finalAmount, finalDescription, buyDate);
      } else {
        await onAddInvestment({ type, amount: numAmount, buy_date: buyDate });
      }

      // Reset form fully on success
      setAmount('');
      setBuyDate(new Date().toISOString().split('T')[0]);
      setWithdrawalReason('');
      setIsExpense(false);

      setSuccess(true);
      
      // Trigger immediate refresh
      if (typeof loadAll === 'function') {
        await loadAll();
      }
      window.dispatchEvent(new CustomEvent('transaction-added'));

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#10b981', '#fbbf24']
      });
      
      setTimeout(() => {
        setSuccess(false);
        // Focus the amount input after success message disappears
        setTimeout(() => {
          const amountInput = document.getElementById('investment-amount-input');
          if (amountInput) amountInput.focus();
        }, 100);
        
        // Scroll to top of the form area
        const formElement = document.getElementById('investment-form-top');
        if (formElement) {
          formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 5000);
    } catch (err) {
      setError(activeTab === 'cash' ? 'Failed to process transaction.' : 'Failed to add investment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeTheme = useMemo(() => {
    if (activeTab === 'gold') return {
      primary: 'amber-500',
      secondary: 'amber-600',
      bg: isDark ? 'bg-amber-500/10' : 'bg-amber-50',
      text: 'text-amber-500',
      shadow: 'shadow-amber-500/20',
      accent: 'amber',
      symbol: 'FX_IDC:XAUUSD',
      label: 'Gold Bullion',
      status: 'Bullish',
      statusColor: 'text-emerald-500',
      volume: 'High',
      icon: <Sparkles className="w-5 h-5" />
    };
    if (activeTab === 'silver') return {
      primary: 'slate-400',
      secondary: 'slate-500',
      bg: isDark ? 'bg-slate-400/10' : 'bg-slate-50',
      text: 'text-slate-400',
      shadow: 'shadow-slate-400/20',
      accent: 'slate',
      symbol: 'FX_IDC:XAGUSD',
      label: 'Silver Bullion',
      status: 'Consolidating',
      statusColor: 'text-blue-400',
      volume: 'Moderate',
      icon: <Gem className="w-5 h-5" />
    };
    if (activeTab === 'cash') return {
      primary: 'emerald-500',
      secondary: 'emerald-600',
      bg: isDark ? 'bg-emerald-500/10' : 'bg-emerald-50',
      text: 'text-emerald-500',
      shadow: 'shadow-emerald-500/20',
      accent: 'emerald',
      symbol: 'FX_IDC:USDEGP', // Placeholder
      label: 'Cash Savings',
      status: 'Stable',
      statusColor: 'text-emerald-500',
      volume: 'N/A',
      icon: <Wallet className="w-5 h-5" />
    };
    const curr = currencyOptions.find(c => c.id === selectedCurrency);
    return {
      primary: 'blue-600',
      secondary: 'blue-700',
      bg: isDark ? 'bg-blue-600/10' : 'bg-blue-50',
      text: 'text-blue-600',
      shadow: 'shadow-blue-600/20',
      accent: 'blue',
      symbol: curr?.symbol || 'FX_IDC:USDEGP',
      label: curr?.name || 'US Dollar',
      status: 'Volatile',
      statusColor: 'text-amber-500',
      volume: 'Very High',
      icon: <Banknote className="w-5 h-5" />
    };
  }, [activeTab, isDark, selectedCurrency, currencyOptions]);

  const accentColor = activeTheme.accent;

  return (
    <div id="investment-form-top" className={`relative w-full overflow-hidden flex flex-col lg:flex-row rounded-[1.5rem] md:rounded-[2.5rem] border ${isDark ? `bg-slate-900 border-slate-700 shadow-[0_20px_50px_rgba(0,0,0,0.3)] ${activeTheme.shadow}` : `bg-white border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.1)] ${activeTheme.shadow}`} z-10 animate-in fade-in slide-in-from-top-8 duration-700 mb-8`}>
      
      {/* Decorative Background Gradients */}
      <div className={`absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 blur-[120px] opacity-20 -z-10 transition-colors duration-700 ${
        accentColor === 'amber' ? 'bg-amber-500' : 
        accentColor === 'slate' ? 'bg-slate-400' : 
        accentColor === 'emerald' ? 'bg-emerald-500' :
        'bg-blue-600'
      }`} />

      {/* Left Sidebar - Navigation */}
      <div className={`w-full lg:w-72 p-6 md:p-8 flex flex-col border-b lg:border-b-0 lg:border-r ${isDark ? 'border-slate-700 bg-slate-900/40' : 'border-slate-100 bg-slate-50/50'}`}>
        <div className="flex items-center gap-3 mb-6 md:mb-10">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
            <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <div>
            <h3 className={`text-base md:text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>New Asset</h3>
            <p className={`text-[8px] md:text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Investment Portal</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 md:gap-3 flex-1">
          <button 
            onClick={() => setActiveTab('gold')}
            className={`p-3 md:p-4 rounded-xl md:rounded-2xl flex items-center gap-3 md:gap-4 transition-all duration-300 ${activeTab === 'gold' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-white text-slate-500'}`}
          >
            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center ${activeTab === 'gold' ? 'bg-white/20' : isDark ? 'bg-slate-800' : 'bg-white'}`}>
              <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <span className="text-[10px] md:text-sm font-black uppercase tracking-wider">Gold</span>
          </button>

          <button 
            onClick={() => setActiveTab('silver')}
            className={`p-3 md:p-4 rounded-xl md:rounded-2xl flex items-center gap-3 md:gap-4 transition-all duration-300 ${activeTab === 'silver' ? 'bg-slate-400 text-white shadow-lg shadow-slate-400/20' : isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-white text-slate-500'}`}
          >
            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center ${activeTab === 'silver' ? 'bg-white/20' : isDark ? 'bg-slate-800' : 'bg-white'}`}>
              <Gem className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <span className="text-[10px] md:text-sm font-black uppercase tracking-wider">Silver</span>
          </button>

          <button 
            onClick={() => setActiveTab('currency')}
            className={`p-3 md:p-4 rounded-xl md:rounded-2xl flex items-center gap-3 md:gap-4 transition-all duration-300 ${activeTab === 'currency' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-white text-slate-500'}`}
          >
            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center ${activeTab === 'currency' ? 'bg-white/20' : isDark ? 'bg-slate-800' : 'bg-white'}`}>
              <Banknote className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <span className="text-[10px] md:text-sm font-black uppercase tracking-wider">Currency</span>
          </button>

          <button 
            onClick={() => setActiveTab('cash')}
            className={`p-3 md:p-4 rounded-xl md:rounded-2xl flex items-center gap-3 md:gap-4 transition-all duration-300 ${activeTab === 'cash' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-white text-slate-500'}`}
          >
            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center ${activeTab === 'cash' ? 'bg-white/20' : isDark ? 'bg-slate-800' : 'bg-white'}`}>
              <Wallet className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <span className="text-[10px] md:text-sm font-black uppercase tracking-wider">Cash</span>
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

      {/* Right Content - Form and Chart */}
      <div className={`flex-1 flex flex-col ${isDark ? 'bg-slate-900/50' : 'bg-white'}`}>
        {!success && (
          <div className={`p-5 md:p-8 lg:p-10 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'} flex items-center justify-between`}>
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-2xl ${activeTheme.bg} ${activeTheme.text}`}>
                {activeTheme.icon}
              </div>
              <div>
                <h2 className={`text-lg md:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {activeTab === 'currency' ? selectedCurrency : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </h2>
                <p className={`text-[8px] md:text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Market Performance</p>
              </div>
            </div>
            <button onClick={onClose} className={`p-2 rounded-2xl ${isDark ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-100 text-slate-400'} transition-all`}>
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {success ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-500">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-[2rem] md:rounded-[2.5rem] bg-emerald-500 flex items-center justify-center text-white mb-6 shadow-2xl shadow-emerald-500/20">
            <Sparkles className="w-8 h-8 md:w-10 md:h-10" />
          </div>
          <h3 className={`text-xl md:text-2xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Success!</h3>
          <p className={`text-xs md:text-sm font-bold uppercase tracking-[0.2em] mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Transaction processed successfully</p>
          <div className="px-5 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-8 animate-pulse">
            Vault Updated Successfully
          </div>
          <button 
            onClick={() => {
              setSuccess(false);
              onClose();
            }}
            className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-slate-800 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-all"
          >
            Back to Vault
          </button>
        </div>
      ) : (
          <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
            {/* Chart Section */}
            {activeTab !== 'cash' && (
              <div className={`w-full lg:w-1/2 p-4 md:p-8 border-b lg:border-b-0 lg:border-r ${isDark ? 'border-slate-800 bg-slate-800/20' : 'border-slate-100 bg-slate-50/50'} transition-opacity duration-500 ${showWithdrawalWarning ? 'opacity-40' : 'opacity-100'}`}>
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Performance</span>
                  <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
                    {[
                      { label: '1M', value: '1M' },
                      { label: '3M', value: '3M' },
                      { label: '12M', value: '12M' },
                      { label: '60M', value: '60M' },
                      { label: 'ALL', value: 'ALL' }
                    ].map((range) => (
                      <button
                        key={range.value}
                        type="button"
                        onClick={() => setChartRange(range.value)}
                        className={`text-[8px] md:text-[9px] font-black px-2 py-1 rounded-lg transition-all active:scale-95 whitespace-nowrap ${
                          chartRange === range.value 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                            : isDark ? 'bg-slate-800 text-slate-500 hover:text-slate-300' : 'bg-white text-slate-400 hover:text-slate-600 shadow-sm'
                        }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
               </div>
               <div className="rounded-2xl md:rounded-3xl overflow-hidden border-2 border-slate-200/10 bg-slate-900/40 p-1 mb-4 md:mb-6">
                  <TradingViewChart symbol={activeTheme.symbol} isDark={isDark} height={180} dateRange={chartRange} />
               </div>
               <div className="grid grid-cols-2 gap-2 md:gap-4">
                  <div className={`p-3 md:p-5 rounded-2xl md:rounded-3xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                    <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest block mb-1 md:mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Status</span>
                    <div className={`flex items-center gap-1.5 md:gap-2 ${activeTheme.statusColor} font-black`}>
                      <TrendingUp className="w-3 md:w-4 h-3 md:h-4" />
                      <span className="text-[10px] md:text-sm">{activeTheme.status}</span>
                    </div>
                  </div>
                  <div className={`p-3 md:p-5 rounded-2xl md:rounded-3xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                    <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest block mb-1 md:mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Volume</span>
                    <span className={`text-[10px] md:text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{activeTheme.volume}</span>
                  </div>
               </div>
            </div>
            )}

            {/* Form Section */}
            <div className={`w-full ${activeTab === 'cash' ? '' : 'lg:w-1/2'} p-4 md:p-8 lg:p-10`}>
            {error && (
              <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in shake">
                <AlertCircle className="w-5 h-5" /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {activeTab === 'cash' && (
                <div className="space-y-4">
                  <div>
                    <label className={`block text-xs font-black uppercase tracking-[0.2em] mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Type</label>
                    <div className="flex flex-col sm:flex-row gap-2 p-1 rounded-2xl border border-slate-200/10 bg-slate-900/20">
                      <button
                        type="button"
                        onClick={() => setIsExpense(false)}
                        className={`flex-1 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${!isExpense ? 'bg-rose-500 text-white shadow-lg' : isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-white text-slate-500'}`}
                      >
                        Withdraw
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsExpense(true)}
                        className={`flex-1 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${isExpense ? 'bg-emerald-500 text-white shadow-lg' : isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-white text-slate-500'}`}
                      >
                        Deposit
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'currency' && (
                <div>
                  <label className={`block text-xs font-black uppercase tracking-[0.2em] mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Currency</label>
                  <div className="flex gap-2 p-2 rounded-2xl border border-slate-200/10 bg-slate-900/20 overflow-x-auto pb-3">
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
                    Amount {['gold', 'silver'].includes(activeTab) ? '(g)' : activeTab === 'cash' ? '(EGP)' : `(${selectedCurrency})`}
                  </label>
                  <div className="relative">
                    <input 
                      id="investment-amount-input"
                      type="number" 
                      step="0.01" 
                      value={amount} 
                      onChange={(e) => setAmount(e.target.value)} 
                      className={`w-full p-3.5 md:p-4 rounded-2xl text-lg font-black outline-none border-2 transition-all ${isDark ? 'bg-slate-800/50 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-blue-600'}`} 
                      placeholder="0.00" 
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500">
                      {['gold', 'silver'].includes(activeTab) ? 'g' : activeTab === 'cash' ? 'EGP' : selectedCurrency}
                    </div>
                  </div>
                </div>
                <div>
                  <label className={`block text-xs font-black uppercase tracking-[0.2em] mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Date</label>
                  <input 
                    type="date" 
                    value={buyDate} 
                    onChange={(e) => setBuyDate(e.target.value)} 
                    className={`w-full p-3.5 md:p-4 rounded-2xl text-lg font-black outline-none border-2 transition-all ${isDark ? 'bg-slate-800/50 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-blue-600'}`} 
                  />
                </div>
              </div>

              {(showWithdrawalWarning || activeTab === 'cash') && (
                <div className={`p-5 md:p-6 rounded-3xl border-2 animate-in fade-in slide-in-from-top-4 duration-500 ${showWithdrawalWarning ? 'bg-rose-500/10 border-rose-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                  {showWithdrawalWarning && (
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-2 bg-rose-500 rounded-xl text-white shrink-0">
                        <AlertCircle className="w-4 h-4 md:w-5 md:h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs md:text-sm font-black text-rose-500 uppercase tracking-wider">Withdrawal from Vault</h4>
                        <p className={`text-[9px] md:text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>This will reduce your total balance.</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {showWithdrawalWarning && (
                      <div>
                        <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Reason</label>
                        <select
                          value={withdrawalReason}
                          onChange={(e) => setWithdrawalReason(e.target.value)}
                          className={`w-full p-3 rounded-xl text-xs font-black outline-none border-2 transition-all ${isDark ? 'bg-slate-900/50 border-slate-800 text-white focus:border-rose-500' : 'bg-white border-slate-100 text-slate-900 focus:border-rose-500'}`}
                          required
                        >
                          <option value="">Select...</option>
                          <option value="Emergency">Emergency</option>
                          <option value="Large purchase">Large purchase</option>
                          <option value="Cash flow">Cash flow</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    )}

                    <div className={`p-4 rounded-2xl ${isDark ? 'bg-slate-900/50' : 'bg-white/50'} border ${showWithdrawalWarning ? 'border-rose-500/10' : 'border-emerald-500/10'}`}>
                      <span className={`text-[9px] font-black uppercase tracking-widest block mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Preview</span>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className={`text-[9px] md:text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{isExpense ? 'Deposit' : 'Withdrawal'}</span>
                          <span className={`text-[10px] md:text-xs font-black ${isExpense ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {isExpense ? '+' : '-'}{parseFloat(amount || 0).toLocaleString()} EGP
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={`text-[9px] md:text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>New Balance</span>
                          <span className={`text-[10px] md:text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {(isExpense ? (cashBalance || 0) + parseFloat(amount || 0) : (cashBalance || 0) - parseFloat(amount || 0)).toLocaleString()} EGP
                          </span>
                        </div>
                        {!isExpense && monthlyGoal > 0 && (
                          <div className="pt-2 border-t border-rose-500/10">
                            <p className="text-[8px] md:text-[9px] font-bold text-rose-500/80 italic">
                              * Goal impact: -{Math.round((parseFloat(amount || 0) / monthlyGoal) * 100)}%
                            </p>
                          </div>
                        )}
                        {isExpense && monthlyGoal > 0 && (
                          <div className="pt-2 border-t border-emerald-500/10">
                            <p className="text-[8px] md:text-[9px] font-bold text-emerald-500/80 italic">
                              * Goal impact: +{Math.round((parseFloat(amount || 0) / monthlyGoal) * 100)}%
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 md:pt-4">
                <div className={`p-4 md:p-5 rounded-2xl border-2 border-dashed ${isDark ? 'border-slate-800 bg-slate-900/30' : 'border-slate-100 bg-slate-50/50'} mb-6`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Value</span>
                    <span className="text-lg md:text-xl font-black text-blue-600">{(currentRate * (parseFloat(amount) || 0)).toLocaleString()} EGP</span>
                  </div>
                </div>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className={`w-full py-4 rounded-2xl text-[10px] md:text-sm font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-white transition-all transform hover:scale-[1.01] active:scale-95 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${showWithdrawalWarning ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-600/20' : activeTab === 'gold' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-600/20' : activeTab === 'silver' ? 'bg-slate-400 hover:bg-slate-500 shadow-slate-400/20' : activeTab === 'cash' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-600/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'}`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Updating Vault...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Plus className="w-4 h-4" />
                      <span>
                        {isExpense && activeTab === 'cash' ? 'Deposit' :
                         !isExpense && showWithdrawalWarning ? 'Confirm Withdrawal' :
                         activeTab === 'cash' ? 'Withdraw' :
                         'Secure Investment'}
                      </span>
                    </div>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
  const [growthRange, setGrowthRange] = useState('7D');
  const [isPortfolioExpanded, setIsPortfolioExpanded] = useState(false);
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
      // Load essential data first
      const [cats, sData, txns] = await Promise.all([
        getCategories(),
        getSavingsData(),
        getTransactions(),
      ]);
      
      setCategories(cats || []);
      setSavings(sData || {});
      setTransactions(txns?.transactions || []);
      if (sData?.monthly_goal) setMonthlyGoalInput(String(sData.monthly_goal));

      // Load rates separately so they don't block the whole page if they fail (e.g. rate limited)
      try {
        const r = await getSavingsRates(false);
        setRates(r || {});
      } catch (rateErr) {
        console.warn("Could not load market rates:", rateErr);
        // We don't set the main error state here so the vault still opens
      }
    } catch (e) {
        console.error("Load savings error", e);
        setError(e.message || "Unable to load savings data.");
      } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();

    // Listen for transaction-added event to refresh data
    const handleTransactionAdded = () => {
      loadAll();
    };
    window.addEventListener('transaction-added', handleTransactionAdded);

    return () => {
      window.removeEventListener('transaction-added', handleTransactionAdded);
    };
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

  const distributionData = useMemo(() => {
    const data = [
      { name: 'Cash', value: savings?.cash_balance || 0, color: '#3b82f6' }
    ];
    
    const types = {};
    investments.forEach(inv => {
      const t = inv.type || 'Other';
      types[t] = (types[t] || 0) + (inv.current_value || 0);
    });

    Object.entries(types).forEach(([name, value]) => {
      let color = '#94a3b8';
      if (name.toLowerCase() === 'gold') color = '#f59e0b';
      if (name.toLowerCase() === 'silver') color = '#94a3b8';
      if (['usd', 'eur', 'gbp'].includes(name.toLowerCase())) color = '#10b981';
      data.push({ name, value, color });
    });

    return data.filter(d => d.value > 0);
  }, [savings, investments]);

  const growthData = useMemo(() => {
    // Generate some mock historical data points leading to current totalWealth based on selected range
    const rangeMap = {
      '7D': 7,
      '1M': 30,
      '3M': 90,
      '1Y': 365
    };
    const points = rangeMap[growthRange] || 7;
    const data = [];
    let startVal = totalWealth * (growthRange === '7D' ? 0.95 : growthRange === '1M' ? 0.85 : growthRange === '3M' ? 0.75 : 0.6);
    let current = startVal;
    
    // To avoid too many points in Recharts, we sample
    const sampleSize = growthRange === '1Y' ? 12 : growthRange === '3M' ? 10 : 7;
    
    for (let i = 0; i < sampleSize; i++) {
      const date = new Date();
      if (growthRange === '1Y') {
        date.setMonth(date.getMonth() - (sampleSize - 1 - i));
      } else {
        const daysAgo = points - 1 - (i * (points / sampleSize));
        date.setDate(date.getDate() - daysAgo);
      }
      
      data.push({
        date: date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: growthRange === '1Y' ? undefined : 'numeric' 
        }),
        value: Math.round(current)
      });
      
      current += (totalWealth - startVal) / (sampleSize - 1) + (Math.random() - 0.5) * (totalWealth * 0.02);
    }
    
    // Ensure last point is exactly totalWealth
    if (data.length > 0) {
      data[data.length - 1].value = Math.round(totalWealth);
      data[data.length - 1].date = 'Now';
    }
    
    return data;
  }, [totalWealth, growthRange]);

  // Quick allocate into savings
  const handleAllocate = async (e) => {
    e?.preventDefault();
    const amount = parseFloat(monthlyInput);
    if (!amount || isNaN(amount) || amount <= 0) return;
    try {
      let savingsCat = categories.find(c => c.name?.toLowerCase().includes("savings"));
      if (!savingsCat) savingsCat = await initSavingsCategory();
      
      // Sending POSITIVE amount as requested for Quick Deposit
      await createTransaction(savingsCat.id, Math.abs(amount), "Quick deposit to savings", new Date().toISOString().split("T")[0]);
      
      setMonthlyInput("");
      await loadAll();
      window.dispatchEvent(new CustomEvent('transaction-added'));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddInvestment = async (investmentData) => {
    try {
      await createInvestment(investmentData);
      await loadAll();
      window.dispatchEvent(new CustomEvent('transaction-added'));
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
      window.dispatchEvent(new CustomEvent('transaction-added'));
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
            <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'} relative overflow-hidden group border-2 ${isDark ? 'hover:border-blue-500/30 shadow-blue-900/20' : 'hover:border-blue-200 shadow-blue-600/10'} transition-all duration-500 shadow-xl`}>
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
            <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'} relative overflow-hidden group border-2 ${isDark ? 'hover:border-blue-500/30 shadow-blue-900/20' : 'hover:border-blue-200 shadow-blue-600/10'} transition-all duration-500 shadow-xl`}>
              <div className="flex items-center justify-between mb-6">
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Vault Balance
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

            {/* Quick Deposit - Moved to Top */}
            <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'} relative overflow-hidden group border-2 ${isDark ? 'border-blue-600/20 hover:border-blue-600/40' : 'border-blue-100 hover:border-blue-200'} transition-all duration-500 shadow-xl`}>
              <div className="flex items-center justify-between mb-4">
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                  Quick Deposit
                </span>
                <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-600/10' : 'bg-blue-50'} text-blue-600`}>
                  <Plus className="w-4 h-4" />
                </div>
              </div>
              <form onSubmit={handleAllocate} className="relative z-10 space-y-3">
                <div className="relative">
                  <input 
                    type="number"
                    value={monthlyInput} 
                    onChange={(e)=>setMonthlyInput(e.target.value)} 
                    placeholder="0.00" 
                    className={`w-full rounded-xl pl-8 pr-4 py-2.5 text-lg font-black ${isDark ? 'bg-slate-900/50 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} border-2 outline-none focus:border-blue-600 transition-all`} 
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-slate-500">£</span>
                </div>
                <button type="submit" className="w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all active:scale-95">
                  Add to Vault
                </button>
              </form>
              <div className="absolute -right-8 -bottom-8 w-24 h-24 rounded-full bg-blue-600 blur-[40px] opacity-5" />
            </div>

            {/* Monthly Goal Card */}
            <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'} relative overflow-hidden group border-2 ${isDark ? 'hover:border-blue-500/30 shadow-blue-900/20' : 'hover:border-blue-200 shadow-blue-600/10'} transition-all duration-500 shadow-xl`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col">
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    Monthly Goal
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {Math.round(monthlyProgress)}%
                    </span>
                    <button 
                      onClick={() => setIsEditingGoal(!isEditingGoal)}
                      className={`p-1 rounded-md transition-all ${isDark ? 'hover:bg-slate-700 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}`}
                    >
                      <Target className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-600/20 text-blue-600">
                  <Flag className="w-6 h-6" />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-col">
                  <span className={`text-[9px] font-black uppercase tracking-wider ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Progress</span>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{fmt(monthlySaved)}</span>
                    <span className={`text-[10px] font-bold ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>/ {fmt(monthlyGoal)}</span>
                  </div>
                </div>

                <div className="relative h-2.5 w-full rounded-full overflow-hidden bg-slate-800/20">
                  <div 
                    className={`h-full transition-all duration-1000 ease-out rounded-full ${
                      monthlyProgress >= 100 ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-blue-600 shadow-blue-600/20'
                    }`}
                    style={{ width: `${Math.min(100, monthlyProgress)}%` }}
                  />
                </div>
              </div>

              {isEditingGoal && (
                <div className="absolute inset-0 z-20 flex items-center px-4 bg-slate-900/95 animate-in fade-in duration-300">
                  <form onSubmit={saveMonthlyGoal} className="flex-1 flex flex-col gap-2">
                    <input 
                      autoFocus
                      value={monthlyGoalInput} 
                      onChange={(e)=>setMonthlyGoalInput(e.target.value)} 
                      placeholder="Target EGP" 
                      className="w-full rounded-xl px-3 py-2 text-xs font-bold bg-slate-800 border-2 border-slate-700 text-white outline-none focus:border-blue-600 transition-all" 
                    />
                    <div className="flex gap-2">
                      <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-black text-[9px] uppercase tracking-wider">
                        Save
                      </button>
                      <button type="button" onClick={() => setIsEditingGoal(false)} className="p-2 rounded-lg bg-slate-700 text-slate-300">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </form>
                </div>
              )}
              <div className="absolute -right-12 -bottom-12 w-32 h-32 rounded-full bg-blue-600 blur-[60px] opacity-10" />
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
              categories={categories}
              cashBalance={savings?.cash_balance || 0}
              monthlyGoal={monthlyGoal}
              monthlySaved={monthlySaved}
              loadAll={loadAll}
            />
          </div>
        )}

        {/* Portfolio Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          {/* Distribution Chart */}
          <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'} lg:col-span-1 border-2 ${isDark ? 'border-slate-800 shadow-blue-900/10' : 'border-slate-50 shadow-blue-600/5'} shadow-xl group hover:border-blue-500/30 transition-all duration-500`}>
            <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-8 flex items-center gap-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              <PieChartIcon className="w-3 h-3 text-blue-600" /> Asset Distribution
            </h3>
            <div className="h-[240px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? '#1e293b' : '#ffffff', 
                      border: 'none', 
                      borderRadius: '1rem',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                    itemStyle={{ color: isDark ? '#f1f5f9' : '#1e293b' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    content={({ payload }) => (
                      <div className="flex flex-wrap justify-center gap-4 mt-4">
                        {payload.map((entry, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
                            <span className={`text-[10px] font-black uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                              {entry.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Content for Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mb-10">
                <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Total</span>
                <span className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{fmt(totalWealth)}</span>
              </div>
            </div>
          </div>

          {/* Performance Chart */}
          <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'} lg:col-span-2 border-2 ${isDark ? 'border-slate-800 shadow-blue-900/10' : 'border-slate-50 shadow-blue-600/5'} shadow-xl group hover:border-blue-500/30 transition-all duration-500`}>
            <div className="flex items-center justify-between mb-8">
              <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                <TrendingUp className="w-3 h-3 text-emerald-500" /> Growth Trajectory
              </h3>
              <div className="flex gap-2">
                {['7D', '1M', '3M', '1Y'].map(t => (
                  <span 
                    key={t} 
                    onClick={() => setGrowthRange(t)}
                    className={`text-[9px] font-black px-3 py-1.5 rounded-xl cursor-pointer transition-all active:scale-95 ${
                      growthRange === t 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                        : isDark ? 'bg-slate-800 text-slate-500 hover:text-slate-300' : 'bg-slate-100 text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: isDark ? '#64748b' : '#94a3b8', fontSize: 10, fontWeight: 700 }}
                    dy={10}
                  />
                  <YAxis 
                    hide 
                    domain={['auto', 'auto']}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? '#1e293b' : '#ffffff', 
                      border: 'none', 
                      borderRadius: '1rem',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                    formatter={(value) => [`EGP ${value.toLocaleString()}`, 'Portfolio Value']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

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
                  <div className="flex items-center gap-4">
                    <div className={`hidden md:block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                      {investments.length} Active Assets
                    </div>
                    {investments.length > 4 && (
                      <button 
                        onClick={() => setIsPortfolioExpanded(!isPortfolioExpanded)}
                        className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-xl transition-all ${
                          isDark 
                            ? 'bg-blue-600/10 text-blue-400 hover:bg-blue-600/20' 
                            : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                        }`}
                      >
                        {isPortfolioExpanded ? 'Show Less' : 'View All'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-700 ease-in-out ${
                    !isPortfolioExpanded && investments.length > 4 ? 'max-h-[600px] overflow-hidden' : 'max-h-[2000px]'
                  }`}>
                    {investments.length === 0 ? (
                      <div className={`col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed ${isDark ? 'border-slate-800' : 'border-slate-100'} rounded-[2rem]`}>
                        <PieChartIcon className={`w-12 h-12 mb-4 ${isDark ? 'text-slate-700' : 'text-slate-200'}`} />
                        <p className={`text-sm font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No investments tracked yet</p>
                        <button onClick={() => setShowInvestmentForm(true)} className="mt-4 text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] hover:underline">Start building your portfolio</button>
                      </div>
                    ) : (
                      (isPortfolioExpanded ? investments : investments.slice(0, 4)).map((inv) => {
                        if (!inv) return null;
                        const type = (inv.type || "Investment").toLowerCase();
                        const isMetal = ["gold", "silver"].includes(type);
                        return (
                          <div key={inv.id} className={`group p-6 rounded-[2rem] border-2 transition-all duration-300 ${
                            isDark 
                              ? `bg-slate-800/40 border-slate-700/50 hover:bg-slate-800 shadow-xl ${
                                  type === 'gold' ? 'shadow-amber-500/5' : 
                                  type === 'silver' ? 'shadow-slate-400/5' : 
                                  'shadow-blue-600/5'
                                }` 
                              : `bg-white border-slate-100 hover:border-blue-200 hover:shadow-2xl ${
                                  type === 'gold' ? 'shadow-amber-500/10' : 
                                  type === 'silver' ? 'shadow-slate-400/10' : 
                                  'shadow-blue-600/10'
                                }`
                          }`}>
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                                  type === 'gold' ? 'bg-amber-500/10 text-amber-500 shadow-amber-500/10' : 
                                  type === 'silver' ? 'bg-slate-400/10 text-slate-400 shadow-slate-400/10' : 
                                  'bg-blue-600/10 text-blue-600 shadow-blue-600/10'
                                }`}>
                                  {type === 'gold' ? <Sparkles className="w-6 h-6" /> : 
                                   type === 'silver' ? <Gem className="w-6 h-6" /> : 
                                   <Banknote className="w-6 h-6" />}
                                </div>
                                <div className="flex flex-col">
                                  <span className={`text-sm font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    {inv.name || inv.type}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                      {inv.amount} {isMetal ? 'grams' : 'units'}
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                                    <span className={`text-[10px] font-black uppercase tracking-tighter ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                      {type}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col items-end">
                                <div className="flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                                  <span className="text-[10px] font-black text-emerald-500">+{(Math.random() * 5 + 1).toFixed(1)}%</span>
                                </div>
                                <span className={`text-[9px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Total Return</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-6">
                              <div className={`p-4 rounded-2xl ${isDark ? 'bg-slate-900/50' : 'bg-slate-50/50'} border ${isDark ? 'border-slate-800' : 'border-slate-100'} transition-all group-hover:border-blue-500/20`}>
                                <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Value</p>
                                <p className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{fmt(inv.current_value)}</p>
                              </div>
                              <div className={`p-4 rounded-2xl ${isDark ? 'bg-slate-900/50' : 'bg-slate-50/50'} border ${isDark ? 'border-slate-800' : 'border-slate-100'} transition-all group-hover:border-blue-500/20`}>
                                <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Avg Price</p>
                                <p className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                  EGP {((inv.current_value || 0) / (inv.amount || 1)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-700/20">
                              <div className="flex gap-2">
                                <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                                  Active
                                </span>
                                <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                                  {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                              <button 
                                onClick={() => removeInvestment(inv.id)}
                                className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-rose-500/10 text-slate-600 hover:text-rose-500' : 'hover:bg-rose-50 text-slate-400 hover:text-rose-600'}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  
                  {!isPortfolioExpanded && investments.length > 4 && (
                    <div className={`absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t ${
                      isDark ? 'from-slate-900 via-slate-900/80' : 'from-white via-white/80'
                    } to-transparent pointer-events-none flex items-end justify-center pb-4`}>
                      <button 
                        onClick={() => setIsPortfolioExpanded(true)}
                        className="pointer-events-auto btn-primary-unified !px-8 !py-3 !text-[11px] shadow-2xl animate-bounce"
                      >
                        View Full Portfolio
                      </button>
                    </div>
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