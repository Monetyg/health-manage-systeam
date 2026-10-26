import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConnect } from "@/lib/db";
import { bindCardKeyDevice, findCardKeyByCode, markCardKeyExpired, markCardKeyUsed } from "@/lib/repo";
import { signPass } from "@/lib/auth";
import { durationMs } from "@/lib/biz";
import crypto from "node:crypto";

const DEV_COOKIE = "dev";
/** 设备标识保留 5 年：清了浏览器 cookie 就等于换设备，卡密会锁死（业务上接受） */
const DEV_MAX_AGE = 5 * 365 * 24 * 3600;

/**
 * 三级卡密登录：兑换有效期窗口。
 * 一张卡密只允许一台设备：首次登录绑定设备标识，之后换设备直接拒绝。
 */
export async function POST(req: Request) {
  await dbConnect();
  const c = await cookies();
  const { code } = await req.json();
  const k = await findCardKeyByCode(String(code || ""));
  if (!k) return NextResponse.json({ error: "卡密不存在" }, { status: 404 });
  if (k.status === "revoked") return NextResponse.json({ error: "卡密已作废" }, { status: 403 });

  let dev = c.get(DEV_COOKIE)?.value || "";
  const isNewDevice = !dev;
  if (isNewDevice) dev = crypto.randomBytes(16).toString("hex");

  let expireAt = k.expireAt ? new Date(k.expireAt) : null;
  if (k.status === "unused") {
    expireAt = new Date(Date.now() + durationMs(k.type));
    await markCardKeyUsed(k.id, expireAt);
  }
  /** 先判过期再判设备：过期卡密报“已过期”，别让人误以为是设备问题 */
  if (expireAt && expireAt < new Date()) {
    await markCardKeyExpired(k.id);
    return NextResponse.json({ error: "卡密已过期，请用新卡密", code: "EXPIRED" }, { status: 403 });
  }
  if (k.boundDevice && k.boundDevice !== dev) {
    return NextResponse.json({ error: "该卡密已在其他设备登录", code: "DEVICE" }, { status: 403 });
  }
  if (!k.boundDevice) await bindCardKeyDevice(k.id, dev);

  const token = await signPass({ kind: "pass", code: k.code, by: k.createdByL2 }, expireAt as unknown as Date);
  const res = NextResponse.json({ expireAt, type: k.type });
  const maxAge = Math.max(60, Math.floor(((expireAt as Date).getTime() - Date.now()) / 1000));
  res.cookies.set("pass", token, { httpOnly: true, path: "/", maxAge });
  res.cookies.set(DEV_COOKIE, dev, { httpOnly: true, path: "/", maxAge: DEV_MAX_AGE });
  return res;
}
