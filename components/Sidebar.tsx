'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getModules } from '@/lib/tutorials';
import { isTutorialComplete } from '@/lib/progress';
import { LEVEL_LABELS } from '@/lib/constants';
import type { Module } from '@/types/tutorial';

interface SidebarProps {
  currentSlug?: string;
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ currentSlug, open, onClose }: SidebarProps) {
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [completedSlugs, setCompletedSlugs] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);
  const modules = getModules();

  useEffect(() => {
    setMounted(true);
    const completed = new Set<string>();
    for (const mod of modules) {
      for (const tutorial of mod.tutorials) {
        if (isTutorialComplete(tutorial.slug)) {
          completed.add(tutorial.slug);
        }
      }
    }
    setCompletedSlugs(completed);

    if (currentSlug) {
      const currentModule = modules.find((m) =>
        m.tutorials.some((t) => t.slug === currentSlug)
      );
      if (currentModule) {
        setExpandedModules(new Set([currentModule.id]));
      }
    }
  }, [currentSlug]);

  function toggleModule(moduleId: number) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  }

  const sidebarContent = (
    <nav aria-label="教學導覽" className="space-y-1 p-4">
      {modules.map((mod: Module) => {
        const isExpanded = expandedModules.has(mod.id);
        return (
          <div key={mod.id} className="mb-2">
            <button
              onClick={() => toggleModule(mod.id)}
              type="button"
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700/50"
              aria-expanded={isExpanded}
            >
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-gray-200 text-xs font-bold dark:bg-gray-700">{mod.id}</span>
                <span className="truncate">{mod.title}</span>
                <span className="text-xs text-gray-400">({LEVEL_LABELS[mod.level] ?? mod.level})</span>
              </div>
              <svg className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {isExpanded && (
              <ul className="ml-5 mt-1 space-y-0.5 border-l border-gray-200 dark:border-gray-700">
                {mod.tutorials.map((tutorial) => {
                  const isCurrent = tutorial.slug === currentSlug;
                  const isCompleted = mounted && completedSlugs.has(tutorial.slug);
                  return (
                    <li key={tutorial.slug}>
                      <Link
                        href={`/tutorials/${tutorial.slug}`}
                        onClick={onClose}
                        className={`flex items-center gap-2 rounded-r-lg border-l-2 py-1.5 pl-3 pr-2 text-sm transition-colors ${
                          isCurrent
                            ? 'border-[#E87B35] bg-orange-50 font-medium text-[#E87B35] dark:bg-orange-950/20'
                            : 'border-transparent text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-gray-700/30 dark:hover:text-gray-200'
                        }`}
                        aria-current={isCurrent ? 'page' : undefined}
                      >
                        {isCompleted && (
                          <svg className="h-4 w-4 shrink-0 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-label="已完成">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                        <span className="truncate">{tutorial.title}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} aria-hidden="true" />
      )}
      <aside
        className={`fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 overflow-y-auto border-r border-gray-200 bg-white transition-transform duration-300 lg:translate-x-0 dark:border-gray-700 dark:bg-gray-900 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="側邊導覽"
      >
        {sidebarContent}
      </aside>
    </>
  );
}
