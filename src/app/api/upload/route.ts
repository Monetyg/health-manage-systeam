import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

/**
 * 本地图片上传：接收 multipart file，存 public/uploads，返回可访问URL。
 * （部署CloudBase后可换成COS直传，前端不用改字段名 photo。）
 */
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const f = form.get("photo") as File | null;
    if (!f) return NextResponse.json({ error: "请选择图片" }, { status: 400 });
    if (f.size > 5 * 1024 * 1024) return NextResponse.json({ error: "图片超过5MB" }, { status: 400 });
    const ext = (f.name.split(".").pop() || "jpg").toLowerCase().slice(0, 4);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const buf = Buffer.from(await f.arrayBuffer());
    await writeFile(path.join(dir, name), buf);
    return NextResponse.json({ url: `/api/img/${name}` });
  } catch (e) {
    return NextResponse.json({ error: "上传失败：" + String((e as Error)?.message || e) }, { status: 500 });
  }
}
