"use client";

import { useState } from "react";
import { InterviewProject, GuestProfile, RawMaterial } from "@/types";
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
  Quote,
  X,
  Trash2,
} from "lucide-react";
import {
  Chip,
  EmptyState,
  Field,
  SectionTitle,
  TabHeader,
  type Tone,
} from "@/components/ui/Primitives";
import { requestJson, runTask, toast, confirmDialog } from "@/components/ui/Feedback";

interface Props {
  project: InterviewProject;
  onUpdate: (updated: InterviewProject) => void;
}

const MATERIAL_META: Record<RawMaterial["type"], { label: string; tone: Tone }> = {
  article: { label: "公众号 / 文章", tone: "indigo" },
  social: { label: "社媒 / 微博", tone: "pink" },
  link: { label: "外部视频 / 链接", tone: "cyan" },
  note: { label: "观察笔记", tone: "amber" },
  text: { label: "文本", tone: "slate" },
};

export default function ProfileTab({ project, onUpdate }: Props) {
  const [analyzing, setAnalyzing] = useState(false);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newType, setNewType] = useState<RawMaterial["type"]>("article");

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newContent) {
      toast.error("资料不完整", "请填写资料标题与正文内容。");
      return;
    }

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

    const { ok, data } = await runTask<InterviewProject>(
      "正在保存资料...",
      "资料已加入资料库",
      () =>
        // 只提交 rawMaterials，避免覆盖并发进行中的 AI 结果
        requestJson<InterviewProject>(`/api/projects/${project.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rawMaterials: updatedProject.rawMaterials }),
        }),
      "保存资料失败"
    );

    if (ok && data) {
      onUpdate(data);
      setNewTitle("");
      setNewContent("");
      setShowAddMaterial(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);

    const { ok, data } = await runTask<GuestProfile>(
      "AI 正在深度挖掘人物档案...",
      "人物深度研究档案已生成",
      () =>
        requestJson<GuestProfile>("/api/research/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId: project.id }),
        }),
      "人物研究失败"
    );

    if (ok && data) {
      onUpdate({
        ...project,
        profile: data,
        status: project.status === "researching" ? "planning" : project.status,
      });
    }
    setAnalyzing(false);
  };

  const handleRemoveMaterial = async (mat: RawMaterial) => {
    const confirmed = await confirmDialog({
      title: "删除这份资料？",
      description: `「${mat.title}」将从嘉宾资料库中移除。已生成的人物档案不会自动更新，可重新运行 AI 人物研究。`,
      confirmText: "删除资料",
      tone: "danger",
    });
    if (!confirmed) return;

    const updatedProject = {
      ...project,
      rawMaterials: project.rawMaterials.filter((m) => m.id !== mat.id),
    };

    const { ok, data } = await runTask<InterviewProject>(
      "正在删除资料...",
      "资料已移除",
      () =>
        // 只提交 rawMaterials，避免覆盖并发进行中的 AI 结果
        requestJson<InterviewProject>(`/api/projects/${project.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rawMaterials: updatedProject.rawMaterials }),
        }),
      "删除资料失败"
    );

    if (ok && data) onUpdate(data);
  };

  const profile = project.profile;

  return (
    <div className="space-y-6">
      <TabHeader
        icon={Compass}
        tone="sky"
        title="嘉宾资料库与 AI 人物深度研究"
        description="聚合嘉宾全网资料，AI 主动挖掘人物的核心转变、认知矛盾、信息空白与最具采访张力的 5 大方向。"
        meta={
          <>
            <Chip tone="slate">{project.rawMaterials.length} 份资料</Chip>
            {profile && (
              <Chip tone="emerald" dot>
                档案已生成
              </Chip>
            )}
          </>
        }
        actions={
          <>
            <button
              onClick={() => setShowAddMaterial((v) => !v)}
              className="btn btn-secondary btn-md"
            >
              {showAddMaterial ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {showAddMaterial ? "收起" : "录入新资料"}
            </button>
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="btn btn-primary btn-md"
            >
              <RefreshCw className={analyzing ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
              {analyzing ? "AI 深度挖掘中..." : profile ? "重新生成人物档案" : "一键 AI 人物研究"}
            </button>
          </>
        }
      />

      {/* 新增资料 */}
      {showAddMaterial && (
        <div className="glass-panel animate-rise rounded-2xl border-indigo-500/25 p-5 sm:p-6">
          <SectionTitle icon={FileText} tone="indigo" className="mb-4">
            录入嘉宾资料
            <span className="ml-1 text-[11px] font-normal text-4">
              文章 / 专访 / 采访速记 / 个人碎语
            </span>
          </SectionTitle>
          <form onSubmit={handleAddMaterial} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="资料标题" required className="sm:col-span-2">
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="如：极客公园专访报道"
                  className="field"
                />
              </Field>
              <Field label="资料类型">
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as RawMaterial["type"])}
                  className="field"
                >
                  <option value="article">公众号 / 文章</option>
                  <option value="social">社媒 / 微博 / 小红书</option>
                  <option value="link">外部视频 / 链接</option>
                  <option value="note">个人观察笔记</option>
                </select>
              </Field>
            </div>
            <Field label="资料正文">
              <textarea
                rows={5}
                required
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="在此粘贴嘉宾资料内容、采访速记或过去说过的话..."
                className="field resize-none leading-relaxed"
              />
            </Field>
            <div className="flex justify-end gap-2 border-t border-line-1 pt-4">
              <button
                type="button"
                onClick={() => setShowAddMaterial(false)}
                className="btn btn-ghost btn-md"
              >
                取消
              </button>
              <button type="submit" className="btn btn-primary btn-md">
                保存资料
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 主视图左右分栏 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* 左侧：资料库 */}
        <div className="space-y-3 lg:col-span-4">
          <SectionTitle
            icon={FileText}
            tone="indigo"
            extra={<span className="tabular text-xs text-3 font-mono font-semibold">{project.rawMaterials.length} 份</span>}
          >
            原始资料库
          </SectionTitle>

          {project.rawMaterials.length === 0 ? (
            <EmptyState
              compact
              icon={FileText}
              title="暂未收录资料"
              description="导入嘉宾的报道、专访或过往言论，AI 才能挖出有张力的问题。"
              action={
                <button
                  onClick={() => setShowAddMaterial(true)}
                  className="btn btn-secondary btn-sm text-xs sm:text-sm"
                >
                  <Plus className="h-4 w-4" />
                  录入新资料
                </button>
              }
            />
          ) : (
            <div className="space-y-3">
              {project.rawMaterials.map((mat) => {
                const meta = MATERIAL_META[mat.type] ?? MATERIAL_META.text;
                return (
                  <article key={mat.id} className="glass-card card-hover group rounded-xl p-4">
                    <div className="flex items-center justify-between gap-2">
                      <Chip tone={meta.tone} className="px-2.5 py-0.5 text-xs">
                        {meta.label}
                      </Chip>
                      <div className="flex items-center gap-1.5">
                        <span className="tabular text-xs text-3 font-mono">
                          {new Date(mat.addedAt).toLocaleDateString("zh-CN")}
                        </span>
                        <button
                          onClick={() => handleRemoveMaterial(mat)}
                          title="删除这份资料"
                          className="btn btn-ghost btn-xs -mr-1 text-3 opacity-60 transition-opacity hover:bg-rose-500/10 hover:text-rose-300 group-hover:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <h4 className="mt-2.5 text-sm font-bold leading-snug text-1">
                      {mat.title}
                    </h4>
                    <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-2">
                      {mat.content}
                    </p>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* 右侧：AI 人物档案 */}
        <div className="space-y-5 lg:col-span-8">
          {!profile ? (
            <EmptyState
              icon={Sparkles}
              title="尚未生成 AI 人物深度研究档案"
              description="点击「一键 AI 人物研究」，AI 将深度提炼嘉宾标签、人生时间线、内心冲突及最值得深挖的采访角度。"
              action={
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="btn btn-primary btn-md"
                >
                  <RefreshCw className={analyzing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                  {analyzing ? "分析中..." : "立即开始分析"}
                </button>
              }
            />
          ) : (
            <>
              {/* 人物身份卡 */}
              <section className="glass-card animate-rise overflow-hidden rounded-2xl">
                <div className="flex flex-wrap items-start gap-4 p-6">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/25 to-violet-500/10 text-xl font-bold text-indigo-200">
                    {profile.identity.name?.slice(0, 1) || "?"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-bold tracking-tight text-1">
                      {profile.identity.name}
                    </h3>
                    <p className="mt-1 text-sm text-2">
                      {profile.identity.title}
                      {profile.identity.company && (
                        <span className="text-3"> · {profile.identity.company}</span>
                      )}
                    </p>
                    {profile.lastAnalyzedAt && (
                      <p className="mt-1 text-xs text-3 font-mono">
                        档案更新时间 {new Date(profile.lastAnalyzedAt).toLocaleString("zh-CN")}
                      </p>
                    )}
                  </div>
                </div>
                <div className="border-t border-line-1 px-6 py-4">
                  <p className="text-sm leading-relaxed text-1">{profile.identity.summary}</p>
                  {profile.identity.tags?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {profile.identity.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300"
                        >
                          <Tag className="h-3 w-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* 5 个深挖方向 */}
              {profile.top5Directions?.length > 0 && (
                <section className="glass-card animate-rise stagger-2 rounded-2xl border-indigo-500/25 p-6">
                  <SectionTitle
                    icon={Flame}
                    tone="amber"
                    className="mb-4"
                    extra={
                      <Chip tone="amber" className="px-2.5 py-0.5 text-xs font-semibold">
                        导演精选
                      </Chip>
                    }
                  >
                    本次采访最值得深挖的 5 个方向
                  </SectionTitle>
                  <ol className="space-y-3">
                    {profile.top5Directions.map((dir, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3.5 rounded-xl border border-line-1 bg-surface-1 p-4 transition-colors hover:border-indigo-500/25 hover:bg-surface-2"
                      >
                        <span className="tabular grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-indigo-500/25 bg-indigo-500/10 text-xs font-bold text-indigo-300">
                          {i + 1}
                        </span>
                        <p className="text-sm leading-relaxed text-1">{dir}</p>
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              {/* 矛盾点 / 盲区 */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {profile.conflicts?.length > 0 && (
                  <section className="glass-card animate-rise stagger-3 rounded-2xl border-l-2 border-l-amber-500/70 p-5">
                    <SectionTitle icon={AlertTriangle} tone="amber" className="mb-3.5">
                      矛盾点与内心张力
                    </SectionTitle>
                    <ul className="space-y-3">
                      {profile.conflicts.map((conf, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-1">
                          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                          <span>{conf}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {profile.blanks?.length > 0 && (
                  <section className="glass-card animate-rise stagger-4 rounded-2xl border-l-2 border-l-cyan-500/70 p-5">
                    <SectionTitle icon={HelpCircle} tone="cyan" className="mb-3.5">
                      资料盲区与空白
                    </SectionTitle>
                    <ul className="space-y-3">
                      {profile.blanks.map((blank, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-1">
                          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-cyan-400" />
                          <span>{blank}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>

              {/* 时间线 */}
              {profile.timeline?.length > 0 && (
                <section className="glass-card animate-rise rounded-2xl p-6">
                  <SectionTitle icon={Clock} tone="violet" className="mb-5">
                    人生关键时间线与心态转折
                  </SectionTitle>
                  <div className="relative space-y-6 border-l border-line-2 pl-6">
                    {profile.timeline.map((item, i) => (
                      <div key={i} className="relative">
                        <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 ring-4 ring-[color:var(--bg-base)]" />
                        <p className="tabular text-xs font-bold text-indigo-300 font-mono">
                          {item.period}
                        </p>
                        <p className="mt-1 text-sm font-semibold leading-relaxed text-1">
                          {item.event}
                        </p>
                        {item.significance && (
                          <p className="mt-2 rounded-lg border border-line-1 bg-surface-1 px-3.5 py-2 text-xs sm:text-[13px] leading-relaxed text-2">
                            {item.significance}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 代表作品 / 核心观点 */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {profile.representativeWorks?.length > 0 && (
                  <section className="glass-card rounded-2xl p-5">
                    <SectionTitle icon={Award} tone="purple" className="mb-3.5">
                      代表作品
                    </SectionTitle>
                    <div className="space-y-3">
                      {profile.representativeWorks.map((work, i) => (
                        <div key={i} className="inset rounded-xl p-3.5 border border-line-1">
                          <p className="text-sm font-bold text-1">{work.title}</p>
                          <p className="mt-1.5 text-xs sm:text-[13px] leading-relaxed text-2">{work.desc}</p>
                          {work.impact && (
                            <p className="mt-2 text-xs font-medium text-purple-300">{work.impact}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {profile.keyOpinions?.length > 0 && (
                  <section className="glass-card rounded-2xl p-5">
                    <SectionTitle icon={Quote} tone="emerald" className="mb-3.5">
                      过往核心观点
                    </SectionTitle>
                    <div className="space-y-2.5">
                      {profile.keyOpinions.map((op, i) => (
                        <div
                          key={i}
                          className="inset rounded-xl p-3 text-xs italic leading-relaxed text-2"
                        >
                          <Quote className="mb-1 h-3 w-3 text-emerald-400/60" />
                          {op}
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
