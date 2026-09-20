import { NextRequest, NextResponse } from "next/server";
import { StorageService } from "@/lib/storage";
import { LLMGateway, extractLLMConfigFromHeaders } from "@/lib/ai/client";
import { PROMPTS } from "@/lib/ai/prompts";

export async function POST(req: NextRequest) {
  try {
    const customConfig = extractLLMConfigFromHeaders(req.headers);
    const { projectId } = await req.json();
    const project = StorageService.getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    const materialsText = project.rawMaterials.length > 0
      ? project.rawMaterials.map((m) => `【${m.title}】\n${m.content}`).join("\n\n")
      : `暂未上传长篇资料，仅有基本信息：嘉宾姓名 ${project.guestName}，身份 ${project.guestTitle}，主题 ${project.topic}。`;

    const prompt = PROMPTS.ANALYZE_PROFILE(materialsText, {
      name: project.guestName,
      title: project.guestTitle,
      topic: project.topic,
    });

    const aiRes = await LLMGateway.chat([
      { role: "system", content: "你是一个专业的访谈人物深度研究总监，只输出标准 JSON 格式。" },
      { role: "user", content: prompt },
    ], { jsonMode: true, task: "profile", customConfig });

    let profileData;
    try {
      profileData = JSON.parse(aiRes);
    } catch {
      // 提取 json 块
      const match = aiRes.match(/\{[\s\S]*\}/);
      if (match) {
        profileData = JSON.parse(match[0]);
      } else {
        throw new Error("无法解析 AI 返回的 JSON 结构");
      }
    }

    const profile = {
      ...profileData,
      lastAnalyzedAt: new Date().toISOString(),
    };

    // 写回时重新读取，只更新档案与状态，避免覆盖等待 LLM 期间的其他改动
    const saved = StorageService.updateProject(projectId, (latest) => ({
      ...latest,
      profile,
      status: latest.status === "researching" ? "planning" : latest.status,
    }));

    if (!saved) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: saved.profile });
  } catch (err: any) {
    console.error("人物分析错误:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
