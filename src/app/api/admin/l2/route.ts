import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminPassword } from "@/lib/config";
import { createL2User, deleteL2User, findUserById, findUserByUsername, listL2Users, setUserStatus } from "@/lib/repo";
import { hashPwd } from "@/lib/auth";

/**
 * 一级鉴权：配了ADMIN_PASSWORD（生产）必须过密码门；
 * 没配（本机开发）直接视为一级身份。
 */
async function needL1() {
  const need = adminPassword();
  if (!need) return { role: "L1", username: "admin" };
  const token = (await cookies()).get("admin_ok")?.value;
  return token === "1" ? { role: "L1", username: "admin" } : null;
}

/**
 * 一级查看自己创建的二级账号。
 */
export async function GET() {
  const me = await needL1();
  if (!me) return NextResponse.json({ error: "无权限：一级专用" }, { status: 403 });
  const list = await listL2Users();
  const now = Date.now();
  return NextResponse.json(list.map((u) => ({
    id: String(u.id),
    username: u.username,
    password: u.plainPwd || "（老账号需重置后可见）",
    status: u.status === "disabled" ? "disabled" : "ok",
    createdAt: u.createdAt,
    days: Math.floor((now - new Date(u.createdAt).getTime()) / 86400e3),
  })));
}

/**
 * 一级发放二级账号：直接定账号+密码。
 */
export async function POST(req: Request) {
  const me = await needL1();
  if (!me) return NextResponse.json({ error: "无权限：一级专用" }, { status: 403 });
  const { username, password } = await req.json();
  if (!username?.trim() || !password || password.length < 6) {
    return NextResponse.json({ error: "账号必填，密码至少6位" }, { status: 400 });
  }
  const existed = await findUserByUsername(username.trim());
  if (existed) {
    return NextResponse.json({ error: "账号已存在" }, { status: 400 });
  }
  await createL2User({ username: username.trim(), passwordHash: await hashPwd(password), plainPwd: password, createdBy: me.username });
  return NextResponse.json({ ok: true });
}

/**
 * 一级切换二级启用/禁用。
 */
export async function PATCH(req: Request) {
  const me = await needL1();
  if (!me) return NextResponse.json({ error: "无权限：一级专用" }, { status: 403 });
  const { id } = await req.json();
  const u = await findUserById(id);
  if (!u || u.role !== "L2") return NextResponse.json({ error: "账号不存在" }, { status: 404 });
  const next = u.status === "disabled" ? "ok" : "disabled";
  await setUserStatus(u.id, next);
  return NextResponse.json({ ok: true, status: next });
}

/**
 * 一级删除二级账号：同时把它发出去还没用的卡密作废（在 repo 里一起做）。
 */
export async function DELETE(req: Request) {
  const me = await needL1();
  if (!me) return NextResponse.json({ error: "无权限：一级专用" }, { status: 403 });
  const id = new URL(req.url).searchParams.get("id");
  const u = await findUserById(id || "");
  if (!u || u.role !== "L2") return NextResponse.json({ error: "账号不存在" }, { status: 404 });
  await deleteL2User(u.id, u.username);
  return NextResponse.json({ ok: true });
}
