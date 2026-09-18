"use client";

import { useState } from "react";
import { InterviewProject } from "@/types";
import {
  Video,
  Sparkles,
  MessageSquareQuote,
  Share2,
  Clock,
  Copy,
  Check,
  RefreshCw,
  Film,
  Layers,
  FileText,
} from "lucide-react";

interface Props {
  project: InterviewProject;
  onUpdate: (updated: InterviewProject) => void;
}

export default function ContentTab({ project, onUpdate }: Props) {
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleGenerateContent = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/content/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      });
      const json = await res.json();
      if (json.success) {
        onUpdate({
          ...project,
          shortVideos: json.data.shortVideos,
          quotes: json.data.quotes,
          packaging: json.data.packaging,
          status: "completed",
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const shortVideos = project.shortVideos || [];
  const quotes = project.quotes || [];
  const packaging = project.packaging;

  return (
    <div className="space-y-8">
      {/* 顶部操作条 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Video className="w-5 h-5 text-pink-400" />
              短视频自动拆条、金句系统与全网包装
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-pink-300 border border-slate-700">
              已拆解 {shortVideos.length} 条爆款选题 · {quotes.length} 个核心金句
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            一次采访，自动生成 10+ 条短视频出入点裁切方案、全平台爆款标题与小红书/微博宣发文案。
          </p>
        </div>

        <button
          onClick={handleGenerateContent}
          disabled={generating}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium text-white bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 shadow-md shadow-pink-500/20 disabled:opacity-50 transition-all flex-shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${generating ? "animate-spin" : ""}`} />
          {generating ? "AI 深度切片分析中..." : "一键 AI 拆条与生成宣发资产"}
        </button>
      </div>

      {/* 1. 短视频自动拆条卡片流 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Film className="w-4 h-4 text-pink-400" />
            短视频自动拆条选题库（精准出入点与封面策略）
          </h3>
        </div>

        {shortVideos.length === 0 ? (
          <div className="glass-card p-8 rounded-2xl text-center text-xs text-slate-500">
            暂无短视频拆条，点击上方按钮一键自动提取。
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shortVideos.map((clip, idx) => (
              <div
                key={clip.id}
                className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-pink-500/10 text-pink-400 border border-pink-500/20">
                    短视频 #{idx + 1} · {clip.duration}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {clip.inPoint} ➔ {clip.outPoint}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white group-hover:text-pink-300 transition-colors">
                  {clip.title}
                </h4>

                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1.5">
                  <div className="text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-300">核心观点：</span>
                    {clip.coreOpinion}
                  </div>
                  <div className="text-[11px] text-amber-300">
                    <span className="font-semibold text-amber-400">建议封面大字：</span>
                    “{clip.coverTitle}”
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 italic line-clamp-2">
                  台词切片：“{clip.scriptSnippet}”
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. 金句系统与社媒分发文案 */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <MessageSquareQuote className="w-4 h-4 text-amber-400" />
          金句系统与社媒分发文案（一键复制）
        </h3>

        {quotes.length === 0 ? (
          <div className="glass-card p-8 rounded-2xl text-center text-xs text-slate-500">
            暂无金句收录。
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quotes.map((q) => (
              <div key={q.id} className="glass-card p-5 rounded-2xl border-l-4 border-amber-500 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400">
                    {q.category}
                  </span>
                  {q.timecode && (
                    <span className="text-[10px] text-slate-500">{q.timecode}</span>
                  )}
                </div>

                <p className="text-xs font-bold text-slate-100 italic leading-relaxed">
                  “{q.text}”
                </p>

                {/* 社交平台文案 */}
                <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                  {/* 小红书 */}
                  <div className="flex items-center justify-between bg-slate-900/60 p-2 rounded-lg">
                    <span className="text-[11px] text-red-300 font-medium">小红书配文</span>
                    <button
                      onClick={() => copyToClipboard(q.socialHooks.xiaohongshu, `${q.id}-xhs`)}
                      className="text-[10px] flex items-center gap-1 text-slate-400 hover:text-white"
                    >
                      {copiedId === `${q.id}-xhs` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      复制
                    </button>
                  </div>
                  {/* 微博 */}
                  <div className="flex items-center justify-between bg-slate-900/60 p-2 rounded-lg">
                    <span className="text-[11px] text-yellow-300 font-medium">微博文案</span>
                    <button
                      onClick={() => copyToClipboard(q.socialHooks.weibo, `${q.id}-wb`)}
                      className="text-[10px] flex items-center gap-1 text-slate-400 hover:text-white"
                    >
                      {copiedId === `${q.id}-wb` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      复制
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. 全网节目包装 */}
      {packaging && (
        <div className="glass-card p-6 rounded-2xl border border-indigo-500/20 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Share2 className="w-4 h-4 text-indigo-400" />
            全网多平台标题与节目包装
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="font-semibold text-red-400 block mb-1">YouTube 标题</span>
              <p className="text-slate-200">{packaging.youtubeTitle}</p>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="font-semibold text-sky-400 block mb-1">Bilibili 标题</span>
              <p className="text-slate-200">{packaging.bilibiliTitle}</p>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="font-semibold text-pink-400 block mb-1">抖音标题</span>
              <p className="text-slate-200">{packaging.douyinTitle}</p>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="font-semibold text-rose-400 block mb-1">小红书标题</span>
              <p className="text-slate-200">{packaging.xiaohongshuTitle}</p>
            </div>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs">
            <span className="font-semibold text-slate-300 block mb-1">官方节目全局简介</span>
            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
              {packaging.showDescription}
            </p>
          </div>

          {packaging.chaptersTimeline && (
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs">
              <span className="font-semibold text-slate-300 block mb-1">分P章节时间戳导航</span>
              <pre className="text-slate-400 font-mono text-[11px] whitespace-pre-wrap">
                {packaging.chaptersTimeline}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
