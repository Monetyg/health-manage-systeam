import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConnect } from "@/lib/db";
import { getDb } from "@/lib/cloudbase";
import { COLL, type UserDoc, type CardKeyDoc } from "@/lib/models";
import { readToken } from "@/lib/auth";
import { genKeyCode } from "@/lib/biz";

/**
 * 校验二级身份：token有效 + 账号仍存在（被一级删除后立刻失效）.
 */
async function needL2() {
  const token = (await cookies()).get("token")?.value;
  if (!token) return null;
  try {
    const me = await readToken<{ uid: string; role: string; username: string }>(token);
    if (me.role !== "L2") return null;
    const db = getDb();
    let u: UserDoc | null = null;
    try {
      u = (await db.collection(COLL.User).doc(String(me.uid)).get()).data[0] as unknown as UserDoc | undefined ?? null;
    } catch {
      return null;
    }
    if (!u || u.status === "disabled") return null;
    return { username: u.username as string };
  } catch { return null; }
}

/**
 * 二级单张生成卡密.
 */
export async function POST(req: Request) {
  await dbConnect();
  const me = await needL2();
  if (!me) return NextResponse.json({ error: "deleted", deleted: true }, { status: 401 });
  const { type } = await req.json();
  const db = getDb();
  const code = genKeyCode();
  const t = (type || "DAY_1") as CardKeyDoc["type"];
  await db.collection(COLL.CardKey).add({ code, type: t, status: "unused", createdByL2: me.username, createdAt: db.serverDate(), updatedAt: db.serverDate() });
  return NextResponse.json({ code, type: t });
}

/**
 * 卡密列表（自己发的）.
 */
export async function GET() {
  await dbConnect();
  const me = await needL2();
  if (!me) return NextResponse.json({ error: "deleted", deleted: true }, { status: 401 });
  const db = getDb();
  const list = (await db.collection(COLL.CardKey).where({ createdByL2: me.username }).orderBy("createdAt", "desc").limit(100).get()).data;
  return NextResponse.json(list);
}
