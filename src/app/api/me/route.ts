import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readToken } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { getDb } from "@/lib/cloudbase";
import { COLL, type UserDoc } from "@/lib/models";

/**
 * 当前登录人信息：顺带查库，被一级删除的账号视为失效.
 */
export async function GET() {
  const token = (await cookies()).get("token")?.value;
  if (!token) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    const me = await readToken<{ uid: string; role: string; username: string }>(token);
    await dbConnect();
    const db = getDb();
    let u: UserDoc | null = null;
    try {
      u = (await db.collection(COLL.User).doc(String(me.uid)).get()).data[0] as unknown as UserDoc | undefined ?? null;
    } catch {
      u = null;
    }
    if (!u) return NextResponse.json({ error: "deleted", deleted: true }, { status: 401 });
    if (u.status === "disabled") return NextResponse.json({ error: "disabled", disabled: true }, { status: 401 });
    return NextResponse.json({ role: u.role, username: u.username });
  } catch {
    return NextResponse.json({ error: "登录已过期" }, { status: 401 });
  }
}
