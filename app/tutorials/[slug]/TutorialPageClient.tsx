'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import TableOfContents from '@/components/TableOfContents';
import SearchDialog from '@/components/SearchDialog';
import { getTutorialBySlug, getAdjacentTutorials } from '@/lib/tutorials';
import { isTutorialComplete, toggleTutorialComplete } from '@/lib/progress';
import { getTutorialContent } from '@/content/tutorials';
import { LEVEL_LABELS, LEVEL_STYLES } from '@/lib/constants';
import { useKeyboardShortcut } from '@/lib/hooks/useKeyboardShortcut';
import type { TocItem } from '@/types/tutorial';

export default function TutorialPageClient() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const tutorial = getTutorialBySlug(slug);
  const adjacent = getAdjacentTutorials(slug);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [headings, setHeadings] = useState<TocItem[]>([]);

  useEffect(() => {
    setIsComplete(isTutorialComplete(slug));
  }, [slug]);

  useKeyboardShortcut('k', useCallback(() => setSearchOpen(true), []));

  useEffect(() => {
    const timer = setTimeout(() => {
      const els = document.querySelectorAll('.prose-tutorial h2, .prose-tutorial h3');
      const items: TocItem[] = Array.from(els)
        .filter((el) => el.id)
        .map((el) => ({
          id: el.id,
          text: el.textContent || '',
          level: el.tagName === 'H2' ? 2 : 3,
        }));
      setHeadings(items);
    }, 100);
    return () => clearTimeout(timer);
  }, [slug]);

  const handleToggleComplete = useCallback(() => {
    const newState = toggleTutorialComplete(slug);
    setIsComplete(newState);
  }, [slug]);

  if (!tutorial) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">找不到此教學</h1>
          <Link href="/" className="text-claude-orange hover:underline">
            返回首頁
          </Link>
        </div>
      </div>
    );
  }

  const ContentComponent = getTutorialContent(slug);

  return (
    <div className="min-h-screen">
      <Header onSearchOpen={() => setSearchOpen(true)} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />

      <div className="flex pt-16">
        <Sidebar currentSlug={slug} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 min-w-0 px-4 sm:px-8 lg:px-12 py-8 lg:ml-64">
          <div className="max-w-3xl mx-auto">
            <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
              <Link href="/" className="hover:text-claude-orange transition-colors">首頁</Link>
              <span>/</span>
              <span className="text-gray-900 dark:text-gray-100">{tutorial.title}</span>
            </nav>

            <header className="mb-10">
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${LEVEL_STYLES[tutorial.level] ?? LEVEL_STYLES.beginner}`}>
                  {LEVEL_LABELS[tutorial.level] ?? tutorial.level}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{tutorial.readingTime} 閱讀</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{tutorial.moduleTitle}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">{tutorial.title}</h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">{tutorial.description}</p>
            </header>

            <div className="bg-claude-orange/5 border border-claude-orange/20 rounded-xl p-6 mb-10">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-claude-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                你將學到什麼
              </h2>
              <ul className="space-y-2">
                {tutorial.objectives.map((obj) => (
                  <li key={obj} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 text-claude-orange shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {obj}
                  </li>
                ))}
              </ul>
            </div>

            <article className="prose-tutorial">{ContentComponent}</article>

            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={handleToggleComplete}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl font-medium transition-all ${
                  isComplete
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {isComplete ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                )}
                {isComplete ? '已完成此課程' : '標記為已完成'}
              </button>
            </div>

            <nav className="mt-8 flex items-center justify-between gap-4">
              {adjacent.prev ? (
                <Link href={`/tutorials/${adjacent.prev.slug}`} className="flex-1 group p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-claude-orange/50 transition-colors">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">上一課</div>
                  <div className="font-medium text-gray-900 dark:text-white group-hover:text-claude-orange transition-colors">{adjacent.prev.title}</div>
                </Link>
              ) : <div className="flex-1" />}
              {adjacent.next ? (
                <Link href={`/tutorials/${adjacent.next.slug}`} className="flex-1 group p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-claude-orange/50 transition-colors text-right">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">下一課</div>
                  <div className="font-medium text-gray-900 dark:text-white group-hover:text-claude-orange transition-colors">{adjacent.next.title}</div>
                </Link>
              ) : <div className="flex-1" />}
            </nav>
          </div>
        </main>

        <aside className="hidden xl:block w-64 shrink-0 pr-8 py-8">
          <TableOfContents headings={headings} />
        </aside>
      </div>
    </div>
  );
}
