"use client";

import { useState } from "react";
import { InterviewChapter, InterviewProject, QuestionStatus, QuestionType } from "@/types";
import {
  BookOpen,
  CornerDownRight,
  Clock,
  Target,
  RefreshCw,
  CheckCircle2,
  SkipForward,
  Star,
  Layers,
  StickyNote,
  Copy,
  Check,
} from "lucide-react";
import { Chip, EmptyState, TabHeader, type Tone } from "@/components/ui/Primitives";
import { requestJson, runTask, toast } from "@/components/ui/Feedback";

interface Props {
  project: InterviewProject;
  onUpdate: (updated: InterviewProject) => void;
}

const TYPE_META: Record<QuestionType, { label: string; tone: Tone; desc: string }> = {
  normal: { label: "基础背景", tone: "slate", desc: "铺垫信息，建立信任" },
  story: { label: "故事细节", tone: "indigo", desc: "还原场景与细节" },
  deep: { label: "深度交锋", tone: "purple", desc: "触碰矛盾与价值观" },
};

const STATUS_META: Record<QuestionStatus, { label: string; tone: Tone; icon: typeof Star } | null> = {
  pending: null,
  asked: { label: "已问", tone: "emerald", icon: CheckCircle2 },
  skipped: { label: "已跳过", tone: "slate", icon: SkipForward },
  highlight: { label: "高光", tone: "amber", icon: Star },
};

export default function PlanningTab({ project, onUpdate }: Props) {
  const [generating, setGenerating] = useState(false);
  const [noteEditingId, setNoteEditingId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const totalQuestions = project.chapters.reduce((acc, c) => acc + c.questions.length, 0);
  const totalMinutes = project.chapters.reduce(
    (acc, c) => acc + (c.estimatedMinutes || 0),
    0
  );

  const handleGenerate = async () => {
    setGenerating(true);

    const { ok, data } = await runTask<InterviewChapter[]>(
      "AI 正在编排叙事大纲...",
      "采访策划大纲已生成",
      () =>
        requestJson<InterviewChapter[]>("/api/planner/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId: project.id }),
        }),
      "策划大纲生成失败"
    );

    if (ok && data) {
      onUpdate({
        ...project,
        chapters: data,
        status: project.status === "planning" ? "interviewing" : project.status,
      });
    }
    setGenerating(false);
  };

  /** 保存问题级「现场笔记」，走乐观更新 + 失败提示 */
  const handleSaveNote = async (chId: string, qId: string) => {
    const text = noteDraft.trim();

    const chapters = project.chapters.map((ch) =>
      ch.id === chId
        ? {
            ...ch,
            questions: ch.questions.map((q) =>
              q.id === qId ? { ...q, userNotes: text || undefined } : q
            ),
          }
        : ch
    );

    const updated = { ...project, chapters };
    onUpdate(updated);
    setNoteEditingId(null);
    setNoteDraft("");

    setNoteSaving(true);
    try {
      // 只提交 chapters：整份项目快照会覆盖并发进行中的 AI 结果
      await requestJson(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapters }),
      });
    } catch (e) {
      toast.error("笔记未能同步到服务端", e instanceof Error ? e.message : "网络请求异常");
    } finally {
      setNoteSaving(false);
    }
  };

  /** 导出整份提纲为纯文本，方便带到采访现场 */
  const handleCopyOutline = async () => {
    const lines: string[] = [];
    lines.push(
      `${project.guestName}${project.guestTitle ? `（${project.guestTitle}）` : ""}`
    );
    lines.push(`主题：${project.topic}`);
    lines.push(
      `风格：${project.interviewStyle} · 预计 ${project.durationMinutes} 分钟 · 共 ${project.chapters.length} 章 / ${totalQuestions} 题`
    );
    lines.push("");

    project.chapters.forEach((ch) => {
      // AI 生成的标题本身常带「Chapter N：」前缀，导出时去掉避免重复
      const title = ch.title.replace(/^\s*Chapter\s*\d+\s*[：:]\s*/i, "");
      lines.push("────────────────────────────");
      lines.push(`Chapter ${ch.order}｜${title}`);
      lines.push(`采访意图：${ch.goal}`);
      lines.push(`预计时长：${ch.estimatedMinutes || 5} 分钟`);
      lines.push("");
      ch.questions.forEach((q, i) => {
        lines.push(`  ${ch.order}.${i + 1}（${TYPE_META[q.type]?.label ?? "问题"}）${q.text}`);
        (q.followUps || []).forEach((f) => lines.push(`      ↳ 追问：${f}`));
        if (q.userNotes) lines.push(`      ★ 现场笔记：${q.userNotes}`);
        lines.push("");
      });
    });

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("提纲已复制到剪贴板", "可直接粘贴到备忘录或打印");
    } catch {
      toast.error("复制失败", "当前浏览器不允许访问剪贴板，请手动选中复制。");
    }
  };

  return (
    <div className="space-y-6">
      <TabHeader
        icon={BookOpen}
        tone="indigo"
        title="AI 采访叙事策划与多级问题生成器"
        description="避免散碎提问，AI 像纪录片导演一样把访谈构筑成起承转合的完整故事，每个问题均配置深度分级与现场追问支架。"
        meta={
          <>
            <Chip tone="slate">
              <Layers className="h-3 w-3" />
              {project.chapters.length} 章节
            </Chip>
            <Chip tone="indigo">{totalQuestions} 个精选提问</Chip>
            {totalMinutes > 0 && <Chip tone="violet">约 {totalMinutes} 分钟</Chip>}
          </>
        }
        actions={
          <>
            {project.chapters.length > 0 && (
              <button onClick={handleCopyOutline} className="btn btn-secondary btn-md">
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? "已复制" : "复制提纲"}
              </button>
            )}
            <button onClick={handleGenerate} disabled={generating} className="btn btn-primary btn-md">
              <RefreshCw className={generating ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
              {generating ? "AI 策划编排中..." : "重新 AI 策划大纲"}
            </button>
          </>
        }
      />

      {project.chapters.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="暂未生成访谈故事策划大纲"
          description="点击下方按钮，AI 将根据嘉宾背景与采访风格，自动规划 4~5 个层层递进的章节脉络与多级问题。"
          action={
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="btn btn-primary btn-md"
            >
              <RefreshCw className={generating ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              {generating ? "策划中..." : "一键生成策划大纲"}
            </button>
          }
        />
      ) : (
        <>
          {/* 叙事结构总览 */}
          <div className="glass-panel rounded-2xl p-5">
            <div className="eyebrow mb-3 px-1 text-xs sm:text-[13px]">叙事结构脉络</div>
            <div className="no-scrollbar flex items-center gap-3 overflow-x-auto pb-1">
              {project.chapters.map((chapter, i) => (
                <div key={chapter.id} className="flex shrink-0 items-center gap-3">
                  <div className="rounded-xl border border-line-1 bg-surface-1 px-3.5 py-2.5">
                    <p className="tabular text-xs font-bold text-indigo-400 dark:text-indigo-300 font-mono">
                      CHAPTER {chapter.order}
                    </p>
                    <p className="mt-1 max-w-[180px] truncate text-sm font-semibold text-1">
                      {chapter.title}
                    </p>
                  </div>
                  {i < project.chapters.length - 1 && (
                    <span className="text-3 text-sm">›</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 章节卡片流 */}
          <div className="space-y-6">
            {project.chapters.map((chapter, chapterIdx) => (
              <section
                key={chapter.id}
                className={`glass-card animate-rise stagger-${(chapterIdx % 6) + 1} overflow-hidden rounded-2xl`}
              >
                {/* 章节头 */}
                <div className="flex flex-col gap-3.5 border-b border-line-1 tint-1 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3.5">
                    <span className="tabular grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/30 to-violet-500/10 text-base font-extrabold text-indigo-200">
                      {chapter.order}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-lg font-bold tracking-tight text-1">
                        {chapter.title}
                      </h3>
                      <p className="mt-1 flex items-start gap-2 text-sm leading-relaxed text-2">
                        <Target className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
                        采访意图：{chapter.goal}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2.5">
                    <Chip tone="slate" className="px-3 py-1 text-xs">
                      <Clock className="h-3.5 w-3.5" />
                      预计 {chapter.estimatedMinutes || 5} 分钟
                    </Chip>
                    <Chip tone="indigo" className="px-3 py-1 text-xs">{chapter.questions.length} 题</Chip>
                  </div>
                </div>

                {/* 问题列表 */}
                <div className="space-y-4 p-5">
                  {chapter.questions.map((q, qIndex) => {
                    const typeMeta = TYPE_META[q.type] ?? TYPE_META.normal;
                    const statusMeta = STATUS_META[q.status];
                    const StatusIcon = statusMeta?.icon;
                    const isEditingNote = noteEditingId === q.id;

                    return (
                      <article
                        key={q.id}
                        className="rounded-xl border border-line-1 bg-surface-1 p-4 sm:p-5 transition-colors hover:border-line-2 hover:bg-surface-2"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex min-w-0 items-start gap-3.5">
                            <span className="tabular mt-0.5 shrink-0 rounded-md tint-3 px-2 py-0.5 text-xs font-bold text-3 font-mono">
                              Q{chapter.order}.{qIndex + 1}
                            </span>
                            <p className="text-base font-semibold leading-relaxed text-1">
                              {q.text}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1.5">
                            <Chip tone={typeMeta.tone} className="px-2.5 py-0.5 text-xs">
                              {typeMeta.label}
                            </Chip>
                            {statusMeta && StatusIcon && (
                              <Chip tone={statusMeta.tone} className="px-2.5 py-0.5 text-xs">
                                <StatusIcon className="h-3 w-3" />
                                {statusMeta.label}
                              </Chip>
                            )}
                          </div>
                        </div>

                        {/* 追问支架 */}
                        {q.followUps && q.followUps.length > 0 && (
                          <div className="mt-4 border-t border-line-1 pt-3.5">
                            <p className="flex items-center gap-1.5 text-xs sm:text-[13px] font-semibold text-indigo-400 dark:text-indigo-300">
                              <CornerDownRight className="h-4 w-4" />
                              备选现场追问支架
                              <span className="font-normal text-3">（嘉宾未说透时触发）</span>
                            </p>
                            <div className="mt-2.5 space-y-2 pl-5">
                              {q.followUps.map((fu, fuIdx) => (
                                <p
                                  key={fuIdx}
                                  className="inset flex items-start gap-2.5 rounded-lg px-3.5 py-2.5 text-sm leading-relaxed text-2"
                                >
                                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                                  {fu}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 现场笔记：可编辑，会带入提词台 */}
                        {isEditingNote ? (
                          <div className="mt-4 border-t border-line-1 pt-3.5">
                            <textarea
                              autoFocus
                              rows={2}
                              value={noteDraft}
                              onChange={(e) => setNoteDraft(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                                  handleSaveNote(chapter.id, q.id);
                                }
                                if (e.key === "Escape") {
                                  setNoteEditingId(null);
                                  setNoteDraft("");
                                }
                              }}
                              placeholder="记录现场观察、嘉宾反应或需要回避的雷区…（Ctrl / ⌘ + Enter 保存）"
                              className="field resize-none text-sm leading-relaxed"
                            />
                            <div className="mt-2.5 flex justify-end gap-2">
                              <button
                                onClick={() => {
                                  setNoteEditingId(null);
                                  setNoteDraft("");
                                }}
                                className="btn btn-ghost btn-xs text-xs"
                              >
                                取消
                              </button>
                              <button
                                onClick={() => handleSaveNote(chapter.id, q.id)}
                                disabled={noteSaving}
                                className="btn btn-primary btn-xs text-xs px-3.5"
                              >
                                {noteSaving ? "保存中..." : "保存笔记"}
                              </button>
                            </div>
                          </div>
                        ) : q.userNotes ? (
                          <div className="mt-3.5 flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/[0.07] px-3.5 py-2.5">
                            <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                            <p className="flex-1 text-sm leading-relaxed text-amber-200">
                              {q.userNotes}
                            </p>
                            <button
                              onClick={() => {
                                setNoteEditingId(q.id);
                                setNoteDraft(q.userNotes || "");
                              }}
                              className="btn btn-ghost btn-xs shrink-0 -mr-1 text-xs text-amber-300/80 hover:text-amber-200"
                            >
                              编辑
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setNoteEditingId(q.id);
                              setNoteDraft("");
                            }}
                            className="btn btn-ghost btn-xs mt-3.5 -ml-2 text-xs text-3 hover:text-1"
                          >
                            <StickyNote className="h-3.5 w-3.5" />
                            添加现场笔记
                          </button>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
