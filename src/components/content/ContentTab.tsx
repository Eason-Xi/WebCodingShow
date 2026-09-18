"use client";

import { useState } from "react";
import { InterviewProject, ShortVideoClip, GoldenQuote, PackagingAssets } from "@/types";
import {
  Video,
  MessageSquareQuote,
  Share2,
  Clock,
  Copy,
  Check,
  RefreshCw,
  Film,
  Scissors,
  Type,
  AlignLeft,
  Hash,
} from "lucide-react";
import { Chip, EmptyState, SectionTitle, TabHeader } from "@/components/ui/Primitives";
import { requestJson, runTask, toast } from "@/components/ui/Feedback";

interface Props {
  project: InterviewProject;
  onUpdate: (updated: InterviewProject) => void;
}

export default function ContentTab({ project, onUpdate }: Props) {
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleGenerateContent = async () => {
    setGenerating(true);

    const { ok, data } = await runTask<{
      shortVideos: ShortVideoClip[];
      quotes: GoldenQuote[];
      packaging: PackagingAssets;
    }>(
      "AI 正在拆解短视频与金句...",
      "拆条、金句与全网包装资产已生成",
      () =>
        requestJson("/api/content/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId: project.id }),
        }),
      "内容生成失败"
    );

    if (ok && data) {
      onUpdate({
        ...project,
        shortVideos: data.shortVideos,
        quotes: data.quotes,
        packaging: data.packaging,
        status: "completed",
      });
    }
    setGenerating(false);
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("复制失败", "当前浏览器不允许访问剪贴板，请手动选中复制。");
    }
  };

  const shortVideos = project.shortVideos || [];
  const quotes = project.quotes || [];
  const packaging = project.packaging;

  const CopyButton = ({ text, id }: { text: string; id: string }) => (
    <button
      onClick={() => copyToClipboard(text, id)}
      className="btn btn-ghost btn-xs shrink-0"
      title="复制"
    >
      {copiedId === id ? (
        <>
          <Check className="h-3 w-3 text-emerald-400" />
          已复制
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          复制
        </>
      )}
    </button>
  );

  const PLATFORMS: { label: string; value?: string; tone: string }[] = [
    { label: "YouTube", value: packaging?.youtubeTitle, tone: "text-rose-300" },
    { label: "Bilibili", value: packaging?.bilibiliTitle, tone: "text-sky-300" },
    { label: "抖音", value: packaging?.douyinTitle, tone: "text-pink-300" },
    { label: "小红书", value: packaging?.xiaohongshuTitle, tone: "text-rose-300" },
  ];

  /** 导出短视频拆条清单，可直接交给剪辑师 */
  const handleCopyClips = async () => {
    if (shortVideos.length === 0) return;

    const blocks = shortVideos.map((clip, idx) => {
      const lines = [
        `${String(idx + 1).padStart(2, "0")}｜${clip.title}`,
        `时长：${clip.duration}    入点：${clip.inPoint}    出点：${clip.outPoint}`,
        `核心观点：${clip.coreOpinion}`,
        `建议封面大字：${clip.coverTitle}`,
      ];
      if (clip.scriptSnippet) lines.push(`台词切片：${clip.scriptSnippet}`);
      return lines.join("\n");
    });

    const text = [
      `短视频拆条清单 · ${project.guestName}｜${project.topic}`,
      `共 ${shortVideos.length} 条`,
      "",
      blocks.join("\n\n"),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      toast.success(`已复制 ${shortVideos.length} 条拆条清单`, "可直接交给剪辑师");
    } catch {
      toast.error("复制失败", "当前浏览器不允许访问剪贴板，请手动选中复制。");
    }
  };

  /** 导出全部金句与配套社媒文案 */
  const handleCopyQuotes = async () => {
    if (quotes.length === 0) return;

    const blocks = quotes.map((q) => {
      const lines = [`【${q.category}】${q.timecode ? ` ${q.timecode}` : ""}`, q.text];
      if (q.socialHooks?.xiaohongshu) lines.push(`小红书：${q.socialHooks.xiaohongshu}`);
      if (q.socialHooks?.weibo) lines.push(`微博：${q.socialHooks.weibo}`);
      if (q.socialHooks?.posterCaption) lines.push(`海报：${q.socialHooks.posterCaption}`);
      return lines.join("\n");
    });

    const text = [
      `金句集 · ${project.guestName}｜${project.topic}`,
      `共 ${quotes.length} 条`,
      "",
      blocks.join("\n\n"),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      toast.success(`已复制 ${quotes.length} 条金句`, "含小红书 / 微博 / 海报文案");
    } catch {
      toast.error("复制失败", "当前浏览器不允许访问剪贴板，请手动选中复制。");
    }
  };

  return (
    <div className="space-y-6">
      <TabHeader
        icon={Video}
        tone="pink"
        title="短视频自动拆条、金句系统与全网包装"
        description="一次采访，自动生成多条短视频出入点裁切方案、全平台爆款标题与小红书 / 微博宣发文案。"
        meta={
          <>
            <Chip tone="pink">
              <Scissors className="h-3 w-3" />
              {shortVideos.length} 条拆条
            </Chip>
            <Chip tone="amber">
              <MessageSquareQuote className="h-3 w-3" />
              {quotes.length} 个金句
            </Chip>
            {packaging && (
              <Chip tone="emerald" dot>
                包装已生成
              </Chip>
            )}
          </>
        }
        actions={
          <button
            onClick={handleGenerateContent}
            disabled={generating}
            className="btn btn-md border border-pink-500/30 bg-gradient-to-r from-pink-600 to-violet-600 text-white shadow-[0_10px_30px_-12px_rgba(219,39,119,0.6)] hover:from-pink-500 hover:to-violet-500"
          >
            <RefreshCw className={generating ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
            {generating ? "AI 深度切片分析中..." : "一键拆条与生成宣发资产"}
          </button>
        }
      />

      {/* ============ 1. 短视频拆条 ============ */}
      <section className="space-y-4">
        <SectionTitle
          icon={Film}
          tone="pink"
          extra={
            shortVideos.length > 0 ? (
              <div className="flex items-center gap-2.5">
                <span className="tabular text-xs font-mono text-3">{shortVideos.length} 条</span>
                <button onClick={handleCopyClips} className="btn btn-secondary btn-sm text-xs font-medium">
                  <Copy className="h-3.5 w-3.5" />
                  复制清单
                </button>
              </div>
            ) : undefined
          }
        >
          短视频自动拆条选题库
        </SectionTitle>

        {shortVideos.length === 0 ? (
          <EmptyState
            compact
            icon={Film}
            tone="pink"
            title="暂无短视频拆条"
            description="点击右上角「一键拆条与生成宣发资产」，AI 将从逐字稿中提取最具传播力的片段。"
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {shortVideos.map((clip, idx) => (
              <article
                key={clip.id}
                className={`glass-card card-hover animate-rise stagger-${(idx % 6) + 1} group flex flex-col overflow-hidden rounded-2xl`}
              >
                {/* 卡头：模拟时间轴条 */}
                <div className="relative flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-line-1 bg-gradient-to-r from-pink-500/[0.09] to-violet-500/[0.05] px-5 py-3.5">
                  <span className="flex items-center gap-2.5 text-xs font-bold text-pink-200">
                    <span className="tabular grid h-6 w-6 place-items-center rounded-md border border-pink-500/30 bg-pink-500/15 text-xs">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    短视频 · {clip.duration}
                  </span>
                  <span className="tabular flex items-center gap-1.5 font-mono text-xs text-3 font-medium">
                    <Clock className="h-3.5 w-3.5 text-3" />
                    {clip.inPoint} → {clip.outPoint}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-3.5 p-5">
                  <h4 className="text-base font-bold leading-snug tracking-tight text-1 transition-colors group-hover:text-pink-200">
                    {clip.title}
                  </h4>

                  <div className="inset space-y-3 rounded-xl p-4 border border-line-1">
                    <div>
                      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-3">
                        <AlignLeft className="h-3.5 w-3.5" />
                        核心观点
                      </p>
                      <p className="mt-1.5 text-sm leading-relaxed text-1">{clip.coreOpinion}</p>
                    </div>
                    <div className="border-t border-line-1 pt-3">
                      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
                        <Type className="h-3.5 w-3.5" />
                        建议封面大字
                      </p>
                      <p className="mt-1.5 text-base font-bold leading-relaxed text-amber-200">
                        {clip.coverTitle}
                      </p>
                    </div>
                  </div>

                  {clip.scriptSnippet && (
                    <p className="line-clamp-3 border-l-2 border-line-2 pl-3.5 text-xs sm:text-[13px] italic leading-relaxed text-2">
                      {clip.scriptSnippet}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ============ 2. 金句系统 ============ */}
      <section className="space-y-4">
        <SectionTitle
          icon={MessageSquareQuote}
          tone="amber"
          extra={
            quotes.length > 0 ? (
              <button onClick={handleCopyQuotes} className="btn btn-secondary btn-sm text-xs font-medium">
                <Copy className="h-3.5 w-3.5" />
                复制全部金句
              </button>
            ) : undefined
          }
        >
          金句系统与社媒分发文案
        </SectionTitle>

        {quotes.length === 0 ? (
          <EmptyState
            compact
            icon={MessageSquareQuote}
            tone="amber"
            title="暂无金句收录"
            description="完成拆条后，AI 会同步提炼可直接发布的金句与配套社媒文案。"
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {quotes.map((q) => (
              <article
                key={q.id}
                className="glass-card animate-rise flex flex-col rounded-2xl border-l-2 border-l-amber-500/70 p-5 sm:p-6"
              >
                <div className="flex items-center justify-between gap-2">
                  <Chip tone="amber" className="px-2.5 py-0.5 text-xs font-semibold">
                    {q.category}
                  </Chip>
                  {q.timecode && (
                    <span className="tabular font-mono text-xs text-3">{q.timecode}</span>
                  )}
                </div>

                <blockquote className="mt-4 border-l-2 border-amber-500/40 pl-4">
                  <p className="text-base sm:text-lg font-bold italic leading-relaxed text-1">{q.text}</p>
                </blockquote>

                <div className="mt-5 space-y-3 border-t border-line-1 pt-4">
                  {[
                    {
                      key: "xhs",
                      label: "小红书配文",
                      tone: "text-rose-400 dark:text-rose-300",
                      value: q.socialHooks?.xiaohongshu,
                    },
                    {
                      key: "wb",
                      label: "微博文案",
                      tone: "text-amber-400 dark:text-amber-300",
                      value: q.socialHooks?.weibo,
                    },
                  ]
                    .filter((row) => row.value)
                    .map((row) => (
                      <div key={row.key} className="inset rounded-xl p-3.5 border border-line-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-xs sm:text-[13px] font-bold ${row.tone}`}>
                            {row.label}
                          </span>
                          <CopyButton text={row.value!} id={`${q.id}-${row.key}`} />
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-1">{row.value}</p>
                      </div>
                    ))}

                  {q.socialHooks?.posterCaption && (
                    <div className="inset rounded-xl p-3.5 border border-line-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs sm:text-[13px] font-bold text-indigo-400 dark:text-indigo-300">
                          海报文案
                        </span>
                        <CopyButton
                          text={q.socialHooks.posterCaption}
                          id={`${q.id}-poster`}
                        />
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-1">
                        {q.socialHooks.posterCaption}
                      </p>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ============ 3. 全网包装 ============ */}
      {packaging && (
        <section className="glass-panel animate-rise space-y-5 rounded-2xl border-indigo-500/20 p-6">
          <SectionTitle
            icon={Share2}
            tone="indigo"
            extra={
              <Chip tone="indigo" className="px-2.5 py-0.5 text-xs font-semibold">
                可直接复制发布
              </Chip>
            }
          >
            全网多平台标题与节目包装
          </SectionTitle>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {PLATFORMS.map((p) =>
              p.value ? (
                <div key={p.label} className="inset rounded-xl p-4 border border-line-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs sm:text-[13px] font-bold ${p.tone}`}>{p.label} 标题</span>
                    <CopyButton text={p.value} id={`pkg-${p.label}`} />
                  </div>
                  <p className="mt-2 text-sm sm:text-base font-semibold leading-relaxed text-1">{p.value}</p>
                </div>
              ) : null
            )}
          </div>

          {packaging.showDescription && (
            <div className="inset rounded-xl p-4 border border-line-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-[13px] font-bold text-1">官方节目全局简介</span>
                <CopyButton text={packaging.showDescription} id="pkg-desc" />
              </div>
              <p className="mt-2.5 whitespace-pre-wrap text-sm leading-relaxed text-2">
                {packaging.showDescription}
              </p>
            </div>
          )}

          {packaging.chaptersTimeline && (
            <div className="inset rounded-xl p-4 border border-line-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-[13px] font-bold text-1">分P章节时间戳导航</span>
                <CopyButton text={packaging.chaptersTimeline} id="pkg-timeline" />
              </div>
              <pre className="mt-2.5 whitespace-pre-wrap font-mono text-xs sm:text-[13px] leading-relaxed text-2">
                {packaging.chaptersTimeline}
              </pre>
            </div>
          )}

          {packaging.seoKeywords?.length > 0 && (
            <div>
              <p className="mb-2.5 flex items-center gap-1.5 text-xs font-bold text-3">
                <Hash className="h-3.5 w-3.5" />
                SEO 关键词
              </p>
              <div className="flex flex-wrap gap-2">
                {packaging.seoKeywords.map((kw, i) => (
                  <Chip key={i} tone="slate" className="px-2.5 py-1 text-xs font-medium">
                    {kw}
                  </Chip>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
