/** 集合名常量. */
export const COLL = {
  User: "User",
  CardKey: "CardKey",
  RegionUnit: "RegionUnit",
  Cert: "Cert",
} as const;

/** 基础文档类型（CloudBase 的 _id 是字符串）. */
export type DbDoc = { _id: string; createdAt?: unknown; updatedAt?: unknown; [k: string]: unknown };
/** 用户文档. */
export type UserDoc = DbDoc & { username: string; passwordHash: string; plainPwd?: string; role: "L1" | "L2"; status?: string; createdBy?: string };
/** 卡密文档. */
export type CardKeyDoc = DbDoc & { code: string; type: "HOUR_1" | "DAY_1" | "WEEK_1" | "MONTH_1"; status: string; createdByL2?: string; usedAt?: unknown; expireAt?: unknown };
/** 地区映射文档. */
export type RegionUnitDoc = DbDoc & { regionKeyword: string; unitName: string; regionCode?: string };
/** 健康证文档. */
export type CertDoc = DbDoc & { certNo: string; [k: string]: unknown };
