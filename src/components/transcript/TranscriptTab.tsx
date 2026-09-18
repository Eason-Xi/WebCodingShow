"use client";

import { useMemo, useState } from "react";
import { InterviewProject, TranscriptItem } from "@/types";
import {
  FileAudio,
  Upload,
  Clock,
  Flame,
  User,
  Bot,
  X,
  Sparkles,
  Timer,
  Copy,
  Check,
  ArrowLeftRight,
} from "lucide-react";
import clsx from "clsx";
import { Chip, EmptyState, SectionTitle, TabHeader, type Tone } from "@/components/ui/Primitives";
import { requestJson, runTask, toast } from "@/components/ui/Feedback";
import { parseTranscriptLine } from "@/lib/transcript";

interface Props {
  project: InterviewProject;
  onUpdate: (updated: InterviewProject) => void;
}

type FilterKey = "all" | "highlight" | "主持人" | "嘉宾";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "全部发言" },
  { key: "highlight", label: "仅高光" },
  { key: "主持人", label: "主持人" },
  { key: "嘉宾", label: "嘉宾" },
];

const SPEAKER_TONE: Record<TranscriptItem["speaker"], Tone> = {
  嘉宾: "purple",
  主持人: "sky",
};

export default function TranscriptTab({ project, onUpdate }: Props) {
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [copied, setCopied] = useState(false);

  // 解析并保存粘贴的逐字稿
  const handleSavePastedText = async () => {
    if (!pasteText.trim()) return;
    setSaving(true);

    const lines = pasteText.split("\n").filter((l) => l.trim().length > 0);
    const newItems: TranscriptItem[] = lines.map((line, idx) => {
      const parsed = parseTranscriptLine(line, project.guestName);
      return {
        id: `tr-${Date.now()}-${idx}`,
        speaker: parsed.speaker,
        timecode: parsed.timecode || `00:${idx < 10 ? "0" + idx : idx}:00`,
        text: parsed.text,
        isHighlight: parsed.isHighlight,
        tag: parsed.isHighlight ? "🔥 潜在短视频观点" : undefined,
      };
    });

    const updated = {
      ...project,
      transcript: newItems,
      status: project.status === "interviewing" ? "producing" : project.status,
    };

    const { ok, data } = await runTask<InterviewProject>(
      "正在解析并保存逐字稿...",
      `已解析 ${newItems.length} 条发言节点`,
      () =>
        requestJson<InterviewProject>(`/api/projects/${project.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        }),
      "逐字稿保存失败"
    );

    if (ok && data) {
      onUpdate(data);
      setShowPasteModal(false);
      setPasteText("");
    }
    setSaving(false);
  };

  const transcript = project.transcript || [];
  const highlightCount = transcript.filter((t) => t.isHighlight).length;
  const guestCount = transcript.filter((t) => t.speaker === "嘉宾").length;
  const hostCount = transcript.length - guestCount;

  const visible = useMemo(() => {
    if (filter === "all") return transcript;
    if (filter === "highlight") return transcript.filter((t) => t.isHighlight);
    return transcript.filter((t) => t.speaker === filter);
  }, [transcript, filter]);

  /** 人工纠正说话人：自动分离只是启发式，必须允许手工修正 */
  const handleToggleSpeaker = async (item: TranscriptItem) => {
    const next: TranscriptItem["speaker"] =
      item.speaker === "嘉宾" ? "主持人" : "嘉宾";

    const updated = {
      ...project,
      transcript: transcript.map((t) =>
        t.id === item.id ? { ...t, speaker: next } : t
      ),
    };
    onUpdate(updated);

    try {
      await requestJson(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
    } catch (e) {
      toast.error(
        "说话人修改未能同步到服务端",
        e instanceof Error ? e.message : "网络请求异常"
      );
    }
  };

  /** 导出当前筛选下的逐字稿为纯文本 */
  const handleCopyTranscript = async () => {
    if (visible.length === 0) return;

    const rows = visible.map(
      (t) =>
        `[${t.timecode}] ${
          t.speaker === "嘉宾" ? `${project.guestName}（嘉宾）` : "主持人"
        }：${t.text}`
    );

    const text = [
      `${project.guestName}｜${project.topic}`,
      `逐字稿 · 共 ${visible.length} 条发言节点${
        filter === "all" ? "" : "（当前筛选结果）"
      }`,
      "",
      ...rows,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(`已复制 ${visible.length} 条发言`, "可直接粘贴到文档或字幕工具");
    } catch {
      toast.error("复制失败", "当前浏览器不允许访问剪贴板，请手动选中复制。");
    }
  };

  return (
    <div className="space-y-6">
      <TabHeader
        icon={FileAudio}
        tone="cyan"
        title="采访录音逐字稿与实时高光笔记"
        description="智能区分主持人与嘉宾，同步时间码并实时识别「潜在短视频观点」与「核心爆款金句」。"
        meta={
          <>
            <Chip tone="slate">
              <Timer className="h-3 w-3" />
              {transcript.length} 条发言节点
            </Chip>
            {highlightCount > 0 && (
              <Chip tone="amber">
                <Flame className="h-3 w-3" />
                {highlightCount} 条高光
              </Chip>
            )}
          </>
        }
        actions={
          <>
            {transcript.length > 0 && (
              <button onClick={handleCopyTranscript} className="btn btn-secondary btn-md">
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? "已复制" : "复制逐字稿"}
              </button>
            )}
            <button
              onClick={() => setShowPasteModal((v) => !v)}
              className="btn btn-primary btn-md"
            >
              {showPasteModal ? <X className="h-3.5 w-3.5" /> : <Upload className="h-3.5 w-3.5" />}
              {showPasteModal ? "收起导入" : "导入 / 粘贴逐字稿"}
            </button>
          </>
        }
      />

      {/* 导入面板 */}
      {showPasteModal && (
        <div className="glass-panel animate-rise rounded-2xl border-indigo-500/25 p-5 sm:p-6">
          <SectionTitle icon={Sparkles} tone="indigo" className="mb-2">
            快速导入逐字稿实录
          </SectionTitle>
          <p className="mb-4 text-xs leading-relaxed text-3">
            每行一条发言，自动识别{" "}
            <code className="rounded tint-3 px-1.5 py-0.5 font-mono text-[11px] text-indigo-200">
              [00:01:23]
            </code>{" "}
            时间码与行首的「主持人: / 嘉宾: / 人名:」标签，并剥离前缀、标记高光观点。
            判定不准的可在下方点击说话人标签手动纠正。
          </p>
          <textarea
            rows={7}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={
              "[00:01:15] 主持人: 什么时候你第一次觉得 AI 真能改变电影？\n[00:01:28] 嘉宾: 其实是在 2023 年底，我一个人用生成式工具跑出了传统团队半个月的场景..."
            }
            className="field resize-none font-mono text-[11px] leading-relaxed"
          />
          <div className="mt-4 flex justify-end gap-2 border-t border-line-1 pt-4">
            <button onClick={() => setShowPasteModal(false)} className="btn btn-ghost btn-md">
              取消
            </button>
            <button
              onClick={handleSavePastedText}
              disabled={saving || !pasteText.trim()}
              className="btn btn-primary btn-md"
            >
              {saving ? "保存中..." : "确认解析并保存"}
            </button>
          </div>
        </div>
      )}

      {/* 逐字稿内容 */}
      {transcript.length === 0 ? (
        <EmptyState
          icon={FileAudio}
          title="暂未录入逐字稿"
          description="录制结束后导入录音文本，系统将自动完成说话人分离、时间码对齐与爆款高光标记。"
          action={
            <button onClick={() => setShowPasteModal(true)} className="btn btn-primary btn-md">
              <Upload className="h-4 w-4" />
              导入逐字稿
            </button>
          }
        />
      ) : (
        <div className="glass-panel overflow-hidden rounded-2xl">
          {/* 工具条 */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-1 tint-1 px-5 py-3.5">
            <div className="flex flex-wrap items-center gap-1">
              {FILTERS.map((f) => {
                const active = filter === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={clsx(
                      "btn btn-sm rounded-lg",
                      active
                        ? "tint-4 text-1"
                        : "text-3 hover:bg-surface-2 hover:text-2"
                    )}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-3 text-[11px] text-4">
              <span className="flex items-center gap-1.5">
                <Bot className="h-3 w-3 text-sky-400" />
                <span className="tabular">{hostCount}</span> 主持人
              </span>
              <span className="flex items-center gap-1.5">
                <User className="h-3 w-3 text-purple-400" />
                <span className="tabular">{guestCount}</span> 嘉宾
              </span>
              <span className="hidden items-center gap-1.5 sm:flex">
                <ArrowLeftRight className="h-3 w-3" />
                点击标签可纠正
              </span>
            </div>
          </div>

          {/* 发言流 */}
          <div className="divide-y divide-line-1">
            {visible.length === 0 ? (
              <p className="px-5 py-12 text-center text-xs text-4">当前筛选下没有发言记录</p>
            ) : (
              visible.map((item) => {
                const isGuest = item.speaker === "嘉宾";
                return (
                  <article
                    key={item.id}
                    className={clsx(
                      "relative px-5 py-4 transition-colors hover:bg-surface-1",
                      item.isHighlight && "bg-amber-500/[0.045]"
                    )}
                  >
                    {item.isHighlight && (
                      <span className="absolute inset-y-0 left-0 w-0.5 bg-gradient-to-b from-amber-400 to-rose-400" />
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleSpeaker(item)}
                          title={`点击改为「${isGuest ? "主持人" : "嘉宾"}」`}
                          className="group/speaker inline-flex items-center gap-1 rounded-full transition-opacity hover:opacity-80"
                        >
                          <Chip
                            tone={SPEAKER_TONE[item.speaker]}
                            className="px-2 py-0.5 text-[10px]"
                          >
                            {isGuest ? (
                              <User className="h-2.5 w-2.5" />
                            ) : (
                              <Bot className="h-2.5 w-2.5" />
                            )}
                            {isGuest ? `嘉宾 · ${project.guestName}` : "主持人"}
                            <ArrowLeftRight className="h-2.5 w-2.5 opacity-0 transition-opacity group-hover/speaker:opacity-70" />
                          </Chip>
                        </button>
                        <span className="tabular flex items-center gap-1 font-mono text-[11px] text-4">
                          <Clock className="h-3 w-3" />
                          {item.timecode}
                        </span>
                      </div>

                      {item.tag && (
                        <Chip tone="amber" className="px-2 py-0.5 text-[10px]">
                          <Flame className="h-2.5 w-2.5" />
                          {item.tag}
                        </Chip>
                      )}
                    </div>

                    <p className="mt-2.5 text-[13px] leading-relaxed text-2">{item.text}</p>
                  </article>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
