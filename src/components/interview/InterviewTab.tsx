"use client";

import { useRef, useEffect, useState } from "react";
import {
  InterviewProject,
  QuestionStatus,
  SimulationMessage,
  SimulationReview,
} from "@/types";
import {
  Sparkles,
  Award,
  Send,
  CheckCircle2,
  SkipForward,
  Star,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Bot,
  User,
  Tv,
  CornerDownRight,
  Radio,
  ChevronLeft,
  ChevronRight,
  Quote,
  StickyNote,
  Check,
} from "lucide-react";
import clsx from "clsx";
import { Chip, SectionTitle, TabHeader } from "@/components/ui/Primitives";
import { requestJson, runTask, toast } from "@/components/ui/Feedback";

interface Props {
  project: InterviewProject;
  onUpdate: (updated: InterviewProject) => void;
}

export default function InterviewTab({ project, onUpdate }: Props) {
  const [subMode, setSubMode] = useState<"simulation" | "teleprompter">(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("subMode") === "teleprompter") return "teleprompter";
    }
    return "simulation";
  });
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);

  // 提词台状态：当前选中的问题索引
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 发送模拟对练提问
  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || chatInput;
    if (!textToSend.trim() || chatLoading) return;

    setChatLoading(true);
    if (!customText) setChatInput("");

    try {
      const data = await requestJson<{ allMessages: SimulationMessage[] }>(
        "/api/simulation/chat",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId: project.id, message: textToSend, project }),
        }
      );
      onUpdate({
        ...project,
        simulationSession: {
          id: project.simulationSession?.id || `sim-${Date.now()}`,
          projectId: project.id,
          messages: data.allMessages,
          reviewReport: project.simulationSession?.reviewReport,
          createdAt: project.simulationSession?.createdAt || new Date().toISOString(),
        },
      });
    } catch (err) {
      toast.error("对练请求失败", err instanceof Error ? err.message : "网络请求异常");
    } finally {
      setChatLoading(false);
    }
  };

  // 生成第二导演复盘报告
  const handleGenerateReview = async () => {
    setReviewLoading(true);

    const { ok, data } = await runTask<SimulationReview>(
      "AI 导演正在复盘本次彩排...",
      "第二导演复盘报告已生成",
      () =>
        requestJson<SimulationReview>("/api/simulation/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId: project.id, project }),
        }),
      "复盘报告生成失败"
    );

    if (ok && data && project.simulationSession) {
      onUpdate({
        ...project,
        simulationSession: {
          ...project.simulationSession,
          reviewReport: data,
        },
      });
    }
    setReviewLoading(false);
  };

  const allQuestionsFlat = project.chapters.flatMap((c) => c.questions);
  const currentQ = allQuestionsFlat[currentQuestionIdx] || allQuestionsFlat[0];
  // 由当前问题反推所属章节（修复跨章节标记错位）
  const currentChapter =
    project.chapters.find((ch) => ch.questions.some((q) => q.id === currentQ?.id)) ||
    project.chapters[0];

  const askedCount = allQuestionsFlat.filter((q) => q.status === "asked").length;
  const highlightCount = allQuestionsFlat.filter((q) => q.status === "highlight").length;
  const skippedCount = allQuestionsFlat.filter((q) => q.status === "skipped").length;

  // 提词台标记问题状态（支持 Toggle 撤销与即时反馈）
  const handleToggleQuestionStatus = async (
    chId: string,
    qId: string,
    targetStatus: QuestionStatus
  ) => {
    const q = allQuestionsFlat.find((item) => item.id === qId);
    const nextStatus: QuestionStatus = q?.status === targetStatus ? "pending" : targetStatus;

    const updatedChapters = project.chapters.map((ch) => {
      if (ch.id === chId) {
        return {
          ...ch,
          questions: ch.questions.map((item) =>
            item.id === qId ? { ...item, status: nextStatus } : item
          ),
        };
      }
      return ch;
    });

    const updated = { ...project, chapters: updatedChapters };
    onUpdate(updated);

    // 即时操作微反馈
    if (nextStatus === "highlight") {
      toast.success("已标记为高光金句", "该问题已被高亮记录为全场焦点");
    } else if (nextStatus === "asked") {
      toast.success("已标记为已问", "已记录为完成提问");
    } else if (nextStatus === "skipped") {
      toast.info("已跳过此题", "该问题已标注为跳过");
    } else {
      toast.info("已恢复为待提问", "已清除当前题目的状态标记");
    }

    try {
      // 只提交变更的字段：整份项目快照会把并发进行中的 AI 结果（如复盘报告）覆盖掉
      await requestJson(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapters: updatedChapters }),
      });
    } catch (e) {
      toast.error(
        "标记未能同步到服务端",
        e instanceof Error ? e.message : "网络请求异常"
      );
    }
  };

  const simSession = project.simulationSession;
  const messages = simSession?.messages || [];
  const review = simSession?.reviewReport;

  // 新消息自动滚到底
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, chatLoading]);

  const progressPercent =
    allQuestionsFlat.length > 0
      ? Math.round(((currentQuestionIdx + 1) / allQuestionsFlat.length) * 100)
      : 0;

  // 现场提词台键盘操作：录制时主持人双手不便离开镜头去点鼠标
  useEffect(() => {
    if (subMode !== "teleprompter") return;

    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)) return;

      const last = allQuestionsFlat.length - 1;

      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        setCurrentQuestionIdx((p) => Math.min(last, p + 1));
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        setCurrentQuestionIdx((p) => Math.max(0, p - 1));
      } else if (e.key === " " || e.key === "Enter") {
        // 标记已问并自动推进到下一题
        e.preventDefault();
        if (currentQ && currentChapter) {
          handleToggleQuestionStatus(currentChapter.id, currentQ.id, "asked");
          setCurrentQuestionIdx((p) => Math.min(last, p + 1));
        }
      } else if (e.key === "h" || e.key === "H") {
        if (currentQ && currentChapter) {
          handleToggleQuestionStatus(currentChapter.id, currentQ.id, "highlight");
        }
      } else if (e.key === "s" || e.key === "S") {
        if (currentQ && currentChapter) {
          handleToggleQuestionStatus(currentChapter.id, currentQ.id, "skipped");
        }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [subMode, project, currentQ, currentChapter, currentQuestionIdx, allQuestionsFlat.length]);

  return (
    <div className="space-y-6">
      <TabHeader
        icon={Sparkles}
        tone="violet"
        title="采访核心演练与现场提词台"
        description="彩排时由 AI 深度还原嘉宾进行高保真演练并复盘；现场录制时切换为免干扰的沉浸式提词台。"
        meta={
          <>
            {messages.length > 0 && <Chip tone="indigo">{messages.length} 轮对练</Chip>}
            {review && <Chip tone="purple">复盘 {review.overallRating} 分</Chip>}
            {allQuestionsFlat.length > 0 && (
              <Chip tone="slate">{allQuestionsFlat.length} 个可提问题</Chip>
            )}
          </>
        }
        actions={
          <div className="flex items-center gap-1 rounded-xl border border-line-1 bg-surface-inset p-1">
            {(
              [
                { key: "simulation", label: "AI 模拟访谈彩排", icon: Bot },
                { key: "teleprompter", label: "现场沉浸提词台", icon: Tv },
              ] as const
            ).map(({ key, label, icon: Icon }) => {
              const active = subMode === key;
              return (
                <button
                  key={key}
                  onClick={() => setSubMode(key)}
                  className={clsx(
                    "btn btn-sm rounded-lg",
                    active
                      ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-accent"
                      : "text-3 hover:bg-surface-2 hover:text-1"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              );
            })}
          </div>
        }
      />

      {/* ================= 子模式 1：AI 模拟访谈彩排 ================= */}
      {subMode === "simulation" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* 左侧：对练聊天流 */}
          <div className="glass-panel flex h-[740px] flex-col overflow-hidden rounded-2xl lg:col-span-7">
            {/* 聊天顶栏 */}
            <div className="flex items-center justify-between gap-3 border-b border-line-1 tint-1 p-4 sm:p-5">
              <div className="flex min-w-0 items-center gap-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-indigo-500/30 bg-gradient-to-br from-indigo-500/25 to-violet-500/10 text-sm font-bold text-indigo-200">
                  {project.guestName?.slice(0, 1) || "?"}
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-bold text-1">
                    <span className="truncate">对练嘉宾：{project.guestName}</span>
                    <Chip tone="emerald" dot className="px-2.5 py-0.5 text-xs font-semibold">
                      性格已载入
                    </Chip>
                  </p>
                  <p className="truncate text-xs text-3">{project.guestTitle || "未指定职位"}</p>
                </div>
              </div>

              {messages.length > 0 && (
                <button
                  onClick={handleGenerateReview}
                  disabled={reviewLoading}
                  className="btn btn-md shrink-0 border border-purple-500/30 bg-purple-500/15 text-purple-200 hover:bg-purple-500/25 text-xs sm:text-sm"
                >
                  <Award className={reviewLoading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                  {reviewLoading ? "导演复盘中..." : "生成复盘报告"}
                </button>
              )}
            </div>

            {/* 消息列表 */}
            <div ref={scrollRef} className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                  <span className="grid h-16 w-16 place-items-center rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/20 to-violet-500/10">
                    <Bot className="h-7 w-7 text-indigo-300" />
                  </span>
                  <p className="mt-4 text-base font-bold text-1">
                    开始与「{project.guestName}」进行模拟对练
                  </p>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-2">
                    AI 已全面消化嘉宾的生平资料、矛盾点与作品。你可以演练提问，检验回答是否符合预期，随时练习追问。
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isInterviewer = msg.role === "interviewer";
                  return (
                    <div
                      key={msg.id}
                      className={clsx(
                        "flex items-start gap-3",
                        isInterviewer ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      <span
                        className={clsx(
                          "grid h-8 w-8 shrink-0 place-items-center rounded-full border text-xs font-bold",
                          isInterviewer
                            ? "border-indigo-400/30 bg-indigo-500/20 text-indigo-200"
                            : "border-line-2 bg-surface-2 text-2"
                        )}
                      >
                        {isInterviewer ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </span>

                      <div className="max-w-[85%]">
                        <div
                          className={clsx(
                            "mb-1.5 flex items-center gap-2 text-xs text-3",
                            isInterviewer ? "justify-end" : "justify-start"
                          )}
                        >
                          <span className="font-medium">{isInterviewer ? "主持人（你）" : project.guestName}</span>
                          <span className="tabular font-mono">{msg.timestamp}</span>
                        </div>
                        <div
                          className={clsx(
                            "rounded-2xl px-4 py-3 text-sm sm:text-base leading-relaxed",
                            isInterviewer
                              ? "rounded-tr-sm bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-accent font-normal"
                              : "rounded-tl-sm border border-line-1 bg-surface-1 text-1"
                          )}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {chatLoading && (
                <div className="flex items-center gap-3 px-1 text-sm text-indigo-300">
                  <span className="grid h-8 w-8 place-items-center rounded-full border border-line-2 bg-surface-2">
                    <Bot className="h-4 w-4" />
                  </span>
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    {project.guestName} 正在深度思考回答...
                  </span>
                </div>
              )}
            </div>

            {/* 快捷带入问题 */}
            {allQuestionsFlat.length > 0 && (
              <div className="no-scrollbar flex items-center gap-2.5 overflow-x-auto border-t border-line-1 bg-[color:var(--well)] px-4 py-2.5">
                <span className="shrink-0 text-xs font-bold text-3">快捷带入</span>
                {allQuestionsFlat.slice(0, 3).map((q, i) => (
                  <button
                    key={q.id}
                    onClick={() => handleSendMessage(q.text)}
                    className="max-w-[240px] shrink-0 truncate rounded-lg border border-line-1 bg-surface-1 px-3 py-1.5 text-xs text-2 transition-colors hover:border-indigo-500/30 hover:bg-surface-2 hover:text-1 font-medium"
                    title={q.text}
                  >
                    Q{i + 1}: {q.text}
                  </button>
                ))}
              </div>
            )}

            {/* 输入区 */}
            <div className="flex items-center gap-2.5 border-t border-line-1 tint-2 p-3.5">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder={`输入你想对 ${project.guestName} 提出的问题或现场追问...`}
                className="field h-11 flex-1 py-0 text-sm sm:text-base"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={chatLoading || !chatInput.trim()}
                className="btn btn-primary h-11 w-11 shrink-0 p-0"
                aria-label="发送"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* 右侧：导演复盘报告 */}
          <div className="glass-panel flex h-[740px] flex-col overflow-hidden rounded-2xl lg:col-span-5">
            <div className="flex items-center justify-between border-b border-line-1 tint-1 px-5 py-4">
              <SectionTitle icon={Award} tone="purple">
                第二导演复盘评估报告
              </SectionTitle>
              {review && (
                <Chip tone="purple" className="px-2.5 py-0.5 text-xs font-semibold">
                  AI 导演
                </Chip>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {!review ? (
                <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                  <span className="grid h-16 w-16 place-items-center rounded-2xl border border-purple-500/25 bg-gradient-to-br from-purple-500/20 to-fuchsia-500/10">
                    <Award className="h-7 w-7 text-purple-300" />
                  </span>
                  <p className="mt-4 text-sm font-bold text-1">尚未生成复盘评估</p>
                  <p className="mt-2 max-w-xs text-xs leading-relaxed text-3">
                    在左侧进行至少 1~2 轮对练提问后，点击「生成复盘报告」，AI 导演将指出你在彩排中的提问漏洞与错失的追问良机。
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 评分 */}
                  <div className="rounded-2xl border border-purple-500/25 bg-gradient-to-br from-purple-500/[0.12] to-fuchsia-500/[0.05] p-5">
                    <div className="flex items-center gap-5">
                      <div className="relative h-18 w-18 shrink-0">
                        <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
                          <circle
                            cx="18"
                            cy="18"
                            r="15.5"
                            fill="none"
                            stroke="rgba(168,85,247,0.18)"
                            strokeWidth="3"
                          />
                          <circle
                            cx="18"
                            cy="18"
                            r="15.5"
                            fill="none"
                            stroke="#c084fc"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeDasharray={`${(Math.min(review.overallRating, 100) / 100) * 97.4} 97.4`}
                          />
                        </svg>
                        <span className="tabular absolute inset-0 grid place-items-center text-lg font-extrabold text-purple-200">
                          {review.overallRating}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-purple-200">彩排提问综合评分</p>
                        <p className="mt-1.5 text-sm leading-relaxed text-1">{review.summary}</p>
                      </div>
                    </div>
                  </div>

                  {/* 亮点 */}
                  {review.strengths?.length > 0 && (
                    <section className="rounded-2xl border border-line-1 bg-surface-1 p-4">
                      <SectionTitle icon={CheckCircle2} tone="emerald" className="mb-3">
                        表现出色之处
                      </SectionTitle>
                      <ul className="space-y-2.5">
                        {review.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-1">
                            <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-400" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {/* 错失良机 */}
                  {review.missedOpportunities?.length > 0 && (
                    <section className="space-y-3 rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-4">
                      <SectionTitle icon={AlertCircle} tone="amber">
                        错失追问良机
                        <span className="ml-1 text-xs font-normal text-amber-300/80">
                          重点改进
                        </span>
                      </SectionTitle>
                      {review.missedOpportunities.map((m, i) => (
                        <div
                          key={i}
                          className="space-y-2.5 rounded-xl border border-line-1 bg-[color:var(--well)] p-4"
                        >
                          <p className="flex items-start gap-2 text-xs sm:text-[13px] italic leading-relaxed text-2">
                            <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-3" />
                            {m.dialogueSnippet}
                          </p>
                          <p className="text-sm leading-relaxed text-rose-300 font-medium">
                            {m.reason}
                          </p>
                          <p className="rounded-lg border border-indigo-500/25 bg-indigo-500/[0.1] p-3 text-sm leading-relaxed text-indigo-100">
                            <span className="font-bold text-indigo-300">导演建议追问：</span>
                            {m.suggestedFollowUp}
                          </p>
                        </div>
                      ))}
                    </section>
                  )}

                  {/* 战术锦囊 */}
                  {review.overallAdvice?.length > 0 && (
                    <section className="rounded-2xl border border-line-1 bg-surface-1 p-4">
                      <SectionTitle icon={HelpCircle} tone="indigo" className="mb-3">
                        正式采访战术锦囊
                      </SectionTitle>
                      <ul className="space-y-2.5">
                        {review.overallAdvice.map((a, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-1">
                            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-indigo-400" />
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= 子模式 2：现场沉浸提词台 ================= */}
      {subMode === "teleprompter" && (
        <div className="glass-panel flex min-h-[640px] flex-col overflow-hidden rounded-3xl">
          {/* 顶栏 */}
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line-1 px-6 py-4 sm:px-8">
            <span className="flex items-center gap-3 text-sm text-1">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-rose-500 animate-ping-soft" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" />
              </span>
              <span className="font-bold">现场录制模式</span>
              <Chip tone="rose" className="px-2.5 py-0.5 text-xs font-bold">
                <Radio className="h-3 w-3" />
                LIVE
              </Chip>
            </span>

            {/* 键盘快捷键提示（录制时无需触碰鼠标） */}
            <div className="hidden items-center gap-4 text-xs text-3 xl:flex">
              {[
                { keys: ["←", "→"], label: "切换" },
                { keys: ["空格"], label: "已问·下一题" },
                { keys: ["H"], label: "高光" },
                { keys: ["S"], label: "跳过" },
              ].map((h) => (
                <span key={h.label} className="flex items-center gap-1.5 font-medium">
                  <span className="flex items-center gap-1">
                    {h.keys.map((k) => (
                      <kbd
                        key={k}
                        className="rounded-md border border-line-2 bg-surface-2 px-2 py-0.5 font-mono text-xs leading-none text-1 shadow-sm"
                      >
                        {k}
                      </kbd>
                    ))}
                  </span>
                  {h.label}
                </span>
              ))}
            </div>

            <span className="max-w-[40%] truncate text-sm text-2">
              当前章节 ·{" "}
              <span className="font-bold text-1">
                {currentChapter?.title || "未分章节"}
              </span>
            </span>
          </div>

          {/* 主体 */}
          <div
            className={clsx(
              "relative flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 transition-all duration-300",
              currentQ?.status === "highlight" && "bg-amber-500/[0.03]",
              currentQ?.status === "asked" && "bg-emerald-500/[0.02]"
            )}
          >
            {/* 高光氛围光晕 */}
            {currentQ?.status === "highlight" && (
              <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 mx-auto h-72 w-3/4 rounded-full bg-amber-500/10 blur-3xl" />
            )}

            <div className="relative mx-auto w-full max-w-4xl text-center">
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <Chip tone="indigo" className="px-3.5 py-1 text-xs font-bold tracking-[0.14em]">
                  CURRENT QUESTION · 当前提问
                </Chip>
                {currentQ?.status === "highlight" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)] animate-pulse">
                    <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500 dark:fill-amber-300 dark:text-amber-300" />
                    高光金句聚焦
                  </span>
                )}
                {currentQ?.status === "asked" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5 fill-emerald-500/20" />
                    本题已问
                  </span>
                )}
                {currentQ?.status === "skipped" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-500/30 bg-slate-500/15 px-3 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <SkipForward className="h-3.5 w-3.5" />
                    已跳过
                  </span>
                )}
              </div>

              <h1
                className={clsx(
                  "mt-8 text-3xl font-extrabold leading-[1.38] tracking-tight sm:text-[44px] transition-colors duration-200",
                  currentQ?.status === "highlight"
                    ? "text-amber-950 dark:text-amber-100"
                    : currentQ?.status === "skipped"
                    ? "text-3 line-through"
                    : "text-1"
                )}
              >
                {currentQ?.text || "提纲中暂无问题"}
              </h1>

              {currentQ?.followUps && currentQ.followUps.length > 0 && (
                <div className="mx-auto mt-12 max-w-3xl">
                  <p className="flex items-center justify-center gap-2 text-sm sm:text-base font-bold text-indigo-400 dark:text-indigo-300">
                    <CornerDownRight className="h-4 w-4" />
                    现场追问备用小抄
                    <span className="font-normal text-3 text-xs sm:text-sm">（嘉宾回答单薄时使用）</span>
                  </p>
                  <div className="mt-4 flex flex-col justify-center gap-2.5 sm:flex-row sm:flex-wrap">
                    {currentQ.followUps.map((fu, idx) => (
                      <span
                        key={idx}
                        className="rounded-xl border border-line-2 bg-surface-2 px-5 py-3 text-sm sm:text-base font-medium leading-relaxed text-1 shadow-sm"
                      >
                        {fu}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 策划阶段写下的现场笔记，录制时同步呈现 */}
              {currentQ?.userNotes && (
                <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-amber-500/30 bg-amber-500/[0.09] px-5 py-4 text-left">
                  <p className="flex items-center gap-2 text-sm font-bold text-amber-300">
                    <StickyNote className="h-4 w-4" />
                    现场笔记
                  </p>
                  <p className="mt-2 text-sm sm:text-base font-medium leading-relaxed text-amber-100">
                    {currentQ.userNotes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 底栏 */}
          <div className="border-t border-line-1 px-6 py-5 sm:px-8">
            {/* 题目全局状态点阵与快捷跳转 */}
            {allQuestionsFlat.length > 0 && (
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between text-xs text-3">
                  <span className="font-mono">提纲点阵速览（点击任意题目直接定位）</span>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      已问 {askedCount}
                    </span>
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <Star className="h-2.5 w-2.5 fill-current" />
                      高光 {highlightCount}
                    </span>
                    {skippedCount > 0 && (
                      <span className="flex items-center gap-1 text-slate-400">
                        <span className="h-2 w-2 rounded-full bg-slate-400" />
                        跳过 {skippedCount}
                      </span>
                    )}
                  </div>
                </div>

                <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1">
                  {allQuestionsFlat.map((q, idx) => {
                    const isCurrent = idx === currentQuestionIdx;
                    const isAsked = q.status === "asked";
                    const isHighlight = q.status === "highlight";
                    const isSkipped = q.status === "skipped";

                    return (
                      <button
                        key={q.id || idx}
                        onClick={() => setCurrentQuestionIdx(idx)}
                        title={`第 ${idx + 1} 题: ${q.text.slice(0, 30)}... [${
                          isHighlight ? "高光" : isAsked ? "已问" : isSkipped ? "跳过" : "待问"
                        }]`}
                        className={clsx(
                          "group relative flex h-7 min-w-[28px] items-center justify-center rounded-lg px-1.5 text-xs font-mono font-bold transition-all duration-200",
                          isCurrent
                            ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-surface-1 scale-105 z-10 shadow-sm"
                            : "hover:scale-105",
                          isHighlight
                            ? "border border-amber-500/50 bg-amber-500/25 text-amber-800 dark:text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.25)]"
                            : isAsked
                            ? "border border-emerald-500/40 bg-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                            : isSkipped
                            ? "border border-line-2 bg-surface-2 text-3 line-through opacity-60"
                            : "border border-line-1 bg-surface-1 text-2 hover:bg-surface-2"
                        )}
                      >
                        <span className="flex items-center gap-0.5">
                          {isHighlight && (
                            <Star className="h-2.5 w-2.5 fill-current text-amber-500 dark:text-amber-300" />
                          )}
                          {isAsked && (
                            <Check className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
                          )}
                          <span>{idx + 1}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 总体进度条 */}
            <div className="mb-4 flex items-center gap-3.5">
              <span className="tabular shrink-0 text-xs sm:text-sm font-bold text-3 font-mono">
                {currentQuestionIdx + 1} / {allQuestionsFlat.length}
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full tint-3">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-400 transition-[width] duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="tabular shrink-0 text-xs sm:text-sm font-bold text-3 font-mono">{progressPercent}%</span>
            </div>

            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="flex flex-wrap items-center gap-2.5">
                {/* 标记为已问 */}
                <button
                  onClick={() =>
                    currentQ &&
                    currentChapter &&
                    handleToggleQuestionStatus(currentChapter.id, currentQ.id, "asked")
                  }
                  className={clsx(
                    "btn btn-md text-sm font-semibold transition-all duration-200",
                    currentQ?.status === "asked"
                      ? "border border-emerald-600 bg-emerald-600 text-white shadow-[0_2px_10px_rgba(16,185,129,0.3)] hover:bg-emerald-700 dark:border-emerald-500 dark:bg-emerald-500 dark:text-slate-950"
                      : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 hover:bg-emerald-500/20 dark:text-emerald-300"
                  )}
                  title={currentQ?.status === "asked" ? "点击取消已问状态" : "标记为已完成提问"}
                >
                  <CheckCircle2
                    className={clsx(
                      "h-4 w-4 transition-transform",
                      currentQ?.status === "asked" && "scale-110"
                    )}
                  />
                  {currentQ?.status === "asked" ? "已标记为已问" : "标记为已问"}
                </button>

                {/* 跳过此题 */}
                <button
                  onClick={() =>
                    currentQ &&
                    currentChapter &&
                    handleToggleQuestionStatus(currentChapter.id, currentQ.id, "skipped")
                  }
                  className={clsx(
                    "btn btn-md text-sm font-semibold transition-all duration-200",
                    currentQ?.status === "skipped"
                      ? "border border-slate-600 bg-slate-600 text-white shadow-sm hover:bg-slate-700 dark:border-slate-300 dark:bg-slate-300 dark:text-slate-950"
                      : "btn-secondary text-2"
                  )}
                  title={currentQ?.status === "skipped" ? "点击恢复为此题待问" : "跳过此题"}
                >
                  <SkipForward className="h-4 w-4" />
                  {currentQ?.status === "skipped" ? "已跳过此题" : "跳过此题"}
                </button>

                {/* 标记为高光 */}
                <button
                  onClick={() =>
                    currentQ &&
                    currentChapter &&
                    handleToggleQuestionStatus(currentChapter.id, currentQ.id, "highlight")
                  }
                  className={clsx(
                    "btn btn-md text-sm font-semibold transition-all duration-200",
                    currentQ?.status === "highlight"
                      ? "border border-amber-500 bg-amber-500 text-slate-950 font-bold shadow-[0_0_18px_rgba(245,158,11,0.4)] hover:bg-amber-400"
                      : "border border-amber-500/30 bg-amber-500/10 text-amber-800 hover:bg-amber-500/20 dark:text-amber-300"
                  )}
                  title={currentQ?.status === "highlight" ? "点击取消高光标记" : "标记为现场高光金句"}
                >
                  <Star
                    className={clsx(
                      "h-4 w-4 transition-transform",
                      currentQ?.status === "highlight"
                        ? "fill-current text-slate-950 scale-110"
                        : "text-amber-600 dark:text-amber-300"
                    )}
                  />
                  {currentQ?.status === "highlight" ? "已标记高光" : "标记为高光"}
                </button>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  disabled={currentQuestionIdx === 0}
                  onClick={() => setCurrentQuestionIdx((p) => Math.max(0, p - 1))}
                  className="btn btn-secondary btn-md text-sm font-medium"
                >
                  <ChevronLeft className="h-4 w-4" />
                  上一题
                </button>
                <button
                  disabled={currentQuestionIdx >= allQuestionsFlat.length - 1}
                  onClick={() =>
                    setCurrentQuestionIdx((p) => Math.min(allQuestionsFlat.length - 1, p + 1))
                  }
                  className="btn btn-primary btn-md text-sm font-bold"
                >
                  下一个问题
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
