'use client';

import { useEffect, useState, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Trash2, 
  Sparkles, 
  AlertTriangle, 
  User as UserIcon, 
  ArrowRight,
  TrendingUp,
  ShoppingCart,
  Target,
  Activity
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { formatINR, cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdvisorPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Context sidebar details
  const [dashContext, setDashContext] = useState(null);

  // Rate Limiting (10 msgs per minute)
  const [msgTimes, setMsgTimes] = useState([]);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);

  const chatEndRef = useRef(null);

  // Fetch Chat History & Dashboard Context
  const fetchAdvisorContext = async () => {
    setHistoryLoading(true);
    try {
      const [histRes, dashRes] = await Promise.all([
        api.get('/advisor/history'),
        api.get('/analytics/dashboard').catch(() => null) // Optional dashboard context
      ]);
      setMessages(histRes.data || []);
      if (dashRes) {
        setDashContext(dashRes.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load chat history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAdvisorContext();
    }
  }, [user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Rate limiting countdown
  useEffect(() => {
    if (rateLimitCountdown > 0) {
      const timer = setTimeout(() => setRateLimitCountdown(rateLimitCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [rateLimitCountdown]);

  const handleSuggestionClick = (text) => {
    setInput(text);
  };

  const checkRateLimit = () => {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    // Filter messages sent in the last 60s
    const recentMsgs = msgTimes.filter(t => t > oneMinuteAgo);
    
    if (recentMsgs.length >= 10) {
      const oldestRecent = recentMsgs[0];
      const remainingSecs = Math.ceil((oldestRecent + 60000 - now) / 1000);
      setRateLimitCountdown(remainingSecs);
      toast.error(`Rate limit hit. Please wait ${remainingSecs} seconds.`);
      return false;
    }
    
    setMsgTimes([...recentMsgs, now]);
    return true;
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    if (!checkRateLimit()) return;

    const userMsgText = input.trim();
    setInput('');
    setLoading(true);

    // Optimistically add user message
    const userMsg = {
      role: 'user',
      message: userMsgText,
      time: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await api.post('/advisor/chat', { message: userMsgText });
      const botMsg = {
        role: 'assistant',
        message: res.data.response,
        time: new Date().toISOString()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      toast.error('Failed to get advisor response.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([]);
    toast.success('Chat history cleared locally.');
  };

  // Custom Markdown Parsing Helper
  const parseMarkdown = (text) => {
    if (!text) return '';
    const lines = text.split('\n');
    let inList = false;
    const parsedLines = [];

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      // Bold tags
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

      // Check for bullet list
      const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
      if (isBullet) {
        const cleanLine = line.trim().replace(/^[-*]\s+/, '');
        if (!inList) {
          parsedLines.push('<ul class="list-disc pl-5 space-y-1 my-2">');
          inList = true;
        }
        parsedLines.push(`<li>${cleanLine}</li>`);
      } else {
        if (inList) {
          parsedLines.push('</ul>');
          inList = false;
        }
        if (line.trim() === '') {
          parsedLines.push('<div class="h-2"></div>');
        } else {
          parsedLines.push(`<p class="leading-relaxed mb-1.5">${line}</p>`);
        }
      }
    }
    if (inList) {
      parsedLines.push('</ul>');
    }
    return parsedLines.join('');
  };

  const formatMessageTime = (isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const suggestions = [
    "💰 How can I improve my savings rate?",
    "📊 Analyze my spending habits",
    "🎯 Help me reach my goal faster",
    "📈 Should I invest in gold or stocks?"
  ];

  const formatLifeStage = (stage) => {
    if (!stage) return '';
    return stage.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-6 overflow-hidden">
      {/* Main Chat Area */}
      <div className="flex-1 bg-card border border-border rounded-xl shadow-sm flex flex-col overflow-hidden h-full">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-border bg-background-secondary/30 flex justify-between items-center select-none">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">FinPilot AI Advisor</h3>
              <p className="text-[10px] text-muted-foreground font-semibold">Powered by Groq &bull; Llama-3.3-70b</p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-1 px-3 py-1.5 border border-border text-danger hover:bg-danger/10 hover:text-danger rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>

        {/* Rate Limit Countdown Banner */}
        {rateLimitCountdown > 0 && (
          <div className="bg-warning/10 border-b border-warning/20 px-6 py-2 flex items-center gap-2 text-warning text-xs select-none">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Rate limit reached. Please wait {rateLimitCountdown} seconds to send another question.</span>
          </div>
        )}

        {/* Messages Space */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {historyLoading ? (
            <div className="space-y-4">
              <div className="flex gap-3 max-w-[70%]">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="h-16 bg-background-secondary rounded-2xl rounded-tl-sm w-full animate-pulse" />
              </div>
              <div className="flex gap-3 max-w-[60%] ml-auto justify-end">
                <div className="h-12 bg-primary/10 rounded-2xl rounded-tr-sm w-full animate-pulse" />
              </div>
              <div className="flex gap-3 max-w-[75%]">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="h-20 bg-background-secondary rounded-2xl rounded-tl-sm w-full animate-pulse" />
              </div>
            </div>
          ) : messages.length > 0 ? (
            messages.map((msg, i) => {
              const isUser = msg.role === 'user';
              return (
                <div key={i} className={cn("flex gap-3 max-w-[80%] md:max-w-[70%]", isUser ? "ml-auto justify-end" : "")}>
                  {!isUser && (
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-sm border border-primary/20 select-none">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                  <div className="space-y-1">
                    <div
                      className={cn(
                        "p-4 rounded-2xl text-sm shadow-sm select-text",
                        isUser 
                          ? "bg-primary text-white rounded-tr-sm" 
                          : "bg-background border border-border text-foreground rounded-tl-sm"
                      )}
                    >
                      {isUser ? (
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                      ) : (
                        <div 
                          className="prose prose-sm dark:prose-invert max-w-none"
                          dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.message) }}
                        />
                      )}
                    </div>
                    <p className={cn("text-[9px] text-muted-foreground px-1 select-none", isUser ? "text-right" : "")}>
                      {formatMessageTime(msg.time)}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            // Suggestions State
            <div className="h-full flex flex-col justify-center items-center select-none text-center space-y-6">
              <div className="p-4 bg-primary/10 text-primary rounded-full">
                <Sparkles className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-foreground">Welcome to FinPilot AI Advisor</h4>
                <p className="text-sm text-muted-foreground max-w-md">
                  I can analyze your spending caps, calculate financial savings metrics, or provide general wealth management advice.
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
                {suggestions.map((text, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(text)}
                    className="p-3 border border-border hover:border-primary/30 hover:bg-primary/5 rounded-xl text-left text-xs font-semibold text-muted-foreground hover:text-primary transition-all cursor-pointer shadow-sm"
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Typing Indicator */}
          {loading && (
            <div className="flex gap-3 max-w-[70%]">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shrink-0 border border-primary/20 shadow-sm select-none animate-bounce">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-background border border-border text-foreground px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-pulse" />
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-pulse [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-pulse [animation-delay:0.4s]" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-4 border-t border-border bg-background-secondary/35 flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading || rateLimitCountdown > 0}
            placeholder={rateLimitCountdown > 0 ? `Rate limit active...` : "Ask about your finances..."}
            className="flex-1 px-4 py-2.5 border border-border rounded-xl bg-background text-foreground text-sm focus:outline-none focus:border-primary disabled:opacity-50"
            required
          />
          <button
            type="submit"
            disabled={loading || !input.trim() || rateLimitCountdown > 0}
            className="p-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-xl shadow-md transition-colors cursor-pointer shrink-0"
            aria-label="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Context Sidebar (Desktop Only) */}
      {user && (
        <div className="hidden lg:flex w-[260px] bg-card border border-border rounded-xl shadow-sm p-5 flex-col justify-between overflow-y-auto select-none">
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Your Context</h4>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs font-semibold bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full capitalize">
                  {formatLifeStage(user.life_stage)}
                </span>
              </div>
            </div>

            {dashContext && (
              <div className="space-y-4">
                <h5 className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Live Metrics</h5>
                
                {/* Health Score */}
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-text-muted" />
                    <span className="text-xs text-muted-foreground">Health Score</span>
                  </div>
                  <span className="text-xs font-bold font-mono">{dashContext.health_score?.score || 0}</span>
                </div>

                {/* Monthly Income */}
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-success" />
                    <span className="text-xs text-muted-foreground">Income</span>
                  </div>
                  <span className="text-xs font-bold font-mono text-success">{formatINR(dashContext.income)}</span>
                </div>

                {/* Monthly Expense */}
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-3.5 h-3.5 text-danger" />
                    <span className="text-xs text-muted-foreground">Expenses</span>
                  </div>
                  <span className="text-xs font-bold font-mono text-danger">{formatINR(dashContext.expenses?.total_spent || 0)}</span>
                </div>

                {/* Active Goals */}
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs text-muted-foreground">Active Goals</span>
                  </div>
                  <span className="text-xs font-bold font-mono">{dashContext.goals?.length || 0}</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 bg-background-secondary/50 rounded-lg border border-border mt-6">
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              💡 **Context Aware**: FinPilot AI evaluates your logged budgets, savings caps, demographics, and risk profile to tailor recommendations.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}