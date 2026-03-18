"use client";

import { useState, useEffect } from "react";
import { getProgressPercentage, getCompletedTutorials } from "@/lib/progress";
import { TUTORIALS_META } from "@/lib/tutorials";
import { BRAND_COLOR } from "@/lib/constants";

export default function ProgressTracker() {
  const [percentage, setPercentage] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [mounted, setMounted] = useState(false);

  const total = TUTORIALS_META.length;

  useEffect(() => {
    setMounted(true);
    setPercentage(getProgressPercentage());
    setCompleted(getCompletedTutorials().length);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    function handleStorageChange() {
      setPercentage(getProgressPercentage());
      setCompleted(getCompletedTutorials().length);
    }

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [mounted]);

  if (!mounted) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700 dark:text-gray-300">
          學習進度
        </span>
        <span className="text-gray-500 dark:text-gray-400">
          {completed}/{total} 課程
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`學習進度 ${percentage}%`}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: BRAND_COLOR,
          }}
        />
      </div>
      <div className="mt-1 text-right text-xs text-gray-500 dark:text-gray-400">
        {percentage}% 完成
      </div>
    </div>
  );
}
