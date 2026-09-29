"use client";
import { useEffect, useState } from "react";

const BLUE = "#1677ff";
const NAMES: Record<string, string> = { HOUR_1: "1小时", DAY_1: "1天", WEEK_1: "1周", MONTH_1: "1个月" };

/**
 * 二级后台（仅L2）：给三级单张发放卡密，看不到一级后台。
 */
export default function Level2() {
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loginF, setLoginF] = useState({ username: "", password: "" });
  const [loginMsg, setLoginMsg] = useState("");
  /** 被一级删除后的停服状态 */
  const [dead, setDead] = useState(false);
  const [showQQ, setShowQQ] = useState(false);
  const [type, setType] = useState("DAY_1");
  const [last, setLast] = useState("");
  const [list, setList] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  /** 复制成功提示：显示2秒渐隐 */
  const [copied, setCopied] = useState(false);
  /** 按键下沉动效 */
  const [pressing, setPressing] = useState(false);

  async function copyKey() {
    setPressing(true);
    setTimeout(() => setPressing(false), 150);
    try { await navigator.clipboard.writeText(last); }
    catch {
      const t = document.createElement("textarea");
      t.value = last; document.body.appendChild(t); t.select();
      document.execCommand("copy"); t.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function load() {
    const r = await fetch("/api/me");
    const m = await r.json().catch(() => ({}));
    if (m.deleted || m.disabled) { setDead(true); setMe(null); setLoading(false); return; }
    setDead(false);
    setMe(m.role ? m : null);
    setLoading(false);
    if (m.role === "L2") {
      const r = await fetch("/api/l2/keys");
      if (r.ok) setList(await r.json());
    }
  }
  useEffect(() => { load(); }, []);

  /** 未登录时直接在本页登录 */
  async function login(e?: React.FormEvent) {
    e?.preventDefault();
    setLoginMsg("登录中…");
    try {
      const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(loginF) });
      const j = await r.json().catch(() => ({ error: "服务异常" }));
      if (!r.ok) {
        if (j.disabled || j.deleted) { setDead(true); return; }
        setLoginMsg("失败：" + (j.error || r.status)); return;
      }
      if (j.role !== "L2") { setLoginMsg("此账号不是二级账号，请用一级发放的二级账号登录"); return; }
      setLoginMsg("");
      load();
    } catch (e) { setLoginMsg("请求失败：" + String(e)); }
  }

  async function gen() {
    const r = await fetch("/api/l2/keys", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type }) });
    const j = await r.json();
    if (r.ok) { setLast(j.code); load(); }
    else setMsg("失败：" + j.error);
  }

  const card: React.CSSProperties = { background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #e8f0fe", boxShadow: "0 2px 12px rgba(22,119,255,.08)" };

  if (loading) return <main style={{ padding: 60, textAlign: "center", color: "#7a8bb0" }}>加载中…</main>;

  /* 账号被一级删除：停服提示 */
  if (dead) {
    return (
      <main style={{ background: "#f2f6ff", minHeight: "100vh", padding: "80px 20px", color: "#111" }}>
        <div style={{ maxWidth: 400, margin: "0 auto", background: "#fff", borderRadius: 16, padding: 32, border: "1px solid #e8f0fe", textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>腾讯云部署已到期，请联系开发者充值</div>
          <button onClick={() => setShowQQ(true)} style={{ width: "100%", borderRadius: 12, background: BLUE, color: "#fff", padding: 14, fontWeight: 700, border: "none", fontSize: 16 }}>前往联系开发者</button>
          {showQQ && <div style={{ marginTop: 16, fontSize: 18, fontWeight: 800, color: BLUE }}>开发者QQ：3321760157</div>}
          <button
            onClick={() => { setDead(false); setMe(null); setShowQQ(false); setLoginF({ username: "", password: "" }); setLoginMsg(""); }}
            style={{ width: "100%", borderRadius: 12, background: "#fff", color: BLUE, padding: 14, fontWeight: 700, border: `1px solid ${BLUE}`, fontSize: 16, marginTop: 12 }}
          >
            重新登录
          </button>
          <div style={{ marginTop: 10, fontSize: 12, color: "#7a8bb0" }}>需使用一级管理发放的新账号登录</div>
        </div>
      </main>
    );
  }

  /* 未登录（或不是二级）：直接显示账号+密码登录框 */
  if (!me || me.role !== "L2") {
    return (
      <main style={{ background: "#f2f6ff", minHeight: "100vh", padding: "60px 16px", color: "#111" }}>
        <style>{`input::placeholder{color:#8a9cc5 !important;opacity:1 !important;}input{color:#111 !important;-webkit-text-fill-color:#111;}`}</style>
        <div style={{ maxWidth: 400, margin: "0 auto", background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #e8f0fe" }}>
          <div style={{ textAlign: "center", color: BLUE, fontWeight: 800, fontSize: 22 }}>二级登录</div>
          <div style={{ textAlign: "center", color: "#7a8bb0", fontSize: 13, margin: "6px 0 16px" }}>账号密码由一级管理发放</div>
          <form onSubmit={login} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input style={{ borderRadius: 12, border: "1px solid #d0ddf5", padding: 14, fontSize: 16 }} placeholder="请输入账号" value={loginF.username} onChange={(e) => setLoginF({ ...loginF, username: e.target.value })} />
            <input style={{ borderRadius: 12, border: "1px solid #d0ddf5", padding: 14, fontSize: 16 }} placeholder="请输入密码" type="password" value={loginF.password} onChange={(e) => setLoginF({ ...loginF, password: e.target.value })} />
            <button type="submit" style={{ borderRadius: 12, background: BLUE, color: "#fff", padding: 14, fontWeight: 700, border: "none", fontSize: 17 }}>登录</button>
          </form>
          {loginMsg && <div style={{ marginTop: 12, textAlign: "center", fontSize: 14 }}>{loginMsg}</div>}
        </div>
      </main>
    );
  }

  return (
    <main style={{ background: "#f2f6ff", minHeight: "100vh", padding: "20px 16px 60px", color: "#111" }}>
      <div style={{ maxWidth: 560, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <h1 style={{ textAlign: "center", color: BLUE, fontWeight: 800, fontSize: 22 }}>二级管理后台</h1>
        <div style={{ textAlign: "center", color: "#7a8bb0", fontSize: 14, marginTop: -8 }}>二级账号：<b style={{ color: BLUE }}>{me?.username}</b></div>
        <section style={card}>
          <div style={{ fontWeight: 800, marginBottom: 12 }}>给三级发放卡密（单张）</div>
          <select value={type} onChange={(e) => setType(e.target.value)} style={{ width: "100%", borderRadius: 12, border: "1px solid #d0ddf5", padding: 14, fontSize: 16, marginBottom: 12 }}>
            {Object.entries(NAMES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button onClick={gen} style={{ width: "100%", borderRadius: 12, background: BLUE, color: "#fff", padding: 14, fontWeight: 700, border: "none", fontSize: 16 }}>生成一张卡密</button>
          {last && <div style={{ textAlign: "center", fontSize: 28, fontWeight: 800, letterSpacing: 4, marginTop: 12 }}>{last}</div>}
          {last && (
            <>
              <style>{`@keyframes toastFade{0%{opacity:0;transform:translateY(8px)}10%{opacity:1;transform:translateY(0)}80%{opacity:1}100%{opacity:0;transform:translateY(-6px)}}`}</style>
              <button
                onClick={copyKey}
                style={{ width: "100%", borderRadius: 12, background: pressing ? "#e8f1ff" : "#fff", color: BLUE, border: `1px solid ${BLUE}`, padding: 12, fontWeight: 700, marginTop: 8, transform: pressing ? "scale(.97)" : "scale(1)", transition: "transform .15s, background .15s" }}
              >
                复制卡密
              </button>
              {copied && <div style={{ textAlign: "center", marginTop: 8, background: BLUE, color: "#fff", borderRadius: 10, padding: "10px", fontWeight: 700, animation: "toastFade 2s ease forwards" }}>卡密复制成功</div>}
            </>
          )}
          {last && <div style={{ textAlign: "center", color: "#7a8bb0", fontSize: 13 }}>也可长按卡密手动复制</div>}
        </section>
        <section style={card}>
          <div style={{ fontWeight: 800, marginBottom: 12 }}>我发出的卡密（{list.length}）</div>
          {list.map((k: any) => (
            <div key={k._id} style={{ border: "1px solid #e8f0fe", borderRadius: 12, padding: 12, marginBottom: 10, fontSize: 14 }}>
              <div><b style={{ letterSpacing: 2 }}>{k.code}</b>　{NAMES[k.type]}　{k.status === "unused" ? "未使用" : k.status === "used" ? "已使用" : k.status}</div>
              <div style={{ color: "#7a8bb0", fontSize: 12 }}>{new Date(k.createdAt).toLocaleString()}</div>
            </div>
          ))}
          {list.length === 0 && <div style={{ color: "#7a8bb0" }}>还没发过卡密</div>}
        </section>
        {msg && <div style={{ textAlign: "center", color: BLUE }}>{msg}</div>}
      </div>
    </main>
  );
}
