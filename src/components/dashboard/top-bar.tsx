'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/providers/theme-provider';
import {
  Search,
  Bell,
  Command,
  Sun,
  Moon,
  Monitor,
  ChevronDown,
  Package,
  Calendar,
  Mail,
  Settings,
  User,
  X,
} from 'lucide-react';

interface TopBarProps {
  title: string;
  subtitle?: string;
  userId: string;
}

interface SearchResult {
  type: 'page' | 'product' | 'order' | 'subscriber';
  title: string;
  href: string;
  icon: typeof Package;
}

// Quick navigation items for search
const QUICK_NAV: SearchResult[] = [
  { type: 'page', title: 'Dashboard Home', href: '/dashboard', icon: User },
  { type: 'page', title: 'Products', href: '/dashboard/products', icon: Package },
  { type: 'page', title: 'Bookings', href: '/dashboard/bookings', icon: Calendar },
  { type: 'page', title: 'Email Subscribers', href: '/dashboard/email', icon: Mail },
  { type: 'page', title: 'Settings', href: '/dashboard/settings', icon: Settings },
];

/**
 * Premium Dashboard Top Bar
 * Features command palette search, notifications, and theme toggle
 */
export function TopBar({ title, subtitle, userId }: TopBarProps) {
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut for search (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsThemeMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter search results
  const filteredResults = searchQuery
    ? QUICK_NAV.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : QUICK_NAV;

  const handleResultClick = (href: string) => {
    router.push(href);
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const ThemeIcon = resolvedTheme === 'dark' ? Moon : Sun;

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-800/60 bg-[#0A0A0B]/80 px-6 backdrop-blur-xl">
        {/* Title Section */}
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-[15px] font-semibold tracking-tight text-zinc-100">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[13px] text-zinc-500">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="group flex h-9 items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 pl-3 pr-2 text-[13px] text-zinc-500 transition-all duration-150 hover:border-zinc-700 hover:bg-zinc-800/50 hover:text-zinc-400"
          >
            <Search className="h-4 w-4" strokeWidth={1.75} />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="ml-2 hidden rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[11px] text-zinc-500 sm:inline">
              <Command className="mb-0.5 inline h-2.5 w-2.5" />K
            </kbd>
          </button>

          {/* Theme Toggle */}
          <div className="relative" ref={themeRef}>
            <button
              onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-400"
            >
              <ThemeIcon className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </button>

            {/* Theme Dropdown */}
            {isThemeMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-36 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 py-1 shadow-xl">
                <button
                  onClick={() => { setTheme('light'); setIsThemeMenuOpen(false); }}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-[13px] transition-colors',
                    theme === 'light' 
                      ? 'bg-zinc-800 text-zinc-200' 
                      : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'
                  )}
                >
                  <Sun className="h-4 w-4" strokeWidth={1.75} />
                  Light
                </button>
                <button
                  onClick={() => { setTheme('dark'); setIsThemeMenuOpen(false); }}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-[13px] transition-colors',
                    theme === 'dark' 
                      ? 'bg-zinc-800 text-zinc-200' 
                      : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'
                  )}
                >
                  <Moon className="h-4 w-4" strokeWidth={1.75} />
                  Dark
                </button>
                <button
                  onClick={() => { setTheme('system'); setIsThemeMenuOpen(false); }}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-[13px] transition-colors',
                    theme === 'system' 
                      ? 'bg-zinc-800 text-zinc-200' 
                      : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'
                  )}
                >
                  <Monitor className="h-4 w-4" strokeWidth={1.75} />
                  System
                </button>
              </div>
            )}
          </div>

          {/* Notifications */}
          <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-400">
            <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
            {/* Notification dot */}
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-indigo-500" />
          </button>
        </div>
      </header>

      {/* Command Palette / Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsSearchOpen(false)}
          />
          
          {/* Modal */}
          <div 
            ref={searchRef}
            className="relative w-full max-w-lg overflow-hidden rounded-xl border border-zinc-800 bg-[#111113] shadow-2xl"
          >
            {/* Search Input */}
            <div className="flex items-center border-b border-zinc-800 px-4">
              <Search className="h-5 w-5 text-zinc-500" strokeWidth={1.75} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, orders, subscribers..."
                className="flex-1 bg-transparent px-3 py-4 text-[15px] text-zinc-200 placeholder-zinc-600 outline-none"
                autoFocus
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="flex h-6 w-6 items-center justify-center rounded bg-zinc-800 text-zinc-500 hover:text-zinc-400"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto p-2">
              {filteredResults.length === 0 ? (
                <div className="py-8 text-center text-[13px] text-zinc-500">
                  No results found for "{searchQuery}"
                </div>
              ) : (
                <>
                  <div className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-600">
                    Quick Navigation
                  </div>
                  {filteredResults.map((result) => {
                    const Icon = result.icon;
                    return (
                      <button
                        key={result.href}
                        onClick={() => handleResultClick(result.href)}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-zinc-800/50"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800/80 text-zinc-400">
                          <Icon className="h-4 w-4" strokeWidth={1.75} />
                        </div>
                        <span className="text-[13px] text-zinc-300">{result.title}</span>
                      </button>
                    );
                  })}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-2.5">
              <div className="flex items-center gap-4 text-[11px] text-zinc-600">
                <span className="flex items-center gap-1">
                  <kbd className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono">↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono">↵</kbd>
                  Select
                </span>
              </div>
              <span className="flex items-center gap-1 text-[11px] text-zinc-600">
                <kbd className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono">Esc</kbd>
                Close
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
