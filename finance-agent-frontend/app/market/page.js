'use client';

import { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  HelpCircle,
  RefreshCw,
  LineChart as LineIcon,
  Percent,
  Coins,
  Gem,
  Award
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { formatINR, cn } from '@/lib/utils';
import StatCard from '@/components/shared/StatCard';
import CurrencyDisplay from '@/components/shared/CurrencyDisplay';
import { StatsRowSkeleton, ChartSkeleton } from '@/components/shared/Skeletons';
import EmptyState from '@/components/shared/EmptyState';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from 'sonner';

export default function MarketPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchMarketData = async (showToast = false) => {
    if (showToast) setRefreshing(true);
    try {
      // Fetch multi-asset data: stock (Nifty), gold, silver, platinum
      const res = await api.get('/market/stock,gold,silver,platinum');
      setData(res.data);
      setLastUpdated(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      if (showToast) toast.success('Market insights refreshed successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to load market rates.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMarketData();
    }
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-6 select-none animate-in fade-in duration-300">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <Sparkles className="w-6 h-6 text-primary absolute animate-pulse" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-bold text-foreground">Fetching Live Market Insights</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Retrieving real-time stock indices, commodity rates (Gold, Silver, Platinum), and processing technical RSI signals. Please wait...
          </p>
        </div>
      </div>
    );
  }

  const assets = data?.assets || {};

  // Helpers to safely format prices
  const formatAssetPrice = (key, assetData) => {
    if (!assetData) return '-';
    if (key === 'stock') {
      return assetData.latest_price ? assetData.latest_price.toLocaleString('en-IN') : '-';
    }
    if (key === 'gold') {
      return assetData.latest_price_inr_per_10gram ? formatINR(assetData.latest_price_inr_per_10gram) : '-';
    }
    // Silver or Platinum per gram
    return assetData.latest_price_inr_per_gram ? formatINR(assetData.latest_price_inr_per_gram) : '-';
  };

  const getPriceLabel = (key) => {
    if (key === 'stock') return 'NIFTY 50 Index';
    if (key === 'gold') return 'Gold Price (per 10g)';
    if (key === 'silver') return 'Silver Price (per gram)';
    if (key === 'platinum') return 'Platinum Price (per gram)';
    return '';
  };

  // RSI specific badge signals:
  // RSI > 70: SELL / Overbought (red)
  // RSI 30-70: BUY Opportunity (green)
  // RSI < 30: STRONG BUY / Oversold (blue)
  const getSignalBadgeDetails = (rsiVal) => {
    if (rsiVal > 70) {
      return { label: 'SELL / Overbought', style: 'bg-danger/10 text-danger border-danger/20' };
    }
    if (rsiVal < 30) {
      return { label: 'STRONG BUY / Oversold', style: 'bg-info/10 text-info border-info/20' };
    }
    return { label: 'BUY Opportunity', style: 'bg-success/10 text-success border-success/20' };
  };

  const getAssetIcon = (key) => {
    if (key === 'stock') return <TrendingUp className="w-5 h-5" />;
    if (key === 'gold') return <Coins className="w-5 h-5" />;
    if (key === 'silver') return <Award className="w-5 h-5" />;
    return <Gem className="w-5 h-5" />;
  };

  const getAssetIconColor = (key) => {
    if (key === 'stock') return 'text-success bg-success/10 border-success/20';
    if (key === 'gold') return 'text-warning bg-warning/10 border-warning/20';
    if (key === 'silver') return 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20';
    return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
  };

  // Dynamic Rule-Based AI recommendation based on RSI and prices
  const generateDynamicRecommendation = (assets) => {
    if (!assets || Object.keys(assets).length === 0) return '';
    
    // Find best asset (lowest RSI) and worst asset (highest RSI)
    let bestAsset = null;
    let lowestRsi = 101;
    let worstAsset = null;
    let highestRsi = -1;
    
    Object.entries(assets).forEach(([key, val]) => {
      const rsi = val.rsi || 50;
      if (rsi < lowestRsi) {
        lowestRsi = rsi;
        bestAsset = key;
      }
      if (rsi > highestRsi) {
        highestRsi = rsi;
        worstAsset = key;
      }
    });
    
    const assetNames = {
      stock: 'NIFTY 50 Index',
      gold: 'Gold',
      silver: 'Silver',
      platinum: 'Platinum'
    };
    
    const nameBest = assetNames[bestAsset] || bestAsset;
    const nameWorst = assetNames[worstAsset] || worstAsset;
    
    let text = `Based on current RSI and trend analysis, **${nameBest}** looks like the better investment option right now (RSI: ${lowestRsi}). `;
    
    if (lowestRsi < 30) {
      text += `It is currently in the oversold zone, presenting a strong buy opportunity. `;
    } else if (lowestRsi <= 50) {
      text += `It is in a stable consolidation phase, suitable for starting a small SIP. `;
    } else {
      text += `It has a relatively moderate entry point compared to other commodities. `;
    }
    
    if (worstAsset && worstAsset !== bestAsset) {
      text += `Avoid **${nameWorst}** for now (RSI: ${highestRsi}) as it shows overbought or weaker signals.`;
    }
    
    return text;
  };

  const recommendation = generateDynamicRecommendation(assets);

  // Compile combined historical data from backend response with normalization (Base 100 on Day 1)
  const chartData = [];
  if (data?.assets) {
    const stockHistory = assets.stock?.history || [];
    const goldHistory = assets.gold?.history || [];
    const silverHistory = assets.silver?.history || [];
    const platinumHistory = assets.platinum?.history || [];
    
    // Day 1 prices for indexing to base 100
    const day1Stock = stockHistory[0]?.value || 1;
    const day1Gold = goldHistory[0]?.value || 1;
    const day1Silver = silverHistory[0]?.value || 1;
    const day1Platinum = platinumHistory[0]?.value || 1;
    
    const maxLength = Math.max(
      stockHistory.length,
      goldHistory.length,
      silverHistory.length,
      platinumHistory.length
    );
    
    for (let i = 0; i < maxLength; i++) {
      const sPoint = stockHistory[i];
      const gPoint = goldHistory[i];
      const svPoint = silverHistory[i];
      const pPoint = platinumHistory[i];
      
      chartData.push({
        date: sPoint?.date || gPoint?.date || svPoint?.date || pPoint?.date || '',
        // Indexed to Base 100 (relative percentage)
        Nifty: sPoint?.value ? parseFloat(((sPoint.value / day1Stock) * 100).toFixed(2)) : null,
        Gold: gPoint?.value ? parseFloat(((gPoint.value / day1Gold) * 100).toFixed(2)) : null,
        Silver: svPoint?.value ? parseFloat(((svPoint.value / day1Silver) * 100).toFixed(2)) : null,
        Platinum: pPoint?.value ? parseFloat(((pPoint.value / day1Platinum) * 100).toFixed(2)) : null,
        // Raw values for tooltip
        NiftyRaw: sPoint?.value,
        GoldRaw: gPoint?.value,
        SilverRaw: svPoint?.value,
        PlatinumRaw: pPoint?.value,
      });
    }
  }

  // Custom Recharts Tooltip showing Commodity Name + Value + Date + Normalization Base
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-card border border-border p-4 rounded-xl shadow-lg space-y-2 select-none text-xs">
          <p className="font-bold text-foreground mb-1">Date: {dataPoint.date}</p>
          <div className="space-y-1">
            {dataPoint.NiftyRaw && (
              <div className="flex justify-between items-center gap-4">
                <span className="flex items-center gap-1.5 font-semibold text-[#10B981]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                  NIFTY 50:
                </span>
                <span className="font-mono font-bold text-foreground">
                  {dataPoint.NiftyRaw.toLocaleString('en-IN')} pts ({dataPoint.Nifty}%)
                </span>
              </div>
            )}
            {dataPoint.GoldRaw && (
              <div className="flex justify-between items-center gap-4">
                <span className="flex items-center gap-1.5 font-semibold text-[#F59E0B]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                  Gold (10g):
                </span>
                <span className="font-mono font-bold text-foreground">
                  ₹{dataPoint.GoldRaw.toLocaleString('en-IN')} ({dataPoint.Gold}%)
                </span>
              </div>
            )}
            {dataPoint.SilverRaw && (
              <div className="flex justify-between items-center gap-4">
                <span className="flex items-center gap-1.5 font-semibold text-[#6366F1]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#6366F1]" />
                  Silver (g):
                </span>
                <span className="font-mono font-bold text-foreground">
                  ₹{dataPoint.SilverRaw.toLocaleString('en-IN')} ({dataPoint.Silver}%)
                </span>
              </div>
            )}
            {dataPoint.PlatinumRaw && (
              <div className="flex justify-between items-center gap-4">
                <span className="flex items-center gap-1.5 font-semibold text-[#06B6D4]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4]" />
                  Platinum (g):
                </span>
                <span className="font-mono font-bold text-foreground">
                  ₹{dataPoint.PlatinumRaw.toLocaleString('en-IN')} ({dataPoint.Platinum}%)
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 select-none">
        <div>
          <h2 className="text-xl font-bold text-foreground">Market Insights</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-sm text-muted-foreground">Real-time commodity indicators and trade signals</p>
            {lastUpdated && (
              <span className="text-[10px] bg-background-tertiary px-2 py-0.5 rounded-full text-muted-foreground font-mono">
                Updated: {lastUpdated}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => fetchMarketData(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-4 py-1.5 border border-border bg-card hover:bg-background-secondary text-foreground rounded-lg text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
          {refreshing ? 'Refreshing...' : 'Refresh Rates'}
        </button>
      </div>

      {/* Signal Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(assets).map(([key, value]) => {
          const rsiVal = value.rsi || 50;
          const badge = getSignalBadgeDetails(rsiVal);
          const icon = getAssetIcon(key);
          const iconColor = getAssetIconColor(key);

          return (
            <div 
              key={key}
              className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between h-[210px] select-none hover:shadow-md transition-all duration-200"
            >
              {/* Top row */}
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-foreground capitalize text-sm">{key}</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{getPriceLabel(key)}</p>
                </div>
                <div className={cn("p-2 rounded-lg border", iconColor)}>
                  {icon}
                </div>
              </div>

              {/* Price & Change */}
              <div className="mt-2">
                <span className="text-2xl font-extrabold font-mono text-foreground">
                  {formatAssetPrice(key, value)}
                </span>
                <span className="text-[10px] text-muted-foreground ml-1">
                  {key === 'stock' ? 'pts' : key === 'gold' ? '/ 10g' : '/ gram'}
                </span>
              </div>

              {/* RSI Scale */}
              <div className="space-y-1 mt-2">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>RSI Indicator</span>
                  <span className="font-semibold font-mono">{rsiVal}</span>
                </div>
                <div className="w-full h-1.5 bg-background-tertiary rounded-full relative overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      rsiVal > 70 ? 'bg-danger' : rsiVal < 30 ? 'bg-info' : 'bg-success'
                    )}
                    style={{ width: `${rsiVal}%` }}
                  />
                </div>
              </div>

              {/* Action Signal */}
              <div className="mt-3">
                <span className={cn("inline-block px-2.5 py-0.5 rounded border text-[9px] font-bold tracking-wider", badge.style)}>
                  {badge.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Chart & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Commodity Chart (60%) */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col h-[350px] lg:col-span-2 select-none">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Commodity Projections</h3>
            <p className="text-xs text-muted-foreground">6-Day Price Trend (Indexed to Base 100)</p>
          </div>

          <div className="flex-1 relative mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis 
                  stroke="var(--text-muted)" 
                  fontSize={11} 
                  tickLine={false}
                  label={{ value: '% Change (Base 100)', angle: -90, position: 'insideLeft', offset: -5, style: { fill: 'var(--text-muted)', fontSize: '10px' } }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36} />
                <Line type="monotone" name="Nifty 50" dataKey="Nifty" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" name="Gold" dataKey="Gold" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" name="Silver" dataKey="Silver" stroke="#6366F1" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" name="Platinum" dataKey="Platinum" stroke="#06B6D4" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Recommendations Panel (40%) */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between select-none">
          <div>
            <h3 className="text-sm font-semibold text-foreground">AI Signal Recommendation</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Summary recommendation based on technical indices</p>
          </div>

          {recommendation ? (
            <div className="flex-1 mt-6 flex flex-col justify-between">
              <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-xl">
                <p className="text-xs leading-normal font-semibold text-foreground">
                  ✨ {recommendation.replace(/\*\*(.*?)\*\*/g, '$1')}
                </p>
              </div>

              <div className="p-3 bg-background-secondary/50 border border-border rounded-lg text-[10px] leading-normal text-muted-foreground mt-4">
                ⚠️ **Disclaimer**: Technical analysis indicators do not guarantee future returns. Consider personal risk parameters prior to commodity or stock investment actions.
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState title="No recommendation generated" description="Multi-asset results are required to generate advisor signals." />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}