"use client";

import { useState } from "react";

// ============================================================================
// 1. 工具箱互動卡片 — 點擊查看每個工具的詳細說明 + Python 範例
// ============================================================================

interface ToolInfo {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  category: "read" | "write" | "execute" | "search" | "manage";
  permission: "auto" | "ask" | "deny";
  description: string;
  pythonExample: string;
  pythonFilename: string;
}

const TOOLS: ToolInfo[] = [
  {
    id: "bash",
    name: "Bash",
    emoji: "💻",
    tagline: "執行任意 shell 指令",
    category: "execute",
    permission: "ask",
    description:
      "最強大的工具。能編譯、測試、版本控制、安裝套件。但也最危險 — 可以刪檔案、改系統設定。",
    pythonFilename: "bash_tool.py",
    pythonExample: `# Bash 工具 — 執行 shell 指令
import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    tools=[{
        "name": "bash",
        "type": "bash_20250124",
        "command": "pytest tests/ -v"  # 執行測試
    }],
    messages=[{
        "role": "user",
        "content": "幫我跑一下測試"
    }]
)`,
  },
  {
    id: "read",
    name: "Read",
    emoji: "📖",
    tagline: "讀取檔案內容",
    category: "read",
    permission: "auto",
    description:
      "讀取檔案系統中的檔案。支援文字檔、圖片、PDF、Jupyter Notebook。可用 offset/limit 控制範圍。",
    pythonFilename: "read_tool.py",
    pythonExample: `# Read 工具 — 讀取檔案內容
import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    tools=[{
        "name": "read",
        "type": "custom",
        "input_schema": {
            "type": "object",
            "properties": {
                "file_path": {
                    "type": "string",
                    "description": "絕對路徑"
                },
                "offset": {
                    "type": "integer",
                    "description": "起始行號"
                },
                "limit": {
                    "type": "integer",
                    "description": "讀取行數"
                }
            },
            "required": ["file_path"]
        }
    }],
    messages=[{
        "role": "user",
        "content": "讀取 /app/main.py 的前 50 行"
    }]
)`,
  },
  {
    id: "edit",
    name: "Edit",
    emoji: "✏️",
    tagline: "精確字串替換",
    category: "write",
    permission: "ask",
    description:
      "精確替換檔案中的文字。只傳送差異部分，省 token、更安全。修改現有檔案時優先使用。",
    pythonFilename: "edit_tool.py",
    pythonExample: `# Edit 工具 — 精確字串替換
# 只需要指定「舊文字」和「新文字」

tool_input = {
    "file_path": "/app/main.py",
    "old_string": "def get_user(id: int):",
    "new_string": "def get_user(id: int, email: str = None):",
    "replace_all": False
}

# Claude 會自動呼叫 Edit 工具
# 只傳送差異，不需要重寫整個檔案
# 比 Write 更省 token、更安全`,
  },
  {
    id: "write",
    name: "Write",
    emoji: "📝",
    tagline: "建立或覆寫檔案",
    category: "write",
    permission: "ask",
    description:
      "建立新檔案或完整覆寫現有檔案。適合新檔案建立，但修改既有檔案時應優先使用 Edit。",
    pythonFilename: "write_tool.py",
    pythonExample: `# Write 工具 — 建立新檔案
tool_input = {
    "file_path": "/app/health.py",
    "content": """from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "1.0.0"
    }
"""
}

# 適用場景：建立全新檔案
# 不適用場景：修改現有檔案（請用 Edit）`,
  },
  {
    id: "glob",
    name: "Glob",
    emoji: "📂",
    tagline: "依檔名模式搜尋",
    category: "search",
    permission: "auto",
    description:
      "依檔案名稱模式搜尋。找 *.py、src/**/*.tsx 這類檔案。是代理理解專案結構的起點。",
    pythonFilename: "glob_tool.py",
    pythonExample: `# Glob 工具 — 檔案模式搜尋
tool_input = {
    "pattern": "**/*.py",  # 找所有 Python 檔案
    "path": "/app"         # 搜尋起始目錄
}

# 常用模式：
# "**/*.py"        → 所有 Python 檔案
# "src/**/*.tsx"   → src 下所有 TSX 元件
# "**/test_*.py"   → 所有測試檔案
# "*.md"           → 當前目錄的 Markdown`,
  },
  {
    id: "grep",
    name: "Grep",
    emoji: "🔍",
    tagline: "依內容搜尋程式碼",
    category: "search",
    permission: "auto",
    description:
      "用正規表示式搜尋檔案內容（基於 ripgrep）。找函式定義、變數引用、錯誤訊息等。",
    pythonFilename: "grep_tool.py",
    pythonExample: `# Grep 工具 — 內容搜尋（基於 ripgrep）
tool_input = {
    "pattern": "def health_check",
    "path": "/app",
    "glob": "*.py",            # 只搜尋 Python 檔案
    "output_mode": "content",  # 顯示匹配行內容
    "context": 3               # 上下文行數
}

# output_mode 選項：
# "content"            → 顯示匹配行
# "files_with_matches" → 只顯示檔案路徑
# "count"              → 顯示匹配數量`,
  },
  {
    id: "agent",
    name: "Agent",
    emoji: "🤖",
    tagline: "建立隔離子代理",
    category: "manage",
    permission: "auto",
    description:
      "建立獨立的子代理處理子任務。子代理有獨立上下文窗口，完成後回傳結果，不會污染主對話。",
    pythonFilename: "agent_tool.py",
    pythonExample: `# Agent 工具 — 建立隔離子代理
tool_input = {
    "prompt": "搜尋所有使用 deprecated API 的檔案",
    "description": "搜尋過時 API",
    "subagent_type": "Explore"
}

# 子代理類型：
# "general-purpose" → 完整能力（讀寫執行）
# "Explore"         → 快速搜尋（唯讀）
# "Plan"            → 設計方案（唯讀）

# 優勢：獨立上下文，不佔主對話空間`,
  },
  {
    id: "todowrite",
    name: "TodoWrite",
    emoji: "📋",
    tagline: "結構化任務管理",
    category: "manage",
    permission: "auto",
    description:
      "建立和管理任務清單。將複雜工作拆解為步驟，追蹤進度。是代理展現思考過程的關鍵機制。",
    pythonFilename: "todowrite_tool.py",
    pythonExample: `# TodoWrite 工具 — 結構化任務管理
tool_input = {
    "todos": [
        {
            "content": "讀取現有 API 路由結構",
            "status": "completed",
            "activeForm": "讀取現有 API 路由結構"
        },
        {
            "content": "新增 /health endpoint",
            "status": "in_progress",
            "activeForm": "新增 /health endpoint"
        },
        {
            "content": "撰寫單元測試",
            "status": "pending",
            "activeForm": "撰寫單元測試"
        }
    ]
}`,
  },
];

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  read: { label: "唯讀", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  write: { label: "寫入", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  execute: { label: "執行", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  search: { label: "搜尋", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  manage: { label: "管理", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
};

const PERMISSION_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  auto: { label: "自動允許", emoji: "🟢", color: "text-green-600 dark:text-green-400" },
  ask: { label: "需確認", emoji: "🟡", color: "text-amber-600 dark:text-amber-400" },
  deny: { label: "禁止", emoji: "🔴", color: "text-red-600 dark:text-red-400" },
};

export function ToolboxCards() {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  return (
    <div className="my-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TOOLS.map((tool) => {
          const isActive = activeTool === tool.id;
          const cat = CATEGORY_LABELS[tool.category];
          const perm = PERMISSION_LABELS[tool.permission];

          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => setActiveTool(isActive ? null : tool.id)}
              className={`rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                isActive
                  ? "border-claude-orange bg-claude-orange/5 shadow-lg ring-2 ring-claude-orange/20 dark:bg-claude-orange/10"
                  : "border-gray-200 bg-white hover:border-claude-orange/40 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
              }`}
            >
              <div className="mb-2 text-3xl">{tool.emoji}</div>
              <div className="mb-1 font-bold text-gray-900 dark:text-white">
                {tool.name}
              </div>
              <div className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                {tool.tagline}
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${cat.color}`}>
                  {cat.label}
                </span>
                <span className={`text-[10px] ${perm.color}`}>
                  {perm.emoji} {perm.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 展開的詳細面板 */}
      {activeTool && (() => {
        const tool = TOOLS.find((t) => t.id === activeTool);
        if (!tool) return null;
        const perm = PERMISSION_LABELS[tool.permission];

        return (
          <div className="mt-4 rounded-xl border-2 border-claude-orange/30 bg-white p-6 shadow-sm dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{tool.emoji}</span>
                <div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                    {tool.name}
                  </h4>
                  <span className={`text-sm ${perm.color}`}>
                    {perm.emoji} 預設權限：{perm.label}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTool(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            <p className="mb-4 text-gray-700 dark:text-gray-300">
              {tool.description}
            </p>

            {/* Python 範例 */}
            <div className="rounded-lg bg-gray-900 text-sm">
              <div className="flex items-center justify-between border-b border-gray-700 px-4 py-2">
                <span className="font-mono text-xs text-gray-400">
                  {tool.pythonFilename}
                </span>
                <span className="rounded bg-blue-600/20 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                  Python
                </span>
              </div>
              <pre className="overflow-x-auto p-4 text-gray-300">
                <code>{tool.pythonExample}</code>
              </pre>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ============================================================================
// 2. 權限層級互動圖
// ============================================================================

interface PermissionRule {
  tool: string;
  command?: string;
  level: "allow" | "ask" | "deny";
  reason: string;
}

const PERMISSION_EXAMPLES: PermissionRule[] = [
  { tool: "Read", level: "allow", reason: "唯讀操作，不會改變系統狀態" },
  { tool: "Glob", level: "allow", reason: "檔案搜尋，不會改變系統狀態" },
  { tool: "Grep", level: "allow", reason: "內容搜尋，不會改變系統狀態" },
  { tool: "Bash", command: "pytest tests/", level: "allow", reason: "測試指令，安全" },
  { tool: "Bash", command: "git status", level: "allow", reason: "查看狀態，安全" },
  { tool: "Edit", level: "ask", reason: "修改檔案內容，需確認" },
  { tool: "Write", level: "ask", reason: "建立或覆寫檔案，需確認" },
  { tool: "Bash", command: "npm install", level: "ask", reason: "安裝套件，可能影響環境" },
  { tool: "Bash", command: "rm -rf", level: "deny", reason: "刪除操作，禁止" },
  { tool: "Bash", command: "git push --force", level: "deny", reason: "強制推送，禁止" },
];

const LEVEL_CONFIG = {
  allow: {
    label: "自動允許",
    emoji: "🟢",
    bg: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
    badge: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
    desc: "不需要使用者確認即可執行",
  },
  ask: {
    label: "需要確認",
    emoji: "🟡",
    bg: "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
    desc: "每次執行前都會詢問使用者",
  },
  deny: {
    label: "完全禁止",
    emoji: "🔴",
    bg: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
    badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
    desc: "無論如何都不允許執行",
  },
} as const;

export function PermissionLevels() {
  const [activeLevel, setActiveLevel] = useState<"allow" | "ask" | "deny" | null>(null);

  const levels: Array<"allow" | "ask" | "deny"> = ["allow", "ask", "deny"];

  return (
    <div className="my-8">
      {/* 三個層級按鈕 */}
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {levels.map((level) => {
          const config = LEVEL_CONFIG[level];
          const isActive = activeLevel === level;
          const rules = PERMISSION_EXAMPLES.filter((r) => r.level === level);

          return (
            <button
              key={level}
              type="button"
              onClick={() => setActiveLevel(isActive ? null : level)}
              className={`rounded-xl border-2 p-4 text-left transition-all ${config.bg} ${
                isActive ? "scale-105 shadow-lg ring-2 ring-claude-orange/30" : "hover:shadow-md"
              }`}
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="text-2xl">{config.emoji}</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {config.label}
                </span>
                <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${config.badge}`}>
                  {rules.length} 項
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {config.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* 展開的規則清單 */}
      {activeLevel && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h4 className="mb-3 font-bold text-gray-900 dark:text-white">
            {LEVEL_CONFIG[activeLevel].emoji} {LEVEL_CONFIG[activeLevel].label}的工具
          </h4>
          <div className="space-y-2">
            {PERMISSION_EXAMPLES.filter((r) => r.level === activeLevel).map((rule) => (
              <div
                key={`${rule.tool}-${rule.command ?? ""}`}
                className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-700/50"
              >
                <div className="flex items-center gap-3">
                  <code className="rounded bg-gray-200 px-2 py-0.5 text-sm font-mono dark:bg-gray-600">
                    {rule.tool}
                    {rule.command ? `(${rule.command})` : ""}
                  </code>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {rule.reason}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 3. 工具執行流程互動示範
// ============================================================================

interface ExecutionStep {
  phase: "request" | "permission" | "execute" | "result";
  title: string;
  description: string;
  code: string;
}

const EXECUTION_FLOW: ExecutionStep[] = [
  {
    phase: "request",
    title: "Claude 請求使用工具",
    description: "Claude 分析任務後，決定需要呼叫哪個工具，並指定輸入參數。",
    code: `# Claude 的工具呼叫請求
{
    "type": "tool_use",
    "id": "toolu_01abc123",
    "name": "bash",
    "input": {
        "command": "pytest tests/test_health.py -v",
        "description": "執行健康檢查 API 的測試"
    }
}`,
  },
  {
    phase: "permission",
    title: "權限檢查",
    description: "系統檢查這個工具呼叫是否被允許。Bash 指令會比對 allow/deny 清單。",
    code: `# 權限檢查邏輯
def check_permission(tool_name: str, tool_input: dict) -> bool:
    # 1. 是否在 deny 清單中？
    if matches_deny_list(tool_name, tool_input):
        return False  # 直接拒絕

    # 2. 是否在 allow 清單中？
    if matches_allow_list(tool_name, tool_input):
        return True   # 自動允許

    # 3. 都不在 → 詢問使用者
    return ask_user_permission(tool_name, tool_input)`,
  },
  {
    phase: "execute",
    title: "執行工具",
    description: "權限通過後，系統執行工具並收集輸出結果。",
    code: `# 工具執行
import subprocess

def execute_bash(command: str, timeout: int = 120) -> dict:
    try:
        result = subprocess.run(
            command, shell=True,
            capture_output=True, text=True,
            timeout=timeout
        )
        return {
            "output": result.stdout,
            "exit_code": result.returncode,
            "is_error": result.returncode != 0
        }
    except subprocess.TimeoutExpired:
        return {
            "output": f"指令逾時（{timeout}秒）",
            "is_error": True
        }`,
  },
  {
    phase: "result",
    title: "結果回饋 → 繼續迴圈",
    description: "工具結果被格式化為 tool_result 訊息，送回 Claude 進行下一輪推理。",
    code: `# 工具結果訊息格式
tool_result = {
    "type": "tool_result",
    "tool_use_id": "toolu_01abc123",
    "content": """
tests/test_health.py::test_health_endpoint PASSED
tests/test_health.py::test_health_response PASSED

2 passed in 0.15s
""",
    "is_error": False
}

# 這個結果會被加入對話歷史
# Claude 看到測試通過 → 判定任務完成
# → stop_reason = "end_turn" → 迴圈結束`,
  },
];

const PHASE_STYLES = {
  request: { emoji: "📤", color: "border-blue-400 bg-blue-50 dark:bg-blue-900/20" },
  permission: { emoji: "🔐", color: "border-amber-400 bg-amber-50 dark:bg-amber-900/20" },
  execute: { emoji: "⚡", color: "border-green-400 bg-green-50 dark:bg-green-900/20" },
  result: { emoji: "📥", color: "border-purple-400 bg-purple-50 dark:bg-purple-900/20" },
} as const;

export function ToolExecutionFlow() {
  const [currentPhase, setCurrentPhase] = useState(0);
  const step = EXECUTION_FLOW[currentPhase];
  const style = PHASE_STYLES[step.phase];

  return (
    <div className="my-8">
      {/* 進度指示器 */}
      <div className="mb-6 flex items-center justify-between">
        {EXECUTION_FLOW.map((s, i) => {
          const st = PHASE_STYLES[s.phase];
          return (
            <div key={s.phase} className="flex items-center">
              <button
                type="button"
                onClick={() => setCurrentPhase(i)}
                className={`flex h-12 w-12 items-center justify-center rounded-full text-xl transition-all ${
                  i === currentPhase
                    ? "scale-110 bg-claude-orange text-white shadow-lg ring-4 ring-claude-orange/20"
                    : i < currentPhase
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-500 dark:bg-gray-700"
                }`}
              >
                {i < currentPhase ? "✓" : st.emoji}
              </button>
              {i < EXECUTION_FLOW.length - 1 && (
                <div
                  className={`mx-2 h-0.5 w-8 sm:w-16 ${
                    i < currentPhase ? "bg-green-400" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* 步驟內容 */}
      <div className={`rounded-2xl border-2 p-6 ${style.color}`}>
        <div className="mb-3 flex items-center gap-3">
          <span className="text-2xl">{style.emoji}</span>
          <h4 className="text-lg font-bold text-gray-900 dark:text-white">
            {step.title}
          </h4>
        </div>
        <p className="mb-4 text-gray-700 dark:text-gray-300">
          {step.description}
        </p>

        {/* Python 程式碼 */}
        <div className="rounded-lg bg-gray-900 text-sm">
          <div className="flex items-center border-b border-gray-700 px-4 py-2">
            <span className="rounded bg-blue-600/20 px-2 py-0.5 text-[10px] font-medium text-blue-400">
              Python
            </span>
          </div>
          <pre className="overflow-x-auto p-4 text-gray-300">
            <code>{step.code}</code>
          </pre>
        </div>

        {/* 導航 */}
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCurrentPhase((p) => p - 1)}
            disabled={currentPhase === 0}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              currentPhase === 0
                ? "cursor-not-allowed text-gray-300 dark:text-gray-600"
                : "text-gray-600 hover:bg-white/50 dark:text-gray-400"
            }`}
          >
            ← 上一步
          </button>
          <span className="text-sm text-gray-400">
            {currentPhase + 1} / {EXECUTION_FLOW.length}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPhase((p) => p + 1)}
            disabled={currentPhase === EXECUTION_FLOW.length - 1}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              currentPhase === EXECUTION_FLOW.length - 1
                ? "cursor-not-allowed text-gray-300 dark:text-gray-600"
                : "bg-claude-orange text-white hover:bg-claude-orange/90"
            }`}
          >
            {currentPhase === EXECUTION_FLOW.length - 1 ? "已完成" : "下一步 →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 4. 權限配置建構器 — 互動式拖拉配置
// ============================================================================

interface ConfigItem {
  id: string;
  label: string;
  level: "allow" | "ask" | "deny";
}

const INITIAL_CONFIG: ConfigItem[] = [
  { id: "read", label: "Read", level: "allow" },
  { id: "glob", label: "Glob", level: "allow" },
  { id: "grep", label: "Grep", level: "allow" },
  { id: "bash-test", label: "Bash(pytest)", level: "allow" },
  { id: "bash-git-status", label: "Bash(git status)", level: "allow" },
  { id: "edit", label: "Edit", level: "ask" },
  { id: "write", label: "Write", level: "ask" },
  { id: "bash-install", label: "Bash(pip install)", level: "ask" },
  { id: "bash-rm", label: "Bash(rm -rf)", level: "deny" },
  { id: "bash-force-push", label: "Bash(git push -f)", level: "deny" },
];

export function PermissionConfigBuilder() {
  const [items, setItems] = useState<ConfigItem[]>(INITIAL_CONFIG);

  function cycleLevel(id: string) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const next = item.level === "allow" ? "ask" : item.level === "ask" ? "deny" : "allow";
        return { ...item, level: next };
      })
    );
  }

  const allowItems = items.filter((i) => i.level === "allow");
  const askItems = items.filter((i) => i.level === "ask");
  const denyItems = items.filter((i) => i.level === "deny");

  const configJson = JSON.stringify(
    {
      permissions: {
        allow: allowItems.map((i) => i.label),
        deny: denyItems.map((i) => i.label),
      },
    },
    null,
    2
  );

  return (
    <div className="my-8">
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        點擊每個工具的權限標籤來切換層級（🟢 → 🟡 → 🔴），右側即時預覽設定檔：
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        {/* 左側：權限選擇 */}
        <div className="space-y-3">
          {items.map((item) => {
            const config = LEVEL_CONFIG[item.level];
            return (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
              >
                <code className="font-mono text-sm text-gray-900 dark:text-white">
                  {item.label}
                </code>
                <button
                  type="button"
                  onClick={() => cycleLevel(item.id)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${config.badge} hover:scale-105`}
                >
                  {config.emoji} {config.label}
                </button>
              </div>
            );
          })}
        </div>

        {/* 右側：即時預覽 JSON */}
        <div className="rounded-lg bg-gray-900 text-sm">
          <div className="flex items-center justify-between border-b border-gray-700 px-4 py-2">
            <span className="font-mono text-xs text-gray-400">
              .claude/settings.json
            </span>
            <span className="rounded bg-green-600/20 px-2 py-0.5 text-[10px] font-medium text-green-400">
              即時預覽
            </span>
          </div>
          <pre className="overflow-x-auto p-4 text-green-400">
            <code>{configJson}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
