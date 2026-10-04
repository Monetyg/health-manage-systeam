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
 * 解析二维码写入的域名（按优先级）.
 * @param req 当前请求，用于从代理头还原公网域名
 * @returns 去掉末尾斜杠的 base URL
 */
function resolveDomain(req: Request): string {
  const h = req.headers;
  const forwardedHost = h.get("x-forwarded-host") || h.get("host") || "";
  const forwardedProto = (h.get("x-forwarded-proto") || "").split(",")[0].trim();
  if (forwardedHost && !/localhost|127\.0\.0\.1|192\.168\.|10\./.test(forwardedHost)) {
    const proto = forwardedProto === "http" ? "http" : "https";
    return `${proto}://${forwardedHost}`.replace(/\/+$/, "");
  }
  const envDomain = (process.env.DOMAIN || "").trim().replace(/\/+$/, "");
  if (envDomain && !/localhost|127\.0\.0\.1|192\.168\.0\.104/.test(envDomain)) return envDomain;
  if (forwardedHost) {
    const proto = forwardedProto || "http";
    return `${proto}://${forwardedHost}`.replace(/\/+$/, "");
  }
  return envDomain || "http://localhost:3000";
}
export async function POST(req: Request) {
  await dbConnect();
  const db = getDb();
  const c = await cookies();
  const body = await req.json();
  const { name, idCard, province, region, photoUrl, template } = body;
  /** 模板：gd 任意地区版 / e 直辖市版 / lz 兰州新区版（无需地区） */
  const tpl = template === "e" ? "e" : template === "lz" ? "lz" : "gd";
  if (!name || !checkIdCard(idCard || "") || (tpl !== "lz" && !region)) {
    return NextResponse.json({ error: tpl === "lz" ? "姓名/身份证(18位)必填" : "姓名/身份证(18位)/地区必填" }, { status: 400 });
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

  const map = tpl === "lz"
    ? undefined
    : (await db.collection(COLL.RegionUnit).where({ regionKeyword: db.RegExp({ regexp: esc((region || "").trim()), options: "i" }) }).limit(1).get()).data[0] as unknown as RegionUnitDoc | undefined;
  const prov = tpl === "gd" ? ((province || "").trim() || "广东省") : "";
  const unitName = tpl === "lz" ? "兰州新区教育和卫生健康委员会" : ((map?.unitName as string) || region.trim() + "市第一人民医院");
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
  const organ = tpl === "lz" ? "兰州新区教育和卫生健康委员会" : region.trim() + "市疾病预防控制中心";
  const to = new Date(new Date(examDate).getTime() + 365 * 86400e3).toISOString().slice(0, 10);
  /** 并发两人同时办证会撞号：撞了就重试，最多3次 */
  /** 编号：lz 用「年份+6位序号」的纯数字（对照样张），其余用 地区码+日期+4位序号 */
  const prefix = tpl === "lz" ? day.slice(0, 4) : code2 + day;
  const seqLen = tpl === "lz" ? 6 : 4;
  let certNo = "";
  let ok = false;
  for (let i = 0; i < 3 && !ok; i++) {
    const total = (await db.collection(COLL.Cert).where({ certNo: db.RegExp({ regexp: "^" + prefix }) }).count()).total ?? 0;
    certNo = `${prefix}${String(total + 1).padStart(seqLen, "0")}`;
    try {
      const doc: Record<string, unknown> = {
        certNo, name, idCardMask: maskId(idCard), gender: genderOf(idCard),
        province: prov, region: tpl === "lz" ? "兰州新区" : region, unitName, organ, age, template: tpl,
        photoUrl: photoUrl || "", examDate,
        verifyExpireAt: new Date(Date.now() + 3 * 86400e3), createdBy,
        createdAt: db.serverDate(), updatedAt: db.serverDate(),
      };
      if (tpl === "lz") doc.category = "食品";
      await db.collection(COLL.Cert).add(doc);
      ok = true;
    } catch {
      ok = false;
    }
  }
  if (!ok) return NextResponse.json({ error: "编号冲突，请重试" }, { status: 500 });

  const domain = resolveDomain(req);
  /** 高容错二维码：H 级纠错 + 大尺寸 + 白底黑块，兼容美团/蜂鸟等第三方严格扫码 */
  const qrDataUrl = await QRCode.toDataURL(`${domain}/verify/${certNo}`, {
    errorCorrectionLevel: "H",
    width: 600,
    margin: 4,
    color: { dark: "#000000", light: "#ffffff" },
  });
  return NextResponse.json({ certNo, qr: qrDataUrl, unitName, province: prov, gender: genderOf(idCard), mask: maskId(idCard), age, organ, category: tpl === "lz" ? "食品" : undefined, from: examDate, to, template: tpl });
}