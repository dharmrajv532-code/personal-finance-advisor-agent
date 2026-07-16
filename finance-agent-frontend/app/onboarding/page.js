'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { toast } from 'sonner';
import { 
  Sparkles, 
  User, 
  Briefcase, 
  IndianRupee, 
  ArrowRight,
  BrainCircuit
} from 'lucide-react';

const MESSAGES = [
  "Analyzing your financial coordinates...",
  "Detecting your life stage...",
  "Calculating your customized risk tolerance...",
  "Setting up your personalized advisor...",
  "Redirecting to dashboard..."
];

export default function Onboarding() {
  const router = useRouter();
  const { user, isLoading, mutateUser } = useAuth();

  // Form states
  const [age, setAge] = useState('');
  const [occupation, setOccupation] = useState('');
  const [income, setIncome] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);
  const [userData, setUserData] = useState(null);
  const [fadeClass, setFadeClass] = useState('opacity-100 translate-y-0');

  // Sequential loading message animation
  useEffect(() => {
    if (!showOverlay) return;

    let index = 0;
    const interval = setInterval(() => {
      setFadeClass('opacity-0 -translate-y-2 transition-all duration-300');
      
      setTimeout(() => {
        if (index < MESSAGES.length - 1) {
          index += 1;
          setMsgIndex(index);
          setFadeClass('opacity-100 translate-y-0 transition-all duration-500');
        } else {
          clearInterval(interval);
          // Update cache and redirect
          if (userData) {
            mutateUser(userData);
          }
          router.push('/dashboard');
        }
      }, 300);
    }, 1500);

    return () => clearInterval(interval);
  }, [showOverlay, userData, router, mutateUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!age || !occupation || !income) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.put(`/user/${user.id}`, {
        age: parseInt(age),
        income: parseFloat(income),
        occupation: occupation
      });
      
      setUserData(response.data);
      setShowOverlay(true);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to initialize profile. Please try again.');
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] text-foreground flex flex-col items-center justify-center space-y-4 select-none">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <Sparkles className="w-5 h-5 text-primary absolute animate-pulse" />
        </div>
        <p className="text-xs text-muted-foreground font-mono">Securing channel...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] relative overflow-hidden flex items-center justify-center p-4">
      {/* Ambient background glow blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 opacity-[0.04]">
        <div className="absolute top-[10%] left-[5%] w-[600px] h-[600px] rounded-full bg-primary blur-[120px] animate-blob1" />
        <div className="absolute bottom-[15%] right-[10%] w-[500px] h-[500px] rounded-full bg-secondary blur-[100px] animate-blob2" />
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808007_1px,transparent_1px),linear-gradient(to_bottom,#80808007_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Card container */}
      <div className="bg-[#16161F]/60 backdrop-blur-xl border border-[#2A2A3A] w-full max-w-md rounded-2xl shadow-2xl relative z-10 p-6 sm:p-8 animate-fade-in-up">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-gradient-to-tr from-primary/10 to-secondary/10 border border-primary/20 rounded-2xl text-primary mb-4">
            <BrainCircuit className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
            Complete Your Profile
          </h2>
          <p className="text-xs text-muted-foreground mt-2 max-w-xs mx-auto">
            Provide your details so our AI engine can compute your financial life stage, risk parameters, and customized recommendations.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Age Field */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground block">Age</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 28"
                min="1"
                max="120"
                className="w-full pl-10 pr-4 py-2.5 border border-[#2A2A3A] rounded-xl bg-[#0A0A0F]/50 text-foreground text-sm focus:outline-none focus:border-primary transition-colors font-medium"
                required
              />
            </div>
          </div>

          {/* Occupation Field */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground block">Occupation</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <select
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-[#2A2A3A] rounded-xl bg-[#0A0A0F]/50 text-foreground text-sm focus:outline-none focus:border-primary transition-colors font-medium"
                required
              >
                <option value="">Select...</option>
                <option value="student">Student</option>
                <option value="freelancer">Freelancer</option>
                <option value="professional">Professional</option>
                <option value="business_owner">Business Owner</option>
                <option value="retired">Retired / Other</option>
              </select>
            </div>
          </div>

          {/* Monthly Income Field */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground block">Monthly Income (INR)</label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="number"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                placeholder="e.g. 50000"
                className="w-full pl-10 pr-4 py-2.5 border border-[#2A2A3A] rounded-xl bg-[#0A0A0F]/50 text-foreground text-sm focus:outline-none focus:border-primary transition-colors font-medium"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-6 bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {submitting ? 'Initializing...' : 'Setup My Advisor'}
            {!submitting && <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 duration-200" />}
          </button>
        </form>
      </div>

      {/* Fullscreen Premium Overlay */}
      {showOverlay && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0A0A0F]/90 backdrop-blur-md select-none animate-in fade-in duration-500">
          {/* Glowing pulse rings */}
          <div className="relative flex items-center justify-center mb-8">
            <div className="absolute w-24 h-24 rounded-full border border-primary/30 animate-ping opacity-75" />
            <div className="absolute w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-secondary blur-md opacity-40 animate-pulse" />
            <div className="w-16 h-16 rounded-2xl bg-card border border-[#2A2A3A] flex items-center justify-center text-primary shadow-2xl relative z-10 animate-bounce">
              <BrainCircuit className="w-8 h-8 text-primary animate-pulse" />
            </div>
          </div>

          <div className="text-center space-y-3 px-4 max-w-sm">
            <h3 className="text-lg font-bold bg-gradient-to-r from-primary via-indigo-400 to-secondary bg-clip-text text-transparent tracking-tight">
              Analyzing your financial profile...
            </h3>
            <p className={`text-xs text-muted-foreground font-mono leading-relaxed h-8 ${fadeClass}`}>
              {MESSAGES[msgIndex]}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
