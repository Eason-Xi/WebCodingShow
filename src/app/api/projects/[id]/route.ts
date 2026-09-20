import { NextRequest, NextResponse } from "next/server";
import { StorageService } from "@/lib/storage";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = StorageService.getProjectById(id);
  if (!project) {
    return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: project });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "请求体不是合法 JSON" }, { status: 400 });
  }

  // 先解析请求体、再在同步的 updateProject 里读取最新数据并合并：
  // 中途不再有 await，因此不会与并发的 AI 写回互相覆盖。
  // 客户端只应提交变更的字段（局部补丁），未提交的字段保持最新值。
  let updated = StorageService.updateProject(id, (latest) => ({
    ...latest,
    ...body,
    id,
  }));

  if (!updated && (body as any)?.guestName) {
    updated = StorageService.saveProject({
      ...(body as any),
      id,
    });
  }

  if (!updated) {
    return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deleted = StorageService.deleteProject(id);
  return NextResponse.json({ success: deleted });
}
