'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  Activity, 
  PlusCircle, 
  Bot, 
  LineChart, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  ChevronRight,
  Plus
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { formatINR, MONTHS, cn } from '@/lib/utils';
import StatCard from '@/components/shared/StatCard';
import CurrencyDisplay from '@/components/shared/CurrencyDisplay';
import { StatsRowSkeleton, ChartSkeleton, TableSkeleton } from '@/components/shared/Skeletons';
import EmptyState from '@/components/shared/EmptyState';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

export default function Dashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [healthScoreDisplay, setHealthScoreDisplay] = useState(0);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(false);
    try {
      const [dashRes, alertsRes, predRes] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/analytics/alerts'),
        api.get('/analytics/predictions')
      ]);

      setData(dashRes.data);
      setAlerts(alertsRes.data || []);
      setPredictions(predRes.data);
    } catch (err) {
      console.error(err);
      setError(true);
      toast.error('Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Animate health score counter
  useEffect(() => {
    if (data?.health_score?.score !== undefined) {
      const score = data.health_score.score;
      let start = 0;
      const duration = 1200; // ms
      const stepTime = Math.abs(Math.floor(duration / score));
      
      const timer = setInterval(() => {
        start += 1;
        setHealthScoreDisplay(start);
        if (start >= score) {
          clearInterval(timer);
          setHealthScoreDisplay(score);
        }
      }, stepTime || 15);

      return () => clearInterval(timer);
    }
  }, [data]);

  if (authLoading || (loading && !data)) {
    return (
      <div className="space-y-6">
        <StatsRowSkeleton count={4} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartSkeleton className="lg:col-span-1" />
          <ChartSkeleton className="lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="w-12 h-12 text-danger mb-4" />
        <h3 className="text-lg font-bold">Unable to load dashboard</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-6">There was an issue connecting to the servers.</p>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Derived stats
  const income = data?.income || 0;
  const expenses = data?.expenses?.total_spent || 0;
  const netSavings = income - expenses;
  const savingsRate = income > 0 ? Math.round((netSavings / income) * 100) : 0;
  const healthScore = data?.health_score?.score || 0;
  
  // Health Score Label & Color
  let healthLabel = 'Fair';
  let healthColor = 'text-warning border-warning';
  let strokeColor = '#F59E0B'; // Amber

  if (healthScore >= 80) {
    healthLabel = 'Excellent';
    healthColor = 'text-success border-success';
    strokeColor = '#10B981'; // Emerald
  } else if (healthScore >= 60) {
    healthLabel = 'Good';
    healthColor = 'text-primary border-primary';
    strokeColor = '#6366F1'; // Indigo
  } else if (healthScore < 40) {
    healthLabel = 'Needs Attention';
    healthColor = 'text-danger border-danger';
    strokeColor = '#EF4444'; // Red
  }

  // Pie chart formatting
  const chartColors = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#3B82F6', '#EC4899', '#14B8A6'];
  const pieData = data?.expenses?.category_breakdown?.map((cat) => ({
    name: cat.category,
    value: cat.total
  })) || [];

  return (
    <div className="space-y-6">
      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Health Score Gauge */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex items-center gap-6">
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            {/* SVG radial ring */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="38"
                stroke="var(--border)"
                strokeWidth="7"
                fill="transparent"
                className="opacity-20"
              />
              <circle
                cx="48"
                cy="48"
                r="38"
                stroke={strokeColor}
                strokeWidth="7"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 38}
                strokeDashoffset={2 * Math.PI * 38 * (1 - healthScoreDisplay / 100)}
                className="transition-all duration-300 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-bold font-mono">{healthScoreDisplay}</span>
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Score</span>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Financial Health</h3>
            <p className={cn("text-lg font-bold mt-1", healthColor.split(' ')[0])}>{healthLabel}</p>
            <span className="text-[10px] text-muted-foreground">Updated just now</span>
          </div>
        </div>

        <StatCard
          title="Monthly Income"
          value={income}
          icon={TrendingUp}
          iconColor="emerald"
          trend="up"
          trendValue="Live"
          subtitle={`for ${MONTHS[data.month - 1]?.label} ${data.year}`}
        />

        <StatCard
          title="Monthly Expenses"
          value={expenses}
          icon={TrendingDown}
          iconColor="red"
          trend={expenses > (income * 0.7) ? 'up' : 'down'}
          trendValue="Tracking"
          subtitle="vs budget caps"
        />

        <StatCard
          title="Net Savings"
          value={netSavings}
          icon={PiggyBank}
          iconColor="purple"
          trend={netSavings > 0 ? 'up' : 'down'}
          trendValue={`${savingsRate}%`}
          subtitle="savings rate"
        />
      </div>

      {/* Charts / Budgets Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col h-[400px]">
          <h3 className="text-sm font-semibold text-foreground mb-4">Expenses Breakdown</h3>
          <div className="flex-1 relative">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val) => [formatINR(val), 'Spent']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '11px', marginTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <EmptyState
                  title="No expenses logged"
                  description="Log your expenses to visualize breakdowns."
                />
              </div>
            )}
          </div>
        </div>

        {/* Budget Status Progress Bars */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col h-[400px] lg:col-span-2 overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-foreground">Budget Progress</h3>
            <span className="text-xs text-muted-foreground">Caps per category</span>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {data?.budget_status?.length > 0 ? (
              data.budget_status.map((budget, i) => {
                const pct = Math.min((budget.spent / budget.monthly_limit) * 100, 100);
                let barColor = 'bg-success';
                if (budget.is_exceeded) {
                  barColor = 'bg-danger';
                } else if (pct >= 80) {
                  barColor = 'bg-warning';
                }

                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground capitalize">{budget.category}</span>
                        {budget.is_exceeded && (
                          <span className="text-[9px] font-semibold bg-danger/10 text-danger px-1.5 py-0.5 rounded-full">
                            Exceeded by {formatINR(budget.spent - budget.monthly_limit)}
                          </span>
                        )}
                      </div>
                      <span className="text-muted-foreground font-mono">
                        {formatINR(budget.spent)} / {formatINR(budget.monthly_limit)}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-background-tertiary rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full transition-all duration-500", barColor)}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex items-center justify-center">
                <EmptyState
                  title="No budgets set"
                  description="Configure category-wise spending limits to stay on track."
                  actionLabel="Set Budget"
                  onAction={() => router.push('/budget')}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Goals, Alerts, Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Savings Goals */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col h-[320px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-foreground">Savings Goals</h3>
            <button 
              onClick={() => router.push('/goals')}
              className="text-xs text-primary hover:underline font-semibold cursor-pointer"
            >
              Manage
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {data?.goals?.length > 0 ? (
              data.goals.map((goal, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-foreground">{goal.title}</span>
                    <span className="font-mono text-muted-foreground">{goal.progress_pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-background-tertiary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                      style={{ width: `${goal.progress_pct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground text-right font-mono">
                    {formatINR(goal.saved)} of {formatINR(goal.target)}
                  </p>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center">
                <EmptyState
                  title="No active goals"
                  description="Set up targets for purchases or rainy days."
                  actionLabel="Create Goal"
                  onAction={() => router.push('/goals')}
                />
              </div>
            )}
          </div>
        </div>

        {/* Smart Alerts */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col h-[320px]">
          <h3 className="text-sm font-semibold text-foreground mb-4">Smart Alerts</h3>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {alerts.length > 0 ? (
              alerts.map((alert, i) => {
                let alertBg = 'bg-info/5 border-info/20 text-info';
                let Icon = Info;
                if (alert.severity === 'critical') {
                  alertBg = 'bg-danger/5 border-danger/20 text-danger';
                  Icon = AlertTriangle;
                } else if (alert.severity === 'warning') {
                  alertBg = 'bg-warning/5 border-warning/20 text-warning';
                  Icon = AlertTriangle;
                }

                return (
                  <div key={i} className={cn("p-3 rounded-lg border text-xs flex gap-2.5 items-start", alertBg)}>
                    <Icon className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground capitalize">{alert.type}</p>
                      <p className="text-muted-foreground mt-0.5 leading-relaxed">{alert.message}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-6 text-center select-none">
                <CheckCircle2 className="w-10 h-10 text-success mb-3" />
                <h4 className="text-sm font-semibold text-foreground">You are fully on track!</h4>
                <p className="text-xs text-muted-foreground mt-0.5">No alerts detected at this moment.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col h-[320px]">
          <h3 className="text-sm font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4 flex-1">
            <button
              onClick={() => router.push('/expenses')}
              className="flex flex-col items-center justify-center p-4 border border-border hover:border-primary/20 bg-background hover:bg-primary/5 text-foreground rounded-xl transition-all cursor-pointer group text-center"
            >
              <div className="p-2 bg-primary/10 text-primary rounded-lg mb-2.5 group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold">Add Expense</span>
            </button>

            <button
              onClick={() => router.push('/income')}
              className="flex flex-col items-center justify-center p-4 border border-border hover:border-success/20 bg-background hover:bg-success/5 text-foreground rounded-xl transition-all cursor-pointer group text-center"
            >
              <div className="p-2 bg-success/10 text-success rounded-lg mb-2.5 group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold">Add Income</span>
            </button>

            <button
              onClick={() => router.push('/advisor')}
              className="flex flex-col items-center justify-center p-4 border border-border hover:border-secondary/20 bg-background hover:bg-secondary/5 text-foreground rounded-xl transition-all cursor-pointer group text-center"
            >
              <div className="p-2 bg-secondary/10 text-secondary rounded-lg mb-2.5 group-hover:scale-110 transition-transform">
                <Bot className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold">Ask Advisor</span>
            </button>

            <button
              onClick={() => router.push('/market')}
              className="flex flex-col items-center justify-center p-4 border border-border hover:border-info/20 bg-background hover:bg-info/5 text-foreground rounded-xl transition-all cursor-pointer group text-center"
            >
              <div className="p-2 bg-info/10 text-info rounded-lg mb-2.5 group-hover:scale-110 transition-transform">
                <LineChart className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold">Market Analysis</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}