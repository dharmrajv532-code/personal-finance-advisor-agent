'use client';

import { useState, useEffect } from 'react';
import { 
  Calculator, 
  HelpCircle, 
  TrendingUp, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  Percent,
  Coins
} from 'lucide-react';
import { formatINR } from '@/lib/utils';
import CurrencyDisplay from '@/components/shared/CurrencyDisplay';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function CalculatorPage() {
  // Inputs
  const [monthlyInvest, setMonthlyInvest] = useState(5000);
  const [returnRate, setReturnRate] = useState(12);
  const [years, setYears] = useState(15);

  // Projections
  const [totalInvested, setTotalInvested] = useState(0);
  const [wealthGained, setWealthGained] = useState(0);
  const [maturityValue, setMaturityValue] = useState(0);
  const [chartData, setChartData] = useState([]);

  // Calculate results on input change
  useEffect(() => {
    const P = monthlyInvest;
    const R = returnRate;
    const Y = years;

    const i = R / (12 * 100);
    const n = Y * 12;

    const M = P * (((Math.pow(1 + i, n) - 1) / i) * (1 + i));
    const I = P * n;
    const W = Math.max(M - I, 0);

    setTotalInvested(Math.round(I));
    setWealthGained(Math.round(W));
    setMaturityValue(Math.round(M));

    // Generate year-by-year projections for the chart
    const data = [];
    for (let yr = 1; yr <= Y; yr++) {
      const monthsCount = yr * 12;
      const yrMaturity = P * (((Math.pow(1 + i, monthsCount) - 1) / i) * (1 + i));
      const yrInvested = P * monthsCount;
      const yrWealth = Math.max(yrMaturity - yrInvested, 0);

      data.push({
        year: `Yr ${yr}`,
        'Invested Amount': Math.round(yrInvested),
        'Total Wealth': Math.round(yrMaturity)
      });
    }
    setChartData(data);
  }, [monthlyInvest, returnRate, years]);

  const loadPreset = (pMonthly, pRate, pYears) => {
    setMonthlyInvest(pMonthly);
    setReturnRate(pRate);
    setYears(pYears);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">SIP Calculator</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Simulate and project your mutual fund returns</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 select-none">
        {/* Left Column: Inputs (40%) */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6 lg:col-span-2 flex flex-col justify-between">
          <div className="space-y-5">
            {/* Monthly Investment */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-muted-foreground">Monthly Investment (INR)</label>
                <input
                  type="number"
                  value={monthlyInvest}
                  onChange={(e) => setMonthlyInvest(Math.max(500, Math.min(100000, Number(e.target.value))))}
                  className="w-20 px-2 py-1 border border-border rounded bg-background text-foreground text-xs text-right font-mono focus:outline-none focus:border-primary"
                />
              </div>
              <input
                type="range"
                min="500"
                max="100000"
                step="500"
                value={monthlyInvest}
                onChange={(e) => setMonthlyInvest(Number(e.target.value))}
                className="w-full h-1.5 bg-background-tertiary rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Min: ₹500</span>
                <span>Max: ₹1,00,000</span>
              </div>
            </div>

            {/* Expected Return Rate */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-muted-foreground">Expected Return Rate (% p.a.)</label>
                <input
                  type="number"
                  step="0.5"
                  value={returnRate}
                  onChange={(e) => setReturnRate(Math.max(1, Math.min(30, Number(e.target.value))))}
                  className="w-20 px-2 py-1 border border-border rounded bg-background text-foreground text-xs text-right font-mono focus:outline-none focus:border-primary"
                />
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="0.5"
                value={returnRate}
                onChange={(e) => setReturnRate(Number(e.target.value))}
                className="w-full h-1.5 bg-background-tertiary rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Min: 1%</span>
                <span>Max: 30%</span>
              </div>
            </div>

            {/* Time Period */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-muted-foreground">Time Period (Years)</label>
                <input
                  type="number"
                  value={years}
                  onChange={(e) => setYears(Math.max(1, Math.min(40, Number(e.target.value))))}
                  className="w-20 px-2 py-1 border border-border rounded bg-background text-foreground text-xs text-right font-mono focus:outline-none focus:border-primary"
                />
              </div>
              <input
                type="range"
                min="1"
                max="40"
                step="1"
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full h-1.5 bg-background-tertiary rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Min: 1 Yr</span>
                <span>Max: 40 Yrs</span>
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="border-t border-border pt-5 mt-6">
            <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-3">Investment Presets</h4>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => loadPreset(5000, 15, 15)}
                className="p-2 border border-border hover:border-primary/20 hover:bg-primary/5 text-center rounded-lg text-[10px] font-bold text-muted-foreground hover:text-primary transition-all cursor-pointer shadow-xs"
              >
                Equity SIP
                <span className="block font-normal text-text-muted mt-0.5">₹5k &bull; 15%</span>
              </button>
              <button
                onClick={() => loadPreset(10000, 12, 20)}
                className="p-2 border border-border hover:border-primary/20 hover:bg-primary/5 text-center rounded-lg text-[10px] font-bold text-muted-foreground hover:text-primary transition-all cursor-pointer shadow-xs"
              >
                Balanced
                <span className="block font-normal text-text-muted mt-0.5">₹10k &bull; 12%</span>
              </button>
              <button
                onClick={() => loadPreset(15000, 8, 10)}
                className="p-2 border border-border hover:border-primary/20 hover:bg-primary/5 text-center rounded-lg text-[10px] font-bold text-muted-foreground hover:text-primary transition-all cursor-pointer shadow-xs"
              >
                Debt SIP
                <span className="block font-normal text-text-muted mt-0.5">₹15k &bull; 8%</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Projections Chart & Outputs (60%) */}
        <div className="lg:col-span-3 space-y-6 flex flex-col justify-between">
          {/* Output Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Invested */}
            <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Invested Amount</p>
              <div className="mt-1">
                <CurrencyDisplay amount={totalInvested} size="lg" />
              </div>
            </div>

            {/* Estimated Wealth */}
            <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Wealth Gain</p>
              <div className="mt-1 font-semibold text-success">
                <CurrencyDisplay amount={wealthGained} size="lg" />
              </div>
            </div>

            {/* Maturity Value */}
            <div className="bg-card border border-border rounded-xl p-4 shadow-xs bg-gradient-to-r from-primary/10 to-secondary/5 border-primary/25">
              <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Maturity Wealth</p>
              <div className="mt-1 text-primary">
                <CurrencyDisplay amount={maturityValue} size="lg" />
              </div>
            </div>
          </div>

          {/* Area Chart projection */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm h-[260px] flex flex-col justify-between">
            <h3 className="text-xs font-semibold text-foreground">Wealth Growth Progression</h3>
            <div className="flex-1 relative mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="year" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                  <Tooltip 
                    formatter={(val) => [formatINR(val)]}
                    contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}
                  />
                  <Legend verticalAlign="top" height={28} />
                  <Area type="monotone" dataKey="Total Wealth" stackId="1" stroke="#10B981" fillOpacity={0.06} fill="#10B981" />
                  <Area type="monotone" dataKey="Invested Amount" stackId="2" stroke="#6366F1" fillOpacity={0.06} fill="#6366F1" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}