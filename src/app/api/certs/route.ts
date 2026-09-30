import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import QRCode from "qrcode";
import { dbConnect } from "@/lib/db";
import { getDb } from "@/lib/cloudbase";
import { COLL, type UserDoc, type RegionUnitDoc } from "@/lib/models";
import { readToken } from "@/lib/auth";
import { checkIdCard, genderOf, maskId } from "@/lib/biz";

/** 转义正则特殊字符：地区名含.*等符号时防止查错库 */
function esc(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** 北京时间今天（UTC+8）：避免0-8点编号/体检日期差一天 */
function bjDay() {
  return new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10);
}

/**
 * 办证：L1/L2无限制直办；三级需pass且在有效期内.
 */
export async function POST(req: Request) {
  await dbConnect();
  const db = getDb();
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
    try {
      const me = await readToken<{ uid: string; username: string }>(token);
      let u: UserDoc | null = null;
      try {
        u = (await db.collection(COLL.User).doc(String(me.uid)).get()).data[0] as unknown as UserDoc | undefined ?? null;
      } catch {
        u = null;
      }
      if (!u || u.status === "disabled") {
        return NextResponse.json({ error: "账号已禁用", disabled: true }, { status: 403 });
      }
      createdBy = u.username as string;
    } catch {
      return NextResponse.json({ error: "登录已过期，请重新登录" }, { status: 401 });
    }
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

  const map = (await db.collection(COLL.RegionUnit).where({ regionKeyword: db.RegExp({ regexp: esc(region.trim()), options: "i" }) }).limit(1).get()).data[0] as unknown as RegionUnitDoc | undefined;
  const prov = (province || "").trim() || "广东省";
  const unitName = (map?.unitName as string) || region.trim() + "市第一人民医院";
  const code2 = (map?.regionCode as string) || "SZ";
  const day = bjDay().replace(/-/g, "");
  const examDate = bjDay();
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
  /** 并发两人同时办证会撞号：撞了就重试，最多3次 */
  let certNo = "";
  let ok = false;
  for (let i = 0; i < 3 && !ok; i++) {
    const total = (await db.collection(COLL.Cert).where({ certNo: db.RegExp({ regexp: "^" + code2 + day }) }).count()).total ?? 0;
    certNo = `${code2}${day}${String(total + 1).padStart(4, "0")}`;
    try {
      await db.collection(COLL.Cert).add({
        certNo, name, idCardMask: maskId(idCard), gender: genderOf(idCard),
        province: prov, region, unitName, organ, age, template: tpl,
        photoUrl: photoUrl || "", examDate,
        verifyExpireAt: new Date(Date.now() + 3 * 86400e3), createdBy,
        createdAt: db.serverDate(), updatedAt: db.serverDate(),
      });
      ok = true;
    } catch {
      ok = false;
    }
  }
  if (!ok) return NextResponse.json({ error: "编号冲突，请重试" }, { status: 500 });

  const domain = process.env.DOMAIN || "http://localhost:3000";
  const qrDataUrl = await QRCode.toDataURL(`${domain}/verify/${certNo}`);
  return NextResponse.json({ certNo, qr: qrDataUrl, unitName, province: prov, gender: genderOf(idCard), mask: maskId(idCard), age, organ, from: examDate, to, template: tpl });
}
