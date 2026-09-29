import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/**
 * 读盘直出上传图片：每次请求都读磁盘，不受 next start 静态快照影响，
 * 服务运行中新上传的照片也能立刻访问。
 */
export async function GET(_: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!/^[A-Za-z0-9][\w.-]{0,60}\.(jpg|jpeg|png|webp)$/i.test(name)) {
    return NextResponse.json({ error: "非法文件名" }, { status: 400 });
  }
  try {
    const buf = await readFile(path.join(process.cwd(), "public", "uploads", name));
    const ext = name.split(".").pop()!.toLowerCase();
    return new NextResponse(new Uint8Array(buf), {
      headers: { "Content-Type": TYPES[ext] || "image/jpeg", "Cache-Control": "public, max-age=31536000" },
    });
  } catch {
    return NextResponse.json({ error: "图片不存在" }, { status: 404 });
  }
}
