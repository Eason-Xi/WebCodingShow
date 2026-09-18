export type InterviewStyle =
  | "人物故事"
  | "深度对谈"
  | "轻松聊天"
  | "专业访谈"
  | "犀利追问"
  | "纪录片"
  | "播客";

export type ProjectStatus =
  | "researching"
  | "planning"
  | "interviewing"
  | "producing"
  | "completed";

export interface RawMaterial {
  id: string;
  title: string;
  type: "text" | "article" | "link" | "social" | "note";
  content: string;
  sourceUrl?: string;
  addedAt: string;
}

export interface TimelineEvent {
  period: string;
  event: string;
  significance?: string;
}

export interface GuestProfile {
  identity: {
    name: string;
    title: string;
    company?: string;
    tags: string[];
    summary: string;
  };
  timeline: TimelineEvent[];
  representativeWorks: {
    title: string;
    desc: string;
    impact?: string;
  }[];
  keyOpinions: string[];
  valuableStories: string[];
  conflicts: string[]; // 矛盾点与内心张力
  blanks: string[]; // 资料盲区与未解之谜
  top5Directions: string[]; // 最值得深挖的5个方向
  lastAnalyzedAt?: string;
}

export type QuestionType = "normal" | "story" | "deep";
export type QuestionStatus = "pending" | "asked" | "skipped" | "highlight";

export interface InterviewQuestion {
  id: string;
  text: string;
  type: QuestionType;
  followUps: string[]; // 追问建议
  status: QuestionStatus;
  userNotes?: string;
}

export interface InterviewChapter {
  id: string;
  order: number;
  title: string;
  goal: string;
  estimatedMinutes?: number;
  questions: InterviewQuestion[];
}

export interface SimulationMessage {
  id: string;
  role: "interviewer" | "guest";
  content: string;
  timestamp: string;
}

export interface SimulationReview {
  overallRating: number; // 1-100
  summary: string;
  strengths: string[];
  missedOpportunities: {
    dialogueSnippet: string;
    reason: string;
    suggestedFollowUp: string;
  }[];
  redundantQuestions: string[];
  overallAdvice: string[];
}

export interface SimulationSession {
  id: string;
  projectId: string;
  messages: SimulationMessage[];
  reviewReport?: SimulationReview;
  createdAt: string;
}

export interface TranscriptItem {
  id: string;
  speaker: "主持人" | "嘉宾";
  timecode: string;
  text: string;
  isHighlight?: boolean;
  tag?: string; // e.g. "🔥 潜在短视频观点"
}

export interface ShortVideoClip {
  id: string;
  title: string;
  duration: string;
  inPoint: string;
  outPoint: string;
  coreOpinion: string;
  coverTitle: string;
  scriptSnippet: string;
}

export interface GoldenQuote {
  id: string;
  text: string;
  timecode?: string;
  category: string;
  socialHooks: {
    xiaohongshu: string;
    weibo: string;
    posterCaption: string;
  };
}

export interface PackagingAssets {
  youtubeTitle: string;
  bilibiliTitle: string;
  douyinTitle: string;
  xiaohongshuTitle: string;
  showDescription: string;
  chaptersTimeline: string;
  seoKeywords: string[];
}

export interface InterviewProject {
  id: string;
  title: string;
  guestName: string;
  guestTitle: string;
  topic: string;
  showType: string;
  durationMinutes: number;
  targetAudience: string;
  interviewStyle: InterviewStyle;
  focusDirection: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;

  // 关联业务数据
  rawMaterials: RawMaterial[];
  profile?: GuestProfile;
  chapters: InterviewChapter[];
  simulationSession?: SimulationSession;
  transcript: TranscriptItem[];
  shortVideos: ShortVideoClip[];
  quotes: GoldenQuote[];
  packaging?: PackagingAssets;
}
