import { TUTORIALS_META } from './tutorials';

const STORAGE_KEY = 'claude-code-tutorials-progress';

export function getCompletedTutorials(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function toggleTutorialComplete(slug: string): boolean {
  const completed = getCompletedTutorials();
  const index = completed.indexOf(slug);
  if (index > -1) {
    completed.splice(index, 1);
  } else {
    completed.push(slug);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
  return index === -1;
}

export function isTutorialComplete(slug: string): boolean {
  return getCompletedTutorials().includes(slug);
}

export function getProgressPercentage(): number {
  const completed = getCompletedTutorials();
  const total = TUTORIALS_META.length;
  if (total === 0) return 0;
  return Math.round((completed.length / total) * 100);
}

/** Alias -- 供現有元件使用 */
export const isTutorialCompleted = isTutorialComplete;

export function getCompletedCount(): number {
  return getCompletedTutorials().length;
}

export function getTotalTutorials(): number {
  return TUTORIALS_META.length;
}
