"use client";

import { useState } from "react";
import Link from "next/link";
import type { TutorialMeta } from "@/types/tutorial";
import { LEVEL_LABELS, LEVEL_STYLES, BRAND_COLOR } from "@/lib/constants";

interface ModuleCardProps {
  moduleId: number;
  title: string;
  level: string;
  tutorialCount: number;
  completedCount: number;
  tutorials: TutorialMeta[];
}

export default function ModuleCard({
  moduleId,
  title,
  level,
  tutorialCount,
  completedCount,
  tutorials,
}: ModuleCardProps) {
  const [expanded, setExpanded] = useState(false);

  const progressPercent =
    tutorialCount > 0 ? Math.round((completedCount / tutorialCount) * 100) : 0;
  const levelLabel = LEVEL_LABELS[level] ?? level;
  const levelStyle = LEVEL_STYLES[level] ?? LEVEL_STYLES.beginner;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow duration-200 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <div className="p-5">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-lg font-bold text-gray-700 dark:bg-gray-700 dark:text-gray-300">
              {moduleId}
            </span>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${levelStyle}`}
          >
            {levelLabel}
          </span>
        </div>

        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              {completedCount}/{tutorialCount} 課程完成
            </span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: BRAND_COLOR,
              }}
            />
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          type="button"
          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors duration-150 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700/50"
          aria-expanded={expanded}
          aria-controls={`module-${moduleId}-tutorials`}
        >
          <span>{expanded ? "收合課程列表" : "展開課程列表"}</span>
          <svg
            className={`h-4 w-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {expanded && (
        <div
          id={`module-${moduleId}-tutorials`}
          className="border-t border-gray-200 dark:border-gray-700"
        >
          <ul className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {tutorials
              .sort((a, b) => a.order - b.order)
              .map((tutorial) => (
                <li key={tutorial.slug}>
                  <Link
                    href={`/tutorials/${tutorial.slug}`}
                    className="flex items-center gap-3 px-5 py-3 text-sm text-gray-700 transition-colors duration-100 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                      {tutorial.order}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div>{tutorial.title}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {tutorial.readingTime}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
