import { InterviewProject, ProjectStatus } from "@/types";

export type StageKey = "profile" | "planning" | "interview" | "transcript" | "content";

export interface WorkflowStage {
  key: StageKey;
  index: number;
  label: string;
  short: string;
  description: string;
}

/** 全流程五阶段：与项目详情页 Tab 一一对应 */
export const WORKFLOW_STAGES: WorkflowStage[] = [
  {
    key: "profile",
    index: 0,
    label: "资料 · 档案研究",
    short: "资料研究",
    description: "聚合嘉宾全网资料，AI 提炼人物标签、时间线、矛盾点与信息盲区。",
  },
  {
    key: "planning",
    index: 1,
    label: "策划 · 叙事提纲",
    short: "叙事策划",
    description: "把访谈构筑成起承转合的章节脉络，逐题配置深度分级与追问支架。",
  },
  {
    key: "interview",
    index: 2,
    label: "采访 · 彩排提词",
    short: "彩排提词",
    description: "AI 还原嘉宾做高保真对练并复盘，录制时切换为免干扰沉浸提词台。",
  },
  {
    key: "transcript",
    index: 3,
    label: "整理 · 逐字稿",
    short: "逐字稿",
    description: "说话人分离、时间码对齐，实时识别潜在短视频观点与爆款金句。",
  },
  {
    key: "content",
    index: 4,
    label: "内容 · 拆条包装",
    short: "拆条包装",
    description: "自动拆解短视频出入点、生成金句卡片与全平台标题宣发资产。",
  },
];

export const STATUS_META: Record<
  ProjectStatus,
  { label: string; tone: "sky" | "indigo" | "amber" | "pink" | "emerald"; stage: number }
> = {
  researching: { label: "资料研究中", tone: "sky", stage: 0 },
  planning: { label: "策划编排中", tone: "indigo", stage: 1 },
  interviewing: { label: "采访进行中", tone: "amber", stage: 2 },
  producing: { label: "内容生产中", tone: "pink", stage: 3 },
  completed: { label: "全流程完成", tone: "emerald", stage: 4 },
};

export interface ProjectProgress {
  done: boolean[];
  completed: number;
  total: number;
  percent: number;
}

/** 依据真实业务数据推导流程完成度（比 status 更准确） */
export function getProjectProgress(project: InterviewProject): ProjectProgress {
  const done = [
    Boolean(project.profile),
    project.chapters.length > 0,
    Boolean(project.simulationSession?.messages?.length),
    project.transcript.length > 0,
    project.shortVideos.length > 0,
  ];
  const completed = done.filter(Boolean).length;
  return {
    done,
    completed,
    total: WORKFLOW_STAGES.length,
    percent: Math.round((completed / WORKFLOW_STAGES.length) * 100),
  };
}

/** 单个项目的全局指标 */
export function getProjectMetrics(project: InterviewProject) {
  return {
    questions: project.chapters.reduce((acc, c) => acc + c.questions.length, 0),
    chapters: project.chapters.length,
    materials: project.rawMaterials.length,
    videos: project.shortVideos?.length || 0,
    quotes: project.quotes?.length || 0,
    transcript: project.transcript?.length || 0,
  };
}
