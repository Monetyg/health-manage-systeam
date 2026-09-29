import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { User, RegionUnit } from "@/lib/models";
import { hashPwd } from "@/lib/auth";

/**
 * 一键初始化：创建一级（你唯一总管）+ 一个二级测试号 + 默认地区映射。
 * 重复调用幂等，已存在则跳过。初始化后建议删除此文件。
 */
export async function GET() {
  await dbConnect();
  const out: string[] = [];
  if (!(await User.findOne({ username: "admin" }))) {
    await User.create({ username: "admin", passwordHash: await hashPwd("admin123"), plainPwd: "admin123", role: "L1" });
    out.push("一级 admin / admin123 已创建");
  } else out.push("一级 admin 已存在，跳过");
  if (!(await User.findOne({ username: "l2test" }))) {
    await User.create({ username: "l2test", passwordHash: await hashPwd("l2test123"), plainPwd: "l2test123", role: "L2", createdBy: "admin" });
    out.push("二级 l2test / l2test123 已创建");
  } else out.push("二级 l2test 已存在，跳过");
  await RegionUnit.updateOne(
    { regionKeyword: "深圳" },
    { regionKeyword: "深圳", unitName: "深圳第一人民医院", regionCode: "SZ" },
    { upsert: true }
  );
  out.push("地区映射 深圳→深圳第一人民医院 已同步");
  return NextResponse.json({ done: true, steps: out });
}
