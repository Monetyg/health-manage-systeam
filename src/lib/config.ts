/**
 * 集中配置：所有环境变量只在这里读取，业务代码禁止直接 process.env，
 * 也不允许出现写死的地址 / 端口 / 密码 / 密钥。
 *
 * 全部用函数导出而不是模块级常量：next build 阶段会 import 这些模块，
 * 用常量会在构建机上因为缺少环境变量直接报错，用函数则只在真正请求时才校验。
 */
import path from "node:path";

/** 取必填项，缺失时抛错并指向 .env.example */
function required(key: string): string {
  const v = process.env[key]?.trim();
  if (!v) throw new Error(`缺少环境变量 ${key}，请参考 .env.example 配置后重启服务`);
  return v;
}

/** 取可选项，可给默认值 */
function optional(key: string, fallback = ""): string {
  return (process.env[key] ?? fallback).trim();
}

/** MySQL 连接参数 */
export function dbConfig() {
  return {
    host: optional("DB_HOST", "127.0.0.1"),
    port: Number(optional("DB_PORT", "3306")),
    database: required("DB_NAME"),
    username: required("DB_USER"),
    password: optional("DB_PASSWORD"),
    /** 数据库时区，默认北京时间 */
    timezone: optional("DB_TIMEZONE", "+08:00"),
    poolMax: Number(optional("DB_POOL_MAX", "10")),
  };
}

/** 登录 Token 签名密钥（必填，缺失直接报错，不再用默认值兜底） */
export function jwtSecret(): string {
  return required("JWT_SECRET");
}

/** 一级后台密码；不配则视为开发模式免密 */
export function adminPassword(): string {
  return optional("ADMIN_PASSWORD");
}

/** 服务监听端口（PM2 / 宝塔里配置的那个端口） */
export function appPort(): number {
  return Number(optional("PORT", "3000"));
}

/**
 * 二维码里写入的公网地址。
 * 正常情况由 Nginx 透传的 X-Forwarded-Host 还原，这里只是兜底。
 */
export function publicDomain(): string {
  const d = optional("DOMAIN").replace(/\/+$/, "");
  return d || `http://localhost:${appPort()}`;
}

/**
 * 上传图片落盘目录。
 * 默认项目内 public/uploads；部署时建议用 UPLOAD_DIR 指到项目外的固定目录，
 * 这样重新发布代码不会把已上传的照片覆盖掉。
 */
export function uploadDir(): string {
  const dir = optional("UPLOAD_DIR");
  return dir ? path.resolve(dir) : path.join(process.cwd(), "public", "uploads");
}

/** COS 参数，四项齐全才启用；否则图片落本地磁盘 */
export function cosConfig() {
  const secretId = optional("COS_SECRET_ID");
  const secretKey = optional("COS_SECRET_KEY");
  const bucket = optional("COS_BUCKET");
  const region = optional("COS_REGION");
  return secretId && secretKey && bucket && region ? { secretId, secretKey, bucket, region } : null;
}
