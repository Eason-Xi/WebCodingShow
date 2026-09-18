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
} from "lucide-react";
import clsx from "clsx";
import { Chip, SectionTitle, TabHeader } from "@/components/ui/Primitives";
import { requestJson, runTask, toast } from "@/components/ui/Feedback";

interface Props {
  project: InterviewProject;
  onUpdate: (updated: InterviewProject) => void;
}

export default function InterviewTab({ project, onUpdate }: Props) {
  const [subMode, setSubMode] = useState<"simulation" | "teleprompter">("simulation");
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
          body: JSON.stringify({ projectId: project.id, message: textToSend }),
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
          body: JSON.stringify({ projectId: project.id }),
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

  // 提词台标记问题状态
  const handleUpdateQuestionStatus = async (
    chId: string,
    qId: string,
    status: QuestionStatus
  ) => {
    const updatedChapters = project.chapters.map((ch) => {
      if (ch.id === chId) {
        return {
          ...ch,
          questions: ch.questions.map((q) => (q.id === qId ? { ...q, status } : q)),
        };
      }
      return ch;
    });

    const updated = { ...project, chapters: updatedChapters };
    onUpdate(updated);

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

  const allQuestionsFlat = project.chapters.flatMap((c) => c.questions);
  const currentQ = allQuestionsFlat[currentQuestionIdx] || allQuestionsFlat[0];
  // 由当前问题反推所属章节（修复跨章节标记错位）
  const currentChapter =
    project.chapters.find((ch) => ch.questions.some((q) => q.id === currentQ?.id)) ||
    project.chapters[0];

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
          handleUpdateQuestionStatus(currentChapter.id, currentQ.id, "asked");
          setCurrentQuestionIdx((p) => Math.min(last, p + 1));
        }
      } else if (e.key === "h" || e.key === "H") {
        if (currentQ && currentChapter) {
          handleUpdateQuestionStatus(currentChapter.id, currentQ.id, "highlight");
        }
      } else if (e.key === "s" || e.key === "S") {
        if (currentQ && currentChapter) {
          handleUpdateQuestionStatus(currentChapter.id, currentQ.id, "skipped");
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
          <div className="glass-panel flex h-[720px] flex-col overflow-hidden rounded-2xl lg:col-span-7">
            {/* 聊天顶栏 */}
            <div className="flex items-center justify-between gap-3 border-b border-line-1 tint-1 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-indigo-500/30 bg-gradient-to-br from-indigo-500/25 to-violet-500/10 text-xs font-semibold text-indigo-200">
                  {project.guestName?.slice(0, 1) || "?"}
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-xs font-semibold text-1">
                    <span className="truncate">对练嘉宾：{project.guestName}</span>
                    <Chip tone="emerald" dot className="px-2 py-0.5 text-[10px]">
                      性格已载入
                    </Chip>
                  </p>
                  <p className="truncate text-[11px] text-4">{project.guestTitle || "未指定职位"}</p>
                </div>
              </div>

              {messages.length > 0 && (
                <button
                  onClick={handleGenerateReview}
                  disabled={reviewLoading}
                  className="btn btn-md shrink-0 border border-purple-500/30 bg-purple-500/15 text-purple-200 hover:bg-purple-500/25"
                >
                  <Award className={reviewLoading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
                  {reviewLoading ? "导演复盘中..." : "生成复盘报告"}
                </button>
              )}
            </div>

            {/* 消息列表 */}
            <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/20 to-violet-500/10">
                    <Bot className="h-6 w-6 text-indigo-300" />
                  </span>
                  <p className="mt-4 text-sm font-semibold text-1">
                    开始与「{project.guestName}」进行模拟对练
                  </p>
                  <p className="mt-2 max-w-sm text-xs leading-relaxed text-3">
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
                        "flex items-start gap-2.5",
                        isInterviewer ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      <span
                        className={clsx(
                          "grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[11px]",
                          isInterviewer
                            ? "border-indigo-400/30 bg-indigo-500/20 text-indigo-200"
                            : "border-line-2 bg-surface-2 text-3"
                        )}
                      >
                        {isInterviewer ? (
                          <User className="h-3.5 w-3.5" />
                        ) : (
                          <Bot className="h-3.5 w-3.5" />
                        )}
                      </span>

                      <div className="max-w-[82%]">
                        <div
                          className={clsx(
                            "mb-1.5 flex items-center gap-2 text-[10px] text-4",
                            isInterviewer ? "justify-end" : "justify-start"
                          )}
                        >
                          <span>{isInterviewer ? "主持人（你）" : project.guestName}</span>
                          <span className="tabular">{msg.timestamp}</span>
                        </div>
                        <div
                          className={clsx(
                            "rounded-2xl px-4 py-3 text-xs leading-relaxed",
                            isInterviewer
                              ? "rounded-tr-sm bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-accent"
                              : "rounded-tl-sm border border-line-1 bg-surface-1 text-2"
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
                <div className="flex items-center gap-2.5 px-1 text-xs text-indigo-300">
                  <span className="grid h-7 w-7 place-items-center rounded-full border border-line-2 bg-surface-2">
                    <Bot className="h-3.5 w-3.5" />
                  </span>
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    {project.guestName} 正在思考回答...
                  </span>
                </div>
              )}
            </div>

            {/* 快捷带入问题 */}
            {allQuestionsFlat.length > 0 && (
              <div className="no-scrollbar flex items-center gap-2 overflow-x-auto border-t border-line-1 bg-[color:var(--well)] px-4 py-2.5">
                <span className="shrink-0 text-[11px] font-medium text-4">快捷带入</span>
                {allQuestionsFlat.slice(0, 3).map((q, i) => (
                  <button
                    key={q.id}
                    onClick={() => handleSendMessage(q.text)}
                    className="max-w-[220px] shrink-0 truncate rounded-lg border border-line-1 bg-surface-1 px-2.5 py-1.5 text-[11px] text-3 transition-colors hover:border-indigo-500/30 hover:bg-surface-2 hover:text-2"
                    title={q.text}
                  >
                    Q{i + 1}: {q.text}
                  </button>
                ))}
              </div>
            )}

            {/* 输入区 */}
            <div className="flex items-center gap-2 border-t border-line-1 tint-2 p-3">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder={`输入你想对 ${project.guestName} 提出的问题或现场追问...`}
                className="field h-11 flex-1 py-0"
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
          <div className="glass-panel flex h-[720px] flex-col overflow-hidden rounded-2xl lg:col-span-5">
            <div className="flex items-center justify-between border-b border-line-1 tint-1 px-5 py-4">
              <SectionTitle icon={Award} tone="purple">
                第二导演复盘评估报告
              </SectionTitle>
              {review && (
                <Chip tone="purple" className="px-2 py-0.5 text-[10px]">
                  AI 导演
                </Chip>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {!review ? (
                <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl border border-purple-500/25 bg-gradient-to-br from-purple-500/20 to-fuchsia-500/10">
                    <Award className="h-6 w-6 text-purple-300" />
                  </span>
                  <p className="mt-4 text-xs font-semibold text-2">尚未生成复盘评估</p>
                  <p className="mt-2 max-w-xs text-[11px] leading-relaxed text-4">
                    在左侧进行至少 1~2 轮对练提问后，点击「生成复盘报告」，AI 导演将指出你在彩排中的提问漏洞与错失的追问良机。
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 评分 */}
                  <div className="rounded-2xl border border-purple-500/25 bg-gradient-to-br from-purple-500/[0.12] to-fuchsia-500/[0.05] p-5">
                    <div className="flex items-center gap-5">
                      <div className="relative h-16 w-16 shrink-0">
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
                        <span className="tabular absolute inset-0 grid place-items-center text-base font-bold text-purple-200">
                          {review.overallRating}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-purple-200">彩排提问综合评分</p>
                        <p className="mt-1.5 text-xs leading-relaxed text-2">{review.summary}</p>
                      </div>
                    </div>
                  </div>

                  {/* 亮点 */}
                  {review.strengths?.length > 0 && (
                    <section className="rounded-2xl border border-line-1 bg-surface-1 p-4">
                      <SectionTitle icon={CheckCircle2} tone="emerald" className="mb-3">
                        表现出色之处
                      </SectionTitle>
                      <ul className="space-y-2">
                        {review.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-xs leading-relaxed text-2">
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
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
                        <span className="ml-1 text-[10px] font-normal text-amber-300/70">
                          重点改进
                        </span>
                      </SectionTitle>
                      {review.missedOpportunities.map((m, i) => (
                        <div
                          key={i}
                          className="space-y-2.5 rounded-xl border border-line-1 bg-[color:var(--well)] p-3.5"
                        >
                          <p className="flex items-start gap-2 text-[11px] italic leading-relaxed text-3">
                            <Quote className="mt-0.5 h-3 w-3 shrink-0 text-4" />
                            {m.dialogueSnippet}
                          </p>
                          <p className="text-[11px] leading-relaxed text-rose-300">
                            {m.reason}
                          </p>
                          <p className="rounded-lg border border-indigo-500/25 bg-indigo-500/[0.1] p-2.5 text-[11px] leading-relaxed text-indigo-200">
                            <span className="font-semibold text-indigo-300">导演建议追问：</span>
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
                      <ul className="space-y-2">
                        {review.overallAdvice.map((a, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-xs leading-relaxed text-2">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
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
        <div className="glass-panel flex min-h-[620px] flex-col overflow-hidden rounded-3xl">
          {/* 顶栏 */}
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line-1 px-6 py-4">
            <span className="flex items-center gap-2.5 text-xs text-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-rose-500 animate-ping-soft" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
              </span>
              <span className="font-medium">现场录制模式</span>
              <Chip tone="rose" className="px-2 py-0.5 text-[10px]">
                <Radio className="h-2.5 w-2.5" />
                LIVE
              </Chip>
            </span>

            {/* 键盘快捷键提示（录制时无需触碰鼠标） */}
            <div className="hidden items-center gap-3.5 text-[10px] text-4 xl:flex">
              {[
                { keys: ["←", "→"], label: "切换" },
                { keys: ["空格"], label: "已问·下一题" },
                { keys: ["H"], label: "高光" },
                { keys: ["S"], label: "跳过" },
              ].map((h) => (
                <span key={h.label} className="flex items-center gap-1.5">
                  <span className="flex items-center gap-1">
                    {h.keys.map((k) => (
                      <kbd
                        key={k}
                        className="rounded-md border border-line-2 bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] leading-none text-2"
                      >
                        {k}
                      </kbd>
                    ))}
                  </span>
                  {h.label}
                </span>
              ))}
            </div>

            <span className="max-w-[40%] truncate text-xs text-3">
              当前章节 ·{" "}
              <span className="font-medium text-2">
                {currentChapter?.title || "未分章节"}
              </span>
            </span>
          </div>

          {/* 主体 */}
          <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-10">
            <div className="mx-auto w-full max-w-4xl text-center">
              <Chip tone="indigo" className="px-3 py-1 text-[10px] tracking-[0.14em]">
                CURRENT QUESTION
              </Chip>

              <h1 className="mt-7 text-2xl font-semibold leading-[1.45] tracking-tight text-1 sm:text-[34px]">
                {currentQ?.text || "提纲中暂无问题"}
              </h1>

              {currentQ?.followUps && currentQ.followUps.length > 0 && (
                <div className="mx-auto mt-10 max-w-3xl">
                  <p className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-indigo-300">
                    <CornerDownRight className="h-3.5 w-3.5" />
                    现场追问备用小抄
                    <span className="font-normal text-4">（嘉宾回答单薄时使用）</span>
                  </p>
                  <div className="mt-3 flex flex-col justify-center gap-2 sm:flex-row sm:flex-wrap">
                    {currentQ.followUps.map((fu, idx) => (
                      <span
                        key={idx}
                        className="rounded-xl border border-line-1 bg-surface-1 px-3.5 py-2 text-xs leading-relaxed text-2"
                      >
                        {fu}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 策划阶段写下的现场笔记，录制时同步呈现 */}
              {currentQ?.userNotes && (
                <div className="mx-auto mt-7 max-w-3xl rounded-2xl border border-amber-500/25 bg-amber-500/[0.07] px-4 py-3 text-left">
                  <p className="flex items-center gap-1.5 text-[11px] font-medium text-amber-300">
                    <StickyNote className="h-3.5 w-3.5" />
                    现场笔记
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-amber-100/90">
                    {currentQ.userNotes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 底栏 */}
          <div className="border-t border-line-1 px-6 py-5">
            <div className="mb-4 flex items-center gap-3">
              <span className="tabular shrink-0 text-[11px] text-4">
                {currentQuestionIdx + 1} / {allQuestionsFlat.length}
              </span>
              <div className="h-1 flex-1 overflow-hidden rounded-full tint-3">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-400 transition-[width] duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="tabular shrink-0 text-[11px] text-4">{progressPercent}%</span>
            </div>

            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() =>
                    currentQ && handleUpdateQuestionStatus(currentChapter.id, currentQ.id, "asked")
                  }
                  className="btn btn-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  标记为已问
                </button>
                <button
                  onClick={() =>
                    currentQ &&
                    handleUpdateQuestionStatus(currentChapter.id, currentQ.id, "skipped")
                  }
                  className="btn btn-secondary btn-md"
                >
                  <SkipForward className="h-4 w-4" />
                  跳过此题
                </button>
                <button
                  onClick={() =>
                    currentQ &&
                    handleUpdateQuestionStatus(currentChapter.id, currentQ.id, "highlight")
                  }
                  className="btn btn-md border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                >
                  <Star className="h-4 w-4" />
                  标记为高光
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentQuestionIdx === 0}
                  onClick={() => setCurrentQuestionIdx((p) => Math.max(0, p - 1))}
                  className="btn btn-secondary btn-md"
                >
                  <ChevronLeft className="h-4 w-4" />
                  上一题
                </button>
                <button
                  disabled={currentQuestionIdx >= allQuestionsFlat.length - 1}
                  onClick={() =>
                    setCurrentQuestionIdx((p) => Math.min(allQuestionsFlat.length - 1, p + 1))
                  }
                  className="btn btn-primary btn-md"
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
