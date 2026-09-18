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

  const STATS: {
    label: string;
    value: number;
    hint: string;
    icon: typeof Tv;
    tone: Tone;
  }[] = [
    { label: "访谈项目", value: projects.length, hint: "统一上下文管理", icon: Tv, tone: "indigo" },
    {
      label: "分级策划问题",
      value: totalQuestions,
      hint: "含普通 / 故事 / 深度与追问",
      icon: FileText,
      tone: "violet",
    },
    {
      label: "短视频拆条",
      value: totalVideos,
      hint: "已标定入出点与封面",
      icon: Video,
      tone: "pink",
    },
    {
      label: "高光金句",
      value: totalQuotes,
      hint: "适配小红书 / 微博文案",
      icon: MessageSquareQuote,
      tone: "amber",
    },
  ];

  return (
    <div className="shell w-full py-10">
      {/* ============ Hero ============ */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="animate-rise">
          <Chip tone="indigo" dot>
            第二导演工作台 · V1.0
          </Chip>
          <h1 className="mt-5 text-[34px] font-semibold leading-[1.12] tracking-tightest text-gradient sm:text-[42px]">
            我的访谈项目
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-3">
            覆盖「资料研究 → 采访策划 → 模拟彩排与提词 → 录音转写 → 短视频拆条包装」全生命周期，
            让 AI 成为您身旁的第二导演。
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button onClick={() => setShowModal(true)} className="btn btn-primary btn-lg">
              <Plus className="h-4 w-4" />
              新建访谈项目
            </button>
            <span className="text-xs text-4">
              已沉淀 <span className="tabular text-2">{projects.length}</span> 个项目 ·{" "}
              <span className="tabular text-2">{totalQuestions}</span> 个策划问题
            </span>
          </div>
        </div>

        {/* 全流程示意 */}
        <div className="glass-panel animate-rise stagger-2 rounded-2xl p-5 sm:p-6">
          <div className="eyebrow mb-4">全流程覆盖</div>
          <ol className="space-y-1">
            {WORKFLOW_STAGES.map((stage, i) => {
              const Icon = STAGE_ICONS[i];
              return (
                <li
                  key={stage.key}
                  className="group flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-surface-2"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line-1 bg-surface-2 text-3 transition-colors group-hover:border-indigo-500/30 group-hover:text-indigo-300">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-medium text-2">{stage.short}</span>
                    <span className="block truncate text-[11px] text-4">
                      {stage.description}
                    </span>
                  </span>
                  <span className="tabular text-[11px] text-4">
                    0{i + 1}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ============ 数据概览 ============ */}
      <section className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {STATS.map((s, i) => (
          <div
            key={s.label}
            className={`glass-card animate-rise stagger-${i + 1} rounded-2xl p-4 sm:p-5`}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-[11px] font-medium text-3">{s.label}</span>
              <IconTile icon={s.icon} tone={s.tone} size="sm" />
            </div>
            <p className="mt-3 text-[28px] font-semibold leading-none tabular text-1">
              {s.value}
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-4">{s.hint}</p>
          </div>
        ))}
      </section>

      {/* ============ 项目列表 ============ */}
      <section className="mt-12">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-1">
              <Layers className="h-4 w-4 text-indigo-300" />
              项目列表
            </h2>
            <p className="mt-1 text-xs text-4">点击卡片进入该项目的五阶段工作台</p>
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

        {/* 状态筛选 */}
        {!loading && projects.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-1.5">
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
                  "btn btn-sm rounded-lg border",
                  statusFilter === f.key
                    ? "border-line-2 tint-4 text-1"
                    : "border-transparent text-3 hover:bg-surface-2 hover:text-2"
                )}
              >
                {f.label}
                <span className="tabular text-[10px] text-4">{statusCounts[f.key] || 0}</span>
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

            <span className="tabular ml-auto text-[11px] text-4">
              显示 {filteredProjects.length} / {projects.length} 个
            </span>
          </div>
        )}

        {loading ? (
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="glass-card h-56 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            className="mt-5"
            icon={Clapperboard}
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
            className="mt-5"
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
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredProjects.map((project, idx) => {
              const progress = getProjectProgress(project);
              const metrics = getProjectMetrics(project);
              const status = STATUS_META[project.status] ?? STATUS_META.researching;
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className={`glass-card card-hover animate-rise stagger-${
                    (idx % 6) + 1
                  } group relative flex flex-col overflow-hidden rounded-2xl p-5`}
                >
                  <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-indigo-500/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />

                  {/* 顶部：风格标签 + 删除 */}
                  <div className="relative flex items-center justify-between gap-2">
                    <Chip tone="indigo">
                      {project.interviewStyle} · {project.durationMinutes} 分钟
                    </Chip>
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
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line-2 bg-gradient-to-br from-white/[0.09] to-white/[0.02] text-sm font-semibold text-2">
                      {project.guestName?.slice(0, 1) || "?"}
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold tracking-tight text-1 transition-colors group-hover:text-indigo-200">
                        {project.guestName}
                      </h3>
                      <p className="truncate text-[11px] text-3">
                        {project.guestTitle || "未指定职位"}
                      </p>
                    </div>
                  </div>

                  {/* 主题 */}
                  <p className="inset relative mt-4 line-clamp-2 rounded-xl p-3 text-xs leading-relaxed text-2">
                    {project.topic}
                  </p>

                  {/* 进度 */}
                  <div className="relative mt-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <Chip tone={status.tone} dot className="px-2 py-0.5 text-[10px]">
                        {status.label}
                      </Chip>
                      <span className="tabular text-[11px] text-4">
                        {progress.completed}/{progress.total} 阶段
                      </span>
                    </div>
                    <StageDots done={progress.done} size="sm" />
                  </div>

                  {/* 底部指标 */}
                  <div className="relative mt-4 flex items-center justify-between border-t border-line-1 pt-3">
                    <div className="flex items-center gap-3 text-[11px] text-3">
                      <span className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-4" />
                        <span className="tabular">{metrics.questions}</span> 问题
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Video className="h-3.5 w-3.5 text-4" />
                        <span className="tabular">{metrics.videos}</span> 拆条
                      </span>
                    </div>
                    <span className="flex items-center gap-1 text-[11px] font-medium text-indigo-300">
                      进入工作台
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
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
