'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Shield, 
  Sparkles, 
  TrendingUp, 
  Target, 
  BarChart3, 
  Bot, 
  Key, 
  Mail, 
  Lock, 
  User, 
  Briefcase, 
  IndianRupee, 
  ArrowRight, 
  X, 
  ChevronDown, 
  Star, 
  ChevronRight
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import ThemeToggle from '@/components/layout/ThemeToggle';
import PremiumAmbientBackground from '@/components/shared/PremiumAmbientBackground';
import GeometricShapeCanvas from '@/components/shared/GeometricShapeCanvas';

// ScrollReveal component to animate sections as they enter viewport
function ScrollReveal({ children, className = "", delay = 0 }) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.05, rootMargin: '0px 0px -50px 0px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out transform ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-12'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// FAQ Accordion Item component
function FAQItem({ q, a }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-border/50 py-5 transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left py-2 font-semibold text-foreground hover:text-primary transition-colors cursor-pointer group"
      >
        <span className="text-base md:text-lg pr-4">{q}</span>
        <span className="p-1 bg-card border border-border/60 rounded-lg group-hover:border-primary/40 transition-colors shrink-0">
          <ChevronDown className={`w-4 h-4 text-muted-foreground transform transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
        </span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-40 opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
        <p className="text-sm md:text-base text-muted-foreground pb-2 pl-1 leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register' | 'forgot' | 'reset'
  const [loading, setLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Typewriter/Morphing text state
  const words = ['understood.', 'optimized.', 'planned.', 'simplified.'];
  const [wordIndex, setWordIndex] = useState(0);
  const [fadeClass, setFadeClass] = useState('opacity-100 translate-y-0');



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

  // Navbar scroll listener
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 15) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Typewriter morphing effect
  useEffect(() => {
    const interval = setInterval(() => {
      setFadeClass('opacity-0 -translate-y-2 transition-all duration-500');
      setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % words.length);
        setFadeClass('opacity-0 translate-y-2');
        setTimeout(() => {
          setFadeClass('opacity-100 translate-y-0 transition-all duration-500');
        }, 50);
      }, 500);
    }, 3500);
    return () => clearInterval(interval);
  }, []);



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
      {/* 60fps Premium ambient background canvas */}
      <PremiumAmbientBackground />

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 select-none ${
        scrolled 
          ? 'bg-background/80 backdrop-blur-md border-b border-border/50 shadow-sm py-4' 
          : 'bg-transparent py-6'
      }`}>
        <div className="max-w-7xl mx-auto w-full px-6 md:px-12 flex justify-between items-center">
          <div className="flex items-center gap-2.5 group">
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
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto w-full px-6 md:px-12 pt-32 md:pt-40 pb-16 flex flex-col gap-24 z-10 flex-1">
        
        {/* Hero split grid */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI-Powered Personal Finance Assistant</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1] min-h-[160px] sm:min-h-[190px] md:min-h-[auto]">
              Your money, <br />
              <span className={`inline-block min-w-[210px] sm:min-w-[280px] text-left bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent ${fadeClass}`}>
                {words[wordIndex]}
              </span> <br />
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

          {/* Hero Feature cards with 3D wireframe geometry around them (sandwich depth layer) */}
          <GeometricShapeCanvas>
            {/* 4 Cards with Glassmorphism and Hover Translation */}
            <div className="grid grid-cols-2 gap-4 w-full relative z-10">
              <div className="bg-white/10 dark:bg-white/[0.02] backdrop-blur-md border border-white/20 dark:border-white/[0.08] rounded-2xl p-5 space-y-3 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
                <div className="p-2.5 bg-primary/10 text-primary w-fit rounded-xl">
                  <Bot className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-foreground">AI Advisor</h3>
                <p className="text-xs text-muted-foreground">Get personal suggestions tailored to your life stage and income levels.</p>
              </div>

              <div className="bg-white/10 dark:bg-white/[0.02] backdrop-blur-md border border-white/20 dark:border-white/[0.08] rounded-2xl p-5 space-y-3 hover:-translate-y-2 hover:shadow-xl hover:shadow-success/5 transition-all duration-300">
                <div className="p-2.5 bg-success/10 text-success w-fit rounded-xl">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-foreground">Smart Analytics</h3>
                <p className="text-xs text-muted-foreground">Monitor cash flows and dynamically track your financial health score.</p>
              </div>

              <div className="bg-white/10 dark:bg-white/[0.02] backdrop-blur-md border border-white/20 dark:border-white/[0.08] rounded-2xl p-5 space-y-3 hover:-translate-y-2 hover:shadow-xl hover:shadow-warning/5 transition-all duration-300">
                <div className="p-2.5 bg-warning/10 text-warning w-fit rounded-xl">
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-foreground">Savings Goals</h3>
                <p className="text-xs text-muted-foreground">Establish goals and track your progress with interactive visualizations.</p>
              </div>

              <div className="bg-white/10 dark:bg-white/[0.02] backdrop-blur-md border border-white/20 dark:border-white/[0.08] rounded-2xl p-5 space-y-3 hover:-translate-y-2 hover:shadow-xl hover:shadow-info/5 transition-all duration-300">
                <div className="p-2.5 bg-info/10 text-info w-fit rounded-xl">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-foreground">Market Signals</h3>
                <p className="text-xs text-muted-foreground">Check real-time buy/hold indicators for Gold, Silver, and NIFTY 50.</p>
              </div>
            </div>
          </GeometricShapeCanvas>
        </div>

        {/* Section 2: How It Works */}
        <ScrollReveal className="py-12 border-t border-border/40">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-foreground tracking-tight sm:text-4xl">
              Get started in 3 simple steps
            </h2>
            <p className="text-sm md:text-base text-muted-foreground mt-2">
              Transform your relationship with money in just a few minutes.
            </p>
          </div>

          <div className="relative z-10 grid md:grid-cols-3 gap-12 max-w-5xl mx-auto items-start">
            {/* Desktop Dotted Connecting Line */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 border-t-2 border-dashed border-border/40 z-0 pointer-events-none" />

            {/* Step 1 */}
            <ScrollReveal className="flex flex-col items-center text-center space-y-4 relative z-10" delay={100}>
              <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center text-primary shadow-md hover:scale-105 transition-transform duration-300">
                <User className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-foreground">1. Create Account</h3>
              <p className="text-xs md:text-sm text-muted-foreground max-w-xs leading-relaxed">
                Sign up in seconds and securely initialize your custom financial profile.
              </p>
            </ScrollReveal>

            {/* Step 2 */}
            <ScrollReveal className="flex flex-col items-center text-center space-y-4 relative z-10" delay={300}>
              <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center text-success shadow-md hover:scale-105 transition-transform duration-300">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-foreground">2. Add Income & Expenses</h3>
              <p className="text-xs md:text-sm text-muted-foreground max-w-xs leading-relaxed">
                Log your active financial coordinates to calculate your current health indices.
              </p>
            </ScrollReveal>

            {/* Step 3 */}
            <ScrollReveal className="flex flex-col items-center text-center space-y-4 relative z-10" delay={500}>
              <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center text-warning shadow-md hover:scale-105 transition-transform duration-300">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-foreground">3. Get AI Insights</h3>
              <p className="text-xs md:text-sm text-muted-foreground max-w-xs leading-relaxed">
                Unlock custom optimization charts, advice parameters and goals analysis.
              </p>
            </ScrollReveal>
          </div>
        </ScrollReveal>



        {/* Section 4: FAQ */}
        <ScrollReveal className="py-12 border-t border-border/40">
          <div className="grid md:grid-cols-5 gap-12 max-w-5xl mx-auto">
            <div className="md:col-span-2 space-y-4 text-center md:text-left">
              <h2 className="text-3xl font-extrabold text-foreground tracking-tight sm:text-4xl">
                Frequently Asked Questions
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Have questions about security, pricing, or the underlying AI technology? We've got answers.
              </p>
            </div>
            <div className="md:col-span-3 space-y-2">
              <FAQItem 
                q="Is FinPilot free to use?" 
                a="Yes, FinPilot is completely free to get started. You can track assets, set goals, and get basic AI advisory parameters at no cost."
              />
              <FAQItem 
                q="Is my financial data secure?" 
                a="Your security is our priority. Your financial logs and credential hashes are fully encrypted, stored securely, and never shared with third parties."
              />
              <FAQItem 
                q="Does it work for Indian users?" 
                a="Yes, FinPilot is fully optimized for Indian financial systems, including direct INR currency tracking, and real-time NIFTY 50, Gold, and Silver market indicators."
              />
              <FAQItem 
                q="What AI model powers FinPilot?" 
                a="We use Groq's high-speed Llama 3.3 model to provide extremely fast, accurate, and context-aware personal financial recommendations."
              />
            </div>
          </div>
        </ScrollReveal>

        {/* Section 5: Final CTA */}
        <ScrollReveal className="py-12">
          <div className="bg-gradient-to-tr from-indigo-900/40 via-purple-900/30 to-background border border-primary/20 rounded-3xl p-8 sm:p-16 text-center relative overflow-hidden max-w-5xl mx-auto">
            {/* CTA Background Glow Orbs */}
            <div className="absolute top-[-50%] left-[-20%] w-[300px] h-[300px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-50%] right-[-20%] w-[300px] h-[300px] bg-secondary/15 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                Ready to take control of your finances?
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Join thousands of smart Indians managing money with AI. Track cash flows, predict expenses, and optimize goals today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
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
          </div>
        </ScrollReveal>
      </main>

      {/* Overhauled Footer Section */}
      <footer className="border-t border-border/50 bg-card/20 backdrop-blur-sm z-10">
        <div className="max-w-7xl mx-auto w-full px-6 md:px-12 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Column 1: Logo & Tagline */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-gradient-to-tr from-primary to-secondary rounded-lg text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold text-foreground">FinPilot AI</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
              Your AI-powered personal finance co-pilot. Track cash flows, set smart goals, and optimize your wealth with state-of-the-art AI.
            </p>
          </div>

          {/* Column 2: Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-widest">Quick Links</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => { setAuthMode('register'); setShowAuthModal(true); }} className="text-muted-foreground hover:text-primary transition-colors cursor-pointer flex items-center gap-1">
                  <ChevronRight className="w-3 h-3" /> Get Started
                </button>
              </li>
              <li>
                <button onClick={handleDemoLogin} className="text-muted-foreground hover:text-primary transition-colors cursor-pointer flex items-center gap-1">
                  <ChevronRight className="w-3 h-3" /> Try Demo
                </button>
              </li>
              <li>
                <a href="#faq" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                  <ChevronRight className="w-3 h-3" /> FAQs
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Tech details & Social icons */}
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-widest">Powered By</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Built with Groq & Llama 3.3 model APIs for lightning-fast and context-aware advisory parameters.
              </p>
              <div className="flex gap-4">
                <a href="https://github.com" target="_blank" rel="noreferrer" className="p-2 bg-card border border-border/80 hover:border-primary/40 rounded-lg text-muted-foreground hover:text-primary transition-colors flex items-center justify-center">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.11.82-.26.82-.577v-2.234c-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22v3.293c0 .319.22.694.825.576C20.565 21.795 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noreferrer" className="p-2 bg-card border border-border/80 hover:border-primary/40 rounded-lg text-muted-foreground hover:text-primary transition-colors flex items-center justify-center">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="p-2 bg-card border border-border/80 hover:border-primary/40 rounded-lg text-muted-foreground hover:text-primary transition-colors flex items-center justify-center">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright divider block */}
        <div className="border-t border-border/50 py-6 text-center text-xs text-muted-foreground select-none">
          &copy; {new Date().getFullYear()} FinPilot AI. Designed for modern personal finance management.
        </div>
      </footer>

      {/* Authentication Modal */}
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
