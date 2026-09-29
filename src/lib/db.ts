import mongoose from "mongoose";

let cached = (global as unknown as { __mg?: typeof mongoose }).__mg;

/**
 * 连接云数据库（CloudBase Mongo 兼容），Serverless 下复用连接。
 */
export async function dbConnect() {
  if (cached) return cached;
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/health_cert";
  cached = await mongoose.connect(uri);
  (global as unknown as { __mg?: typeof mongoose }).__mg = cached;
  return cached;
}
