import type { TutorialMeta, Module } from '@/types/tutorial';

export type { TutorialMeta, Module } from '@/types/tutorial';

export const TUTORIALS_META: TutorialMeta[] = [
  // ── Module 1: 核心代理 (Core Agent) ──
  {
    slug: 's01-agent-loop',
    title: 'Agent Loop（代理迴圈）',
    description: '深入理解 Claude Code 的核心運作機制 -- Agent Loop，學習代理如何接收指令、呼叫工具並迭代產出結果。',
    module: 1,
    moduleTitle: '核心代理',
    order: 1,
    readingTime: '15 分鐘',
    level: 'beginner',
    objectives: [
      '理解 Agent Loop 的執行流程',
      '掌握 prompt -> tool call -> result 的迭代模式',
      '學會觀察與除錯代理迴圈行為',
    ],
  },
  {
    slug: 's02-tool-system',
    title: '工具系統與權限',
    description: '學習 Claude Code 如何透過工具系統與外部環境互動，以及如何設定工具的使用權限與安全邊界。',
    module: 1,
    moduleTitle: '核心代理',
    order: 2,
    readingTime: '20 分鐘',
    level: 'beginner',
    objectives: [
      '認識內建工具（Bash、Read、Write、Edit 等）的用途',
      '理解工具權限模型與自動核准機制',
      '學會配置 allowedTools 與 permission prompt',
    ],
  },
  {
    slug: 's03-todowrite-planning',
    title: '使用 TodoWrite 進行規劃',
    description: '掌握 TodoWrite 工具的使用時機與策略，學習如何讓代理有條理地分解並追蹤複雜任務。',
    module: 1,
    moduleTitle: '核心代理',
    order: 3,
    readingTime: '12 分鐘',
    level: 'beginner',
    objectives: [
      '理解 TodoWrite 的資料結構與狀態管理',
      '學會在 system prompt 中引導代理使用任務清單',
      '掌握任務拆解與進度追蹤的最佳實踐',
    ],
  },
  {
    slug: 's04-subagents',
    title: '子代理與上下文隔離',
    description: '學習如何建立子代理來處理特定子任務，並理解上下文隔離如何避免資訊污染與 token 浪費。',
    module: 1,
    moduleTitle: '核心代理',
    order: 4,
    readingTime: '18 分鐘',
    level: 'beginner',
    objectives: [
      '理解主代理與子代理的關係',
      '學會透過 Agent tool 建立隔離的執行環境',
      '掌握子代理結果回傳與彙整策略',
    ],
  },
  {
    slug: 's05-skills-knowledge',
    title: 'Skills 與知識載入',
    description: '探索 Skills 機制如何動態載入領域知識與可執行技能，擴展代理的能力範圍。',
    module: 1,
    moduleTitle: '核心代理',
    order: 5,
    readingTime: '15 分鐘',
    level: 'beginner',
    objectives: [
      '理解 SKILL.md 的結構與載入流程',
      '學會建立自定義 Skill 並注入到代理上下文',
      '掌握 Skill 與 CLAUDE.md 的搭配策略',
    ],
  },
  {
    slug: 's06-context-compaction',
    title: '上下文壓縮',
    description: '學習 Claude Code 如何在長對話中進行上下文壓縮，以及如何設計提示語來最大化有效上下文利用率。',
    module: 1,
    moduleTitle: '核心代理',
    order: 6,
    readingTime: '14 分鐘',
    level: 'beginner',
    objectives: [
      '理解上下文窗口的限制與壓縮觸發條件',
      '學會設計不易在壓縮中遺失的關鍵資訊結構',
      '掌握 compaction 策略的調整方式',
    ],
  },

  // ── Module 2: 多代理協作 (Multi-Agent) ──
  {
    slug: 's07-task-graph',
    title: '任務圖與依賴關係',
    description: '學習如何將複雜工作流建模為任務圖（Task Graph），定義任務間的依賴與執行順序。',
    module: 2,
    moduleTitle: '多代理協作',
    order: 7,
    readingTime: '20 分鐘',
    level: 'intermediate',
    objectives: [
      '理解 DAG（有向無環圖）在任務排程中的應用',
      '學會定義任務依賴與並行執行策略',
      '掌握任務失敗時的處理與重試邏輯',
    ],
  },
  {
    slug: 's08-background-tasks',
    title: '背景任務',
    description: '學習如何啟動與管理背景任務，讓代理在等待長時間操作時仍可繼續其他工作。',
    module: 2,
    moduleTitle: '多代理協作',
    order: 8,
    readingTime: '16 分鐘',
    level: 'intermediate',
    objectives: [
      '理解背景任務的啟動與監控機制',
      '學會使用 run_in_background 與 TaskOutput',
      '掌握背景任務與前景任務的協調模式',
    ],
  },
  {
    slug: 's09-agent-teams',
    title: 'Agent Teams 與通訊',
    description: '探索如何組建代理團隊，讓多個專精代理協同完成跨領域任務，並建立有效的通訊機制。',
    module: 2,
    moduleTitle: '多代理協作',
    order: 9,
    readingTime: '22 分鐘',
    level: 'intermediate',
    objectives: [
      '理解多代理團隊的架構模式',
      '學會設計代理間的訊息傳遞協定',
      '掌握團隊成員角色分配與職責劃分',
    ],
  },
  {
    slug: 's10-team-protocols',
    title: '團隊協定',
    description: '深入學習代理團隊的協作協定設計，包括共識機制、衝突解決與成果整合策略。',
    module: 2,
    moduleTitle: '多代理協作',
    order: 10,
    readingTime: '18 分鐘',
    level: 'intermediate',
    objectives: [
      '理解團隊協定的設計原則',
      '學會處理代理間的輸出衝突',
      '掌握多代理成果的整合與品質控管',
    ],
  },
  {
    slug: 's11-autonomous-agents',
    title: '自主代理',
    description: '學習如何建構具有自主決策能力的代理，理解自主性等級與人類介入點的設計取捨。',
    module: 2,
    moduleTitle: '多代理協作',
    order: 11,
    readingTime: '20 分鐘',
    level: 'intermediate',
    objectives: [
      '理解自主代理的決策模型',
      '學會設定自主性邊界與安全護欄',
      '掌握自主代理的監控與日誌策略',
    ],
  },
  {
    slug: 's12-worktree-isolation',
    title: 'Worktree 隔離',
    description: '學習如何利用 Git Worktree 為代理建立隔離的工作環境，避免平行任務間的檔案衝突。',
    module: 2,
    moduleTitle: '多代理協作',
    order: 12,
    readingTime: '14 分鐘',
    level: 'intermediate',
    objectives: [
      '理解 Worktree 隔離的運作原理',
      '學會使用 EnterWorktree 與 ExitWorktree',
      '掌握多分支並行開發的最佳實踐',
    ],
  },

  // ── Module 3: 真實世界架構 (Real-World Architecture) ──
  {
    slug: 's13-control-protocol',
    title: '控制協議',
    description: '學習如何設計代理的控制協議，確保代理行為可預測、可審計且符合業務邏輯。',
    module: 3,
    moduleTitle: '真實世界架構',
    order: 13,
    readingTime: '22 分鐘',
    level: 'advanced',
    objectives: [
      '理解控制協議的核心元件',
      '學會設計指令格式與回應規範',
      '掌握代理行為的可審計性設計',
    ],
  },
  {
    slug: 's14-mcp-integration',
    title: 'MCP 整合',
    description: '深入學習 Model Context Protocol（MCP）的整合方式，擴展代理連接外部服務與資料來源的能力。',
    module: 3,
    moduleTitle: '真實世界架構',
    order: 14,
    readingTime: '25 分鐘',
    level: 'advanced',
    objectives: [
      '理解 MCP 協定的架構與通訊方式',
      '學會配置與啟用 MCP Server',
      '掌握自訂 MCP 工具的開發流程',
    ],
  },
  {
    slug: 's15-hooks-system',
    title: 'Hooks 系統',
    description: '學習 Claude Code 的 Hooks 機制，在代理生命週期的關鍵節點插入自定義邏輯與驗證。',
    module: 3,
    moduleTitle: '真實世界架構',
    order: 15,
    readingTime: '18 分鐘',
    level: 'advanced',
    objectives: [
      '理解 Hooks 的觸發時機與執行環境',
      '學會實作 PreToolUse 與 PostToolUse Hooks',
      '掌握 Hooks 在安全防護中的應用',
    ],
  },
  {
    slug: 's16-session-storage',
    title: 'Session 儲存',
    description: '學習代理 Session 的持久化機制，理解如何跨對話保留狀態、恢復上下文與管理歷史紀錄。',
    module: 3,
    moduleTitle: '真實世界架構',
    order: 16,
    readingTime: '16 分鐘',
    level: 'advanced',
    objectives: [
      '理解 Session 儲存的資料結構',
      '學會實作跨對話的狀態延續',
      '掌握 Session 清理與容量管理策略',
    ],
  },
  {
    slug: 's17-claude-md-design',
    title: 'CLAUDE.md 設計',
    description: '掌握 CLAUDE.md 的設計哲學與最佳實踐，學習如何撰寫高效的專案級代理指令。',
    module: 3,
    moduleTitle: '真實世界架構',
    order: 17,
    readingTime: '20 分鐘',
    level: 'advanced',
    objectives: [
      '理解 CLAUDE.md 的載入優先順序與合併規則',
      '學會設計模組化的代理指令架構',
      '掌握指令衝突的診斷與解決方法',
    ],
  },
  {
    slug: 's18-permission-security',
    title: '權限模型與安全性',
    description: '深入理解 Claude Code 的權限模型設計，學習如何在開放性與安全性之間取得平衡。',
    module: 3,
    moduleTitle: '真實世界架構',
    order: 18,
    readingTime: '22 分鐘',
    level: 'advanced',
    objectives: [
      '理解權限層級與自動核准規則',
      '學會配置安全邊界與白名單策略',
      '掌握敏感操作的審計與監控機制',
    ],
  },

  // ── Module 4: 進階精通 (Mastery) ──
  {
    slug: 's19-multi-cli',
    title: '多 CLI 工作流',
    description: '學習如何同時運行多個 Claude Code CLI 實例，實現跨專案、跨分支的平行開發工作流。',
    module: 4,
    moduleTitle: '進階精通',
    order: 19,
    readingTime: '16 分鐘',
    level: 'advanced',
    objectives: [
      '理解多 CLI 實例的資源管理',
      '學會設計跨實例的任務分配策略',
      '掌握多 CLI 環境的除錯技巧',
    ],
  },
  {
    slug: 's20-error-recovery',
    title: '錯誤恢復',
    description: '學習代理在遭遇錯誤時的恢復策略，確保工作流在異常情況下仍能正確處理而非靜默失敗。',
    module: 4,
    moduleTitle: '進階精通',
    order: 20,
    readingTime: '18 分鐘',
    level: 'advanced',
    objectives: [
      '理解常見的代理錯誤類型與根因',
      '學會設計明確的錯誤通報機制',
      '掌握工作流中斷後的安全恢復程序',
    ],
  },
  {
    slug: 's21-cost-optimization',
    title: '成本優化',
    description: '學習如何優化 Claude Code 的 token 消耗與 API 成本，在品質與效率之間取得最佳平衡。',
    module: 4,
    moduleTitle: '進階精通',
    order: 21,
    readingTime: '20 分鐘',
    level: 'advanced',
    objectives: [
      '理解 token 計算與成本結構',
      '學會運用上下文管理技巧降低消耗',
      '掌握模型選擇與提示語優化策略',
    ],
  },
  {
    slug: 's22-human-in-loop',
    title: '人機協作',
    description: '學習如何設計人機協作的工作流，在適當的決策點引入人類判斷，提升代理輸出的可靠性。',
    module: 4,
    moduleTitle: '進階精通',
    order: 22,
    readingTime: '18 分鐘',
    level: 'advanced',
    objectives: [
      '理解人機協作的設計模式',
      '學會設定需要人類確認的關鍵檢查點',
      '掌握回饋循環的最佳化策略',
    ],
  },
  {
    slug: 's23-custom-agents',
    title: '自定義 Agents 與 Skills',
    description: '學習如何從零打造自定義代理與技能模組，建立可復用的代理元件庫。',
    module: 4,
    moduleTitle: '進階精通',
    order: 23,
    readingTime: '25 分鐘',
    level: 'advanced',
    objectives: [
      '理解自定義代理的架構設計原則',
      '學會封裝可復用的 Skill 模組',
      '掌握代理元件的測試與版本管理',
    ],
  },
  {
    slug: 's24-production-patterns',
    title: '生產環境模式',
    description: '學習在生產環境中部署與維運 Claude Code 代理的完整模式，涵蓋監控、日誌、CI/CD 整合與災害復原。',
    module: 4,
    moduleTitle: '進階精通',
    order: 24,
    readingTime: '25 分鐘',
    level: 'advanced',
    objectives: [
      '理解生產環境代理的部署架構',
      '學會建立完整的監控與告警系統',
      '掌握 CI/CD 流程中的代理整合模式',
    ],
  },
];

/**
 * 取得所有教學（不含 content，使用 metadata）。
 */
export function getAllTutorials(): TutorialMeta[] {
  return TUTORIALS_META;
}

/**
 * 依 slug 取得單一教學的 metadata。
 * 找不到時回傳 undefined。
 */
export function getTutorialBySlug(slug: string): TutorialMeta | null {
  return TUTORIALS_META.find((t) => t.slug === slug) ?? null;
}

/**
 * 將教學依模組分組，回傳 Module 陣列（不含 content）。
 */
export function getModules(): Module[] {
  const moduleLevelMap: Record<number, string> = {};
  const moduleTitleMap: Record<number, string> = {};
  const grouped: Record<number, TutorialMeta[]> = {};

  for (const t of TUTORIALS_META) {
    if (!grouped[t.module]) {
      grouped[t.module] = [];
      moduleTitleMap[t.module] = t.moduleTitle;
      moduleLevelMap[t.module] = t.level;
    }
    grouped[t.module].push(t);
  }

  return Object.keys(grouped)
    .map(Number)
    .sort((a, b) => a - b)
    .map((id) => ({
      id,
      title: moduleTitleMap[id],
      level: moduleLevelMap[id],
      tutorials: grouped[id].sort((a, b) => a.order - b.order),
    }));
}

/**
 * 依 slug 取得前一篇與下一篇教學。
 */
export function getAdjacentTutorials(
  slug: string,
): { prev: TutorialMeta | null; next: TutorialMeta | null } {
  const sorted = [...TUTORIALS_META].sort((a, b) => a.order - b.order);
  const index = sorted.findIndex((t) => t.slug === slug);

  if (index === -1) {
    return { prev: null, next: null };
  }

  return {
    prev: index > 0 ? sorted[index - 1] : null,
    next: index < sorted.length - 1 ? sorted[index + 1] : null,
  };
}
