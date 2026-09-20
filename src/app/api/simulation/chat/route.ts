import { NextRequest, NextResponse } from "next/server";
import { StorageService } from "@/lib/storage";
import { LLMGateway, extractLLMConfigFromHeaders } from "@/lib/ai/client";
import { PROMPTS } from "@/lib/ai/prompts";
import { SimulationMessage } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const customConfig = extractLLMConfigFromHeaders(req.headers);
    const { projectId, message } = await req.json();
    const project = StorageService.getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    if (!project.simulationSession) {
      project.simulationSession = {
        id: `sim-${Date.now()}`,
        projectId,
        messages: [],
        createdAt: new Date().toISOString(),
      };
    }

    const userMsg: SimulationMessage = {
      id: `msg-${Date.now()}-u`,
      role: "interviewer",
      content: message,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    project.simulationSession.messages.push(userMsg);

    const profileJson = JSON.stringify(project.profile || {}, null, 2);
    const systemPrompt = PROMPTS.SIMULATION_SYSTEM_PROMPT(project.guestName, profileJson, project.topic);

    const historyForLLM = project.simulationSession.messages.map((m) => ({
      role: (m.role === "interviewer" ? "user" : "assistant") as "user" | "assistant",
      content: m.content,
    }));

    const aiReply = await LLMGateway.chat([
      { role: "system", content: systemPrompt },
      ...historyForLLM,
    ], { task: "chat", customConfig });

    const guestMsg: SimulationMessage = {
      id: `msg-${Date.now()}-g`,
      role: "guest",
      content: aiReply,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    // 写回时重新读取最新项目再追加消息：
    // 等待 LLM 期间用户可能标记了问题状态或改了笔记，整体写回会把这些改动覆盖掉。
    const saved = StorageService.updateProject(projectId, (latest) => {
      const session = latest.simulationSession ?? {
        id: `sim-${Date.now()}`,
        projectId,
        messages: [],
        createdAt: new Date().toISOString(),
      };

      const appended = [...session.messages];
      // 幂等追加，避免并发请求重复写入同一条消息
      if (!appended.some((m) => m.id === userMsg.id)) appended.push(userMsg);
      if (!appended.some((m) => m.id === guestMsg.id)) appended.push(guestMsg);

      return { ...latest, simulationSession: { ...session, messages: appended } };
    });

    if (!saved) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        userMessage: userMsg,
        guestMessage: guestMsg,
        allMessages: saved.simulationSession?.messages ?? [],
      },
    });
  } catch (err: any) {
    console.error("模拟访谈对练错误:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
