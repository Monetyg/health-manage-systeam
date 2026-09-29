import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import QRCode from "qrcode";
import { dbConnect } from "@/lib/db";
import { Cert, RegionUnit } from "@/lib/models";
import { readToken } from "@/lib/auth";
import { checkIdCard, genderOf, maskId } from "@/lib/biz";

/**
 * 办证：L1/L2无限制直办；三级需pass且在有效期内。
 * 简化版：照片传URL（先填任意图床/本地名），后接云存储。
 */
export async function POST(req: Request) {
  await dbConnect();
  const c = await cookies();
  const body = await req.json();
  const { name, idCard, province, region, photoUrl, template } = body;
  if (!name || !checkIdCard(idCard || "") || !region) {
    return NextResponse.json({ error: "姓名/身份证(18位)/地区必填" }, { status: 400 });
  }
  let createdBy = "L1/L2";
  const pass = c.get("pass")?.value;
  const token = c.get("token")?.value;
  if (token) {
    const me = await readToken<{ username: string }>(token);
    createdBy = me.username;
  } else if (pass) {
    try {
      const p = await readToken<{ code: string }>(pass);
      createdBy = "PASS:" + p.code;
    } catch {
      return NextResponse.json({ error: "卡密已过期，请用新卡密登录" }, { status: 403 });
    }
  } else {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const map = await RegionUnit.findOne({ regionKeyword: new RegExp(region.trim()) });
  const prov = (province || "").trim() || "广东省";
  const unitName = map?.unitName || region.trim() + "市第一人民医院";
  const code2 = map?.regionCode || "SZ";
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const count = await Cert.countDocuments({ certNo: new RegExp(`^${code2}${day}`) });
  const certNo = `${code2}${day}${String(count + 1).padStart(4, "0")}`;

  const domain = process.env.DOMAIN || "http://localhost:3000";
  const qrDataUrl = await QRCode.toDataURL(`${domain}/verify/${certNo}`);
  const examDate = new Date().toISOString().slice(0, 10);
  /** 年龄：身份证7-14位出生日期算周岁，算不出填-- */
  let age = "--";
  const m = /^(\d{4})(\d{2})(\d{2})$/.exec(idCard.slice(6, 14));
  if (m) {
    const bd = new Date(`${m[1]}-${m[2]}-${m[3]}`);
    if (!isNaN(bd.getTime())) {
      const now = new Date();
      let a = now.getFullYear() - bd.getFullYear();
      if (now.getMonth() + 1 < bd.getMonth() + 1 || (now.getMonth() + 1 === bd.getMonth() + 1 && now.getDate() < bd.getDate())) a--;
      age = String(a);
    }
  }
  const organ = region.trim() + "市疾病预防控制中心";
  const to = new Date(new Date(examDate).getTime() + 365 * 86400e3).toISOString().slice(0, 10);
  const tpl = template === "e" ? "e" : "gd";
  const cert = await Cert.create({
    certNo, name, idCardMask: maskId(idCard), gender: genderOf(idCard),
    province: prov, region, unitName, organ, age, template: tpl,
    photoUrl: photoUrl || "", examDate,
    verifyExpireAt: new Date(Date.now() + 3 * 86400e3), createdBy,
  });
  return NextResponse.json({ certNo, qr: qrDataUrl, unitName, province: prov, gender: genderOf(idCard), mask: maskId(idCard), age, organ, from: examDate, to, template: tpl });
}
