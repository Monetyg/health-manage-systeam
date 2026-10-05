import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readToken } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { findCardKeyByCode, markCardKeyExpired } from "@/lib/repo";

/**
 * 三级登录态查询：卡密有效期内刷新页面不用重输卡密。
 */
export async function GET() {
  const pass = (await cookies()).get("pass")?.value;
  if (!pass) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    const p = await readToken<{ code: string; exp: number }>(pass);
    await dbConnect();
    const k = await findCardKeyByCode(p.code);
    if (!k || k.status === "revoked") return NextResponse.json({ error: "卡密已作废" }, { status: 401 });
    const exp = k.expireAt ? new Date(k.expireAt) : null;
    if (exp && exp < new Date()) {
      await markCardKeyExpired(k.id);
      return NextResponse.json({ error: "卡密已过期" }, { status: 401 });
    }
    return NextResponse.json({ expireAt: k.expireAt, type: k.type });
  } catch {
    return NextResponse.json({ error: "卡密已过期" }, { status: 401 });
  }
}
