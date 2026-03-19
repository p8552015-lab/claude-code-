"use client";

import { useState } from "react";

// ============================================================================
// S03: TaskLifecycleDemo — 互動式任務狀態切換器
// ============================================================================

type TaskStatus = "pending" | "in_progress" | "completed";

interface DemoTask {
  id: string;
  content: string;
  activeForm: string;
  status: TaskStatus;
}

const INITIAL_TASKS: DemoTask[] = [
  {
    id: "t1",
    content: "搜尋現有 API 端點結構",
    activeForm: "搜尋現有 API 端點結構中",
    status: "completed",
  },
  {
    id: "t2",
    content: "新增使用者註冊端點",
    activeForm: "新增使用者註冊端點中",
    status: "in_progress",
  },
  {
    id: "t3",
    content: "撰寫註冊流程的單元測試",
    activeForm: "撰寫註冊流程單元測試中",
    status: "pending",
  },
];

const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; emoji: string; bg: string; text: string; ring: string }
> = {
  pending: {
    label: "待辦",
    emoji: "⏳",
    bg: "bg-gray-100 dark:bg-gray-700",
    text: "text-gray-600 dark:text-gray-400",
    ring: "ring-gray-300 dark:ring-gray-600",
  },
  in_progress: {
    label: "進行中",
    emoji: "🔄",
    bg: "bg-claude-orange/10",
    text: "text-claude-orange",
    ring: "ring-claude-orange/40",
  },
  completed: {
    label: "已完成",
    emoji: "✅",
    bg: "bg-green-50 dark:bg-green-900/20",
    text: "text-green-600 dark:text-green-400",
    ring: "ring-green-300 dark:ring-green-600",
  },
};

function getNextStatus(current: TaskStatus): TaskStatus {
  if (current === "pending") return "in_progress";
  if (current === "in_progress") return "completed";
  return "pending";
}

export function TaskLifecycleDemo() {
  const [tasks, setTasks] = useState<DemoTask[]>(INITIAL_TASKS);
  const [warning, setWarning] = useState<string | null>(null);

  function handleToggle(id: string) {
    setWarning(null);
    setTasks((prev) => {
      const target = prev.find((t) => t.id === id);
      if (!target) return prev;

      const next = getNextStatus(target.status);

      // 規則：同時只能有 1 個 in_progress
      if (next === "in_progress") {
        const alreadyInProgress = prev.find(
          (t) => t.status === "in_progress" && t.id !== id
        );
        if (alreadyInProgress) {
          setWarning(
            `規則違反！「${alreadyInProgress.content}」已經在進行中。任何時刻只能有 1 個任務處於 in_progress 狀態。`
          );
          return prev;
        }
      }

      return prev.map((t) => (t.id === id ? { ...t, status: next } : t));
    });
  }

  function handleReset() {
    setTasks(INITIAL_TASKS);
    setWarning(null);
  }

  return (
    <div className="my-8">
      <div className="space-y-3">
        {tasks.map((task) => {
          const config = STATUS_CONFIG[task.status];
          return (
            <button
              key={task.id}
              type="button"
              onClick={() => handleToggle(task.id)}
              className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all duration-200 ring-2 ${config.ring} ${config.bg} hover:shadow-md`}
            >
              <span className="text-2xl">{config.emoji}</span>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">
                  {task.status === "in_progress"
                    ? task.activeForm
                    : task.content}
                </p>
                <span className={`text-xs font-mono font-bold ${config.text}`}>
                  {config.label}
                </span>
              </div>
              <span className="text-xs text-gray-400">
                點擊切換 →{" "}
                {STATUS_CONFIG[getNextStatus(task.status)].label}
              </span>
            </button>
          );
        })}
      </div>

      {warning && (
        <div className="mt-4 rounded-lg border-2 border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
          <strong>⚠️ {warning}</strong>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-gray-400">
          點擊任務卡片來切換狀態：pending → in_progress → completed → pending
        </p>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-lg px-3 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          重置
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// S03: TaskDecompositionDemo — 好 vs 壞的任務拆解對比
// ============================================================================

interface DecompositionExample {
  id: string;
  label: string;
  type: "good" | "bad";
  tasks: string[];
  explanation: string;
}

const DECOMPOSITION_EXAMPLES: DecompositionExample[] = [
  {
    id: "bad",
    label: "不好的拆解",
    type: "bad",
    tasks: [
      "改善程式碼",
      "處理使用者功能",
      "做一些測試",
    ],
    explanation:
      "任務太模糊、無法驗證。「改善程式碼」是什麼意思？「一些測試」是哪些測試？代理無法判斷何時算完成，也無法追蹤進度。",
  },
  {
    id: "good",
    label: "好的拆解",
    type: "good",
    tasks: [
      "檢查現有的 UserService 類別結構",
      "將 getUserById 函式重構為 async/await 語法",
      "新增 email 欄位的輸入驗證（regex 檢查 + 長度限制）",
      "撰寫 getUserById 的單元測試（含正常和異常路徑）",
      "執行 pytest 確認所有測試通過",
    ],
    explanation:
      "每個任務都具體、可驗證、粒度適中。代理能清楚知道要做什麼，也能判斷是否完成。最後包含驗證步驟確保品質。",
  },
];

export function TaskDecompositionDemo() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="my-8 grid gap-4 md:grid-cols-2">
      {DECOMPOSITION_EXAMPLES.map((example) => {
        const isExpanded = expanded === example.id;
        const isGood = example.type === "good";

        return (
          <button
            key={example.id}
            type="button"
            onClick={() => setExpanded(isExpanded ? null : example.id)}
            className={`rounded-xl border-2 p-5 text-left transition-all duration-200 ${
              isGood
                ? "border-green-300 bg-green-50 hover:shadow-md dark:border-green-700 dark:bg-green-900/20"
                : "border-red-300 bg-red-50 hover:shadow-md dark:border-red-700 dark:bg-red-900/20"
            } ${isExpanded ? "scale-[1.02] shadow-lg" : ""}`}
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="text-2xl">{isGood ? "✅" : "❌"}</span>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                {example.label}
              </h4>
              <span className="ml-auto text-xs text-gray-400">
                {isExpanded ? "▼" : "▶ 點擊展開"}
              </span>
            </div>

            <div className="space-y-2">
              {example.tasks.map((task, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${
                    isGood
                      ? "bg-green-100/50 dark:bg-green-800/20"
                      : "bg-red-100/50 dark:bg-red-800/20"
                  }`}
                >
                  <span className="mt-0.5 font-mono text-xs text-gray-400">
                    {i + 1}.
                  </span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {task}
                  </span>
                </div>
              ))}
            </div>

            {isExpanded && (
              <div
                className={`mt-4 border-t pt-3 text-sm ${
                  isGood
                    ? "border-green-200 text-green-800 dark:border-green-700 dark:text-green-300"
                    : "border-red-200 text-red-800 dark:border-red-700 dark:text-red-300"
                }`}
              >
                <strong>分析：</strong>
                {example.explanation}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// S04: SubagentArchitectureDemo — 互動式架構圖
// ============================================================================

interface SubagentRole {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  responsibilities: string[];
  pythonExample: string;
}

const SUBAGENT_ROLES: SubagentRole[] = [
  {
    id: "explore",
    name: "探索型子代理",
    emoji: "🔍",
    tagline: "快速搜尋、唯讀探索",
    responsibilities: [
      "搜尋程式碼庫中的特定模式",
      "理解專案結構與檔案組織",
      "找出函式定義、變數引用",
      "只使用 Glob、Grep、Read 等唯讀工具",
    ],
    pythonExample: `# 探索型子代理的呼叫方式
agent_input = {
    "prompt": """搜尋 src/services/ 目錄中所有使用
    database 連線的檔案。列出每個檔案中的資料庫
    查詢函式名稱，標示缺少錯誤處理的函式。
    以結構化清單格式回傳。""",
}

# 子代理會在獨立上下文中：
# 1. Glob 搜尋 src/services/**/*.py
# 2. Grep 搜尋 database/connection 關鍵字
# 3. Read 逐一閱讀相關檔案
# 4. 整理結果後回傳精煉摘要`,
  },
  {
    id: "plan",
    name: "規劃型子代理",
    emoji: "📋",
    tagline: "分析需求、制定計畫",
    responsibilities: [
      "閱讀現有程式碼理解架構",
      "制定結構化的實作計畫",
      "識別潛在的技術風險",
      "不修改任何檔案，只產出計畫文件",
    ],
    pythonExample: `# 規劃型子代理的呼叫方式
agent_input = {
    "prompt": """分析當前專案的認證系統架構，
    制定新增 OAuth 2.0 登入的實作計畫。

    計畫需包含：
    1. 需要修改的檔案清單
    2. 每個檔案的變更摘要
    3. 建議的實作順序
    4. 潛在的風險與注意事項

    以 JSON 格式回傳計畫。""",
}`,
  },
  {
    id: "quality",
    name: "品質檢查子代理",
    emoji: "🛡️",
    tagline: "審查程式碼品質",
    responsibilities: [
      "審查變更的程式碼是否符合規範",
      "檢查潛在的 bug 和安全漏洞",
      "驗證測試覆蓋率是否足夠",
      "只回報問題，不自動修復",
    ],
    pythonExample: `# 品質檢查子代理的呼叫方式
agent_input = {
    "prompt": """審查以下變更的程式碼品質：
    - src/auth/oauth.py（新增）
    - src/auth/middleware.py（修改）
    - tests/test_oauth.py（新增）

    檢查項目：
    1. 是否遵循 PEP 8 規範
    2. 是否有適當的錯誤處理
    3. 是否有安全性風險
    4. 測試是否涵蓋主要路徑

    以嚴重等級（高/中/低）分類回報。""",
}`,
  },
];

export function SubagentArchitectureDemo() {
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const active = SUBAGENT_ROLES.find((r) => r.id === activeRole);

  return (
    <div className="my-8">
      {/* 主代理節點 */}
      <div className="mb-4 flex justify-center">
        <div className="rounded-xl border-2 border-claude-orange bg-claude-orange/10 px-6 py-3 text-center">
          <span className="text-2xl">🧠</span>
          <p className="mt-1 font-bold text-claude-orange">主代理</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            分配任務、整合結果
          </p>
        </div>
      </div>

      {/* 連接線 */}
      <div className="flex justify-center">
        <div className="flex items-center gap-8">
          {SUBAGENT_ROLES.map((_, i) => (
            <svg
              key={i}
              className="h-8 w-4 text-gray-300 dark:text-gray-600"
              viewBox="0 0 16 32"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M8 0 L8 32" />
              <path d="M4 26 L8 32 L12 26" />
            </svg>
          ))}
        </div>
      </div>

      {/* 子代理卡片 */}
      <div className="grid gap-3 sm:grid-cols-3">
        {SUBAGENT_ROLES.map((role) => {
          const isActive = activeRole === role.id;
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => setActiveRole(isActive ? null : role.id)}
              className={`rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                isActive
                  ? "border-claude-orange bg-claude-orange/5 shadow-lg ring-2 ring-claude-orange/20 dark:bg-claude-orange/10"
                  : "border-gray-200 bg-white hover:border-claude-orange/40 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
              }`}
            >
              <div className="mb-2 text-3xl">{role.emoji}</div>
              <div className="mb-1 font-bold text-gray-900 dark:text-white">
                {role.name}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {role.tagline}
              </p>
            </button>
          );
        })}
      </div>

      {/* 展開的詳情面板 */}
      {active && (
        <div className="mt-4 rounded-xl border-2 border-claude-orange/30 bg-white p-6 shadow-sm dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{active.emoji}</span>
              <div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                  {active.name}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {active.tagline}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveRole(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          <div className="mb-4">
            <h5 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              職責範圍：
            </h5>
            <ul className="space-y-1">
              {active.responsibilities.map((r, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                >
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-claude-orange" />
                  {r}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg bg-gray-900 text-sm">
            <div className="flex items-center justify-between border-b border-gray-700 px-4 py-2">
              <span className="font-mono text-xs text-gray-400">
                subagent_call.py
              </span>
              <span className="rounded bg-blue-600/20 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                Python
              </span>
            </div>
            <pre className="overflow-x-auto p-4 text-gray-300">
              <code>{active.pythonExample}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// S04: ContextIsolationDemo — 有/沒有子代理時的上下文消耗對比
// ============================================================================

interface ContextState {
  label: string;
  used: number; // 百分比
  segments: { name: string; percent: number; color: string }[];
  description: string;
}

const CONTEXT_STATES: Record<string, ContextState> = {
  without: {
    label: "沒有子代理",
    used: 85,
    segments: [
      { name: "System Prompt", percent: 10, color: "bg-blue-500" },
      { name: "使用者指令", percent: 5, color: "bg-purple-500" },
      { name: "探索過程（50個檔案）", percent: 40, color: "bg-red-400" },
      { name: "試錯記錄", percent: 15, color: "bg-red-300" },
      { name: "工具呼叫結果", percent: 10, color: "bg-amber-400" },
      { name: "最終結果", percent: 5, color: "bg-green-500" },
    ],
    description:
      "所有探索過程、試錯記錄都堆積在主對話中。85% 的上下文被中間過程佔用，只剩 15% 空間給新的工作。代理很快就會觸發壓縮，開始「遺忘」重要資訊。",
  },
  with: {
    label: "使用子代理",
    used: 35,
    segments: [
      { name: "System Prompt", percent: 10, color: "bg-blue-500" },
      { name: "使用者指令", percent: 5, color: "bg-purple-500" },
      { name: "子代理精煉結果", percent: 10, color: "bg-green-500" },
      { name: "主對話工具呼叫", percent: 10, color: "bg-amber-400" },
    ],
    description:
      "子代理在獨立上下文中完成探索（讀了 50 個檔案），只把精煉後的結論帶回主對話。主對話只用了 35% 上下文，還有 65% 的空間可以繼續工作。",
  },
};

export function ContextIsolationDemo() {
  const [mode, setMode] = useState<"without" | "with">("without");
  const state = CONTEXT_STATES[mode];

  return (
    <div className="my-8">
      {/* 切換按鈕 */}
      <div className="mb-6 flex rounded-xl border-2 border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <button
          type="button"
          onClick={() => setMode("without")}
          className={`flex-1 rounded-l-xl px-4 py-3 text-sm font-medium transition-all ${
            mode === "without"
              ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
        >
          ❌ 沒有子代理
        </button>
        <button
          type="button"
          onClick={() => setMode("with")}
          className={`flex-1 rounded-r-xl px-4 py-3 text-sm font-medium transition-all ${
            mode === "with"
              ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
        >
          ✅ 使用子代理
        </button>
      </div>

      {/* 上下文窗口條形圖 */}
      <div className="mb-4 rounded-xl border-2 border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            上下文窗口使用量
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              state.used > 70
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            }`}
          >
            已用 {state.used}%
          </span>
        </div>

        {/* 長條圖 */}
        <div className="mb-4 flex h-10 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
          {state.segments.map((seg, i) => (
            <div
              key={i}
              className={`${seg.color} flex items-center justify-center transition-all duration-500`}
              style={{ width: `${seg.percent}%` }}
              title={`${seg.name}: ${seg.percent}%`}
            >
              {seg.percent >= 10 && (
                <span className="truncate px-1 text-[10px] font-medium text-white">
                  {seg.percent}%
                </span>
              )}
            </div>
          ))}
          <div
            className="flex items-center justify-center"
            style={{ width: `${100 - state.used}%` }}
          >
            <span className="text-[10px] text-gray-400">剩餘空間</span>
          </div>
        </div>

        {/* 圖例 */}
        <div className="flex flex-wrap gap-3">
          {state.segments.map((seg, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className={`h-2.5 w-2.5 rounded-full ${seg.color}`} />
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                {seg.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 說明 */}
      <div
        className={`rounded-lg border-l-4 p-4 text-sm ${
          mode === "without"
            ? "border-red-400 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300"
            : "border-green-400 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300"
        }`}
      >
        {state.description}
      </div>
    </div>
  );
}

// ============================================================================
// S05: SkillStructureDemo — SKILL.md 互動式編輯器
// ============================================================================

type SkillField = "description" | "command" | "triggers" | "content";

interface SkillFieldOption {
  id: SkillField;
  label: string;
  emoji: string;
  description: string;
  value: string;
}

const SKILL_FIELDS: SkillFieldOption[] = [
  {
    id: "description",
    label: "description",
    emoji: "📝",
    description: "技能的一句話說明，顯示在技能清單中",
    value: "部署應用程式到生產環境",
  },
  {
    id: "command",
    label: "command",
    emoji: "⌨️",
    description: "觸發此技能的斜線指令",
    value: "/deploy",
  },
  {
    id: "triggers",
    label: "triggers",
    emoji: "🎯",
    description: "自動觸發的關鍵字清單，使用者提到這些詞就會載入技能",
    value: '- "部署"\n  - "deploy"\n  - "上線"',
  },
  {
    id: "content",
    label: "內容本文",
    emoji: "📄",
    description: "技能的指令、步驟和知識內容（Markdown 格式）",
    value:
      "## 執行步驟\n1. 確認所有測試通過\n2. 建構生產版本\n3. 執行部署指令",
  },
];

export function SkillStructureDemo() {
  const [activeField, setActiveField] = useState<SkillField>("description");
  const active = SKILL_FIELDS.find((f) => f.id === activeField)!;

  function buildPreview(): string {
    const desc = SKILL_FIELDS.find((f) => f.id === "description")!.value;
    const cmd = SKILL_FIELDS.find((f) => f.id === "command")!.value;
    const triggers = SKILL_FIELDS.find((f) => f.id === "triggers")!.value;
    const content = SKILL_FIELDS.find((f) => f.id === "content")!.value;

    return `---
description: "${desc}"
command: "${cmd}"
triggers:
  ${triggers}
---

# 部署技能

${content}`;
  }

  return (
    <div className="my-8">
      <div className="grid gap-4 lg:grid-cols-2">
        {/* 左側：欄位選擇 */}
        <div className="space-y-2">
          {SKILL_FIELDS.map((field) => {
            const isActive = activeField === field.id;
            return (
              <button
                key={field.id}
                type="button"
                onClick={() => setActiveField(field.id)}
                className={`flex w-full items-center gap-3 rounded-lg border-2 p-3 text-left transition-all ${
                  isActive
                    ? "border-claude-orange bg-claude-orange/5 shadow-md dark:bg-claude-orange/10"
                    : "border-gray-200 bg-white hover:border-claude-orange/40 dark:border-gray-700 dark:bg-gray-800"
                }`}
              >
                <span className="text-xl">{field.emoji}</span>
                <div className="flex-1">
                  <code className="text-sm font-mono font-bold text-gray-900 dark:text-white">
                    {field.label}
                  </code>
                  {isActive && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {field.description}
                    </p>
                  )}
                </div>
                {isActive && (
                  <span className="text-claude-orange">◀</span>
                )}
              </button>
            );
          })}

          {/* 說明面板 */}
          <div className="mt-3 rounded-lg border border-claude-orange/20 bg-claude-orange/5 p-4 dark:bg-claude-orange/10">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong className="text-claude-orange">{active.emoji} {active.label}</strong>
              ：{active.description}
            </p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              目前值：<code className="rounded bg-gray-200 px-1 dark:bg-gray-700">{active.value.split("\n")[0]}</code>
            </p>
          </div>
        </div>

        {/* 右側：即時預覽 */}
        <div className="rounded-lg bg-gray-900 text-sm">
          <div className="flex items-center justify-between border-b border-gray-700 px-4 py-2">
            <span className="font-mono text-xs text-gray-400">
              .claude/skills/deploy/SKILL.md
            </span>
            <span className="rounded bg-green-600/20 px-2 py-0.5 text-[10px] font-medium text-green-400">
              即時預覽
            </span>
          </div>
          <pre className="overflow-x-auto p-4 text-gray-300">
            <code>{buildPreview()}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// S05: KnowledgeLoadingDemo — 知識載入優先順序堆疊圖
// ============================================================================

interface KnowledgeLayer {
  id: string;
  name: string;
  priority: number;
  emoji: string;
  color: string;
  description: string;
  example: string;
}

const KNOWLEDGE_LAYERS: KnowledgeLayer[] = [
  {
    id: "system",
    name: "System Prompt",
    priority: 1,
    emoji: "🏛️",
    color: "bg-red-500",
    description:
      "最高優先。Claude Code 內建的系統提示，定義代理的基本行為模式和安全規則。這一層由 Anthropic 控制，使用者無法修改。",
    example: "工具使用規則、安全限制、回應格式等",
  },
  {
    id: "project-claude",
    name: "CLAUDE.md（專案根目錄）",
    priority: 2,
    emoji: "📁",
    color: "bg-claude-orange",
    description:
      "專案級設定。定義此專案的編碼規範、技術棧、禁止行為和偏好設定。每次 API 呼叫都會載入，不受壓縮影響。",
    example: "「使用 TypeScript strict mode」「禁止使用 any 型別」",
  },
  {
    id: "subdir-claude",
    name: "CLAUDE.md（子目錄）",
    priority: 3,
    emoji: "📂",
    color: "bg-amber-500",
    description:
      "更具體的設定。針對特定目錄（如 src/api/）定義額外規則，會覆蓋專案級的同名設定。適合大型專案的分層管理。",
    example: "「API 路由函式必須驗證 JWT token」",
  },
  {
    id: "user-claude",
    name: "CLAUDE.md（使用者家目錄）",
    priority: 4,
    emoji: "🏠",
    color: "bg-blue-500",
    description:
      "全域偏好。存放在 ~/.claude/CLAUDE.md，對所有專案生效。定義使用者的通用偏好設定，優先順序低於專案級設定。",
    example: "「一律以繁體中文回答」「偏好函式式程式設計風格」",
  },
  {
    id: "skills",
    name: "Skills（動態載入）",
    priority: 5,
    emoji: "⚡",
    color: "bg-purple-500",
    description:
      "按需載入。只在觸發條件符合時才會載入的技能知識。不會常駐在上下文中，有效節省空間。優先順序低於 CLAUDE.md。",
    example: "「/deploy 技能：部署步驟和檢查清單」",
  },
  {
    id: "history",
    name: "對話歷史與工具結果",
    priority: 6,
    emoji: "💬",
    color: "bg-gray-500",
    description:
      "最低優先。對話中累積的訊息和工具執行結果。這一層最容易在壓縮時被精簡或移除，重要資訊不應只存在這裡。",
    example: "先前讀取的檔案內容、工具輸出、對話記錄",
  },
];

export function KnowledgeLoadingDemo() {
  const [activeLayer, setActiveLayer] = useState<string | null>(null);
  const active = KNOWLEDGE_LAYERS.find((l) => l.id === activeLayer);

  return (
    <div className="my-8">
      {/* 堆疊圖 */}
      <div className="space-y-1">
        {KNOWLEDGE_LAYERS.map((layer) => {
          const isActive = activeLayer === layer.id;
          return (
            <button
              key={layer.id}
              type="button"
              onClick={() =>
                setActiveLayer(isActive ? null : layer.id)
              }
              className={`flex w-full items-center gap-3 rounded-lg border-2 p-3 text-left transition-all duration-200 ${
                isActive
                  ? "border-claude-orange bg-claude-orange/5 shadow-lg scale-[1.02] dark:bg-claude-orange/10"
                  : "border-gray-200 bg-white hover:border-claude-orange/40 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold ${layer.color}`}
              >
                {layer.priority}
              </div>
              <span className="text-xl">{layer.emoji}</span>
              <div className="flex-1">
                <span className="font-medium text-gray-900 dark:text-white">
                  {layer.name}
                </span>
              </div>
              <span className="text-xs text-gray-400">
                {isActive ? "▼" : "▶"}
              </span>
            </button>
          );
        })}
      </div>

      {/* 展開說明 */}
      {active && (
        <div className="mt-4 rounded-xl border-2 border-claude-orange/30 bg-white p-5 shadow-sm dark:bg-gray-800">
          <div className="mb-3 flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full text-white font-bold ${active.color}`}
            >
              {active.priority}
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white">
                {active.emoji} {active.name}
              </h4>
              <span className="text-xs text-gray-400">
                優先順序 #{active.priority}（數字越小越優先）
              </span>
            </div>
          </div>
          <p className="mb-3 text-sm text-gray-700 dark:text-gray-300">
            {active.description}
          </p>
          <div className="rounded-lg bg-gray-100 p-3 text-sm dark:bg-gray-700">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              範例：
            </span>
            <p className="mt-1 text-gray-700 dark:text-gray-300">
              {active.example}
            </p>
          </div>
        </div>
      )}

      <p className="mt-3 text-xs text-gray-400 text-center">
        點擊每一層查看說明。優先順序越高，指令在衝突時越有優勢。
      </p>
    </div>
  );
}

// ============================================================================
// S06: ContextWindowDemo — 互動式上下文窗口使用量條形圖
// ============================================================================

interface ContextPhase {
  label: string;
  systemPrompt: number;
  userMessages: number;
  toolCalls: number;
  toolResults: number;
  agentResponses: number;
  compressed: number;
}

const CONTEXT_PHASES: ContextPhase[] = [
  {
    label: "開始",
    systemPrompt: 15,
    userMessages: 5,
    toolCalls: 0,
    toolResults: 0,
    agentResponses: 0,
    compressed: 0,
  },
  {
    label: "探索中",
    systemPrompt: 15,
    userMessages: 5,
    toolCalls: 10,
    toolResults: 25,
    agentResponses: 10,
    compressed: 0,
  },
  {
    label: "大量工具呼叫",
    systemPrompt: 15,
    userMessages: 5,
    toolCalls: 15,
    toolResults: 35,
    agentResponses: 15,
    compressed: 0,
  },
  {
    label: "接近上限",
    systemPrompt: 15,
    userMessages: 5,
    toolCalls: 18,
    toolResults: 40,
    agentResponses: 17,
    compressed: 0,
  },
  {
    label: "壓縮後",
    systemPrompt: 15,
    userMessages: 5,
    toolCalls: 5,
    toolResults: 10,
    agentResponses: 5,
    compressed: 0,
  },
];

const CONTEXT_COLORS = [
  { key: "systemPrompt", label: "System Prompt", color: "bg-blue-500" },
  { key: "userMessages", label: "使用者訊息", color: "bg-purple-500" },
  { key: "toolCalls", label: "工具呼叫", color: "bg-amber-400" },
  { key: "toolResults", label: "工具結果", color: "bg-red-400" },
  { key: "agentResponses", label: "代理回應", color: "bg-green-500" },
] as const;

export function ContextWindowDemo() {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const phase = CONTEXT_PHASES[phaseIndex];
  const total =
    phase.systemPrompt +
    phase.userMessages +
    phase.toolCalls +
    phase.toolResults +
    phase.agentResponses;
  const remaining = 100 - total;

  const isCompacted = phaseIndex === CONTEXT_PHASES.length - 1;
  const isNearLimit = total > 85;

  return (
    <div className="my-8">
      {/* 階段選擇滑桿 */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            對話階段：{phase.label}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              isNearLimit
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                : isCompacted
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
            }`}
          >
            {isCompacted ? "壓縮完成" : `已用 ${total}%`}
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={CONTEXT_PHASES.length - 1}
          value={phaseIndex}
          onChange={(e) => setPhaseIndex(Number(e.target.value))}
          className="w-full accent-claude-orange"
        />

        <div className="mt-1 flex justify-between text-[10px] text-gray-400">
          {CONTEXT_PHASES.map((p, i) => (
            <span key={i}>{p.label}</span>
          ))}
        </div>
      </div>

      {/* 條形圖 */}
      <div className="rounded-xl border-2 border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex h-12 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
          {CONTEXT_COLORS.map(({ key, color }) => {
            const value = phase[key as keyof ContextPhase] as number;
            return (
              <div
                key={key}
                className={`${color} flex items-center justify-center transition-all duration-500`}
                style={{ width: `${value}%` }}
              >
                {value >= 8 && (
                  <span className="truncate px-1 text-[10px] font-medium text-white">
                    {value}%
                  </span>
                )}
              </div>
            );
          })}
          <div
            className="flex items-center justify-center transition-all duration-500"
            style={{ width: `${remaining}%` }}
          >
            {remaining >= 10 && (
              <span className="text-[10px] text-gray-400">
                剩餘 {remaining}%
              </span>
            )}
          </div>
        </div>

        {/* 圖例 */}
        <div className="flex flex-wrap gap-3">
          {CONTEXT_COLORS.map(({ key, label, color }) => {
            const value = phase[key as keyof ContextPhase] as number;
            return (
              <div key={key} className="flex items-center gap-1.5">
                <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  {label} ({value}%)
                </span>
              </div>
            );
          })}
        </div>

        {/* 階段說明 */}
        {isNearLimit && !isCompacted && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
            ⚠️ 上下文即將滿載！系統準備觸發壓縮，將移除早期的工具結果和過程記錄。
          </div>
        )}
        {isCompacted && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-400">
            ✅ 壓縮完成。System Prompt 和使用者訊息被保留，早期的工具結果和過程記錄被精簡為摘要。空間從 5% 恢復到 {remaining}%。
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// S06: CompactionStrategyCards — 4 個壓縮策略卡片
// ============================================================================

interface CompactionStrategy {
  id: string;
  name: string;
  emoji: string;
  summary: string;
  detail: string;
  pythonExample: string;
}

const COMPACTION_STRATEGIES: CompactionStrategy[] = [
  {
    id: "structured",
    name: "結構化指令設計",
    emoji: "🏗️",
    summary: "把重要規則放在 CLAUDE.md，而非對話中",
    detail:
      "CLAUDE.md 的內容在每次 API 呼叫時都會作為 system prompt 的一部分送入，不受壓縮影響。把關鍵的編碼規範、禁止行為、架構約束放在 CLAUDE.md 中，確保代理永遠不會「遺忘」這些規則。",
    pythonExample: `# CLAUDE.md 的內容永遠不會被壓縮

# 好的做法：把規則放在 CLAUDE.md
# ─────────────────────────────
# CLAUDE.md:
# - 所有函式必須有型別標註
# - 禁止使用 any 型別
# - 錯誤處理必須明確

# 不好的做法：在對話中反覆重述規則
# ─────────────────────────────
# user: "記住，所有函式必須有型別標註..."
# （這段可能在壓縮時被移除）`,
  },
  {
    id: "subagent",
    name: "善用子代理",
    emoji: "🤖",
    summary: "把探索工作委派給子代理，主對話保持精簡",
    detail:
      "子代理在獨立上下文中完成探索和分析，只把精煉後的結論帶回主對話。這是最有效的上下文管理手段 — 50 個檔案的探索結果可能只用 10 行摘要就帶回來了。",
    pythonExample: `# 子代理：用 token 換上下文空間

# 沒有子代理的做法（佔用主對話空間）
# Read file_1.py → 200 行
# Read file_2.py → 150 行
# ... (50 個檔案全部堆在主對話)
# 主對話上下文：爆滿

# 使用子代理的做法
agent_input = {
    "prompt": "搜尋 src/ 中所有 API 端點，回報清單",
}
# 子代理獨立讀取 50 個檔案
# 只回傳精煉結果：
# "找到 12 個 API 端點：GET /users, POST /auth..."
# 主對話上下文：精簡`,
  },
  {
    id: "concise",
    name: "精簡提示語",
    emoji: "✂️",
    summary: "避免在對話中反覆重述相同資訊",
    detail:
      "如果需要提醒代理某個規則，簡短地引用即可（例如「按照 CLAUDE.md 中的 API 設計規範」），而非完整重述規則內容。每一個冗餘的 token 都是在浪費上下文空間。",
    pythonExample: `# 精簡提示語的對比

# 冗長的提示（浪費 token）
# ──────────────────
# user: "請記住，我們的專案使用 FastAPI 框架，
# 所有端點必須使用 Pydantic 模型驗證輸入，
# 回應格式必須統一使用 JSON，
# 錯誤碼要符合 HTTP 標準...（重複第5次）"

# 精簡的提示（節省 token）
# ──────────────────
# user: "按照 CLAUDE.md 的 API 規範，
# 新增一個 /users/search 端點"`,
  },
  {
    id: "segment",
    name: "任務分段",
    emoji: "📦",
    summary: "大型任務拆分為多個獨立對話",
    detail:
      "每個對話處理一個子任務，完成後將結果以簡潔的摘要帶入下一個對話。這避免了單一對話被撐爆，每個新對話都從乾淨的上下文開始。",
    pythonExample: `# 任務分段範例

# 對話 1：分析現有架構
# ──────────────────
# user: "分析 src/ 的架構，摘要存到 notes.md"
# → 產出：architecture_notes.md

# 對話 2：實作新功能
# ──────────────────
# user: "讀取 architecture_notes.md，
#        依此實作 OAuth 登入功能"
# → 產出：程式碼變更

# 對話 3：測試與修復
# ──────────────────
# user: "執行完整測試，修復所有失敗"
# → 產出：通過所有測試

# 每個對話都從乾淨的上下文開始！`,
  },
];

export function CompactionStrategyCards() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="my-8 grid gap-4 sm:grid-cols-2">
      {COMPACTION_STRATEGIES.map((strategy) => {
        const isExpanded = expanded === strategy.id;

        return (
          <button
            key={strategy.id}
            type="button"
            onClick={() =>
              setExpanded(isExpanded ? null : strategy.id)
            }
            className={`rounded-xl border-2 p-5 text-left transition-all duration-200 ${
              isExpanded
                ? "border-claude-orange bg-claude-orange/5 shadow-lg col-span-full dark:bg-claude-orange/10"
                : "border-gray-200 bg-white hover:border-claude-orange/40 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
            }`}
          >
            <div className="mb-2 flex items-center gap-3">
              <span className="text-3xl">{strategy.emoji}</span>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 dark:text-white">
                  {strategy.name}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {strategy.summary}
                </p>
              </div>
              <span className="text-xs text-gray-400">
                {isExpanded ? "▼" : "▶"}
              </span>
            </div>

            {isExpanded && (
              <div className="mt-4 space-y-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {strategy.detail}
                </p>

                <div className="rounded-lg bg-gray-900 text-sm">
                  <div className="flex items-center justify-between border-b border-gray-700 px-4 py-2">
                    <span className="font-mono text-xs text-gray-400">
                      {strategy.id}_strategy.py
                    </span>
                    <span className="rounded bg-blue-600/20 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                      Python
                    </span>
                  </div>
                  <pre className="overflow-x-auto p-4 text-gray-300">
                    <code>{strategy.pythonExample}</code>
                  </pre>
                </div>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
