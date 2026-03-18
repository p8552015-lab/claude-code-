'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import SearchDialog from '@/components/SearchDialog';
import ModuleCard from '@/components/ModuleCard';
import ProgressTracker from '@/components/ProgressTracker';
import { getModules } from '@/lib/tutorials';
import { getCompletedTutorials } from '@/lib/progress';

export default function HomePage() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [completed, setCompleted] = useState<string[]>([]);
  const modules = getModules();

  useEffect(() => {
    setCompleted(getCompletedTutorials());
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen">
      <Header onSearchOpen={() => setSearchOpen(true)} />
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-claude-orange/10 text-claude-orange text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-claude-orange animate-pulse" />
            24 堂系統性課程
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            <span className="text-gray-900 dark:text-white">深入掌握</span>
            <br />
            <span className="text-claude-orange">Claude Code</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            從 Agent Loop 的核心運作原理，到多代理協作、MCP 整合、
            生產環境部署。系統性地理解 Claude Code 的每一個面向。
          </p>
        </section>

        {/* Progress Overview */}
        <section className="mb-12">
          <ProgressTracker />
        </section>

        {/* Module Grid */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            課程模組
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {modules.map((mod) => (
              <ModuleCard
                key={mod.id}
                moduleId={mod.id}
                title={mod.title}
                level={mod.level}
                tutorialCount={mod.tutorials.length}
                completedCount={
                  mod.tutorials.filter((t) => completed.includes(t.slug)).length
                }
                tutorials={mod.tutorials}
              />
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="mt-20 grid gap-8 sm:grid-cols-3">
          <FeatureItem
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
            title="從基礎到精通"
            description="4 個模組循序漸進，從核心概念到進階架構，建立完整知識體系。"
          />
          <FeatureItem
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            }
            title="豐富程式碼範例"
            description="每堂課都包含可直接使用的程式碼範例，幫助你立即實踐所學。"
          />
          <FeatureItem
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title="進度追蹤"
            description="記錄你的學習進度，隨時回顧已完成的課程，掌握學習節奏。"
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Claude Code 教學 &mdash; 系統性學習 Claude Code 的最佳資源</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center p-6">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-claude-orange/10 text-claude-orange mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}
