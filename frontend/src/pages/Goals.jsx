/**
 * GoalsPage Component - Savings Goal Tracker
 * Implementation for a Personal Finance Tracker (USD Standardized)
 */
import { useState, useEffect } from 'react';
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
  ArrowRight
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
    return d > new Date();
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
      setError('Failed to load goals. Please check your connection and try again.');
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
    if (!window.confirm('Are you sure you want to delete this savings goal?')) return;
    
    try {
      await deleteGoal(id);
      setGoals(prev => prev.filter(g => g.id !== id));
      // Optional: success toast
    } catch (err) {
      alert('Failed to delete goal. Please try again.');
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#fbbf24', '#ffffff']
    });
  };

  return (
    <div className={`p-4 md:p-8 min-h-screen transition-colors duration-300 ${
      isDark ? 'text-white bg-[#0a0e27]' : 'text-slate-900 bg-slate-50'
    }`}>
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-extrabold flex items-center gap-4">
              <div className="p-3 bg-amber-500 rounded-2xl shadow-lg shadow-amber-500/20">
                <Target className="w-8 h-8 text-white" />
              </div>
              Savings Goals
            </h1>
            <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} mt-2 text-lg`}>
              Plan your future and track your progress toward financial milestones.
            </p>
          </div>
          
          <button
            onClick={() => handleOpenModal()}
            className="group flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-amber-500/25 active:scale-95"
          >
            <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
            New Goal
          </button>
        </div>

        {/* Main Content Area */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => <GoalSkeleton key={i} isDark={isDark} />)}
          </div>
        ) : error ? (
          <div className={`p-12 rounded-3xl text-center border ${
            isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200 shadow-xl'
          }`}>
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Oops! Something went wrong</h3>
            <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} mb-8`}>{error}</p>
            <button 
              onClick={fetchData}
              className="px-8 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors font-semibold"
            >
              Retry Connection
            </button>
          </div>
        ) : goals.length === 0 ? (
          <div className={`p-16 rounded-[2.5rem] text-center border-2 border-dashed ${
            isDark ? 'bg-slate-800/20 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
              <Target className="w-12 h-12 text-amber-500" />
            </div>
            <h2 className="text-3xl font-bold mb-4">No goals yet, Dreamer!</h2>
            <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} mb-10 max-w-lg mx-auto text-lg`}>
              What are you saving for? A new laptop, a summer trip, or your emergency fund? 
              Start tracking and watch your dreams become reality.
            </p>
            <button
              onClick={() => handleOpenModal()}
              className="bg-amber-500 hover:bg-amber-600 text-white px-10 py-4 rounded-2xl font-extrabold transition-all shadow-lg shadow-amber-500/30 flex items-center gap-2 mx-auto"
            >
              Set Your First Goal
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {goals.map(goal => (
              <GoalCard 
                key={goal.id} 
                goal={goal} 
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
const GoalCard = ({ goal, isDark, onEdit, onDelete, onComplete }) => {
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

  useEffect(() => {
    if (isCompleted) {
      onComplete();
    }
  }, [isCompleted]);

  return (
    <div className={`p-8 rounded-[2rem] transition-all border duration-300 ${
      isDark 
        ? 'bg-slate-800/40 border-slate-700 hover:border-amber-500/50 hover:bg-slate-800/60' 
        : 'bg-white border-slate-100 shadow-md hover:shadow-xl hover:border-amber-500/30'
    } group relative overflow-hidden`}>
      
      {isCompleted && (
        <div className="absolute -right-10 -top-10 w-28 h-28 bg-green-500/10 rounded-full flex items-end justify-start p-6 rotate-12">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
      )}

      <div className="flex justify-between items-start mb-8">
        <div className="flex-1">
          <h3 className="text-2xl font-bold truncate pr-10 tracking-tight">{goal.name}</h3>
          <div className="flex items-center gap-2 mt-2 text-sm font-medium opacity-60">
            <Calendar className="w-4 h-4 text-amber-500" />
            {new Date(goal.target_date).toLocaleDateString(undefined, { 
              month: 'long', 
              year: 'numeric' 
            })}
          </div>
        </div>
        
        <div className="flex gap-1 absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={onEdit} 
            className={`p-2 rounded-xl transition-colors ${
              isDark ? 'hover:bg-amber-500/20 text-amber-500' : 'hover:bg-amber-50 text-amber-600'
            }`}
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button 
            onClick={onDelete} 
            className={`p-2 rounded-xl transition-colors ${
              isDark ? 'hover:bg-red-500/20 text-red-500' : 'hover:bg-red-50 text-red-600'
            }`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-8 mb-8">
        <div className="w-28 h-28 flex-shrink-0 drop-shadow-lg">
          <CircularProgressbar
            value={progress}
            text={`${progress}%`}
            strokeWidth={10}
            styles={buildStyles({
              textSize: '20px',
              pathColor: isCompleted ? '#22c55e' : '#f59e0b',
              textColor: isDark ? '#fff' : '#1e293b',
              trailColor: isDark ? '#1e293b' : '#f1f5f9',
              strokeLinecap: 'round',
            })}
          />
        </div>
        
        <div className="flex-1 space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest opacity-40">Currently Saved</p>
            <p className="text-3xl font-black text-amber-500">
              ${goal.current_amount.toLocaleString()} 
              <span className="text-xs font-bold text-slate-500 ml-1">USD</span>
            </p>
          </div>
          <div className="pt-4 border-t border-slate-500/10">
            <p className="text-sm font-medium opacity-60 flex justify-between">
              Target: <span className="font-bold text-slate-900 dark:text-white">${goal.target_amount.toLocaleString()} USD</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black tracking-tighter uppercase ${
          isCompleted 
            ? 'bg-green-500/15 text-green-500'
            : isOnTrack 
              ? 'bg-amber-500/15 text-amber-500'
              : 'bg-red-500/15 text-red-500'
        }`}>
          {isCompleted ? (
            <><CheckCircle2 className="w-3 h-3" /> GOAL REACHED!</>
          ) : isOnTrack ? (
            <><TrendingUp className="w-3 h-3" /> ON TRACK</>
          ) : (
            <><TrendingDown className="w-3 h-3" /> BEHIND SCHEDULE</>
          )}
        </div>
        
        {goal.category_name && (
          <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg border ${
            isDark ? 'border-slate-700 text-slate-500' : 'border-slate-200 text-slate-400'
          }`}>
            {goal.category_name}
          </span>
        )}
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
    formState: { errors },
    reset
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
      alert(err.message || 'Failed to save goal. Please check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className={`relative w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 ${
        isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white'
      }`}>
        <div className="flex items-center justify-between p-8 border-b border-slate-500/10">
          <div>
            <h2 className="text-2xl font-black tracking-tight">{goal ? 'Update Goal' : 'New Savings Goal'}</h2>
            <p className="text-sm opacity-50 mt-1 font-medium">Set your target and timeline</p>
          </div>
          <button onClick={onClose} className="p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
          {/* Name Field */}
          <div className="space-y-2">
            <label className="text-sm font-bold ml-1 opacity-70">Goal Name</label>
            <input
              {...register('name')}
              placeholder="e.g. New MacBook Pro M3"
              className={`w-full p-5 rounded-2xl border transition-all outline-none font-medium focus:ring-4 focus:ring-amber-500/20 ${
                isDark ? 'bg-slate-800 border-slate-700 focus:border-amber-500' : 'bg-slate-50 border-slate-200 focus:border-amber-500'
              } ${errors.name ? 'border-red-500' : ''}`}
            />
            {errors.name && <p className="text-red-500 text-xs ml-1 font-bold">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Target Amount */}
            <div className="space-y-2">
              <label className="text-sm font-bold ml-1 opacity-70">Target (USD)</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-amber-500">$</span>
                <input
                  type="number"
                  {...register('target_amount', { valueAsNumber: true })}
                  className={`w-full p-5 pl-10 rounded-2xl border transition-all outline-none font-bold ${
                    isDark ? 'bg-slate-800 border-slate-700 focus:border-amber-500' : 'bg-slate-50 border-slate-200 focus:border-amber-500'
                  }`}
                />
              </div>
              {errors.target_amount && <p className="text-red-500 text-xs ml-1 font-bold">{errors.target_amount.message}</p>}
            </div>

            {/* Starting Amount */}
            <div className="space-y-2">
              <label className="text-sm font-bold ml-1 opacity-70">Starting Balance</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
                <input
                  type="number"
                  {...register('current_amount', { valueAsNumber: true })}
                  className={`w-full p-5 pl-10 rounded-2xl border transition-all outline-none font-bold ${
                    isDark ? 'bg-slate-800 border-slate-700 focus:border-amber-500' : 'bg-slate-50 border-slate-200 focus:border-amber-500'
                  }`}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Target Date */}
            <div className="space-y-2">
              <label className="text-sm font-bold ml-1 opacity-70">Target Date</label>
              <input
                type="date"
                {...register('target_date')}
                className={`w-full p-5 rounded-2xl border transition-all outline-none font-medium ${
                  isDark ? 'bg-slate-800 border-slate-700 focus:border-amber-500' : 'bg-slate-50 border-slate-200 focus:border-amber-500'
                } ${errors.target_date ? 'border-red-500' : ''}`}
              />
              {errors.target_date && <p className="text-red-500 text-xs ml-1 font-bold">{errors.target_date.message}</p>}
            </div>

            {/* Linked Category */}
            <div className="space-y-2">
              <label className="text-sm font-bold ml-1 opacity-70">Link Category</label>
              <select
                {...register('category_id')}
                className={`w-full p-5 rounded-2xl border transition-all outline-none font-medium appearance-none ${
                  isDark ? 'bg-slate-800 border-slate-700 focus:border-amber-500' : 'bg-slate-50 border-slate-200 focus:border-amber-500'
                }`}
              >
                <option value="">No link</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-black py-5 rounded-[1.5rem] transition-all shadow-xl shadow-amber-500/30 flex items-center justify-center gap-3 mt-4 active:scale-[0.98]"
          >
            {isSubmitting ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                {goal ? 'Update My Goal' : 'Launch My Goal'}
                {!goal && <Target className="w-5 h-5" />}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

/**
 * GoalSkeleton - Loading placeholder for goal cards
 */
const GoalSkeleton = ({ isDark }) => (
  <div className={`p-8 rounded-[2rem] border ${
    isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-100 shadow-md'
  } animate-pulse`}>
    <div className="flex justify-between mb-8">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-slate-500/20 rounded-xl" />
        <div className="h-4 w-32 bg-slate-500/10 rounded-lg" />
      </div>
    </div>
    <div className="flex gap-8 mb-8">
      <div className="w-28 h-28 rounded-full bg-slate-500/20" />
      <div className="flex-1 space-y-4 py-2">
        <div className="h-4 w-16 bg-slate-500/10 rounded-lg" />
        <div className="h-10 w-32 bg-slate-500/20 rounded-xl" />
        <div className="h-4 w-full bg-slate-500/10 rounded-lg" />
      </div>
    </div>
    <div className="h-8 w-28 bg-slate-500/15 rounded-full" />
  </div>
);

export default Goals;
