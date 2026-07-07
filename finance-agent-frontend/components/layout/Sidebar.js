'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  ShoppingCart,
  PieChart,
  Target,
  Bot,
  BarChart3,
  LineChart,
  Calculator,
  Settings,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Sidebar({ onClose }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const info = localStorage.getItem('userInfo');
    if (info) {
      try {
        setUserInfo(JSON.parse(info));
      } catch (e) {
        console.error(e);
      }
    }
  }, [pathname]);

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Income', href: '/income', icon: TrendingUp },
    { name: 'Expenses', href: '/expenses', icon: ShoppingCart },
    { name: 'Budget', href: '/budget', icon: PieChart },
    { name: 'Goals', href: '/goals', icon: Target },
    { name: 'AI Advisor', href: '/advisor', icon: Bot, isAi: true },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Market', href: '/market', icon: LineChart },
    { name: 'SIP Calculator', href: '/calculator', icon: Calculator },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    router.push('/');
    if (onClose) onClose();
  };

  const getInitials = (name) => {
    if (!name) return 'FP';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const formatLifeStage = (stage) => {
    if (!stage) return '';
    return stage.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <aside className="w-[240px] h-full flex flex-col bg-background-secondary border-r border-border py-6 overflow-y-auto shrink-0 select-none">
      <div className="px-6 mb-6">
        <Link href="/dashboard" className="flex items-center gap-1.5 focus:outline-none">
          <span className="text-xl font-bold tracking-tight text-primary">Fin</span>
          <span className="text-xl font-bold tracking-tight text-foreground">Pilot</span>
          <span className="text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full ml-1">AI</span>
        </Link>
      </div>

      {userInfo && (
        <div className="px-6 py-4 mb-6 border-y border-border bg-background/40 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-sm shadow-sm select-none shrink-0">
            {getInitials(userInfo.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground truncate">{userInfo.name}</p>
            {userInfo.life_stage && (
              <span className="inline-block mt-0.5 text-[10px] font-medium bg-background-tertiary text-muted-foreground px-2 py-0.5 rounded-full max-w-full truncate">
                {formatLifeStage(userInfo.life_stage)}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 px-4 space-y-1">
        <span className="block px-3 text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">Main Menu</span>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative border-l-3 border-transparent cursor-pointer",
                isActive
                  ? "bg-primary/10 text-primary border-primary font-semibold"
                  : "text-muted-foreground hover:bg-background-tertiary hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className={cn("w-4 h-4 shrink-0 transition-colors", isActive ? "text-primary" : "text-text-muted group-hover:text-foreground")} />
                <span className="truncate">{item.name}</span>
              </div>
              {item.isAi && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gradient-to-r from-primary to-secondary text-white scale-90">
                  AI
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="px-4 mt-auto pt-6 border-t border-border space-y-1">
        <Link
          href="/profile"
          onClick={onClose}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer border-l-3 border-transparent",
            pathname === '/profile'
              ? "bg-primary/10 text-primary border-primary font-semibold"
              : "text-muted-foreground hover:bg-background-tertiary hover:text-foreground"
          )}
        >
          <Settings className="w-4 h-4 text-text-muted shrink-0" />
          <span>Profile Settings</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-danger hover:bg-danger/10 hover:text-danger border-l-3 border-transparent transition-all duration-200 text-left cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}