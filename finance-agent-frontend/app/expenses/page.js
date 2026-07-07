'use client';

import { useEffect, useState } from 'react';
import { Plus, Sparkles, TrendingDown, DollarSign, Calendar, FileText, AlertTriangle, RefreshCw, X, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { formatINR, MONTHS, getMonthName, formatRelativeDate, cn } from '@/lib/utils';
import StatCard from '@/components/shared/StatCard';
import CurrencyDisplay from '@/components/shared/CurrencyDisplay';
import { StatsRowSkeleton, ChartSkeleton, TableSkeleton } from '@/components/shared/Skeletons';
import EmptyState from '@/components/shared/EmptyState';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

export const CATEGORY_COLORS = {
  Food: '#f97316',       // orange
  Transport: '#3b82f6',  // blue
  Housing: '#6366f1',    // indigo
  Entertainment: '#a855f7', // purple
  Healthcare: '#22c55e', // green
  Education: '#06b6d4',  // cyan
  Shopping: '#ec4899',   // pink
  Utilities: '#eab308',  // yellow
  Savings: '#10b981',    // emerald
  Other: '#6b7280'       // gray
};

export default function ExpensesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [recurring, setRecurring] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPredictions, setShowPredictions] = useState(true);

  // Filters
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [description, setDescription] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  const fetchExpensesData = async () => {
    setLoading(true);
    try {
      const [expRes, sumRes, predRes, recRes] = await Promise.all([
        api.get('/expenses/'),
        api.get(`/expenses/summary?month=${filterMonth}&year=${filterYear}`),
        api.get('/analytics/predictions'),
        api.get('/analytics/recurring')
      ]);

      setExpenses(expRes.data || []);
      setSummary(sumRes.data);
      setPredictions(predRes.data);
      setRecurring(recRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load expenses data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchExpensesData();
    }
  }, [user, filterMonth, filterYear]);

  const handleOpenAdd = () => {
    setAmount('');
    setCategory('Food');
    setDescription('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0 || !category) {
      toast.error('Please enter a valid amount and select a category.');
      return;
    }

    setModalLoading(true);
    try {
      await api.post('/expenses/', {
        amount: parseFloat(amount),
        category,
        description: description || null
      });
      toast.success('Expense recorded successfully!');
      setShowModal(false);
      fetchExpensesData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to register expense.');
    } finally {
      setModalLoading(false);
    }
  };

  const totalSpent = summary?.total_spent || 0;

  // Pie chart config
  const pieData = summary?.category_breakdown?.map((cat) => ({
    name: cat.category,
    value: cat.total
  })) || [];

  // Filter current month expenses client side for list
  const currentMonthExpenses = expenses
    .filter((exp) => {
      const d = new Date(exp.date);
      return (d.getMonth() + 1) === filterMonth && d.getFullYear() === filterYear;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Avg daily spend calculation
  const getDaysInMonth = (m, y) => new Date(y, m, 0).getDate();
  const days = getDaysInMonth(filterMonth, filterYear);
  const avgDailySpend = days > 0 ? totalSpent / days : 0;

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="space-y-6">
      {/* AI Predictions Banner */}
      {predictions && showPredictions && (
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-xl p-4 flex justify-between items-center select-none shadow-sm animate-in fade-in slide-in-from-top duration-300">
          <div className="flex gap-3 items-center">
            <div className="p-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">AI Financial Prediction</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                FinPilot AI predicts next month's total expenses will be approx.{' '}
                <span className="font-bold text-foreground">{formatINR(predictions.total_predicted)}</span>.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setShowPredictions(false)}
            className="p-1 rounded-lg hover:bg-background-secondary border border-border text-foreground transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 select-none">
        <div>
          <h2 className="text-xl font-bold text-foreground">Expenses Management</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Monitor and organize your outflows</p>
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
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>
      </div>

      {/* Stats row */}
      {authLoading || loading ? (
        <StatsRowSkeleton count={3} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Spent This Month"
            value={totalSpent}
            icon={TrendingDown}
            iconColor="red"
            trend="up"
            trendValue="Tracked"
            subtitle={`for ${getMonthName(filterMonth, false)} ${filterYear}`}
          />
          <StatCard
            title="Biggest Category Outflow"
            value={summary?.category_breakdown?.[0]?.total || 0}
            icon={DollarSign}
            iconColor="amber"
            trendValue={summary?.category_breakdown?.[0]?.category || 'None'}
            subtitle="highest spending area"
          />
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between select-none">
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-muted-foreground">Average Daily Outflow</span>
              <div className="p-2 bg-info/10 text-info rounded-lg shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <CurrencyDisplay amount={avgDailySpend} size="3xl" />
              <span className="text-xs text-muted-foreground ml-1">/ day</span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Based on {days} days in {getMonthName(filterMonth, true)}
            </div>
          </div>
        </div>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column: Donut Chart (40%) */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col h-[400px] lg:col-span-2">
          <h3 className="text-sm font-semibold text-foreground mb-4">Category Outflows</h3>
          <div className="flex-1 relative flex items-center justify-center">
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#6b7280'} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val) => [formatINR(val), 'Spent']}
                      contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}
                    />
                    </PieChart>
                  </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Spent</span>
                  <CurrencyDisplay amount={totalSpent} size="xl" />
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center">
                <EmptyState title="No spending logged" description="Category breakdown will populate here." />
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Category Progress List (60%) */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col h-[400px] lg:col-span-3 overflow-hidden">
          <h3 className="text-sm font-semibold text-foreground mb-4">Outflows Breakdown</h3>
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {summary?.category_breakdown?.length > 0 ? (
              summary.category_breakdown.map((cat, i) => {
                const percentage = totalSpent > 0 ? Math.round((cat.total / totalSpent) * 100) : 0;
                const dotColor = CATEGORY_COLORS[cat.category] || '#6b7280';

                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
                        <span className="font-semibold text-foreground capitalize">{cat.category}</span>
                      </div>
                      <span className="text-muted-foreground">
                        <CurrencyDisplay amount={cat.total} size="xs" />{' '}
                        <span className="font-mono font-semibold text-[10px] bg-background-tertiary text-muted-foreground px-1.5 py-0.5 rounded ml-1">
                          {percentage}%
                        </span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-background-tertiary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ backgroundColor: dotColor, width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex items-center justify-center">
                <EmptyState title="No categories found" description="Configure outflows to populate stats." />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Expenses Table */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-semibold text-foreground">Recent Outflows</h3>
          <span className="text-xs text-muted-foreground">Showing last 20 entries</span>
        </div>

        <div className="overflow-x-auto">
          {currentMonthExpenses.length > 0 ? (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs font-semibold uppercase bg-background-secondary/50">
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {currentMonthExpenses.slice(0, 20).map((exp) => (
                  <tr key={exp.id} className="hover:bg-background-secondary/40 transition-colors">
                    <td className="py-3 px-4">
                      <span
                        className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-white capitalize shadow-sm"
                        style={{ backgroundColor: CATEGORY_COLORS[exp.category] || '#6b7280' }}
                      >
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-foreground max-w-[200px] truncate" title={exp.description}>
                      {exp.description || '-'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-danger">
                      <CurrencyDisplay amount={exp.amount} size="sm" />
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground" title={new Date(exp.date).toLocaleString('en-IN')}>
                      {formatRelativeDate(exp.date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 flex items-center justify-center">
              <EmptyState
                icon={TrendingDown}
                title="No expenses registered"
                description="Start logging your expenditures to manage budgets."
                actionLabel="Add Outflow"
                onAction={handleOpenAdd}
              />
            </div>
          )}
        </div>
      </div>

      {/* Recurring Pattern Detector Alerts */}
      {recurring && recurring.total_recurring > 0 && (
        <div className="bg-card border border-border rounded-xl p-4 flex gap-3 items-center select-none shadow-sm">
          <div className="p-2 bg-info/10 text-info rounded-lg shrink-0">
            <RefreshCw className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground">Recurring Expenditure Detected</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              🔄 We detected recurring expenditure in:{' '}
              {recurring.recurring_categories.map((c) => c.charAt(0).toUpperCase() + c.slice(1)).join(', ')}.
            </p>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { if (!modalLoading) setShowModal(false); }} />
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl relative z-50 p-6 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowModal(false)}
              disabled={modalLoading}
              className="absolute top-4 right-4 p-1.5 rounded-lg border border-border bg-background hover:bg-background-secondary cursor-pointer disabled:opacity-50"
            >
              <X className="w-4 h-4 text-foreground" />
            </button>

            <h3 className="text-lg font-bold text-foreground mb-4">Log Outflow</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Amount */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground block">Amount (INR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-muted">₹</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="1200"
                    min="1"
                    step="any"
                    className="w-full pl-8 pr-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                    required
                    disabled={modalLoading}
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground block">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                  required
                  disabled={modalLoading}
                >
                  {Object.keys(CATEGORY_COLORS).map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground block">Optional Description</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-text-muted" />
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., Grocery shopping at DMart, Uber ride to work"
                    rows="3"
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                    disabled={modalLoading}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={modalLoading}
                  className="px-4 py-2 border border-border bg-background hover:bg-background-secondary rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {modalLoading ? 'Saving...' : 'Record Outflow'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}