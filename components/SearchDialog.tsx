'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { searchTutorials, type SearchResult } from '@/lib/search';

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function SearchDialog({ open, onClose }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setResults(searchTutorials(query));
  }, [query]);

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  function handleResultClick(slug: string) {
    onClose();
    router.push(`/tutorials/${slug}`);
  }

  const grouped: Record<string, SearchResult[]> = {};
  for (const r of results) {
    if (!grouped[r.moduleTitle]) grouped[r.moduleTitle] = [];
    grouped[r.moduleTitle].push(r);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/50 pt-[15vh] backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="搜尋教學內容"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800 animate-fade-in">
        <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <svg className="h-5 w-5 shrink-0 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜尋教學內容..."
            className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100"
            aria-label="搜尋關鍵字"
          />
          <kbd className="hidden rounded-md border border-gray-300 px-1.5 py-0.5 text-xs text-gray-400 sm:inline-block dark:border-gray-600">ESC</kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {query.trim() && results.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">找不到相關教學內容</div>
          )}

          {Object.entries(grouped).map(([moduleTitle, moduleResults]) => (
            <div key={moduleTitle} className="mb-2">
              <div className="px-3 py-1.5 text-xs font-semibold tracking-wider text-gray-500 dark:text-gray-400">{moduleTitle}</div>
              {moduleResults.map((result) => (
                <button
                  key={result.slug}
                  onClick={() => handleResultClick(result.slug)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  type="button"
                >
                  <svg className="h-4 w-4 shrink-0 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{result.title}</div>
                    <div className="truncate text-xs text-gray-400 dark:text-gray-500">{result.description}</div>
                  </div>
                </button>
              ))}
            </div>
          ))}

          {!query.trim() && (
            <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">輸入關鍵字搜尋教學內容</div>
          )}
        </div>
      </div>
    </div>
  );
}
