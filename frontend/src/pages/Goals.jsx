/**
 * GoalsPage Component - Savings Goal Tracker
 * Custom-built for a university student in Egypt.
 * Tracks long-term financial targets with smart progress logic and category linking.
 */
import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
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
  Wallet
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
  category_id: z.any().optional().nullable().transform(val => 
    (val === "" || val === null || val === undefined) ? null : Number(val)
  ),
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
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
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
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black flex items-center gap-4 tracking-tight">
              <div className="p-3 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl shadow-xl shadow-amber-500/20">
                <Target className="w-8 h-8 text-white" />
              </div>
              Savings Goals
            </h1>
            <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} mt-3 text-lg font-medium`}>
              Invest in your future. Track your long-term dreams and milestones.
            </p>
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
              Whether it's for a new laptop, travel, or an emergency fund, starting early is key. 
              Let's set your first financial target!
            </p>
            <button
              onClick={() => handleOpenModal()}
              className="bg-amber-500 hover:bg-amber-600 text-white px-12 py-5 rounded-[2rem] font-black text-lg transition-all shadow-2xl shadow-amber-500/40 flex items-center gap-3 mx-auto active:scale-95"
            >
              Start My First Goal
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
  const progress = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
  const isCompleted = progress >= 100;
  
  // Logic for "On Track" calculation
  // Expected progress = (days passed / total days) × 100
  const targetDate = new Date(goal.target_date);
  const createdDate = new Date(goal.created_at || Date.now() - 30*24*60*60*1000); 
  const now = new Date();
  
  const totalTime = targetDate - createdDate;
  const timePassed = now - createdDate;
  const expectedProgress = totalTime > 0 
    ? Math.max(0, Math.min(100, (timePassed / totalTime) * 100))
    : 100;

  const isOnTrack = progress >= expectedProgress;

  // Currency Formatter for Egypt
  const formatCurrency = (amount) => {
    return amount.toLocaleString('en-EG', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 0
    });
  };

  const linkedCategory = categories.find(c => c.id === goal.category_id);
  const isExpenseCategory = linkedCategory?.type === 'expense';

  useEffect(() => {
    if (isCompleted) {
      onComplete();
    }
  }, [isCompleted]);

  return (
    <div className={`p-8 rounded-[2.5rem] transition-all border-2 duration-500 group relative overflow-hidden ${
      isDark 
        ? 'bg-slate-800/40 border-slate-700 hover:border-amber-500/50 hover:bg-slate-800/60' 
        : 'bg-white border-slate-100 shadow-xl hover:shadow-2xl hover:border-amber-500/30'
    }`}>
      
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
              value={progress}
              text={`${progress}%`}
              strokeWidth={12}
              styles={buildStyles({
                textSize: '22px',
                pathColor: isCompleted ? '#22c55e' : progress > 50 ? '#f59e0b' : '#f59e0b',
                textColor: isDark ? '#fff' : '#0f172a',
                trailColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                strokeLinecap: 'round',
                pathTransitionDuration: 1.5,
              })}
            />
          </div>
          
          <div className="flex-1 space-y-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Current Progress</p>
              <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {formatCurrency(goal.current_amount)}
              </p>
            </div>
            <div className="pt-4 border-t border-slate-500/10">
              <p className="text-xs font-bold opacity-40 uppercase tracking-widest mb-1">Target Amount</p>
              <p className="text-lg font-black text-amber-500">
                {formatCurrency(goal.target_amount)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase ${
              isCompleted 
                ? 'bg-green-500/15 text-green-500'
                : isOnTrack 
                  ? 'bg-amber-500/15 text-amber-500'
                  : 'bg-red-500/15 text-red-500'
            }`}>
              {isCompleted ? (
                <><CheckCircle2 className="w-3.5 h-3.5" /> Completed!</>
              ) : isOnTrack ? (
                <><TrendingUp className="w-3.5 h-3.5" /> On Track</>
              ) : (
                <><TrendingDown className="w-3.5 h-3.5" /> Behind Schedule</>
              )}
            </div>

            {goal.category_name && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 text-[10px] font-black uppercase tracking-widest ${
                isDark ? 'border-slate-700 text-slate-400' : 'border-slate-100 text-slate-500 bg-slate-50'
              }`}>
                <Wallet className="w-3 h-3" />
                {goal.category_name}
              </div>
            )}
          </div>

          {isExpenseCategory && (
            <div className={`p-4 rounded-2xl flex items-start gap-3 text-[11px] font-medium leading-relaxed ${
              isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'
            }`}>
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>Linking to an expense category tracks how much you save by spending less than usual.</p>
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
  
  const { 
    register, 
    handleSubmit, 
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(goalSchema),
    defaultValues: goal ? {
      ...goal,
      target_date: new Date(goal.target_date).toISOString().split('T')[0],
      category_id: goal.category_id ? String(goal.category_id) : ""
    } : {
      name: '',
      target_amount: 0,
      current_amount: 0,
      target_date: '',
      category_id: ''
    }
  });

  const selectedCategoryId = watch('category_id');
  const selectedCategory = categories.find(c => c.id === Number(selectedCategoryId));
  const isExpenseCategory = selectedCategory?.type === 'expense';

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
      
      <div className={`relative w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in slide-in-from-bottom-10 duration-500 ${
        isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white'
      }`}>
        <div className="flex items-center justify-between p-10 border-b border-slate-500/10">
          <div>
            <h2 className="text-3xl font-black tracking-tight">{goal ? 'Edit Goal' : 'New Savings Goal'}</h2>
            <p className="text-slate-500 font-bold mt-1 uppercase text-xs tracking-widest">Set your destination</p>
          </div>
          <button onClick={onClose} className={`p-4 rounded-2xl transition-all ${
            isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
          }`}>
            <X className="w-7 h-7" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-10 space-y-8">
          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-[0.2em] ml-2 opacity-50">Goal Name</label>
            <input
              {...register('name')}
              placeholder="e.g. Master's in Europe, New Car, Laptop"
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
              <label className="text-xs font-black uppercase tracking-[0.2em] ml-2 opacity-50">Current Balance</label>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-[0.2em] ml-2 opacity-50">Deadline Date</label>
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

            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-[0.2em] ml-2 opacity-50">Link to Category</label>
              <div className="relative">
                <select
                  {...register('category_id')}
                  className={`w-full p-6 rounded-[1.5rem] border-2 transition-all outline-none font-bold appearance-none cursor-pointer ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 focus:border-amber-500' 
                      : 'bg-slate-50 border-slate-200 focus:border-amber-500'
                  }`}
                >
                  <option value="">Independent Goal</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                  <ArrowRight className="w-5 h-5 rotate-90" />
                </div>
              </div>
            </div>
          </div>

          {isExpenseCategory && (
            <div className={`p-6 rounded-3xl border-2 flex items-start gap-4 animate-in slide-in-from-top-4 duration-300 ${
              isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' : 'bg-amber-50 border-amber-100 text-amber-800'
            }`}>
              <Info className="w-6 h-6 flex-shrink-0 mt-0.5 text-amber-500" />
              <div className="space-y-1">
                <p className="font-black text-sm uppercase tracking-widest">Savings through Frugality</p>
                <p className="text-xs font-bold opacity-80 leading-relaxed">
                  Linking to an expense category tracks how much you save by spending less than usual. 
                  Progress will increase based on your budget discipline!
                </p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-white font-black py-6 rounded-[2rem] transition-all shadow-2xl shadow-amber-500/40 flex items-center justify-center gap-4 mt-4 active:scale-95 text-lg uppercase tracking-widest"
          >
            {isSubmitting ? (
              <Loader2 className="w-7 h-7 animate-spin" />
            ) : (
              <>
                {goal ? 'Update My Goal' : 'Start Saving Now'}
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
