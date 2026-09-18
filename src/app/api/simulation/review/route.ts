import { NextRequest, NextResponse } from "next/server";
import { StorageService } from "@/lib/storage";
import { LLMGateway } from "@/lib/ai/client";
import { PROMPTS } from "@/lib/ai/prompts";

export async function POST(req: NextRequest) {
  try {
    const { projectId } = await req.json();
    const project = StorageService.getProjectById(projectId);
    if (!project || !project.simulationSession) {
      return NextResponse.json({ success: false, error: "Simulation session not found" }, { status: 404 });
    }

    const messages = project.simulationSession.messages;
    if (messages.length === 0) {
      return NextResponse.json({ success: false, error: "暂无对话记录可供复盘" }, { status: 400 });
    }

    const dialogHistory = messages
      .map((m) => `${m.role === "interviewer" ? "主持人" : project.guestName}: ${m.content}`)
      .join("\n\n");

    const prompt = PROMPTS.SIMULATION_REVIEW(dialogHistory, project.guestName);

    const aiRes = await LLMGateway.chat([
      { role: "system", content: "你是一个严格、专业的访谈总导演，输出复盘 JSON 结构。" },
      { role: "user", content: prompt },
    ], true);

    let reviewReport;
    try {
      reviewReport = JSON.parse(aiRes);
    } catch {
      const match = aiRes.match(/\{[\s\S]*\}/);
      if (match) {
        reviewReport = JSON.parse(match[0]);
      } else {
        throw new Error("无法解析 AI 返回的复盘报告");
      }
    }

    project.simulationSession.reviewReport = reviewReport;
    StorageService.saveProject(project);

    return NextResponse.json({ success: true, data: reviewReport });
  } catch (err: any) {
    console.error("生成复盘报告错误:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
