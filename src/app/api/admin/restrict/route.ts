import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminPassword } from "@/lib/config";
import { toggleUserRestricted } from "@/lib/repo";

/** 一级鉴权：与 /api/admin/l2 同规则 */
async function needL1() {
  const need = adminPassword();
  if (!need) return { role: "L1", username: "admin" };
  const token = (await cookies()).get("admin_ok")?.value;
  return token === "1" ? { role: "L1", username: "admin" } : null;
}

/** 一级限制/解除限制二级账号办证 */
export async function POST(req: Request) {
  const me = await needL1();
  if (!me) return NextResponse.json({ error: "无权限：一级专用" }, { status: 403 });
  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "参数不完整" }, { status: 400 });
  const next = await toggleUserRestricted(id);
  if (next === null) return NextResponse.json({ error: "账号不存在" }, { status: 404 });
  return NextResponse.json({ ok: true, restricted: next });
}
