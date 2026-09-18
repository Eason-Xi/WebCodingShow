import { NextRequest, NextResponse } from "next/server";
import { StorageService } from "@/lib/storage";
import { InterviewProject } from "@/types";

export async function GET() {
  const projects = StorageService.getProjects();
  return NextResponse.json({ success: true, data: projects });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newProject: InterviewProject = {
      id: `proj-${Date.now()}`,
      title: body.title || `${body.guestName || "未命名"} 访谈项目`,
      guestName: body.guestName || "未定嘉宾",
      guestTitle: body.guestTitle || "",
      topic: body.topic || "",
      showType: body.showType || "深度访谈",
      durationMinutes: Number(body.durationMinutes) || 30,
      targetAudience: body.targetAudience || "",
      interviewStyle: body.interviewStyle || "深度对谈",
      focusDirection: body.focusDirection || "",
      status: "researching",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rawMaterials: body.rawMaterials || [],
      chapters: [],
      transcript: [],
      shortVideos: [],
      quotes: [],
    };

    const saved = StorageService.saveProject(newProject);
    return NextResponse.json({ success: true, data: saved });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
