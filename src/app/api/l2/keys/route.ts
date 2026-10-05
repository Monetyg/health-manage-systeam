import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConnect } from "@/lib/db";
import { createCardKey, findUserById, listCardKeysByL2 } from "@/lib/repo";
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
    const u = await findUserById(me.uid);
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
  const t = String(type || "DAY_1");
  await createCardKey({ code, type: t, createdByL2: me.username });
  return NextResponse.json({ code, type: t });
}

/**
 * 卡密列表（自己发的，最多100条）。
 */
export async function GET() {
  await dbConnect();
  const me = await needL2();
  if (!me) return NextResponse.json({ error: "deleted", deleted: true }, { status: 401 });
  const list = await listCardKeysByL2(me.username);
  return NextResponse.json(list.map((k) => ({ _id: String(k.id), code: k.code, type: k.type, status: k.status, createdAt: k.createdAt })));
}
