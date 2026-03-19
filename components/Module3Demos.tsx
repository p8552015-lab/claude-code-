"use client";

import { useState } from "react";

// ============================================================================
// S13: Control Protocol — ProtocolLayersDemo
// ============================================================================

interface ProtocolLayer {
  id: string;
  label: string;
  icon: string;
  summary: string;
  description: string;
  pythonExample: string;
  filename: string;
}

const PROTOCOL_LAYERS: ProtocolLayer[] = [
  {
    id: "input",
    label: "Layer 1: 輸入格式",
    icon: "1",
    summary: "定義代理接收指令的結構與驗證規則",
    description:
      "輸入層負責將使用者的自然語言指令，轉換成代理能理解的結構化格式。包含指令解析、參數萃取、型別驗證等步驟。這一層確保代理收到的每個指令都是明確且可執行的。",
    filename: "input_protocol.py",
    pythonExample: `# Layer 1: 輸入格式協議
from dataclasses import dataclass
from typing import Optional

@dataclass
class AgentInstruction:
    """代理接收的結構化指令"""
    task: str                    # 任務描述
    context: str                 # 專案上下文
    constraints: list[str]       # 約束條件
    expected_output: str         # 預期輸出格式
    max_iterations: int = 20    # 最大迭代次數

def parse_user_input(raw_input: str) -> AgentInstruction:
    """將使用者的自然語言轉換為結構化指令"""
    return AgentInstruction(
        task=raw_input,
        context="從 CLAUDE.md 載入的專案上下文",
        constraints=["不能使用 any 型別", "必須寫測試"],
        expected_output="程式碼 + 測試結果",
        max_iterations=20
    )`,
  },
  {
    id: "process",
    label: "Layer 2: 處理邏輯",
    icon: "2",
    summary: "控制代理的推理流程與決策規則",
    description:
      "處理層是控制協議的核心，決定代理如何推理、何時使用工具、如何處理錯誤。它定義了代理的決策樹：遇到不確定時問使用者、遇到錯誤時自動重試、超過上限時停止並回報。",
    filename: "process_protocol.py",
    pythonExample: `# Layer 2: 處理邏輯協議
from enum import Enum

class DecisionAction(Enum):
    EXECUTE = "execute"       # 直接執行
    ASK_USER = "ask_user"     # 詢問使用者
    RETRY = "retry"           # 自動重試
    ABORT = "abort"           # 中止並回報

class ProcessProtocol:
    """代理的處理邏輯規則"""

    def __init__(self):
        self.max_retries = 3
        self.dangerous_patterns = [
            "rm -rf", "DROP TABLE", "force push"
        ]

    def evaluate_action(self, tool_name: str,
                        tool_input: dict) -> DecisionAction:
        """評估工具呼叫的風險等級，決定下一步"""
        command = tool_input.get("command", "")

        # 危險指令 → 必須問使用者
        if any(p in command for p in self.dangerous_patterns):
            return DecisionAction.ASK_USER

        # 寫入操作 → 需要確認
        if tool_name in ("Write", "Edit", "Bash"):
            return DecisionAction.ASK_USER

        # 唯讀操作 → 自動執行
        return DecisionAction.EXECUTE`,
  },
  {
    id: "output",
    label: "Layer 3: 輸出規範",
    icon: "3",
    summary: "規範代理回應的格式與品質標準",
    description:
      "輸出層確保代理的每次回應都符合品質標準。包含回應格式化、結果驗證、審計日誌記錄等。好的輸出規範讓代理的行為可預測、可追溯、可審計。",
    filename: "output_protocol.py",
    pythonExample: `# Layer 3: 輸出規範協議
from dataclasses import dataclass, field
from datetime import datetime

@dataclass
class AgentResponse:
    """代理的結構化回應"""
    summary: str              # 執行摘要
    actions_taken: list[str]  # 執行的操作列表
    files_modified: list[str] # 修改的檔案列表
    confidence: float         # 信心指數 (0-1)
    audit_log: list[dict] = field(default_factory=list)

    def add_audit_entry(self, action: str, result: str):
        """記錄審計日誌"""
        self.audit_log.append({
            "timestamp": datetime.now().isoformat(),
            "action": action,
            "result": result
        })

# 使用範例
response = AgentResponse(
    summary="已在 maia_router.py 新增 /health endpoint",
    actions_taken=["讀取檔案", "新增函式", "執行測試"],
    files_modified=["app/maia_router.py", "tests/test_health.py"],
    confidence=0.95
)`,
  },
];

export function ProtocolLayersDemo() {
  const [activeLayer, setActiveLayer] = useState<string | null>(null);

  return (
    <div className="my-8">
      {/* 三層堆疊視圖 */}
      <div className="flex flex-col gap-2">
        {PROTOCOL_LAYERS.map((layer) => {
          const isActive = activeLayer === layer.id;
          return (
            <div key={layer.id}>
              <button
                type="button"
                onClick={() => setActiveLayer(isActive ? null : layer.id)}
                className={`w-full rounded-xl border-2 px-5 py-4 text-left transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "border-claude-orange bg-claude-orange/10 shadow-lg"
                    : "border-gray-200 bg-white hover:border-claude-orange/50 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold ${
                      isActive
                        ? "bg-claude-orange text-white"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {layer.icon}
                  </div>
                  <div className="flex-1">
                    <p
                      className={`font-semibold ${
                        isActive
                          ? "text-claude-orange"
                          : "text-gray-800 dark:text-gray-200"
                      }`}
                    >
                      {layer.label}
                    </p>
                    <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                      {layer.summary}
                    </p>
                  </div>
                  <span
                    className={`text-sm ${
                      isActive ? "text-claude-orange" : "text-gray-400"
                    }`}
                  >
                    {isActive ? "收起" : "展開"}
                  </span>
                </div>
              </button>

              {/* 展開的詳細內容 */}
              {isActive && (
                <div className="mt-2 rounded-xl border border-claude-orange/20 bg-claude-orange/5 p-5 dark:bg-claude-orange/10">
                  <p className="mb-4 text-gray-700 dark:text-gray-300">
                    {layer.description}
                  </p>
                  <div className="overflow-hidden rounded-lg border border-gray-700 bg-gray-900">
                    <div className="flex items-center justify-between border-b border-gray-700 bg-gray-800 px-4 py-2">
                      <span className="text-sm font-medium text-gray-300">
                        {layer.filename}
                      </span>
                    </div>
                    <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-gray-100">
                      <code>{layer.pythonExample}</code>
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 連接線視覺提示 */}
      <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <span>輸入</span>
        <span className="text-claude-orange">{"-->"}</span>
        <span>處理</span>
        <span className="text-claude-orange">{"-->"}</span>
        <span>輸出</span>
        <span className="mx-2 text-xs">(點擊每層查看 Python 範例)</span>
      </div>
    </div>
  );
}

// ============================================================================
// S14: MCP Integration — McpArchitectureDemo
// ============================================================================

interface McpConnection {
  id: string;
  from: string;
  to: string;
  label: string;
  description: string;
  dataFlow: string;
  pythonExample: string;
  filename: string;
}

const MCP_NODES = [
  { id: "claude", label: "Claude Code", color: "bg-purple-500", icon: "C" },
  { id: "mcp", label: "MCP Server", color: "bg-claude-orange", icon: "M" },
  { id: "db", label: "Database", color: "bg-blue-500", icon: "D" },
  { id: "github", label: "GitHub", color: "bg-gray-700", icon: "G" },
  { id: "slack", label: "Slack", color: "bg-green-500", icon: "S" },
] as const;

const MCP_CONNECTIONS: McpConnection[] = [
  {
    id: "claude-mcp",
    from: "claude",
    to: "mcp",
    label: "JSON-RPC 2.0",
    description:
      "Claude Code 透過 JSON-RPC 2.0 協定與 MCP Server 通訊。每個 MCP Server 是一個獨立的程序，透過 stdio 或 SSE 與 Claude Code 交換訊息。",
    dataFlow: "Claude Code 發送 tools/list 請求 → MCP Server 回傳可用工具清單 → Claude Code 發送 tools/call 執行工具",
    filename: "mcp_client.py",
    pythonExample: `# Claude Code 與 MCP Server 的通訊協定
import json

# JSON-RPC 2.0 請求格式
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",  # 列出可用工具
    "params": {}
}

# MCP Server 回應
response = {
    "jsonrpc": "2.0",
    "id": 1,
    "result": {
        "tools": [
            {
                "name": "query_database",
                "description": "執行 SQL 查詢",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "sql": {"type": "string"}
                    }
                }
            }
        ]
    }
}`,
  },
  {
    id: "mcp-db",
    from: "mcp",
    to: "db",
    label: "SQL / ORM",
    description:
      "MCP Server 將 Claude 的工具呼叫轉譯為資料庫操作。它負責連線管理、查詢安全性（防止 SQL injection）和結果格式化。",
    dataFlow: "MCP 接收 query_database 呼叫 → 驗證 SQL 安全性 → 執行查詢 → 格式化結果回傳",
    filename: "mcp_db_server.py",
    pythonExample: `# MCP Database Server 範例
from mcp.server import Server
from mcp.types import Tool, TextContent
import asyncpg

server = Server("database-server")

@server.list_tools()
async def list_tools():
    return [
        Tool(
            name="query_database",
            description="執行唯讀 SQL 查詢",
            inputSchema={
                "type": "object",
                "properties": {
                    "sql": {
                        "type": "string",
                        "description": "SELECT 查詢語句"
                    }
                },
                "required": ["sql"]
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "query_database":
        sql = arguments["sql"]
        # 安全檢查：只允許 SELECT
        if not sql.strip().upper().startswith("SELECT"):
            return [TextContent(
                type="text",
                text="錯誤：僅允許 SELECT 查詢"
            )]

        conn = await asyncpg.connect(DATABASE_URL)
        rows = await conn.fetch(sql)
        return [TextContent(type="text", text=str(rows))]`,
  },
  {
    id: "mcp-github",
    from: "mcp",
    to: "github",
    label: "REST API",
    description:
      "MCP GitHub Server 封裝了 GitHub API，讓 Claude 可以直接操作 PR、Issue、Repository 等資源。透過 OAuth token 進行驗證。",
    dataFlow: "MCP 接收 create_pull_request 呼叫 → 使用 GitHub API 建立 PR → 回傳 PR URL",
    filename: "mcp_github_server.py",
    pythonExample: `# MCP GitHub Server 範例
from mcp.server import Server
from mcp.types import Tool, TextContent
import httpx

server = Server("github-server")

@server.list_tools()
async def list_tools():
    return [
        Tool(
            name="create_pull_request",
            description="建立 GitHub Pull Request",
            inputSchema={
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "body": {"type": "string"},
                    "head": {"type": "string"},
                    "base": {"type": "string"}
                },
                "required": ["title", "head", "base"]
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "create_pull_request":
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"https://api.github.com/repos/{REPO}/pulls",
                headers={"Authorization": f"token {TOKEN}"},
                json=arguments
            )
            pr_data = resp.json()
            return [TextContent(
                type="text",
                text=f"PR #{pr_data['number']}: {pr_data['html_url']}"
            )]`,
  },
  {
    id: "mcp-slack",
    from: "mcp",
    to: "slack",
    label: "Webhook / Bot API",
    description:
      "MCP Slack Server 讓 Claude 可以發送通知、讀取頻道訊息、回應 thread。透過 Bot Token 與 Slack API 互動。",
    dataFlow: "MCP 接收 send_message 呼叫 → 透過 Slack Bot API 發送訊息 → 回傳訊息 timestamp",
    filename: "mcp_slack_server.py",
    pythonExample: `# MCP Slack Server 範例
from mcp.server import Server
from mcp.types import Tool, TextContent
import httpx

server = Server("slack-server")

@server.list_tools()
async def list_tools():
    return [
        Tool(
            name="send_message",
            description="發送 Slack 訊息到指定頻道",
            inputSchema={
                "type": "object",
                "properties": {
                    "channel": {
                        "type": "string",
                        "description": "頻道名稱或 ID"
                    },
                    "text": {
                        "type": "string",
                        "description": "訊息內容"
                    }
                },
                "required": ["channel", "text"]
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "send_message":
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://slack.com/api/chat.postMessage",
                headers={
                    "Authorization": f"Bearer {SLACK_BOT_TOKEN}"
                },
                json={
                    "channel": arguments["channel"],
                    "text": arguments["text"]
                }
            )
            data = resp.json()
            return [TextContent(
                type="text",
                text=f"訊息已發送: {data['ts']}"
            )]`,
  },
];

export function McpArchitectureDemo() {
  const [activeConn, setActiveConn] = useState<string | null>(null);
  const active = MCP_CONNECTIONS.find((c) => c.id === activeConn);

  return (
    <div className="my-8">
      {/* 架構圖 */}
      <div className="flex flex-col items-center gap-6">
        {/* Claude Code */}
        <div className="flex items-center justify-center">
          <div className="rounded-xl border-2 border-purple-400 bg-purple-50 px-6 py-3 font-semibold text-purple-700 dark:border-purple-500 dark:bg-purple-900/30 dark:text-purple-300">
            Claude Code
          </div>
        </div>

        {/* 連接線 - Claude to MCP */}
        <button
          type="button"
          onClick={() =>
            setActiveConn(activeConn === "claude-mcp" ? null : "claude-mcp")
          }
          className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-all cursor-pointer ${
            activeConn === "claude-mcp"
              ? "border-claude-orange bg-claude-orange/10 text-claude-orange"
              : "border-gray-300 bg-white text-gray-600 hover:border-claude-orange/50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400"
          }`}
        >
          <span>{"| JSON-RPC 2.0 |"}</span>
          <span className="text-xs">{activeConn === "claude-mcp" ? "v" : "> 點擊"}</span>
        </button>

        {/* MCP Server */}
        <div className="rounded-xl border-2 border-claude-orange bg-claude-orange/10 px-6 py-3 font-semibold text-claude-orange">
          MCP Server
        </div>

        {/* 連接線 - MCP to 外部服務 */}
        <div className="grid grid-cols-3 gap-4">
          {MCP_CONNECTIONS.filter((c) => c.id !== "claude-mcp").map((conn) => {
            const isActive = activeConn === conn.id;
            const targetNode = MCP_NODES.find((n) => n.id === conn.to);
            return (
              <button
                key={conn.id}
                type="button"
                onClick={() => setActiveConn(isActive ? null : conn.id)}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-3 transition-all cursor-pointer ${
                  isActive
                    ? "border-claude-orange bg-claude-orange/10 shadow-md"
                    : "border-gray-200 bg-white hover:border-claude-orange/50 dark:border-gray-700 dark:bg-gray-800"
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-white text-sm font-bold ${targetNode?.color}`}
                >
                  {targetNode?.icon}
                </div>
                <span
                  className={`text-sm font-medium ${
                    isActive
                      ? "text-claude-orange"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {targetNode?.label}
                </span>
                <span className="text-xs text-gray-400">{conn.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 展開的詳細說明 */}
      {active && (
        <div className="mt-6 rounded-xl border border-claude-orange/20 bg-claude-orange/5 p-5 dark:bg-claude-orange/10">
          <h4 className="mb-2 font-semibold text-claude-orange">{active.label} 連接</h4>
          <p className="mb-2 text-gray-700 dark:text-gray-300">{active.description}</p>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            <strong>資料流向：</strong>{active.dataFlow}
          </p>
          <div className="overflow-hidden rounded-lg border border-gray-700 bg-gray-900">
            <div className="flex items-center border-b border-gray-700 bg-gray-800 px-4 py-2">
              <span className="text-sm font-medium text-gray-300">{active.filename}</span>
            </div>
            <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-gray-100">
              <code>{active.pythonExample}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// S14: MCP Integration — McpConfigBuilder
// ============================================================================

interface McpService {
  id: string;
  name: string;
  icon: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  description: string;
}

const AVAILABLE_MCP_SERVICES: McpService[] = [
  {
    id: "postgres",
    name: "PostgreSQL",
    icon: "D",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-postgres"],
    env: { DATABASE_URL: "postgresql://user:pass@localhost:5432/mydb" },
    description: "連接 PostgreSQL 資料庫，執行 SQL 查詢",
  },
  {
    id: "github",
    name: "GitHub",
    icon: "G",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-github"],
    env: { GITHUB_TOKEN: "ghp_your_token_here" },
    description: "操作 GitHub PR、Issue、Repository",
  },
  {
    id: "slack",
    name: "Slack",
    icon: "S",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-slack"],
    env: { SLACK_BOT_TOKEN: "xoxb-your-token-here" },
    description: "發送 Slack 訊息、讀取頻道內容",
  },
  {
    id: "filesystem",
    name: "Filesystem",
    icon: "F",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/dir"],
    description: "安全的檔案系統存取，限制在指定目錄",
  },
  {
    id: "memory",
    name: "Memory",
    icon: "M",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-memory"],
    description: "持久化的知識圖譜儲存",
  },
];

export function McpConfigBuilder() {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleService = (id: string) => {
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

  const generateConfig = () => {
    const servers: Record<string, unknown> = {};
    for (const svc of AVAILABLE_MCP_SERVICES) {
      if (selected.has(svc.id)) {
        const entry: Record<string, unknown> = {
          command: svc.command,
          args: svc.args,
        };
        if (svc.env) {
          entry.env = svc.env;
        }
        servers[svc.id] = entry;
      }
    }
    return JSON.stringify({ mcpServers: servers }, null, 2);
  };

  return (
    <div className="my-8">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 左側：服務選擇 */}
        <div>
          <h4 className="mb-3 font-semibold text-gray-800 dark:text-gray-200">
            選擇要連接的服務：
          </h4>
          <div className="flex flex-col gap-2">
            {AVAILABLE_MCP_SERVICES.map((svc) => {
              const isSelected = selected.has(svc.id);
              return (
                <button
                  key={svc.id}
                  type="button"
                  onClick={() => toggleService(svc.id)}
                  className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-all cursor-pointer ${
                    isSelected
                      ? "border-claude-orange bg-claude-orange/10"
                      : "border-gray-200 bg-white hover:border-claude-orange/40 dark:border-gray-700 dark:bg-gray-800"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold text-white ${
                      isSelected ? "bg-claude-orange" : "bg-gray-400 dark:bg-gray-600"
                    }`}
                  >
                    {svc.icon}
                  </div>
                  <div className="flex-1">
                    <p
                      className={`font-medium ${
                        isSelected
                          ? "text-claude-orange"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {svc.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {svc.description}
                    </p>
                  </div>
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded border-2 ${
                      isSelected
                        ? "border-claude-orange bg-claude-orange text-white"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    {isSelected && (
                      <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M2 6l3 3 5-5" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 右側：即時預覽 */}
        <div>
          <h4 className="mb-3 font-semibold text-gray-800 dark:text-gray-200">
            即時預覽 mcp.json：
          </h4>
          <div className="overflow-hidden rounded-lg border border-gray-700 bg-gray-900">
            <div className="flex items-center border-b border-gray-700 bg-gray-800 px-4 py-2">
              <span className="text-sm font-medium text-gray-300">
                .claude/mcp.json
              </span>
            </div>
            <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-gray-100">
              <code>
                {selected.size > 0
                  ? generateConfig()
                  : "// 在左側選擇服務，這裡會即時產生配置"}
              </code>
            </pre>
          </div>
          {selected.size > 0 && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              已選擇 {selected.size} 個服務。將此內容存為
              <code className="mx-1 rounded bg-gray-100 px-1 dark:bg-gray-800">
                .claude/mcp.json
              </code>
              即可使用。
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// S15: Hooks System — HooksFlowDemo
// ============================================================================

interface HookPhase {
  id: string;
  label: string;
  description: string;
  timing: string;
  pythonExample: string;
  filename: string;
  envVars: string[];
}

const HOOK_PHASES: HookPhase[] = [
  {
    id: "pre",
    label: "PreToolUse",
    description:
      "工具執行前觸發。可以用來驗證參數、阻止危險操作、記錄審計日誌。如果 Hook 回傳非零退出碼，工具呼叫會被取消。",
    timing: "工具呼叫前",
    filename: "pre_hook.py",
    envVars: ["CLAUDE_TOOL_NAME", "CLAUDE_TOOL_INPUT"],
    pythonExample: `#!/usr/bin/env python3
"""PreToolUse Hook：攔截危險的 Bash 指令"""
import os
import sys
import json

tool_name = os.environ.get("CLAUDE_TOOL_NAME", "")
tool_input = json.loads(
    os.environ.get("CLAUDE_TOOL_INPUT", "{}")
)

# 只攔截 Bash 工具
if tool_name != "Bash":
    sys.exit(0)  # 放行

command = tool_input.get("command", "")

# 檢查危險指令
DANGEROUS = ["rm -rf /", "DROP DATABASE", "mkfs", "> /dev/sda"]
for pattern in DANGEROUS:
    if pattern in command:
        # 輸出 JSON 回饋給 Claude
        print(json.dumps({
            "decision": "block",
            "reason": f"偵測到危險指令: {pattern}"
        }))
        sys.exit(2)  # 非零 = 阻止執行

sys.exit(0)  # 放行`,
  },
  {
    id: "execute",
    label: "工具執行",
    description:
      "Claude Code 執行實際的工具操作（讀檔、寫檔、執行指令等）。這個階段由系統控制，無法直接插入 Hook。",
    timing: "工具呼叫中",
    filename: "tool_execution.py",
    envVars: [],
    pythonExample: `# 這個階段由 Claude Code 內部處理
# 你無法直接介入，但可以透過
# PreToolUse 和 PostToolUse 在前後插入邏輯

# 工具執行流程：
# 1. Claude 決定使用某個工具
# 2. 系統檢查權限（allow / deny / ask）
# 3. PreToolUse Hook 執行
# 4. ▶ 工具實際執行 ◀ (此階段)
# 5. PostToolUse Hook 執行
# 6. 結果回傳給 Claude`,
  },
  {
    id: "post",
    label: "PostToolUse",
    description:
      "工具執行後觸發。可以用來格式化輸出、執行自動修復（如 linter）、發送通知、記錄結果到外部系統。",
    timing: "工具呼叫後",
    filename: "post_hook.py",
    envVars: ["CLAUDE_TOOL_NAME", "CLAUDE_TOOL_INPUT", "CLAUDE_FILE_PATH", "CLAUDE_TOOL_OUTPUT"],
    pythonExample: `#!/usr/bin/env python3
"""PostToolUse Hook：寫入檔案後自動執行 linter"""
import os
import sys
import subprocess
import json

tool_name = os.environ.get("CLAUDE_TOOL_NAME", "")
file_path = os.environ.get("CLAUDE_FILE_PATH", "")

# 只在 Write / Edit 之後觸發
if tool_name not in ("Write", "Edit"):
    sys.exit(0)

# 只處理 Python 檔案
if not file_path.endswith(".py"):
    sys.exit(0)

# 自動執行 ruff 格式化
result = subprocess.run(
    ["ruff", "format", file_path],
    capture_output=True, text=True
)

if result.returncode == 0:
    print(json.dumps({
        "status": "success",
        "message": f"已自動格式化: {file_path}"
    }))
else:
    print(json.dumps({
        "status": "warning",
        "message": f"格式化失敗: {result.stderr}"
    }))`,
  },
];

export function HooksFlowDemo() {
  const [activePhase, setActivePhase] = useState<number>(0);
  const phase = HOOK_PHASES[activePhase];

  return (
    <div className="my-8">
      {/* 步驟指示器 */}
      <div className="mb-6 flex items-center justify-center gap-2">
        {HOOK_PHASES.map((p, i) => (
          <div key={p.id} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActivePhase(i)}
              className={`flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-medium transition-all cursor-pointer ${
                activePhase === i
                  ? "border-claude-orange bg-claude-orange text-white"
                  : "border-gray-300 bg-white text-gray-600 hover:border-claude-orange/50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400"
              }`}
            >
              <span className="font-bold">{i + 1}</span>
              <span className="hidden sm:inline">{p.label}</span>
            </button>
            {i < HOOK_PHASES.length - 1 && (
              <span className="text-gray-400 dark:text-gray-500">{"-->"}</span>
            )}
          </div>
        ))}
      </div>

      {/* 當前階段內容 */}
      <div className="rounded-xl border-2 border-claude-orange/30 bg-claude-orange/5 p-5 dark:bg-claude-orange/10">
        <div className="mb-3 flex items-center gap-3">
          <span className="rounded-full bg-claude-orange px-3 py-1 text-sm font-bold text-white">
            {phase.timing}
          </span>
          <h4 className="text-lg font-semibold text-claude-orange">
            {phase.label}
          </h4>
        </div>
        <p className="mb-3 text-gray-700 dark:text-gray-300">
          {phase.description}
        </p>
        {phase.envVars.length > 0 && (
          <div className="mb-3">
            <p className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-400">
              可用環境變數：
            </p>
            <div className="flex flex-wrap gap-2">
              {phase.envVars.map((v) => (
                <code
                  key={v}
                  className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-claude-orange dark:bg-gray-800"
                >
                  ${v}
                </code>
              ))}
            </div>
          </div>
        )}
        <div className="overflow-hidden rounded-lg border border-gray-700 bg-gray-900">
          <div className="flex items-center border-b border-gray-700 bg-gray-800 px-4 py-2">
            <span className="text-sm font-medium text-gray-300">
              {phase.filename}
            </span>
          </div>
          <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-gray-100">
            <code>{phase.pythonExample}</code>
          </pre>
        </div>
      </div>

      {/* 導航按鈕 */}
      <div className="mt-4 flex justify-between">
        <button
          type="button"
          onClick={() => setActivePhase(Math.max(0, activePhase - 1))}
          disabled={activePhase === 0}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            activePhase === 0
              ? "cursor-not-allowed text-gray-400"
              : "cursor-pointer text-claude-orange hover:bg-claude-orange/10"
          }`}
        >
          {"<-- 上一步"}
        </button>
        <button
          type="button"
          onClick={() =>
            setActivePhase(Math.min(HOOK_PHASES.length - 1, activePhase + 1))
          }
          disabled={activePhase === HOOK_PHASES.length - 1}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            activePhase === HOOK_PHASES.length - 1
              ? "cursor-not-allowed text-gray-400"
              : "cursor-pointer text-claude-orange hover:bg-claude-orange/10"
          }`}
        >
          {"下一步 -->"}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// S15: Hooks System — HooksConfigDemo
// ============================================================================

interface HookConfig {
  hookType: "PreToolUse" | "PostToolUse";
  matcher: string;
  command: string;
}

const HOOK_TYPE_OPTIONS = [
  { value: "PreToolUse", label: "PreToolUse (工具執行前)", description: "在工具執行前攔截，可用於安全驗證" },
  { value: "PostToolUse", label: "PostToolUse (工具執行後)", description: "在工具執行後觸發，可用於自動修復" },
] as const;

const MATCHER_OPTIONS = [
  { value: "Bash", label: "Bash", description: "匹配所有 shell 指令執行" },
  { value: "Write", label: "Write", description: "匹配檔案寫入操作" },
  { value: "Edit", label: "Edit", description: "匹配檔案編輯操作" },
  { value: "Read", label: "Read", description: "匹配檔案讀取操作" },
  { value: "Glob", label: "Glob", description: "匹配檔案搜尋操作" },
  { value: "Grep", label: "Grep", description: "匹配內容搜尋操作" },
] as const;

const COMMAND_TEMPLATES = [
  { value: "python3 hooks/validate.py", label: "Python 驗證腳本" },
  { value: "npx eslint --fix $CLAUDE_FILE_PATH", label: "ESLint 自動修復" },
  { value: "ruff format $CLAUDE_FILE_PATH", label: "Ruff 格式化" },
  { value: "python3 hooks/notify.py", label: "通知腳本" },
  { value: "python3 hooks/audit_log.py", label: "審計日誌" },
] as const;

export function HooksConfigDemo() {
  const [hooks, setHooks] = useState<HookConfig[]>([
    { hookType: "PreToolUse", matcher: "Bash", command: "python3 hooks/validate.py" },
  ]);

  const addHook = () => {
    setHooks([...hooks, { hookType: "PostToolUse", matcher: "Write", command: "ruff format $CLAUDE_FILE_PATH" }]);
  };

  const removeHook = (index: number) => {
    setHooks(hooks.filter((_, i) => i !== index));
  };

  const updateHook = (index: number, field: keyof HookConfig, value: string) => {
    const updated = [...hooks];
    updated[index] = { ...updated[index], [field]: value };
    setHooks(updated);
  };

  const generateConfig = () => {
    const config: Record<string, Array<{ matcher: string; hooks: Array<{ type: string; command: string }> }>> = {};
    for (const hook of hooks) {
      if (!config[hook.hookType]) {
        config[hook.hookType] = [];
      }
      config[hook.hookType].push({
        matcher: hook.matcher,
        hooks: [{ type: "command", command: hook.command }],
      });
    }
    return JSON.stringify({ hooks: config }, null, 2);
  };

  return (
    <div className="my-8">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 左側：Hook 配置器 */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200">
              配置 Hooks：
            </h4>
            <button
              type="button"
              onClick={addHook}
              className="rounded-lg border border-claude-orange px-3 py-1.5 text-sm font-medium text-claude-orange transition-all hover:bg-claude-orange/10 cursor-pointer"
            >
              + 新增 Hook
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {hooks.map((hook, i) => (
              <div
                key={i}
                className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Hook #{i + 1}
                  </span>
                  {hooks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeHook(i)}
                      className="text-xs text-red-500 hover:text-red-700 cursor-pointer"
                    >
                      移除
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <select
                    value={hook.hookType}
                    onChange={(e) => updateHook(i, "hookType", e.target.value)}
                    className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                  >
                    {HOOK_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={hook.matcher}
                    onChange={(e) => updateHook(i, "matcher", e.target.value)}
                    className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                  >
                    {MATCHER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label} - {opt.description}
                      </option>
                    ))}
                  </select>
                  <select
                    value={hook.command}
                    onChange={(e) => updateHook(i, "command", e.target.value)}
                    className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                  >
                    {COMMAND_TEMPLATES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 右側：即時預覽 */}
        <div>
          <h4 className="mb-3 font-semibold text-gray-800 dark:text-gray-200">
            即時預覽 settings.json：
          </h4>
          <div className="overflow-hidden rounded-lg border border-gray-700 bg-gray-900">
            <div className="flex items-center border-b border-gray-700 bg-gray-800 px-4 py-2">
              <span className="text-sm font-medium text-gray-300">
                .claude/settings.json
              </span>
            </div>
            <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-gray-100">
              <code>{generateConfig()}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// S16: Session Storage — SessionLifecycleDemo
// ============================================================================

interface SessionStage {
  id: string;
  label: string;
  icon: string;
  description: string;
  detail: string;
  pythonExample: string;
  filename: string;
}

const SESSION_STAGES: SessionStage[] = [
  {
    id: "create",
    label: "建立",
    icon: "1",
    description: "使用者啟動 Claude Code 時，系統自動建立新 Session",
    detail:
      "每次啟動 Claude Code 都會產生一個唯一的 Session ID。Session 記錄了專案路徑、Git 分支、啟動時間等基本資訊。使用 --resume 可以恢復先前的 Session，使用 --continue 可以從最近的 Session 繼續。",
    filename: "session_create.py",
    pythonExample: `# Session 建立流程
import uuid
from datetime import datetime

class Session:
    def __init__(self, project_path: str, branch: str):
        self.session_id = str(uuid.uuid4())
        self.created_at = datetime.now().isoformat()
        self.project_path = project_path
        self.branch = branch
        self.messages = []
        self.total_tokens = 0
        self.status = "active"

# 啟動方式
# claude                    → 建立新 Session
# claude --resume           → 選擇要恢復的 Session
# claude --continue         → 繼續最近的 Session`,
  },
  {
    id: "use",
    label: "使用",
    icon: "2",
    description: "對話過程中持續累積訊息歷史和 token 使用量",
    detail:
      "每一輪對話（使用者輸入 + Claude 回應 + 工具呼叫結果）都被記錄在 Session 中。Token 使用量持續累積，當接近 context window 上限時會觸發壓縮機制。",
    filename: "session_usage.py",
    pythonExample: `# Session 使用中：訊息累積
class SessionManager:
    def __init__(self, session: Session):
        self.session = session
        self.context_window = 200_000  # Claude 的上下文窗口

    def add_interaction(self, user_msg: str,
                        assistant_msg: str,
                        tool_calls: list[dict]):
        """記錄一輪完整的互動"""
        self.session.messages.append({
            "role": "user",
            "content": user_msg
        })

        for tool_call in tool_calls:
            self.session.messages.append({
                "role": "assistant",
                "content": tool_call["request"]
            })
            self.session.messages.append({
                "role": "tool",
                "content": tool_call["result"]
            })

        self.session.messages.append({
            "role": "assistant",
            "content": assistant_msg
        })

        # 檢查是否需要壓縮
        if self.estimate_tokens() > self.context_window * 0.8:
            self.trigger_compaction()`,
  },
  {
    id: "compact",
    label: "壓縮",
    icon: "3",
    description: "當 token 接近上限時，自動摘要歷史對話以釋放空間",
    detail:
      "Context compaction 是 Claude Code 的關鍵機制。當 token 使用量達到上下文窗口的 80% 左右，系統會自動將歷史對話壓縮為摘要，保留關鍵的決策和狀態資訊，同時釋放空間給新的對話。",
    filename: "session_compact.py",
    pythonExample: `# Session 壓縮：自動摘要歷史對話
class ContextCompactor:
    def compact(self, messages: list[dict]) -> list[dict]:
        """壓縮歷史訊息，保留關鍵資訊"""

        # 分類訊息
        recent = messages[-10:]   # 保留最近 10 則
        old = messages[:-10]      # 壓縮舊訊息

        # 產生摘要（由 Claude 自己做）
        summary = self.summarize(old)

        # 重建訊息歷史
        return [
            {
                "role": "user",
                "content": f"[先前對話摘要]\\n{summary}"
            },
            *recent  # 保留最近的完整對話
        ]

    def summarize(self, messages: list[dict]) -> str:
        """提取關鍵資訊作為摘要"""
        # Claude 會記住：
        # - 修改了哪些檔案
        # - 目前的任務進度
        # - 遇到的錯誤和解決方案
        # - 使用者的偏好設定
        return "自動產生的對話摘要..."`,
  },
  {
    id: "resume",
    label: "恢復",
    icon: "4",
    description: "可以從先前的 Session 恢復上下文，繼續未完成的工作",
    detail:
      "Session 持久化在本地的 ~/.claude/projects/ 目錄下。使用 --resume 可以列出所有歷史 Session，選擇一個恢復。Claude 會讀取先前的對話歷史和壓縮摘要，快速回到先前的工作狀態。",
    filename: "session_resume.py",
    pythonExample: `# Session 恢復：從歷史記錄繼續
import json
from pathlib import Path

def list_sessions(project_path: str) -> list[dict]:
    """列出可恢復的 Session"""
    session_dir = Path.home() / ".claude" / "projects"
    sessions = []

    for f in session_dir.glob("*/session.json"):
        with open(f) as fp:
            data = json.load(fp)
            if data["project_path"] == project_path:
                sessions.append({
                    "session_id": data["session_id"],
                    "created_at": data["created_at"],
                    "message_count": len(data["messages"]),
                    "last_summary": data.get("summary", "")
                })

    return sorted(sessions,
                  key=lambda s: s["created_at"],
                  reverse=True)

# 命令列使用
# claude --resume           → 互動式選擇 Session
# claude --continue         → 自動恢復最近的 Session`,
  },
  {
    id: "end",
    label: "結束",
    icon: "5",
    description: "使用者退出或 Session 逾時，自動儲存並關閉",
    detail:
      "Session 結束時，系統會自動保存最終狀態。包含完整的對話歷史（或壓縮摘要）、token 使用統計、修改的檔案清單等。Session 資料會保留在本地，直到手動清理。",
    filename: "session_end.py",
    pythonExample: `# Session 結束：自動儲存
class SessionFinalizer:
    def finalize(self, session: Session):
        """Session 結束時的清理工作"""
        session.status = "ended"
        session.ended_at = datetime.now().isoformat()

        # 計算統計資訊
        stats = {
            "total_messages": len(session.messages),
            "total_tokens": session.total_tokens,
            "duration_minutes": self.calc_duration(session),
            "files_modified": self.extract_modified_files(
                session.messages
            ),
            "tools_used": self.count_tool_usage(
                session.messages
            )
        }

        # 儲存到本地
        session_path = (
            Path.home() / ".claude" / "projects"
            / session.session_id / "session.json"
        )
        session_path.parent.mkdir(parents=True, exist_ok=True)

        with open(session_path, "w") as f:
            json.dump({
                **session.__dict__,
                "stats": stats
            }, f, indent=2, ensure_ascii=False)`,
  },
];

export function SessionLifecycleDemo() {
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const active = SESSION_STAGES.find((s) => s.id === activeStage);

  return (
    <div className="my-8">
      {/* 生命週期時間軸 */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto pb-4">
        {SESSION_STAGES.map((stage, i) => {
          const isActive = activeStage === stage.id;
          return (
            <div key={stage.id} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveStage(isActive ? null : stage.id)}
                className={`flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-3 transition-all cursor-pointer min-w-[80px] ${
                  isActive
                    ? "border-claude-orange bg-claude-orange/10 shadow-md"
                    : "border-gray-200 bg-white hover:border-claude-orange/50 dark:border-gray-700 dark:bg-gray-800"
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    isActive
                      ? "bg-claude-orange text-white"
                      : "bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300"
                  }`}
                >
                  {stage.icon}
                </div>
                <span
                  className={`text-xs font-medium ${
                    isActive
                      ? "text-claude-orange"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {stage.label}
                </span>
              </button>
              {i < SESSION_STAGES.length - 1 && (
                <span className="text-gray-300 dark:text-gray-600">{"-->"}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* 展開的詳細內容 */}
      {active && (
        <div className="rounded-xl border border-claude-orange/20 bg-claude-orange/5 p-5 dark:bg-claude-orange/10">
          <h4 className="mb-2 text-lg font-semibold text-claude-orange">
            {active.label}階段
          </h4>
          <p className="mb-4 text-gray-700 dark:text-gray-300">{active.detail}</p>
          <div className="overflow-hidden rounded-lg border border-gray-700 bg-gray-900">
            <div className="flex items-center border-b border-gray-700 bg-gray-800 px-4 py-2">
              <span className="text-sm font-medium text-gray-300">
                {active.filename}
              </span>
            </div>
            <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-gray-100">
              <code>{active.pythonExample}</code>
            </pre>
          </div>
        </div>
      )}

      {!active && (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          點擊上方任一階段查看詳細說明與 Python 範例
        </p>
      )}
    </div>
  );
}

// ============================================================================
// S17: CLAUDE.md Design — ClaudeMdBuilderDemo
// ============================================================================

interface ClaudeMdSection {
  id: string;
  label: string;
  category: "tech" | "coding" | "forbidden" | "workflow";
  content: string;
}

const CLAUDE_MD_SECTIONS: ClaudeMdSection[] = [
  {
    id: "project-name",
    label: "專案名稱",
    category: "tech",
    content: "# My Awesome Project\n",
  },
  {
    id: "tech-stack",
    label: "技術棧",
    category: "tech",
    content: `## 技術棧
- 語言：Python 3.12
- 框架：FastAPI
- 資料庫：PostgreSQL + SQLAlchemy
- 測試：pytest
- 格式化：ruff
`,
  },
  {
    id: "coding-style",
    label: "編碼規範",
    category: "coding",
    content: `## 編碼規範
- 使用 type hints 標註所有函式參數和回傳值
- Docstring 使用 Google style
- 變數命名使用 snake_case
- 類別命名使用 PascalCase
- 每個模組最多 300 行
`,
  },
  {
    id: "testing",
    label: "測試規範",
    category: "coding",
    content: `## 測試規範
- 每個新功能必須附帶單元測試
- 測試覆蓋率不低於 80%
- 使用 pytest fixtures，不使用 setUp/tearDown
- mock 外部 API 呼叫，不發真實請求
`,
  },
  {
    id: "forbidden",
    label: "禁止行為",
    category: "forbidden",
    content: `## 禁止行為
- 禁止使用 Any 型別
- 禁止在程式碼中硬編碼密碼或 API key
- 禁止直接操作 production 資料庫
- 禁止跳過 pre-commit hooks
- 禁止使用 print() 除錯，使用 logging
`,
  },
  {
    id: "git-workflow",
    label: "Git 工作流",
    category: "workflow",
    content: `## Git 工作流
- Commit message 使用 conventional commits 格式
- 每個 PR 只解決一個問題
- PR 描述必須包含 "為什麼" 而非 "做了什麼"
- 合併前必須通過所有 CI 檢查
`,
  },
  {
    id: "communication",
    label: "溝通方式",
    category: "workflow",
    content: `## 溝通方式
- 語言：一律使用繁體中文
- 不確定時主動詢問，不要猜測
- 每次修改後說明修改原因
- 遇到重大設計決策時列出方案比較
`,
  },
];

const CATEGORY_INFO: Record<string, { label: string; color: string }> = {
  tech: { label: "技術棧", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  coding: { label: "編碼規範", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  forbidden: { label: "禁止行為", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  workflow: { label: "工作流", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
};

export function ClaudeMdBuilderDemo() {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(["project-name", "tech-stack", "coding-style", "forbidden"])
  );

  const toggleSection = (id: string) => {
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

  const generateMarkdown = () => {
    return CLAUDE_MD_SECTIONS.filter((s) => selected.has(s.id))
      .map((s) => s.content)
      .join("\n");
  };

  return (
    <div className="my-8">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 左側：區塊選擇 */}
        <div>
          <h4 className="mb-3 font-semibold text-gray-800 dark:text-gray-200">
            選擇要包含的區塊：
          </h4>
          <div className="flex flex-col gap-2">
            {CLAUDE_MD_SECTIONS.map((section) => {
              const isSelected = selected.has(section.id);
              const cat = CATEGORY_INFO[section.category];
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className={`flex items-center gap-3 rounded-lg border-2 px-4 py-2.5 text-left transition-all cursor-pointer ${
                    isSelected
                      ? "border-claude-orange bg-claude-orange/10"
                      : "border-gray-200 bg-white hover:border-claude-orange/40 dark:border-gray-700 dark:bg-gray-800"
                  }`}
                >
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded border-2 ${
                      isSelected
                        ? "border-claude-orange bg-claude-orange text-white"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    {isSelected && (
                      <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M2 6l3 3 5-5" />
                      </svg>
                    )}
                  </div>
                  <span
                    className={`flex-1 font-medium ${
                      isSelected
                        ? "text-claude-orange"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {section.label}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${cat.color}`}>
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 右側：即時預覽 */}
        <div>
          <h4 className="mb-3 font-semibold text-gray-800 dark:text-gray-200">
            即時預覽 CLAUDE.md：
          </h4>
          <div className="overflow-hidden rounded-lg border border-gray-700 bg-gray-900">
            <div className="flex items-center border-b border-gray-700 bg-gray-800 px-4 py-2">
              <span className="text-sm font-medium text-gray-300">CLAUDE.md</span>
            </div>
            <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-gray-100 max-h-[500px]">
              <code>
                {selected.size > 0
                  ? generateMarkdown()
                  : "// 在左側選擇區塊，這裡會即時產生 CLAUDE.md"}
              </code>
            </pre>
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            已選擇 {selected.size} 個區塊。勾選/取消勾選來組合你的 CLAUDE.md。
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// S17: CLAUDE.md Design — LoadingPriorityDemo
// ============================================================================

interface PriorityLevel {
  id: string;
  level: number;
  label: string;
  path: string;
  description: string;
  scope: string;
}

const PRIORITY_LEVELS: PriorityLevel[] = [
  {
    id: "global",
    level: 1,
    label: "全域指令",
    path: "~/.claude/CLAUDE.md",
    description: "適用於所有專案的通用規則，如語言偏好、通用編碼習慣",
    scope: "所有專案",
  },
  {
    id: "project",
    level: 2,
    label: "專案根目錄",
    path: "/project/CLAUDE.md",
    description: "專案層級的規則，如技術棧定義、專案特定的禁止行為",
    scope: "整個專案",
  },
  {
    id: "subdir",
    level: 3,
    label: "子目錄指令",
    path: "/project/src/api/CLAUDE.md",
    description: "子模組特定規則，如 API 層的命名慣例、特定資料夾的測試要求",
    scope: "該目錄及子目錄",
  },
  {
    id: "imported",
    level: 4,
    label: "匯入的指令",
    path: "@docs/style-guide.md",
    description: "透過 @ 語法匯入的外部文件，如共用的 style guide",
    scope: "匯入處所在層級",
  },
];

export function LoadingPriorityDemo() {
  const [activeLevel, setActiveLevel] = useState<string | null>(null);

  return (
    <div className="my-8">
      <div className="flex flex-col gap-2">
        {PRIORITY_LEVELS.map((level) => {
          const isActive = activeLevel === level.id;
          const widthPercent = 100 - (level.level - 1) * 12;
          return (
            <button
              key={level.id}
              type="button"
              onClick={() => setActiveLevel(isActive ? null : level.id)}
              className={`mx-auto rounded-xl border-2 px-5 py-3 text-left transition-all cursor-pointer ${
                isActive
                  ? "border-claude-orange bg-claude-orange/10 shadow-md"
                  : "border-gray-200 bg-white hover:border-claude-orange/50 dark:border-gray-700 dark:bg-gray-800"
              }`}
              style={{ width: `${widthPercent}%` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      isActive
                        ? "bg-claude-orange text-white"
                        : "bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {level.level}
                  </span>
                  <div>
                    <span
                      className={`font-medium ${
                        isActive
                          ? "text-claude-orange"
                          : "text-gray-800 dark:text-gray-200"
                      }`}
                    >
                      {level.label}
                    </span>
                    <code className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                      {level.path}
                    </code>
                  </div>
                </div>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                  {level.scope}
                </span>
              </div>
              {isActive && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {level.description}
                </p>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        越下方的層級優先順序越高，會覆蓋上方的設定。點擊查看每層說明。
      </p>
    </div>
  );
}

// ============================================================================
// S18: Permission & Security — SecurityLayersDemo
// ============================================================================

interface SecurityLayer {
  id: string;
  level: number;
  label: string;
  icon: string;
  description: string;
  mechanisms: string[];
  pythonExample: string;
  filename: string;
}

const SECURITY_LAYERS: SecurityLayer[] = [
  {
    id: "system",
    level: 1,
    label: "系統級安全",
    icon: "S",
    description:
      "最外層的防護。限制 Claude Code 可以存取的目錄、最大 Session 時間、網路存取權限。由系統管理員或 CI/CD 環境設定。",
    mechanisms: [
      "工作目錄限制（--allowedTools）",
      "API 速率限制",
      "Session 逾時設定",
      "網路存取白名單",
    ],
    filename: "system_security.py",
    pythonExample: `# 系統級安全：啟動參數限制
# 在 CI/CD 或受管環境中限制 Claude Code 的能力

# 命令列安全參數
startup_config = {
    "allowed_tools": [
        "Read", "Glob", "Grep",  # 只允許唯讀工具
        "Edit", "Write"           # 允許寫入但不允許 Bash
    ],
    "working_directory": "/app",
    "max_session_minutes": 30,
    "permission_mode": "plan",  # plan = 所有寫入都要確認
}

# 使用方式
# claude --allowedTools Read,Glob,Grep,Edit,Write
# claude --permission-mode plan`,
  },
  {
    id: "tool",
    level: 2,
    label: "工具級安全",
    icon: "T",
    description:
      "控制每個工具的權限。透過 settings.json 的 permissions 欄位，定義哪些工具自動允許、哪些需要確認、哪些直接禁止。",
    mechanisms: [
      "allow: 自動允許（如 Read, Glob）",
      "deny: 完全禁止（如 rm -rf）",
      "ask: 每次確認（如 Bash, Write）",
      "指令模式匹配（如 Bash(npm test)）",
    ],
    filename: "tool_security.py",
    pythonExample: `# 工具級安全：settings.json 權限配置

settings = {
    "permissions": {
        # 自動允許的操作
        "allow": [
            "Read",              # 讀取任何檔案
            "Glob",              # 搜尋檔案
            "Grep",              # 搜尋內容
            "Bash(npm test)",    # 只允許 npm test
            "Bash(pytest *)",    # 只允許 pytest
        ],

        # 完全禁止的操作
        "deny": [
            "Bash(rm -rf *)",       # 禁止遞迴刪除
            "Bash(chmod *)",        # 禁止改權限
            "Bash(curl * | sh)",    # 禁止下載執行
            "Bash(> /dev/*)",       # 禁止寫入裝置
        ],

        # 需要使用者確認的操作（預設）
        # 不在 allow 和 deny 中的 → 都要問
    }
}

# 權限判定順序：deny > allow > ask`,
  },
  {
    id: "file",
    level: 3,
    label: "檔案級安全",
    icon: "F",
    description:
      "保護特定檔案和目錄。設定唯讀路徑防止意外修改、設定禁止存取路徑保護機敏資料。搭配 .gitignore 和 .claudeignore 使用。",
    mechanisms: [
      ".claudeignore 排除敏感檔案",
      "唯讀路徑模式保護設定檔",
      "禁止存取 .env 和密鑰檔案",
      "路徑 glob 模式匹配",
    ],
    filename: "file_security.py",
    pythonExample: `# 檔案級安全：保護敏感檔案

# .claudeignore — Claude 完全看不到這些檔案
claudeignore_rules = """
# 密鑰和認證
.env
.env.*
*.pem
*.key
credentials.json

# 敏感資料
secrets/
private/
*.secret

# 大型檔案（避免浪費 token）
*.sqlite
*.db
node_modules/
"""

# settings.json 中的路徑保護
file_permissions = {
    "read_only": [
        "*.lock",           # 鎖定檔唯讀
        "docker-compose.yml",
        ".github/workflows/*",
    ],
    "no_access": [
        ".env*",            # 環境變數
        "**/*.key",         # 私鑰
        "**/credentials*",  # 認證檔
    ]
}`,
  },
  {
    id: "audit",
    level: 4,
    label: "審計級安全",
    icon: "A",
    description:
      "最內層的防護。記錄所有操作到審計日誌，支援事後追溯和合規審查。搭配 Hooks 可以將審計日誌推送到外部系統。",
    mechanisms: [
      "所有工具呼叫自動記錄",
      "操作時間戳和結果追蹤",
      "透過 PostToolUse Hook 推送到 SIEM",
      "Session 完整歷史保存",
    ],
    filename: "audit_security.py",
    pythonExample: `# 審計級安全：操作日誌追蹤
import json
import os
from datetime import datetime

def audit_hook():
    """PostToolUse Hook：記錄所有操作到審計日誌"""
    audit_entry = {
        "timestamp": datetime.now().isoformat(),
        "tool": os.environ.get("CLAUDE_TOOL_NAME"),
        "input": json.loads(
            os.environ.get("CLAUDE_TOOL_INPUT", "{}")
        ),
        "file_path": os.environ.get("CLAUDE_FILE_PATH"),
        "session_id": os.environ.get("CLAUDE_SESSION_ID"),
        "user": os.environ.get("USER"),
    }

    # 寫入本地審計日誌
    log_path = "/var/log/claude-audit.jsonl"
    with open(log_path, "a") as f:
        f.write(json.dumps(audit_entry, ensure_ascii=False))
        f.write("\\n")

    # 也可以推送到外部系統
    # send_to_siem(audit_entry)
    # send_to_slack(audit_entry)

if __name__ == "__main__":
    audit_hook()`,
  },
];

export function SecurityLayersDemo() {
  const [activeLayer, setActiveLayer] = useState<string | null>(null);
  const active = SECURITY_LAYERS.find((l) => l.id === activeLayer);

  return (
    <div className="my-8">
      {/* 縱深防禦同心圓視覺化 */}
      <div className="flex flex-col items-center gap-2">
        {SECURITY_LAYERS.map((layer) => {
          const isActive = activeLayer === layer.id;
          const widthPercent = 100 - (layer.level - 1) * 15;
          return (
            <button
              key={layer.id}
              type="button"
              onClick={() => setActiveLayer(isActive ? null : layer.id)}
              className={`mx-auto flex items-center gap-3 rounded-xl border-2 px-5 py-3 transition-all cursor-pointer ${
                isActive
                  ? "border-claude-orange bg-claude-orange/10 shadow-lg"
                  : "border-gray-200 bg-white hover:border-claude-orange/50 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
              }`}
              style={{ width: `${widthPercent}%` }}
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold ${
                  isActive
                    ? "bg-claude-orange text-white"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                {layer.icon}
              </div>
              <div className="flex-1 text-left">
                <p
                  className={`font-semibold ${
                    isActive
                      ? "text-claude-orange"
                      : "text-gray-800 dark:text-gray-200"
                  }`}
                >
                  Layer {layer.level}: {layer.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {layer.mechanisms[0]}
                </p>
              </div>
              <span className={`text-sm ${isActive ? "text-claude-orange" : "text-gray-400"}`}>
                {isActive ? "v" : ">"}
              </span>
            </button>
          );
        })}
      </div>

      {/* 展開的詳細內容 */}
      {active && (
        <div className="mt-6 rounded-xl border border-claude-orange/20 bg-claude-orange/5 p-5 dark:bg-claude-orange/10">
          <h4 className="mb-2 text-lg font-semibold text-claude-orange">
            Layer {active.level}: {active.label}
          </h4>
          <p className="mb-3 text-gray-700 dark:text-gray-300">
            {active.description}
          </p>
          <div className="mb-4">
            <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
              防護機制：
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm text-gray-600 dark:text-gray-400">
              {active.mechanisms.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
          <div className="overflow-hidden rounded-lg border border-gray-700 bg-gray-900">
            <div className="flex items-center border-b border-gray-700 bg-gray-800 px-4 py-2">
              <span className="text-sm font-medium text-gray-300">
                {active.filename}
              </span>
            </div>
            <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-gray-100">
              <code>{active.pythonExample}</code>
            </pre>
          </div>
        </div>
      )}

      {!active && (
        <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          點擊任一層查看詳細的安全機制與 Python 範例。外層 = 粗粒度控制，內層 = 細粒度控制。
        </p>
      )}
    </div>
  );
}
