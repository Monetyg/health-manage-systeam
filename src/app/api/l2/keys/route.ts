import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConnect } from "@/lib/db";
import { CardKey, User } from "@/lib/models";
import { readToken } from "@/lib/auth";
import { genKeyCode } from "@/lib/biz";

/**
 * 校验二级身份：token有效 + 账号仍存在（被一级删除后立刻失效）。
 */
async function needL2() {
  const token = (await cookies()).get("token")?.value;
  if (!token) return null;
  try {
    const me = await readToken<{ uid: string; role: string; username: string }>(token);
    if (me.role !== "L2") return null;
    const u = await User.findById(me.uid);
    if (!u || u.status === "disabled") return null;
    return { username: u.username };
  } catch { return null; }
}

/**
 * 二级单张生成卡密。
 */
export async function POST(req: Request) {
  await dbConnect();
  const me = await needL2();
  if (!me) return NextResponse.json({ error: "deleted", deleted: true }, { status: 401 });
  const { type } = await req.json();
  const code = genKeyCode();
  const k = await CardKey.create({ code, type: type || "DAY_1", status: "unused", createdByL2: me.username });
  return NextResponse.json({ code: k.code, type: k.type });
}

/**
 * 卡密列表（自己发的）。
 */
export async function GET(req: Request) {
  await dbConnect();
  const me = await needL2();
  if (!me) return NextResponse.json({ error: "deleted", deleted: true }, { status: 401 });
  const list = await CardKey.find({ createdByL2: me.username }).sort({ createdAt: -1 }).limit(100);
  return NextResponse.json(list);
}
