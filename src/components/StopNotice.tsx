"use client";
import { useState } from "react";

const BLUE = "#1677ff";

interface Props {
  /** 正文提示语，如“腾讯云部署服务已到期，请联系一级管理” */
  text: string;
  /** 是否显示“重新登录”白按钮 */
  onRetry?: () => void;
}

/**
 * 停服提示卡：到期/禁用/被删统一界面 + 联系开发者。
 */
export default function StopNotice({ text, onRetry }: Props) {
  const [showQQ, setShowQQ] = useState(false);
  return (
    <div style={{ maxWidth: 400, margin: "0 auto", background: "#fff", borderRadius: 16, padding: 32, border: "1px solid #e8f0fe", textAlign: "center" }}>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 20, lineHeight: 1.6 }}>{text}</div>
      <button onClick={() => setShowQQ(true)} style={{ width: "100%", borderRadius: 12, background: BLUE, color: "#fff", padding: 14, fontWeight: 700, border: "none", fontSize: 16 }}>
        前往联系开发者
      </button>
      {showQQ && <div style={{ marginTop: 16, fontSize: 18, fontWeight: 800, color: BLUE }}>开发者QQ：3321760157</div>}
      {onRetry && (
        <button onClick={onRetry} style={{ width: "100%", borderRadius: 12, background: "#fff", color: BLUE, padding: 14, fontWeight: 700, border: `1px solid ${BLUE}`, fontSize: 16, marginTop: 12 }}>
          重新登录
        </button>
      )}
    </div>
  );
}
