/** 业务小函数：身份证弱校验 / 性别 / 脱敏 / 卡密 / 时长 */

const DUR: Record<string, number> = {
  HOUR_1: 3600e3,
  DAY_1: 24 * 3600e3,
  WEEK_1: 7 * 24 * 3600e3,
  MONTH_1: 30 * 24 * 3600e3,
};

/**
 * 仅校验18位（前17数字+末位数字/X），不做校验码强校验。
 */
export function checkIdCard(v: string) {
  return /^\d{17}[\dXx]$/.test((v || "").trim());
}

/**
 * 第17位奇男偶女。
 */
export function genderOf(id: string): "男" | "女" {
  return Number(id[16]) % 2 === 1 ? "男" : "女";
}

/**
 * 脱敏：前6+********+后4。
 */
export function maskId(id: string) {
  return id.slice(0, 6) + "********" + id.slice(-4);
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
