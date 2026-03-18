import type { ReactNode } from "react";

type CalloutType = "tip" | "warning" | "insight" | "info";

interface CalloutBoxProps {
  type: CalloutType;
  title?: string;
  children: ReactNode;
}

const CALLOUT_STYLES: Record<
  CalloutType,
  { border: string; bg: string; icon: string; titleColor: string; defaultTitle: string }
> = {
  tip: {
    border: "border-l-green-500",
    bg: "bg-green-50 dark:bg-green-950/30",
    icon: "text-green-600 dark:text-green-400",
    titleColor: "text-green-800 dark:text-green-300",
    defaultTitle: "提示",
  },
  warning: {
    border: "border-l-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    icon: "text-amber-600 dark:text-amber-400",
    titleColor: "text-amber-800 dark:text-amber-300",
    defaultTitle: "警告",
  },
  insight: {
    border: "border-l-purple-500",
    bg: "bg-purple-50 dark:bg-purple-950/30",
    icon: "text-purple-600 dark:text-purple-400",
    titleColor: "text-purple-800 dark:text-purple-300",
    defaultTitle: "關鍵觀念",
  },
  info: {
    border: "border-l-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    icon: "text-blue-600 dark:text-blue-400",
    titleColor: "text-blue-800 dark:text-blue-300",
    defaultTitle: "資訊",
  },
};

function CalloutIcon({ type }: { type: CalloutType }) {
  const colorClass = CALLOUT_STYLES[type].icon;

  switch (type) {
    case "tip":
      return (
        <svg className={`h-5 w-5 shrink-0 ${colorClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 18h6M10 22h4M12 2v1M12 7a4 4 0 0 0-4 4c0 1.5.8 2.8 2 3.4V17h4v-2.6c1.2-.6 2-1.9 2-3.4a4 4 0 0 0-4-4z" />
        </svg>
      );
    case "warning":
      return (
        <svg className={`h-5 w-5 shrink-0 ${colorClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />
        </svg>
      );
    case "insight":
      return (
        <svg className={`h-5 w-5 shrink-0 ${colorClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    case "info":
      return (
        <svg className={`h-5 w-5 shrink-0 ${colorClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      );
  }
}

export default function CalloutBox({ type, title, children }: CalloutBoxProps) {
  const styles = CALLOUT_STYLES[type];
  const displayTitle = title ?? styles.defaultTitle;

  return (
    <div
      className={`my-4 rounded-r-lg border-l-4 ${styles.border} ${styles.bg} p-4`}
      role="note"
    >
      <div className="flex items-start gap-3">
        <CalloutIcon type={type} />
        <div className="min-w-0 flex-1">
          <p className={`font-semibold ${styles.titleColor}`}>
            {displayTitle}
          </p>
          <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
