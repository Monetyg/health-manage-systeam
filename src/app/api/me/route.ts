import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readToken } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { findUserById } from "@/lib/repo";

/**
 * 当前登录人信息：顺带查库，被一级删除的账号视为失效。
 */
export async function GET() {
  const token = (await cookies()).get("token")?.value;
  if (!token) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    const me = await readToken<{ uid: string; role: string; username: string }>(token);
    await dbConnect();
    const u = await findUserById(me.uid);
    if (!u) return NextResponse.json({ error: "deleted", deleted: true }, { status: 401 });
    if (u.status === "disabled") return NextResponse.json({ error: "disabled", disabled: true }, { status: 401 });
    return NextResponse.json({ role: u.role, username: u.username });
  } catch {
    return NextResponse.json({ error: "登录已过期" }, { status: 401 });
  }
}
