import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminPassword } from "@/lib/config";
import { l2Stats } from "@/lib/repo";

/**
 * 一级鉴权：与 /api/admin/l2 同规则。
 */
async function needL1() {
  const need = adminPassword();
  if (!need) return { role: "L1", username: "admin" };
  const token = (await cookies()).get("admin_ok")?.value;
  return token === "1" ? { role: "L1", username: "admin" } : null;
}

/**
 * 一级看板：每个二级的累计卡密 / 已使用 / 办出健康证数。
 */
export async function GET() {
  const me = await needL1();
  if (!me) return NextResponse.json({ error: "无权限：一级专用" }, { status: 403 });
  return NextResponse.json(await l2Stats());
}
