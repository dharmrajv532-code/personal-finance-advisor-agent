'use client';

import { useEffect, useState } from 'react';
import { 
  User as UserIcon, 
  Mail, 
  ShieldAlert, 
  Bell, 
  HelpCircle,
  Activity,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { formatINR, cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, mutateUser, isLoading: authLoading } = useAuth();
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [income, setIncome] = useState('');
  const [occupation, setOccupation] = useState('');
  const [riskProfile, setRiskProfile] = useState('moderate');
  const [lifeStage, setLifeStage] = useState('early_career');

  // Subscription Preferences (local only)
  const [monthlyDigest, setMonthlyDigest] = useState(true);
  const [productUpdates, setProductUpdates] = useState(false);

  const [saving, setSaving] = useState(false);
  const [sendingDigest, setSendingDigest] = useState(false);

  const handleSendDigest = async () => {
    setSendingDigest(true);
    try {
      const response = await api.post('/notifications/send-digest');
      toast.success(response.data.message || 'Digest emailed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to email digest.');
    } finally {
      setSendingDigest(false);
    }
  };

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setAge(user.age?.toString() || '');
      setIncome(user.income?.toString() || '');
      setOccupation(user.occupation || '');
      setRiskProfile(user.risk_profile?.toLowerCase() || 'moderate');
      setLifeStage(user.life_stage?.toLowerCase() || 'early_career');

      // Load local preferences
      const savedPrefs = localStorage.getItem('finpilot_prefs');
      if (savedPrefs) {
        try {
          const { monthlyDigest: md, productUpdates: pu } = JSON.parse(savedPrefs);
          setMonthlyDigest(md);
          setProductUpdates(pu);
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name || !age || !income || !occupation) {
      toast.error('Please fill in all profile fields.');
      return;
    }

    setSaving(true);
    try {
      // PUT /user/{user_id}
      const res = await api.put(`/user/${user.id}`, {
        name,
        age: parseInt(age),
        income: parseFloat(income),
        occupation,
        risk_profile: riskProfile,
        life_stage: lifeStage
      });

      // Save local preferences
      localStorage.setItem('finpilot_prefs', JSON.stringify({
        monthlyDigest,
        productUpdates
      }));

      // Update auth cache
      if (mutateUser) {
        mutateUser(res.data);
      }

      toast.success('Preferences saved successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update profile settings.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-background-secondary w-48 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-background-secondary rounded-xl col-span-2 animate-pulse" />
          <div className="h-64 bg-background-secondary rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  // Risk meter config
  const getRiskMeterWidth = () => {
    if (riskProfile === 'conservative') return '33%';
    if (riskProfile === 'moderate') return '66%';
    return '100%';
  };

  const getRiskMeterColor = () => {
    if (riskProfile === 'conservative') return 'bg-success';
    if (riskProfile === 'moderate') return 'bg-warning';
    return 'bg-danger';
  };

  const getRiskLabel = () => {
    if (riskProfile === 'conservative') return 'Low risk tolerance - Capital preservation prioritized';
    if (riskProfile === 'moderate') return 'Medium risk tolerance - Balanced growth approach';
    return 'High risk tolerance - Aggressive equity wealth generation';
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Profile & Preferences</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account profile, risk parameters, and newsletters</p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Personal info & Risk tuning (66%) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card 1: Personal Info */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-primary" /> Personal Information
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground block">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground block">Email Address (Read-only)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-background-tertiary text-muted-foreground text-sm focus:outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground block">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground block">Occupation</label>
                <input
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground block">Monthly Income (INR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-muted">₹</span>
                  <input
                    type="number"
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Risk Profile tuning */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-warning" /> Financial Preferences & Risk Profile
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground block">Risk Strategy</label>
                <select
                  value={riskProfile}
                  onChange={(e) => setRiskProfile(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:border-primary capitalize"
                >
                  <option value="conservative">Conservative</option>
                  <option value="moderate">Moderate</option>
                  <option value="aggressive">Aggressive</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground block">Life Stage Category</label>
                <select
                  value={lifeStage}
                  onChange={(e) => setLifeStage(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:border-primary capitalize"
                >
                  <option value="student">Student</option>
                  <option value="early_career">Early Career</option>
                  <option value="mid_career">Mid Career</option>
                  <option value="retired">Retired</option>
                </select>
              </div>
            </div>

            {/* Visual Risk Meter */}
            <div className="border border-border/80 rounded-xl p-4 bg-background-secondary/30 space-y-2 mt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-foreground">Risk Level Meter</span>
                <span className="font-semibold capitalize text-muted-foreground">{riskProfile}</span>
              </div>
              <div className="w-full h-2.5 bg-background-tertiary rounded-full overflow-hidden">
                <div 
                  className={cn("h-full rounded-full transition-all duration-500", getRiskMeterColor())}
                  style={{ width: getRiskMeterWidth() }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground italic mt-1 leading-normal">
                {getRiskLabel()}
              </p>
            </div>
          </div>

        </div>

        {/* Right Column: Notification preferences & actions (33%) */}
        <div className="space-y-6">
          
          {/* Card 3: Notification Subscriptions */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Bell className="w-4 h-4 text-info" /> Notification Preferences
            </h3>

            <div className="space-y-4">
              {/* Toggle 1: Email digest */}
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Email Digests</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-normal">
                    Receive monthly AI wealth audits and budget performance metrics directly in your inbox.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={monthlyDigest}
                  onChange={(e) => setMonthlyDigest(e.target.checked)}
                  className="w-8 h-4 rounded-full border border-border appearance-none cursor-pointer checked:bg-primary transition-all relative shrink-0 before:content-[''] before:absolute before:w-3 before:h-3 before:bg-card before:border before:border-border before:rounded-full before:top-[1px] before:left-[1px] checked:before:left-[15px] before:transition-all"
                />
              </div>

              {/* Toggle 2: Product Updates */}
              <div className="flex justify-between items-start gap-4 border-t border-border pt-4">
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Product Alerts</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-normal">
                    Get updates on newly integrated mutual funds projections and commodities indicators features.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={productUpdates}
                  onChange={(e) => setProductUpdates(e.target.checked)}
                  className="w-8 h-4 rounded-full border border-border appearance-none cursor-pointer checked:bg-primary transition-all relative shrink-0 before:content-[''] before:absolute before:w-3 before:h-3 before:bg-card before:border before:border-border before:rounded-full before:top-[1px] before:left-[1px] checked:before:left-[15px] before:transition-all"
                />
              </div>

              {/* Trigger Instant digest button */}
              <div className="border-t border-border pt-4 mt-2">
                <button
                  type="button"
                  onClick={handleSendDigest}
                  disabled={sendingDigest}
                  className="w-full py-2 bg-background-secondary hover:bg-background-tertiary border border-border text-foreground rounded-lg text-[10px] font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  {sendingDigest ? 'Generating Digest...' : 'Email Me Current Digest Now'}
                </button>
              </div>
            </div>
          </div>

          {/* Action Save Button */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer text-center block shadow-md"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

        </div>

      </form>
    </div>
  );
}