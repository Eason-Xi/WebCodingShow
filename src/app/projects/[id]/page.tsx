"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import {
  ArrowLeft,
  Compass,
  BookOpen,
  Mic,
  FileAudio,
  Video,
  Clock,
  Trash2,
  Check,
  Users,
  Target,
} from "lucide-react";
import { InterviewProject } from "@/types";
import { WORKFLOW_STAGES, STATUS_META, getProjectProgress, StageKey } from "@/lib/workflow";
import { Chip, ProgressBar } from "@/components/ui/Primitives";
import { confirmDialog, requestJson, runTask, toast } from "@/components/ui/Feedback";
import ProfileTab from "@/components/profile/ProfileTab";
import PlanningTab from "@/components/planning/PlanningTab";
import InterviewTab from "@/components/interview/InterviewTab";
import TranscriptTab from "@/components/transcript/TranscriptTab";
import ContentTab from "@/components/content/ContentTab";

type ActiveTab = StageKey;

const STAGE_ICONS = [Compass, BookOpen, Mic, FileAudio, Video];

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [project, setProject] = useState<InterviewProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("profile");

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      const json = await res.json();
      if (json.success) {
        setProject(json.data);
      } else {
        toast.error("加载项目失败", json.error || "服务端未返回该项目");
      }
    } catch (err) {
      toast.error("加载项目失败", err instanceof Error ? err.message : "网络请求异常");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchProject();
  }, [id]);

  // Tab 与 URL hash 同步：刷新 / 分享链接后仍停留在同一阶段
  useEffect(() => {
    const sync = () => {
      const key = window.location.hash.replace("#", "");
      if (WORKFLOW_STAGES.some((s) => s.key === key)) {
        setActiveTab(key as ActiveTab);
      }
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const selectTab = (key: ActiveTab) => {
    setActiveTab(key);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${key}`);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirmDialog({
      title: "删除该访谈项目？",
      description: `「${project?.guestName || "该项目"}」的全部资料、提纲、逐字稿与拆条资产都会被永久移除，此操作不可恢复。`,
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
    if (ok) router.push("/");
  };

  if (loading) {
    return (
      <div className="shell w-full py-8">
        <div className="glass-panel h-40 animate-pulse rounded-3xl" />
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[264px_minmax(0,1fr)]">
          <div className="glass-panel hidden h-80 animate-pulse rounded-2xl lg:block" />
          <div className="glass-panel h-96 animate-pulse rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="shell w-full py-24 text-center">
        <h2 className="text-base font-semibold text-1">未找到该访谈项目</h2>
        <Link href="/" className="btn btn-secondary btn-sm mt-4">
          <ArrowLeft className="h-3.5 w-3.5" />
          返回我的访谈看板
        </Link>
      </div>
    );
  }

  const progress = getProjectProgress(project);
  const status = STATUS_META[project.status] ?? STATUS_META.researching;
  const totalQuestions = project.chapters.reduce((acc, c) => acc + c.questions.length, 0);

  const COUNTS: Record<StageKey, number | string | undefined> = {
    profile: project.rawMaterials.length,
    planning: totalQuestions,
    interview: project.simulationSession?.messages?.length ? "已演练" : undefined,
    transcript: project.transcript?.length || 0,
    content: project.shortVideos?.length || 0,
  };

  const STEPS = WORKFLOW_STAGES.map((stage, i) => ({
    ...stage,
    icon: STAGE_ICONS[i],
    count: COUNTS[stage.key],
    done: progress.done[i],
  }));

  return (
    <div className="shell w-full py-8">
      {/* ============ 项目信息头 ============ */}
      <header className="glass-panel animate-rise relative overflow-hidden rounded-3xl p-6 sm:p-7">
        <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            {/* 面包屑 */}
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-3 transition-colors hover:text-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                返回项目列表
              </Link>
              <span className="text-4">/</span>
              <span className="font-medium text-indigo-300">{project.interviewStyle}</span>
              <span className="text-4">/</span>
              <span className="tabular flex items-center gap-1 text-3">
                <Clock className="h-3 w-3" />
                {project.durationMinutes} 分钟
              </span>
            </div>

            <h1 className="mt-3 text-[26px] font-semibold leading-tight tracking-tightest text-gradient sm:text-[32px]">
              {project.guestName}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-2">{project.topic}</p>

            {/* 元信息 */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Chip tone={status.tone} dot>
                {status.label}
              </Chip>
              {project.guestTitle && (
                <Chip tone="slate">
                  <Users className="h-3 w-3" />
                  {project.guestTitle}
                </Chip>
              )}
              {project.showType && <Chip tone="violet">{project.showType}</Chip>}
              {project.targetAudience && (
                <Chip tone="cyan">
                  <Target className="h-3 w-3" />
                  {project.targetAudience}
                </Chip>
              )}
            </div>

            {project.focusDirection && (
              <p className="inset mt-4 max-w-3xl rounded-xl p-3 text-xs leading-relaxed text-3">
                <span className="font-medium text-indigo-300">重点挖掘方向 · </span>
                {project.focusDirection}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {/* 进度环 */}
            <div className="hidden items-center gap-4 rounded-2xl border border-line-1 bg-surface-1 px-4 py-3 sm:flex">
              <div className="relative h-12 w-12">
                <svg viewBox="0 0 36 36" className="h-12 w-12 -rotate-90">
                  <circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    stroke="rgba(148,163,184,0.16)"
                    strokeWidth="3"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    stroke="url(#pg)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${(progress.percent / 100) * 97.4} 97.4`}
                    className="transition-[stroke-dasharray] duration-700 ease-out"
                  />
                  <defs>
                    <linearGradient id="pg" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#C9FF63" />
                      <stop offset="100%" stopColor="#84cc16" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="tabular absolute inset-0 grid place-items-center text-[11px] font-bold text-1 font-mono">
                  {progress.percent}%
                </span>
              </div>
              <div>
                <p className="text-[11px] text-4 font-mono">全流程进度</p>
                <p className="tabular text-xs font-semibold text-2">
                  {progress.completed} / {progress.total} 阶段完成
                </p>
              </div>
            </div>

            <button
              onClick={handleDelete}
              title="删除项目"
              className="btn btn-ghost btn-md hover:bg-rose-500/10 hover:text-rose-300"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ============ 主体：左侧流程导航 + 右侧内容 ============ */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[264px_minmax(0,1fr)]">
        {/* 侧栏流程导航 */}
        <aside className="hidden lg:block">
          <nav className="glass-panel sticky top-24 space-y-1 rounded-2xl p-2.5">
            <p className="eyebrow px-3 pb-2 pt-1.5 font-mono text-lime-600 dark:text-lime-400">02 · 工作流阶段</p>
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = activeTab === step.key;
              return (
                <button
                  key={step.key}
                  onClick={() => selectTab(step.key)}
                  className={clsx(
                    "group relative flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all duration-200",
                    isActive
                      ? "border-lime-500/35 bg-lime-400/[0.12] dark:border-lime-400/30 shadow-[0_2px_12px_rgba(201,255,99,0.12)]"
                      : "border-transparent hover:bg-surface-2"
                  )}
                >
                  {isActive && (
                    <span className="absolute bottom-3 left-0 top-3 w-0.5 rounded-full bg-lime-500 dark:bg-lime-400 shadow-[0_0_8px_rgba(201,255,99,0.5)]" />
                  )}
                  <span
                    className={clsx(
                      "grid h-7 w-7 shrink-0 place-items-center rounded-lg border text-[11px] font-semibold transition-colors",
                      step.done
                        ? "border-lime-500/35 bg-lime-400/15 text-lime-700 dark:text-lime-300 font-bold"
                        : isActive
                        ? "border-lime-500/40 bg-lime-400/20 text-lime-700 dark:text-lime-300"
                        : "border-line-2 bg-surface-2 text-4 group-hover:text-3"
                    )}
                  >
                    {step.done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span
                        className={clsx(
                          "truncate text-xs font-semibold",
                          isActive ? "text-1" : "text-2"
                        )}
                      >
                        {step.short}
                      </span>
                      {step.count !== undefined && step.count !== 0 && (
                        <span className="tabular shrink-0 rounded-full tint-3 px-1.5 py-0.5 text-[10px] text-3 font-mono">
                          {step.count}
                        </span>
                      )}
                    </span>
                    <span
                      className={clsx(
                        "mt-1 block text-[11px] leading-snug",
                        isActive ? "text-2" : "text-3"
                      )}
                    >
                      {step.description}
                    </span>
                  </span>
                </button>
              );
            })}

            <div className="mt-2 border-t border-line-1 px-3 pb-1 pt-3">
              <div className="mb-2 flex items-center justify-between text-[11px] text-4 font-mono">
                <span>整体进度</span>
                <span className="tabular font-bold text-1">{progress.percent}%</span>
              </div>
              <ProgressBar
                percent={progress.percent}
                tone="lime"
              />
            </div>
          </nav>
        </aside>

        {/* 移动端横向步骤条 */}
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:hidden">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isActive = activeTab === step.key;
            return (
              <button
                key={step.key}
                onClick={() => selectTab(step.key)}
                className={clsx(
                  "flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-medium transition-colors",
                  isActive
                    ? "border-lime-500/40 bg-lime-400/20 text-lime-700 dark:text-lime-300 font-semibold"
                    : "border-line-1 bg-surface-1 text-3"
                )}
              >
                {step.done ? (
                  <Check className="h-3.5 w-3.5 text-lime-500 dark:text-lime-400" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
                {step.short}
              </button>
            );
          })}
        </div>

        {/* Tab 内容 */}
        <div key={activeTab} className="animate-fade min-w-0">
          {activeTab === "profile" && (
            <ProfileTab project={project} onUpdate={(updated) => setProject(updated)} />
          )}
          {activeTab === "planning" && (
            <PlanningTab project={project} onUpdate={(updated) => setProject(updated)} />
          )}
          {activeTab === "interview" && (
            <InterviewTab project={project} onUpdate={(updated) => setProject(updated)} />
          )}
          {activeTab === "transcript" && (
            <TranscriptTab project={project} onUpdate={(updated) => setProject(updated)} />
          )}
          {activeTab === "content" && (
            <ContentTab project={project} onUpdate={(updated) => setProject(updated)} />
          )}
        </div>
      </div>
    </div>
  );
}
