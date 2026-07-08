'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Sparkles, TrendingUp, Target, BarChart3, Bot, Key, Mail, Lock, User, Briefcase, IndianRupee, ArrowRight, X } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import ThemeToggle from '@/components/layout/ThemeToggle';
import CrystalCanvas from '@/components/shared/CrystalCanvas';
import GeometricShapeCanvas from '@/components/shared/GeometricShapeCanvas';

export default function LandingPage() {
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register' | 'forgot' | 'reset'
  const [loading, setLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [income, setIncome] = useState('');
  const [occupation, setOccupation] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Redirect if logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleAuthAction = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (authMode === 'login') {
        const res = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', res.data.access_token);
        toast.success('Logged in successfully!');
        router.push('/dashboard');
      } else if (authMode === 'register') {
        if (!name || !email || !password || !age || !income || !occupation) {
          toast.error('All fields are required');
          setLoading(false);
          return;
        }
        
        const registerData = {
          name,
          email,
          password,
          age: parseInt(age),
          income: parseFloat(income),
          occupation,
        };

        await api.post('/auth/register', registerData);
        toast.success('Registration successful! Please login.');
        setPassword('');
        setAuthMode('login');
      } else if (authMode === 'forgot') {
        if (!email) {
          toast.error('Email is required');
          setLoading(false);
          return;
        }
        await api.post('/auth/forgot-password', { email });
        toast.success('Reset code sent to your registered email!');
        setAuthMode('reset');
      } else if (authMode === 'reset') {
        if (!email || !resetCode || !newPassword) {
          toast.error('All fields are required');
          setLoading(false);
          return;
        }
        await api.post('/auth/reset-password', {
          email,
          reset_code: resetCode,
          new_password: newPassword,
        });
        toast.success('Password reset successful! Please login.');
        setPassword('');
        setAuthMode('login');
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || 'Something went wrong. Please try again.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const demoEmail = 'demo@finpilot.ai';
      const demoPassword = 'DemoPassword123!';
      
      try {
        const res = await api.post('/auth/login', { email: demoEmail, password: demoPassword });
        localStorage.setItem('token', res.data.access_token);
        toast.success('Welcome to FinPilot Demo!');
        router.push('/dashboard');
      } catch (loginErr) {
        await api.post('/auth/register', {
          name: 'Demo User',
          email: demoEmail,
          password: demoPassword,
          age: 28,
          income: 800000,
          occupation: 'professional',
        });
        const res = await api.post('/auth/login', { email: demoEmail, password: demoPassword });
        localStorage.setItem('token', res.data.access_token);
        toast.success('Welcome to FinPilot Demo!');
        router.push('/dashboard');
      }
    } catch (err) {
      console.error(err);
      toast.error('Unable to initialize demo account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col justify-between">
      <CrystalCanvas />
      {/* Dynamic Animated Blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[550px] h-[550px] bg-primary/15 rounded-full blur-[130px] pointer-events-none animate-blob1" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[650px] h-[650px] bg-secondary/20 rounded-full blur-[150px] pointer-events-none animate-blob2" />
      <div className="absolute top-[30%] right-[20%] w-[350px] h-[350px] bg-indigo-400/10 rounded-full blur-[100px] pointer-events-none animate-blob1 [animation-delay:4s]" />

      {/* Modern Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <nav className="max-w-7xl mx-auto w-full px-6 md:px-12 py-6 flex justify-between items-center z-10 select-none">
        <div className="flex items-center gap-2.5 select-none group">
          <div className="p-2 bg-gradient-to-tr from-primary to-secondary rounded-xl text-white shadow-md shadow-primary/20 transition-transform group-hover:scale-105 duration-300">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex flex-col leading-none">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-indigo-500 to-secondary bg-clip-text text-transparent">FinPilot</span>
              <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/10">AI</span>
            </div>
            <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest mt-0.5">Your Financial Co-Pilot</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
            className="px-4 py-2 text-sm font-semibold border border-border rounded-lg bg-card hover:bg-background-secondary transition-colors cursor-pointer"
          >
            Sign In
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto w-full px-6 md:px-12 py-12 md:py-24 grid md:grid-cols-2 gap-12 items-center z-10 flex-1">
        <div className="space-y-8 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Powered Personal Finance Assistant</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            Your money, <br />
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">understood.</span> <br />
            Your future, planned.
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto md:mx-0">
            FinPilot AI simplifies tracking income, managing budgets, predicting expenses, monitoring goals, and analyzing stock and metal trends — powered by Groq and Llama 3.3.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <button
              onClick={() => { setAuthMode('register'); setShowAuthModal(true); }}
              className="px-6 py-3 font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              Get Started Free <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleDemoLogin}
              className="px-6 py-3 font-semibold border border-border bg-card hover:bg-background-secondary rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              Try Demo Account
            </button>
          </div>
        </div>

        <div className="relative max-w-lg mx-auto w-full flex items-center justify-center">
          <GeometricShapeCanvas />
          <div className="grid grid-cols-2 gap-4 w-full relative z-10">
            <div className="bg-card border border-border rounded-2xl p-5 space-y-3 hover:translate-y-[-4px] transition-transform shadow-sm">
              <div className="p-2.5 bg-primary/10 text-primary w-fit rounded-xl">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-foreground">AI Advisor</h3>
              <p className="text-xs text-muted-foreground">Get personal suggestions tailored to your life stage and income levels.</p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 space-y-3 hover:translate-y-[-4px] transition-transform shadow-sm">
              <div className="p-2.5 bg-success/10 text-success w-fit rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-foreground">Smart Analytics</h3>
              <p className="text-xs text-muted-foreground">Monitor cash flows and dynamically track your financial health score.</p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 space-y-3 hover:translate-y-[-4px] transition-transform shadow-sm">
              <div className="p-2.5 bg-warning/10 text-warning w-fit rounded-xl">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-foreground">Savings Goals</h3>
              <p className="text-xs text-muted-foreground">Establish goals and track your progress with interactive visualizations.</p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 space-y-3 hover:translate-y-[-4px] transition-transform shadow-sm">
              <div className="p-2.5 bg-info/10 text-info w-fit rounded-xl">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-foreground">Market Signals</h3>
              <p className="text-xs text-muted-foreground">Check real-time buy/hold indicators for Gold, Silver, and NIFTY 50.</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border/50 py-6 text-center text-xs text-muted-foreground z-10 select-none">
        &copy; {new Date().getFullYear()} FinPilot AI. Designed for modern personal finance management.
      </footer>

      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => { if (!loading) setShowAuthModal(false); }}
          />

          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl relative z-50 p-6 sm:p-8 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setShowAuthModal(false)}
              disabled={loading}
              className="absolute top-4 right-4 p-1.5 rounded-lg border border-border bg-background hover:bg-background-secondary transition-colors cursor-pointer disabled:opacity-50"
            >
              <X className="w-4 h-4 text-foreground" />
            </button>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
                {authMode === 'login' && 'Sign In to FinPilot'}
                {authMode === 'register' && 'Create Your Account'}
                {authMode === 'forgot' && 'Reset Password'}
                {authMode === 'reset' && 'Set New Password'}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {authMode === 'login' && 'Access your personal finance command center.'}
                {authMode === 'register' && 'Start organizing your financial future today.'}
                {authMode === 'forgot' && 'Provide your email to receive a password reset code.'}
                {authMode === 'reset' && 'Enter your reset code and set a new password.'}
              </p>
            </div>

            <form onSubmit={handleAuthAction} className="space-y-4">
              {authMode === 'register' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground block">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
                    required
                  />
                </div>
              </div>

              {(authMode === 'login' || authMode === 'register') && (
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-muted-foreground block">Password</label>
                    {authMode === 'login' && (
                      <button
                        type="button"
                        onClick={() => setAuthMode('forgot')}
                        className="text-xs text-primary hover:underline font-medium cursor-pointer"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
                      required
                    />
                  </div>
                </div>
              )}

              {authMode === 'register' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground block">Age</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <input
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="25"
                        min="1"
                        max="120"
                        className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground block">Occupation</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <select
                        value={occupation}
                        onChange={(e) => setOccupation(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
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

                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground block">Annual Income (INR)</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <input
                        type="number"
                        value={income}
                        onChange={(e) => setIncome(e.target.value)}
                        placeholder="600000"
                        className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {authMode === 'reset' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground block">Reset Code</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <input
                        type="text"
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value)}
                        placeholder="Enter code"
                        className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground block">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-semibold rounded-lg transition-colors cursor-pointer shadow-md mt-4 text-sm"
              >
                {loading ? 'Processing...' : (
                  <>
                    {authMode === 'login' && 'Sign In'}
                    {authMode === 'register' && 'Register'}
                    {authMode === 'forgot' && 'Send Reset Code'}
                    {authMode === 'reset' && 'Reset Password'}
                  </>
                )}
              </button>
            </form>

            <div className="text-center mt-6 text-xs text-muted-foreground border-t border-border pt-4">
              {authMode === 'login' && (
                <p>
                  Don't have an account?{' '}
                  <button
                    onClick={() => setAuthMode('register')}
                    className="text-primary hover:underline font-semibold cursor-pointer"
                  >
                    Register here
                  </button>
                </p>
              )}
              {authMode === 'register' && (
                <p>
                  Already have an account?{' '}
                  <button
                    onClick={() => setAuthMode('login')}
                    className="text-primary hover:underline font-semibold cursor-pointer"
                  >
                    Sign In
                  </button>
                </p>
              )}
              {(authMode === 'forgot' || authMode === 'reset') && (
                <button
                  onClick={() => setAuthMode('login')}
                  className="text-primary hover:underline font-semibold cursor-pointer"
                >
                  Back to Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
