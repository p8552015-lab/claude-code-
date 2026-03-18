import { TUTORIALS_META } from './tutorials';

export interface SearchResult {
  slug: string;
  title: string;
  description: string;
  module: number;
  moduleTitle: string;
}

export function searchTutorials(query: string): SearchResult[] {
  if (!query.trim()) return [];
  const lower = query.toLowerCase();
  return TUTORIALS_META
    .filter(
      (t) =>
        t.title.toLowerCase().includes(lower) ||
        t.description.toLowerCase().includes(lower) ||
        t.objectives.some((o) => o.toLowerCase().includes(lower)),
    )
    .map((t) => ({
      slug: t.slug,
      title: t.title,
      description: t.description,
      module: t.module,
      moduleTitle: t.moduleTitle,
    }));
}
