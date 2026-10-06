import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import QRCode from "qrcode";
import { publicDomain } from "@/lib/config";
import { readToken } from "@/lib/auth";
import { checkIdCard, genderOf, maskId } from "@/lib/biz";
import { createCert, findRegionUnit, findUserById, nextCertSeq } from "@/lib/repo";

/** 北京时间今天（UTC+8）：避免0-8点编号/体检日期差一天 */
function bjDay() {
  return new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10);
}

/**
 * 解析二维码写入的域名（按优先级）。
 * Nginx 必须透传 X-Forwarded-Host / X-Forwarded-Proto，否则取不到公网域名时才用 .env 里的 DOMAIN 兜底。
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
  const envDomain = publicDomain();
  if (envDomain && !/localhost|127\.0\.0\.1|192\.168\.|10\./.test(envDomain)) return envDomain;
  if (forwardedHost) {
    const proto = forwardedProto || "http";
    return `${proto}://${forwardedHost}`.replace(/\/+$/, "");
  }
  return envDomain;
}

/**
 * 办证：生成编号 + 落库 + 返回二维码。
 * 编号规则（与原来一致）：lz「年份+6位序号」，hz「年月日+4位序号」，
 * fs「年月日+5位序号」，其余「地区码+日期+4位序号」。
 * 取号方式从「CloudBase 正则计数+冲突重试」改为 MySQL cert_seqs 原子自增，
 * 同一前缀多并发同时办证也不会撞号。
 */
export async function POST(req: Request) {
  const c = await cookies();
  const body = await req.json();
  const { name, idCard, province, region, photoUrl, template } = body;
  /** 模板：gd 任意地区版 / e 直辖市版 / lz 兰州新区版 / hz 合格证版 / fs 佛山疾控版（后三者无需地区） */
  const tpl = template === "e" ? "e" : template === "lz" ? "lz" : template === "hz" ? "hz" : template === "fs" ? "fs" : "gd";
  /** 无需填地区的模板 */
  const noRegion = tpl === "lz" || tpl === "hz" || tpl === "fs";
  if (!name || !checkIdCard(idCard || "") || (!noRegion && !region)) {
    return NextResponse.json({ error: noRegion ? "姓名/身份证(18位)必填" : "姓名/身份证(18位)/地区必填" }, { status: 400 });
  }
  let createdBy = "L1/L2";
  const pass = c.get("pass")?.value;
  const token = c.get("token")?.value;
  if (token) {
    try {
      const me = await readToken<{ uid: string; username: string }>(token);
      const u = await findUserById(me.uid);
      if (!u || u.status === "disabled") {
        return NextResponse.json({ error: "账号已禁用", disabled: true }, { status: 403 });
      }
      createdBy = u.username;
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

  const map = noRegion ? null : await findRegionUnit(region || "");
  const prov = tpl === "gd" ? ((province || "").trim() || "广东省") : "";
  /** 发证机构：合格证版/佛山版/兰州版固定，其余按地区映射 */
  const fixedOrgan = tpl === "hz"
    ? "深圳市疾病预防控制中心"
    : tpl === "fs"
      ? "佛山市疾病预防控制中心"
      : tpl === "lz"
        ? "兰州新区教育和卫生健康委员会"
        : "";
  const unitName = fixedOrgan || (map?.unitName || region.trim() + "市第一人民医院");
  const code2 = map?.regionCode || "SZ";
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
  const organ = fixedOrgan || region.trim() + "市疾病预防控制中心";
  const to = new Date(new Date(examDate).getTime() + 365 * 86400e3).toISOString().slice(0, 10);
  /** 编号前缀与序号长度 */
  const prefix = tpl === "lz" ? day.slice(0, 4) : tpl === "hz" || tpl === "fs" ? day : code2 + day;
  const seqLen = tpl === "lz" ? 6 : tpl === "fs" ? 5 : 4;
  const seq = await nextCertSeq(prefix);
  const certNo = `${prefix}${String(seq).padStart(seqLen, "0")}`;

  await createCert({
    certNo, name, idCardMask: maskId(idCard), gender: genderOf(idCard),
    province: prov, region: noRegion ? (tpl === "lz" ? "兰州新区" : tpl === "fs" ? "佛山" : "深圳") : region,
    unitName, organ, age, template: tpl,
    category: tpl === "lz" || tpl === "fs" ? "食品" : null,
    photoUrl: photoUrl || "", examDate,
    verifyExpireAt: new Date(Date.now() + 3 * 86400e3), createdBy,
  });

  const domain = resolveDomain(req);
  /** 高容错二维码：H 级纠错 + 大尺寸 + 白底黑块，兼容美团/蜂鸟等第三方严格扫码 */
  const qrDataUrl = await QRCode.toDataURL(`${domain}/verify/${certNo}`, {
    errorCorrectionLevel: "H",
    width: 600,
    margin: 4,
    color: { dark: "#000000", light: "#ffffff" },
  });
  return NextResponse.json({ certNo, qr: qrDataUrl, unitName, province: prov, gender: genderOf(idCard), mask: maskId(idCard), age, organ, category: tpl === "lz" || tpl === "fs" ? "食品" : undefined, from: examDate, to, template: tpl });
}
