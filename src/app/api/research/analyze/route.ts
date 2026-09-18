import { NextRequest, NextResponse } from "next/server";
import { StorageService } from "@/lib/storage";
import { LLMGateway } from "@/lib/ai/client";
import { PROMPTS } from "@/lib/ai/prompts";

export async function POST(req: NextRequest) {
  try {
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
    ], true);

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

    project.profile = {
      ...profileData,
      lastAnalyzedAt: new Date().toISOString(),
    };
    if (project.status === "researching") {
      project.status = "planning";
    }

    StorageService.saveProject(project);

    return NextResponse.json({ success: true, data: project.profile });
  } catch (err: any) {
    console.error("人物分析错误:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
