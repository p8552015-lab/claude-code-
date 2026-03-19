"use client";

import { useState, useCallback, useEffect, useRef } from "react";

// ============================================================================
// S07: TaskGraphDemo — 互動式 DAG 視覺化（增強版）
// ============================================================================

interface TaskNodeData {
  id: string;
  label: string;
  emoji: string;
  description: string;
  dependencies: string[];
  status: "pending" | "running" | "completed";
  x: number;
  y: number;
}

const INITIAL_TASKS: TaskNodeData[] = [
  {
    id: "lint",
    label: "Lint 檢查",
    emoji: "\u{1F50D}",
    description: "執行 ESLint / Ruff 檢查程式碼風格與潛在問題，確保程式碼品質符合團隊規範。",
    dependencies: [],
    status: "pending",
    x: 150,
    y: 60,
  },
  {
    id: "test",
    label: "單元測試",
    emoji: "\u{1F9EA}",
    description: "執行 pytest / jest 確保所有測試通過，驗證各模組的功能正確性。",
    dependencies: [],
    status: "pending",
    x: 450,
    y: 60,
  },
  {
    id: "build",
    label: "Build 建構",
    emoji: "\u{1F3D7}\uFE0F",
    description: "編譯程式碼並產出可部署的 artifact，包含壓縮、打包、產生 source map。",
    dependencies: ["lint", "test"],
    status: "pending",
    x: 300,
    y: 190,
  },
  {
    id: "deploy",
    label: "Deploy 部署",
    emoji: "\u{1F680}",
    description: "將建構產出部署至 staging 環境，執行煙霧測試確認部署成功。",
    dependencies: ["build"],
    status: "pending",
    x: 170,
    y: 320,
  },
  {
    id: "notify",
    label: "Notify 通知",
    emoji: "\u{1F4E8}",
    description: "發送部署完成通知到 Slack / Email，附上版本號和變更摘要。",
    dependencies: ["deploy"],
    status: "pending",
    x: 430,
    y: 320,
  },
];

// 節點尺寸常數
const NODE_W = 150;
const NODE_H = 56;

function areDependenciesMet(
  taskId: string,
  tasks: TaskNodeData[]
): boolean {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return false;
  return task.dependencies.every((depId) => {
    const dep = tasks.find((t) => t.id === depId);
    return dep?.status === "completed";
  });
}

/** 產出依賴邊的貝茲曲線路徑 */
function edgePath(from: TaskNodeData, to: TaskNodeData): string {
  const x1 = from.x;
  const y1 = from.y + NODE_H / 2;
  const x2 = to.x;
  const y2 = to.y - NODE_H / 2;
  const dy = (y2 - y1) * 0.55;
  return `M ${x1} ${y1} C ${x1} ${y1 + dy}, ${x2} ${y2 - dy}, ${x2} ${y2}`;
}

/** Kahn's algorithm 拓撲排序 */
function topoSort(tasks: TaskNodeData[]): string[] {
  const inDeg: Record<string, number> = {};
  const adj: Record<string, string[]> = {};
  for (const t of tasks) {
    inDeg[t.id] = t.dependencies.length;
    adj[t.id] = [];
  }
  for (const t of tasks) {
    for (const dep of t.dependencies) {
      adj[dep].push(t.id);
    }
  }
  const queue: string[] = [];
  for (const t of tasks) {
    if (inDeg[t.id] === 0) queue.push(t.id);
  }
  const order: string[] = [];
  while (queue.length > 0) {
    const node = queue.shift()!;
    order.push(node);
    for (const child of adj[node]) {
      inDeg[child]--;
      if (inDeg[child] === 0) queue.push(child);
    }
  }
  return order;
}

export function TaskGraphDemo() {
  const [tasks, setTasks] = useState<TaskNodeData[]>(
    INITIAL_TASKS.map((t) => ({ ...t }))
  );
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [shakingNode, setShakingNode] = useState<string | null>(null);
  const [allDone, setAllDone] = useState(false);
  const [autoRunning, setAutoRunning] = useState(false);
  const autoRef = useRef(false);

  // 檢查全部完成
  useEffect(() => {
    const done = tasks.every((t) => t.status === "completed");
    setAllDone(done);
  }, [tasks]);

  const handleNodeClick = useCallback(
    (taskId: string) => {
      if (autoRunning) return;
      setTasks((prev) => {
        const current = prev.find((t) => t.id === taskId);
        if (!current) return prev;

        const nextStatusMap: Record<string, "pending" | "running" | "completed"> = {
          pending: "running",
          running: "completed",
          completed: "pending",
        };
        const nextStatus = nextStatusMap[current.status];

        // 依賴未滿足 → 抖動 + 紅色提示
        if (nextStatus === "running" && !areDependenciesMet(taskId, prev)) {
          setShakingNode(taskId);
          setTimeout(() => setShakingNode(null), 600);
          setSelectedTask(taskId);
          return prev;
        }

        // 回到 pending → 重置下游
        if (nextStatus === "pending") {
          const resetDownstream = (id: string, allTasks: TaskNodeData[]): string[] => {
            const downstream = allTasks.filter((t) => t.dependencies.includes(id));
            const ids = downstream.map((t) => t.id);
            downstream.forEach((t) => {
              ids.push(...resetDownstream(t.id, allTasks));
            });
            return ids;
          };
          const toReset = new Set(resetDownstream(taskId, prev));
          return prev.map((t) => {
            if (t.id === taskId) return { ...t, status: nextStatus };
            if (toReset.has(t.id)) return { ...t, status: "pending" as const };
            return t;
          });
        }

        return prev.map((t) =>
          t.id === taskId ? { ...t, status: nextStatus } : t
        );
      });
      setSelectedTask(taskId);
    },
    [autoRunning]
  );

  const handleReset = useCallback(() => {
    autoRef.current = false;
    setAutoRunning(false);
    setTasks(INITIAL_TASKS.map((t) => ({ ...t, status: "pending" as const })));
    setSelectedTask(null);
    setAllDone(false);
  }, []);

  /** 自動執行：依拓撲排序逐一完成 */
  const handleAutoRun = useCallback(() => {
    // 先重置
    const fresh = INITIAL_TASKS.map((t) => ({ ...t, status: "pending" as const }));
    setTasks(fresh);
    setSelectedTask(null);
    setAllDone(false);
    setAutoRunning(true);
    autoRef.current = true;

    const order = topoSort(fresh);
    let idx = 0;

    const step = () => {
      if (!autoRef.current || idx >= order.length) {
        setAutoRunning(false);
        autoRef.current = false;
        return;
      }
      const currentId = order[idx];
      // pending → running
      setTasks((prev) => prev.map((t) => t.id === currentId ? { ...t, status: "running" as const } : t));
      setSelectedTask(currentId);

      setTimeout(() => {
        if (!autoRef.current) return;
        // running → completed
        setTasks((prev) => prev.map((t) => t.id === currentId ? { ...t, status: "completed" as const } : t));
        idx++;
        setTimeout(step, 500);
      }, 800);
    };

    setTimeout(step, 300);
  }, []);

  const statusConfig: Record<string, { fill: string; stroke: string; text: string; label: string; strokeDash?: string }> = {
    pending: { fill: "#f3f4f6", stroke: "#9ca3af", text: "#6b7280", label: "等待中", strokeDash: "4 3" },
    running: { fill: "#fff7ed", stroke: "#e07a2f", text: "#c2410c", label: "執行中" },
    completed: { fill: "#dcfce7", stroke: "#22c55e", text: "#166534", label: "已完成" },
  };

  const selected = tasks.find((t) => t.id === selectedTask);
  const depsBlocked =
    selected && !areDependenciesMet(selected.id, tasks) && selected.status === "pending";

  return (
    <div className="my-8">
      {/* CSS 動畫 */}
      <style>{`
        @keyframes dagPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes dagShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        @keyframes dagFlowDash {
          to { stroke-dashoffset: -20; }
        }
        @keyframes dagCelebrate {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .dag-pulse { animation: dagPulse 1.6s ease-in-out infinite; }
        .dag-shake { animation: dagShake 0.4s ease-in-out; }
        .dag-flow { animation: dagFlowDash 1s linear infinite; }
        .dag-celebrate { animation: dagCelebrate 0.5s ease-out forwards; }
      `}</style>

      <div className="rounded-2xl border-2 border-gray-200 bg-white p-4 sm:p-6 dark:border-gray-700 dark:bg-gray-800">
        {/* 標題列 + 按鈕 */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            CI/CD 任務圖
          </h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAutoRun}
              disabled={autoRunning}
              className="rounded-lg bg-claude-orange px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {autoRunning ? "執行中..." : "自動執行"}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              重置
            </button>
          </div>
        </div>

        {/* 慶祝效果 */}
        {allDone && (
          <div className="dag-celebrate mb-4 flex items-center justify-center gap-2 rounded-xl bg-green-50 py-3 text-green-700 dark:bg-green-900/20 dark:text-green-400">
            <span className="text-2xl">{"\u{1F389}"}</span>
            <span className="text-sm font-bold">全部完成！所有任務已成功執行。</span>
          </div>
        )}

        {/* 主要佈局：SVG + 圖例 */}
        <div className="flex flex-col gap-4 lg:flex-row">
          {/* SVG DAG */}
          <div className="relative min-w-0 flex-1 overflow-x-auto">
            <svg viewBox="0 0 600 400" className="mx-auto w-full" style={{ minHeight: 320 }}>
              <defs>
                {/* 箭頭 marker：灰色 */}
                <marker id="dag-arrow-gray" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="8" markerHeight="8" orient="auto">
                  <path d="M 0 1 L 11 6 L 0 11 z" fill="#9ca3af" />
                </marker>
                {/* 箭頭 marker：綠色 */}
                <marker id="dag-arrow-green" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="8" markerHeight="8" orient="auto">
                  <path d="M 0 1 L 11 6 L 0 11 z" fill="#22c55e" />
                </marker>
                {/* 漸變：pending 邊 */}
                <linearGradient id="dag-grad-gray" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d1d5db" />
                  <stop offset="100%" stopColor="#9ca3af" />
                </linearGradient>
                {/* 漸變：completed 邊 */}
                <linearGradient id="dag-grad-green" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4ade80" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
              </defs>

              {/* 依賴邊（貝茲曲線） */}
              {tasks.map((task) =>
                task.dependencies.map((depId) => {
                  const dep = tasks.find((t) => t.id === depId);
                  if (!dep) return null;
                  const isCompleted = dep.status === "completed";
                  const d = edgePath(dep, task);
                  return (
                    <g key={`edge-${depId}-${task.id}`}>
                      {/* 底層粗線 */}
                      <path
                        d={d}
                        fill="none"
                        stroke={isCompleted ? "url(#dag-grad-green)" : "url(#dag-grad-gray)"}
                        strokeWidth={isCompleted ? 3 : 2}
                        strokeLinecap="round"
                        markerEnd={isCompleted ? "url(#dag-arrow-green)" : "url(#dag-arrow-gray)"}
                      />
                      {/* 流動虛線動畫（完成時） */}
                      {isCompleted && (
                        <path
                          d={d}
                          fill="none"
                          stroke="#bbf7d0"
                          strokeWidth={2}
                          strokeDasharray="6 8"
                          strokeLinecap="round"
                          className="dag-flow"
                        />
                      )}
                    </g>
                  );
                })
              )}

              {/* 節點 */}
              {tasks.map((task) => {
                const cfg = statusConfig[task.status];
                const isSelected = selectedTask === task.id;
                const isShaking = shakingNode === task.id;
                const halfW = NODE_W / 2;
                const halfH = NODE_H / 2;

                return (
                  <g
                    key={task.id}
                    onClick={() => handleNodeClick(task.id)}
                    className={`cursor-pointer ${isShaking ? "dag-shake" : ""} ${task.status === "running" ? "dag-pulse" : ""}`}
                    style={{ transformOrigin: `${task.x}px ${task.y}px` }}
                  >
                    {/* 選中時的光暈 */}
                    {isSelected && (
                      <rect
                        x={task.x - halfW - 4}
                        y={task.y - halfH - 4}
                        width={NODE_W + 8}
                        height={NODE_H + 8}
                        rx={14}
                        fill="none"
                        stroke="#e07a2f"
                        strokeWidth={2}
                        strokeOpacity={0.4}
                      />
                    )}
                    {/* 主矩形 */}
                    <rect
                      x={task.x - halfW}
                      y={task.y - halfH}
                      width={NODE_W}
                      height={NODE_H}
                      rx={12}
                      fill={cfg.fill}
                      stroke={isSelected ? "#e07a2f" : isShaking ? "#ef4444" : cfg.stroke}
                      strokeWidth={isSelected ? 2.5 : 2}
                      strokeDasharray={cfg.strokeDash || "none"}
                    />
                    {/* Emoji */}
                    <text
                      x={task.x - halfW + 16}
                      y={task.y - 4}
                      fontSize={16}
                      dominantBaseline="middle"
                    >
                      {task.emoji}
                    </text>
                    {/* 任務名稱 */}
                    <text
                      x={task.x - halfW + 36}
                      y={task.y - 6}
                      fontSize={13}
                      fontWeight={700}
                      fill={cfg.text}
                      dominantBaseline="middle"
                    >
                      {task.label}
                    </text>
                    {/* 狀態標籤 */}
                    <text
                      x={task.x - halfW + 36}
                      y={task.y + 14}
                      fontSize={10}
                      fill={cfg.text}
                      opacity={0.7}
                      dominantBaseline="middle"
                    >
                      {cfg.label}
                    </text>
                    {/* 完成打勾 */}
                    {task.status === "completed" && (
                      <text
                        x={task.x + halfW - 18}
                        y={task.y + 1}
                        fontSize={16}
                        dominantBaseline="middle"
                        textAnchor="middle"
                      >
                        {"\u2705"}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* 圖例（右側垂直排列） */}
          <div className="flex shrink-0 flex-row justify-center gap-3 lg:w-28 lg:flex-col lg:justify-start lg:pt-2">
            {Object.entries(statusConfig).map(([status, c]) => (
              <div key={status} className="flex items-center gap-2 text-xs">
                <span
                  className="inline-block h-3 w-3 rounded-md border"
                  style={{ backgroundColor: c.fill, borderColor: c.stroke }}
                />
                <span className="text-gray-600 dark:text-gray-400">{c.label}</span>
              </div>
            ))}
            <div className="hidden items-center gap-2 text-xs lg:flex">
              <span className="inline-block h-0.5 w-3 bg-gray-300" />
              <span className="text-gray-500 dark:text-gray-500">依賴關係</span>
            </div>
          </div>
        </div>

        {/* 選中節點的說明面板 */}
        {selected && (
          <div className="mt-4 rounded-xl border border-claude-orange/30 bg-claude-orange/5 p-4 dark:bg-claude-orange/10">
            <div className="flex items-center gap-2">
              <span className="text-lg">{selected.emoji}</span>
              <span className="font-semibold text-claude-orange">
                {selected.label}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  selected.status === "completed"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : selected.status === "running"
                    ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                }`}
              >
                {statusConfig[selected.status].label}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              {selected.description}
            </p>
            {selected.dependencies.length > 0 && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                {"\u{1F517}"} 依賴：{selected.dependencies.map((d) => {
                  const dep = tasks.find((t) => t.id === d);
                  return dep ? dep.label : d;
                }).join("、")}
                {depsBlocked && (
                  <span className="ml-2 font-semibold text-red-500">
                    {"\u26A0\uFE0F"} 依賴尚未完成，無法啟動！
                  </span>
                )}
              </p>
            )}
          </div>
        )}

        <p className="mt-3 text-center text-xs text-gray-400 dark:text-gray-500">
          點擊節點切換狀態：pending {"\u2192"} running {"\u2192"} completed。依賴未完成的任務會抖動提示。
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// S08: BackgroundTaskDemo — 前景/背景任務時間軸對比
// ============================================================================

interface TimelineTask {
  id: string;
  label: string;
  duration: number; // 秒
  color: string;
}

const TIMELINE_TASKS: TimelineTask[] = [
  { id: "lint", label: "Lint 檢查", duration: 3, color: "#3b82f6" },
  { id: "test", label: "跑測試", duration: 8, color: "#8b5cf6" },
  { id: "build", label: "Build 專案", duration: 6, color: "#f59e0b" },
  { id: "docs", label: "產生文件", duration: 4, color: "#10b981" },
];

export function BackgroundTaskDemo() {
  const [mode, setMode] = useState<"sequential" | "parallel">("sequential");
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSequential = TIMELINE_TASKS.reduce((sum, t) => sum + t.duration, 0);
  // 平行模式下，lint 在前景，其他三個背景同時跑
  const totalParallel = TIMELINE_TASKS[0].duration + Math.max(
    ...TIMELINE_TASKS.slice(1).map((t) => t.duration)
  );

  const totalTime = mode === "sequential" ? totalSequential : totalParallel;

  const handleRun = useCallback(() => {
    setProgress(0);
    setIsRunning(true);
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    const step = 0.1;
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + step;
        if (next >= totalTime) {
          setIsRunning(false);
          if (intervalRef.current) clearInterval(intervalRef.current);
          return totalTime;
        }
        return next;
      });
    }, 100);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, totalTime]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setProgress(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  // 計算每個任務的 bar 位置
  const getSequentialBars = () => {
    let offset = 0;
    return TIMELINE_TASKS.map((task) => {
      const bar = { ...task, start: offset, end: offset + task.duration };
      offset += task.duration;
      return bar;
    });
  };

  const getParallelBars = () => {
    // lint 在前景先跑完
    const foreground = { ...TIMELINE_TASKS[0], start: 0, end: TIMELINE_TASKS[0].duration };
    // 其他在 lint 完成後背景同時開始
    const backgrounds = TIMELINE_TASKS.slice(1).map((task) => ({
      ...task,
      start: TIMELINE_TASKS[0].duration,
      end: TIMELINE_TASKS[0].duration + task.duration,
    }));
    return { foreground, backgrounds };
  };

  const seqBars = getSequentialBars();
  const parBars = getParallelBars();

  return (
    <div className="my-8">
      <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        {/* 模式切換 */}
        <div className="mb-6 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => { setMode("sequential"); handleReset(); }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              mode === "sequential"
                ? "bg-claude-orange text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400"
            }`}
          >
            序列執行
          </button>
          <button
            type="button"
            onClick={() => { setMode("parallel"); handleReset(); }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              mode === "parallel"
                ? "bg-claude-orange text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400"
            }`}
          >
            背景平行執行
          </button>
        </div>

        {/* 時間軸 */}
        <div className="relative mb-4 space-y-3">
          {mode === "sequential" ? (
            // 序列模式：所有任務排成一行
            <div>
              <div className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                主執行緒
              </div>
              <div className="relative h-10 rounded-lg bg-gray-100 dark:bg-gray-700" style={{ width: "100%" }}>
                {seqBars.map((bar) => {
                  const leftPct = (bar.start / totalSequential) * 100;
                  const widthPct = (bar.duration / totalSequential) * 100;
                  const filled = progress >= bar.end;
                  const active = progress >= bar.start && progress < bar.end;
                  return (
                    <div
                      key={bar.id}
                      className="absolute top-0 flex h-full items-center justify-center rounded-md text-xs font-medium text-white transition-opacity"
                      style={{
                        left: `${leftPct}%`,
                        width: `${widthPct}%`,
                        backgroundColor: bar.color,
                        opacity: filled ? 1 : active ? 0.7 : 0.3,
                      }}
                    >
                      {bar.label}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            // 平行模式：前景一行 + 背景多行
            <>
              <div>
                <div className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                  前景任務
                </div>
                <div className="relative h-10 rounded-lg bg-gray-100 dark:bg-gray-700">
                  <div
                    className="absolute top-0 flex h-full items-center justify-center rounded-md text-xs font-medium text-white transition-opacity"
                    style={{
                      left: 0,
                      width: `${(parBars.foreground.end / totalParallel) * 100}%`,
                      backgroundColor: parBars.foreground.color,
                      opacity:
                        progress >= parBars.foreground.end
                          ? 1
                          : progress >= parBars.foreground.start
                          ? 0.7
                          : 0.3,
                    }}
                  >
                    {parBars.foreground.label}
                  </div>
                </div>
              </div>
              {parBars.backgrounds.map((bar) => (
                <div key={bar.id}>
                  <div className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                    背景 — {bar.label}
                  </div>
                  <div className="relative h-8 rounded-lg bg-gray-100 dark:bg-gray-700">
                    <div
                      className="absolute top-0 flex h-full items-center justify-center rounded-md text-xs font-medium text-white transition-opacity"
                      style={{
                        left: `${(bar.start / totalParallel) * 100}%`,
                        width: `${(bar.duration / totalParallel) * 100}%`,
                        backgroundColor: bar.color,
                        opacity:
                          progress >= bar.end
                            ? 1
                            : progress >= bar.start
                            ? 0.7
                            : 0.3,
                      }}
                    >
                      {bar.label}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* 進度條 */}
        <div className="relative mb-2 h-2 rounded-full bg-gray-200 dark:bg-gray-600">
          <div
            className="h-full rounded-full bg-claude-orange transition-all"
            style={{ width: `${(progress / totalTime) * 100}%` }}
          />
        </div>

        {/* 控制按鈕 & 統計 */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleRun}
              disabled={isRunning}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isRunning
                  ? "cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-gray-700"
                  : "bg-claude-orange text-white hover:bg-claude-orange/90"
              }`}
            >
              {isRunning ? "執行中..." : "開始模擬"}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              重置
            </button>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {totalTime}s
            </div>
            <div className="text-xs text-gray-500">
              {mode === "parallel" && (
                <span className="text-green-600 dark:text-green-400">
                  節省 {totalSequential - totalParallel}s ({Math.round(((totalSequential - totalParallel) / totalSequential) * 100)}%)
                </span>
              )}
              {mode === "sequential" && "總耗時"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// S09: TeamArchitectureDemo — 互動式團隊架構圖
// ============================================================================

interface TeamRole {
  id: string;
  name: string;
  icon: string;
  responsibilities: string[];
  pythonExample: string;
  color: string;
}

const TEAM_ROLES: TeamRole[] = [
  {
    id: "orchestrator",
    name: "Orchestrator (協調者)",
    icon: "O",
    responsibilities: [
      "分析使用者需求，拆解為子任務",
      "將任務分派給對應的專家代理",
      "監控各代理進度並整合結果",
      "處理代理之間的衝突與依賴",
    ],
    pythonExample: `class Orchestrator:
    """協調者：負責分派任務與整合結果"""

    def __init__(self, agents: list[Agent]):
        self.agents = {a.role: a for a in agents}
        self.task_queue: list[Task] = []

    def plan(self, user_request: str) -> list[Task]:
        """拆解使用者需求為子任務"""
        tasks = self.analyze_and_decompose(user_request)
        self.task_queue = tasks
        return tasks

    def dispatch(self, task: Task) -> None:
        """將任務派發給對應角色"""
        agent = self.agents[task.assigned_to]
        agent.execute(task)

    def integrate(self, results: list[Result]) -> str:
        """整合所有代理的產出"""
        return self.merge_outputs(results)`,
    color: "border-claude-orange bg-claude-orange/10",
  },
  {
    id: "frontend",
    name: "Frontend (前端專家)",
    icon: "F",
    responsibilities: [
      "實作 React / Vue 元件",
      "處理 CSS 與 RWD 佈局",
      "串接 API 與狀態管理",
      "確保無障礙性（a11y）",
    ],
    pythonExample: `class FrontendAgent(Agent):
    """前端專家：專注 UI/UX 實作"""

    role = "frontend"

    system_prompt = """你是前端開發專家。
    專精：React, TypeScript, Tailwind CSS
    原則：元件化、可重用、響應式設計
    工具偏好：Edit（修改元件）, Bash（npm 指令）"""

    def execute(self, task: Task) -> Result:
        # 1. 讀取現有元件結構
        components = self.read_project_structure("src/components/")
        # 2. 實作新元件或修改現有元件
        changes = self.implement_ui(task, components)
        # 3. 確認 TypeScript 編譯通過
        self.run("npx tsc --noEmit")
        return Result(files_changed=changes)`,
    color: "border-blue-400 bg-blue-50 dark:bg-blue-900/20",
  },
  {
    id: "backend",
    name: "Backend (後端專家)",
    icon: "B",
    responsibilities: [
      "設計 RESTful API 端點",
      "實作資料庫操作與遷移",
      "處理認證與授權邏輯",
      "撰寫 API 文件（OpenAPI）",
    ],
    pythonExample: `class BackendAgent(Agent):
    """後端專家：專注 API 與資料層"""

    role = "backend"

    system_prompt = """你是後端開發專家。
    專精：FastAPI, SQLAlchemy, PostgreSQL
    原則：RESTful 設計、資料驗證、錯誤處理
    工具偏好：Edit（修改路由）, Bash（migration）"""

    def execute(self, task: Task) -> Result:
        # 1. 分析資料模型需求
        models = self.analyze_data_requirements(task)
        # 2. 建立/修改 API 端點
        endpoints = self.implement_api(task, models)
        # 3. 撰寫資料庫遷移
        self.run("alembic revision --autogenerate")
        return Result(endpoints=endpoints)`,
    color: "border-green-400 bg-green-50 dark:bg-green-900/20",
  },
  {
    id: "tester",
    name: "Tester (測試專家)",
    icon: "T",
    responsibilities: [
      "撰寫單元測試與整合測試",
      "建立測試案例覆蓋邊界條件",
      "執行測試並分析失敗原因",
      "確保測試覆蓋率達標",
    ],
    pythonExample: `class TesterAgent(Agent):
    """測試專家：負責品質保證"""

    role = "tester"

    system_prompt = """你是測試工程師。
    專精：pytest, 測試策略設計, Mock/Fixture
    原則：邊界測試、錯誤路徑、覆蓋率 > 80%
    工具偏好：Edit（寫測試）, Bash（跑 pytest）"""

    def execute(self, task: Task) -> Result:
        # 1. 分析需要測試的程式碼
        code_under_test = self.read(task.target_files)
        # 2. 設計測試案例
        test_cases = self.design_tests(code_under_test)
        # 3. 撰寫並執行測試
        self.write_tests(test_cases)
        result = self.run("pytest --cov --cov-report=term")
        return Result(coverage=result.coverage)`,
    color: "border-purple-400 bg-purple-50 dark:bg-purple-900/20",
  },
  {
    id: "reviewer",
    name: "Reviewer (審查者)",
    icon: "R",
    responsibilities: [
      "審查程式碼品質與風格一致性",
      "檢查安全漏洞與效能問題",
      "驗證 API 合約與型別安全",
      "提出改善建議與最佳實踐",
    ],
    pythonExample: `class ReviewerAgent(Agent):
    """審查者：把關程式碼品質"""

    role = "reviewer"

    system_prompt = """你是資深程式碼審查者。
    專精：設計模式、安全最佳實踐、效能分析
    原則：建設性回饋、具體建議、嚴謹標準
    工具偏好：Read（讀 diff）, Grep（搜尋模式）"""

    def execute(self, task: Task) -> Result:
        # 1. 讀取所有變更
        diff = self.run("git diff --cached")
        # 2. 逐檔審查
        issues = self.review_changes(diff)
        # 3. 產出審查報告
        report = self.generate_review(issues)
        return Result(
            approved=len(issues.blockers) == 0,
            report=report
        )`,
    color: "border-amber-400 bg-amber-50 dark:bg-amber-900/20",
  },
];

export function TeamArchitectureDemo() {
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const active = TEAM_ROLES.find((r) => r.id === activeRole);

  return (
    <div className="my-8">
      <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        {/* 角色卡片網格 */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {TEAM_ROLES.map((role) => {
            const isActive = activeRole === role.id;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => setActiveRole(isActive ? null : role.id)}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all duration-200 ${
                  isActive
                    ? `${role.color} scale-105 shadow-lg ring-2 ring-claude-orange/30`
                    : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:shadow-md dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500"
                }`}
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white ${
                    role.id === "orchestrator"
                      ? "bg-claude-orange"
                      : role.id === "frontend"
                      ? "bg-blue-500"
                      : role.id === "backend"
                      ? "bg-green-500"
                      : role.id === "tester"
                      ? "bg-purple-500"
                      : "bg-amber-500"
                  }`}
                >
                  {role.icon}
                </span>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {role.name.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* 展開的角色詳情 */}
        {active && (
          <div className={`mt-6 rounded-xl border-2 ${active.color} p-5`}>
            <h4 className="mb-3 text-lg font-bold text-gray-900 dark:text-white">
              {active.name}
            </h4>
            <div className="mb-4">
              <h5 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                職責範圍：
              </h5>
              <ul className="space-y-1">
                {active.responsibilities.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                  >
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-claude-orange" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Python 實作範例：
              </h5>
              <div className="overflow-hidden rounded-lg border border-gray-700 bg-gray-900">
                <div className="border-b border-gray-700 bg-gray-800 px-4 py-2">
                  <span className="text-sm font-medium text-gray-300">
                    {active.id}_agent.py
                  </span>
                </div>
                <div className="overflow-x-auto p-4">
                  <pre className="text-sm leading-relaxed text-gray-100">
                    <code>{active.pythonExample}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
          點擊角色卡片查看職責說明與 Python 實作範例
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// S10: ProtocolFlowDemo — 互動式協定流程步驟器
// ============================================================================

interface ProtocolStep {
  id: string;
  phase: string;
  title: string;
  description: string;
  detail: string;
  icon: string;
  color: string;
}

const PROTOCOL_STEPS: ProtocolStep[] = [
  {
    id: "assign",
    phase: "Phase 1",
    title: "指派 (Assign)",
    description: "協調者分析需求，建立結構化任務卡並分派給對應代理",
    detail:
      "任務卡包含：任務 ID、指派角色、上下文描述、驗收標準。確保每個代理收到的指令明確且可驗證。",
    icon: "1",
    color: "bg-blue-500",
  },
  {
    id: "execute",
    phase: "Phase 2",
    title: "執行 (Execute)",
    description: "代理在自己的 worktree 中獨立執行任務，透過工具完成開發",
    detail:
      "執行過程中代理記錄所有操作。如遇阻塞問題（超出職責範圍、缺少權限），立即回報協調者而非自行猜測。",
    icon: "2",
    color: "bg-purple-500",
  },
  {
    id: "verify",
    phase: "Phase 3",
    title: "驗證 (Verify)",
    description: "審查代理檢查產出品質，測試代理執行自動化驗證",
    detail:
      "雙重驗證：(1) 自動化檢查 — lint、測試、型別檢查；(2) 審查者代理的程式碼審查。兩者都通過才算驗收。",
    icon: "3",
    color: "bg-amber-500",
  },
  {
    id: "integrate",
    phase: "Phase 4",
    title: "整合 (Integrate)",
    description: "協調者將所有驗證通過的成果合併到主分支",
    detail:
      "整合包含：Git merge、衝突解決、最終整合測試。若整合測試失敗，回退到 Phase 2 由相關代理修復。",
    icon: "4",
    color: "bg-green-500",
  },
];

export function ProtocolFlowDemo() {
  const [currentStep, setCurrentStep] = useState(0);
  const step = PROTOCOL_STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === PROTOCOL_STEPS.length - 1;

  return (
    <div className="my-8">
      <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        {/* 步驟指示器 */}
        <div className="mb-6 flex items-center justify-between">
          {PROTOCOL_STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <button
                type="button"
                onClick={() => setCurrentStep(i)}
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all ${
                  i === currentStep
                    ? `${s.color} scale-110 text-white shadow-lg ring-4 ring-opacity-30 ${
                        s.color === "bg-blue-500"
                          ? "ring-blue-300"
                          : s.color === "bg-purple-500"
                          ? "ring-purple-300"
                          : s.color === "bg-amber-500"
                          ? "ring-amber-300"
                          : "ring-green-300"
                      }`
                    : i < currentStep
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-500 dark:bg-gray-600 dark:text-gray-400"
                }`}
              >
                {i < currentStep ? "\u2713" : s.icon}
              </button>
              {i < PROTOCOL_STEPS.length - 1 && (
                <div
                  className={`mx-2 h-0.5 w-8 sm:w-16 ${
                    i < currentStep
                      ? "bg-green-400"
                      : "bg-gray-200 dark:bg-gray-600"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* 步驟內容 */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-600 dark:bg-gray-700/50">
          <div className="mb-3 flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              {step.phase}
            </span>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white">
              {step.title}
            </h4>
          </div>
          <p className="mb-3 text-gray-700 dark:text-gray-300">
            {step.description}
          </p>
          <div className="rounded-lg border border-claude-orange/20 bg-claude-orange/5 p-3 dark:bg-claude-orange/10">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {step.detail}
            </p>
          </div>
        </div>

        {/* 導航 */}
        <div className="mt-4 flex items-center justify-between">
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
            &larr; 上一步
          </button>
          <span className="text-sm text-gray-400">
            {currentStep + 1} / {PROTOCOL_STEPS.length}
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
            {isLast ? "已完成" : "下一步 \u2192"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// S11: AutonomyLevelDemo — 互動式自主性等級滑桿
// ============================================================================

interface AutonomyInfo {
  level: string;
  label: string;
  description: string;
  permissions: string[];
  risks: string[];
  color: string;
  bgColor: string;
}

const AUTONOMY_LEVELS: AutonomyInfo[] = [
  {
    level: "supervised",
    label: "受監督 (Supervised)",
    description: "每一步操作都需要人類確認才能執行。最安全但最慢。",
    permissions: ["Read 唯讀操作", "Grep 搜尋程式碼"],
    risks: ["開發效率低", "頻繁中斷工作流"],
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",
  },
  {
    level: "guided",
    label: "引導式 (Guided)",
    description: "唯讀操作自動執行，寫入操作需確認。平衡安全與效率。",
    permissions: ["Read / Grep / Glob 自動執行", "Edit 需要確認", "Bash(安全指令) 自動執行"],
    risks: ["確認疲勞可能導致草率批准", "需要明確定義「安全指令」"],
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
  },
  {
    level: "autonomous",
    label: "自主式 (Autonomous)",
    description: "大部分操作自動執行，僅在異常或高風險操作時回報。",
    permissions: ["Read / Edit / Grep 自動執行", "Bash(測試/建構) 自動執行", "僅危險指令需要確認"],
    risks: ["可能產生非預期的檔案修改", "需要完善的測試作為安全網"],
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800",
  },
  {
    level: "full_auto",
    label: "全自動 (Full Auto)",
    description: "所有操作自動執行，不中斷工作流。僅限於低風險且有完整測試的環境。",
    permissions: ["所有工具自動執行", "包含部署與系統操作", "完全信任代理判斷"],
    risks: [
      "無人監督下的錯誤可能擴散",
      "不適合生產環境的直接操作",
      "需要完整的回滾機制",
    ],
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
  },
];

export function AutonomyLevelDemo() {
  const [level, setLevel] = useState(1);
  const info = AUTONOMY_LEVELS[level];

  return (
    <div className="my-8">
      <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        {/* 滑桿 */}
        <div className="mb-6">
          <div className="mb-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>受監督</span>
            <span>全自動</span>
          </div>
          <input
            type="range"
            min={0}
            max={3}
            step={1}
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
            className="w-full cursor-pointer accent-claude-orange"
          />
          <div className="mt-1 flex justify-between text-xs">
            {AUTONOMY_LEVELS.map((a, i) => (
              <span
                key={a.level}
                className={`${i === level ? "font-bold " + a.color : "text-gray-400"}`}
              >
                {a.level}
              </span>
            ))}
          </div>
        </div>

        {/* 等級詳情 */}
        <div className={`rounded-xl border-2 p-5 ${info.bgColor}`}>
          <h4 className={`mb-2 text-lg font-bold ${info.color}`}>
            {info.label}
          </h4>
          <p className="mb-4 text-sm text-gray-700 dark:text-gray-300">
            {info.description}
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {/* 允許的操作 */}
            <div>
              <h5 className="mb-2 flex items-center gap-1 text-sm font-semibold text-green-700 dark:text-green-400">
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                允許的操作
              </h5>
              <ul className="space-y-1">
                {info.permissions.map((p) => (
                  <li key={p} className="text-sm text-gray-600 dark:text-gray-400">
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            {/* 風險提示 */}
            <div>
              <h5 className="mb-2 flex items-center gap-1 text-sm font-semibold text-red-700 dark:text-red-400">
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                風險提示
              </h5>
              <ul className="space-y-1">
                {info.risks.map((r) => (
                  <li key={r} className="text-sm text-gray-600 dark:text-gray-400">
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// S12: WorktreeDemo — 互動式 Git Worktree 視覺化
// ============================================================================

interface WorktreeBranch {
  id: string;
  name: string;
  label: string;
  files: { name: string; status: "modified" | "added" | "unchanged" }[];
  description: string;
  color: string;
}

const WORKTREE_BRANCHES: WorktreeBranch[] = [
  {
    id: "main",
    name: "main",
    label: "主分支",
    files: [
      { name: "app/main.py", status: "unchanged" },
      { name: "app/routes.py", status: "unchanged" },
      { name: "app/models.py", status: "unchanged" },
      { name: "tests/test_app.py", status: "unchanged" },
    ],
    description: "穩定的主分支。所有功能合併到這裡之後才算正式完成。",
    color: "border-green-400 bg-green-50 dark:bg-green-900/20",
  },
  {
    id: "wt-auth",
    name: ".claude/worktrees/feature-auth",
    label: "Worktree A: 認證功能",
    files: [
      { name: "app/main.py", status: "unchanged" },
      { name: "app/routes.py", status: "modified" },
      { name: "app/auth.py", status: "added" },
      { name: "tests/test_auth.py", status: "added" },
    ],
    description: "Agent A 在此 worktree 實作 JWT 認證。修改 routes.py 新增登入端點，新建 auth.py。",
    color: "border-blue-400 bg-blue-50 dark:bg-blue-900/20",
  },
  {
    id: "wt-dashboard",
    name: ".claude/worktrees/feature-dashboard",
    label: "Worktree B: 儀表板功能",
    files: [
      { name: "app/main.py", status: "modified" },
      { name: "app/dashboard.py", status: "added" },
      { name: "app/models.py", status: "modified" },
      { name: "tests/test_dashboard.py", status: "added" },
    ],
    description: "Agent B 在此 worktree 實作資料儀表板。修改 models.py 新增統計模型，新建 dashboard.py。",
    color: "border-purple-400 bg-purple-50 dark:bg-purple-900/20",
  },
];

export function WorktreeDemo() {
  const [activeBranch, setActiveBranch] = useState<string>("main");
  const branch = WORKTREE_BRANCHES.find((b) => b.id === activeBranch)!;

  const statusBadge = (status: "modified" | "added" | "unchanged") => {
    switch (status) {
      case "modified":
        return (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            M
          </span>
        );
      case "added":
        return (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
            A
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
            -
          </span>
        );
    }
  };

  return (
    <div className="my-8">
      <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        {/* 分支選擇器 */}
        <div className="mb-6 flex flex-wrap gap-2">
          {WORKTREE_BRANCHES.map((b) => {
            const isActive = activeBranch === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setActiveBranch(b.id)}
                className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? `${b.color} shadow-md`
                    : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400"
                }`}
              >
                <span className="mr-1 font-mono text-xs">
                  {b.id === "main" ? "~/" : "~/"}
                </span>
                {b.label}
              </button>
            );
          })}
        </div>

        {/* 分支視覺化 */}
        <div className="mb-4 flex items-start gap-4">
          {/* Git 圖形 */}
          <div className="hidden w-16 flex-shrink-0 sm:block">
            <svg viewBox="0 0 60 200" className="h-48 w-full">
              {/* main 線 */}
              <line x1="30" y1="20" x2="30" y2="180" stroke="#10b981" strokeWidth="3" />
              <circle cx="30" cy="20" r="6" fill="#10b981" />
              <circle cx="30" cy="100" r="6" fill="#10b981" />
              <circle cx="30" cy="180" r="6" fill="#10b981" />

              {/* worktree A 分支 */}
              <path d="M30 60 Q45 60 50 80" fill="none" stroke="#3b82f6" strokeWidth="2" />
              <circle cx="50" cy="80" r="5" fill={activeBranch === "wt-auth" ? "#3b82f6" : "#93c5fd"} />

              {/* worktree B 分支 */}
              <path d="M30 140 Q45 140 50 120" fill="none" stroke="#8b5cf6" strokeWidth="2" />
              <circle cx="50" cy="120" r="5" fill={activeBranch === "wt-dashboard" ? "#8b5cf6" : "#c4b5fd"} />
            </svg>
          </div>

          {/* 分支詳情 */}
          <div className={`flex-1 rounded-xl border-2 ${branch.color} p-4`}>
            <div className="mb-2 flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-gray-800 dark:text-gray-200">
                {branch.name}
              </span>
            </div>
            <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
              {branch.description}
            </p>

            {/* 檔案清單 */}
            <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800">
              <div className="border-b border-gray-200 px-3 py-2 dark:border-gray-600">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  檔案狀態
                </span>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {branch.files.map((f) => (
                  <div
                    key={f.name}
                    className="flex items-center justify-between px-3 py-2"
                  >
                    <span className="font-mono text-sm text-gray-700 dark:text-gray-300">
                      {f.name}
                    </span>
                    {statusBadge(f.status)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500">
          點擊分支標籤切換查看不同 worktree 的工作內容。每個 worktree 都是獨立的目錄，互不干擾。
        </p>
      </div>
    </div>
  );
}
