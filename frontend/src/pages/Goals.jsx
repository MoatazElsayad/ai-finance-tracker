/**
 * GoalsPage Component - Savings Goal Tracker (v2)
 * Custom-built for a university student in Egypt.
 * Features: Multi-category linking, hybrid income/expense tracking, and achievement celebrations.
 */
import { useState, useEffect, useMemo } from 'react';
import { useForm, useController } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Target, 
  Plus, 
  Pencil, 
  Trash2, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  X,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Info,
  Wallet,
  Check,
  Search,
  ChevronDown,
  Trophy,
  PartyPopper
} from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import confetti from 'canvas-confetti';
import { useTheme } from '../context/ThemeContext';
import { 
  getGoals, 
  createGoal, 
  updateGoal, 
  deleteGoal, 
  getCategories 
} from '../api';

// --- Validation Schema ---
const goalSchema = z.object({
  name: z.string().min(3, 'Goal name must be at least 3 characters'),
  target_amount: z.number().min(1, 'Target amount must be greater than 0'),
  target_date: z.string().refine((date) => {
    const d = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d >= today;
  }, {
    message: 'Target date must be in the future',
  }),
  current_amount: z.number().min(0, 'Starting amount cannot be negative').default(0),
  category_ids: z.array(z.number()).default([]),
});

const Goals = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [goals, setGoals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [goalsData, catsData] = await Promise.all([
        getGoals(),
        getCategories()
      ]);
      setGoals(goalsData || []);
      setCategories(catsData || []);
    } catch (err) {
      console.error('Error fetching goals data:', err);
      setError('Could not fetch your goals. Please check your internet connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (goal = null) => {
    setEditingGoal(goal);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingGoal(null);
    setIsModalOpen(false);
  };

  const handleDeleteGoal = async (id) => {
    if (!window.confirm('Are you sure you want to delete this goal? This action cannot be undone.')) return;
    
    try {
      await deleteGoal(id);
      setGoals(prev => prev.filter(g => g.id !== id));
    } catch (err) {
      alert('Failed to delete goal. Please try again.');
    }
  };

  const triggerConfetti = () => {
    const duration = 4 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 40, spread: 360, ticks: 100, zIndex: 1000 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 70 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  return (
    <div className={`p-4 md:p-8 min-h-screen transition-colors duration-300 ${
      isDark ? 'text-white bg-[#0a0e27]' : 'text-slate-900 bg-slate-50'
    }`}>
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black flex items-center gap-4 tracking-tight">
              <div className="p-3 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl shadow-xl shadow-amber-500/20">
                <Target className="w-8 h-8 text-white" />
              </div>
              Savings Goals
            </h1>
            <div className="flex flex-col md:flex-row md:items-center gap-4 mt-3">
              <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} text-lg font-medium`}>
                Track long-term savings targets. Income increases progress, expenses decrease it.
              </p>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-amber-50 border-amber-100 text-amber-600'} animate-pulse`}>
                <Info className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Tip: Link goals to the "Savings" category!</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => handleOpenModal()}
            className="group flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-amber-500/25 active:scale-95 hover:shadow-amber-500/40"
          >
            <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
            Add New Goal
          </button>
        </div>

        {/* Content Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => <GoalSkeleton key={i} isDark={isDark} />)}
          </div>
        ) : error ? (
          <div className={`p-16 rounded-[2.5rem] text-center border ${
            isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200 shadow-2xl'
          }`}>
            <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <h3 className="text-3xl font-bold mb-3">Something went wrong</h3>
            <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} mb-10 text-lg`}>{error}</p>
            <button 
              onClick={fetchData}
              className="px-10 py-4 bg-amber-500 text-white rounded-2xl hover:bg-amber-600 transition-all font-bold shadow-lg shadow-amber-500/20"
            >
              Retry Connection
            </button>
          </div>
        ) : goals.length === 0 ? (
          <div className={`p-20 rounded-[3rem] text-center border-2 border-dashed ${
            isDark ? 'bg-slate-800/20 border-slate-700' : 'bg-white border-slate-200'
          }`}>
            <div className="w-32 h-32 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-10 animate-pulse">
              <Target className="w-16 h-16 text-amber-500" />
            </div>
            <h2 className="text-4xl font-black mb-6">No savings goals yet</h2>
            <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} mb-12 max-w-xl mx-auto text-xl leading-relaxed`}>
              Connect multiple categories to track your net savings. 
              Salary adds to your goal, while coffee runs take away!
            </p>
            <button
              onClick={() => handleOpenModal()}
              className="bg-amber-500 hover:bg-amber-600 text-white px-12 py-5 rounded-[2rem] font-black text-lg transition-all shadow-2xl shadow-amber-500/40 flex items-center gap-3 mx-auto active:scale-95"
            >
              Launch My First Goal
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {goals.map(goal => (
              <GoalCard 
                key={goal.id} 
                goal={goal} 
                categories={categories}
                isDark={isDark} 
                onEdit={() => handleOpenModal(goal)}
                onDelete={() => handleDeleteGoal(goal.id)}
                onComplete={triggerConfetti}
              />
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <GoalFormModal 
          goal={editingGoal} 
          categories={categories}
          isDark={isDark} 
          onClose={handleCloseModal}
          onSuccess={() => {
            handleCloseModal();
            fetchData();
          }}
        />
      )}
    </div>
  );
};

// --- Sub-components ---

/**
 * GoalCard - Displays individual goal progress and details
 */
const GoalCard = ({ goal, categories, isDark, onEdit, onDelete, onComplete }) => {
  const actualProgress = Math.round((goal.current_amount / goal.target_amount) * 100);
  const displayProgress = Math.min(100, actualProgress);
  const isCompleted = actualProgress >= 100;
  
  // Logic for "On Track" calculation
  const targetDate = new Date(goal.target_date);
  const createdDate = new Date(goal.created_at || Date.now() - 30*24*60*60*1000); 
  const now = new Date();
  
  const totalTime = targetDate - createdDate;
  const timePassed = now - createdDate;
  const expectedProgress = totalTime > 0 
    ? Math.max(0, Math.min(100, (timePassed / totalTime) * 100))
    : 100;

  const isOnTrack = actualProgress >= expectedProgress;

  // Currency Formatter for Egypt
  const formatCurrency = (amount) => {
    return amount.toLocaleString('en-EG', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 0
    });
  };

  // Get linked categories for display
  const linkedCategories = categories.filter(c => goal.category_ids?.includes(c.id));
  const hasExpenses = linkedCategories.some(c => c.type === 'expense');

  useEffect(() => {
    if (isCompleted && now <= targetDate) {
      onComplete();
    }
  }, [isCompleted]);

  return (
    <div className={`p-8 rounded-[2.5rem] transition-all border-2 duration-500 group relative overflow-hidden ${
      isDark 
        ? 'bg-slate-800/40 border-slate-700 hover:border-amber-500/50 hover:bg-slate-800/60' 
        : 'bg-white border-slate-100 shadow-xl hover:shadow-2xl hover:border-amber-500/30'
    }`}>
      
      {/* Achievement Overlay */}
      {isCompleted && (
        <div className="absolute top-0 right-0 p-4">
          <div className="bg-green-500 text-white p-2 rounded-xl shadow-lg animate-bounce">
            <Trophy className="w-5 h-5" />
          </div>
        </div>
      )}

      {/* Background Glow */}
      <div className={`absolute -right-20 -top-20 w-64 h-64 rounded-full blur-[80px] opacity-10 transition-colors duration-500 ${
        isCompleted ? 'bg-green-500' : isOnTrack ? 'bg-amber-500' : 'bg-red-500'
      }`} />

      {/* Hover Actions */}
      <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-10">
        <button 
          onClick={onEdit} 
          className={`p-3 rounded-2xl backdrop-blur-md shadow-lg transition-all ${
            isDark ? 'bg-slate-700/80 hover:bg-amber-500 text-white' : 'bg-white/80 hover:bg-amber-500 hover:text-white border border-slate-100'
          }`}
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button 
          onClick={onDelete} 
          className={`p-3 rounded-2xl backdrop-blur-md shadow-lg transition-all ${
            isDark ? 'bg-slate-700/80 hover:bg-red-500 text-white' : 'bg-white/80 hover:bg-red-500 hover:text-white border border-slate-100'
          }`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="relative z-1">
        <div className="mb-8">
          <h3 className="text-2xl font-black truncate pr-16 tracking-tight group-hover:text-amber-500 transition-colors">
            {goal.name}
          </h3>
          <div className="flex items-center gap-2 mt-2 text-sm font-bold opacity-50">
            <Calendar className="w-4 h-4" />
            {new Date(goal.target_date).toLocaleDateString('en-EG', { 
              month: 'long', 
              year: 'numeric' 
            })}
          </div>
        </div>

        <div className="flex items-center gap-10 mb-8">
          <div className="w-32 h-32 flex-shrink-0 relative group-hover:scale-105 transition-transform duration-500">
            <CircularProgressbar
              value={displayProgress}
              text={`${actualProgress}%`}
              strokeWidth={12}
              styles={buildStyles({
                textSize: '22px',
                pathColor: isCompleted ? '#22c55e' : actualProgress > 75 ? '#fbbf24' : '#f59e0b',
                textColor: isDark ? '#fff' : '#0f172a',
                trailColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                strokeLinecap: 'round',
                pathTransitionDuration: 1.5,
              })}
            />
          </div>
          
          <div className="flex-1 space-y-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">Current Balance</p>
              <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {formatCurrency(goal.current_amount)}
              </p>
            </div>
            <div className="pt-4 border-t border-slate-500/10">
              <p className="text-xs font-bold opacity-40 uppercase tracking-[0.2em] mb-1">Target Amount</p>
              <p className="text-lg font-black text-amber-500">
                {formatCurrency(goal.target_amount)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black tracking-[0.2em] uppercase shadow-sm ${
              actualProgress >= 120 
                ? 'bg-purple-500/15 text-purple-500'
                : isCompleted 
                  ? 'bg-green-500/15 text-green-500'
                  : isOnTrack 
                    ? 'bg-amber-500/15 text-amber-500'
                    : 'bg-red-500/15 text-red-500'
            }`}>
              {actualProgress >= 120 ? (
                <><PartyPopper className="w-3.5 h-3.5" /> Overachieved!</>
              ) : isCompleted ? (
                <><CheckCircle2 className="w-3.5 h-3.5" /> Goal Achieved!</>
              ) : isOnTrack ? (
                <><TrendingUp className="w-3.5 h-3.5" /> On Track</>
              ) : (
                <><TrendingDown className="w-3.5 h-3.5" /> Behind Schedule</>
              )}
            </div>

            <div className="flex -space-x-2">
              {linkedCategories.slice(0, 3).map((cat, idx) => (
                <div 
                  key={cat.id} 
                  title={cat.name}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs bg-white dark:bg-slate-700 shadow-sm ${
                    isDark ? 'border-slate-800' : 'border-white'
                  }`}
                  style={{ zIndex: 10 - idx }}
                >
                  {cat.icon || '📁'}
                </div>
              ))}
              {linkedCategories.length > 3 && (
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold bg-slate-100 dark:bg-slate-600 ${
                  isDark ? 'border-slate-800 text-slate-400' : 'border-white text-slate-500'
                }`} style={{ zIndex: 0 }}>
                  +{linkedCategories.length - 3}
                </div>
              )}
            </div>
          </div>

          {hasExpenses && (
            <div className={`p-4 rounded-2xl flex items-start gap-3 text-[11px] font-medium leading-relaxed border ${
              isDark ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-600'
            }`}>
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>Hybrid Goal: Income adds progress, while expenses in linked categories subtract from it.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * GoalFormModal - Modal for adding or editing goals
 */
const GoalFormModal = ({ goal, categories, isDark, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { 
    register, 
    handleSubmit, 
    control,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(goalSchema),
    defaultValues: goal ? {
      ...goal,
      target_date: new Date(goal.target_date).toISOString().split('T')[0],
      category_ids: goal.category_ids || []
    } : {
      name: '',
      target_amount: 0,
      current_amount: 0,
      target_date: '',
      category_ids: []
    }
  });

  const { field: categoryField } = useController({
    name: 'category_ids',
    control,
  });

  const selectedCategoryIds = watch('category_ids');
  
  const filteredCategories = useMemo(() => {
    return categories.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [categories, searchQuery]);

  const toggleCategory = (id) => {
    const current = [...selectedCategoryIds];
    if (current.includes(id)) {
      categoryField.onChange(current.filter(item => item !== id));
    } else {
      categoryField.onChange([...current, id]);
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (goal) {
        await updateGoal(goal.id, data);
      } else {
        await createGoal(data);
      }
      onSuccess();
    } catch (err) {
      console.error('Error saving goal:', err);
      alert(err.message || 'Failed to save goal. Please verify your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
      
      <div className={`relative w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in slide-in-from-bottom-10 duration-500 max-h-[90vh] flex flex-col ${
        isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white'
      }`}>
        <div className="flex items-center justify-between p-8 md:p-10 border-b border-slate-500/10 shrink-0">
          <div>
            <h2 className="text-3xl font-black tracking-tight">{goal ? 'Edit Savings Goal' : 'New Savings Goal'}</h2>
            <p className="text-slate-500 font-bold mt-1 uppercase text-xs tracking-[0.2em]">Connect multiple categories to track progress</p>
          </div>
          <button onClick={onClose} className={`p-4 rounded-2xl transition-all ${
            isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
          }`}>
            <X className="w-7 h-7" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 md:p-10 space-y-8 overflow-y-auto custom-scrollbar">
          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-[0.2em] ml-2 opacity-50">Goal Name</label>
            <input
              {...register('name')}
              placeholder="e.g. Master's in Cairo, New Laptop, Travel Fund"
              className={`w-full p-6 rounded-[1.5rem] border-2 transition-all outline-none font-bold text-lg focus:ring-8 focus:ring-amber-500/10 ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 focus:border-amber-500' 
                  : 'bg-slate-50 border-slate-200 focus:border-amber-500'
              } ${errors.name ? 'border-red-500' : ''}`}
            />
            {errors.name && <p className="text-red-500 text-xs ml-2 font-bold">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-[0.2em] ml-2 opacity-50">Target Amount (EGP)</label>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-amber-500">£</span>
                <input
                  type="number"
                  {...register('target_amount', { valueAsNumber: true })}
                  className={`w-full p-6 pl-12 rounded-[1.5rem] border-2 transition-all outline-none font-black text-xl ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 focus:border-amber-500' 
                      : 'bg-slate-50 border-slate-200 focus:border-amber-500'
                  }`}
                />
              </div>
              {errors.target_amount && <p className="text-red-500 text-xs ml-2 font-bold">{errors.target_amount.message}</p>}
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-[0.2em] ml-2 opacity-50">Starting Balance</label>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-400">£</span>
                <input
                  type="number"
                  {...register('current_amount', { valueAsNumber: true })}
                  className={`w-full p-6 pl-12 rounded-[1.5rem] border-2 transition-all outline-none font-black text-xl ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 focus:border-amber-500' 
                      : 'bg-slate-50 border-slate-200 focus:border-amber-500'
                  }`}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-[0.2em] ml-2 opacity-50">Target Date</label>
            <input
              type="date"
              {...register('target_date')}
              className={`w-full p-6 rounded-[1.5rem] border-2 transition-all outline-none font-bold ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 focus:border-amber-500' 
                  : 'bg-slate-50 border-slate-200 focus:border-amber-500'
              } ${errors.target_date ? 'border-red-500' : ''}`}
            />
            {errors.target_date && <p className="text-red-500 text-xs ml-2 font-bold">{errors.target_date.message}</p>}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between ml-2">
              <label className="text-xs font-black uppercase tracking-[0.2em] opacity-50">Link Categories</label>
              <span className="text-[10px] font-bold px-2 py-1 rounded bg-amber-500/10 text-amber-500 uppercase tracking-tighter">
                {selectedCategoryIds.length} Selected
              </span>
            </div>
            
            <div className={`p-6 rounded-[2rem] border-2 space-y-4 ${
              isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                <input 
                  type="text"
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full p-4 pl-12 rounded-xl border outline-none text-sm transition-all ${
                    isDark ? 'bg-slate-900 border-slate-700 focus:border-amber-500' : 'bg-white border-slate-200 focus:border-amber-500'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredCategories.map(cat => {
                  const isSelected = selectedCategoryIds.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                        isSelected 
                          ? 'border-amber-500 bg-amber-500/10 shadow-sm' 
                          : isDark ? 'border-slate-700 hover:border-slate-600' : 'border-white hover:border-slate-100'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${
                        isSelected ? 'bg-amber-500 text-white' : isDark ? 'bg-slate-800' : 'bg-white shadow-sm'
                      }`}>
                        {isSelected ? <Check className="w-5 h-5" /> : cat.icon || '📁'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black truncate">{cat.name}</p>
                        <p className={`text-[9px] font-bold uppercase tracking-tighter opacity-40 ${
                          cat.type === 'income' ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {cat.type}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            
            {selectedCategoryIds.length > 0 && (
              <div className={`p-4 rounded-2xl border flex items-start gap-3 text-[11px] font-medium leading-relaxed animate-in fade-in duration-300 ${
                isDark ? 'bg-amber-500/5 border-amber-500/10 text-amber-500/80' : 'bg-amber-50 border-amber-100 text-amber-700'
              }`}>
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>
                  Income categories linked will INCREASE your goal progress. 
                  Expense categories will DECREASE it. Your goal tracks net savings.
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-white font-black py-6 rounded-[2rem] transition-all shadow-2xl shadow-amber-500/40 flex items-center justify-center gap-4 mt-4 active:scale-95 text-lg uppercase tracking-[0.2em] shrink-0"
          >
            {isSubmitting ? (
              <Loader2 className="w-7 h-7 animate-spin" />
            ) : (
              <>
                {goal ? 'Update My Goal' : 'Start My Journey'}
                <Target className="w-6 h-6" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

/**
 * GoalSkeleton - Pulse loader for goals
 */
const GoalSkeleton = ({ isDark }) => (
  <div className={`p-8 rounded-[2.5rem] border-2 animate-pulse ${
    isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-100'
  }`}>
    <div className="flex justify-between mb-8">
      <div className="space-y-3 flex-1">
        <div className={`h-8 w-3/4 rounded-xl ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
        <div className={`h-4 w-1/2 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
      </div>
      <div className={`w-12 h-12 rounded-2xl ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
    </div>
    <div className="flex items-center gap-8 mb-8">
      <div className={`w-32 h-32 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
      <div className="flex-1 space-y-4">
        <div className={`h-12 w-full rounded-2xl ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
        <div className={`h-8 w-2/3 rounded-xl ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
      </div>
    </div>
    <div className="flex justify-between">
      <div className={`h-10 w-1/3 rounded-xl ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
      <div className={`h-10 w-1/4 rounded-xl ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
    </div>
  </div>
);

export default Goals;
