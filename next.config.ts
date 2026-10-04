import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** 关闭 Next 自动生成 AGENTS.md / CLAUDE.md（避免仓库里出现无用文档） */
  agentRules: false,
};

export default nextConfig;
