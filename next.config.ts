import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** 关闭 Next 自动生成 AGENTS.md / CLAUDE.md（避免仓库里出现无用文档） */
  agentRules: false,
  /**
   * 数据库驱动不打包：sequelize/mysql2 让 Node 运行时直接从 node_modules 加载。
   * 不加的话 Turbopack 会尝试自己解析 mysql2，解析失败被 Sequelize 吞掉后
   * 统一报 "Please install mysql2 package manually"，开发和生产都会中招。
   */
  serverExternalPackages: ["sequelize", "mysql2"],
};

export default nextConfig;
