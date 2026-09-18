"use client";

import { useState } from "react";
import { InterviewChapter, InterviewProject, QuestionType } from "@/types";
import {
  Sparkles,
  BookOpen,
  HelpCircle,
  CornerDownRight,
  Clock,
  Target,
  RefreshCw,
  MessageCircle,
  CheckCircle2,
} from "lucide-react";

interface Props {
  project: InterviewProject;
  onUpdate: (updated: InterviewProject) => void;
}

export default function PlanningTab({ project, onUpdate }: Props) {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/planner/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      });
      const json = await res.json();
      if (json.success) {
        onUpdate({
          ...project,
          chapters: json.data,
          status: project.status === "planning" ? "interviewing" : project.status,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const getQuestionTypeBadge = (type: QuestionType) => {
    switch (type) {
      case "normal":
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">基础背景</span>;
      case "story":
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">故事细节</span>;
      case "deep":
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-500/15 text-purple-300 border border-purple-500/30">深度交锋</span>;
    }
  };

  const totalQuestions = project.chapters.reduce((acc, c) => acc + c.questions.length, 0);

  return (
    <div className="space-y-8">
      {/* 顶部操作条 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              AI 采访叙事策划与多级问题生成器
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
              {project.chapters.length} 个故事章节 · {totalQuestions} 个精选提问
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            避免散碎提问，AI 像纪录片导演一样将访谈构筑为起承转合的完整故事。每个问题均配置深度分级与现场追问支架。
          </p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all flex-shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${generating ? "animate-spin" : ""}`} />
          {generating ? "AI 策划编排中..." : "重新 AI 策划大纲"}
        </button>
      </div>

      {/* 章节故事线与问题卡片流 */}
      {project.chapters.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center">
          <BookOpen className="w-8 h-8 text-indigo-400 mx-auto mb-3 animate-pulse" />
          <h3 className="text-sm font-bold text-white">暂未生成访谈故事策划大纲</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            点击上方按钮，AI 将根据嘉宾背景与采访风格，自动规划 4~5 个层层递进的章节脉络与多级问题。
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500"
          >
            {generating ? "策划中..." : "一键生成策划大纲"}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {project.chapters.map((chapter) => (
            <div
              key={chapter.id}
              className="glass-card rounded-2xl p-6 border border-slate-800/80 relative overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                    {chapter.order}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white">{chapter.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-indigo-400" />
                      采访意图：{chapter.goal}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>预计 {chapter.estimatedMinutes || 5} 分钟</span>
                </div>
              </div>

              {/* 章节内问题列表 */}
              <div className="mt-4 space-y-4">
                {chapter.questions.map((q, qIndex) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <span className="text-xs font-bold text-slate-500 mt-0.5">
                          Q{chapter.order}.{qIndex + 1}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-white leading-relaxed">
                            {q.text}
                          </p>
                        </div>
                      </div>
                      <div className="flex-shrink-0">{getQuestionTypeBadge(q.type)}</div>
                    </div>

                    {/* 核心亮点：现场追问建议 (Follow-up Seeds) */}
                    {q.followUps && q.followUps.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-800/80 pl-6 space-y-1.5">
                        <div className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1">
                          <CornerDownRight className="w-3.5 h-3.5 text-indigo-400" />
                          备选现场追问支架（当嘉宾未说透时触发）：
                        </div>
                        {q.followUps.map((fu, fuIdx) => (
                          <div
                            key={fuIdx}
                            className="text-xs text-slate-300 bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-800/50 flex items-center gap-2"
                          >
                            <span className="text-indigo-400 font-bold">•</span>
                            <span>{fu}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
