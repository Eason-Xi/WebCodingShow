import { NextRequest, NextResponse } from "next/server";
import { StorageService } from "@/lib/storage";
import { LLMGateway, extractLLMConfigFromHeaders } from "@/lib/ai/client";
import { PROMPTS } from "@/lib/ai/prompts";
import { GoldenQuote, ShortVideoClip } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const customConfig = extractLLMConfigFromHeaders(req.headers);
    const { projectId, rawText } = await req.json();
    const project = StorageService.getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    let transcriptContent = "";
    if (rawText && rawText.trim()) {
      transcriptContent = rawText;
    } else if (project.transcript && project.transcript.length > 0) {
      transcriptContent = project.transcript
        .map((t) => `[${t.timecode}] ${t.speaker}: ${t.text}`)
        .join("\n");
    } else {
      transcriptContent = `主持人: 什么时候你第一次觉得 AI 真能改变电影？\n嘉宾: 其实是在2023年底，我一个人在房间用生成式工具跑出了传统剧组需要搭建半个月的场景，那一刻我手都在抖。我意识到不是效率提升，而是工业流程彻底被砸碎了。`;
    }

    const prompt = PROMPTS.ANALYZE_TRANSCRIPT_AND_PACKAGING(
      transcriptContent,
      project.guestName,
      project.topic
    );

    const aiRes = await LLMGateway.chat([
      { role: "system", content: "你是一个爆款内容总监与短视频剪辑总策划，只输出 JSON。" },
      { role: "user", content: prompt },
    ], { jsonMode: true, task: "content", customConfig });

    let parsed;
    try {
      parsed = JSON.parse(aiRes);
    } catch {
      const match = aiRes.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error("无法解析 AI 返回的内容资产");
      }
    }

    // 防御：模型（或本地兜底）返回了结构对不上的 JSON 时，必须显式失败，
    // 否则接口会返回 success:true 但什么都没生成，前端只会看到「成功」却空空如也。
    if (!parsed.shortVideos && !parsed.quotes && !parsed.packaging) {
      throw new Error("未能从逐字稿中解析出拆条 / 金句 / 包装资产，请检查模型返回结构");
    }

    const shortVideos: ShortVideoClip[] | undefined = parsed.shortVideos
      ? parsed.shortVideos.map((sv: any, idx: number): ShortVideoClip => ({
          id: `sv-${Date.now()}-${idx + 1}`,
          title: sv.title || `短视频选题 ${idx + 1}`,
          duration: sv.duration || "00:45",
          inPoint: sv.inPoint || "00:01:00",
          outPoint: sv.outPoint || "00:01:45",
          coreOpinion: sv.coreOpinion || "",
          coverTitle: sv.coverTitle || "",
          scriptSnippet: sv.scriptSnippet || "",
        }))
      : undefined;

    const quotes: GoldenQuote[] | undefined = parsed.quotes
      ? parsed.quotes.map((q: any, idx: number): GoldenQuote => ({
          id: `q-${Date.now()}-${idx + 1}`,
          text: q.text || "",
          timecode: q.timecode || "00:00:00",
          category: q.category || "认知金句",
          socialHooks: q.socialHooks || {
            xiaohongshu: "",
            weibo: "",
            posterCaption: "",
          },
        }))
      : undefined;

    // 写回时重新读取，只更新本次生成的资产，避免覆盖等待 LLM 期间的其他改动
    const saved = StorageService.updateProject(projectId, (latest) => ({
      ...latest,
      shortVideos: shortVideos ?? latest.shortVideos,
      quotes: quotes ?? latest.quotes,
      packaging: parsed.packaging ?? latest.packaging,
      status: "completed",
    }));

    if (!saved) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        shortVideos: saved.shortVideos,
        quotes: saved.quotes,
        packaging: saved.packaging,
      },
    });
  } catch (err: any) {
    console.error("后期资产拆解错误:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
