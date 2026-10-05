/**
 * MySQL 连接（Sequelize 单例）。
 * 用函数懒加载而不是模块级实例：next build 时会 import 这个模块，
 * 顶层建连会在构建机上失败。所有访问只能在请求处理函数内进行。
 */
import { Sequelize } from "sequelize";
import { dbConfig } from "./config";

let _seq: Sequelize | null = null;

/** 获取 Sequelize 单例 */
export function getSequelize(): Sequelize {
  if (!_seq) {
    const c = dbConfig();
    _seq = new Sequelize(c.database, c.username, c.password, {
      host: c.host,
      port: c.port,
      dialect: "mysql",
      timezone: c.timezone,
      logging: false,
      /** 模型用驼峰属性名，库里统一转成下划线列名 */
      define: { underscored: true, freezeTableName: true, charset: "utf8mb4" },
      pool: { max: c.poolMax, min: 0, acquire: 30000, idle: 10000 },
    });
  }
  return _seq;
}

/** 兼容历史调用点；Sequelize 自带连接池，无需手动建连 */
export async function dbConnect(): Promise<void> {
  return;
}
