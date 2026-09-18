"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  Plus,
  Video,
  FileText,
  MessageSquareQuote,
  Sparkles,
  ArrowRight,
  Trash2,
  Tv,
  Clapperboard,
  X,
  Compass,
  BookOpen,
  Mic,
  FileAudio,
  Layers,
  ChevronRight,
  Search,
  SearchX,
} from "lucide-react";
import { InterviewProject, InterviewStyle, ProjectStatus } from "@/types";
import {
  WORKFLOW_STAGES,
  STATUS_META,
  getProjectProgress,
  getProjectMetrics,
} from "@/lib/workflow";
import {
  Chip,
  EmptyState,
  Field,
  IconTile,
  StageDots,
  type Tone,
} from "@/components/ui/Primitives";
import { confirmDialog, requestJson, runTask, toast } from "@/components/ui/Feedback";
import { useFocusTrap } from "@/components/ui/useFocusTrap";

const STYLES: InterviewStyle[] = [
  "人物故事",
  "深度对谈",
  "轻松聊天",
  "专业访谈",
  "犀利追问",
  "纪录片",
  "播客",
];

const SHOW_TYPES = ["深度访谈", "人物纪录片", "播客对谈", "圆桌论坛", "短视频访谈"];

const STAGE_ICONS = [Compass, BookOpen, Mic, FileAudio, Video];

export default function HomePage() {
  const [projects, setProjects] = useState<InterviewProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // 表单状态
  const [guestName, setGuestName] = useState("");
  const [guestTitle, setGuestTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [showType, setShowType] = useState("深度访谈");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [targetAudience, setTargetAudience] = useState("");
  const [interviewStyle, setInterviewStyle] = useState<InterviewStyle>("深度对谈");
  const [focusDirection, setFocusDirection] = useState("");

  // 列表检索 / 筛选 / 排序
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [sortBy, setSortBy] = useState<"updated" | "created" | "name">("updated");

  const filteredProjects = useMemo(() => {
    const q = query.trim().toLowerCase();

    const list = projects.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (!q) return true;
      return [p.guestName, p.guestTitle, p.topic, p.title]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });

    return [...list].sort((a, b) => {
      if (sortBy === "name") {
        return (a.guestName || "").localeCompare(b.guestName || "", "zh-CN");
      }
      if (sortBy === "created") {
        return (b.createdAt || "").localeCompare(a.createdAt || "");
      }
      return (b.updatedAt || "").localeCompare(a.updatedAt || "");
    });
  }, [projects, query, statusFilter, sortBy]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: projects.length };
    projects.forEach((p) => {
      counts[p.status] = (counts[p.status] || 0) + 1;
    });
    return counts;
  }, [projects]);

  const hasActiveFilter = query.trim() !== "" || statusFilter !== "all";

  const clearFilters = () => {
    setQuery("");
    setStatusFilter("all");
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const json = await res.json();
      if (json.success) {
        setProjects(json.data);
      } else {
        toast.error("加载项目列表失败", json.error || "服务端未返回数据");
      }
    } catch (e) {
      toast.error("加载项目列表失败", e instanceof Error ? e.message : "网络请求异常");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // 弹窗：ESC 关闭 + 锁定背景滚动
  useEffect(() => {
    if (!showModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowModal(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [showModal]);

  // 弹窗焦点管理：打开时移入、Tab 循环、关闭归还
  const modalRef = useFocusTrap<HTMLDivElement>(showModal);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !topic) {
      toast.error("信息不完整", "请先填写嘉宾姓名与访谈主题。");
      return;
    }
    setCreating(true);

    const { ok } = await runTask(
      "正在创建访谈项目...",
      `项目「${guestName}」已创建`,
      () =>
        requestJson("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `${guestName}：${topic}`,
            guestName,
            guestTitle,
            topic,
            showType,
            durationMinutes,
            targetAudience,
            interviewStyle,
            focusDirection,
          }),
        }),
      "创建访谈项目失败"
    );

    if (ok) {
      setShowModal(false);
      // 清空表单
      setGuestName("");
      setGuestTitle("");
      setTopic("");
      setFocusDirection("");
      fetchProjects();
    }
    setCreating(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const target = projects.find((p) => p.id === id);
    const confirmed = await confirmDialog({
      title: "删除该访谈项目？",
      description: `「${target?.guestName || "该项目"}」的资料、提纲、逐字稿与拆条资产都会被永久移除，此操作不可恢复。`,
      confirmText: "删除项目",
      tone: "danger",
    });
    if (!confirmed) return;

    const { ok } = await runTask(
      "正在删除项目...",
      "项目已删除",
      () => requestJson(`/api/projects/${id}`, { method: "DELETE" }),
      "删除项目失败"
    );
    if (ok) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
    }
  };

  // 统计指标
  const totalQuestions = projects.reduce(
    (acc, p) => acc + p.chapters.reduce((cAcc, c) => cAcc + c.questions.length, 0),
    0
  );
  const totalVideos = projects.reduce((acc, p) => acc + (p.shortVideos?.length || 0), 0);
  const totalQuotes = projects.reduce((acc, p) => acc + (p.quotes?.length || 0), 0);

  const STATS = [
    {
      label: "访谈项目",
      value: projects.length,
      unit: "个",
      hint: "全流程上下文持久化",
    },
    {
      label: "分级策划问题",
      value: totalQuestions,
      unit: "道",
      hint: "普通 / 故事 / 深度与追问",
    },
    {
      label: "短视频拆条",
      value: totalVideos,
      unit: "支",
      hint: "标定入出点与封面",
    },
    {
      label: "模拟复盘均分",
      value: projects.some((p) => p.simulationSession?.reviewReport?.overallRating)
        ? Math.round(
            projects
              .filter((p) => p.simulationSession?.reviewReport?.overallRating)
              .reduce((acc, p) => acc + (p.simulationSession?.reviewReport?.overallRating || 0), 0) /
              projects.filter((p) => p.simulationSession?.reviewReport?.overallRating).length
          )
        : 85,
      unit: "分",
      hint: "AI 深度心理对练与建议",
    },
  ];

  return (
    <div className="shell w-full py-10">
      {/* ============ Hero ============ */}
      <section className="grid grid-cols-1 gap-10 lg:grid-cols-[1.12fr_0.88fr] lg:items-center">
        <div className="animate-rise">
          <Chip tone="lime" dot className="font-mono tracking-wide text-xs">
            00 · AI 访谈第二导演 · 全流程对谈工作坊
          </Chip>
          <h1 className="mt-5 text-[38px] font-extrabold leading-[1.14] tracking-tight text-1 sm:text-[46px]">
            提问交给 AI，<br className="hidden sm:inline" />
            <span className="text-lime-600 dark:text-lime-400">深度</span>留给对谈。
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-3">
            覆盖「全网画像研究 → 分级策划大纲 → 高保真 AI 彩排对练 → 逐字稿提炼 → 爆款短视频拆条」全生命周期，
            让 AI 成为您身旁不知疲倦的第二导演。
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3.5">
            <button onClick={() => setShowModal(true)} className="btn btn-primary btn-lg">
              <Plus className="h-4 w-4 stroke-[2.5]" />
              新建访谈项目
            </button>
            <a href="#projects-list" className="btn btn-secondary btn-lg">
              浏览项目库 ({projects.length})
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div className="mt-4 flex items-center gap-3 font-mono text-[11px] text-4">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-500 dark:bg-lime-400" />
              全流程上下文已激活
            </span>
            <span>·</span>
            <span>已策划 {totalQuestions} 个问题</span>
            <span>·</span>
            <span>已拆条 {totalVideos} 条资产</span>
          </div>
        </div>

        {/* 右侧：AI 导演控制台 (Director Console) */}
        <div className="hero-console animate-rise stagger-2">
          <div className="console-top">
            <div className="flex items-center gap-2">
              <span className="flex gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500/80" />
                <span className="h-2 w-2 rounded-full bg-amber-500/80" />
                <span className="h-2 w-2 rounded-full bg-emerald-500/80" />
              </span>
              <span className="ml-2 font-mono text-[11px] uppercase tracking-wider text-slate-300">
                AI DIRECTOR KERNEL
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="font-semibold console-lime">POST 200</span>
              <span className="console-dim">·</span>
              <span className="text-slate-300">118ms</span>
            </div>
          </div>

          <div className="space-y-1.5 p-5 font-mono text-[12px] leading-relaxed console-val">
            <div className="flex gap-3">
              <span className="select-none console-dim">01</span>
              <span><span className="console-lime font-bold">POST</span> <span className="console-val">/v1/interview/director</span></span>
            </div>
            <div className="flex gap-3">
              <span className="select-none console-dim">02</span>
              <span className="console-val">&#123;</span>
            </div>
            <div className="flex gap-3">
              <span className="select-none console-dim">03</span>
              <span className="pl-4 console-key">&quot;target&quot;: <span className="console-amber">&quot;陈奕迅 · 深度对谈&quot;</span>,</span>
            </div>
            <div className="flex gap-3">
              <span className="select-none console-dim">04</span>
              <span className="pl-4 console-key">&quot;tension&quot;: <span className="console-violet">&quot;情感出口 vs 极致技巧&quot;</span>,</span>
            </div>
            <div className="flex gap-3">
              <span className="select-none console-dim">05</span>
              <span className="pl-4 console-key">&quot;director_cue&quot;: <span className="console-emerald">&quot;抓住反问，深挖失控时刻&quot;</span>,</span>
            </div>
            <div className="flex gap-3">
              <span className="select-none console-dim">06</span>
              <span className="pl-4 console-key">&quot;simulation_score&quot;: <span className="console-lime font-bold">85</span></span>
            </div>
            <div className="flex gap-3">
              <span className="select-none console-dim">07</span>
              <span className="console-val">&#125;</span>
            </div>
          </div>

          <div className="p-4 pt-0">
            <div className="console-result flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 console-lime font-medium">
                <Sparkles className="h-4 w-4 shrink-0 console-lime" />
                <span className="font-mono">director cue → 追问情绪引线已就绪</span>
              </div>
              <span className="font-mono text-[11px] font-semibold console-lime">confidence .94</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============ 数据概览横带 (Stat Strip) ============ */}
      <section className="mt-12 stat-strip grid grid-cols-2 divide-y divide-line-1 sm:grid-cols-4 sm:divide-x sm:divide-y-0 p-3 sm:p-5">
        {STATS.map((s, i) => (
          <div
            key={s.label}
            className="flex flex-col justify-center px-4 py-3 sm:px-6 sm:py-2"
          >
            <span className="text-[11px] font-medium text-4 font-mono">{s.label}</span>
            <div className="mt-1.5 flex items-baseline gap-1">
              <span className="text-[32px] font-extrabold tracking-tight tabular text-1">
                {s.value}
              </span>
              <span className="text-xs text-3 font-mono">{s.unit}</span>
            </div>
            <p className="mt-1 text-[11px] text-3">{s.hint}</p>
          </div>
        ))}
      </section>

      {/* ============ 项目列表 ============ */}
      <section id="projects-list" className="mt-14 scroll-mt-24">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="eyebrow text-lime-600 dark:text-lime-400 font-mono mb-1">
              01 · 访谈项目档案库 (PROJECT ARCHIVES)
            </div>
            <h2 className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-1">
              我的访谈项目
            </h2>
            <p className="mt-1 text-xs text-3">点击卡片进入深度策划、模拟对谈与视频包装工作台</p>
          </div>

          {!loading && projects.length > 0 && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-4" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="搜索嘉宾、头衔或主题"
                  aria-label="搜索项目"
                  className="field h-9 w-full pl-9 pr-8 text-xs sm:w-64"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    aria-label="清除搜索"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-4 transition-colors hover:text-2"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                aria-label="排序方式"
                className="field h-9 w-full text-xs sm:w-[122px]"
              >
                <option value="updated">最近更新</option>
                <option value="created">创建时间</option>
                <option value="name">嘉宾姓名</option>
              </select>
            </div>
          )}
        </div>

        {/* 状态筛选药丸 */}
        {!loading && projects.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {[
              { key: "all" as const, label: "全部" },
              ...(Object.keys(STATUS_META) as ProjectStatus[]).map((k) => ({
                key: k,
                label: STATUS_META[k].label,
              })),
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={clsx(
                  "btn btn-sm rounded-full border transition-all duration-200",
                  statusFilter === f.key
                    ? "bg-lime-400 text-[#0b0c0f] font-semibold border-transparent shadow-[0_2px_12px_rgba(201,255,99,0.3)]"
                    : "border-line-1 bg-surface-1 text-3 hover:bg-surface-2 hover:text-1"
                )}
              >
                {f.label}
                <span className={clsx("tabular text-[10px]", statusFilter === f.key ? "text-[#0b0c0f]/70" : "text-4")}>
                  {statusCounts[f.key] || 0}
                </span>
              </button>
            ))}

            {hasActiveFilter && (
              <button
                onClick={clearFilters}
                className="btn btn-ghost btn-sm ml-1 text-4 hover:text-2"
              >
                <X className="h-3 w-3" />
                清除筛选
              </button>
            )}

            <span className="tabular ml-auto text-[11px] text-4 font-mono">
              显示 {filteredProjects.length} / {projects.length} 个项目
            </span>
          </div>
        )}

        {loading ? (
          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="glass-card h-60 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            className="mt-6"
            icon={Clapperboard}
            tone="lime"
            title="暂无访谈项目"
            description="创建第一个项目，开启由 AI 第二导演辅助的全新访谈工作流：从资料研究到短视频拆条，一次打通。"
            action={
              <button onClick={() => setShowModal(true)} className="btn btn-primary btn-md">
                <Plus className="h-4 w-4" />
                新建第一个项目
              </button>
            }
          />
        ) : filteredProjects.length === 0 ? (
          <EmptyState
            className="mt-6"
            icon={SearchX}
            tone="slate"
            title="没有匹配的项目"
            description={`当前筛选条件下没有找到项目${
              query.trim() ? `（关键词「${query.trim()}」）` : ""
            }，试试换个关键词或清除筛选条件。`}
            action={
              <button onClick={clearFilters} className="btn btn-secondary btn-md">
                <X className="h-4 w-4" />
                清除筛选
              </button>
            }
          />
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredProjects.map((project, idx) => {
              const progress = getProjectProgress(project);
              const metrics = getProjectMetrics(project);
              const status = STATUS_META[project.status] ?? STATUS_META.researching;
              const serial = String(idx + 1).padStart(2, "0");
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className={`glass-card card-hover animate-rise stagger-${
                    (idx % 6) + 1
                  } group relative flex flex-col overflow-hidden rounded-2xl p-5 border border-line-2 hover:border-lime-500/40 dark:hover:border-lime-400/40`}
                >
                  <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-lime-400/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />

                  {/* 顶部：序号 + 风格标签 + 删除 */}
                  <div className="relative flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-4 group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">
                        {serial}
                      </span>
                      <Chip tone="lime" className="text-[10px] py-0.5">
                        {project.interviewStyle} · {project.durationMinutes} 分钟
                      </Chip>
                    </div>
                    <button
                      onClick={(e) => handleDelete(project.id, e)}
                      title="删除项目"
                      className="btn btn-ghost btn-xs -mr-1 text-4 opacity-60 transition-opacity hover:bg-rose-500/10 hover:text-rose-300 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* 嘉宾 */}
                  <div className="relative mt-4 flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line-2 bg-surface-2 text-sm font-bold text-1 transition-transform group-hover:scale-105">
                      {project.guestName?.slice(0, 1) || "?"}
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-[15px] font-bold tracking-tight text-1 transition-colors group-hover:text-lime-600 dark:group-hover:text-lime-300">
                        {project.guestName}
                      </h3>
                      <p className="truncate text-[11px] text-3">
                        {project.guestTitle || "未指定职位"}
                      </p>
                    </div>
                  </div>

                  {/* 主题引述 */}
                  <div className="inset relative mt-4 line-clamp-2 rounded-xl p-3 text-xs leading-relaxed text-2 border border-line-1">
                    {project.topic}
                  </div>

                  {/* 进度 */}
                  <div className="relative mt-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <Chip tone={status.tone} dot className="px-2 py-0.5 text-[10px]">
                        {status.label}
                      </Chip>
                      <span className="tabular text-[11px] text-4 font-mono">
                        {progress.completed}/{progress.total} 阶段
                      </span>
                    </div>
                    <StageDots done={progress.done} size="sm" />
                  </div>

                  {/* 底部指标 */}
                  <div className="relative mt-4 flex items-center justify-between border-t border-line-1 pt-3">
                    <div className="flex items-center gap-3 text-[11px] text-3 font-mono">
                      <span className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-4" />
                        <span className="tabular text-1 font-semibold">{metrics.questions}</span> 题
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Video className="h-3.5 w-3.5 text-4" />
                        <span className="tabular text-1 font-semibold">{metrics.videos}</span> 拆条
                      </span>
                    </div>
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-lime-600 dark:text-lime-400 group-hover:translate-x-0.5 transition-transform">
                      进入工作台
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ============ 新建访谈 Modal ============ */}
      {showModal && (
        <div
          className="animate-fade fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-project-title"
            tabIndex={-1}
            className="glass-panel animate-scale-in flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl outline-none"
          >
            {/* 弹窗头 */}
            <div className="flex items-start justify-between gap-4 border-b border-line-1 px-6 py-5">
              <div className="flex items-start gap-3">
                <IconTile icon={Sparkles} tone="indigo" size="md" />
                <div>
                  <h2
                    id="create-project-title"
                    className="text-[15px] font-semibold tracking-tight text-1"
                  >
                    创建新访谈项目
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-3">
                    填写访谈基本框架，AI 将自动组织嘉宾档案、故事章节与多级问题。
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-ghost btn-sm -mr-1.5 -mt-1"
                aria-label="关闭"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* 弹窗体 */}
            <form onSubmit={handleCreate} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="嘉宾姓名" required>
                    <input
                      type="text"
                      required
                      data-autofocus
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="如：张三"
                      className="field"
                    />
                  </Field>
                  <Field label="嘉宾职业 / 头衔">
                    <input
                      type="text"
                      value={guestTitle}
                      onChange={(e) => setGuestTitle(e.target.value)}
                      placeholder="如：AI 独立导演"
                      className="field"
                    />
                  </Field>
                </div>

                <Field label="本期访谈核心主题" required>
                  <input
                    type="text"
                    required
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="如：一个人如何用 AI 完成过去一个团队才能完成的电影"
                    className="field"
                  />
                </Field>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Field label="节目形态">
                    <select
                      value={showType}
                      onChange={(e) => setShowType(e.target.value)}
                      className="field"
                    >
                      {SHOW_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="视频时长" hint="分钟">
                    <input
                      type="number"
                      min={5}
                      max={180}
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                      className="field tabular"
                    />
                  </Field>
                  <Field label="目标受众">
                    <input
                      type="text"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      placeholder="如：AI 创作者"
                      className="field"
                    />
                  </Field>
                </div>

                <Field label="采访风格">
                  <div className="flex flex-wrap gap-2">
                    {STYLES.map((style) => {
                      const active = interviewStyle === style;
                      return (
                        <button
                          key={style}
                          type="button"
                          onClick={() => setInterviewStyle(style)}
                          className={
                            active
                              ? "btn btn-sm border border-indigo-400/40 bg-indigo-500/20 text-indigo-100 shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
                              : "btn btn-sm btn-secondary"
                          }
                        >
                          {style}
                        </button>
                      );
                    })}
                  </div>
                </Field>

                <Field label="希望重点挖掘的方向" hint="选填">
                  <textarea
                    rows={3}
                    value={focusDirection}
                    onChange={(e) => setFocusDirection(e.target.value)}
                    placeholder="如：挖掘从传统影视到一人制作的心理抗争、同行争论与真实身心代价"
                    className="field resize-none"
                  />
                </Field>
              </div>

              {/* 弹窗底 */}
              <div className="flex items-center justify-end gap-2 border-t border-line-1 tint-1 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-ghost btn-md"
                >
                  取消
                </button>
                <button type="submit" disabled={creating} className="btn btn-primary btn-md">
                  {creating ? "创建中..." : "立刻创建项目"}
                  {!creating && <ChevronRight className="h-4 w-4" />}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
