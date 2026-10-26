/** 业务小函数：身份证弱校验 / 性别 / 脱敏 / 卡密 / 时长 */

const DUR: Record<string, number> = {
  HOUR_1: 3600e3,
  DAY_1: 24 * 3600e3,
  WEEK_1: 7 * 24 * 3600e3,
  MONTH_1: 30 * 24 * 3600e3,
};

/**
 * 只校验字符集（数字 + 末位数字/X），不强制长度——用户可只填部分号码。
 */
export function checkIdCard(v: string) {
  const s = (v || "").trim();
  return /^(?=.*\d)[0-9Xx]+$/.test(s);
}

/**
 * 第17位奇男偶女；号码不足18位或该位非数字时无法判断，返回空串（性别由页面选择）。
 */
export function genderOf(id: string): "男" | "女" | "" {
  const c = (id || "")[16];
  if (!c || !/\d/.test(c)) return "";
  return Number(c) % 2 === 1 ? "男" : "女";
}

/**
 * 脱敏：够长用前6+********+后4；短号保留首尾各1位。
 */
export function maskId(id: string) {
  const v = (id || "").trim();
  if (v.length <= 8) return v.slice(0, 1) + "****" + v.slice(-1);
  return v.slice(0, 6) + "********" + v.slice(-4);
}

/**
 * 生成8位大写字母+数字卡密。
 */
export function genKeyCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let s = "";
  const arr = crypto.getRandomValues(new Uint8Array(8));
  for (const n of arr) s += chars[n % chars.length];
  return s;
}

/**
 * 卡密有效期毫秒数。
 */
export function durationMs(t: string) {
  return DUR[t] ?? DUR.DAY_1;
}
