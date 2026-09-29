import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readToken } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { CardKey } from "@/lib/models";

/**
 * 三级登录态查询：卡密有效期内刷新页面不用重输卡密；
 * 过期/被作废则401，前端自动退回登录。
 */
export async function GET() {
  const pass = (await cookies()).get("pass")?.value;
  if (!pass) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    const p = await readToken<{ code: string; exp: number }>(pass);
    await dbConnect();
    const k = await CardKey.findOne({ code: p.code });
    if (!k || k.status === "revoked") return NextResponse.json({ error: "卡密已作废" }, { status: 401 });
    if (k.expireAt && k.expireAt < new Date()) {
      k.status = "expired";
      await k.save();
      return NextResponse.json({ error: "卡密已过期" }, { status: 401 });
    }
    return NextResponse.json({ expireAt: k.expireAt, type: k.type });
  } catch {
    return NextResponse.json({ error: "卡密已过期" }, { status: 401 });
  }
}
