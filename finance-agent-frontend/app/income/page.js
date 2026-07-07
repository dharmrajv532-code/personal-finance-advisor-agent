'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, TrendingUp, DollarSign, Calendar, FileText, AlertTriangle, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { formatINR, MONTHS, getMonthName, cn } from '@/lib/utils';
import StatCard from '@/components/shared/StatCard';
import CurrencyDisplay from '@/components/shared/CurrencyDisplay';
import { StatsRowSkeleton, ChartSkeleton, TableSkeleton } from '@/components/shared/Skeletons';
import EmptyState from '@/components/shared/EmptyState';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { toast } from 'sonner';

export default function IncomePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [selectedIncome, setSelectedIncome] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Form Fields
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('salary');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [note, setNote] = useState('');

  // Fetch Incomes
  const fetchIncomes = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/income/monthly/${filterMonth}/${filterYear}`);
      setIncomes(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to retrieve income records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchIncomes();
    }
  }, [user, filterMonth, filterYear]);

  const handleOpenAdd = () => {
    setModalMode('add');
    setSelectedIncome(null);
    setAmount('');
    setSource('salary');
    setMonth(filterMonth);
    setYear(filterYear);
    setNote('');
    setShowModal(true);
  };

  const handleOpenEdit = (income) => {
    setModalMode('edit');
    setSelectedIncome(income);
    setAmount(income.amount.toString());
    setSource(income.source);
    setMonth(income.month);
    setYear(income.year);
    setNote(income.note || '');
    setShowModal(true);
  };

  const handleOpenDelete = (income) => {
    setSelectedIncome(income);
    setShowDeleteDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0 || !source) {
      toast.error('Please fill in all required fields with valid values.');
      return;
    }

    const payload = {
      amount: parseFloat(amount),
      source,
      month: parseInt(month),
      year: parseInt(year),
      note: note || null
    };

    try {
      if (modalMode === 'add') {
        await api.post('/income/add', payload);
        toast.success('Income added successfully!');
      } else {
        // PUT /income/update/{id}
        // Note: Backend schema for update allows amount, source, note
        await api.put(`/income/update/${selectedIncome.id}`, {
          amount: parseFloat(amount),
          source,
          note: note || null
        });
        toast.success('Income updated successfully!');
      }
      setShowModal(false);
      fetchIncomes();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to save income record.');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/income/delete/${selectedIncome.id}`);
      toast.success('Income entry deleted.');
      setShowDeleteDialog(false);
      fetchIncomes();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete income entry.');
    }
  };

  // Stats Calculations
  const totalThisMonth = incomes.reduce((sum, item) => sum + item.amount, 0);
  
  const sourceTotals = incomes.reduce((acc, item) => {
    acc[item.source] = (acc[item.source] || 0) + item.amount;
    return acc;
  }, {});

  const highestSource = Object.entries(sourceTotals).reduce(
    (highest, [source, amount]) => (amount > highest.amount ? { source, amount } : highest),
    { source: 'None', amount: 0 }
  );

  // Chart data formatting
  const sourceColors = {
    salary: '#6366F1',   // Indigo
    freelance: '#10B981',// Emerald
    business: '#F59E0B', // Amber
    other: '#64748B'     // Slate
  };

  const chartData = Object.entries(sourceTotals).map(([key, val]) => ({
    source: key.charAt(0).toUpperCase() + key.slice(1),
    amount: val,
    rawSource: key
  }));

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 select-none">
        <div>
          <h2 className="text-xl font-bold text-foreground">Income Tracking</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage and analyze your earnings</p>
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
            <Plus className="w-4 h-4" /> Add Income
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {authLoading || loading ? (
        <StatsRowSkeleton count={3} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Income This Month"
            value={totalThisMonth}
            icon={TrendingUp}
            iconColor="emerald"
            trend="up"
            trendValue="Updated"
            subtitle={`for ${getMonthName(filterMonth, false)} ${filterYear}`}
          />
          <StatCard
            title="Highest Income Source"
            value={highestSource.amount}
            icon={DollarSign}
            iconColor="indigo"
            trend={highestSource.source !== 'None' ? 'up' : null}
            trendValue={highestSource.source.charAt(0).toUpperCase() + highestSource.source.slice(1)}
            subtitle="biggest earner"
          />
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between select-none">
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-muted-foreground">Logged Entries</span>
              <div className="p-2 bg-info/10 text-info rounded-lg shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold font-mono font-tabular text-foreground">{incomes.length}</span>
              <span className="text-xs text-muted-foreground ml-1.5">entries</span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Showing records for {getMonthName(filterMonth, true)} {filterYear}
            </div>
          </div>
        </div>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income Chart */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col h-[380px]">
          <h3 className="text-sm font-semibold text-foreground mb-4">Income by Source</h3>
          <div className="flex-1 relative">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="source" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <Tooltip
                    formatter={(val) => [formatINR(val), 'Income']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}
                  />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={sourceColors[entry.rawSource] || '#6366F1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <EmptyState title="No metrics available" description="Logged items will build this chart." />
              </div>
            )}
          </div>
        </div>

        {/* Income Table */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col h-[380px] lg:col-span-2 overflow-hidden">
          <h3 className="text-sm font-semibold text-foreground mb-4">Income Records</h3>
          <div className="flex-1 overflow-auto">
            {incomes.length > 0 ? (
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs font-semibold uppercase bg-background-secondary/50">
                    <th className="py-3 px-4">Source</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Period</th>
                    <th className="py-3 px-4">Note</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {incomes.map((inc) => (
                    <tr key={inc.id} className="hover:bg-background-secondary/40 transition-colors">
                      <td className="py-3 px-4 capitalize">
                        <span
                          className={cn(
                            "inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold",
                            inc.source === 'salary' && 'bg-primary/10 text-primary',
                            inc.source === 'freelance' && 'bg-success/10 text-success',
                            inc.source === 'business' && 'bg-warning/10 text-warning',
                            inc.source === 'other' && 'bg-muted-foreground/10 text-muted-foreground'
                          )}
                        >
                          {inc.source}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-success">
                        <CurrencyDisplay amount={inc.amount} size="sm" />
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">
                        {getMonthName(inc.month)} {inc.year}
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground truncate max-w-[150px]" title={inc.note}>
                        {inc.note || '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(inc)}
                            className="p-1.5 rounded hover:bg-background-secondary text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(inc)}
                            className="p-1.5 rounded hover:bg-background-secondary text-muted-foreground hover:text-danger transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="h-full flex items-center justify-center">
                <EmptyState
                  title="No incomes registered"
                  description="Start tracking your salaries or freelance earnings."
                  actionLabel="Add Income"
                  onAction={handleOpenAdd}
                />
              </div>
            )}
          </div>
        </div>
      </div>

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
              {modalMode === 'add' ? 'Log Income Entry' : 'Edit Income Entry'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Amount */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground block">Amount (INR)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="25000"
                    min="1"
                    step="any"
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>

              {/* Source */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground block">Income Source</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                  required
                >
                  <option value="salary">Salary</option>
                  <option value="freelance">Freelance</option>
                  <option value="business">Business</option>
                  <option value="other">Other</option>
                </select>
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

              {/* Note */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground block">Optional Note</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-text-muted" />
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g., Monthly bonus, Freelance project payout"
                    rows="3"
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Actions */}
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
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Alert */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteDialog(false)} />
          <div className="bg-card border border-border w-full max-w-sm rounded-2xl shadow-2xl relative z-50 p-6 animate-in zoom-in-95 duration-200 text-center select-none">
            <AlertTriangle className="w-12 h-12 text-danger mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground">Remove Income Entry</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-normal">
              Are you sure you want to delete this income entry? This action is permanent and cannot be undone.
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