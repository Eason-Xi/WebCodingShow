"use client";

import { useState } from "react";
import { InterviewProject, RawMaterial } from "@/types";
import {
  Sparkles,
  Plus,
  Compass,
  AlertTriangle,
  HelpCircle,
  Clock,
  Award,
  Flame,
  FileText,
  Tag,
  RefreshCw,
} from "lucide-react";

interface Props {
  project: InterviewProject;
  onUpdate: (updated: InterviewProject) => void;
}

export default function ProfileTab({ project, onUpdate }: Props) {
  const [analyzing, setAnalyzing] = useState(false);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newType, setNewType] = useState<RawMaterial["type"]>("article");

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newContent) return;

    const newMat: RawMaterial = {
      id: `mat-${Date.now()}`,
      title: newTitle,
      type: newType,
      content: newContent,
      addedAt: new Date().toISOString(),
    };

    const updatedProject = {
      ...project,
      rawMaterials: [...project.rawMaterials, newMat],
    };

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProject),
      });
      const json = await res.json();
      if (json.success) {
        onUpdate(json.data);
        setNewTitle("");
        setNewContent("");
        setShowAddMaterial(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/research/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      });
      const json = await res.json();
      if (json.success) {
        onUpdate({
          ...project,
          profile: json.data,
          status: project.status === "researching" ? "planning" : project.status,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const profile = project.profile;

  return (
    <div className="space-y-8">
      {/* 顶部操作条 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-indigo-400" />
            嘉宾资料库与 AI 人物深度研究
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            聚合嘉宾全网资料，AI 主动挖掘人物的核心转变、认知矛盾、信息空白与最具采访张力的 5 大方向。
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddMaterial(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            录入新资料
          </button>
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? "animate-spin" : ""}`} />
            {analyzing ? "AI 深度挖掘中..." : "一键 AI 人物研究"}
          </button>
        </div>
      </div>

      {/* 新增资料抽屉/模态框 */}
      {showAddMaterial && (
        <div className="glass-panel p-6 rounded-2xl border border-indigo-500/30">
          <h3 className="text-sm font-bold text-white mb-3">录入嘉宾资料（文章 / 专访 / 采访记录 / 个人碎语）</h3>
          <form onSubmit={handleAddMaterial} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="资料标题（如：极客公园专访报道）"
                className="sm:col-span-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="article">公众号/文章</option>
                <option value="social">社媒/微博/小红书</option>
                <option value="link">外部视频/链接</option>
                <option value="note">个人观察笔记</option>
              </select>
            </div>
            <textarea
              rows={4}
              required
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="在此粘贴嘉宾资料内容、采访速记或过去说过的话..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddMaterial(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500"
              >
                保存资料
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 主视图左右分栏 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 左侧：资料库列表 */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              原始资料库 ({project.rawMaterials.length})
            </span>
          </div>

          {project.rawMaterials.length === 0 ? (
            <div className="glass-card p-6 rounded-xl text-center text-xs text-slate-500">
              暂未收录资料，点击上方“录入新资料”导入背景文本。
            </div>
          ) : (
            <div className="space-y-3">
              {project.rawMaterials.map((mat) => (
                <div key={mat.id} className="glass-card p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400">
                      {mat.type}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(mat.addedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white mb-1.5">{mat.title}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed">
                    {mat.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 右侧：AI 人物深度档案 */}
        <div className="lg:col-span-8 space-y-6">
          {!profile ? (
            <div className="glass-panel p-12 rounded-2xl text-center">
              <Sparkles className="w-8 h-8 text-indigo-400 mx-auto mb-3 animate-pulse" />
              <h3 className="text-sm font-bold text-white">尚未生成 AI 人物深度研究档案</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                点击上方“一键 AI 人物研究”，AI 将深度提炼嘉宾标签、人生时间线、内心冲突及最值得深挖的采访角度。
              </p>
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500"
              >
                {analyzing ? "分析中..." : "立即开始分析"}
              </button>
            </div>
          ) : (
            <>
              {/* 人物身份卡 */}
              <div className="glass-card p-6 rounded-2xl border-l-4 border-indigo-500">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                      {profile.identity.name}
                      <span className="text-xs font-normal text-slate-400">
                        ({profile.identity.title})
                      </span>
                    </h3>
                    <p className="text-xs text-indigo-300 mt-0.5">{profile.identity.company}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 mt-3 leading-relaxed bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                  {profile.identity.summary}
                </p>

                <div className="flex flex-wrap gap-1.5 mt-3">
                  {profile.identity.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                    >
                      <Tag className="w-3 h-3 text-indigo-400" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* 核心亮点：最值得深挖的 5 个采访方向 */}
              <div className="glass-card p-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/20 to-purple-950/20">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-2 mb-3">
                  <Flame className="w-4 h-4 text-amber-400" />
                  本次采访最值得深挖的 5 个方向（导演精选）
                </h4>
                <div className="space-y-2">
                  {profile.top5Directions.map((dir, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-200"
                    >
                      <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                        0{i + 1}
                      </span>
                      <p className="leading-relaxed">{dir}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 核心亮点：人物矛盾点与信息空白 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card p-5 rounded-2xl border-l-4 border-amber-500">
                  <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5 mb-3">
                    <AlertTriangle className="w-4 h-4" />
                    人物矛盾点与内心张力（极具出彩点）
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {profile.conflicts.map((conf, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{conf}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="glass-card p-5 rounded-2xl border-l-4 border-cyan-500">
                  <h4 className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 mb-3">
                    <HelpCircle className="w-4 h-4" />
                    资料中的盲区与空白（独家提问点）
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {profile.blanks.map((blank, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold">•</span>
                        <span>{blank}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 人生时间线 */}
              <div className="glass-card p-6 rounded-2xl">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  人生关键时间线与心态转折
                </h4>
                <div className="relative pl-6 border-l border-indigo-500/30 space-y-4">
                  {profile.timeline.map((item, i) => (
                    <div key={i} className="relative group">
                      <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-indigo-950" />
                      <div className="text-xs">
                        <span className="font-bold text-indigo-400">{item.period}</span>
                        <p className="text-slate-200 font-medium mt-0.5">{item.event}</p>
                        {item.significance && (
                          <p className="text-[11px] text-slate-400 mt-1 italic">
                            转折意义：{item.significance}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 代表作品与核心观点 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card p-5 rounded-2xl">
                  <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-3">
                    <Award className="w-4 h-4 text-purple-400" />
                    代表作品
                  </h4>
                  <div className="space-y-2">
                    {profile.representativeWorks.map((work, i) => (
                      <div key={i} className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-800 text-xs">
                        <div className="font-semibold text-white">{work.title}</div>
                        <div className="text-slate-400 text-[11px] mt-0.5">{work.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card p-5 rounded-2xl">
                  <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-3">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    过往核心观点
                  </h4>
                  <div className="space-y-2">
                    {profile.keyOpinions.map((op, i) => (
                      <div key={i} className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-800 text-xs text-slate-300 italic">
                        “{op}”
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
