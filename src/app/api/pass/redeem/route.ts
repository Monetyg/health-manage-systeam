import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { CardKey } from "@/lib/models";
import { signPass } from "@/lib/auth";
import { durationMs } from "@/lib/biz";

/**
 * 三级卡密登录：兑换有效期窗口。
 */
export async function POST(req: Request) {
  await dbConnect();
  const { code } = await req.json();
  const k = await CardKey.findOne({ code: String(code || "").trim().toUpperCase() });
  if (!k) return NextResponse.json({ error: "卡密不存在" }, { status: 404 });
  if (k.status === "revoked") return NextResponse.json({ error: "卡密已作废" }, { status: 403 });
  if (k.status === "unused") {
    k.status = "used";
    k.usedAt = new Date();
    k.expireAt = new Date(Date.now() + durationMs(k.type));
    await k.save();
  }
  if (k.expireAt && k.expireAt < new Date()) {
    k.status = "expired";
    await k.save();
    return NextResponse.json({ error: "卡密已过期" }, { status: 403 });
  }
  const token = await signPass({ kind: "pass", code: k.code, by: k.createdByL2 }, k.expireAt);
  const res = NextResponse.json({ expireAt: k.expireAt, type: k.type });
  const maxAge = Math.max(60, Math.floor(((k.expireAt as Date).getTime() - Date.now()) / 1000));
  res.cookies.set("pass", token, { httpOnly: true, path: "/", maxAge });
  return res;
}
