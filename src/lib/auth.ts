import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret-change-me");

/**
 * 密码加密。
 */
export async function hashPwd(p: string) {
  return bcrypt.hash(p, 10);
}

/**
 * 验密。
 */
export async function verifyPwd(p: string, h: string) {
  return bcrypt.compare(p, h);
}

/**
 * 签发登录Token（L1/L2用，7天）。
 */
export function signUser(payload: object) {
  return new SignJWT({ ...payload }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(secret);
}

/**
 * 签发三级通行Token（随卡密过期）。
 */
export function signPass(payload: object, expireAt: Date) {
  return new SignJWT({ ...payload }).setProtectedHeader({ alg: "HS256" }).setExpirationTime(Math.floor(expireAt.getTime() / 1000)).sign(secret);
}

/**
 * 解析Token。
 */
export async function readToken<T>(t: string) {
  const { payload } = await jwtVerify(t, secret);
  return payload as unknown as T;
}
