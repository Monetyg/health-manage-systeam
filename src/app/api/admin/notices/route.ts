import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminPassword } from "@/lib/config";
import { createNotice, deleteNotice, updateNotice } from "@/lib/repo";

/**
 * 一级鉴权：与 /api/admin/l2 同规则，配了ADMIN_PASSWORD（生产）必须过密码门；
 * 没配（本机开发）直接视为一级身份。
 */
async function needL1() {
  const need = adminPassword();
  if (!need) return { role: "L1", username: "admin" };
  const token = (await cookies()).get("admin_ok")?.value;
  return token === "1" ? { role: "L1", username: "admin" } : null;
}

function fmt(n: { id: number; content: string; createdBy: string; createdAt: Date; updatedAt: Date }) {
  return { id: String(n.id), content: n.content, createdAt: n.createdAt, updatedAt: n.updatedAt };
}

/**
 * 一级发布公告：内容必填，不限字数。
 */
export async function POST(req: Request) {
  const me = await needL1();
  if (!me) return NextResponse.json({ error: "无权限：一级专用" }, { status: 403 });
  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "公告内容不能为空" }, { status: 400 });
  const row = await createNotice(content.trim(), me.username);
  return NextResponse.json(fmt(row));
}

/**
 * 一级修改公告内容。
 */
export async function PATCH(req: Request) {
  const me = await needL1();
  if (!me) return NextResponse.json({ error: "无权限：一级专用" }, { status: 403 });
  const { id, content } = await req.json();
  if (!id || !content?.trim()) return NextResponse.json({ error: "参数不完整" }, { status: 400 });
  const ok = await updateNotice(Number(id), content.trim());
  if (!ok) return NextResponse.json({ error: "公告不存在" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

/**
 * 一级删除公告。
 */
export async function DELETE(req: Request) {
  const me = await needL1();
  if (!me) return NextResponse.json({ error: "无权限：一级专用" }, { status: 403 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "参数不完整" }, { status: 400 });
  const ok = await deleteNotice(Number(id));
  if (!ok) return NextResponse.json({ error: "公告不存在" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
