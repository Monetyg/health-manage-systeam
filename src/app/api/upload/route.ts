import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import COS from "cos-nodejs-sdk-v5";

/**
 * 图片上传：配了COS环境变量就直传COS（生产），没配就落本机public/uploads（本机开发）。
 * 返回的URL前端直接用，不用改别的代码。
 */
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const f = form.get("photo") as File | null;
    if (!f) return NextResponse.json({ error: "请选择图片" }, { status: 400 });
    if (f.size > 5 * 1024 * 1024) return NextResponse.json({ error: "图片超过5MB" }, { status: 400 });
    const buf = Buffer.from(await f.arrayBuffer());
    const key = `photos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;

    const { COS_SECRET_ID, COS_SECRET_KEY, COS_BUCKET, COS_REGION } = process.env;
    if (COS_SECRET_ID && COS_SECRET_KEY && COS_BUCKET && COS_REGION) {
      const cos = new COS({ SecretId: COS_SECRET_ID, SecretKey: COS_SECRET_KEY });
      await cos.putObject({ Bucket: COS_BUCKET, Region: COS_REGION, Key: key, Body: buf, ContentType: "image/jpeg", ACL: "public-read" });
      return NextResponse.json({ url: `https://${COS_BUCKET}.cos.${COS_REGION}.myqcloud.com/${key}` });
    }

    // 本机开发兜底：落盘（云托管生产环境勿用，容器重启会丢）
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const name = key.split("/").pop()!;
    await writeFile(path.join(dir, name), buf);
    return NextResponse.json({ url: `/api/img/${name}` });
  } catch (e) {
    return NextResponse.json({ error: "上传失败：" + String((e as Error)?.message || e) }, { status: 500 });
  }
}
