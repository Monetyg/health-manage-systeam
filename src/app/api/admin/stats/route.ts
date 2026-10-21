import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminPassword } from "@/lib/config";
import { l2Stats } from "@/lib/repo";

/** 一级鉴权：与 /api/admin/l2 同规则 */
async function needL1() {
  const need = adminPassword();
  if (!need) return { role: "L1", username: "admin" };
  const token = (await cookies()).get("admin_ok")?.value;
  return token === "1" ? { role: "L1", username: "admin" } : null;
}

/** 一级看板：range=all 累计 / 1d 最近24小时 / 3d 最近72小时 */
export async function GET(req: Request) {
  const me = await needL1();
  if (!me) return NextResponse.json({ error: "无权限：一级专用" }, { status: 403 });
  const range = new URL(req.url).searchParams.get("range") || "all";
  const hours = range === "1d" ? 24 : range === "3d" ? 72 : 0;
  const since = hours > 0 ? new Date(Date.now() - hours * 3600e3) : undefined;
  return NextResponse.json(await l2Stats(since));
}
