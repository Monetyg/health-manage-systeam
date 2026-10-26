import { NextResponse } from "next/server";

/** 三级退出登录：清掉卡密登录态，回到卡密输入框 */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("pass", "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
