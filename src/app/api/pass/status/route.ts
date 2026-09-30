import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readToken } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { getDb } from "@/lib/cloudbase";
import { COLL, type CardKeyDoc } from "@/lib/models";

/**
 * 三级登录态查询：卡密有效期内刷新页面不用重输卡密.
 */
export async function GET() {
  const pass = (await cookies()).get("pass")?.value;
  if (!pass) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    const p = await readToken<{ code: string; exp: number }>(pass);
    await dbConnect();
    const db = getDb();
    const k = (await db.collection(COLL.CardKey).where({ code: p.code }).limit(1).get()).data[0] as unknown as CardKeyDoc | undefined ?? null;
    if (!k || k.status === "revoked") return NextResponse.json({ error: "卡密已作废" }, { status: 401 });
    const exp = k.expireAt ? new Date(k.expireAt as unknown as string) : null;
    if (exp && exp < new Date()) {
      await db.collection(COLL.CardKey).doc(String(k._id)).update({ status: "expired", updatedAt: db.serverDate() });
      return NextResponse.json({ error: "卡密已过期" }, { status: 401 });
    }
    return NextResponse.json({ expireAt: k.expireAt, type: k.type });
  } catch {
    return NextResponse.json({ error: "卡密已过期" }, { status: 401 });
  }
}
