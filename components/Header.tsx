'use client';

import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

interface HeaderProps {
  onSearchOpen: () => void;
  onMenuToggle?: () => void;
}

export default function Header({ onSearchOpen, onMenuToggle }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-gray-200 bg-white/80 backdrop-blur-lg dark:border-gray-700 dark:bg-gray-900/80">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          {onMenuToggle && (
            <button onClick={onMenuToggle} type="button" className="rounded-lg p-2 hover:bg-gray-100 lg:hidden dark:hover:bg-gray-800" aria-label="開啟選單">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          )}
          <Link href="/" className="flex items-center gap-2 text-lg font-bold text-gray-900 transition-colors hover:text-claude-orange dark:text-gray-100">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-claude-orange text-sm font-bold text-white">CC</span>
            <span className="hidden sm:inline">Claude Code 教學</span>
          </Link>
        </div>

        <button onClick={onSearchOpen} type="button" className="hidden items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-500 transition-colors hover:border-gray-300 sm:flex dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400" aria-label="開啟搜尋">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span>搜尋課程...</span>
          <kbd className="rounded border border-gray-300 px-1.5 py-0.5 text-xs dark:border-gray-600">⌘K</kbd>
        </button>

        <ThemeToggle />
      </div>
    </header>
  );
}
