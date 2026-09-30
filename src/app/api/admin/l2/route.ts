import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConnect } from "@/lib/db";
import { getDb } from "@/lib/cloudbase";
import { COLL, type UserDoc } from "@/lib/models";
import { hashPwd } from "@/lib/auth";

/**
 * 一级鉴权：配了ADMIN_PASSWORD（生产）必须过密码门；
 * 没配（本机开发）直接视为一级身份.
 */
async function needL1() {
  const need = process.env.ADMIN_PASSWORD;
  if (!need) return { role: "L1", username: "admin" };
  const token = (await cookies()).get("admin_ok")?.value;
  return token === "1" ? { role: "L1", username: "admin" } : null;
}

/**
 * 一级查看自己创建的二级账号.
 */
export async function GET() {
  await dbConnect();
  const me = await needL1();
  if (!me) return NextResponse.json({ error: "无权限：一级专用" }, { status: 403 });
  const db = getDb();
  const list = (await db.collection(COLL.User).where({ role: "L2" }).orderBy("createdAt", "desc").get()).data as unknown as UserDoc[];
  const now = Date.now();
  return NextResponse.json(list.map((u) => ({
    id: String(u._id),
    username: u.username,
    password: (u.plainPwd as string) || "（老账号需重置后可见）",
    status: u.status === "disabled" ? "disabled" : "ok",
    createdAt: u.createdAt,
    days: Math.floor((now - new Date(u.createdAt as unknown as string).getTime()) / 86400e3),
  })));
}

/**
 * 一级发放二级账号：直接定账号+密码.
 */
export async function POST(req: Request) {
  await dbConnect();
  const me = await needL1();
  if (!me) return NextResponse.json({ error: "无权限：一级专用" }, { status: 403 });
  const { username, password } = await req.json();
  if (!username?.trim() || !password || password.length < 6) {
    return NextResponse.json({ error: "账号必填，密码至少6位" }, { status: 400 });
  }
  const db = getDb();
  const existed = (await db.collection(COLL.User).where({ username: username.trim() }).limit(1).get()).data[0];
  if (existed) {
    return NextResponse.json({ error: "账号已存在" }, { status: 400 });
  }
  await db.collection(COLL.User).add({ username: username.trim(), passwordHash: await hashPwd(password), plainPwd: password, role: "L2", status: "ok", createdBy: me.username, createdAt: db.serverDate(), updatedAt: db.serverDate() });
  return NextResponse.json({ ok: true });
}

/**
 * 一级切换二级启用/禁用.
 */
export async function PATCH(req: Request) {
  await dbConnect();
  const me = await needL1();
  if (!me) return NextResponse.json({ error: "无权限：一级专用" }, { status: 403 });
  const { id } = await req.json();
  const db = getDb();
  let u: UserDoc | null = null;
  try {
    u = (await db.collection(COLL.User).doc(String(id)).get()).data[0] as unknown as UserDoc | undefined ?? null;
  } catch {
    u = null;
  }
  if (!u || u.role !== "L2") return NextResponse.json({ error: "账号不存在" }, { status: 404 });
  const next = u.status === "disabled" ? "ok" : "disabled";
  await db.collection(COLL.User).doc(String(id)).update({ status: next, updatedAt: db.serverDate() });
  return NextResponse.json({ ok: true, status: next });
}

export async function DELETE(req: Request) {
  await dbConnect();
  const me = await needL1();
  if (!me) return NextResponse.json({ error: "无权限：一级专用" }, { status: 403 });
  const id = new URL(req.url).searchParams.get("id");
  const db = getDb();
  let u: UserDoc | null = null;
  try {
    u = (await db.collection(COLL.User).doc(String(id)).get()).data[0] as unknown as UserDoc | undefined ?? null;
  } catch {
    u = null;
  }
  if (!u || u.role !== "L2") return NextResponse.json({ error: "账号不存在" }, { status: 404 });
  await db.collection(COLL.CardKey).where({ createdByL2: u.username as string, status: "unused" }).update({ status: "revoked" });
  await db.collection(COLL.User).doc(String(id)).remove();
  return NextResponse.json({ ok: true });
}
