'use client';

import { useEffect, useState, useRef } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Target, 
  AlertTriangle, 
  MoreVertical, 
  X, 
  PiggyBank, 
  Calendar,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { formatINR, cn } from '@/lib/utils';
import StatCard from '@/components/shared/StatCard';
import CurrencyDisplay from '@/components/shared/CurrencyDisplay';
import { StatsRowSkeleton, CardSkeleton } from '@/components/shared/Skeletons';
import EmptyState from '@/components/shared/EmptyState';
import { toast } from 'sonner';

export default function GoalsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal Control
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalModalMode, setGoalModalMode] = useState('create'); // 'create' | 'edit'
  const [selectedGoal, setSelectedGoal] = useState(null);
  
  const [showSavingsModal, setShowSavingsModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  // Form Fields (Goals)
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');

  // Form Fields (Savings)
  const [savingsAmount, setSavingsAmount] = useState('');

  // Confetti Completion State
  const [completedGoalId, setCompletedGoalId] = useState(null);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/goals/');
      setGoals(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load savings goals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchGoals();
    }
  }, [user]);

  // Click outside menu closer
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenCreate = () => {
    setGoalModalMode('create');
    setSelectedGoal(null);
    setTitle('');
    setTargetAmount('');
    setDeadline('');
    setShowGoalModal(true);
  };

  const handleOpenEdit = (goal) => {
    setGoalModalMode('edit');
    setSelectedGoal(goal);
    setTitle(goal.title);
    setTargetAmount(goal.target_amount.toString());
    setDeadline(goal.deadline ? goal.deadline.split('T')[0] : '');
    setShowGoalModal(true);
    setActiveMenuId(null);
  };

  const handleOpenAddSavings = (goal) => {
    setSelectedGoal(goal);
    setSavingsAmount('');
    setShowSavingsModal(true);
  };

  const handleOpenDelete = (goal) => {
    setSelectedGoal(goal);
    setShowDeleteDialog(true);
    setActiveMenuId(null);
  };

  const handleGoalSubmit = async (e) => {
    e.preventDefault();
    if (!title || !targetAmount || parseFloat(targetAmount) <= 0) {
      toast.error('Please enter a valid title and target amount.');
      return;
    }

    // Backend requires user_id in schemas.GoalCreate
    const payload = {
      user_id: user?.id,
      title,
      target_amount: parseFloat(targetAmount),
      deadline: deadline ? new Date(deadline).toISOString() : null
    };

    try {
      if (goalModalMode === 'create') {
        await api.post('/goals/', payload);
        toast.success('Savings goal established!');
      } else {
        await api.put(`/goals/${selectedGoal.id}`, {
          title,
          target_amount: parseFloat(targetAmount),
          deadline: deadline ? new Date(deadline).toISOString() : null
        });
        toast.success('Goal settings updated!');
      }
      setShowGoalModal(false);
      fetchGoals();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to register goal.');
    }
  };

  const handleSavingsSubmit = async (e) => {
    e.preventDefault();
    if (!savingsAmount || parseFloat(savingsAmount) <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }

    const amountNum = parseFloat(savingsAmount);
    try {
      // POST /goals/{goal_id}/add-savings?amount=X
      const res = await api.post(`/goals/${selectedGoal.id}/add-savings?amount=${amountNum}`);
      const updatedGoal = res.data;
      
      if (updatedGoal.saved_amount >= updatedGoal.target_amount && selectedGoal.saved_amount < selectedGoal.target_amount) {
        setCompletedGoalId(updatedGoal.id);
        toast.success(`🎉 Goal Completed! You reached: ${updatedGoal.title}`);
        // Dismiss completed state after 4s
        setTimeout(() => setCompletedGoalId(null), 4000);
      } else {
        toast.success(`${formatINR(amountNum)} added to savings!`);
      }
      setShowSavingsModal(false);
      fetchGoals();
    } catch (err) {
      console.error(err);
      toast.error('Failed to add savings deposit.');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/goals/${selectedGoal.id}`);
      toast.success('Savings goal deleted.');
      setShowDeleteDialog(false);
      fetchGoals();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete savings goal.');
    }
  };

  // Calculations
  const totalSaved = goals.reduce((sum, item) => sum + item.saved_amount, 0);
  const totalTarget = goals.reduce((sum, item) => sum + item.target_amount, 0);

  const calculateDaysLeft = (deadlineStr) => {
    if (!deadlineStr) return { label: 'No deadline set', state: 'none' };
    
    const deadlineDate = new Date(deadlineStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { label: `Overdue by ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'day' : 'days'}`, state: 'overdue' };
    }
    if (diffDays === 0) {
      return { label: 'Due today', state: 'today' };
    }
    if (diffDays === 1) {
      return { label: 'Due tomorrow', state: 'tomorrow' };
    }
    return { label: `${diffDays} days left`, state: 'normal' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 select-none">
        <div>
          <h2 className="text-xl font-bold text-foreground">Savings Goals</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Establish targets and monitor your progress</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> New Goal
        </button>
      </div>

      {/* Stats Cards */}
      {authLoading || loading ? (
        <StatsRowSkeleton count={3} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between select-none">
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-muted-foreground">Total Goals Active</span>
              <div className="p-2 bg-indigo/10 text-primary rounded-lg shrink-0">
                <Target className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold font-mono font-tabular text-foreground">{goals.length}</span>
              <span className="text-xs text-muted-foreground ml-1.5">goals</span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Build reserves for future purposes
            </div>
          </div>

          <StatCard
            title="Total Savings Accumulated"
            value={totalSaved}
            icon={PiggyBank}
            iconColor="emerald"
            trendValue="Saved"
            subtitle="across all goals"
          />

          <StatCard
            title="Total Combined Target"
            value={totalTarget}
            icon={DollarSign}
            iconColor="purple"
            trendValue="Required"
            subtitle={`Gap: ${formatINR(Math.max(totalTarget - totalSaved, 0))}`}
          />
        </div>
      )}

      {/* Goals Grid */}
      {authLoading || loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CardSkeleton className="h-48" />
          <CardSkeleton className="h-48" />
        </div>
      ) : goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((goal) => {
            const pct = Math.min((goal.saved_amount / goal.target_amount) * 100, 100);
            const remaining = Math.max(goal.target_amount - goal.saved_amount, 0);
            
            const isCompleted = goal.saved_amount >= goal.target_amount;
            const deadlineInfo = calculateDaysLeft(goal.deadline);
            const isOverdue = deadlineInfo.state === 'overdue' && !isCompleted;

            // Visual details configuration
            let barColor = 'from-indigo-500 to-purple-500';
            let badgeStyle = 'bg-primary/10 text-primary border-primary/20';
            let badgeLabel = `${pct.toFixed(0)}%`;
            let cardStyle = 'border-border';

            if (isCompleted) {
              barColor = 'from-success to-emerald-500';
              badgeStyle = 'bg-success/10 text-success border-success/20';
              badgeLabel = 'Completed! 🎉';
              if (completedGoalId === goal.id) {
                cardStyle = 'border-success animate-bounce';
              }
            } else if (pct >= 80) {
              barColor = 'from-warning to-amber-500';
              badgeStyle = 'bg-warning/10 text-warning border-warning/20';
              badgeLabel = 'Almost there! 🔥';
            } else if (isOverdue) {
              badgeStyle = 'bg-danger/10 text-danger border-danger/20';
              badgeLabel = 'Overdue ⚠️';
              cardStyle = 'border-danger/30 bg-danger/5';
            }

            return (
              <div 
                key={goal.id} 
                className={cn(
                  "bg-card border rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 select-none flex flex-col justify-between h-[210px]",
                  cardStyle
                )}
              >
                {/* Header block */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shrink-0 border border-primary/25 shadow-sm">
                      🎯
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-sm truncate max-w-[180px]" title={goal.title}>
                        {goal.title}
                      </h4>
                      <p className="text-[10px] text-muted-foreground">Target: {formatINR(goal.target_amount)}</p>
                    </div>
                  </div>

                  {/* Settings Actions Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setActiveMenuId(activeMenuId === goal.id ? null : goal.id)}
                      className="p-1 rounded-lg text-muted-foreground hover:bg-background-secondary hover:text-foreground cursor-pointer"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {activeMenuId === goal.id && (
                      <div 
                        ref={menuRef}
                        className="absolute right-0 mt-1 w-28 rounded-lg border border-border bg-card shadow-lg py-1 z-15"
                      >
                        <button
                          onClick={() => handleOpenEdit(goal)}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-background-secondary cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleOpenDelete(goal)}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-danger hover:bg-danger/10 hover:text-danger cursor-pointer border-t border-border mt-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress bar details */}
                <div className="space-y-1.5 mt-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-foreground">
                      <CurrencyDisplay amount={goal.saved_amount} size="xs" /> saved
                    </span>
                    <span className="font-mono text-muted-foreground">{pct.toFixed(0)}%</span>
                  </div>
                  
                  <div className="w-full h-2.5 bg-background-tertiary rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-500", barColor)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                    <span>{isCompleted ? 'Goal Achieved!' : `${formatINR(remaining)} remaining`}</span>
                    <span className={cn(isOverdue && 'text-danger font-semibold')}>{deadlineInfo.label}</span>
                  </div>
                </div>

                {/* Bottom block controls */}
                <div className="mt-3 flex justify-between items-center">
                  <span className={cn("inline-block px-2 py-0.5 rounded text-[9px] font-bold border capitalize", badgeStyle)}>
                    {badgeLabel}
                  </span>
                  
                  {!isCompleted && (
                    <button
                      onClick={() => handleOpenAddSavings(goal)}
                      className="px-3 py-1 bg-primary hover:bg-primary-hover text-white rounded-lg text-[10px] font-bold transition-all shadow-sm hover:shadow cursor-pointer"
                    >
                      + Add Savings
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Target}
          title="No goals formulated"
          description="Create savings targets for items like emergency reserves, vacations, or equipment."
          actionLabel="Create Your First Goal"
          onAction={handleOpenCreate}
        />
      )}

      {/* Goal Modal (Create / Edit) */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowGoalModal(false)} />
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl relative z-50 p-6 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowGoalModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg border border-border bg-background hover:bg-background-secondary cursor-pointer"
            >
              <X className="w-4 h-4 text-foreground" />
            </button>

            <h3 className="text-lg font-bold text-foreground mb-4">
              {goalModalMode === 'create' ? 'Create New Goal' : 'Edit Goal Settings'}
            </h3>

            <form onSubmit={handleGoalSubmit} className="space-y-4">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground block">Goal Title</label>
                <div className="relative">
                  <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Emergency Reserve Fund, Macbook Pro"
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>

              {/* Target Amount */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground block">Target Savings (INR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-muted">₹</span>
                  <input
                    type="number"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="100000"
                    min="1"
                    className="w-full pl-8 pr-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>

              {/* Deadline Date */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground block">Target Date Deadline (Optional)</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="px-4 py-2 border border-border bg-background hover:bg-background-secondary rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Establish Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Savings Modal */}
      {showSavingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSavingsModal(false)} />
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl relative z-50 p-6 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowSavingsModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg border border-border bg-background hover:bg-background-secondary cursor-pointer"
            >
              <X className="w-4 h-4 text-foreground" />
            </button>

            <h3 className="text-lg font-bold text-foreground">Allocate Savings</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add deposit to: <span className="font-semibold text-foreground">{selectedGoal?.title}</span>
            </p>

            <form onSubmit={handleSavingsSubmit} className="space-y-4 mt-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground block">Deposit Amount (INR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-muted">₹</span>
                  <input
                    type="number"
                    value={savingsAmount}
                    onChange={(e) => setSavingsAmount(e.target.value)}
                    placeholder="5000"
                    min="1"
                    className="w-full pl-8 pr-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                {selectedGoal && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Required remaining: <span className="font-semibold">{formatINR(selectedGoal.target_amount - selectedGoal.saved_amount)}</span>
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setShowSavingsModal(false)}
                  className="px-4 py-2 border border-border bg-background hover:bg-background-secondary rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Add to Savings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteDialog(false)} />
          <div className="bg-card border border-border w-full max-w-sm rounded-2xl shadow-2xl relative z-50 p-6 animate-in zoom-in-95 duration-200 text-center select-none">
            <AlertTriangle className="w-12 h-12 text-danger mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground">Remove Goal</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-normal">
              Are you sure you want to delete this savings goal? This will clear all tracked savings records associated with it.
            </p>
            <div className="flex justify-center gap-3 mt-6">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="px-4 py-2 border border-border bg-background hover:bg-background-secondary rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-danger hover:bg-danger-hover text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}