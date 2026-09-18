"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Compass,
  BookOpen,
  Mic,
  FileAudio,
  Video,
  Sparkles,
  Clock,
  Trash2,
} from "lucide-react";
import { InterviewProject } from "@/types";
import ProfileTab from "@/components/profile/ProfileTab";
import PlanningTab from "@/components/planning/PlanningTab";
import InterviewTab from "@/components/interview/InterviewTab";
import TranscriptTab from "@/components/transcript/TranscriptTab";
import ContentTab from "@/components/content/ContentTab";

type ActiveTab = "profile" | "planning" | "interview" | "transcript" | "content";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [project, setProject] = useState<InterviewProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("profile");

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      const json = await res.json();
      if (json.success) {
        setProject(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchProject();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("确定要删除此访谈项目吗？")) return;
    try {
      await fetch(`/api/projects/${id}`, { method: "DELETE" });
      router.push("/");
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-sm text-slate-500">
        正在载入访谈项目全生命周期上下文...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-base font-bold text-white">未找到该访谈项目</h2>
        <Link href="/" className="text-xs text-indigo-400 hover:underline mt-2 inline-block">
          返回我的访谈看板
        </Link>
      </div>
    );
  }

  const TABS = [
    { id: "profile" as ActiveTab, label: "资料 · 档案研究", icon: Compass, count: project.rawMaterials.length },
    {
      id: "planning" as ActiveTab,
      label: "策划 · 叙事提纲",
      icon: BookOpen,
      count: project.chapters.reduce((acc, c) => acc + c.questions.length, 0),
    },
    {
      id: "interview" as ActiveTab,
      label: "采访 · 彩排提词",
      icon: Mic,
      count: project.simulationSession?.messages?.length ? "已演练" : undefined,
    },
    { id: "transcript" as ActiveTab, label: "整理 · 逐字稿", icon: FileAudio, count: project.transcript?.length || 0 },
    { id: "content" as ActiveTab, label: "内容 · 拆条包装", icon: Video, count: project.shortVideos?.length || 0 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
      {/* 顶部面包屑与项目信息头 */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                返回项目列表
              </Link>
              <span className="text-slate-600">/</span>
              <span className="text-xs text-indigo-400 font-medium">{project.interviewStyle}</span>
              <span className="text-slate-600">/</span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                {project.durationMinutes} 分钟
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {project.guestName}
              <span className="text-slate-400 font-normal text-lg ml-2">
                · {project.topic}
              </span>
            </h1>

            <p className="text-xs text-slate-400 mt-1">
              嘉宾头衔：<span className="text-slate-300">{project.guestTitle || "未指定"}</span>
              {project.targetAudience && (
                <> · 目标受众：<span className="text-slate-300">{project.targetAudience}</span></>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDelete}
              className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="删除项目"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 五大主流程 TAB 导航 */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto pb-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/40"
                    : "bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? "bg-indigo-800 text-indigo-200" : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 各 Tab 视图渲染 */}
      <div className="w-full">
        {activeTab === "profile" && (
          <ProfileTab project={project} onUpdate={(updated) => setProject(updated)} />
        )}
        {activeTab === "planning" && (
          <PlanningTab project={project} onUpdate={(updated) => setProject(updated)} />
        )}
        {activeTab === "interview" && (
          <InterviewTab project={project} onUpdate={(updated) => setProject(updated)} />
        )}
        {activeTab === "transcript" && (
          <TranscriptTab project={project} onUpdate={(updated) => setProject(updated)} />
        )}
        {activeTab === "content" && (
          <ContentTab project={project} onUpdate={(updated) => setProject(updated)} />
        )}
      </div>
    </div>
  );
}
