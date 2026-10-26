/**
 * MySQL 表结构（Sequelize 模型）与行类型定义。
 *
 * 与原 CloudBase 集合的对应关系：
 *   User       → users
 *   CardKey    → card_keys
 *   RegionUnit → region_units
 *   Cert       → certs
 *   （新增）cert_seqs：编号序列，用于生成不重复的证件编号
 *
 * 模型用函数懒初始化：next build 会 import 本模块，顶层 init 会在构建机上连库失败。
 */
import { DataTypes } from "sequelize";
import { getSequelize } from "./db";

/** 表名 */
export const TABLES = {
  user: "users",
  cardKey: "card_keys",
  regionUnit: "region_units",
  cert: "certs",
  certSeq: "cert_seqs",
  notice: "notices",
} as const;

/** 账号行 */
export interface UserRow {
  id: number;
  username: string;
  passwordHash: string;
  plainPwd: string | null;
  role: "L1" | "L2";
  status: string;
  /** 1=已限制办证 */
  restricted: number;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** 卡密行 */
export interface CardKeyRow {
  id: number;
  code: string;
  type: string;
  status: string;
  createdByL2: string | null;
  usedAt: Date | null;
  expireAt: Date | null;
  /** 首次登录绑定的设备标识；空表示尚未绑定 */
  boundDevice: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** 地区→机构映射行 */
export interface RegionUnitRow {
  id: number;
  regionKeyword: string;
  unitName: string;
  regionCode: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** 健康证行 */
export interface CertRow {
  id: number;
  certNo: string;
  /** 公开验真随机Token（历史旧证为空） */
  verifyToken: string | null;
  name: string;
  idCardMask: string;
  gender: string;
  age: string;
  province: string;
  region: string;
  unitName: string;
  organ: string;
  category: string | null;
  template: string;
  photoUrl: string;
  /** DATEONLY，读出即 "YYYY-MM-DD" 字符串 */
  examDate: string;
  verifyExpireAt: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/** 公告行 */
export interface NoticeRow {
  id: number;
  content: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/** 模型集合 */
export interface Models {
  User: ReturnType<typeof defineUser>;
  CardKey: ReturnType<typeof defineCardKey>;
  RegionUnit: ReturnType<typeof defineRegionUnit>;
  Cert: ReturnType<typeof defineCert>;
  CertSeq: ReturnType<typeof defineCertSeq>;
  Notice: ReturnType<typeof defineNotice>;
}

function defineUser(sequelize: ReturnType<typeof getSequelize>) {
  return sequelize.define(
    "User",
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      username: { type: DataTypes.STRING(64), allowNull: false, unique: true },
      passwordHash: { type: DataTypes.STRING(100), allowNull: false },
      plainPwd: { type: DataTypes.STRING(64), allowNull: true },
      role: { type: DataTypes.STRING(8), allowNull: false, defaultValue: "L2" },
      status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: "ok" },
      /** 1=已限制办证（可发卡密、可登录，但不能生成健康证） */
      restricted: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 0 },
      createdBy: { type: DataTypes.STRING(64), allowNull: true },
    },
    { tableName: TABLES.user, engine: "InnoDB", charset: "utf8mb4" },
  );
}

function defineCardKey(sequelize: ReturnType<typeof getSequelize>) {
  return sequelize.define(
    "CardKey",
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      code: { type: DataTypes.STRING(16), allowNull: false, unique: true },
      type: { type: DataTypes.STRING(16), allowNull: false, defaultValue: "DAY_1" },
      status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: "unused" },
      createdByL2: { type: DataTypes.STRING(64), allowNull: true },
      usedAt: { type: DataTypes.DATE, allowNull: true },
      expireAt: { type: DataTypes.DATE, allowNull: true },
      /** 首次登录绑定的设备标识：一张卡密只能在一台设备上用 */
      boundDevice: { type: DataTypes.STRING(64), allowNull: true },
    },
    { tableName: TABLES.cardKey, engine: "InnoDB", charset: "utf8mb4" },
  );
}

function defineRegionUnit(sequelize: ReturnType<typeof getSequelize>) {
  return sequelize.define(
    "RegionUnit",
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      regionKeyword: { type: DataTypes.STRING(64), allowNull: false },
      unitName: { type: DataTypes.STRING(128), allowNull: false },
      regionCode: { type: DataTypes.STRING(16), allowNull: true },
    },
    { tableName: TABLES.regionUnit, engine: "InnoDB", charset: "utf8mb4" },
  );
}

function defineCert(sequelize: ReturnType<typeof getSequelize>) {
  return sequelize.define(
    "Cert",
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      certNo: { type: DataTypes.STRING(32), allowNull: false, unique: true },
      verifyToken: { type: DataTypes.STRING(64), allowNull: true, unique: true },
      name: { type: DataTypes.STRING(64), allowNull: false, defaultValue: "" },
      idCardMask: { type: DataTypes.STRING(32), allowNull: false, defaultValue: "" },
      gender: { type: DataTypes.STRING(4), allowNull: false, defaultValue: "" },
      age: { type: DataTypes.STRING(4), allowNull: false, defaultValue: "" },
      province: { type: DataTypes.STRING(32), allowNull: false, defaultValue: "" },
      region: { type: DataTypes.STRING(64), allowNull: false, defaultValue: "" },
      unitName: { type: DataTypes.STRING(128), allowNull: false, defaultValue: "" },
      organ: { type: DataTypes.STRING(128), allowNull: false, defaultValue: "" },
      category: { type: DataTypes.STRING(32), allowNull: true },
      template: { type: DataTypes.STRING(8), allowNull: false, defaultValue: "gd" },
      photoUrl: { type: DataTypes.STRING(255), allowNull: false, defaultValue: "" },
      examDate: { type: DataTypes.DATEONLY, allowNull: true },
      verifyExpireAt: { type: DataTypes.DATE, allowNull: true },
      createdBy: { type: DataTypes.STRING(64), allowNull: false, defaultValue: "" },
    },
    { tableName: TABLES.cert, engine: "InnoDB", charset: "utf8mb4" },
  );
}

function defineCertSeq(sequelize: ReturnType<typeof getSequelize>) {
  return sequelize.define(
    "CertSeq",
    {
      series: { type: DataTypes.STRING(24), primaryKey: true },
      seq: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    },
    { tableName: TABLES.certSeq, engine: "InnoDB", charset: "utf8mb4", timestamps: false },
  );
}

function defineNotice(sequelize: ReturnType<typeof getSequelize>) {
  return sequelize.define(
    "Notice",
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      content: { type: DataTypes.TEXT, allowNull: false },
      createdBy: { type: DataTypes.STRING(64), allowNull: false, defaultValue: "admin" },
    },
    { tableName: TABLES.notice, engine: "InnoDB", charset: "utf8mb4" },
  );
}

let _models: Models | null = null;

/** 获取模型集合（懒初始化，进程内缓存） */
export function getModels(): Models {
  if (!_models) {
    const sequelize = getSequelize();
    _models = {
      User: defineUser(sequelize),
      CardKey: defineCardKey(sequelize),
      RegionUnit: defineRegionUnit(sequelize),
      Cert: defineCert(sequelize),
      CertSeq: defineCertSeq(sequelize),
      Notice: defineNotice(sequelize),
    };
  }
  return _models;
}
