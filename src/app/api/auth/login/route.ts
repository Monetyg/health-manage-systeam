import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { getDb } from "@/lib/cloudbase";
import { COLL, type UserDoc } from "@/lib/models";
import { verifyPwd, signUser } from "@/lib/auth";

/**
 * L1/L2 登录.
 */
export async function POST(req: Request) {
  try {
    await dbConnect();
    const { username, password } = await req.json();
    const db = getDb();
    const u = (await db.collection(COLL.User).where({ username: String(username || "").trim() }).limit(1).get()).data[0] as unknown as UserDoc | undefined ?? null;
    if (!u || !(await verifyPwd(password, u.passwordHash))) {
      return NextResponse.json({ error: "账号或密码错误" }, { status: 401 });
    }
    if (u.status === "disabled") {
      return NextResponse.json({ error: "账号已禁用", disabled: true }, { status: 403 });
    }
    const token = await signUser({ uid: String(u._id), role: u.role, username: u.username });
    const res = NextResponse.json({ role: u.role, username: u.username });
    res.cookies.set("token", token, { httpOnly: true, maxAge: 7 * 86400, path: "/" });
    return res;
  } catch (e) {
    console.error("login failed:", e);
    return NextResponse.json({ error: "服务端异常：" + String((e as Error)?.message || e) }, { status: 500 });
  }
}
