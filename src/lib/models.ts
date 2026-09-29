import mongoose from "mongoose";

/** 用户：一级唯一总管 / 二级账号 */
export const User = mongoose.models.User || mongoose.model("User", new mongoose.Schema({
  username: { type: String, unique: true },
  passwordHash: String,
  /** 明文密码仅一级可见（方便你发号），二级接口永不返回该字段 */
  plainPwd: String,
  role: { type: String, enum: ["L1", "L2"] },
  status: { type: String, default: "ok" },
  createdBy: String,
}, { timestamps: true }));

/** 卡密：8位、时长制 */
export const CardKey = mongoose.models.CardKey || mongoose.model("CardKey", new mongoose.Schema({
  code: { type: String, unique: true },
  type: { type: String, enum: ["HOUR_1", "DAY_1", "WEEK_1", "MONTH_1"] },
  status: { type: String, default: "unused" },
  createdByL2: String,
  usedAt: Date,
  expireAt: Date,
}, { timestamps: true }));

/** 地区→单位映射 */
export const RegionUnit = mongoose.models.RegionUnit || mongoose.model("RegionUnit", new mongoose.Schema({
  regionKeyword: String,
  unitName: String,
  regionCode: { type: String, default: "SZ" },
}, { timestamps: true }));

/** 健康证 */
export const Cert = mongoose.models.Cert || mongoose.model("Cert", new mongoose.Schema({
  certNo: { type: String, unique: true },
  name: String,
  idCardMask: String,
  gender: String,
  province: String,
  region: String,
  unitName: String,
  photoUrl: String,
  examDate: String,
  verifyExpireAt: Date,
  createdBy: String,
}, { timestamps: true }));
