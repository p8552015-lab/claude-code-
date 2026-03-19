"use client";

import React from "react";
import CodeBlock from "@/components/CodeBlock";
import CalloutBox from "@/components/CalloutBox";
import {
  AgentLoopFlowDiagram,
  AgentLoopStepper,
  ComparisonCards,
  StopReasonCards,
} from "@/components/AgentLoopDemo";
import {
  ToolboxCards,
  PermissionLevels,
  ToolExecutionFlow,
  PermissionConfigBuilder,
} from "@/components/ToolSystemDemo";

// ============================================================================
// Module 1: Core Agent -- Full Content (S01-S06)
// ============================================================================

function S01AgentLoop() {
  return (
    <>
      <h2 id="what-is-agent-loop">什麼是 Agent Loop</h2>
      <p>
        <strong>一句話解釋：</strong>Agent Loop 就是一個「想 → 做 → 看結果 → 再想」的不斷循環，直到任務完成為止。
      </p>
      <p>
        想像你叫一個超強實習生幫你完成任務。他不會只回答「你可以這樣做」然後就沒了 —
        他會自己去讀程式碼、自己寫、自己測試、發現 bug 自己修，全部搞定才回來跟你說「做好了」。
        這就是 Agent Loop 的核心精神。
      </p>

      <CalloutBox type="insight" title="核心概念">
        Agent Loop 是 Claude Code 能「自己動手做事」的執行引擎。一個指令可能觸發數十次工具呼叫與模型推理，
        全程自動完成，不需要你一步步指揮。
      </CalloutBox>

      <h2 id="comparison">傳統 AI vs Agent Loop</h2>
      <p>
        先理解差異，才能感受 Agent Loop 的威力：
      </p>
      <ComparisonCards />

      <h2 id="stop-reasons">stop_reason — 迴圈的開關</h2>
      <p>
        Agent Loop 怎麼知道要繼續還是停下來？答案就是 <code>stop_reason</code>。
        每次 Claude 回應時都會帶上這個訊號，告訴系統下一步該怎麼做。
        點擊下方卡片查看詳細說明：
      </p>
      <StopReasonCards />

      <h2 id="flow-diagram">互動式流程圖</h2>
      <p>
        下面是 Agent Loop 的完整執行流程。<strong>點擊每個節點</strong>可以查看詳細說明：
      </p>
      <AgentLoopFlowDiagram />

      <h2 id="real-example">實戰範例：逐步走過一次完整迴圈</h2>
      <p>
        假設你對 Claude Code 說：
      </p>
      <p className="rounded-xl border-2 border-claude-orange/30 bg-claude-orange/5 px-5 py-3 text-lg font-medium dark:bg-claude-orange/10">
        「幫我在 maia_router.py 裡新增一個 /health 健康檢查的 API endpoint」
      </p>
      <p>
        你只說了這一句話。接下來，Claude Code 背後自動跑了 <strong>6 輪迭代</strong>。
        點擊「下一步」逐步走過整個過程：
      </p>
      <AgentLoopStepper />

      <CalloutBox type="insight" title="三個重點">
        <strong>1. 一個指令觸發 6 次迭代。</strong>你只說了一句話，Claude 自己跑了 6 輪「思考 → 行動 → 觀察」的迴圈。
        <br /><br />
        <strong>2. 它會自我修正。</strong>第 4 步測試失敗了，Claude 沒有停下來問你，而是自己分析錯誤、修復、再測試。
        <br /><br />
        <strong>3. stop_reason 是迴圈的開關。</strong>前 5 次都回傳 tool_use（還有事要做），最後回傳 end_turn（做完了）。
      </CalloutBox>

      <h2 id="pseudocode">Agent Loop 虛擬碼</h2>
      <p>
        理解了概念後，來看程式碼層面的實現。Agent Loop 的核心其實就是一個 <code>while(true)</code> 迴圈：
      </p>
      <CodeBlock
        language="typescript"
        filename="agent-loop.ts"
        code={`async function agentLoop(userMessage: string) {
  const messages = [{ role: "user", content: userMessage }];

  while (true) {
    // 1. 將對話歷史送入 Claude
    const response = await claude.messages.create({
      model: "claude-sonnet-4-20250514",
      system: systemPrompt,
      messages,
      tools: availableTools,
    });

    // 2. 將回應加入對話歷史
    messages.push({ role: "assistant", content: response.content });

    // 3. 根據 stop_reason 決定下一步
    switch (response.stop_reason) {
      case "end_turn":
        // ✅ 任務完成，回傳結果
        return extractText(response.content);

      case "tool_use":
        // 🔧 執行工具，結果塞回對話
        const results = await executeTools(response.content);
        messages.push({ role: "user", content: results });
        break; // 繼續迴圈

      case "max_tokens":
        // ✂️ 被截斷，讓模型繼續
        messages.push({
          role: "user",
          content: "請繼續你的回應。"
        });
        break;
    }
  }
}`}
      />

      <h2 id="safety-limits">安全機制</h2>
      <p>
        Agent Loop 不會無限跑下去。系統設有多重保護：
      </p>
      <ul>
        <li>
          <strong>最大迭代次數</strong> — 超過上限會強制停止並通知你
        </li>
        <li>
          <strong>Token 預算</strong> — 總消耗受監控，接近上限時會壓縮上下文
        </li>
        <li>
          <strong>逾時保護</strong> — 單一工具執行上限 120 秒，避免阻塞
        </li>
      </ul>

      <CalloutBox type="warning" title="注意迴圈行為">
        如果代理反覆執行相同操作（重複讀同一個檔案、重試同一個指令），通常是提示語不夠明確。
        此時應該中斷代理重新調整提示語，不要等迴圈自然結束浪費 token。
      </CalloutBox>

      <h2 id="debugging">除錯技巧</h2>
      <p>
        有效除錯的三個觀察點：
      </p>
      <ol>
        <li>
          <strong>觀察工具呼叫序列</strong> — 如果順序不合理（先寫再讀），代表提示語需要調整
        </li>
        <li>
          <strong>檢查工具輸入參數</strong> — 檔案路徑是否正確、指令語法是否正確
        </li>
        <li>
          <strong>追蹤 stop_reason</strong> — 連續 <code>max_tokens</code> 代表回應太冗長
        </li>
      </ol>

      <CodeBlock
        language="bash"
        code={`# 透過 verbose 模式觀察 Agent Loop 的行為
claude --verbose

# 使用 API 模式追蹤每次迭代
claude api --output-format json 2>debug.log`}
      />

      <CalloutBox type="tip" title="實務建議">
        讓目標明確且可驗證。「修改 app.ts 中的 getUser 函式，讓它支援以 email 查詢」
        比「改善 getUser 函式」好得多。明確的目標能幫助代理更快判斷何時結束迴圈。
      </CalloutBox>
    </>
  );
}

function S02ToolSystem() {
  return (
    <>
      <h2 id="tool-system-overview">工具系統概覽</h2>
      <p>
        <strong>一句話解釋：</strong>工具系統就是 Claude Code 的「手和腳」— 讓 AI 不只會說，還會做。
      </p>
      <p>
        想像你請了一個超強工程師，但他被關在一個沒有鍵盤、沒有螢幕的房間裡。
        他再聰明也沒用，因為他碰不到任何東西。<strong>工具系統</strong>就是打開那扇門的鑰匙 —
        它讓 Claude 可以讀檔案、寫程式、跑測試、搜尋程式碼。
      </p>

      <CalloutBox type="insight" title="核心設計原則">
        每個工具做好一件事。Read 只讀、Bash 只跑、Grep 只搜。
        這種單一職責設計讓代理能靈活組合工具來完成複雜任務。
      </CalloutBox>

      <h2 id="toolbox">工具箱 — 8 大內建工具</h2>
      <p>
        Claude Code 配備了 8 個內建工具。<strong>點擊任一工具卡片</strong>查看詳細說明和 Python 範例：
      </p>
      <ToolboxCards />

      <h2 id="permission-model">權限模型 — 三道安全閘門</h2>
      <p>
        工具強大，但也需要控制。Claude Code 用三個層級來管理工具權限。
        <strong>點擊每個層級</strong>查看哪些工具屬於該層級：
      </p>
      <PermissionLevels />

      <CalloutBox type="warning" title="最小權限原則">
        只授予代理完成當前任務所需的最低權限。權限過於寬鬆不會讓代理更聰明，
        只會增加意外損害的風險。
      </CalloutBox>

      <h2 id="execution-flow">工具執行流程</h2>
      <p>
        當 Claude 決定使用工具時，背後會經過四個階段。
        <strong>點擊「下一步」</strong>逐步走過整個流程：
      </p>
      <ToolExecutionFlow />

      <h2 id="permission-config">權限配置建構器</h2>
      <p>
        權限設定存放在 <code>.claude/settings.json</code> 中。
        下方是互動式配置工具 — <strong>點擊權限標籤切換層級</strong>，右側即時預覽設定檔：
      </p>
      <PermissionConfigBuilder />

      <h2 id="config-strategy">配置策略建議</h2>
      <ol>
        <li>
          <strong>白名單模式</strong> — 只允許特定指令，適合生產環境
        </li>
        <li>
          <strong>漸進式開放</strong> — 從嚴格開始，根據需求逐步放寬
        </li>
        <li>
          <strong>指令級控制</strong> — 用 <code>Bash(pytest)</code> 語法精細控制
        </li>
      </ol>

      <CodeBlock
        language="python"
        filename="permission_check.py"
        code={`# 權限檢查的核心邏輯
def check_tool_permission(tool: str, command: str = "") -> str:
    """
    回傳 'allow' | 'ask' | 'deny'
    """
    settings = load_settings(".claude/settings.json")

    # 1. 檢查 deny 清單（最高優先）
    full_name = f"{tool}({command})" if command else tool
    if full_name in settings["permissions"]["deny"]:
        return "deny"  # 直接拒絕，不問使用者

    # 2. 檢查 allow 清單
    if full_name in settings["permissions"]["allow"]:
        return "allow"  # 自動執行，不需確認

    # 3. 都不在 → 預設詢問使用者
    return "ask"

# 範例：
check_tool_permission("Read")            # → "allow"
check_tool_permission("Bash", "pytest")  # → "allow"
check_tool_permission("Edit")            # → "ask"
check_tool_permission("Bash", "rm -rf")  # → "deny"`}
      />

      <CalloutBox type="tip" title="實務建議">
        新專案建議從這個配置開始：允許所有唯讀工具（Read, Glob, Grep）+ 常用測試指令（pytest, git status），
        其餘全部設為需要確認。使用一段時間後，再把常用且安全的操作加入 allow 清單。
      </CalloutBox>
    </>
  );
}

function S03TodoWritePlanning() {
  return (
    <>
      <h2 id="todowrite-overview">TodoWrite 概覽</h2>
      <p>
        TodoWrite 是 Claude Code 用於結構化任務管理的專用工具。它讓代理能夠建立、
        追蹤並更新任務清單，將複雜的工作流拆解為可管理的步驟。TodoWrite 不只是一個
        便利工具，它是代理展現思考過程、讓使用者了解進度的關鍵機制。
      </p>
      <p>
        TodoWrite 的設計哲學是：<strong>讓代理的計畫可見、可追蹤、可驗證</strong>。
        使用者不必猜測代理在做什麼或做到哪裡，因為任務清單會即時反映代理的工作狀態。
      </p>

      <h2 id="task-data-structure">任務資料結構</h2>
      <p>
        每個任務項目包含三個必要欄位，構成 TodoWrite 的最小資料單元：
      </p>
      <CodeBlock
        language="typescript"
        filename="todo-item.ts"
        code={`interface TodoItem {
  // 任務的祈使句描述（例如：「修復登入驗證邏輯」）
  content: string;

  // 任務狀態
  status: "pending" | "in_progress" | "completed";

  // 進行中時顯示的動名詞形式（例如：「修復登入驗證邏輯中」）
  activeForm: string;
}`}
      />
      <CalloutBox type="info" title="雙形式描述設計">
        每個任務都需要兩種描述形式：<code>content</code> 是祈使句（做什麼），
        <code>activeForm</code> 是現在進行式（正在做什麼）。這種設計讓任務清單
        在不同情境下都能自然地呈現狀態。
      </CalloutBox>

      <h2 id="task-states">任務狀態管理</h2>
      <p>
        任務狀態遵循嚴格的生命週期管理規則：
      </p>
      <ul>
        <li>
          <strong>pending（待辦）</strong>：任務已識別但尚未開始。新建立的任務都從此狀態開始。
        </li>
        <li>
          <strong>in_progress（進行中）</strong>：代理正在處理的任務。
          <strong>任何時刻最多只能有一個任務處於此狀態</strong>。
        </li>
        <li>
          <strong>completed（已完成）</strong>：任務已成功完成。只有在確實完成且驗證通過後
          才能標記為此狀態。
        </li>
      </ul>
      <div className="ascii-diagram">
        <pre>{`
  任務狀態生命週期：

  [建立] --> pending --> in_progress --> completed
                ^            |
                |            v
                +--- (發現阻礙，建立新子任務)
        `}</pre>
      </div>

      <CodeBlock
        language="typescript"
        filename="todowrite-usage.ts"
        code={`// 建立任務清單
const todos = [
  {
    content: "搜尋現有程式碼中的 API 端點",
    status: "in_progress" as const,
    activeForm: "搜尋現有 API 端點中"
  },
  {
    content: "新增使用者認證 middleware",
    status: "pending" as const,
    activeForm: "新增使用者認證 middleware 中"
  },
  {
    content: "撰寫整合測試",
    status: "pending" as const,
    activeForm: "撰寫整合測試中"
  },
  {
    content: "執行測試並修復問題",
    status: "pending" as const,
    activeForm: "執行測試並修復問題中"
  }
];

// 完成第一個任務，開始第二個
const updatedTodos = [
  { ...todos[0], status: "completed" as const },
  { ...todos[1], status: "in_progress" as const },
  { ...todos[2] },
  { ...todos[3] }
];`}
      />

      <h2 id="when-to-use">何時使用 TodoWrite</h2>
      <p>
        TodoWrite 並非所有場景都適用。使用過度會增加不必要的 token 消耗，
        使用不足則讓複雜任務難以追蹤。以下是明確的使用準則：
      </p>

      <h3 id="should-use">應該使用的場景</h3>
      <ul>
        <li>任務需要三個或以上的步驟</li>
        <li>使用者提供了多個待辦事項（編號清單或逗號分隔）</li>
        <li>任務涉及跨檔案的修改</li>
        <li>需要按順序執行且前後步驟有依賴關係</li>
        <li>使用者明確要求使用任務清單</li>
      </ul>

      <h3 id="should-not-use">不應該使用的場景</h3>
      <ul>
        <li>只有單一簡單任務（例如「讀取這個檔案」）</li>
        <li>任務可以在三步以內完成的瑣碎操作</li>
        <li>純資訊查詢或對話問答</li>
        <li>任務本身就是一步到位的操作</li>
      </ul>

      <CalloutBox type="warning" title="避免過度使用">
        不要對每個請求都建立任務清單。對於「幫我讀取 package.json」這樣的簡單指令，
        直接執行就好。過度使用 TodoWrite 會讓使用者覺得代理在拖延時間，
        同時也浪費了寶貴的 token 預算。
      </CalloutBox>

      <h2 id="task-decomposition">任務拆解最佳實踐</h2>
      <p>
        好的任務拆解是 TodoWrite 發揮效用的關鍵。以下是經過驗證的拆解原則：
      </p>
      <ol>
        <li>
          <strong>具體且可驗證</strong>：每個任務應該有明確的完成條件。
          「改善程式碼」不是好的任務，「將 getUserById 函式重構為 async/await 語法」才是。
        </li>
        <li>
          <strong>粒度適中</strong>：太細碎的任務會造成管理負擔，太粗略的任務則無法有效追蹤。
          一般來說，每個任務應該對應一到三次工具呼叫。
        </li>
        <li>
          <strong>按依賴排序</strong>：將有依賴關係的任務按正確順序排列。
          例如「建立資料模型」應該排在「實作 API 端點」之前。
        </li>
        <li>
          <strong>包含驗證步驟</strong>：在修改程式碼後加入「執行測試」或「驗證建構」
          作為獨立的任務項目。
        </li>
      </ol>

      <CodeBlock
        language="typescript"
        filename="good-task-decomposition.ts"
        code={`// 好的任務拆解範例：「為專案新增使用者註冊功能」
const wellDecomposedTasks = [
  {
    content: "檢查現有的使用者模型與認證架構",
    status: "pending" as const,
    activeForm: "檢查現有使用者模型與認證架構中"
  },
  {
    content: "建立 POST /api/register 端點與請求驗證",
    status: "pending" as const,
    activeForm: "建立註冊 API 端點中"
  },
  {
    content: "實作密碼雜湊與使用者建立邏輯",
    status: "pending" as const,
    activeForm: "實作密碼雜湊與使用者建立邏輯中"
  },
  {
    content: "新增輸入驗證與錯誤處理",
    status: "pending" as const,
    activeForm: "新增輸入驗證與錯誤處理中"
  },
  {
    content: "撰寫註冊流程的單元測試",
    status: "pending" as const,
    activeForm: "撰寫註冊流程單元測試中"
  },
  {
    content: "執行全部測試並修復失敗項目",
    status: "pending" as const,
    activeForm: "執行測試並修復問題中"
  }
];`}
      />

      <h2 id="completion-rules">完成標記規則</h2>
      <p>
        正確地標記任務完成狀態是維護任務清單可信度的關鍵。以下是嚴格的規則：
      </p>
      <ul>
        <li>完成一個任務後必須<strong>立即</strong>更新狀態，不要批次更新。</li>
        <li>只有在任務<strong>完全完成</strong>時才能標記為 completed。部分完成、遇到錯誤或被阻擋的任務必須保持 in_progress。</li>
        <li>遇到阻擋時，應建立新的子任務來描述需要解決的問題。</li>
        <li>不再相關的任務應該從清單中移除，而非標記為完成。</li>
      </ul>

      <CalloutBox type="insight" title="任務清單的信任契約">
        TodoWrite 建立的不只是一個技術性的任務追蹤系統，更是代理與使用者之間的信任契約。
        當使用者看到一個任務被標記為「已完成」，他們期望該任務確實已經被正確地完成了。
        虛假的完成標記會摧毀這份信任。
      </CalloutBox>
    </>
  );
}

function S04Subagents() {
  return (
    <>
      <h2 id="subagent-concept">子代理的概念</h2>
      <p>
        子代理（Subagent）是從主代理中衍生出來、擁有獨立上下文窗口的隔離執行環境。
        透過 Agent 工具，主代理可以將特定子任務委派給子代理處理，而不會污染自身的上下文。
        這個機制是 Claude Code 處理大規模任務的關鍵架構。
      </p>
      <p>
        子代理的核心價值在於<strong>上下文隔離</strong>。當主代理需要探索一個大型程式碼庫、
        分析數十個檔案、或者執行一系列試錯操作時，這些過程會產生大量的中間資訊。
        如果全部留在主對話中，會快速耗盡上下文窗口。子代理可以在獨立空間中處理這些工作，
        只將精煉後的結果回傳給主代理。
      </p>

      <h2 id="agent-tool-usage">Agent 工具的使用</h2>
      <p>
        Agent 工具是建立子代理的入口。你可以透過提示語指定子代理的任務、約束條件
        和預期的回傳格式：
      </p>
      <CodeBlock
        language="typescript"
        filename="agent-tool-interface.ts"
        code={`interface AgentToolInput {
  // 給子代理的任務描述（作為 prompt）
  prompt: string;
}

// Agent 工具使用範例（在 system prompt 中引導）
// 「使用 Agent 工具來探索 src/ 目錄的程式碼結構，
//   回報所有 React 元件的檔案路徑和匯出名稱。」`}
      />

      <h2 id="subagent-types">子代理的類型</h2>
      <p>
        根據任務性質的不同，子代理可以扮演不同的角色。以下是常見的子代理類型：
      </p>

      <h3 id="explore-agent">探索型子代理（Explore）</h3>
      <p>
        專門用於搜尋和理解程式碼庫。它會大量使用 Glob、Grep 和 Read 工具，
        在目標目錄中找出相關檔案、函式和模式，然後將結構化的發現回傳給主代理。
      </p>
      <CodeBlock
        language="text"
        filename="explore-agent-prompt.txt"
        code={`你是一個程式碼探索子代理。你的任務是：

1. 在 src/services/ 目錄中搜尋所有使用了 database 連線的檔案
2. 列出每個檔案中的資料庫查詢函式名稱
3. 標示哪些函式缺少錯誤處理

只回報發現結果，不要修改任何檔案。
以結構化清單格式回傳你的發現。`}
      />

      <h3 id="plan-agent">規劃型子代理（Plan）</h3>
      <p>
        用於分析任務需求並制定執行計畫。它會閱讀相關檔案、理解架構，
        然後產出一份結構化的行動計畫供主代理執行。
      </p>

      <h3 id="quality-agent">品質檢查子代理（Code Quality Enforcer）</h3>
      <p>
        在程式碼修改完成後，派遣品質檢查子代理審查變更的程式碼，
        檢查是否違反編碼規範、是否有潛在的 bug、是否遺漏了測試。
      </p>

      <h2 id="context-isolation">上下文隔離的效益</h2>
      <p>
        上下文隔離是子代理最重要的特性。以下是它帶來的具體效益：
      </p>
      <ul>
        <li>
          <strong>節省 Token</strong>：子代理探索的中間過程（例如讀取了 50 個檔案的內容）
          不會留在主代理的上下文中，只有精煉後的結論會被帶回。
        </li>
        <li>
          <strong>避免污染</strong>：多次試錯產生的失敗記錄不會影響主代理的判斷力。
          子代理可以自由嘗試，主代理只看到最終的成功結果。
        </li>
        <li>
          <strong>專注單一任務</strong>：子代理的 system prompt 可以針對特定任務
          進行最佳化，不需要攜帶主對話中的所有脈絡。
        </li>
      </ul>

      <div className="ascii-diagram">
        <pre>{`
  +-------------------------------+
  |         主代理上下文           |
  |  +--------+    +-----------+  |
  |  | 使用者  |    | 任務狀態  |  |
  |  | 指令    |    | 追蹤      |  |
  |  +--------+    +-----------+  |
  |                               |
  |  [Agent 工具呼叫]             |
  |       |            |          |
  |       v            v          |
  |  +--------+   +--------+     |
  |  | 子代理1 |   | 子代理2 |    |
  |  | 探索型  |   | 品質型  |    |
  |  | ------  |   | ------  |    |
  |  | 獨立    |   | 獨立    |    |
  |  | 上下文  |   | 上下文  |    |
  |  +---+----+   +---+----+     |
  |      |            |          |
  |      v            v          |
  |  [精煉結果]   [審查報告]      |
  +-------------------------------+
        `}</pre>
      </div>

      <h2 id="background-subagents">背景子代理</h2>
      <p>
        子代理可以在背景中執行，讓主代理繼續處理其他工作。
        這在需要平行處理多個獨立任務時特別有用：
      </p>
      <CodeBlock
        language="text"
        code={`# 主代理可以同時派遣多個子代理：
# 1. 子代理 A（背景）：探索 src/ 目錄的架構
# 2. 子代理 B（背景）：分析 test/ 的測試覆蓋率
# 3. 主代理繼續處理使用者的其他問題

# 背景子代理完成後，結果會自動回報給主代理`}
      />

      <h2 id="result-aggregation">結果彙整策略</h2>
      <p>
        子代理回傳的結果需要被主代理有效整合。以下是建議的策略：
      </p>
      <ol>
        <li>
          <strong>要求結構化輸出</strong>：在子代理的提示語中明確指定回傳格式，
          例如 JSON 結構或特定的文字格式。
        </li>
        <li>
          <strong>限制回傳長度</strong>：要求子代理只回報關鍵發現，
          而非完整的探索過程。過長的回傳會抵消上下文隔離的效益。
        </li>
        <li>
          <strong>明確標示不確定性</strong>：子代理應標示哪些發現是確定的、
          哪些需要進一步確認，幫助主代理做出正確判斷。
        </li>
      </ol>

      <CalloutBox type="insight" title="子代理的本質">
        子代理本質上是一種「用 token 換上下文空間」的策略。
        建立子代理會消耗額外的 token（因為需要傳送 system prompt 和任務描述），
        但它能大幅延長主代理的有效工作壽命。在處理大型專案時，
        善用子代理的團隊幾乎總是比單一長對話更有效率。
      </CalloutBox>
    </>
  );
}

function S05SkillsKnowledge() {
  return (
    <>
      <h2 id="skills-overview">Skills 機制概覽</h2>
      <p>
        Skills（技能）是 Claude Code 中用於動態載入領域知識和可執行指令的機制。
        每個 Skill 由一個 SKILL.md 檔案定義，包含了該技能的觸發條件、
        執行指令和相關知識。Skills 讓你能夠擴展代理的能力範圍，
        而不需要在每次對話時手動提供背景資訊。
      </p>
      <p>
        Skills 的設計理念是：<strong>知識應該在需要時自動載入，而非預先塞滿上下文</strong>。
        這種「按需載入」的模式能有效利用有限的上下文窗口。
      </p>

      <h2 id="skill-md-structure">SKILL.md 檔案結構</h2>
      <p>
        每個 Skill 都由一個 SKILL.md 檔案定義，通常放在 <code>.claude/</code>
        目錄或其子目錄中。檔案使用 frontmatter 定義元資料，Markdown 本文包含指令和知識：
      </p>
      <CodeBlock
        language="markdown"
        filename=".claude/skills/deploy/SKILL.md"
        code={`---
description: "部署應用程式到生產環境"
command: "/deploy"
triggers:
  - "部署"
  - "deploy"
  - "上線"
---

# 部署技能

## 執行步驟

1. 確認所有測試通過
2. 建構生產版本
3. 執行部署指令

## 注意事項

- 部署前必須確認分支在 main 上
- 檢查是否有未提交的變更
- 驗證環境變數是否已正確設定

## 指令範本

\\\`\\\`\\\`bash
npm run build
npm run deploy:production
\\\`\\\`\\\``}
      />

      <CalloutBox type="info" title="SKILL.md 格式說明">
        <code>description</code> 會顯示在技能清單中幫助使用者了解技能用途。
        <code>command</code> 定義了觸發此技能的斜線指令。
        <code>triggers</code> 定義了自動觸發的關鍵字。
      </CalloutBox>

      <h2 id="trigger-mechanisms">觸發機制</h2>
      <p>
        Skills 有兩種觸發方式：
      </p>

      <h3 id="slash-commands">斜線指令（Slash Commands）</h3>
      <p>
        使用者可以在對話中輸入斜線指令來明確觸發特定技能。
        例如輸入 <code>/deploy</code> 會載入部署技能的所有知識和指令。
        這是最直覺且最可控的觸發方式。
      </p>

      <h3 id="auto-triggers">自動觸發（Automatic Triggers）</h3>
      <p>
        當使用者的輸入匹配了 SKILL.md 中定義的 <code>triggers</code> 關鍵字時，
        系統會自動載入對應的技能。自動觸發讓使用者不需要記住具體的指令名稱，
        自然語言描述就能啟動正確的技能。
      </p>

      <h2 id="knowledge-loading-order">知識載入順序</h2>
      <p>
        Claude Code 的知識載入遵循明確的優先順序，理解這個順序對於避免衝突至關重要：
      </p>
      <div className="ascii-diagram">
        <pre>{`
  知識載入優先順序（由高到低）：

  1. System Prompt（系統提示）
     |
  2. CLAUDE.md（專案根目錄）
     |
  3. CLAUDE.md（子目錄，更具體的設定）
     |
  4. CLAUDE.md（使用者家目錄，全域設定）
     |
  5. Skills（被觸發的技能）
     |
  6. 對話歷史與工具結果
        `}</pre>
      </div>
      <p>
        當多個層級的指令衝突時，優先順序較高的指令會覆蓋較低的。
        例如，專案根目錄的 CLAUDE.md 中的規則會優先於使用者家目錄的全域設定。
      </p>

      <CodeBlock
        language="text"
        code={`# 知識載入範例

# 1. 全域 CLAUDE.md（~/.claude/CLAUDE.md）
#    定義所有專案共用的偏好設定

# 2. 專案 CLAUDE.md（project-root/CLAUDE.md）
#    定義此專案的編碼規範、架構慣例

# 3. 子目錄 CLAUDE.md（project-root/src/api/CLAUDE.md）
#    定義 API 層的特定規則

# 4. 技能載入（.claude/skills/*/SKILL.md）
#    當觸發條件符合時動態載入`}
      />

      <h2 id="creating-custom-skills">建立自定義 Skill</h2>
      <p>
        建立有效的自定義 Skill 需要遵循以下原則：
      </p>
      <ol>
        <li>
          <strong>明確的觸發條件</strong>：triggers 關鍵字應該足夠具體，
          避免在不相關的對話中被意外觸發。
        </li>
        <li>
          <strong>完整的執行指令</strong>：Skill 內容應包含代理完成任務所需的所有資訊，
          避免代理還需要額外搜尋或猜測。
        </li>
        <li>
          <strong>清晰的約束條件</strong>：明確列出「應該做什麼」和「不應該做什麼」，
          防止代理越界操作。
        </li>
        <li>
          <strong>驗證步驟</strong>：包含如何驗證技能執行成功的步驟，
          讓代理能自我檢查結果。
        </li>
      </ol>

      <CodeBlock
        language="markdown"
        filename=".claude/skills/code-review/SKILL.md"
        code={`---
description: "執行程式碼審查並產出報告"
command: "/review"
triggers:
  - "review"
  - "code review"
  - "程式碼審查"
---

# 程式碼審查技能

## 審查清單

對於每個變更的檔案，檢查以下項目：

- [ ] 是否遵循專案的命名慣例
- [ ] 是否有適當的錯誤處理
- [ ] 是否有潛在的效能問題
- [ ] 是否有安全性風險（SQL injection、XSS 等）
- [ ] 是否有足夠的測試覆蓋

## 輸出格式

以 Markdown 表格呈現審查結果，每個問題標示嚴重等級。

## 約束條件

- 不要自動修復問題，只做報告
- 不要修改任何檔案
- 將審查結果以清單格式回報`}
      />

      <h2 id="skill-claude-md-integration">Skill 與 CLAUDE.md 的搭配</h2>
      <p>
        CLAUDE.md 定義了代理的「基礎人格」和「通用規則」，
        而 Skills 則提供了「特定任務的專業知識」。兩者的搭配策略：
      </p>
      <ul>
        <li>
          <strong>CLAUDE.md</strong>：放置通用的編碼規範、禁止行為、偏好設定、
          專案架構說明等「持久性」知識。
        </li>
        <li>
          <strong>SKILL.md</strong>：放置特定工作流的步驟指引、檢查清單、
          指令範本等「任務性」知識。
        </li>
      </ul>

      <CalloutBox type="tip" title="避免重複">
        不要在 SKILL.md 中重複 CLAUDE.md 已經定義的規則。
        Skills 會在 CLAUDE.md 載入後被觸發載入，所以它可以引用（但不應重複）
        CLAUDE.md 中的規則。重複定義會浪費上下文空間，也增加維護負擔。
      </CalloutBox>
    </>
  );
}

function S06ContextCompaction() {
  return (
    <>
      <h2 id="context-window-limits">上下文窗口的限制</h2>
      <p>
        每個 Claude Code 對話都有固定的上下文窗口大小。隨著對話持續進行，
        系統提示、使用者輸入、代理回應、工具呼叫與結果都會持續累積。
        當累積的 token 數量接近上下文窗口上限時，系統就需要進行上下文壓縮（Compaction）
        來騰出空間讓對話繼續。
      </p>
      <p>
        理解壓縮機制至關重要，因為它直接影響代理的「記憶力」。
        被壓縮掉的資訊就等同於被遺忘。如果關鍵指令或重要的程式碼片段在壓縮過程中被移除，
        代理的後續行為可能會偏離預期。
      </p>

      <h2 id="compaction-trigger">壓縮觸發條件</h2>
      <p>
        上下文壓縮不是在達到絕對上限時才觸發。系統會在 token 使用量達到一定閾值時
        主動進行壓縮，以確保始終有足夠的空間容納新的工具呼叫與回應：
      </p>
      <div className="ascii-diagram">
        <pre>{`
  上下文窗口使用情況：

  |<------- 上下文窗口總大小 -------->|
  |                                   |
  [System][歷史對話][工具結果][新空間] |
  |                                   |
  |----- 已使用 -----|----- 剩餘 ----|
                     ^
                     |
              當剩餘空間不足時
              觸發壓縮
        `}</pre>
      </div>

      <CalloutBox type="insight" title="壓縮的代價">
        壓縮本身也消耗 token。系統需要讀取現有對話歷史、判斷哪些資訊重要、
        生成壓縮後的摘要。這意味著頻繁觸發壓縮會額外消耗 token 預算。
        最好的策略是從一開始就設計精簡的對話模式，減少壓縮的觸發次數。
      </CalloutBox>

      <h2 id="compaction-strategy">壓縮策略</h2>
      <p>
        Claude Code 的壓縮策略會嘗試保留最重要的資訊，同時移除冗餘和低價值的內容。
        以下是壓縮的優先保留與優先移除規則：
      </p>

      <h3 id="preserved-info">優先保留的資訊</h3>
      <ul>
        <li>System Prompt 中的核心指令</li>
        <li>使用者最近的輸入與代理最近的回應</li>
        <li>當前進行中的任務狀態（TodoWrite）</li>
        <li>最近的工具呼叫結果（尤其是最後幾輪）</li>
        <li>被明確標記為重要的資訊</li>
      </ul>

      <h3 id="removed-info">優先移除的資訊</h3>
      <ul>
        <li>早期對話輪次中的完整工具輸出（例如大量的檔案內容）</li>
        <li>已完成的子任務的詳細過程記錄</li>
        <li>重複的資訊或已被後續操作覆蓋的結果</li>
        <li>冗長的錯誤訊息和除錯輸出</li>
      </ul>

      <h2 id="minimize-info-loss">最小化資訊遺失的策略</h2>
      <p>
        以下是經過實踐驗證的策略，能幫助你在長對話中保持代理的有效性：
      </p>

      <h3 id="strategy-structured-instructions">策略一：結構化指令設計</h3>
      <p>
        將重要的規則和約束放在 CLAUDE.md 中而非對話中。CLAUDE.md 的內容
        在每次 API 呼叫時都會作為 system prompt 的一部分送入，不受壓縮影響。
      </p>
      <CodeBlock
        language="markdown"
        filename="CLAUDE.md"
        code={`# 核心開發規則（此處的指令不會被壓縮移除）

## 編碼規範
- 所有函式必須有 TypeScript 型別標註
- 錯誤處理必須明確，禁止靜默吞噬錯誤
- 變數命名使用 camelCase

## 禁止行為
- 禁止使用 any 型別
- 禁止使用 console.log 進行除錯（應使用專案的 logger）
- 禁止直接修改 production 分支`}
      />

      <h3 id="strategy-subagents">策略二：善用子代理</h3>
      <p>
        將需要大量探索的工作委派給子代理。子代理的探索過程不會累積在主對話的上下文中，
        只有最終結論會回到主代理。這是最有效的上下文管理手段之一。
      </p>

      <h3 id="strategy-concise-prompts">策略三：精簡的提示語</h3>
      <p>
        避免在對話中反覆重述相同的指令或背景資訊。如果需要提醒代理某個規則，
        應該簡短地引用（例如「按照 CLAUDE.md 中的 API 設計規範」），
        而非完整重述規則內容。
      </p>

      <h3 id="strategy-task-segmentation">策略四：任務分段</h3>
      <p>
        將大型任務拆分為多個獨立的對話。每個對話處理一個子任務，完成後將結果
        以簡潔的摘要帶入下一個對話。這避免了單一對話的上下文被撐爆。
      </p>

      <CodeBlock
        language="text"
        code={`# 任務分段範例

# 對話 1：分析現有架構
# 輸出：架構摘要文件（儲存到檔案中）

# 對話 2：實作新功能（讀取架構摘要作為輸入）
# 輸出：程式碼變更

# 對話 3：測試與修復（讀取變更記錄作為輸入）
# 輸出：完整的測試報告`}
      />

      <h2 id="compaction-signals">壓縮即將發生的信號</h2>
      <p>
        以下跡象暗示上下文可能即將被壓縮或已接近上限：
      </p>
      <ul>
        <li>代理開始「遺忘」早期對話中提到的細節</li>
        <li>代理重複詢問之前已經回答過的問題</li>
        <li>回應品質下降，出現與先前矛盾的行為</li>
        <li>代理對先前達成的共識表現出不確定</li>
      </ul>

      <CalloutBox type="warning" title="壓縮後的行為偏移">
        壓縮後代理的行為可能會發生微妙的偏移。最常見的問題是代理忘記了
        對話早期建立的特定約束條件。如果你發現代理開始違反先前同意的規則，
        很可能是那些規則在壓縮中被移除了。此時應該將關鍵規則移入 CLAUDE.md，
        或開啟一個新的對話並明確重述規則。
      </CalloutBox>

      <h2 id="monitoring-context">監控上下文使用</h2>
      <p>
        養成監控上下文使用量的習慣，能幫助你在壓縮發生前主動採取措施：
      </p>
      <CodeBlock
        language="bash"
        code={`# 在 Claude Code 中檢查當前 session 的 token 使用情況
# 可以透過 API 回應中的 usage 欄位追蹤

# API 回應中的 token 使用資訊
# {
#   "usage": {
#     "input_tokens": 45230,
#     "output_tokens": 12847,
#     "cache_creation_input_tokens": 8192,
#     "cache_read_input_tokens": 37038
#   }
# }`}
      />

      <CalloutBox type="tip" title="快取的重要性">
        Claude API 支援 prompt caching，能將 system prompt 和早期對話內容快取起來。
        這不僅降低成本（快取讀取的 token 計費較低），也能在壓縮後保留更多的有效資訊。
        確保你的 CLAUDE.md 和穩定的系統提示放在對話的最前面，以最大化快取效益。
      </CalloutBox>
    </>
  );
}

// ============================================================================
// Module 2: Multi-Agent (S07-S12) -- Placeholder Content
// ============================================================================

function S07TaskGraph() {
  return (
    <>
      <h2 id="dag-task-modeling">DAG 任務建模</h2>
      <p>
        任務圖（Task Graph）利用有向無環圖（DAG）來建模複雜工作流中的任務依賴關係。
        每個節點代表一個獨立任務，邊代表執行依賴。透過拓撲排序，
        系統能夠找出可以平行執行的任務群組，最大化執行效率。
      </p>
      <CodeBlock
        language="typescript"
        filename="task-graph.ts"
        code={`interface TaskNode {
  id: string;
  description: string;
  dependencies: string[];  // 依賴的任務 ID
  status: "pending" | "running" | "completed" | "failed";
}

// 範例：建構與部署流程的任務圖
const deploymentGraph: TaskNode[] = [
  { id: "lint", description: "程式碼檢查", dependencies: [], status: "pending" },
  { id: "test", description: "執行測試", dependencies: [], status: "pending" },
  { id: "build", description: "建構產出", dependencies: ["lint", "test"], status: "pending" },
  { id: "deploy", description: "部署上線", dependencies: ["build"], status: "pending" },
];`}
      />

      <h2 id="parallel-execution">平行執行策略</h2>
      <p>
        當任務圖中多個任務沒有相互依賴時，它們可以被同時派發給不同的子代理。
        主代理負責監控任務圖的狀態並在所有前置任務完成後啟動下游任務。
      </p>

      <h2 id="failure-handling">任務失敗處理</h2>
      <p>
        當任務圖中的某個節點失敗時，所有依賴該節點的下游任務都應該被標記為阻塞狀態。
        系統不應靜默跳過失敗的任務，而應明確通報錯誤並等待處置決策。
      </p>

      <CalloutBox type="info" title="內容持續擴充中">
        本章節的完整內容正在撰寫中，將包含更詳細的任務圖實作範例、
        衝突解決機制與效能最佳化策略。
      </CalloutBox>
    </>
  );
}

function S08BackgroundTasks() {
  return (
    <>
      <h2 id="background-task-concept">背景任務機制</h2>
      <p>
        背景任務讓代理能夠在等待長時間操作完成的同時繼續處理其他工作。
        透過 Bash 工具的 <code>run_in_background</code> 參數，
        指令會在背景執行，代理不需要等待其完成即可繼續下一步。
      </p>
      <CodeBlock
        language="typescript"
        code={`// 背景執行範例
// Bash 工具呼叫時設定 run_in_background: true
// 代理會收到通知指出任務已在背景啟動
// 任務完成後系統會自動通知代理結果

// 適合背景執行的任務：
// - 執行完整的測試套件
// - 建構專案
// - 長時間的資料處理腳本
// - 部署流程`}
      />

      <h2 id="coordination-patterns">前景與背景協調</h2>
      <p>
        有效地協調前景與背景任務需要明確的任務邊界。前景任務應專注於不依賴
        背景結果的工作，例如撰寫文件或分析其他檔案。
        當背景任務完成後，代理應立即處理其結果。
      </p>

      <h2 id="monitoring">背景任務監控</h2>
      <p>
        背景任務的狀態可以透過系統通知來追蹤。代理在收到完成通知時
        應該評估結果是否符合預期，並決定是否需要後續處理。
      </p>

      <CalloutBox type="info" title="內容持續擴充中">
        本章節的完整內容正在撰寫中，將補充更多背景任務的實戰模式與錯誤處理策略。
      </CalloutBox>
    </>
  );
}

function S09AgentTeams() {
  return (
    <>
      <h2 id="team-architecture">代理團隊架構</h2>
      <p>
        代理團隊將多個專精代理組合在一起，各自負責不同的職責領域。
        例如，一個「全端開發團隊」可能包含前端專家代理、後端專家代理、
        測試專家代理和文件撰寫代理。協調者（Orchestrator）負責分配任務並整合成果。
      </p>
      <CodeBlock
        language="typescript"
        code={`// 代理團隊組成範例
const teamRoles = {
  orchestrator: "分析需求、分配任務、整合結果",
  frontend: "實作 React 元件與頁面邏輯",
  backend: "設計 API 端點與資料庫操作",
  tester: "撰寫測試案例與執行驗證",
  reviewer: "審查程式碼品質與安全性",
};`}
      />

      <h2 id="message-passing">訊息傳遞機制</h2>
      <p>
        代理之間透過檔案系統或結構化訊息進行通訊。
        常見模式是使用共享的任務追蹤檔案，每個代理讀取自己的任務並寫入結果。
      </p>

      <h2 id="role-specialization">角色特化與職責劃分</h2>
      <p>
        每個代理的 system prompt 應該針對其角色進行特化。
        前端代理不需要了解資料庫 schema，後端代理不需要了解 CSS 排版。
        角色特化能減少上下文消耗並提升每個代理的輸出品質。
      </p>

      <CalloutBox type="info" title="內容持續擴充中">
        本章節的完整內容正在撰寫中，將包含完整的代理團隊建立教學與通訊協定設計。
      </CalloutBox>
    </>
  );
}

function S10TeamProtocols() {
  return (
    <>
      <h2 id="protocol-design">協定設計原則</h2>
      <p>
        團隊協定定義了代理之間如何交接任務、如何處理衝突、如何整合輸出。
        一個好的協定應該是明確的、可驗證的，且能處理常見的異常情況。
      </p>
      <CodeBlock
        language="typescript"
        code={`// 團隊協定介面範例
interface TeamProtocol {
  taskHandoff: {
    format: "structured_json";
    requiredFields: ["task_id", "assignee", "context", "acceptance_criteria"];
  };
  conflictResolution: "orchestrator_decides" | "voting" | "priority_based";
  outputIntegration: {
    mergeStrategy: "sequential" | "parallel_merge";
    validationRequired: boolean;
  };
}`}
      />

      <h2 id="conflict-resolution">衝突解決</h2>
      <p>
        當多個代理的輸出互相矛盾時，需要明確的衝突解決機制。
        最常見的方式是由協調者代理進行最終裁決。
      </p>

      <h2 id="output-quality-control">成果品質控管</h2>
      <p>
        每個代理的輸出都應經過品質檢查才能被整合到最終結果中。
        品質檢查可以由專門的審查代理執行，或者在協定中定義自動化的驗證規則。
      </p>

      <CalloutBox type="info" title="內容持續擴充中">
        本章節的完整內容正在撰寫中，將深入探討多代理系統中的共識機制與品質保證策略。
      </CalloutBox>
    </>
  );
}

function S11AutonomousAgents() {
  return (
    <>
      <h2 id="autonomy-levels">自主性等級</h2>
      <p>
        自主代理的自主性可以從完全受控到高度自主，形成一個連續的光譜。
        較低的自主性意味著每一步都需要人類確認，較高的自主性則讓代理
        自行做出大多數決策。選擇適當的自主性等級取決於任務的風險程度。
      </p>
      <CodeBlock
        language="typescript"
        code={`// 自主性等級模型
enum AutonomyLevel {
  SUPERVISED = "supervised",     // 每步確認
  GUIDED = "guided",             // 關鍵決策確認
  AUTONOMOUS = "autonomous",     // 自主執行，異常時回報
  FULL_AUTO = "full_auto",       // 完全自動（僅限低風險）
}

// 根據操作類型設定自主性
const autonomyConfig = {
  readOperations: AutonomyLevel.AUTONOMOUS,
  writeOperations: AutonomyLevel.GUIDED,
  deleteOperations: AutonomyLevel.SUPERVISED,
  deployOperations: AutonomyLevel.SUPERVISED,
};`}
      />

      <h2 id="safety-guardrails">安全護欄</h2>
      <p>
        自主代理必須有明確的安全護欄，定義代理不得超越的行為邊界。
        這些護欄應該在 system prompt 和權限設定中雙重實施。
      </p>

      <h2 id="monitoring-logging">監控與日誌</h2>
      <p>
        自主代理的每一個操作都應該被記錄，以便事後審計和問題追溯。
        日誌應包含代理的決策理由、執行的工具呼叫、以及結果摘要。
      </p>

      <CalloutBox type="info" title="內容持續擴充中">
        本章節的完整內容正在撰寫中，將涵蓋自主代理的風險評估框架與即時監控系統設計。
      </CalloutBox>
    </>
  );
}

function S12WorktreeIsolation() {
  return (
    <>
      <h2 id="worktree-concept">Worktree 隔離原理</h2>
      <p>
        Git Worktree 允許同一個 Git 倉庫在不同目錄中同時檢出不同的分支。
        Claude Code 利用這個機制為平行執行的代理建立隔離的工作環境，
        避免多個代理同時修改相同檔案造成衝突。
      </p>
      <CodeBlock
        language="bash"
        code={`# Claude Code 內部使用 Worktree 的流程
# 1. 在 .claude/worktrees/ 下建立新的 worktree
git worktree add .claude/worktrees/feature-auth -b feature/auth

# 2. 代理在 worktree 中獨立工作
# 3. 完成後合併或保留變更

# 使用 EnterWorktree 工具進入 worktree
# 使用 ExitWorktree 工具離開（keep 或 remove）`}
      />

      <h2 id="enter-exit-worktree">進入與離開 Worktree</h2>
      <p>
        Claude Code 提供了 <code>EnterWorktree</code> 與 <code>ExitWorktree</code>
        工具來管理 worktree 的生命週期。進入 worktree 後，
        代理的所有檔案操作都限定在 worktree 的目錄範圍內。
      </p>

      <h2 id="parallel-branches">多分支平行開發</h2>
      <p>
        在多代理協作場景中，每個代理可以在自己的 worktree 中工作於獨立的分支。
        這讓多個功能的開發能夠真正平行進行，完成後再透過 Git 合併整合變更。
      </p>

      <CalloutBox type="info" title="內容持續擴充中">
        本章節的完整內容正在撰寫中，將補充 worktree 管理的進階模式與衝突處理策略。
      </CalloutBox>
    </>
  );
}

// ============================================================================
// Module 3: Real-World Architecture (S13-S18) -- Placeholder Content
// ============================================================================

function S13ControlProtocol() {
  return (
    <>
      <h2 id="protocol-components">控制協議的核心元件</h2>
      <p>
        控制協議定義了代理行為的框架，包括指令格式、回應規範、
        錯誤處理流程和審計追蹤。一個完善的控制協議能確保代理行為的可預測性和可審計性。
      </p>
      <CodeBlock
        language="typescript"
        code={`// 控制協議基本結構
interface ControlProtocol {
  inputFormat: {
    schema: "structured";
    validation: "strict";
  };
  outputFormat: {
    includeReasoning: boolean;
    includeConfidence: boolean;
    structuredResponse: boolean;
  };
  auditTrail: {
    logAllDecisions: boolean;
    logToolCalls: boolean;
    retentionDays: number;
  };
}`}
      />

      <h2 id="instruction-design">指令格式設計</h2>
      <p>
        好的指令格式應該是明確的、可解析的，且包含足夠的上下文讓代理做出正確的判斷。
        避免模糊或多義的指令，每條指令都應有明確的預期結果。
      </p>

      <h2 id="auditability">可審計性設計</h2>
      <p>
        所有代理的決策過程和操作記錄都應該可以被事後追溯。
        這對於除錯、合規審查和持續改進都至關重要。
      </p>

      <CalloutBox type="info" title="內容持續擴充中">
        本章節的完整內容正在撰寫中，將包含完整的控制協議設計範本與實作指南。
      </CalloutBox>
    </>
  );
}

function S14McpIntegration() {
  return (
    <>
      <h2 id="mcp-architecture">MCP 協定架構</h2>
      <p>
        Model Context Protocol（MCP）是一個開放協定，讓 Claude Code
        能夠連接外部服務和資料來源。MCP Server 充當代理與外部系統之間的橋梁，
        將外部功能封裝為代理可以呼叫的工具。
      </p>
      <CodeBlock
        language="json"
        filename=".claude/mcp.json"
        code={`{
  "mcpServers": {
    "database": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "postgresql://..."
      }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"]
    }
  }
}`}
      />

      <h2 id="mcp-server-setup">MCP Server 配置</h2>
      <p>
        MCP Server 透過設定檔進行配置。每個 server 定義了啟動指令、
        執行參數和環境變數。代理可以像使用內建工具一樣呼叫 MCP 提供的工具。
      </p>

      <h2 id="custom-mcp-tools">自訂 MCP 工具開發</h2>
      <p>
        你可以開發自己的 MCP Server 來封裝專案特定的功能。
        MCP SDK 提供了 TypeScript 和 Python 的實作框架。
      </p>

      <CalloutBox type="info" title="內容持續擴充中">
        本章節的完整內容正在撰寫中，將包含 MCP Server 開發教學與進階整合模式。
      </CalloutBox>
    </>
  );
}

function S15HooksSystem() {
  return (
    <>
      <h2 id="hooks-overview">Hooks 系統概覽</h2>
      <p>
        Hooks 讓你在代理生命週期的關鍵節點插入自定義邏輯。
        例如，在工具執行前驗證參數、在工具執行後記錄結果、
        或在特定條件下阻止操作。Hooks 是實現安全防護和品質控管的重要機制。
      </p>
      <CodeBlock
        language="json"
        filename=".claude/settings.json"
        code={`{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Bash command intercepted'"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "npx eslint --fix $CLAUDE_FILE_PATH"
          }
        ]
      }
    ]
  }
}`}
      />

      <h2 id="hook-types">Hook 類型</h2>
      <p>
        系統提供 PreToolUse（工具執行前）和 PostToolUse（工具執行後）兩種 Hook 類型。
        PreToolUse 可以阻止工具執行或修改輸入，PostToolUse 可以對輸出進行處理。
      </p>

      <h2 id="security-hooks">安全防護 Hooks</h2>
      <p>
        Hooks 在安全防護中扮演關鍵角色。例如可以在 Bash 工具執行前
        檢查指令是否包含危險操作，或在檔案寫入後自動執行 linter 確保程式碼品質。
      </p>

      <CalloutBox type="info" title="內容持續擴充中">
        本章節的完整內容正在撰寫中，將補充 Hook 的進階用法與實戰案例。
      </CalloutBox>
    </>
  );
}

function S16SessionStorage() {
  return (
    <>
      <h2 id="session-data-structure">Session 資料結構</h2>
      <p>
        Claude Code 的 Session 機制讓代理能夠在對話之間保留和恢復狀態。
        Session 資料包含對話歷史、任務進度和使用者偏好設定。
      </p>
      <CodeBlock
        language="typescript"
        code={`// Session 資料模型
interface SessionData {
  sessionId: string;
  createdAt: string;
  lastActiveAt: string;
  messages: Message[];
  metadata: {
    projectPath: string;
    branch: string;
    totalTokensUsed: number;
  };
}`}
      />

      <h2 id="cross-session-state">跨對話狀態延續</h2>
      <p>
        透過 Session 機制，代理可以在新的對話中恢復先前的上下文。
        這對於需要跨多個工作階段完成的大型任務特別有用。
      </p>

      <h2 id="session-management">Session 管理策略</h2>
      <p>
        定期清理過期的 Session 資料能避免儲存空間的浪費。
        建議根據專案需求設定 Session 的保留期限和最大數量。
      </p>

      <CalloutBox type="info" title="內容持續擴充中">
        本章節的完整內容正在撰寫中，將包含 Session 持久化的實作細節與最佳實踐。
      </CalloutBox>
    </>
  );
}

function S17ClaudeMdDesign() {
  return (
    <>
      <h2 id="claude-md-philosophy">CLAUDE.md 設計哲學</h2>
      <p>
        CLAUDE.md 是定義代理行為基準的核心設定檔。它決定了代理在特定專案中的
        編碼風格、安全約束、溝通方式和工作流程。好的 CLAUDE.md 設計能讓代理
        從第一次互動就表現出專業且一致的行為。
      </p>
      <CodeBlock
        language="markdown"
        filename="CLAUDE.md"
        code={`# 專案名稱

## 技術棧
- 框架：Next.js 14 (App Router)
- 語言：TypeScript (strict mode)
- 樣式：Tailwind CSS

## 編碼規範
- 使用函式元件與 Hooks
- 所有元件必須有 TypeScript props interface
- 檔案命名使用 kebab-case

## 禁止行為
- 禁止使用 any 型別
- 禁止直接在元件中使用 fetch
- 禁止跳過 pre-commit hooks`}
      />

      <h2 id="loading-priority">載入優先順序與合併</h2>
      <p>
        CLAUDE.md 檔案可以存在於多個層級（全域、專案根目錄、子目錄），
        它們會按照從全域到特定的順序合併，更具體的設定會覆蓋通用設定。
      </p>

      <h2 id="modular-instructions">模組化指令架構</h2>
      <p>
        對於大型專案，建議將 CLAUDE.md 按照關注點分離的原則組織。
        不同子目錄的 CLAUDE.md 只包含該目錄相關的特定規則。
      </p>

      <CalloutBox type="info" title="內容持續擴充中">
        本章節的完整內容正在撰寫中，將深入探討 CLAUDE.md 的進階設計模式與維護策略。
      </CalloutBox>
    </>
  );
}

function S18PermissionSecurity() {
  return (
    <>
      <h2 id="permission-layers">權限層級架構</h2>
      <p>
        Claude Code 的權限模型採用多層架構，從系統級到工具級提供細粒度的控制。
        每一層都可以獨立配置，形成縱深防禦（Defense in Depth）的安全策略。
      </p>
      <CodeBlock
        language="typescript"
        code={`// 權限層級模型
interface PermissionModel {
  systemLevel: {
    maxSessionDuration: number;
    allowedWorkingDirectories: string[];
  };
  toolLevel: {
    allow: string[];   // 允許的工具與指令
    deny: string[];    // 禁止的工具與指令
    askUser: string[]; // 需要確認的工具與指令
  };
  fileLevel: {
    readOnly: string[];  // 唯讀路徑模式
    noAccess: string[];  // 禁止存取的路徑
  };
}`}
      />

      <h2 id="allowlist-strategy">白名單策略</h2>
      <p>
        對於安全敏感的環境，建議使用白名單模式。
        只明確允許代理需要的最小工具集合，所有未列出的操作一律拒絕。
      </p>

      <h2 id="audit-monitoring">審計與監控</h2>
      <p>
        所有敏感操作都應被記錄到審計日誌中，包括執行者身份、操作內容、
        執行時間和結果。定期審查審計日誌能及早發現異常行為。
      </p>

      <CalloutBox type="info" title="內容持續擴充中">
        本章節的完整內容正在撰寫中，將包含完整的安全架構設計指南與合規檢查清單。
      </CalloutBox>
    </>
  );
}

// ============================================================================
// Module 4: Mastery (S19-S24) -- Placeholder Content
// ============================================================================

function S19MultiCli() {
  return (
    <>
      <h2 id="multi-instance-overview">多實例概覽</h2>
      <p>
        多 CLI 工作流讓你能夠同時運行多個 Claude Code 實例，
        每個實例處理不同的專案或功能分支。這種模式在需要平行開發多個相關功能時特別有效。
      </p>
      <CodeBlock
        language="bash"
        code={`# 在不同終端機中啟動多個 Claude Code 實例
# 終端機 1: 處理前端功能
cd /project && claude

# 終端機 2: 處理後端 API
cd /project && claude

# 終端機 3: 撰寫測試
cd /project && claude`}
      />

      <h2 id="resource-management">資源管理</h2>
      <p>
        多個 CLI 實例會共享系統資源和 API 配額。
        需要合理分配任務以避免超出 API 速率限制或系統資源不足。
      </p>

      <h2 id="cross-instance-coordination">跨實例協調</h2>
      <p>
        多個 CLI 實例之間可以透過 Git 分支和共享檔案進行間接協調。
        Worktree 隔離機制在此場景中尤為重要。
      </p>

      <CalloutBox type="info" title="內容持續擴充中">
        本章節的完整內容正在撰寫中，將涵蓋多 CLI 的進階協調模式與資源最佳化策略。
      </CalloutBox>
    </>
  );
}

function S20ErrorRecovery() {
  return (
    <>
      <h2 id="error-types">常見錯誤類型</h2>
      <p>
        代理在執行過程中可能遇到多種錯誤，包括工具執行失敗、權限不足、
        檔案不存在、指令語法錯誤等。每種錯誤都需要不同的處理策略。
      </p>
      <CodeBlock
        language="typescript"
        code={`// 錯誤分類與處理策略
type ErrorCategory =
  | "tool_execution_failed"   // 工具執行失敗
  | "permission_denied"       // 權限不足
  | "resource_not_found"      // 資源不存在
  | "timeout"                 // 操作逾時
  | "api_rate_limit"          // API 速率限制
  | "context_overflow";       // 上下文溢出

// 每種錯誤都應有明確的處理流程
// 禁止靜默忽略錯誤或使用通用的降級回應`}
      />

      <h2 id="explicit-failure">明確的失敗通報</h2>
      <p>
        代理遇到錯誤時必須明確通報，而非靜默跳過或假裝成功。
        錯誤訊息應包含足夠的診斷資訊，幫助使用者理解問題並做出決策。
      </p>

      <h2 id="safe-recovery">安全恢復程序</h2>
      <p>
        當工作流中斷時，代理應能夠安全地恢復到一致的狀態。
        這包括回滾部分完成的變更、清理暫存檔案和更新任務狀態。
      </p>

      <CalloutBox type="info" title="內容持續擴充中">
        本章節的完整內容正在撰寫中，將包含完整的錯誤恢復框架與實戰演練。
      </CalloutBox>
    </>
  );
}

function S21CostOptimization() {
  return (
    <>
      <h2 id="token-cost-structure">Token 計算與成本結構</h2>
      <p>
        Claude API 的成本主要由輸入 token 和輸出 token 決定。
        理解 token 的計算方式和計費規則是優化成本的基礎。
        Prompt caching 能顯著降低重複內容的計費。
      </p>
      <CodeBlock
        language="typescript"
        code={`// 成本最佳化的關鍵指標
interface CostMetrics {
  inputTokens: number;        // 輸入 token（含 system prompt）
  outputTokens: number;       // 輸出 token
  cachedInputTokens: number;  // 被快取的輸入 token（計費較低）
  totalApiCalls: number;      // API 呼叫次數
  averageTokensPerCall: number;

  // 最佳化目標：
  // 1. 最大化快取命中率
  // 2. 減少不必要的工具呼叫迭代
  // 3. 使用精簡的提示語
}`}
      />

      <h2 id="context-management">上下文管理技巧</h2>
      <p>
        有效的上下文管理能直接降低 token 消耗。
        關鍵策略包括善用子代理、避免冗餘資訊、以及適時開啟新對話。
      </p>

      <h2 id="model-selection">模型選擇策略</h2>
      <p>
        不同的任務可以使用不同的模型。簡單的程式碼生成和搜尋任務
        可以使用較輕量的模型，複雜的架構決策才需要使用最高階的模型。
      </p>

      <CalloutBox type="info" title="內容持續擴充中">
        本章節的完整內容正在撰寫中，將包含具體的成本分析工具與最佳化案例研究。
      </CalloutBox>
    </>
  );
}

function S22HumanInLoop() {
  return (
    <>
      <h2 id="hil-design-patterns">人機協作設計模式</h2>
      <p>
        人機協作（Human-in-the-Loop）設計讓代理在關鍵決策點暫停並等待人類確認。
        這在涉及破壞性操作、高風險判斷或模糊需求時特別重要。
      </p>
      <CodeBlock
        language="typescript"
        code={`// 人機協作檢查點設計
interface HumanCheckpoint {
  trigger: "before_destructive_action"
    | "confidence_below_threshold"
    | "ambiguous_requirement"
    | "cost_exceeds_budget";
  action: "pause_and_ask" | "present_options" | "request_clarification";
  resumeOnApproval: boolean;
}`}
      />

      <h2 id="checkpoint-design">檢查點設計</h2>
      <p>
        檢查點應該被放置在工作流中的關鍵轉折點，而非每一步都暫停。
        過多的中斷會降低效率，過少的中斷則增加風險。
      </p>

      <h2 id="feedback-loop">回饋循環最佳化</h2>
      <p>
        建立有效的回饋循環，讓人類的每次介入都能提升代理的後續表現。
        這包括將重要的決策結果記錄到 CLAUDE.md 或 Session 中。
      </p>

      <CalloutBox type="info" title="內容持續擴充中">
        本章節的完整內容正在撰寫中，將探討進階的人機協作模式與自動化升級策略。
      </CalloutBox>
    </>
  );
}

function S23CustomAgents() {
  return (
    <>
      <h2 id="custom-agent-architecture">自定義代理架構</h2>
      <p>
        自定義代理讓你能夠針對特定領域或工作流建立專用的代理元件。
        這些代理可以被包裝為可復用的 Skill 模組，在不同專案間共享。
      </p>
      <CodeBlock
        language="markdown"
        filename=".claude/skills/database-migrator/SKILL.md"
        code={`---
description: "資料庫遷移管理代理"
command: "/migrate"
triggers:
  - "migration"
  - "migrate"
  - "資料庫遷移"
---

# 資料庫遷移代理

## 職責
- 分析 schema 變更需求
- 生成遷移腳本
- 驗證遷移的向下相容性
- 執行乾跑測試

## 約束
- 不得直接在生產資料庫上執行遷移
- 所有遷移都必須是可回滾的`}
      />

      <h2 id="reusable-skills">可復用的 Skill 模組</h2>
      <p>
        將常用的工作流封裝為 Skill 模組，讓團隊成員能夠共享和標準化代理行為。
        好的 Skill 模組應該是自包含的，包含所有必要的指令和知識。
      </p>

      <h2 id="testing-versioning">測試與版本管理</h2>
      <p>
        自定義代理和 Skill 模組應該像普通程式碼一樣進行版本管理和測試。
        使用 Git 追蹤 SKILL.md 的變更歷史，並定期驗證技能是否仍按預期運作。
      </p>

      <CalloutBox type="info" title="內容持續擴充中">
        本章節的完整內容正在撰寫中，將包含完整的自定義代理開發工作坊與範例庫。
      </CalloutBox>
    </>
  );
}

function S24ProductionPatterns() {
  return (
    <>
      <h2 id="deployment-architecture">部署架構</h2>
      <p>
        在生產環境中運行 Claude Code 代理需要考慮可靠性、可觀測性和安全性。
        建議採用容器化部署搭配完整的監控堆疊。
      </p>
      <CodeBlock
        language="typescript"
        code={`// 生產環境代理配置模型
interface ProductionConfig {
  deployment: {
    containerized: boolean;
    healthCheckEndpoint: string;
    gracefulShutdownTimeout: number;
  };
  monitoring: {
    metricsEndpoint: string;
    alertingRules: AlertRule[];
    dashboardEnabled: boolean;
  };
  cicd: {
    preDeployValidation: string[];
    rollbackStrategy: "automatic" | "manual";
    canaryPercentage: number;
  };
}`}
      />

      <h2 id="monitoring-alerting">監控與告警</h2>
      <p>
        生產環境的代理需要完整的監控系統，追蹤 API 使用量、錯誤率、
        回應時間和成本指標。異常情況應觸發即時告警。
      </p>

      <h2 id="cicd-integration">CI/CD 整合</h2>
      <p>
        將代理整合到 CI/CD 流程中，實現自動化的程式碼審查、測試生成和部署驗證。
        這需要在 pipeline 中正確配置代理的權限和資源限制。
      </p>

      <CalloutBox type="info" title="內容持續擴充中">
        本章節的完整內容正在撰寫中，將涵蓋完整的生產環境部署指南與運維最佳實踐。
      </CalloutBox>
    </>
  );
}

// ============================================================================
// Content Registry
// ============================================================================

const TUTORIAL_CONTENT_MAP: Record<string, () => React.JSX.Element> = {
  "s01-agent-loop": S01AgentLoop,
  "s02-tool-system": S02ToolSystem,
  "s03-todowrite-planning": S03TodoWritePlanning,
  "s04-subagents": S04Subagents,
  "s05-skills-knowledge": S05SkillsKnowledge,
  "s06-context-compaction": S06ContextCompaction,
  "s07-task-graph": S07TaskGraph,
  "s08-background-tasks": S08BackgroundTasks,
  "s09-agent-teams": S09AgentTeams,
  "s10-team-protocols": S10TeamProtocols,
  "s11-autonomous-agents": S11AutonomousAgents,
  "s12-worktree-isolation": S12WorktreeIsolation,
  "s13-control-protocol": S13ControlProtocol,
  "s14-mcp-integration": S14McpIntegration,
  "s15-hooks-system": S15HooksSystem,
  "s16-session-storage": S16SessionStorage,
  "s17-claude-md-design": S17ClaudeMdDesign,
  "s18-permission-security": S18PermissionSecurity,
  "s19-multi-cli": S19MultiCli,
  "s20-error-recovery": S20ErrorRecovery,
  "s21-cost-optimization": S21CostOptimization,
  "s22-human-in-loop": S22HumanInLoop,
  "s23-custom-agents": S23CustomAgents,
  "s24-production-patterns": S24ProductionPatterns,
};

/**
 * 依據 tutorial slug 取得對應的 JSX 內容。
 * 找不到時回傳預設的「找不到內容」提示。
 */
export function getTutorialContent(slug: string): React.ReactElement {
  const ContentFn = TUTORIAL_CONTENT_MAP[slug];
  if (ContentFn) {
    return <ContentFn />;
  }
  return (
    <div>
      <h2 id="not-found">找不到內容</h2>
      <p>找不到 slug 為「{slug}」的教學內容。請確認路徑是否正確。</p>
    </div>
  );
}
