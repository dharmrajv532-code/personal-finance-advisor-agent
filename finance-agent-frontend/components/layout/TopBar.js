'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Bell, Menu, X, User as UserIcon, LogOut, Settings } from 'lucide-react';
import api from '@/lib/api';
import ThemeToggle from './ThemeToggle';
import Sidebar from './Sidebar';
import { cn } from '@/lib/utils';

export default function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [alertsCount, setAlertsCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const info = localStorage.getItem('userInfo');
    if (info) {
      try {
        setUserInfo(JSON.parse(info));
      } catch (e) {
        console.error(e);
      }
    }
    
    // Fetch alert count
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/analytics/alerts')
        .then((res) => {
          if (Array.isArray(res.data)) {
            setAlertsCount(res.data.length);
          }
        })
        .catch((err) => console.error('Error fetching alerts count', err));
    }
  }, [pathname]);

  const getPageTitle = () => {
    switch (pathname) {
      case '/dashboard':
        return 'Dashboard';
      case '/income':
        return 'Income';
      case '/expenses':
        return 'Expenses';
      case '/budget':
        return 'Budget';
      case '/goals':
        return 'Savings Goals';
      case '/advisor':
        return 'AI Advisor';
      case '/analytics':
        return 'Analytics';
      case '/market':
        return 'Market Analysis';
      case '/calculator':
        return 'SIP Calculator';
      case '/profile':
        return 'Profile Settings';
      default:
        return 'FinPilot AI';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    router.push('/');
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

  return (
    <>
      <header className="sticky top-0 z-40 w-full h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-6 select-none">
        {/* Left Side: Mobile Hamburger & Page Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-background-secondary border border-border text-foreground transition-colors cursor-pointer"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-foreground transition-all duration-200">
            {getPageTitle()}
          </h1>
        </div>

        {/* Right Side: Alerts, Theme, Profile */}
        <div className="flex items-center gap-3">
          {/* Alerts Bell */}
          <button
            onClick={() => router.push('/analytics?tab=alerts')}
            className="relative p-2 rounded-lg hover:bg-background-secondary border border-border text-foreground transition-colors cursor-pointer"
            aria-label="Alerts"
          >
            <Bell className="w-5 h-5" />
            {alertsCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-danger rounded-full ring-2 ring-background animate-pulse" />
            )}
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-9 h-9 rounded-full bg-primary/10 text-primary border border-border flex items-center justify-center font-semibold text-sm cursor-pointer hover:bg-primary/20 transition-all select-none shadow-sm"
            >
              {userInfo ? getInitials(userInfo.name) : <UserIcon className="w-4 h-4" />}
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-card shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b border-border">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {userInfo ? userInfo.name : 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {userInfo ? userInfo.email : ''}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    router.push('/profile');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-background-secondary transition-colors text-left cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-text-muted" />
                  <span>Profile Settings</span>
                </button>
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-danger hover:bg-danger/10 hover:text-danger transition-colors text-left cursor-pointer border-t border-border mt-1"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Drawer content */}
          <div className="relative z-50 w-[240px] h-full bg-background flex flex-col shadow-2xl animate-in slide-in-from-left duration-300">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg border border-border bg-card hover:bg-background-secondary cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-4 h-4 text-foreground" />
            </button>
            <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}