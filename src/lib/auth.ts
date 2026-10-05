import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { jwtSecret } from "./config";

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

/** 密钥按需生成（模块级常量会在 next build 无环境变量时抛错） */
function secret() {
  return new TextEncoder().encode(jwtSecret());
}

/**
 * 签发登录Token（L1/L2用，7天）。
 */
export function signUser(payload: object) {
  return new SignJWT({ ...payload }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(secret());
}

/**
 * 签发三级通行Token（随卡密过期）。
 */
export function signPass(payload: object, expireAt: Date) {
  return new SignJWT({ ...payload }).setProtectedHeader({ alg: "HS256" }).setExpirationTime(Math.floor(expireAt.getTime() / 1000)).sign(secret());
}

/**
 * 解析Token。
 */
export async function readToken<T>(t: string) {
  const { payload } = await jwtVerify(t, secret());
  return payload as unknown as T;
}
