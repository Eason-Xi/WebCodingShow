"use client";

import { useState } from "react";
import { InterviewProject, QuestionStatus, SimulationMessage, SimulationReview } from "@/types";
import {
  MessageSquare,
  Sparkles,
  Award,
  Send,
  CheckCircle2,
  SkipForward,
  Star,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  PlayCircle,
  Tv,
  CornerDownRight,
  Bot,
  User,
} from "lucide-react";

interface Props {
  project: InterviewProject;
  onUpdate: (updated: InterviewProject) => void;
}

export default function InterviewTab({ project, onUpdate }: Props) {
  const [subMode, setSubMode] = useState<"simulation" | "teleprompter">("simulation");
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);

  // 提词台状态：当前选中的章节与问题索引
  const [currentChapterIdx, setCurrentChapterIdx] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);

  // 发送模拟对练提问
  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || chatInput;
    if (!textToSend.trim() || chatLoading) return;

    setChatLoading(true);
    if (!customText) setChatInput("");

    try {
      const res = await fetch("/api/simulation/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id, message: textToSend }),
      });
      const json = await res.json();
      if (json.success) {
        onUpdate({
          ...project,
          simulationSession: {
            id: project.simulationSession?.id || `sim-${Date.now()}`,
            projectId: project.id,
            messages: json.data.allMessages,
            reviewReport: project.simulationSession?.reviewReport,
            createdAt: project.simulationSession?.createdAt || new Date().toISOString(),
          },
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  };

  // 生成第二导演复盘报告
  const handleGenerateReview = async () => {
    setReviewLoading(true);
    try {
      const res = await fetch("/api/simulation/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      });
      const json = await res.json();
      if (json.success && project.simulationSession) {
        onUpdate({
          ...project,
          simulationSession: {
            ...project.simulationSession,
            reviewReport: json.data,
          },
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReviewLoading(false);
    }
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
      await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const currentChapter = project.chapters[currentChapterIdx] || project.chapters[0];
  const allQuestionsFlat = project.chapters.flatMap((c) => c.questions);
  const currentQ = allQuestionsFlat[currentQuestionIdx] || allQuestionsFlat[0];

  const simSession = project.simulationSession;
  const messages = simSession?.messages || [];
  const review = simSession?.reviewReport;

  return (
    <div className="space-y-6">
      {/* 顶部双模式切换与说明 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            采访核心演练与现场提词台
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            彩排时由 AI 深度还原嘉宾进行高保真演练并复盘；现场录制时切换为免干扰沉浸式提词台。
          </p>
        </div>

        {/* 模式分段选择器 */}
        <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setSubMode("simulation")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              subMode === "simulation"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            AI 模拟访谈彩排
          </button>
          <button
            onClick={() => setSubMode("teleprompter")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              subMode === "teleprompter"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            现场沉浸提词台
          </button>
        </div>
      </div>

      {/* 子模式 1: AI 模拟访谈彩排 */}
      {subMode === "simulation" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 左侧：彩排对练聊天流 */}
          <div className="lg:col-span-7 flex flex-col h-[700px] glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            {/* 聊天顶栏 */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs">
                  {project.guestName.slice(0, 1)}
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    对练嘉宾：{project.guestName}
                    <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                      AI 真实性格已载入
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{project.guestTitle}</p>
                </div>
              </div>

              {messages.length > 0 && (
                <button
                  onClick={handleGenerateReview}
                  disabled={reviewLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-purple-600 hover:bg-purple-500 shadow-sm disabled:opacity-50 transition-all"
                >
                  <Award className="w-3.5 h-3.5" />
                  {reviewLoading ? "导演复盘中..." : "生成导演复盘报告"}
                </button>
              )}
            </div>

            {/* 消息滚动列表 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                  <Bot className="w-10 h-10 text-indigo-400 mb-3 animate-bounce" />
                  <p className="text-sm font-semibold text-white">开始与「{project.guestName}」进行模拟对练</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    AI 已全面消化嘉宾的生平资料、矛盾点与作品。你可以演练提问，检验回答是否符合预期，随时练习追问。
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${
                      msg.role === "interviewer" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        msg.role === "interviewer"
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-800 text-indigo-300 border border-indigo-500/30"
                      }`}
                    >
                      {msg.role === "interviewer" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>

                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                        msg.role === "interviewer"
                          ? "bg-indigo-600 text-white rounded-tr-none"
                          : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 mb-1 opacity-60 text-[10px]">
                        <span>{msg.role === "interviewer" ? "主持人（你）" : project.guestName}</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
              {chatLoading && (
                <div className="flex items-center gap-2 text-xs text-indigo-400 p-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{project.guestName} 正在思考回答...</span>
                </div>
              )}
            </div>

            {/* 提问建议快选条 */}
            {allQuestionsFlat.length > 0 && (
              <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto text-[11px]">
                <span className="text-slate-500 flex-shrink-0 font-medium">快捷带入问题:</span>
                {allQuestionsFlat.slice(0, 3).map((q, i) => (
                  <button
                    key={q.id}
                    onClick={() => handleSendMessage(q.text)}
                    className="flex-shrink-0 bg-slate-900 hover:bg-slate-800 border border-slate-800 px-2.5 py-1 rounded-lg text-slate-300 truncate max-w-[200px]"
                    title={q.text}
                  >
                    Q{i + 1}: {q.text}
                  </button>
                ))}
              </div>
            )}

            {/* 输入区 */}
            <div className="p-3 border-t border-slate-800 bg-slate-900/80 flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder={`输入你想对 ${project.guestName} 提出的问题或现场追问...`}
                className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={chatLoading || !chatInput.trim()}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition-all flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 右侧：第二导演复盘评估报告 */}
          <div className="lg:col-span-5 flex flex-col h-[700px] glass-panel rounded-2xl border border-slate-800 p-5 overflow-y-auto">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-purple-400" />
              第二导演复盘评估报告
            </h3>

            {!review ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <Award className="w-10 h-10 text-purple-400/40 mb-3" />
                <p className="text-xs font-semibold text-slate-300">尚未生成复盘评估</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                  在左侧进行至少 1~2 轮对练提问后，点击“生成导演复盘报告”，AI 导演将指出您在彩排中的提问漏洞与错失的追问良机。
                </p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* 综合得分与总评 */}
                <div className="glass-card p-4 rounded-xl border-l-4 border-purple-500 bg-purple-950/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-purple-300">彩排提问综合评分</span>
                    <span className="text-xl font-black text-purple-400">{review.overallRating} 分</span>
                  </div>
                  <p className="text-slate-300 mt-2 leading-relaxed">{review.summary}</p>
                </div>

                {/* 亮点 */}
                {review.strengths?.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5 mb-2">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      表现出色之处
                    </span>
                    <ul className="space-y-1 text-slate-300 pl-4 list-disc">
                      {review.strengths.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 核心价值点：错失的追问良机与导演示范 */}
                {review.missedOpportunities?.length > 0 && (
                  <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-3">
                    <span className="font-bold text-amber-400 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      错失追问良机（重点改进！）
                    </span>
                    {review.missedOpportunities.map((m, i) => (
                      <div key={i} className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-1.5">
                        <div className="text-[11px] text-slate-400 italic">
                          情境：{m.dialogueSnippet}
                        </div>
                        <div className="text-[11px] text-red-300">
                          问题：{m.reason}
                        </div>
                        <div className="text-[11px] text-indigo-300 bg-indigo-950/50 p-2 rounded border border-indigo-800/40">
                          <span className="font-semibold text-indigo-400">导演建议追问：</span>
                          “{m.suggestedFollowUp}”
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 实战策略建议 */}
                {review.overallAdvice?.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="font-bold text-indigo-300 flex items-center gap-1.5 mb-2">
                      <HelpCircle className="w-3.5 h-3.5" />
                      正式采访战术锦囊
                    </span>
                    <ul className="space-y-1 text-slate-300 pl-4 list-disc">
                      {review.overallAdvice.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 子模式 2: 现场沉浸提词台 */}
      {subMode === "teleprompter" && (
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-8 min-h-[600px] flex flex-col justify-between">
          <div>
            {/* 顶栏章节指示器 */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-xs text-slate-400">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                正在进行访谈录制 · 现场模式
              </span>
              <span>
                当前章节：{currentChapter?.title || "未分章节"} ({currentChapterIdx + 1}/
                {project.chapters.length})
              </span>
            </div>

            {/* 大字当前问题 */}
            <div className="py-10 max-w-4xl mx-auto text-center space-y-4">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                当前提问 (QUESTION)
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-snug">
                {currentQ?.text || "提纲中暂无问题"}
              </h1>

              {/* 关键追问支架 */}
              {currentQ?.followUps && currentQ.followUps.length > 0 && (
                <div className="pt-6 max-w-2xl mx-auto space-y-2">
                  <div className="text-xs font-semibold text-indigo-300 flex items-center justify-center gap-1">
                    <CornerDownRight className="w-3.5 h-3.5 text-indigo-400" />
                    现场追问备用小抄（若嘉宾回答单薄时使用）：
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    {currentQ.followUps.map((fu, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-900/80 px-3 py-1.5 rounded-xl border border-indigo-500/30 text-xs text-slate-300"
                      >
                        “{fu}”
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 提词台快捷操作底栏 */}
          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  currentQ &&
                  handleUpdateQuestionStatus(currentChapter.id, currentQ.id, "asked")
                }
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                标记为已问
              </button>
              <button
                onClick={() =>
                  currentQ &&
                  handleUpdateQuestionStatus(currentChapter.id, currentQ.id, "skipped")
                }
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-slate-400 bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                <SkipForward className="w-4 h-4" />
                跳过此题
              </button>
              <button
                onClick={() =>
                  currentQ &&
                  handleUpdateQuestionStatus(currentChapter.id, currentQ.id, "highlight")
                }
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors"
              >
                <Star className="w-4 h-4" />
                标记为高光重点
              </button>
            </div>

            {/* 上一题 / 下一题切换 */}
            <div className="flex items-center gap-3">
              <button
                disabled={currentQuestionIdx === 0}
                onClick={() => setCurrentQuestionIdx((p) => Math.max(0, p - 1))}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
              >
                上一题
              </button>
              <span className="text-xs text-slate-400">
                {currentQuestionIdx + 1} / {allQuestionsFlat.length}
              </span>
              <button
                disabled={currentQuestionIdx >= allQuestionsFlat.length - 1}
                onClick={() => setCurrentQuestionIdx((p) => Math.min(allQuestionsFlat.length - 1, p + 1))}
                className="px-4 py-2 rounded-xl text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40"
              >
                下一个问题
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
