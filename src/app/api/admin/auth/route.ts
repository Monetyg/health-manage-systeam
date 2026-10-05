import { NextResponse } from "next/server";
import { adminPassword } from "@/lib/config";

/**
 * 一级门禁密码：与 ADMIN_PASSWORD 比对，通过写httpOnly cookie，有效7天。
 * 没配 ADMIN_PASSWORD（本机开发）直接放行。
 */
export async function POST(req: Request) {
  const need = adminPassword();
  if (!need) return NextResponse.json({ ok: true, dev: true });
  const { password } = await req.json().catch(() => ({}));
  if (password !== need) return NextResponse.json({ error: "密码错误" }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_ok", "1", { httpOnly: true, maxAge: 7 * 86400, path: "/" });
  return res;
}
