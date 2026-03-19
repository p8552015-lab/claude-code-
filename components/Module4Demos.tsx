"use client";

import { useState } from "react";

// ============================================================================
// S19 Multi CLI — 多實例終端機視覺化
// ============================================================================

interface TerminalInstance {
  id: string;
  label: string;
  role: string;
  color: string;
  borderColor: string;
  tasks: string[];
  config: string;
}

const TERMINAL_INSTANCES: TerminalInstance[] = [
  {
    id: "frontend",
    label: "Terminal 1",
    role: "前端開發",
    color: "bg-blue-500/10 dark:bg-blue-500/20",
    borderColor: "border-blue-500",
    tasks: [
      "修改 React 元件樣式",
      "新增頁面路由",
      "處理表單驗證邏輯",
    ],
    config: `# claude_frontend.yaml
instance:
  name: "frontend-agent"
  worktree: "feature/ui-redesign"
  focus:
    - "src/components/**"
    - "src/pages/**"
  constraints:
    - "不修改 API 層程式碼"
    - "所有樣式使用 Tailwind"`,
  },
  {
    id: "backend",
    label: "Terminal 2",
    role: "後端 API",
    color: "bg-green-500/10 dark:bg-green-500/20",
    borderColor: "border-green-500",
    tasks: [
      "實作 REST API endpoint",
      "設計資料庫 schema",
      "撰寫 middleware 邏輯",
    ],
    config: `# claude_backend.yaml
instance:
  name: "backend-agent"
  worktree: "feature/api-v2"
  focus:
    - "src/api/**"
    - "src/models/**"
  constraints:
    - "不修改前端程式碼"
    - "所有 API 需寫 OpenAPI doc"`,
  },
  {
    id: "testing",
    label: "Terminal 3",
    role: "測試撰寫",
    color: "bg-amber-500/10 dark:bg-amber-500/20",
    borderColor: "border-amber-500",
    tasks: [
      "針對新 API 撰寫整合測試",
      "補足單元測試覆蓋率",
      "執行 E2E 回歸測試",
    ],
    config: `# claude_testing.yaml
instance:
  name: "testing-agent"
  worktree: "feature/test-coverage"
  focus:
    - "tests/**"
    - "e2e/**"
  constraints:
    - "只寫測試，不改產品程式碼"
    - "測試覆蓋率目標 > 80%"`,
  },
];

export function MultiCliDemo() {
  const [activeTerminal, setActiveTerminal] = useState<string | null>(null);
  const active = TERMINAL_INSTANCES.find((t) => t.id === activeTerminal);

  return (
    <div className="my-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {TERMINAL_INSTANCES.map((term) => {
          const isActive = activeTerminal === term.id;
          return (
            <button
              key={term.id}
              type="button"
              onClick={() => setActiveTerminal(isActive ? null : term.id)}
              className={`cursor-pointer rounded-xl border-2 p-4 text-left transition-all duration-200 select-none ${
                isActive
                  ? `${term.borderColor} ${term.color} shadow-lg`
                  : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600"
              }`}
            >
              <div className="mb-2 flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${term.borderColor.replace("border-", "bg-")}`} />
                <span className="text-sm font-bold text-gray-600 dark:text-gray-400">
                  {term.label}
                </span>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {term.role}
              </p>
              <ul className="mt-2 space-y-1">
                {term.tasks.map((task) => (
                  <li key={task} className="text-sm text-gray-600 dark:text-gray-400">
                    {task}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {active && (
        <div className="mt-4 rounded-xl border-2 border-claude-orange/30 bg-claude-orange/5 p-5 dark:bg-claude-orange/10">
          <p className="mb-2 text-sm font-semibold text-claude-orange">
            {active.role} 配置範例
          </p>
          <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-200">
            <code>{active.config}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// S20 Error Recovery — 錯誤處理流程步驟器
// ============================================================================

interface ErrorFlowStep {
  id: number;
  title: string;
  description: string;
  pythonCode: string;
}

const ERROR_FLOW_STEPS: ErrorFlowStep[] = [
  {
    id: 1,
    title: "偵測錯誤",
    description:
      "代理執行工具時收到錯誤回傳。系統立即捕獲異常，記錄錯誤的完整上下文（時間、工具名稱、輸入參數、錯誤訊息）。",
    pythonCode: `# 步驟 1：偵測錯誤
def execute_tool_safely(tool_name: str, params: dict) -> dict:
    """安全執行工具，捕獲所有異常"""
    try:
        result = tool_registry[tool_name].execute(**params)
        return {"status": "success", "data": result}
    except Exception as e:
        return {
            "status": "error",
            "error_type": type(e).__name__,
            "message": str(e),
            "tool": tool_name,
            "params": params,
        }`,
  },
  {
    id: 2,
    title: "分類錯誤",
    description:
      "根據錯誤類型進行分類，判斷是暫時性錯誤（可重試）還是永久性錯誤（需要人工介入或策略調整）。",
    pythonCode: `# 步驟 2：分類錯誤
def classify_error(error: dict) -> str:
    """將錯誤分類為可重試或需介入"""
    transient_errors = {"timeout", "rate_limit", "connection_error"}
    permanent_errors = {"permission_denied", "not_found", "invalid_input"}

    error_type = error["error_type"].lower()

    if error_type in transient_errors:
        return "retryable"
    elif error_type in permanent_errors:
        return "needs_intervention"
    else:
        return "unknown"  # 未知錯誤一律上報`,
  },
  {
    id: 3,
    title: "執行處理策略",
    description:
      "可重試的錯誤使用指數退避重試；永久性錯誤向使用者明確通報問題，提供可行的替代方案。",
    pythonCode: `# 步驟 3：執行處理策略
import time

def handle_error(error: dict, classification: str) -> dict:
    """根據分類執行對應處理策略"""
    if classification == "retryable":
        max_retries = 3
        for attempt in range(max_retries):
            wait_time = 2 ** attempt  # 指數退避
            time.sleep(wait_time)
            result = execute_tool_safely(
                error["tool"], error["params"]
            )
            if result["status"] == "success":
                return result
        # 重試全部失敗，轉為需介入
        classification = "needs_intervention"

    # 永久性錯誤：明確通報
    return {
        "status": "failed",
        "report": f"工具 {error['tool']} 執行失敗: "
                  f"{error['message']}",
        "suggestion": generate_alternative(error),
    }`,
  },
  {
    id: 4,
    title: "恢復與繼續",
    description:
      "錯誤處理完成後，代理回到正常工作流。如果錯誤被成功修復，繼續執行；否則記錄失敗並通知使用者。",
    pythonCode: `# 步驟 4：恢復與繼續
def recovery_workflow(agent_state: dict, error: dict) -> dict:
    """錯誤處理後恢復工作流"""
    classification = classify_error(error)
    result = handle_error(error, classification)

    if result["status"] == "success":
        # 成功恢復，更新狀態繼續執行
        agent_state["last_result"] = result["data"]
        agent_state["error_count"] = 0
        return {"action": "continue", "state": agent_state}
    else:
        # 無法恢復，通報使用者
        agent_state["error_count"] += 1
        return {
            "action": "report_to_user",
            "state": agent_state,
            "report": result["report"],
            "suggestion": result.get("suggestion"),
        }`,
  },
];

export function ErrorFlowDemo() {
  const [currentStep, setCurrentStep] = useState(0);
  const step = ERROR_FLOW_STEPS[currentStep];

  return (
    <div className="my-8">
      {/* 步驟指示器 */}
      <div className="mb-6 flex items-center justify-between">
        {ERROR_FLOW_STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <button
              type="button"
              onClick={() => setCurrentStep(i)}
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all cursor-pointer ${
                i === currentStep
                  ? "bg-claude-orange text-white shadow-lg"
                  : i < currentStep
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
              }`}
            >
              {i < currentStep ? "\u2713" : s.id}
            </button>
            {i < ERROR_FLOW_STEPS.length - 1 && (
              <div
                className={`mx-2 h-1 w-8 rounded sm:w-12 md:w-16 ${
                  i < currentStep
                    ? "bg-green-500"
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* 步驟內容 */}
      <div className="rounded-xl border-2 border-claude-orange/30 bg-white p-6 dark:bg-gray-900">
        <h3 className="mb-2 text-xl font-bold text-claude-orange">
          Step {step.id}: {step.title}
        </h3>
        <p className="mb-4 text-gray-700 dark:text-gray-300">
          {step.description}
        </p>
        <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-200">
          <code>{step.pythonCode}</code>
        </pre>
      </div>

      {/* 導航按鈕 */}
      <div className="mt-4 flex justify-between">
        <button
          type="button"
          onClick={() => setCurrentStep((p) => Math.max(0, p - 1))}
          disabled={currentStep === 0}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-600 dark:hover:bg-gray-800 cursor-pointer"
        >
          上一步
        </button>
        <button
          type="button"
          onClick={() =>
            setCurrentStep((p) => Math.min(ERROR_FLOW_STEPS.length - 1, p + 1))
          }
          disabled={currentStep === ERROR_FLOW_STEPS.length - 1}
          className="rounded-lg bg-claude-orange px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-claude-orange/90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          下一步
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// S20 Error Recovery — 錯誤類型卡片
// ============================================================================

interface ErrorTypeInfo {
  id: string;
  name: string;
  label: string;
  icon: string;
  description: string;
  strategy: string;
  pythonHint: string;
}

const ERROR_TYPES: ErrorTypeInfo[] = [
  {
    id: "tool_failed",
    name: "tool_failed",
    label: "工具執行失敗",
    icon: "\u2699\uFE0F",
    description: "Bash 指令回傳非零退出碼，或工具內部拋出異常。",
    strategy: "檢查指令語法和參數，分析 stderr 輸出，嘗試修正後重新執行。",
    pythonHint: 'if result["exit_code"] != 0: analyze_stderr(result["stderr"])',
  },
  {
    id: "permission_denied",
    name: "permission_denied",
    label: "權限不足",
    icon: "\uD83D\uDD12",
    description: "代理嘗試執行受限操作（如寫入受保護檔案、執行危險指令）被系統拒絕。",
    strategy: "向使用者請求授權，或改用不需要高權限的替代方案。",
    pythonHint: 'raise PermissionError(f"需要使用者授權: {action}")',
  },
  {
    id: "not_found",
    name: "not_found",
    label: "資源不存在",
    icon: "\uD83D\uDD0D",
    description: "嘗試讀取的檔案、目錄或符號（function/class）不存在。",
    strategy: "使用 Glob 或 Grep 搜尋正確路徑，或確認資源是否需要先建立。",
    pythonHint: 'if not Path(file_path).exists(): search_alternative(file_path)',
  },
  {
    id: "timeout",
    name: "timeout",
    label: "操作逾時",
    icon: "\u23F1\uFE0F",
    description: "工具執行時間超過上限（預設 120 秒），被系統強制中斷。",
    strategy: "將大任務拆分為小步驟，或增加 timeout 設定。避免無限迴圈。",
    pythonHint: 'subprocess.run(cmd, timeout=120, check=True)',
  },
  {
    id: "rate_limit",
    name: "rate_limit",
    label: "API 速率限制",
    icon: "\uD83D\uDEA6",
    description: "API 呼叫頻率超過限制，收到 429 狀態碼。",
    strategy: "實施指數退避等待，或減少不必要的 API 呼叫次數。",
    pythonHint: 'time.sleep(2 ** retry_count)  # 指數退避',
  },
  {
    id: "context_overflow",
    name: "context_overflow",
    label: "上下文溢出",
    icon: "\uD83D\uDCDA",
    description: "對話歷史的 token 總量超過模型上下文窗口限制。",
    strategy: "觸發上下文壓縮，移除舊的工具結果，或開啟新對話。",
    pythonHint: 'if total_tokens > MAX_CONTEXT: compact_history(messages)',
  },
];

export function ErrorTypeCards() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="my-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {ERROR_TYPES.map((err) => {
        const isExpanded = expandedId === err.id;
        return (
          <button
            key={err.id}
            type="button"
            onClick={() => setExpandedId(isExpanded ? null : err.id)}
            className={`cursor-pointer rounded-xl border-2 p-4 text-left transition-all duration-200 select-none ${
              isExpanded
                ? "border-claude-orange bg-claude-orange/5 shadow-lg dark:bg-claude-orange/10"
                : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600"
            }`}
          >
            <div className="mb-1 text-2xl">{err.icon}</div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {err.label}
            </p>
            <p className="mt-1 text-xs font-mono text-gray-500 dark:text-gray-400">
              {err.name}
            </p>
            {isExpanded && (
              <div className="mt-3 space-y-2 border-t border-gray-200 pt-3 dark:border-gray-700">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {err.description}
                </p>
                <p className="text-sm font-medium text-claude-orange">
                  處理策略：
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {err.strategy}
                </p>
                <pre className="mt-2 overflow-x-auto rounded bg-gray-900 p-2 text-xs text-green-400">
                  <code>{err.pythonHint}</code>
                </pre>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// S21 Cost Optimization — 成本計算器
// ============================================================================

const PRICING = {
  input: 3.0, // 每百萬 token
  output: 15.0, // 每百萬 token
  cachedInput: 0.3, // 每百萬 token（快取命中）
};

export function CostCalculatorDemo() {
  const [inputTokens, setInputTokens] = useState(50000);
  const [outputTokens, setOutputTokens] = useState(10000);
  const [cachedTokens, setCachedTokens] = useState(30000);

  const nonCachedInput = Math.max(0, inputTokens - cachedTokens);
  const costInput = (nonCachedInput / 1_000_000) * PRICING.input;
  const costCached = (cachedTokens / 1_000_000) * PRICING.cachedInput;
  const costOutput = (outputTokens / 1_000_000) * PRICING.output;
  const totalCost = costInput + costCached + costOutput;
  const costWithoutCache =
    (inputTokens / 1_000_000) * PRICING.input + costOutput;
  const savings = costWithoutCache - totalCost;

  return (
    <div className="my-8 rounded-xl border-2 border-claude-orange/30 bg-white p-6 dark:bg-gray-900">
      <h3 className="mb-4 text-lg font-bold text-claude-orange">
        Claude Sonnet 成本計算器
      </h3>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            輸入 Token 總量
          </label>
          <input
            type="range"
            min={0}
            max={200000}
            step={1000}
            value={inputTokens}
            onChange={(e) => {
              const val = Number(e.target.value);
              setInputTokens(val);
              if (cachedTokens > val) setCachedTokens(val);
            }}
            className="w-full accent-claude-orange"
          />
          <p className="mt-1 text-sm font-mono text-gray-600 dark:text-gray-400">
            {inputTokens.toLocaleString()}
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            輸出 Token
          </label>
          <input
            type="range"
            min={0}
            max={100000}
            step={1000}
            value={outputTokens}
            onChange={(e) => setOutputTokens(Number(e.target.value))}
            className="w-full accent-claude-orange"
          />
          <p className="mt-1 text-sm font-mono text-gray-600 dark:text-gray-400">
            {outputTokens.toLocaleString()}
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            快取命中 Token
          </label>
          <input
            type="range"
            min={0}
            max={inputTokens}
            step={1000}
            value={cachedTokens}
            onChange={(e) => setCachedTokens(Number(e.target.value))}
            className="w-full accent-claude-orange"
          />
          <p className="mt-1 text-sm font-mono text-gray-600 dark:text-gray-400">
            {cachedTokens.toLocaleString()}
          </p>
        </div>
      </div>

      {/* 結果面板 */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950/30">
          <p className="text-xs text-blue-600 dark:text-blue-400">輸入費用</p>
          <p className="text-lg font-bold text-blue-800 dark:text-blue-200">
            ${costInput.toFixed(4)}
          </p>
        </div>
        <div className="rounded-lg bg-green-50 p-3 dark:bg-green-950/30">
          <p className="text-xs text-green-600 dark:text-green-400">快取費用</p>
          <p className="text-lg font-bold text-green-800 dark:text-green-200">
            ${costCached.toFixed(4)}
          </p>
        </div>
        <div className="rounded-lg bg-purple-50 p-3 dark:bg-purple-950/30">
          <p className="text-xs text-purple-600 dark:text-purple-400">
            輸出費用
          </p>
          <p className="text-lg font-bold text-purple-800 dark:text-purple-200">
            ${costOutput.toFixed(4)}
          </p>
        </div>
        <div className="rounded-lg bg-claude-orange/10 p-3">
          <p className="text-xs text-claude-orange">總費用</p>
          <p className="text-lg font-bold text-claude-orange">
            ${totalCost.toFixed(4)}
          </p>
        </div>
      </div>

      {savings > 0 && (
        <p className="mt-3 text-sm text-green-600 dark:text-green-400">
          快取為你省下 ${savings.toFixed(4)}（省{" "}
          {((savings / costWithoutCache) * 100).toFixed(1)}%）
        </p>
      )}
    </div>
  );
}

// ============================================================================
// S21 Cost Optimization — 優化策略卡片
// ============================================================================

interface OptimizationStrategy {
  id: string;
  title: string;
  icon: string;
  summary: string;
  detail: string;
  pythonCode: string;
}

const OPTIMIZATION_STRATEGIES: OptimizationStrategy[] = [
  {
    id: "cache",
    title: "Prompt 快取",
    icon: "\uD83D\uDCBE",
    summary: "重複的 system prompt 和大段指令只計費一次",
    detail:
      "當 system prompt 超過 1024 token 時，Claude API 會自動啟用快取。後續請求中相同的前綴部分只需支付 10% 的費用。",
    pythonCode: `# 啟用 prompt 快取（自動生效）
import anthropic

client = anthropic.Anthropic()

# system prompt 超過 1024 token 會自動快取
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    system=[{
        "type": "text",
        "text": long_system_prompt,  # 大型指令會被快取
        "cache_control": {"type": "ephemeral"}
    }],
    messages=[{"role": "user", "content": query}]
)
# 檢查快取命中
usage = response.usage
print(f"快取命中: {usage.cache_read_input_tokens}")
print(f"快取寫入: {usage.cache_creation_input_tokens}")`,
  },
  {
    id: "subagent",
    title: "子代理分流",
    icon: "\uD83E\uDD16",
    summary: "簡單任務交給輕量子代理，避免主代理上下文膨脹",
    detail:
      "使用子代理處理獨立子任務，每個子代理有獨立的上下文窗口。主代理只保留摘要結果，大幅減少 token 累積。",
    pythonCode: `# 使用子代理降低主代理 token 消耗
def delegate_to_subagent(task: str) -> str:
    """將獨立任務委派給子代理"""
    sub_response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        system="你是一個專注的子代理。完成任務後只回傳結果摘要。",
        messages=[{"role": "user", "content": task}]
    )
    # 只將摘要回傳主代理，不帶完整上下文
    return extract_summary(sub_response)

# 主代理只接收精簡的結果
summary = delegate_to_subagent("分析 tests/ 目錄下所有失敗的測試")`,
  },
  {
    id: "compact",
    title: "精簡提示語",
    icon: "\u2702\uFE0F",
    summary: "去除冗餘指令，用結構化格式取代自然語言",
    detail:
      "過於冗長的提示語不但浪費 token，還可能讓模型迷失重點。使用 YAML/JSON 結構化指令，比純文字節省 30-50% 的 token。",
    pythonCode: `# 結構化提示語 vs 冗長自然語言

# 差的做法（浪費 token）：
bad_prompt = """
請你幫我看一下這個專案的程式碼，然後找出所有的
bug，把每個 bug 的位置和原因都詳細說明，最後
提供修復建議。記得要檢查所有檔案...
"""

# 好的做法（精簡且結構化）：
good_prompt = """
任務: 程式碼審查
範圍: src/**/*.py
輸出格式:
  - 檔案路徑
  - 行號
  - 問題描述
  - 修復建議
"""`,
  },
  {
    id: "segment",
    title: "任務分段",
    icon: "\uD83D\uDCC8",
    summary: "大任務拆成多輪小對話，避免上下文爆炸",
    detail:
      "一個超長對話的 token 消耗是指數增長的。將大任務拆分成數輪獨立對話，每輪只處理一個子任務，總成本遠低於單一長對話。",
    pythonCode: `# 任務分段策略
def segmented_workflow(tasks: list[str]) -> list[dict]:
    """將大任務拆分為獨立的小對話"""
    results = []
    for task in tasks:
        # 每個子任務用獨立的對話
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2048,
            messages=[{
                "role": "user",
                "content": task
            }]
        )
        results.append({
            "task": task,
            "result": response.content[0].text,
            "tokens_used": response.usage.input_tokens
                         + response.usage.output_tokens,
        })
    return results

# 拆分大任務
subtasks = [
    "審查 src/auth/ 目錄的安全性",
    "檢查 src/api/ 的錯誤處理",
    "驗證 src/models/ 的型別定義",
]
results = segmented_workflow(subtasks)`,
  },
];

export function OptimizationCards() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="my-8 grid grid-cols-1 gap-4 md:grid-cols-2">
      {OPTIMIZATION_STRATEGIES.map((strategy) => {
        const isExpanded = expandedId === strategy.id;
        return (
          <button
            key={strategy.id}
            type="button"
            onClick={() => setExpandedId(isExpanded ? null : strategy.id)}
            className={`cursor-pointer rounded-xl border-2 p-5 text-left transition-all duration-200 select-none ${
              isExpanded
                ? "border-claude-orange bg-claude-orange/5 shadow-lg dark:bg-claude-orange/10"
                : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{strategy.icon}</span>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">
                  {strategy.title}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {strategy.summary}
                </p>
              </div>
            </div>
            {isExpanded && (
              <div className="mt-4 space-y-3 border-t border-gray-200 pt-4 dark:border-gray-700">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {strategy.detail}
                </p>
                <pre className="overflow-x-auto rounded-lg bg-gray-900 p-3 text-xs text-gray-200">
                  <code>{strategy.pythonCode}</code>
                </pre>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// S22 Human-in-the-Loop — 檢查點設計器
// ============================================================================

type CoopMode = "auto" | "confirm" | "pause";

interface WorkflowStep {
  id: number;
  label: string;
  description: string;
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  { id: 1, label: "讀取需求文件", description: "代理讀取 PRD 或 Issue 描述" },
  { id: 2, label: "分析程式碼庫", description: "掃描相關檔案，理解現有架構" },
  { id: 3, label: "產生實作計畫", description: "規劃修改哪些檔案、如何修改" },
  { id: 4, label: "寫程式碼", description: "根據計畫修改或新增程式碼" },
  { id: 5, label: "執行測試 & 提交", description: "跑測試、建立 commit、發 PR" },
];

const MODE_CONFIG: Record<CoopMode, { label: string; color: string; bgColor: string; description: string }> = {
  auto: {
    label: "自動",
    color: "text-green-700 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/40",
    description: "代理完全自動執行，不需人類介入",
  },
  confirm: {
    label: "確認",
    color: "text-amber-700 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/40",
    description: "代理執行前先展示計畫，等待人類確認",
  },
  pause: {
    label: "暫停",
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/40",
    description: "代理完全暫停，等待人類手動操作或指示",
  },
};

export function CheckpointDesignDemo() {
  const [modes, setModes] = useState<Record<number, CoopMode>>({
    1: "auto",
    2: "auto",
    3: "confirm",
    4: "auto",
    5: "confirm",
  });

  const cycleMode = (stepId: number) => {
    const order: CoopMode[] = ["auto", "confirm", "pause"];
    const current = modes[stepId] ?? "auto";
    const nextIndex = (order.indexOf(current) + 1) % order.length;
    setModes((prev) => ({ ...prev, [stepId]: order[nextIndex] }));
  };

  return (
    <div className="my-8">
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        點擊每個步驟的模式按鈕，切換人機協作模式：
      </p>
      <div className="space-y-3">
        {WORKFLOW_STEPS.map((step) => {
          const mode = modes[step.id] ?? "auto";
          const config = MODE_CONFIG[mode];
          return (
            <div
              key={step.id}
              className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-claude-orange/10 text-sm font-bold text-claude-orange">
                {step.id}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {step.label}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {step.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => cycleMode(step.id)}
                className={`shrink-0 cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${config.bgColor} ${config.color}`}
              >
                {config.label}
              </button>
            </div>
          );
        })}
      </div>

      {/* 模式說明 */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {(Object.entries(MODE_CONFIG) as [CoopMode, typeof MODE_CONFIG.auto][]).map(
          ([key, val]) => (
            <div key={key} className={`rounded-lg p-2 text-center ${val.bgColor}`}>
              <p className={`text-sm font-medium ${val.color}`}>{val.label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {val.description}
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ============================================================================
// S22 Human-in-the-Loop — 回饋循環圖
// ============================================================================

interface FeedbackNode {
  id: string;
  label: string;
  description: string;
  color: string;
}

const FEEDBACK_NODES: FeedbackNode[] = [
  {
    id: "agent_work",
    label: "代理執行",
    description: "代理根據指令和上下文自動執行任務，產生初步結果。",
    color: "bg-blue-500",
  },
  {
    id: "checkpoint",
    label: "檢查點",
    description: "到達預設的檢查點，代理暫停並展示中間結果給人類審查。",
    color: "bg-amber-500",
  },
  {
    id: "human_review",
    label: "人類審查",
    description: "人類檢視代理的產出，判斷是否符合預期，提供回饋或修正意見。",
    color: "bg-purple-500",
  },
  {
    id: "feedback",
    label: "回饋注入",
    description: "將人類的回饋寫回 CLAUDE.md 或對話歷史，讓代理在後續迭代中學習。",
    color: "bg-green-500",
  },
];

export function FeedbackLoopDemo() {
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const active = FEEDBACK_NODES.find((n) => n.id === activeNode);

  return (
    <div className="my-8">
      <div className="flex items-center justify-center gap-2">
        {FEEDBACK_NODES.map((node, i) => (
          <div key={node.id} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveNode(activeNode === node.id ? null : node.id)}
              className={`cursor-pointer rounded-xl border-2 px-4 py-3 text-center text-sm font-medium transition-all select-none ${
                activeNode === node.id
                  ? `border-claude-orange ${node.color}/10 shadow-lg text-gray-900 dark:text-white`
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-gray-600"
              }`}
            >
              {node.label}
            </button>
            {i < FEEDBACK_NODES.length - 1 && (
              <span className="text-gray-400 dark:text-gray-600">{"\u2192"}</span>
            )}
          </div>
        ))}
        <span className="text-gray-400 dark:text-gray-600">{"\u21BA"}</span>
      </div>

      {active && (
        <div className="mt-4 rounded-xl border-2 border-claude-orange/30 bg-claude-orange/5 p-4 dark:bg-claude-orange/10">
          <p className="font-semibold text-claude-orange">{active.label}</p>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
            {active.description}
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// S23 Custom Agents — 代理建構器
// ============================================================================

interface AgentOption {
  id: string;
  label: string;
  category: "role" | "tool" | "constraint";
}

const AGENT_OPTIONS: AgentOption[] = [
  // 職責
  { id: "code_review", label: "程式碼審查", category: "role" },
  { id: "db_migration", label: "資料庫遷移", category: "role" },
  { id: "test_writer", label: "測試撰寫", category: "role" },
  { id: "doc_generator", label: "文件生成", category: "role" },
  { id: "security_audit", label: "安全審計", category: "role" },
  // 工具
  { id: "bash", label: "Bash", category: "tool" },
  { id: "read", label: "Read", category: "tool" },
  { id: "edit", label: "Edit", category: "tool" },
  { id: "grep", label: "Grep", category: "tool" },
  { id: "glob", label: "Glob", category: "tool" },
  // 約束
  { id: "no_prod", label: "禁止修改生產環境", category: "constraint" },
  { id: "readonly", label: "唯讀模式", category: "constraint" },
  { id: "must_test", label: "必須通過測試", category: "constraint" },
  { id: "must_review", label: "變更需人類審查", category: "constraint" },
];

function generateSkillMd(selected: Set<string>): string {
  const roles = AGENT_OPTIONS.filter(
    (o) => o.category === "role" && selected.has(o.id)
  );
  const tools = AGENT_OPTIONS.filter(
    (o) => o.category === "tool" && selected.has(o.id)
  );
  const constraints = AGENT_OPTIONS.filter(
    (o) => o.category === "constraint" && selected.has(o.id)
  );

  const roleName = roles.length > 0 ? roles[0].label : "自定義";

  return `---
description: "${roleName}代理"
command: "/${roles.length > 0 ? roles[0].id.replace("_", "-") : "custom"}"
---

# ${roleName}代理

## 職責
${roles.length > 0 ? roles.map((r) => `- ${r.label}`).join("\n") : "- （請選擇職責）"}

## 可用工具
${tools.length > 0 ? tools.map((t) => `- ${t.label}`).join("\n") : "- （請選擇工具）"}

## 約束條件
${constraints.length > 0 ? constraints.map((c) => `- ${c.label}`).join("\n") : "- （請選擇約束）"}`;
}

export function AgentBuilderDemo() {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(["code_review", "read", "grep", "must_test"])
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const categories = [
    { key: "role" as const, label: "職責", color: "border-blue-500 bg-blue-50 dark:bg-blue-950/30" },
    { key: "tool" as const, label: "工具", color: "border-green-500 bg-green-50 dark:bg-green-950/30" },
    { key: "constraint" as const, label: "約束", color: "border-red-500 bg-red-50 dark:bg-red-950/30" },
  ];

  return (
    <div className="my-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* 左側：選擇面板 */}
      <div className="space-y-4">
        {categories.map((cat) => (
          <div key={cat.key}>
            <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              {cat.label}
            </p>
            <div className="flex flex-wrap gap-2">
              {AGENT_OPTIONS.filter((o) => o.category === cat.key).map(
                (opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggle(opt.id)}
                    className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium transition-all select-none ${
                      selected.has(opt.id)
                        ? `${cat.color} border-current shadow-sm`
                        : "border-gray-300 bg-white text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {opt.label}
                  </button>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 右側：預覽 */}
      <div>
        <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
          SKILL.md 預覽
        </p>
        <pre className="overflow-x-auto rounded-xl border border-gray-700 bg-gray-900 p-4 text-sm text-gray-200">
          <code>{generateSkillMd(selected)}</code>
        </pre>
      </div>
    </div>
  );
}

// ============================================================================
// S24 Production Patterns — 上線檢查清單
// ============================================================================

interface ChecklistItem {
  id: string;
  label: string;
  category: "deploy" | "monitor" | "security" | "cicd";
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  { id: "d1", label: "容器化 Dockerfile 已建立並測試", category: "deploy" },
  { id: "d2", label: "健康檢查 endpoint 已實作", category: "deploy" },
  { id: "d3", label: "環境變數管理機制已設定", category: "deploy" },
  { id: "d4", label: "優雅關機（graceful shutdown）已處理", category: "deploy" },
  { id: "m1", label: "API 使用量監控已設定", category: "monitor" },
  { id: "m2", label: "錯誤率告警閾值已配置", category: "monitor" },
  { id: "m3", label: "成本追蹤儀表板已建立", category: "monitor" },
  { id: "m4", label: "日誌收集與查詢已就緒", category: "monitor" },
  { id: "s1", label: "API Key 使用 Secret Manager 管理", category: "security" },
  { id: "s2", label: "工具權限白名單已配置", category: "security" },
  { id: "s3", label: "輸入驗證與清理已實作", category: "security" },
  { id: "s4", label: "敏感檔案存取限制已設定", category: "security" },
  { id: "c1", label: "PR 自動審查已整合", category: "cicd" },
  { id: "c2", label: "測試覆蓋率門檻已設定", category: "cicd" },
  { id: "c3", label: "部署前驗證腳本已寫好", category: "cicd" },
  { id: "c4", label: "回滾機制已測試", category: "cicd" },
];

const CATEGORY_META: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  deploy: {
    label: "部署",
    color: "text-blue-700 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
  },
  monitor: {
    label: "監控",
    color: "text-green-700 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/30",
  },
  security: {
    label: "安全",
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/30",
  },
  cicd: {
    label: "CI/CD",
    color: "text-purple-700 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
  },
};

export function ProductionChecklistDemo() {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const total = CHECKLIST_ITEMS.length;
  const done = checked.size;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  const categoryKeys = ["deploy", "monitor", "security", "cicd"] as const;

  return (
    <div className="my-8">
      {/* 進度條 */}
      <div className="mb-6">
        <div className="mb-1 flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            上線準備度
          </span>
          <span className="font-bold text-claude-orange">
            {done}/{total} ({percent}%)
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full rounded-full bg-claude-orange transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* 分類清單 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {categoryKeys.map((cat) => {
          const meta = CATEGORY_META[cat];
          const items = CHECKLIST_ITEMS.filter((i) => i.category === cat);
          const catDone = items.filter((i) => checked.has(i.id)).length;
          return (
            <div
              key={cat}
              className={`rounded-xl border p-4 ${meta.bgColor} border-gray-200 dark:border-gray-700`}
            >
              <div className="mb-3 flex items-center justify-between">
                <p className={`font-bold ${meta.color}`}>{meta.label}</p>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {catDone}/{items.length}
                </span>
              </div>
              <div className="space-y-2">
                {items.map((item) => (
                  <label
                    key={item.id}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      checked={checked.has(item.id)}
                      onChange={() => toggle(item.id)}
                      className="h-4 w-4 rounded border-gray-300 accent-claude-orange"
                    />
                    <span
                      className={`text-sm ${
                        checked.has(item.id)
                          ? "text-gray-400 line-through dark:text-gray-500"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// S24 Production Patterns — 生產架構圖
// ============================================================================

interface ArchComponent {
  id: string;
  label: string;
  layer: "app" | "infra" | "monitor";
  description: string;
  techStack: string;
}

const ARCH_COMPONENTS: ArchComponent[] = [
  {
    id: "api_gateway",
    label: "API Gateway",
    layer: "infra",
    description: "接收外部請求，進行認證、限流和路由。是所有流量的統一入口。",
    techStack: "Nginx / Kong / AWS API Gateway",
  },
  {
    id: "agent_container",
    label: "Agent 容器",
    layer: "app",
    description: "封裝 Claude Code 代理的 Docker 容器，包含所有依賴和工具鏈。",
    techStack: "Docker + Python runtime",
  },
  {
    id: "task_queue",
    label: "任務佇列",
    layer: "infra",
    description: "接收非同步任務請求，確保高併發下的穩定處理。支援優先級排序。",
    techStack: "Redis Queue / Celery / BullMQ",
  },
  {
    id: "secret_manager",
    label: "密鑰管理",
    layer: "infra",
    description: "集中管理所有 API Key 和敏感設定，容器啟動時自動注入。",
    techStack: "AWS Secrets Manager / Vault",
  },
  {
    id: "metrics",
    label: "指標收集",
    layer: "monitor",
    description: "收集 API 使用量、回應時間、token 消耗等關鍵指標。",
    techStack: "Prometheus + Grafana",
  },
  {
    id: "alerting",
    label: "告警系統",
    layer: "monitor",
    description: "當錯誤率、成本或延遲超過閾值時，自動觸發告警通知。",
    techStack: "PagerDuty / Slack Webhook",
  },
];

const LAYER_META: Record<string, { label: string; color: string; bgColor: string }> = {
  app: {
    label: "應用層",
    color: "text-blue-700 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
  },
  infra: {
    label: "基礎設施",
    color: "text-green-700 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/30",
  },
  monitor: {
    label: "監控層",
    color: "text-amber-700 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
  },
};

export function ArchitectureDemo() {
  const [activeComponent, setActiveComponent] = useState<string | null>(null);
  const active = ARCH_COMPONENTS.find((c) => c.id === activeComponent);

  const layers = ["infra", "app", "monitor"] as const;

  return (
    <div className="my-8">
      <div className="space-y-4">
        {layers.map((layer) => {
          const meta = LAYER_META[layer];
          const components = ARCH_COMPONENTS.filter((c) => c.layer === layer);
          return (
            <div key={layer} className={`rounded-xl border p-4 ${meta.bgColor} border-gray-200 dark:border-gray-700`}>
              <p className={`mb-3 text-sm font-bold ${meta.color}`}>
                {meta.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {components.map((comp) => (
                  <button
                    key={comp.id}
                    type="button"
                    onClick={() =>
                      setActiveComponent(
                        activeComponent === comp.id ? null : comp.id
                      )
                    }
                    className={`cursor-pointer rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all select-none ${
                      activeComponent === comp.id
                        ? "border-claude-orange bg-claude-orange/10 text-claude-orange shadow"
                        : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {comp.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {active && (
        <div className="mt-4 rounded-xl border-2 border-claude-orange/30 bg-claude-orange/5 p-5 dark:bg-claude-orange/10">
          <p className="font-bold text-claude-orange">{active.label}</p>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            {active.description}
          </p>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            常用技術：{active.techStack}
          </p>
        </div>
      )}
    </div>
  );
}
