import { NextRequest, NextResponse } from "next/server";
import { StorageService } from "@/lib/storage";
import { LLMGateway, extractLLMConfigFromHeaders } from "@/lib/ai/client";
import { PROMPTS } from "@/lib/ai/prompts";
import { InterviewChapter, InterviewQuestion } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const customConfig = extractLLMConfigFromHeaders(req.headers);
    const { projectId } = await req.json();
    const project = StorageService.getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    const prompt = PROMPTS.GENERATE_PLAN({
      guestName: project.guestName,
      topic: project.topic,
      interviewStyle: project.interviewStyle,
      durationMinutes: project.durationMinutes,
      focusDirection: project.focusDirection,
      profileJson: JSON.stringify(project.profile || {}, null, 2),
    });

    const aiRes = await LLMGateway.chat([
      { role: "system", content: "你是一个资深访谈策划总监，按故事脉络组织采访章节与多级问题，只输出严格 JSON 格式。" },
      { role: "user", content: prompt },
    ], { jsonMode: true, task: "plan", customConfig });

    let planData;
    try {
      planData = JSON.parse(aiRes);
    } catch {
      const match = aiRes.match(/\{[\s\S]*\}/);
      if (match) {
        planData = JSON.parse(match[0]);
      } else {
        throw new Error("无法解析 AI 返回的 JSON 大纲");
      }
    }

    const formattedChapters: InterviewChapter[] = (planData.chapters || []).map((ch: any, idx: number) => ({
      id: `ch-${Date.now()}-${idx + 1}`,
      order: ch.order || idx + 1,
      title: ch.title || `Chapter ${idx + 1}`,
      goal: ch.goal || "",
      estimatedMinutes: ch.estimatedMinutes || 5,
      questions: (ch.questions || []).map((q: any, qIdx: number): InterviewQuestion => ({
        id: `q-${idx + 1}-${qIdx + 1}`,
        text: q.text || "",
        type: q.type || "story",
        status: "pending",
        followUps: q.followUps || [],
      })),
    }));

    // 防御：解析不出任何章节时必须显式失败，避免返回 success:true 却给出空大纲
    if (formattedChapters.length === 0) {
      throw new Error("未能从模型返回中解析出任何章节，请检查返回结构是否包含 chapters");
    }

    // 写回时重新读取，只更新章节与状态，避免覆盖等待 LLM 期间的其他改动
    const saved = StorageService.updateProject(projectId, (latest) => ({
      ...latest,
      chapters: formattedChapters,
      status: latest.status === "planning" ? "interviewing" : latest.status,
    }));

    if (!saved) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: saved.chapters });
  } catch (err: any) {
    console.error("策划大纲生成错误:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
