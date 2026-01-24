/**
 * GoalsPage Component - Savings Goal Tracker
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
  Loader2
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

// Validation Schema
const goalSchema = z.object({
  name: z.string().min(3, 'Goal name must be at least 3 characters'),
  target_amount: z.number().min(1, 'Target amount must be greater than 0'),
  target_date: z.string().refine((date) => new Date(date) > new Date(), {
    message: 'Target date must be in the future',
  }),
  current_amount: z.number().min(0, 'Current amount cannot be negative').default(0),
  category_id: z.string().optional().nullable(),
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
    try {
      const [goalsData, catsData] = await Promise.all([
        getGoals(),
        getCategories()
      ]);
      setGoals(goalsData || []);
      setCategories(catsData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load goals. Please try again later.');
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
    if (!window.confirm('Are you sure you want to delete this goal?')) return;
    
    try {
      await deleteGoal(id);
      setGoals(goals.filter(g => g.id !== id));
    } catch (err) {
      alert('Failed to delete goal');
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
    <div className={`p-4 md:p-8 min-h-screen ${isDark ? 'text-white' : 'text-slate-900'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Target className="w-8 h-8 text-amber-500" />
              Savings Goals
            </h1>
            <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} mt-1`}>
              Track your long-term financial objectives and milestones.
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-amber-500/20 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Add New Goal
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <GoalSkeleton key={i} isDark={isDark} />)}
          </div>
        ) : error ? (
          <div className={`p-8 rounded-2xl text-center ${isDark ? 'bg-slate-800/50' : 'bg-white shadow-sm'}`}>
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-lg font-medium">{error}</p>
            <button 
              onClick={fetchData}
              className="mt-4 text-amber-500 hover:underline"
            >
              Try Again
            </button>
          </div>
        ) : goals.length === 0 ? (
          <div className={`p-12 rounded-3xl text-center ${isDark ? 'bg-slate-800/30 border-2 border-dashed border-slate-700' : 'bg-white border-2 border-dashed border-slate-200 shadow-sm'}`}>
            <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Target className="w-10 h-10 text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No savings goals yet</h2>
            <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} mb-8 max-w-md mx-auto`}>
              Start planning your future! Create a goal for a new car, a vacation, or an emergency fund.
            </p>
            <button
              onClick={() => handleOpenModal()}
              className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-amber-500/20"
            >
              Create Your First Goal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

      {/* Modal */}
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

const GoalCard = ({ goal, isDark, onEdit, onDelete, onComplete }) => {
  const progress = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
  const isCompleted = progress >= 100;
  
  // Logic for "On Track" calculation
  const targetDate = new Date(goal.target_date);
  const createdDate = new Date(goal.created_at || Date.now() - 30*24*60*60*1000); // Fallback to 1 month ago
  const now = new Date();
  
  const totalTime = targetDate - createdDate;
  const timePassed = now - createdDate;
  const expectedProgress = Math.max(0, Math.min(100, (timePassed / totalTime) * 100));
  const isOnTrack = progress >= expectedProgress;

  useEffect(() => {
    if (isCompleted) onComplete();
  }, [isCompleted]);

  return (
    <div className={`p-6 rounded-2xl transition-all border ${
      isDark 
        ? 'bg-slate-800/50 border-slate-700 hover:border-amber-500/50' 
        : 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-amber-500/30'
    } group relative overflow-hidden`}>
      {isCompleted && (
        <div className="absolute -right-12 -top-12 w-24 h-24 bg-green-500/10 rounded-full flex items-end justify-start p-4 rotate-12">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
      )}

      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <h3 className="text-xl font-bold truncate pr-8">{goal.name}</h3>
          <div className="flex items-center gap-2 mt-1 text-sm opacity-70">
            <Calendar className="w-4 h-4" />
            {new Date(goal.target_date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
          </div>
        </div>
        
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-2 rounded-lg hover:bg-amber-500/10 text-amber-500 transition-colors">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-6 mb-6">
        <div className="w-24 h-24 flex-shrink-0">
          <CircularProgressbar
            value={progress}
            text={`${progress}%`}
            styles={buildStyles({
              textSize: '22px',
              pathColor: isCompleted ? '#22c55e' : '#f59e0b',
              textColor: isDark ? '#fff' : '#1e293b',
              trailColor: isDark ? '#334155' : '#f1f5f9',
              strokeLinecap: 'round',
            })}
          />
        </div>
        
        <div className="flex-1">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider opacity-60">Saved</p>
            <p className="text-2xl font-bold text-amber-500">
              {goal.current_amount.toLocaleString()} <span className="text-sm font-normal text-slate-500">EGP</span>
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-700/10">
            <p className="text-sm opacity-70">
              Goal: <span className="font-semibold">{goal.target_amount.toLocaleString()} EGP</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
          isCompleted 
            ? 'bg-green-500/20 text-green-500'
            : isOnTrack 
              ? 'bg-amber-500/20 text-amber-500'
              : 'bg-red-500/20 text-red-500'
        }`}>
          {isCompleted ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              GOAL REACHED!
            </>
          ) : isOnTrack ? (
            <>
              <TrendingUp className="w-3.5 h-3.5" />
              ON TRACK
            </>
          ) : (
            <>
              <TrendingDown className="w-3.5 h-3.5" />
              BEHIND SCHEDULE
            </>
          )}
        </div>
        
        {goal.category_name && (
          <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded border ${
            isDark ? 'border-slate-700 text-slate-500' : 'border-slate-200 text-slate-400'
          }`}>
            {goal.category_name}
          </span>
        )}
      </div>
    </div>
  );
};

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
      target_date: new Date(goal.target_date).toISOString().split('T')[0]
    } : {
      name: '',
      target_amount: 0,
      current_amount: 0,
      target_date: '',
      category_id: null
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
      alert(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className={`relative w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden ${
        isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'
      }`}>
        <div className="flex items-center justify-between p-6 border-b border-slate-700/10">
          <h2 className="text-2xl font-bold">{goal ? 'Edit Goal' : 'New Savings Goal'}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold mb-2 opacity-70">Goal Name</label>
            <input
              {...register('name')}
              placeholder="e.g. New Laptop"
              className={`w-full p-4 rounded-xl border transition-all outline-none focus:ring-2 focus:ring-amber-500/50 ${
                isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
              } ${errors.name ? 'border-red-500' : ''}`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Target Amount */}
            <div>
              <label className="block text-sm font-semibold mb-2 opacity-70">Target (EGP)</label>
              <input
                type="number"
                {...register('target_amount', { valueAsNumber: true })}
                className={`w-full p-4 rounded-xl border transition-all outline-none focus:ring-2 focus:ring-amber-500/50 ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              />
              {errors.target_amount && <p className="text-red-500 text-xs mt-1 font-medium">{errors.target_amount.message}</p>}
            </div>

            {/* Current Amount */}
            <div>
              <label className="block text-sm font-semibold mb-2 opacity-70">Starting At</label>
              <input
                type="number"
                {...register('current_amount', { valueAsNumber: true })}
                className={`w-full p-4 rounded-xl border transition-all outline-none focus:ring-2 focus:ring-amber-500/50 ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Target Date */}
            <div>
              <label className="block text-sm font-semibold mb-2 opacity-70">Target Date</label>
              <input
                type="date"
                {...register('target_date')}
                className={`w-full p-4 rounded-xl border transition-all outline-none focus:ring-2 focus:ring-amber-500/50 ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              />
              {errors.target_date && <p className="text-red-500 text-xs mt-1 font-medium">{errors.target_date.message}</p>}
            </div>

            {/* Linked Category */}
            <div>
              <label className="block text-sm font-semibold mb-2 opacity-70">Linked Category</label>
              <select
                {...register('category_id')}
                className={`w-full p-4 rounded-xl border transition-all outline-none focus:ring-2 focus:ring-amber-500/50 ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <option value="">None</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              goal ? 'Save Changes' : 'Create Goal'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

const GoalSkeleton = ({ isDark }) => (
  <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'} animate-pulse`}>
    <div className="flex justify-between mb-6">
      <div className="h-6 w-32 bg-slate-700/20 rounded-md" />
      <div className="h-4 w-20 bg-slate-700/20 rounded-md" />
    </div>
    <div className="flex gap-6 mb-6">
      <div className="w-24 h-24 rounded-full bg-slate-700/20" />
      <div className="flex-1 space-y-3">
        <div className="h-3 w-12 bg-slate-700/20 rounded-md" />
        <div className="h-8 w-24 bg-slate-700/20 rounded-md" />
        <div className="h-3 w-full bg-slate-700/20 rounded-md" />
      </div>
    </div>
    <div className="h-6 w-24 bg-slate-700/20 rounded-full" />
  </div>
);

export default Goals;
