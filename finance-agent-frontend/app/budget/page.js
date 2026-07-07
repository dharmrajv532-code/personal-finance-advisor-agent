'use client';

import { useEffect, useState, useRef } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  AlertTriangle, 
  MoreVertical, 
  X, 
  UtensilsCrossed, 
  Car, 
  Home, 
  Tv, 
  Heart, 
  GraduationCap, 
  ShoppingBag, 
  Zap, 
  PiggyBank, 
  MoreHorizontal,
  CheckCircle2,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { formatINR, MONTHS, getMonthName, cn } from '@/lib/utils';
import StatCard from '@/components/shared/StatCard';
import CurrencyDisplay from '@/components/shared/CurrencyDisplay';
import { StatsRowSkeleton, CardSkeleton } from '@/components/shared/Skeletons';
import EmptyState from '@/components/shared/EmptyState';
import { toast } from 'sonner';

export const CATEGORY_ICONS = {
  Food: UtensilsCrossed,
  Transport: Car,
  Housing: Home,
  Entertainment: Tv,
  Healthcare: Heart,
  Education: GraduationCap,
  Shopping: ShoppingBag,
  Utilities: Zap,
  Savings: PiggyBank,
  Other: MoreHorizontal
};

export const CATEGORY_COLORS = {
  Food: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
  Transport: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  Housing: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
  Entertainment: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  Healthcare: 'text-green-500 bg-green-500/10 border-green-500/20',
  Education: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
  Shopping: 'text-pink-500 bg-pink-500/10 border-pink-500/20',
  Utilities: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
  Savings: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  Other: 'text-gray-500 bg-gray-500/10 border-gray-500/20'
};

export default function BudgetPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [statusList, setStatusList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  // Modal Control
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  // Form Fields
  const [category, setCategory] = useState('Food');
  const [limit, setLimit] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  // Fetch Budgets & Statuses
  const fetchBudgetData = async () => {
    setLoading(true);
    try {
      const [budRes, statRes] = await Promise.all([
        api.get(`/budget/?month=${filterMonth}&year=${filterYear}`),
        api.get(`/budget/status/all?month=${filterMonth}&year=${filterYear}`)
      ]);
      setBudgets(budRes.data || []);
      setStatusList(statRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to retrieve budget statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBudgetData();
    }
  }, [user, filterMonth, filterYear]);

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

  const handleOpenAdd = () => {
    setModalMode('add');
    setSelectedBudget(null);
    setCategory('Food');
    setLimit('');
    setMonth(filterMonth);
    setYear(filterYear);
    setShowModal(true);
  };

  const handleOpenEdit = (budget) => {
    setModalMode('edit');
    setSelectedBudget(budget);
    setCategory(budget.category);
    setLimit(budget.monthly_limit.toString());
    setMonth(budget.month);
    setYear(budget.year);
    setShowModal(true);
    setActiveMenuId(null);
  };

  const handleOpenDelete = (budget) => {
    setSelectedBudget(budget);
    setShowDeleteDialog(true);
    setActiveMenuId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!limit || parseFloat(limit) <= 0 || !category) {
      toast.error('Please enter a valid limit and select a category.');
      return;
    }

    const payload = {
      category,
      monthly_limit: parseFloat(limit),
      month: parseInt(month),
      year: parseInt(year)
    };

    try {
      if (modalMode === 'add') {
        await api.post('/budget/', payload);
        toast.success('Budget cap configured successfully!');
      } else {
        await api.put(`/budget/${selectedBudget.id}`, payload);
        toast.success('Budget details updated!');
      }
      setShowModal(false);
      fetchBudgetData();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.detail || 'Failed to register budget.';
      toast.error(msg);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/budget/${selectedBudget.id}`);
      toast.success('Budget limit deleted.');
      setShowDeleteDialog(false);
      fetchBudgetData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete budget limit.');
    }
  };

  // Stats Calculations
  const totalBudgeted = budgets.reduce((sum, item) => sum + item.monthly_limit, 0);
  const totalSpent = statusList.reduce((sum, item) => sum + item.spent, 0);
  const budgetsExceeded = statusList.filter(item => item.is_exceeded).length;

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 select-none">
        <div>
          <h2 className="text-xl font-bold text-foreground">Budget Planner</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Control category limits and expenditures</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(parseInt(e.target.value))}
              className="px-3 py-1.5 border border-border rounded-lg bg-card text-xs font-semibold focus:outline-none focus:border-primary"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(parseInt(e.target.value))}
              className="px-3 py-1.5 border border-border rounded-lg bg-card text-xs font-semibold focus:outline-none focus:border-primary"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Budget
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {authLoading || loading ? (
        <StatsRowSkeleton count={3} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Budgeted Caps"
            value={totalBudgeted}
            icon={DollarSign}
            iconColor="indigo"
            trendValue="Assigned"
            subtitle={`for ${getMonthName(filterMonth, false)} ${filterYear}`}
          />
          <StatCard
            title="Total Outflows"
            value={totalSpent}
            icon={TrendingUp}
            iconColor="red"
            trendValue="Spent"
            subtitle={`vs ${formatINR(totalBudgeted)} caps`}
          />
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between select-none">
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-muted-foreground">Budgets Exceeded</span>
              <div className="p-2 bg-danger/10 text-danger rounded-lg shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold font-mono font-tabular text-foreground">{budgetsExceeded}</span>
              <span className="text-xs text-muted-foreground ml-1.5">of {budgets.length} active caps</span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {budgetsExceeded > 0 ? '⚠️ High spending detected!' : '🎉 All budgets within boundaries!'}
            </div>
          </div>
        </div>
      )}

      {/* Budgets Grid */}
      {authLoading || loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton className="h-44" />
          <CardSkeleton className="h-44" />
          <CardSkeleton className="h-44" />
        </div>
      ) : statusList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statusList.map((status) => {
            // Find actual budget record for update/delete actions
            const matchingBudget = budgets.find(b => b.category.toLowerCase() === status.category.toLowerCase());
            const Icon = CATEGORY_ICONS[status.category] || MoreHorizontal;
            const iconStyle = CATEGORY_COLORS[status.category] || CATEGORY_COLORS.Other;

            const spentPct = Math.min((status.spent / status.monthly_limit) * 100, 100);
            
            // Progress configuration
            let barColor = 'bg-success';
            let badgeStyle = 'bg-success/10 text-success border-success/20';
            let badgeLabel = 'On Track';
            let cardBorder = 'border-border';

            if (status.is_exceeded) {
              barColor = 'bg-danger';
              badgeStyle = 'bg-danger/10 text-danger border-danger/20';
              badgeLabel = 'Exceeded';
              cardBorder = 'border-danger/30 shadow-danger-sm';
            } else if (spentPct >= 80) {
              barColor = 'bg-warning';
              badgeStyle = 'bg-warning/10 text-warning border-warning/20';
              badgeLabel = 'Near Limit';
            }

            return (
              <div 
                key={status.category} 
                className={cn(
                  "bg-card border rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 select-none relative flex flex-col justify-between h-[180px]",
                  cardBorder
                )}
              >
                {/* Upper row */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg border", iconStyle)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground capitalize text-sm">{status.category}</h4>
                      <p className="text-[10px] text-muted-foreground">{getMonthName(filterMonth)} {filterYear}</p>
                    </div>
                  </div>

                  {/* Actions Dropdown */}
                  {matchingBudget && (
                    <div className="relative">
                      <button
                        onClick={() => setActiveMenuId(activeMenuId === matchingBudget.id ? null : matchingBudget.id)}
                        className="p-1 rounded-lg text-muted-foreground hover:bg-background-secondary hover:text-foreground cursor-pointer"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuId === matchingBudget.id && (
                        <div 
                          ref={menuRef}
                          className="absolute right-0 mt-1 w-28 rounded-lg border border-border bg-card shadow-lg py-1 z-15"
                        >
                          <button
                            onClick={() => handleOpenEdit(matchingBudget)}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-background-secondary cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => handleOpenDelete(matchingBudget)}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-danger hover:bg-danger/10 hover:text-danger cursor-pointer border-t border-border mt-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Progress bar info */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <CurrencyDisplay amount={status.spent} size="xs" />
                    <span className="text-muted-foreground font-mono">{Math.round(spentPct)}%</span>
                  </div>
                  <div className="w-full h-2 bg-background-tertiary rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full rounded-full transition-all duration-500", barColor)}
                      style={{ width: `${spentPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Limit: {formatINR(status.monthly_limit)}</span>
                    {status.is_exceeded ? (
                      <span className="text-danger font-semibold font-mono">Exceeded by {formatINR(status.spent - status.monthly_limit)}</span>
                    ) : (
                      <span className="font-mono">{formatINR(status.remaining)} remaining</span>
                    )}
                  </div>
                </div>

                {/* Bottom status badge */}
                <div className="mt-2">
                  <span className={cn("inline-block px-2 py-0.5 rounded text-[9px] font-bold border capitalize", badgeStyle)}>
                    {badgeLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={PiggyBank}
          title="No budgets configured"
          description="Establish category spending limits for this month to monitor outflows."
          actionLabel="Add Your First Budget"
          onAction={handleOpenAdd}
        />
      )}

      {/* Bulk Status View / Overview Table */}
      {statusList.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm overflow-hidden select-none">
          <h3 className="text-sm font-semibold text-foreground mb-4">Budget Overview Table</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs font-semibold uppercase bg-background-secondary/50">
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Limit Cap</th>
                  <th className="py-3 px-4">Spent</th>
                  <th className="py-3 px-4">Remaining</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {statusList.map((status) => {
                  let statusColor = 'text-success font-semibold';
                  if (status.is_exceeded) {
                    statusColor = 'text-danger font-semibold';
                  } else if ((status.spent / status.monthly_limit) >= 0.8) {
                    statusColor = 'text-warning font-semibold';
                  }

                  return (
                    <tr key={status.category} className="hover:bg-background-secondary/40 transition-colors">
                      <td className="py-3 px-4 capitalize font-medium text-foreground">{status.category}</td>
                      <td className="py-3 px-4 font-mono font-medium">{formatINR(status.monthly_limit)}</td>
                      <td className="py-3 px-4 font-mono font-medium text-muted-foreground">{formatINR(status.spent)}</td>
                      <td className="py-3 px-4 font-mono">
                        {status.is_exceeded ? (
                          <span className="text-danger font-semibold">-{formatINR(status.spent - status.monthly_limit)}</span>
                        ) : (
                          <span className="text-success font-semibold">+{formatINR(status.remaining)}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 capitalize text-xs">
                        <span className={statusColor}>
                          {status.is_exceeded ? 'Exceeded' : (status.spent / status.monthly_limit) >= 0.8 ? 'Near Limit' : 'On Track'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl relative z-50 p-6 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg border border-border bg-background hover:bg-background-secondary cursor-pointer"
            >
              <X className="w-4 h-4 text-foreground" />
            </button>

            <h3 className="text-lg font-bold text-foreground mb-4">
              {modalMode === 'add' ? 'Configure Budget Cap' : 'Edit Budget Cap'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground block">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={modalMode === 'edit'}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:border-primary disabled:opacity-50"
                  required
                >
                  {Object.keys(CATEGORY_ICONS).map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Monthly Limit */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground block">Monthly Limit (INR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-muted">₹</span>
                  <input
                    type="number"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                    placeholder="8000"
                    min="1"
                    className="w-full pl-8 pr-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>

              {/* Month / Year */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground block">Month</label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(parseInt(e.target.value))}
                    disabled={modalMode === 'edit'}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:border-primary disabled:opacity-50"
                    required
                  >
                    {MONTHS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground block">Year</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    disabled={modalMode === 'edit'}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:border-primary disabled:opacity-50"
                    required
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-border bg-background hover:bg-background-secondary rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Save Limit
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
            <h3 className="text-lg font-bold text-foreground">Remove Budget Limit</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-normal">
              Are you sure you want to remove this budget category limit? Spending tracking will continue, but the target limit will be cleared.
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