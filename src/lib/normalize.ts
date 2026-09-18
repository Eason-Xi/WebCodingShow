import {
  GoldenQuote,
  GuestProfile,
  InterviewChapter,
  InterviewProject,
  InterviewStyle,
  PackagingAssets,
  ProjectStatus,
  QuestionStatus,
  QuestionType,
  RawMaterial,
  ShortVideoClip,
  SimulationMessage,
  SimulationReview,
  SimulationSession,
  TranscriptItem,
} from "@/types";

/* ==========================================================================
   归一化：把「合法 JSON 但字段缺失」的数据补全成 UI 可以放心消费的形状

   背景：接真实 LLM 时，返回结构经常缺字段（少 identity、少 questions、
   socialHooks 为空……）。这些数据一旦流进 UI，`x.identity.name` 之类的访问
   会直接抛错并让整页白屏。统一在存储层收口，UI 就不用到处写可选链。
   ========================================================================== */

const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const asString = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v : typeof v === "number" ? String(v) : fallback;
const asNumber = (v: unknown, fallback = 0): number =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;
const asBool = (v: unknown): boolean => v === true;
const asRecord = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
const strList = (v: unknown): string[] =>
  asArray(v)
    .map((x) => asString(x))
    .filter((s) => s.length > 0);

const INTERVIEW_STYLES: InterviewStyle[] = [
  "人物故事",
  "深度对谈",
  "轻松聊天",
  "专业访谈",
  "犀利追问",
  "纪录片",
  "播客",
];
const PROJECT_STATUSES: ProjectStatus[] = [
  "researching",
  "planning",
  "interviewing",
  "producing",
  "completed",
];
const QUESTION_TYPES: QuestionType[] = ["normal", "story", "deep"];
const QUESTION_STATUSES: QuestionStatus[] = ["pending", "asked", "skipped", "highlight"];

const pick = <T extends string>(v: unknown, allowed: T[], fallback: T): T => {
  const s = asString(v) as T;
  return allowed.includes(s) ? s : fallback;
};

/* ------------------------------ 资料 ------------------------------ */

const MATERIAL_TYPES: RawMaterial["type"][] = ["text", "article", "link", "social", "note"];

function normalizeMaterials(raw: unknown): RawMaterial[] {
  return asArray(raw)
    .map((m, i) => {
      const r = asRecord(m);
      return {
        id: asString(r.id, `mat-${i + 1}`),
        title: asString(r.title),
        type: pick(r.type, MATERIAL_TYPES, "article"),
        content: asString(r.content),
        sourceUrl: r.sourceUrl ? asString(r.sourceUrl) : undefined,
        addedAt: asString(r.addedAt, new Date().toISOString()),
      };
    })
    .filter((m) => m.title || m.content);
}

/* ---------------------------- 人物档案 ---------------------------- */

export function normalizeProfile(raw: unknown): GuestProfile | undefined {
  if (!raw || typeof raw !== "object") return undefined;

  const p = asRecord(raw);
  const identity = asRecord(p.identity);

  const profile: GuestProfile = {
    identity: {
      name: asString(identity.name),
      title: asString(identity.title),
      company: identity.company ? asString(identity.company) : undefined,
      tags: strList(identity.tags),
      summary: asString(identity.summary),
    },
    timeline: asArray(p.timeline)
      .map((t) => {
        const r = asRecord(t);
        return {
          period: asString(r.period),
          event: asString(r.event),
          significance: r.significance ? asString(r.significance) : undefined,
        };
      })
      .filter((t) => t.period || t.event),
    representativeWorks: asArray(p.representativeWorks)
      .map((w) => {
        const r = asRecord(w);
        return {
          title: asString(r.title),
          desc: asString(r.desc),
          impact: r.impact ? asString(r.impact) : undefined,
        };
      })
      .filter((w) => w.title || w.desc),
    keyOpinions: strList(p.keyOpinions),
    valuableStories: strList(p.valuableStories),
    conflicts: strList(p.conflicts),
    blanks: strList(p.blanks),
    top5Directions: strList(p.top5Directions),
    lastAnalyzedAt: p.lastAnalyzedAt ? asString(p.lastAnalyzedAt) : undefined,
  };

  // 全是空壳时视为「尚未生成」，让 UI 走空状态而不是渲染一张空卡片
  const hasContent =
    profile.identity.name !== "" ||
    profile.identity.summary !== "" ||
    profile.timeline.length > 0 ||
    profile.top5Directions.length > 0 ||
    profile.conflicts.length > 0 ||
    profile.blanks.length > 0 ||
    profile.keyOpinions.length > 0 ||
    profile.representativeWorks.length > 0;

  return hasContent ? profile : undefined;
}

/* ---------------------------- 采访提纲 ---------------------------- */

export function normalizeChapters(raw: unknown): InterviewChapter[] {
  return asArray(raw)
    .map((c, i) => {
      const r = asRecord(c);
      return {
        id: asString(r.id, `ch-${i + 1}`),
        order: asNumber(r.order, i + 1),
        title: asString(r.title, `Chapter ${i + 1}`),
        goal: asString(r.goal),
        estimatedMinutes:
          r.estimatedMinutes === undefined ? undefined : asNumber(r.estimatedMinutes, 5),
        questions: asArray(r.questions)
          .map((q, qi) => {
            const qr = asRecord(q);
            return {
              id: asString(qr.id, `q-${i + 1}-${qi + 1}`),
              text: asString(qr.text),
              type: pick(qr.type, QUESTION_TYPES, "story"),
              status: pick(qr.status, QUESTION_STATUSES, "pending"),
              followUps: strList(qr.followUps),
              userNotes: qr.userNotes ? asString(qr.userNotes) : undefined,
            };
          })
          .filter((q) => q.text !== ""),
      };
    })
    .filter((c) => c.title !== "");
}

/* ---------------------------- 彩排会话 ---------------------------- */

export function normalizeReview(raw: unknown): SimulationReview | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = asRecord(raw);

  const review: SimulationReview = {
    overallRating: Math.max(0, Math.min(100, asNumber(r.overallRating, 0))),
    summary: asString(r.summary),
    strengths: strList(r.strengths),
    missedOpportunities: asArray(r.missedOpportunities)
      .map((m) => {
        const mr = asRecord(m);
        return {
          dialogueSnippet: asString(mr.dialogueSnippet),
          reason: asString(mr.reason),
          suggestedFollowUp: asString(mr.suggestedFollowUp),
        };
      })
      .filter((m) => m.reason || m.suggestedFollowUp || m.dialogueSnippet),
    redundantQuestions: strList(r.redundantQuestions),
    overallAdvice: strList(r.overallAdvice),
  };

  const hasContent =
    review.summary !== "" ||
    review.strengths.length > 0 ||
    review.missedOpportunities.length > 0 ||
    review.overallAdvice.length > 0;

  return hasContent ? review : undefined;
}

export function normalizeSimulation(raw: unknown): SimulationSession | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = asRecord(raw);

  const messages: SimulationMessage[] = asArray(r.messages)
    .map((m, i): SimulationMessage => {
      const mr = asRecord(m);
      return {
        id: asString(mr.id, `msg-${i + 1}`),
        role: asString(mr.role) === "guest" ? "guest" : "interviewer",
        content: asString(mr.content),
        timestamp: asString(mr.timestamp),
      };
    })
    .filter((m) => m.content !== "");

  if (messages.length === 0 && !r.reviewReport) return undefined;

  return {
    id: asString(r.id, "sim-1"),
    projectId: asString(r.projectId),
    messages,
    reviewReport: normalizeReview(r.reviewReport),
    createdAt: asString(r.createdAt, new Date().toISOString()),
  };
}

/* ---------------------------- 逐字稿 ---------------------------- */

export function normalizeTranscript(raw: unknown): TranscriptItem[] {
  return asArray(raw)
    .map((t, i) => {
      const r = asRecord(t);
      return {
        id: asString(r.id, `tr-${i + 1}`),
        speaker: asString(r.speaker) === "嘉宾" ? ("嘉宾" as const) : ("主持人" as const),
        timecode: asString(r.timecode, "00:00:00"),
        text: asString(r.text),
        isHighlight: asBool(r.isHighlight),
        tag: r.tag ? asString(r.tag) : undefined,
      };
    })
    .filter((t) => t.text !== "");
}

/* ---------------------------- 内容资产 ---------------------------- */

export function normalizeShortVideos(raw: unknown): ShortVideoClip[] {
  return asArray(raw)
    .map((s, i) => {
      const r = asRecord(s);
      return {
        id: asString(r.id, `sv-${i + 1}`),
        title: asString(r.title, `短视频选题 ${i + 1}`),
        duration: asString(r.duration, "00:45"),
        inPoint: asString(r.inPoint, "00:00:00"),
        outPoint: asString(r.outPoint, "00:00:45"),
        coreOpinion: asString(r.coreOpinion),
        coverTitle: asString(r.coverTitle),
        scriptSnippet: asString(r.scriptSnippet),
      };
    })
    .filter((s) => s.title !== "");
}

export function normalizeQuotes(raw: unknown): GoldenQuote[] {
  return asArray(raw)
    .map((q, i) => {
      const r = asRecord(q);
      const hooks = asRecord(r.socialHooks);
      return {
        id: asString(r.id, `q-${i + 1}`),
        text: asString(r.text),
        timecode: r.timecode ? asString(r.timecode) : undefined,
        category: asString(r.category, "认知金句"),
        socialHooks: {
          xiaohongshu: asString(hooks.xiaohongshu),
          weibo: asString(hooks.weibo),
          posterCaption: asString(hooks.posterCaption),
        },
      };
    })
    .filter((q) => q.text !== "");
}

export function normalizePackaging(raw: unknown): PackagingAssets | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = asRecord(raw);

  const packaging: PackagingAssets = {
    youtubeTitle: asString(r.youtubeTitle),
    bilibiliTitle: asString(r.bilibiliTitle),
    douyinTitle: asString(r.douyinTitle),
    xiaohongshuTitle: asString(r.xiaohongshuTitle),
    showDescription: asString(r.showDescription),
    chaptersTimeline: asString(r.chaptersTimeline),
    seoKeywords: strList(r.seoKeywords),
  };

  const hasContent =
    packaging.youtubeTitle !== "" ||
    packaging.bilibiliTitle !== "" ||
    packaging.douyinTitle !== "" ||
    packaging.xiaohongshuTitle !== "" ||
    packaging.showDescription !== "" ||
    packaging.chaptersTimeline !== "" ||
    packaging.seoKeywords.length > 0;

  return hasContent ? packaging : undefined;
}

/* ------------------------------ 项目 ------------------------------ */

export function normalizeProject(raw: unknown): InterviewProject {
  const p = asRecord(raw);
  const now = new Date().toISOString();

  return {
    id: asString(p.id, `proj-${Date.now()}`),
    title: asString(p.title),
    guestName: asString(p.guestName, "未定嘉宾"),
    guestTitle: asString(p.guestTitle),
    topic: asString(p.topic),
    showType: asString(p.showType, "深度访谈"),
    durationMinutes: asNumber(p.durationMinutes, 30),
    targetAudience: asString(p.targetAudience),
    interviewStyle: pick(p.interviewStyle, INTERVIEW_STYLES, "深度对谈"),
    focusDirection: asString(p.focusDirection),
    status: pick(p.status, PROJECT_STATUSES, "researching"),
    createdAt: asString(p.createdAt, now),
    updatedAt: asString(p.updatedAt, now),

    rawMaterials: normalizeMaterials(p.rawMaterials),
    profile: normalizeProfile(p.profile),
    chapters: normalizeChapters(p.chapters),
    simulationSession: normalizeSimulation(p.simulationSession),
    transcript: normalizeTranscript(p.transcript),
    shortVideos: normalizeShortVideos(p.shortVideos),
    quotes: normalizeQuotes(p.quotes),
    packaging: normalizePackaging(p.packaging),
  };
}
