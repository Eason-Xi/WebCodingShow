import { NextRequest, NextResponse } from "next/server";
import { StorageService } from "@/lib/storage";
import { LLMGateway } from "@/lib/ai/client";
import { PROMPTS } from "@/lib/ai/prompts";
import { SimulationMessage } from "@/types";

export async function POST(req: NextRequest) {
  try {
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
    ]);

    const guestMsg: SimulationMessage = {
      id: `msg-${Date.now()}-g`,
      role: "guest",
      content: aiReply,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    project.simulationSession.messages.push(guestMsg);

    StorageService.saveProject(project);

    return NextResponse.json({
      success: true,
      data: {
        userMessage: userMsg,
        guestMessage: guestMsg,
        allMessages: project.simulationSession.messages,
      },
    });
  } catch (err: any) {
    console.error("模拟访谈对练错误:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
