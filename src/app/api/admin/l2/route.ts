import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { User, CardKey } from "@/lib/models";
import { hashPwd } from "@/lib/auth";

/**
 * 一级单人使用，免登录：直接视为一级身份。
 * 注意：知道地址的人都能打开，请勿外传，上线建议加IP白名单。
 */
async function needL1() {
  return { role: "L1", username: "admin" };
}

/**
 * 一级查看自己创建的二级账号：账号/密码/创建时间/已创建天数。
 */
export async function GET() {
  await dbConnect();
  const me = await needL1();
  if (!me) return NextResponse.json({ error: "无权限：一级专用" }, { status: 403 });
  const list = await User.find({ role: "L2" }).sort({ createdAt: -1 }).lean();
  const now = Date.now();
  return NextResponse.json(list.map((u: any) => ({
    id: String(u._id),
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
  await dbConnect();
  const me = await needL1();
  if (!me) return NextResponse.json({ error: "无权限：一级专用" }, { status: 403 });
  const { username, password } = await req.json();
  if (!username?.trim() || !password || password.length < 6) {
    return NextResponse.json({ error: "账号必填，密码至少6位" }, { status: 400 });
  }
  if (await User.findOne({ username: username.trim() })) {
    return NextResponse.json({ error: "账号已存在" }, { status: 400 });
  }
  await User.create({ username: username.trim(), passwordHash: await hashPwd(password), plainPwd: password, role: "L2", createdBy: me.username });
  return NextResponse.json({ ok: true });
}

/**
 * 一级切换二级启用/禁用（已发出的卡密不受影响，账号立刻踢下线）。
 */
export async function PATCH(req: Request) {
  await dbConnect();
  const me = await needL1();
  if (!me) return NextResponse.json({ error: "无权限：一级专用" }, { status: 403 });
  const { id } = await req.json();
  const u = await User.findOne({ _id: id, role: "L2" });
  if (!u) return NextResponse.json({ error: "账号不存在" }, { status: 404 });
  u.status = u.status === "disabled" ? "ok" : "disabled";
  await u.save();
  return NextResponse.json({ ok: true, status: u.status });
}
export async function DELETE(req: Request) {
  await dbConnect();
  const me = await needL1();
  if (!me) return NextResponse.json({ error: "无权限：一级专用" }, { status: 403 });
  const id = new URL(req.url).searchParams.get("id");
  const u = await User.findOne({ _id: id, role: "L2" });
  if (!u) return NextResponse.json({ error: "账号不存在" }, { status: 404 });
  await CardKey.updateMany({ createdByL2: u.username, status: "unused" }, { status: "revoked" });
  await User.deleteOne({ _id: id });
  return NextResponse.json({ ok: true });
}
