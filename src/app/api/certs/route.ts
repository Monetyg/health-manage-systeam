import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import QRCode from "qrcode";
import { verifyDomain } from "@/lib/config";
import { readToken } from "@/lib/auth";
import { checkIdCard, genderOf, maskId } from "@/lib/biz";
import { createCert, findCertByCertNo, findRegionUnit, findUserById, nextCertSeq, upsertCert } from "@/lib/repo";

/** 北京时间今天（UTC+8）：避免0-8点编号/体检日期差一天 */
function bjDay() {
  return new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10);
}

/**
 * 办证：生成编号 + 随机验真 token + 落库 + 返回指向验真子域名的二维码。
 * 编号规则：lz「年份+6位序号」，hz「年月日+4位序号」，
 * fs「年月日+5位序号」，sl 直接取身份证号，其余「地区码+日期+4位序号」。
 * 取号方式为 MySQL cert_seqs 原子自增，同一前缀多并发同时办证也不会撞号。
 */
export async function POST(req: Request) {
  const c = await cookies();
  const body = await req.json();
  const { name, idCard, province, region, photoUrl, template } = body;
  /** 模板：gd 任意地区版 / e 直辖市版 / lz 兰州新区版 / hz 合格证版 / fs 佛山疾控版 / sl 小鸟商洛版（后四者无需地区） */
  const tpl = template === "e" ? "e" : template === "lz" ? "lz" : template === "hz" ? "hz" : template === "fs" ? "fs" : template === "sl" ? "sl" : "gd";
  /** 无需填地区的模板 */
  const noRegion = tpl === "lz" || tpl === "hz" || tpl === "fs" || tpl === "sl";
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
  /** 发证机构：合格证版/佛山版/兰州版/商洛版固定，其余按地区映射 */
  const fixedOrgan = tpl === "hz"
    ? "深圳市疾病预防控制中心"
    : tpl === "fs"
      ? "佛山市疾病预防控制中心"
      : tpl === "lz"
        ? "兰州新区教育和卫生健康委员会"
        : tpl === "sl"
          ? "商洛市疾病预防控制中心"
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
  /** 商洛版编号直接取身份证号（与样张一致），同一人重复办证时覆盖旧证并沿用原 token（旧二维码不失效） */
  const isSl = tpl === "sl";
  let certNo: string;
  let verifyToken: string;
  if (isSl) {
    certNo = idCard;
    const prev = await findCertByCertNo(idCard);
    verifyToken = prev?.verifyToken || crypto.randomBytes(32).toString("hex");
  } else {
    /** 编号前缀与序号长度 */
    const prefix = tpl === "lz" ? day.slice(0, 4) : tpl === "hz" || tpl === "fs" ? day : code2 + day;
    const seqLen = tpl === "lz" ? 6 : tpl === "fs" ? 5 : 4;
    const seq = await nextCertSeq(prefix);
    certNo = `${prefix}${String(seq).padStart(seqLen, "0")}`;
    verifyToken = crypto.randomBytes(32).toString("hex");
  }

  const row = {
    certNo,
    /** 二维码只携带随机 token：不可预测，不用自增 id / 身份证号 / 证书编号 */
    verifyToken,
    name, idCardMask: maskId(idCard), gender: genderOf(idCard),
    province: prov, region: noRegion ? (tpl === "lz" ? "兰州新区" : tpl === "fs" ? "佛山" : tpl === "sl" ? "商洛" : "深圳") : region,
    unitName, organ, age, template: tpl,
    category: tpl === "lz" || tpl === "fs" || tpl === "sl" ? "食品" : null,
    photoUrl: photoUrl || "", examDate,
    verifyExpireAt: new Date(Date.now() + 3 * 86400e3), createdBy,
  };
  if (isSl) await upsertCert(row);
  else await createCert(row);

  /** 二维码统一指向验真子域名，token 落库在前：缺 token 直接报错，绝不生成扫了没用的码 */
  if (!verifyToken) return NextResponse.json({ error: "该健康证缺少验真 Token，无法生成二维码" }, { status: 500 });
  const verifyUrl = `${verifyDomain()}/v/${verifyToken}`;
  /** 高容错二维码：H 级纠错 + 大尺寸 + 白底黑块，兼容美团/蜂鸟等第三方严格扫码 */
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    errorCorrectionLevel: "H",
    width: 600,
    margin: 4,
    color: { dark: "#000000", light: "#ffffff" },
  });
  return NextResponse.json({ certNo, verifyUrl, qr: qrDataUrl, unitName, province: prov, gender: genderOf(idCard), mask: maskId(idCard), age, organ, category: tpl === "lz" || tpl === "fs" || tpl === "sl" ? "食品" : undefined, from: examDate, to, template: tpl });
}
