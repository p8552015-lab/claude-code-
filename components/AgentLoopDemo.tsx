"use client";

import { useState } from "react";

// ============================================================================
// 1. 互動式流程圖 — 點擊節點可查看說明
// ============================================================================

const FLOW_NODES = [
  {
    id: "user",
    label: "使用者輸入",
    icon: "💬",
    description: "你對 Claude Code 下達一個指令，例如「幫我新增一個 /health API endpoint」。",
    color: "bg-blue-500",
  },
  {
    id: "send",
    label: "傳送至 Claude",
    icon: "📡",
    description: "系統將你的指令連同 system prompt、對話歷史、可用工具清單一起送入 Claude 模型。",
    color: "bg-indigo-500",
  },
  {
    id: "think",
    label: "Claude 推理",
    icon: "🧠",
    description: "Claude 分析指令內容，決定下一步行動：直接回覆？還是需要先用工具做點事？",
    color: "bg-purple-500",
  },
  {
    id: "decide",
    label: "檢查 stop_reason",
    icon: "🔀",
    description:
      "根據回應的 stop_reason 決定走向：end_turn（完成）、tool_use（執行工具）、max_tokens（繼續生成）。",
    color: "bg-amber-500",
  },
  {
    id: "tool",
    label: "執行工具",
    icon: "🔧",
    description: "執行 Claude 請求的工具（Read 讀檔、Bash 跑指令、Edit 修改程式碼等），收集執行結果。",
    color: "bg-green-500",
  },
  {
    id: "result",
    label: "結果回饋",
    icon: "📋",
    description: "工具執行結果作為新訊息加入對話歷史，然後回到「傳送至 Claude」繼續下一輪迭代。",
    color: "bg-teal-500",
  },
  {
    id: "done",
    label: "回覆使用者",
    icon: "✅",
    description: "stop_reason = end_turn，Claude 判定任務完成，將最終結果呈現給你。迴圈結束。",
    color: "bg-emerald-500",
  },
] as const;

export function AgentLoopFlowDiagram() {
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const active = FLOW_NODES.find((n) => n.id === activeNode);

  return (
    <div className="my-8">
      <div className="flex flex-col items-center gap-1">
        {FLOW_NODES.map((node, i) => {
          const isActive = activeNode === node.id;
          const isLoopBack = node.id === "result";
          const isBranch = node.id === "decide";

          return (
            <div key={node.id} className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => setActiveNode(isActive ? null : node.id)}
                className={`group relative flex items-center gap-3 rounded-xl border-2 px-5 py-3 text-left transition-all duration-200 cursor-pointer select-none ${
                  isActive
                    ? "border-claude-orange bg-claude-orange/10 shadow-lg scale-105"
                    : "border-gray-200 bg-white hover:border-claude-orange/50 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                }`}
              >
                <span className="text-2xl">{node.icon}</span>
                <span
                  className={`font-medium ${
                    isActive
                      ? "text-claude-orange"
                      : "text-gray-700 dark:text-gray-200"
                  }`}
                >
                  {node.label}
                </span>
                <span className={`ml-2 text-xs ${isActive ? "text-claude-orange" : "text-gray-400"}`}>
                  {isActive ? "▼" : "▶ 點擊查看"}
                </span>
              </button>

              {/* 內嵌說明面板 — 直接展開在節點下方 */}
              {isActive && (
                <div className="mt-2 w-full max-w-md rounded-lg border border-claude-orange/30 bg-claude-orange/5 p-4 text-left dark:bg-claude-orange/10">
                  <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                    {node.description}
                  </p>
                </div>
              )}

              {/* 箭頭 */}
              {i < FLOW_NODES.length - 1 && (
                <div className="flex items-center gap-2 py-1">
                  {isBranch ? (
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col items-center">
                        <svg
                          className="h-6 w-4 text-green-500"
                          viewBox="0 0 16 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path d="M8 0 L8 24" />
                          <path d="M4 18 L8 24 L12 18" />
                        </svg>
                        <span className="text-xs font-medium text-green-600 dark:text-green-400">
                          tool_use
                        </span>
                      </div>
                    </div>
                  ) : isLoopBack ? (
                    <div className="flex items-center gap-2">
                      <svg
                        className="h-8 w-20 text-claude-orange"
                        viewBox="0 0 80 32"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path d="M40 0 L40 8 C40 16 60 16 60 24 C60 32 20 32 20 24 C20 16 0 16 0 8" />
                        <path d="M36 4 L40 0 L44 4" />
                      </svg>
                      <span className="text-xs font-medium text-claude-orange">
                        回到 Claude ↩
                      </span>
                    </div>
                  ) : (
                    <svg
                      className="h-6 w-4 text-gray-400"
                      viewBox="0 0 16 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path d="M8 0 L8 24" />
                      <path d="M4 18 L8 24 L12 18" />
                    </svg>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}

// ============================================================================
// 2. 互動式步驟器 — 逐步走過實戰範例
// ============================================================================

interface StepData {
  iteration: number;
  title: string;
  action: string;
  tool: string;
  detail: string;
  result: string;
  stopReason: "tool_use" | "end_turn";
  emoji: string;
}

const DEMO_STEPS: StepData[] = [
  {
    iteration: 1,
    title: "讀取現有程式碼",
    action: "Claude 判斷需要先了解目前的程式碼結構",
    tool: "Read",
    detail: "讀取 maia_router.py 的內容，了解現有的 API 路由結構",
    result: "成功讀取檔案，發現已有 /api/chat、/api/status 等 endpoint",
    stopReason: "tool_use",
    emoji: "📖",
  },
  {
    iteration: 2,
    title: "搜尋相關模式",
    action: "Claude 想確認 health check 的慣用寫法",
    tool: "Grep",
    detail: "搜尋專案中是否已有健康檢查的模式或相關引用",
    result: "找到 docker-compose.yml 中有 healthcheck 設定，確認端口為 8000",
    stopReason: "tool_use",
    emoji: "🔍",
  },
  {
    iteration: 3,
    title: "撰寫 /health endpoint",
    action: "Claude 根據分析結果撰寫程式碼",
    tool: "Edit",
    detail:
      '在 maia_router.py 中新增 @app.get("/health") endpoint，回傳服務狀態',
    result: "成功插入新的 endpoint 程式碼",
    stopReason: "tool_use",
    emoji: "✍️",
  },
  {
    iteration: 4,
    title: "執行測試",
    action: "Claude 主動測試新程式碼是否能正常運作",
    tool: "Bash",
    detail: "執行 pytest tests/ 來確認新增的 endpoint 沒有破壞現有功能",
    result: "❌ 測試失敗！ImportError: cannot import name 'health_check'",
    stopReason: "tool_use",
    emoji: "🧪",
  },
  {
    iteration: 5,
    title: "自我修正",
    action: "Claude 分析錯誤並自動修復",
    tool: "Edit",
    detail: "發現忘了在 __init__.py 中匯出新函式，補上 import 語句",
    result: "成功修復 import 問題",
    stopReason: "tool_use",
    emoji: "🔧",
  },
  {
    iteration: 6,
    title: "再次測試 & 完成",
    action: "Claude 再次執行測試確認修復成功",
    tool: "Bash",
    detail: "再次執行 pytest tests/ 確認所有測試通過",
    result: "✅ 所有測試通過！回報完成結果。",
    stopReason: "end_turn",
    emoji: "🎉",
  },
];

export function AgentLoopStepper() {
  const [currentStep, setCurrentStep] = useState(0);
  const step = DEMO_STEPS[currentStep];
  const isLast = currentStep === DEMO_STEPS.length - 1;
  const isFirst = currentStep === 0;

  return (
    <div className="my-8">
      {/* 進度條 */}
      <div className="mb-6 flex items-center justify-between gap-1">
        {DEMO_STEPS.map((s, i) => (
          <button
            key={s.iteration}
            type="button"
            onClick={() => setCurrentStep(i)}
            className={`flex h-10 w-10 items-center justify-center rounded-full text-lg transition-all duration-300 ${
              i === currentStep
                ? "scale-110 bg-claude-orange text-white shadow-lg ring-4 ring-claude-orange/20"
                : i < currentStep
                ? "bg-green-500 text-white"
                : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
            }`}
            aria-label={`第 ${s.iteration} 步`}
          >
            {i < currentStep ? "✓" : s.emoji}
          </button>
        ))}
      </div>

      {/* 步驟卡片 */}
      <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-sm transition-all dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-8 items-center rounded-full px-3 text-sm font-bold text-white ${
                step.stopReason === "end_turn"
                  ? "bg-emerald-500"
                  : "bg-claude-orange"
              }`}
            >
              迭代 #{step.iteration}
            </span>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white">
              {step.title}
            </h4>
          </div>
          <span
            className={`rounded-lg px-3 py-1 text-xs font-mono font-bold ${
              step.stopReason === "end_turn"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            }`}
          >
            {step.stopReason}
          </span>
        </div>

        <div className="space-y-4">
          {/* 思考 */}
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              🧠
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                思考
              </div>
              <p className="text-gray-700 dark:text-gray-300">{step.action}</p>
            </div>
          </div>

          {/* 行動 */}
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              ⚡
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                行動 — {step.tool}
              </div>
              <p className="text-gray-700 dark:text-gray-300">{step.detail}</p>
            </div>
          </div>

          {/* 結果 */}
          <div className="flex gap-3">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                step.result.includes("❌")
                  ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                  : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
              }`}
            >
              {step.result.includes("❌") ? "💥" : "📋"}
            </div>
            <div>
              <div
                className={`text-xs font-semibold uppercase tracking-wider ${
                  step.result.includes("❌")
                    ? "text-red-600 dark:text-red-400"
                    : "text-green-600 dark:text-green-400"
                }`}
              >
                結果
              </div>
              <p className="text-gray-700 dark:text-gray-300">{step.result}</p>
            </div>
          </div>
        </div>

        {/* 導航按鈕 */}
        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCurrentStep((s) => s - 1)}
            disabled={isFirst}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              isFirst
                ? "cursor-not-allowed text-gray-300 dark:text-gray-600"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            ← 上一步
          </button>
          <span className="text-sm text-gray-400">
            {currentStep + 1} / {DEMO_STEPS.length}
          </span>
          <button
            type="button"
            onClick={() => setCurrentStep((s) => s + 1)}
            disabled={isLast}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              isLast
                ? "cursor-not-allowed text-gray-300 dark:text-gray-600"
                : "bg-claude-orange text-white hover:bg-claude-orange/90"
            }`}
          >
            {isLast ? "已完成" : "下一步 →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. 對比卡片 — 傳統 AI vs Agent Loop
// ============================================================================

export function ComparisonCards() {
  return (
    <div className="my-8 grid gap-4 md:grid-cols-2">
      {/* 傳統 AI */}
      <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-xl dark:bg-gray-700">
            💬
          </span>
          <h4 className="text-lg font-bold text-gray-900 dark:text-white">
            傳統 AI 對話
          </h4>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              你問一個問題
            </span>
          </div>
          <div className="ml-2 border-l-2 border-dashed border-gray-300 pl-3 dark:border-gray-600">
            <svg className="h-4 w-4 text-gray-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M8 0 L8 16" /><path d="M4 12 L8 16 L12 12" />
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-purple-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              AI 回一段文字
            </span>
          </div>
          <div className="ml-2 border-l-2 border-dashed border-gray-300 pl-3 dark:border-gray-600">
            <svg className="h-4 w-4 text-gray-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M8 0 L8 16" /><path d="M4 12 L8 16 L12 12" />
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-400" />
            <span className="text-sm font-medium text-red-600 dark:text-red-400">
              結束。
            </span>
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          一來一回，像丟球再接回來。AI 只能「說」，不能「做」。
        </p>
      </div>

      {/* Agent Loop */}
      <div className="rounded-2xl border-2 border-claude-orange/50 bg-claude-orange/5 p-6 dark:bg-claude-orange/10">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-claude-orange text-xl text-white">
            🔄
          </span>
          <h4 className="text-lg font-bold text-gray-900 dark:text-white">
            Agent Loop
          </h4>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              你給一個指令
            </span>
          </div>
          <div className="ml-2 border-l-2 border-claude-orange/30 pl-3">
            <svg className="h-4 w-4 text-claude-orange" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M8 0 L8 16" /><path d="M4 12 L8 16 L12 12" />
            </svg>
          </div>
          <div className="rounded-lg border border-claude-orange/20 bg-white/50 p-3 dark:bg-gray-800/50">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-purple-500">🧠 思考</span>
              <span className="text-gray-400">→</span>
              <span className="text-blue-500">⚡ 執行工具</span>
              <span className="text-gray-400">→</span>
              <span className="text-green-500">📋 看結果</span>
            </div>
            <div className="mt-1 flex items-center justify-center">
              <span className="text-xs font-medium text-claude-orange">
                ↻ 重複 N 次直到完成
              </span>
            </div>
          </div>
          <div className="ml-2 border-l-2 border-claude-orange/30 pl-3">
            <svg className="h-4 w-4 text-claude-orange" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M8 0 L8 16" /><path d="M4 12 L8 16 L12 12" />
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              做完了，回報結果。
            </span>
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          AI 自己動手做事，能讀、能寫、能修、能測試，直到任務完成。
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// 4. stop_reason 互動卡片
// ============================================================================

const STOP_REASONS = [
  {
    name: "end_turn",
    emoji: "✅",
    label: "任務完成",
    description: "「我做完了，結果在這裡。」",
    detail: "Claude 判定任務已完成、問題已回答，或需要使用者確認才能繼續。迴圈結束。",
    color: "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20",
    textColor: "text-emerald-700 dark:text-emerald-400",
  },
  {
    name: "tool_use",
    emoji: "🔧",
    label: "需要執行工具",
    description: "「我需要用工具做點事。」",
    detail:
      "Claude 需要讀檔案、執行指令、搜尋程式碼等操作。執行工具後，結果會送回 Claude，迴圈繼續。",
    color: "border-amber-400 bg-amber-50 dark:bg-amber-900/20",
    textColor: "text-amber-700 dark:text-amber-400",
  },
  {
    name: "max_tokens",
    emoji: "✂️",
    label: "回應被截斷",
    description: "「我話還沒講完就被截斷了。」",
    detail:
      "單次回應超過 token 上限。系統會讓 Claude 繼續生成後續內容。常見於長篇程式碼或詳細報告。",
    color: "border-red-400 bg-red-50 dark:bg-red-900/20",
    textColor: "text-red-700 dark:text-red-400",
  },
] as const;

export function StopReasonCards() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="my-8 grid gap-4 md:grid-cols-3">
      {STOP_REASONS.map((sr) => {
        const isExpanded = expanded === sr.name;
        return (
          <button
            key={sr.name}
            type="button"
            onClick={() => setExpanded(isExpanded ? null : sr.name)}
            className={`rounded-xl border-2 p-5 text-left transition-all duration-200 ${sr.color} ${
              isExpanded ? "scale-105 shadow-lg" : "hover:shadow-md"
            }`}
          >
            <div className="mb-2 text-3xl">{sr.emoji}</div>
            <div className="mb-1 font-mono text-sm font-bold text-gray-900 dark:text-white">
              {sr.name}
            </div>
            <div className={`mb-2 text-sm font-medium ${sr.textColor}`}>
              {sr.label}
            </div>
            <p className="text-sm italic text-gray-600 dark:text-gray-400">
              {sr.description}
            </p>
            {isExpanded && (
              <p className="mt-3 border-t border-current/10 pt-3 text-sm text-gray-700 dark:text-gray-300">
                {sr.detail}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}
