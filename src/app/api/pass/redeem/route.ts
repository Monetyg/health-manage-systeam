import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { findCardKeyByCode, markCardKeyExpired, markCardKeyUsed } from "@/lib/repo";
import { signPass } from "@/lib/auth";
import { durationMs } from "@/lib/biz";

/**
 * 三级卡密登录：兑换有效期窗口。
 */
export async function POST(req: Request) {
  await dbConnect();
  const { code } = await req.json();
  const k = await findCardKeyByCode(String(code || ""));
  if (!k) return NextResponse.json({ error: "卡密不存在" }, { status: 404 });
  if (k.status === "revoked") return NextResponse.json({ error: "卡密已作废" }, { status: 403 });
  let expireAt = k.expireAt ? new Date(k.expireAt) : null;
  if (k.status === "unused") {
    expireAt = new Date(Date.now() + durationMs(k.type));
    await markCardKeyUsed(k.id, expireAt);
  }
  if (expireAt && expireAt < new Date()) {
    await markCardKeyExpired(k.id);
    return NextResponse.json({ error: "卡密已过期" }, { status: 403 });
  }
  const token = await signPass({ kind: "pass", code: k.code, by: k.createdByL2 }, expireAt as unknown as Date);
  const res = NextResponse.json({ expireAt, type: k.type });
  const maxAge = Math.max(60, Math.floor(((expireAt as Date).getTime() - Date.now()) / 1000));
  res.cookies.set("pass", token, { httpOnly: true, path: "/", maxAge });
  return res;
}
