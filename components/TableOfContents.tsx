"use client";

import { useState, useEffect, useCallback } from "react";
import type { TocItem } from "@/types/tutorial";

interface TableOfContentsProps {
  headings: TocItem[];
}

export default function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");

  const filteredHeadings = headings.filter((h) => h.level === 2 || h.level === 3);

  useEffect(() => {
    if (filteredHeadings.length === 0) return;

    const observerCallback: IntersectionObserverCallback = (entries) => {
      const visibleEntries = entries.filter((entry) => entry.isIntersecting);
      if (visibleEntries.length > 0) {
        const topEntry = visibleEntries.reduce((prev, current) =>
          prev.boundingClientRect.top < current.boundingClientRect.top
            ? prev
            : current
        );
        setActiveId(topEntry.target.id);
      }
    };

    const observer = new IntersectionObserver(observerCallback, {
      rootMargin: "-80px 0px -60% 0px",
      threshold: 0,
    });

    for (const heading of filteredHeadings) {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [filteredHeadings]);

  const handleClick = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  if (filteredHeadings.length === 0) return null;

  return (
    <nav
      className="sticky top-24 hidden max-h-[calc(100vh-8rem)] overflow-y-auto xl:block"
      aria-label="目錄"
    >
      <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
        目錄
      </h3>
      <ul className="space-y-1 border-l border-gray-200 dark:border-gray-700">
        {filteredHeadings.map((heading) => {
          const isActive = activeId === heading.id;
          const indent = heading.level === 3 ? "pl-6" : "pl-4";

          return (
            <li key={heading.id}>
              <button
                onClick={() => handleClick(heading.id)}
                type="button"
                className={`block w-full border-l-2 py-1 text-left text-sm transition-colors duration-150 ${indent} ${
                  isActive
                    ? "border-[#E87B35] font-medium text-[#E87B35]"
                    : "border-transparent text-gray-600 hover:border-gray-400 hover:text-gray-900 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-200"
                }`}
                aria-current={isActive ? "location" : undefined}
              >
                {heading.text}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
