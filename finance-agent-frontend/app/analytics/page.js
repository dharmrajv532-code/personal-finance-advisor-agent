'use client';

import { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  AlertTriangle, 
  RefreshCw, 
  Target, 
  Activity, 
  ShieldAlert, 
  HelpCircle,
  Percent,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { formatINR, getMonthName } from '@/lib/utils';
import StatCard from '@/components/shared/StatCard';
import CurrencyDisplay from '@/components/shared/CurrencyDisplay';
import { StatsRowSkeleton, ChartSkeleton } from '@/components/shared/Skeletons';
import EmptyState from '@/components/shared/EmptyState';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { toast } from 'sonner';

export default function AnalyticsPage() {
  const { user, isLoading: authLoading } = useAuth();
  
  // Data States
  const [dashboard, setDashboard] = useState(null);
  const [healthScore, setHealthScore] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [recurring, setRecurring] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'health' | 'predictions' | 'recurring' | 'alerts'

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const [dashRes, healthRes, predRes, recRes, alertRes] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/analytics/health-score'),
        api.get('/analytics/predictions'),
        api.get('/analytics/recurring'),
        api.get('/analytics/alerts')
      ]);

      setDashboard(dashRes.data);
      setHealthScore(healthRes.data);
      setPredictions(predRes.data);
      setRecurring(recRes.data);
      setAlerts(alertRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load financial analysis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-background-secondary w-48 rounded-lg animate-pulse" />
        <StatsRowSkeleton count={3} />
        <div className="grid grid-cols-5 gap-4">
          <div className="h-10 bg-background-secondary rounded-lg col-span-1 animate-pulse" />
          <div className="h-10 bg-background-secondary rounded-lg col-span-1 animate-pulse" />
          <div className="h-10 bg-background-secondary rounded-lg col-span-1 animate-pulse" />
        </div>
        <ChartSkeleton />
      </div>
    );
  }

  // Calculated Stats
  const income = dashboard?.income || 0;
  const expenses = dashboard?.expenses?.total_spent || 0;
  const netSavings = Math.max(income - expenses, 0);
  const savingsRate = income > 0 ? Math.round((netSavings / income) * 100) : 0;

  // Chart data comparing income vs expenses
  const overviewChartData = [
    {
      name: `${getMonthName(dashboard?.month, true)} ${dashboard?.year}`,
      Income: income,
      Expenses: expenses
    }
  ];

  // Health score formatting
  const score = healthScore?.score || 0;
  const grade = healthScore?.grade || 'Average';
  const breakdown = healthScore?.breakdown || {};

  // Category Predictions formatting
  const categoryPreds = predictions?.category_predictions 
    ? Object.entries(predictions.category_predictions).map(([cat, val]) => ({
        category: cat,
        predicted: val
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Financial Analytics</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Deep-dive forecasts, audits, and health score indicators</p>
      </div>

      {/* Overview Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 select-none">
        <StatCard
          title="Total Earnings"
          value={income}
          icon={TrendingUp}
          iconColor="success"
          subtitle={`for ${getMonthName(dashboard?.month, false)} ${dashboard?.year}`}
        />
        <StatCard
          title="Total Outflows"
          value={expenses}
          icon={TrendingDown}
          iconColor="red"
          subtitle={`against ${formatINR(dashboard?.expenses?.category_breakdown?.length || 0)} categories`}
        />
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-muted-foreground">Savings Rate</span>
            <div className="p-2 bg-indigo/10 text-primary rounded-lg shrink-0">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold font-mono font-tabular text-foreground">{savingsRate}%</span>
            <span className="text-xs text-muted-foreground ml-1.5">savings rate</span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Net Savings: {formatINR(netSavings)}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-border gap-2 overflow-x-auto pb-px select-none scrollbar-none">
        {[
          { id: 'overview', label: 'Cash Flow Overview', icon: Activity },
          { id: 'health', label: 'Health Score Audit', icon: ShieldAlert },
          { id: 'predictions', label: 'AI Spend Forecast', icon: Sparkles },
          { id: 'recurring', label: 'Recurring Outflows', icon: RefreshCw },
          { id: 'alerts', label: 'Smart Alerts', icon: AlertTriangle, count: alerts?.total_alerts }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-danger/10 text-danger border border-danger/10">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="mt-6">
        
        {/* OVERVIEW PANEL */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm lg:col-span-2 h-[350px] flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Cash Flow Comparison</h3>
                <p className="text-xs text-muted-foreground">Income vs Expenses comparison for current period</p>
              </div>

              <div className="flex-1 relative mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overviewChartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                    <Tooltip 
                      formatter={(val) => [formatINR(val)]}
                      contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Bar dataKey="Income" fill="#10B981" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Expenses" fill="#EF4444" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between select-none">
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Outflows Breakdown</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Top expenditure sources logged this month</p>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3.5 mt-6 max-h-[220px] pr-1">
                {dashboard?.expenses?.category_breakdown?.length > 0 ? (
                  dashboard.expenses.category_breakdown.map((cat, idx) => {
                    const percentage = expenses > 0 ? Math.round((cat.total / expenses) * 100) : 0;
                    return (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-foreground capitalize">{cat.category}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-muted-foreground">{formatINR(cat.total)}</span>
                          <span className="text-[10px] font-bold bg-background-tertiary text-muted-foreground px-1.5 py-0.5 rounded">
                            {percentage}%
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <EmptyState title="No items found" description="Transactions breakdown will list here." />
                )}
              </div>
            </div>
          </div>
        )}

        {/* HEALTH SCORE PANEL */}
        {activeTab === 'health' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 select-none">
            {/* SVG Circular Gauge */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
              <h3 className="text-sm font-semibold text-foreground self-start mb-6">Financial Health Gauge</h3>
              
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="var(--border)"
                    strokeWidth="8"
                  />
                  {/* Animated Score Fill */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke={score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444'}
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - score / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-extrabold font-mono font-tabular text-foreground">{score}</span>
                  <span className="text-[10px] text-muted-foreground font-bold">/ 100</span>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-xs text-muted-foreground">Rating Category</p>
                <h4 className="text-sm font-bold text-foreground mt-1 capitalize">{grade}</h4>
              </div>
            </div>

            {/* Breakdown Points */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm lg:col-span-2 space-y-4">
              <h3 className="text-sm font-semibold text-foreground mb-4">Health Breakdown Details</h3>
              
              {Object.entries(breakdown).map(([key, data]) => {
                const titleMap = {
                  savings_rate: 'Savings Rate Score',
                  budget_adherence: 'Budget Discipline Score',
                  goal_progress: 'Active Goals Target Progress',
                  income_tracked: 'Income Tracking Factor'
                };
                const percentage = Math.round((data.score / data.max) * 100);

                return (
                  <div key={key} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-foreground capitalize">{titleMap[key] || key}</span>
                      <span className="text-muted-foreground font-mono text-[10px]">
                        {data.score} / {data.max} pts ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-background-tertiary rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          percentage >= 80 ? 'bg-success' : percentage >= 50 ? 'bg-warning' : 'bg-danger'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI PREDICTIONS PANEL */}
        {activeTab === 'predictions' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 select-none">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm lg:col-span-2 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">AI Category Forecast</h3>
                  <p className="text-xs text-muted-foreground">Predicted next month outflows based on past trends</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground font-bold">Predicted Total</p>
                  <span className="text-sm font-bold text-foreground">{formatINR(predictions?.total_predicted || 0)}</span>
                </div>
              </div>

              <div className="divide-y divide-border/60">
                {categoryPreds.length > 0 ? (
                  categoryPreds.map((pred, idx) => (
                    <div key={idx} className="py-2.5 flex justify-between items-center text-xs">
                      <span className="font-semibold text-foreground capitalize">{pred.category}</span>
                      <span className="font-mono text-muted-foreground">{formatINR(pred.predicted)}</span>
                    </div>
                  ))
                ) : (
                  <EmptyState title="Predictions unavailable" description="Need at least 1 month of logged data to build predictions." />
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">AI Recommendations</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Automated suggestions based on trends</p>
              </div>

              <div className="mt-6 flex-1 space-y-3">
                <div className="p-3 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-lg text-xs leading-normal text-foreground">
                  💡 **Save More**: Try capping category spending or allocating ₹1,500 more this month to secure active savings goals ahead of target deadlines.
                </div>
                <div className="p-3 bg-background-secondary/50 border border-border rounded-lg text-xs leading-normal text-muted-foreground">
                  📊 **Budget Alert**: Reducing non-essential category expenditures could boost your overall savings rate score by up to 8 points.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RECURRING PANEL */}
        {activeTab === 'recurring' && (
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm select-none">
            <h3 className="text-sm font-semibold text-foreground mb-4">Detected Recurring Expenditures</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recurring?.recurring_categories?.length > 0 ? (
                recurring.recurring_categories.map((cat, idx) => (
                  <div key={idx} className="border border-border bg-background rounded-xl p-4 flex justify-between items-center shadow-xs">
                    <div>
                      <h4 className="text-sm font-bold text-foreground capitalize">{cat}</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Recurring pattern detected</p>
                    </div>
                    <span className="px-2.5 py-0.5 bg-info/10 text-info border border-info/20 text-[10px] font-bold rounded-full">
                      Monthly
                    </span>
                  </div>
                ))
              ) : (
                <div className="col-span-full">
                  <EmptyState 
                    icon={RefreshCw} 
                    title="No recurring patterns detected" 
                    description="When expenses show regular monthly patterns, they will be listed here." 
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ALERTS PANEL */}
        {activeTab === 'alerts' && (
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm select-none">
            <h3 className="text-sm font-semibold text-foreground mb-4">Active System Alerts</h3>

            <div className="space-y-4">
              {alerts?.alerts?.length > 0 ? (
                alerts.alerts.map((alert, idx) => {
                  let alertStyle = 'border-warning/30 bg-warning/5 text-warning';
                  
                  if (alert.type === 'budget_exceeded' || alert.type === 'goal_overdue') {
                    alertStyle = 'border-danger/30 bg-danger/5 text-danger';
                  }

                  return (
                    <div 
                      key={idx} 
                      className={`border rounded-xl p-4 flex gap-3 items-center shadow-xs ${alertStyle}`}
                    >
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                      <p className="text-xs font-semibold leading-normal">{alert.message}</p>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 flex flex-col items-center justify-center text-center">
                  <CheckCircle2 className="w-12 h-12 text-success mb-3" />
                  <h4 className="font-bold text-foreground">All Clear!</h4>
                  <p className="text-xs text-muted-foreground max-w-xs mt-1">
                    No budget exceptions or overdue goals found. You're completely on track.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}