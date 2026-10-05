import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import COS from "cos-nodejs-sdk-v5";
import { cosConfig, uploadDir } from "@/lib/config";

/**
 * 图片上传：配了COS环境变量就直传COS（生产），没配就落服务本地 UPLOAD_DIR。
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

    const cos = cosConfig();
    if (cos) {
      const sdk = new COS({ SecretId: cos.secretId, SecretKey: cos.secretKey });
      await sdk.putObject({ Bucket: cos.bucket, Region: cos.region, Key: key, Body: buf, ContentType: "image/jpeg", ACL: "public-read" });
      return NextResponse.json({ url: `https://${cos.bucket}.cos.${cos.region}.myqcloud.com/${key}` });
    }

    // 未配COS：落本地（部署时把 UPLOAD_DIR 指到项目外的固定目录，避免重新发布被覆盖）
    const dir = uploadDir();
    await mkdir(dir, { recursive: true });
    const name = key.split("/").pop()!;
    await writeFile(path.join(dir, name), buf);
    return NextResponse.json({ url: `/api/img/${name}` });
  } catch (e) {
    return NextResponse.json({ error: "上传失败：" + String((e as Error)?.message || e) }, { status: 500 });
  }
}
