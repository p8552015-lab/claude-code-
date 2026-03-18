"use client";

import { useState, useCallback } from "react";

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
}

const COPY_RESET_DELAY_MS = 2000;

export default function CodeBlock({ code, language, filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    const timer = setTimeout(() => setCopied(false), COPY_RESET_DELAY_MS);
    return () => clearTimeout(timer);
  }, [code]);

  const displayLabel = filename ?? language ?? "";

  return (
    <div className="group relative my-4 overflow-hidden rounded-lg border border-gray-700 bg-gray-900">
      {displayLabel && (
        <div className="flex items-center justify-between border-b border-gray-700 bg-gray-800 px-4 py-2">
          <span className="text-sm font-medium text-gray-300">
            {displayLabel}
          </span>
          <button
            onClick={handleCopy}
            type="button"
            className="rounded-md px-3 py-1 text-xs font-medium text-gray-400 transition-colors duration-150 hover:bg-gray-700 hover:text-gray-200"
            aria-label={copied ? "已複製" : "複製程式碼"}
          >
            {copied ? "已複製!" : "複製"}
          </button>
        </div>
      )}

      {!displayLabel && (
        <button
          onClick={handleCopy}
          type="button"
          className="absolute right-3 top-3 rounded-md bg-gray-800 px-3 py-1 text-xs font-medium text-gray-400 opacity-0 transition-all duration-150 hover:bg-gray-700 hover:text-gray-200 group-hover:opacity-100"
          aria-label={copied ? "已複製" : "複製程式碼"}
        >
          {copied ? "已複製!" : "複製"}
        </button>
      )}

      <div className="overflow-x-auto p-4">
        <pre className="text-sm leading-relaxed text-gray-100">
          <code className={language ? `language-${language}` : ""}>
            {code}
          </code>
        </pre>
      </div>
    </div>
  );
}
