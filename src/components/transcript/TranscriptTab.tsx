"use client";

import { useState } from "react";
import { InterviewProject, TranscriptItem } from "@/types";
import {
  FileAudio,
  Sparkles,
  Upload,
  Clock,
  Flame,
  User,
  Bot,
  Save,
  CheckCircle2,
} from "lucide-react";

interface Props {
  project: InterviewProject;
  onUpdate: (updated: InterviewProject) => void;
}

export default function TranscriptTab({ project, onUpdate }: Props) {
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [saving, setSaving] = useState(false);

  // 解析并保存粘贴的逐字稿
  const handleSavePastedText = async () => {
    if (!pasteText.trim()) return;
    setSaving(true);

    const lines = pasteText.split("\n").filter((l) => l.trim().length > 0);
    const newItems: TranscriptItem[] = lines.map((line, idx) => {
      const isGuest = line.includes("嘉宾") || line.includes(project.guestName);
      const hasHighlight = line.includes("🔥") || line.includes("金句") || line.includes("观点");

      // 提取时间码如 [00:01:23]
      const timeMatch = line.match(/\[?(\d{2}:\d{2}(?::\d{2})?)\]?/);
      const timecode = timeMatch ? timeMatch[1] : `00:${idx < 10 ? "0" + idx : idx}:00`;
      const cleanText = line.replace(/\[?\d{2}:\d{2}(?::\d{2})?\]?/, "").replace(/^(主持人|嘉宾|张三)[:：]/, "").trim();

      return {
        id: `tr-${Date.now()}-${idx}`,
        speaker: isGuest ? "嘉宾" : "主持人",
        timecode,
        text: cleanText,
        isHighlight: hasHighlight,
        tag: hasHighlight ? "🔥 潜在短视频观点" : undefined,
      };
    });

    const updated = {
      ...project,
      transcript: newItems,
      status: project.status === "interviewing" ? "producing" : project.status,
    };

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      const json = await res.json();
      if (json.success) {
        onUpdate(json.data);
        setShowPasteModal(false);
        setPasteText("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const transcript = project.transcript || [];

  return (
    <div className="space-y-6">
      {/* 顶部操作条 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileAudio className="w-5 h-5 text-indigo-400" />
              采访录音逐字稿与实时高光笔记
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
              共收录 {transcript.length} 条发言节点
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            智能区分主持人与嘉宾，同步时间码并实时识别「🔥 潜在短视频观点」与「🔥 核心爆款金句」。
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPasteModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-500/20"
          >
            <Upload className="w-3.5 h-3.5" />
            导入 / 粘贴逐字稿文本
          </button>
        </div>
      </div>

      {/* 粘贴逐字稿浮窗 */}
      {showPasteModal && (
        <div className="glass-panel p-6 rounded-2xl border border-indigo-500/30">
          <h3 className="text-sm font-bold text-white mb-2">快速导入逐字稿实录</h3>
          <p className="text-xs text-slate-400 mb-3">
            每行输入一条发言，支持自动识别 [00:01:23] 时间码与“主持人: / 嘉宾:”前缀。
          </p>
          <textarea
            rows={6}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="[00:01:15] 主持人: 什么时候你第一次觉得 AI 真能改变电影？&#10;[00:01:28] 嘉宾: 其实是在 2023 年底，我一个人用生成式工具跑出了传统团队半个月的场景..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={() => setShowPasteModal(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
            >
              取消
            </button>
            <button
              onClick={handleSavePastedText}
              disabled={saving}
              className="px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500"
            >
              {saving ? "保存中..." : "确认解析并保存"}
            </button>
          </div>
        </div>
      )}

      {/* 逐字稿内容流 */}
      {transcript.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center">
          <FileAudio className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white">暂未录入逐字稿</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            录制结束后，点击上方“导入/粘贴逐字稿文本”，系统将自动为您进行说话人分离与爆款高光标记。
          </p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          {transcript.map((item) => {
            const isGuest = item.speaker === "嘉宾";
            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all ${
                  item.isHighlight
                    ? "bg-indigo-950/20 border-indigo-500/40"
                    : "bg-slate-900/50 border-slate-800/80"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                        isGuest
                          ? "bg-purple-500/20 text-purple-300"
                          : "bg-blue-500/20 text-blue-300"
                      }`}
                    >
                      {isGuest ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      {isGuest ? `嘉宾 (${project.guestName})` : "主持人"}
                    </span>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.timecode}
                    </span>
                  </div>

                  {item.tag && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                      <Flame className="w-3 h-3" />
                      {item.tag}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-200 leading-relaxed pl-1">{item.text}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
