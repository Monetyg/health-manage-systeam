"use client";
import { useState } from "react";
import StopNotice from "@/components/StopNotice";

const BLUE = "#1677ff";

/**
 * 二级专用登录：只有一级发放的二级账号能进，一级号在这里登录会被拒绝。
 */
export default function L2Login() {
  const [f, setF] = useState({ username: "", password: "" });
  const [msg, setMsg] = useState("");
  /** 被禁用账号登录：切停服页 */
  const [dead, setDead] = useState(false);

  async function login(e?: React.FormEvent) {
    e?.preventDefault();
    setMsg("登录中…");
    try {
      const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const j = await r.json().catch(() => ({ error: "服务异常" }));
      if (!r.ok) {
        if (j.disabled) { setDead(true); return; }
        setMsg("失败：" + (j.error || r.status)); return;
      }
      if (j.role !== "L2") { setMsg("此账号不是二级账号，请用一级发放的二级账号登录"); return; }
      setMsg("登录成功，正在进入二级后台…");
      location.href = "/level2";
    } catch (e) {
      setMsg("请求失败：" + String(e));
    }
  }

  if (dead) {
    return (
      <main style={{ background: "#f2f6ff", minHeight: "100vh", padding: "80px 20px", color: "#111" }}>
        <StopNotice text="失败：腾讯云部署服务已到期，请联系一级管理" />
      </main>
    );
  }

  return (
    <main style={{ background: "#f2f6ff", minHeight: "100vh", padding: "60px 16px", color: "#111" }}>
      <style>{`input::placeholder{color:#8a9cc5 !important;opacity:1 !important;}input{color:#111 !important;-webkit-text-fill-color:#111;}`}</style>
      <div style={{ maxWidth: 400, margin: "0 auto", background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #e8f0fe" }}>
        <div style={{ textAlign: "center", color: BLUE, fontWeight: 800, fontSize: 22 }}>二级登录</div>
        <div style={{ textAlign: "center", color: "#7a8bb0", fontSize: 13, margin: "6px 0 16px" }}>账号密码由一级管理发放</div>
        <form onSubmit={login} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input style={{ borderRadius: 12, border: "1px solid #d0ddf5", padding: 14, fontSize: 16 }} placeholder="二级账号" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} />
          <input style={{ borderRadius: 12, border: "1px solid #d0ddf5", padding: 14, fontSize: 16 }} placeholder="密码" type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
          <button type="submit" style={{ borderRadius: 12, background: BLUE, color: "#fff", padding: 14, fontWeight: 700, border: "none", fontSize: 17 }}>登录并发卡密</button>
        </form>
        {msg && <div style={{ marginTop: 12, textAlign: "center", fontSize: 14 }}>{msg}</div>}
      </div>
    </main>
  );
}
