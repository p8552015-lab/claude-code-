export interface TutorialMeta {
  slug: string;
  title: string;
  description: string;
  module: number;
  moduleTitle: string;
  order: number;
  readingTime: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  objectives: string[];
}

export interface Module {
  id: number;
  title: string;
  level: string;
  tutorials: TutorialMeta[];
}

export interface TocItem {
  id: string;
  text: string;
  level: number;
}
