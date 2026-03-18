/** 品牌顏色 */
export const BRAND_COLOR = '#E87B35';

/** 難度等級標籤 */
export const LEVEL_LABELS: Record<string, string> = {
  beginner: '入門',
  intermediate: '中級',
  advanced: '進階',
};

/** 難度等級樣式（Tailwind CSS 類別） */
export const LEVEL_STYLES: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  intermediate: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  advanced: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};
