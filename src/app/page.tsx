"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Video,
  FileText,
  MessageSquareQuote,
  Sparkles,
  ArrowRight,
  Clock,
  Trash2,
  Tv,
  Layers,
  CheckCircle2,
  Clapperboard,
} from "lucide-react";
import { InterviewProject, InterviewStyle } from "@/types";

const STYLES: InterviewStyle[] = [
  "人物故事",
  "深度对谈",
  "轻松聊天",
  "专业访谈",
  "犀利追问",
  "纪录片",
  "播客",
];

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

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const json = await res.json();
      if (json.success) {
        setProjects(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !topic) return;
    setCreating(true);

    try {
      const res = await fetch("/api/projects", {
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
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        // 清空表单
        setGuestName("");
        setGuestTitle("");
        setTopic("");
        setFocusDirection("");
        fetchProjects();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("确定要删除这个访谈项目吗？")) return;

    try {
      await fetch(`/api/projects/${id}`, { method: "DELETE" });
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // 统计指标
  const totalQuestions = projects.reduce(
    (acc, p) => acc + p.chapters.reduce((cAcc, c) => cAcc + c.questions.length, 0),
    0
  );
  const totalVideos = projects.reduce((acc, p) => acc + (p.shortVideos?.length || 0), 0);
  const totalQuotes = projects.reduce((acc, p) => acc + (p.quotes?.length || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* 顶部 Hero 区域 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              第二导演工作台 V1.0
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            我的访谈项目
          </h1>
          <p className="mt-2 text-sm text-slate-400 max-w-2xl">
            覆盖「资料研究 → 采访策划 → 模拟彩排与提词 → 录音转写 → 短视频拆条包装」全生命周期。
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-lg shadow-indigo-500/25 transition-all duration-200 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          新建访谈项目
        </button>
      </div>

      {/* 4 维核心数据概览 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 my-8">
        <div className="glass-card p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">访谈项目数</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Tv className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-2">{projects.length}</p>
          <span className="text-[11px] text-slate-500">统一上下文项目管理</span>
        </div>

        <div className="glass-card p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">分级策划问题</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-2">{totalQuestions}</p>
          <span className="text-[11px] text-slate-500">含普通/故事/深度及追问</span>
        </div>

        <div className="glass-card p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">短视频拆条选题</span>
            <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400">
              <Video className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-2">{totalVideos}</p>
          <span className="text-[11px] text-slate-500">自动标定入出点与封面</span>
        </div>

        <div className="glass-card p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">收录高光金句</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <MessageSquareQuote className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-2">{totalQuotes}</p>
          <span className="text-[11px] text-slate-500">适配小红书/微博文案</span>
        </div>
      </div>

      {/* 项目列表卡片流 */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-sm">正在加载访谈项目...</div>
      ) : projects.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center my-8">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <Clapperboard className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-white">暂无访谈项目</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            点击上方“新建访谈项目”，开启由 AI 第二导演辅助的全新访谈工作流。
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500"
          >
            <Plus className="w-4 h-4" />
            新建第一个项目
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const questionCount = project.chapters.reduce(
              (acc, c) => acc + c.questions.length,
              0
            );
            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="glass-card rounded-2xl p-5 flex flex-col justify-between group transition-all relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors pointer-events-none" />

                <div>
                  {/* 头部标签与操作 */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                      {project.interviewStyle} · {project.durationMinutes}分钟
                    </span>
                    <button
                      onClick={(e) => handleDelete(project.id, e)}
                      title="删除项目"
                      className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* 嘉宾信息与主题 */}
                  <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                    {project.guestName}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                    {project.guestTitle || "未指定职位"}
                  </p>

                  <p className="text-xs text-slate-300 font-medium mt-3 line-clamp-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                    主题：{project.topic}
                  </p>
                </div>

                {/* 底部指标栏 */}
                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      {questionCount} 问题
                    </span>
                    <span className="flex items-center gap-1">
                      <Video className="w-3.5 h-3.5 text-slate-500" />
                      {project.shortVideos?.length || 0} 短视频
                    </span>
                  </div>

                  <span className="flex items-center gap-1 text-indigo-400 group-hover:translate-x-0.5 transition-transform font-medium">
                    进入工作台 <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* 新建访谈 Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel w-full max-w-xl rounded-3xl p-6 sm:p-8 relative border border-slate-700/80 shadow-2xl">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              创建新访谈项目
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              填写访谈基本框架，AI 将为您自动化组织嘉宾档案、故事章节与多级问题。
            </p>

            <form onSubmit={handleCreate} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    嘉宾姓名 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="如：张三"
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    嘉宾职业 / 头衔
                  </label>
                  <input
                    type="text"
                    value={guestTitle}
                    onChange={(e) => setGuestTitle(e.target.value)}
                    placeholder="如：AI 独立导演 / 某公司创始人"
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  本期访谈核心主题 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="如：一个人如何用 AI 完成过去一个团队才能完成的电影"
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    预计视频时长 (分钟)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    目标受众
                  </label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="如：AI 创作者、独立开发者、媒体人"
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  采访风格
                </label>
                <div className="flex flex-wrap gap-2">
                  {STYLES.map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setInterviewStyle(style)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        interviewStyle === style
                          ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/50 border border-indigo-400"
                          : "bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60"
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  希望重点挖掘的方向 (选填)
                </label>
                <textarea
                  rows={2}
                  value={focusDirection}
                  onChange={(e) => setFocusDirection(e.target.value)}
                  placeholder="如：挖掘从传统影视到一人制作的心理抗争、同行争论与真实身心代价"
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-500/20 disabled:opacity-50"
                >
                  {creating ? "创建中..." : "立刻创建项目"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
