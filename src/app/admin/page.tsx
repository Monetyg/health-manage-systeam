"use client";
import { useEffect, useState } from "react";

const BLUE = "#1677ff";

/**
 * 一级后台（仅L1）：发放二级账号，查看账号/密码/创建天数，随时删除。
 */
export default function Admin() {
  const [list, setList] = useState<any[]>([]);
  const [f, setF] = useState({ username: "", password: "" });
  const [msg, setMsg] = useState("");

  /** 一级单人使用，打开即用，无需登录 */
  async function load() {
    const r = await fetch("/api/admin/l2");
    if (r.ok) setList(await r.json());
  }
  useEffect(() => { load(); }, []);

  async function create() {
    const r = await fetch("/api/admin/l2", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    const j = await r.json();
    if (r.ok) { setF({ username: "", password: "" }); setMsg("发放成功"); load(); }
    else setMsg("失败：" + j.error);
  }
  async function del(id: string, name: string) {
    if (!confirm(`删除二级账号 ${name}？它没用过的卡密会一并作废。`)) return;
    const r = await fetch(`/api/admin/l2?id=${id}`, { method: "DELETE" });
    if (r.ok) load();
    else setMsg("删除失败");
  }
  /** 禁用/启用切换，实时刷新状态 */
  async function toggle(id: string, cur: string) {
    const r = await fetch("/api/admin/l2", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const j = await r.json();
    if (r.ok) { setMsg(j.status === "disabled" ? "已禁用" : "已启用"); load(); }
    else setMsg("操作失败：" + (j.error || ""));
  }

  const card: React.CSSProperties = { background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #e8f0fe", boxShadow: "0 2px 12px rgba(22,119,255,.08)" };
  const input: React.CSSProperties = { width: "100%", borderRadius: 12, border: "1px solid #d0ddf5", padding: "14px", fontSize: 16, background: "#fff", color: "#111" };

  return (
    <main style={{ background: "#f2f6ff", minHeight: "100vh", padding: "20px 16px 60px", color: "#111" }}>
      <style>{`input::placeholder{color:#8a9cc5 !important;opacity:1 !important;}input{color:#111 !important;-webkit-text-fill-color:#111;}`}</style>
      <div style={{ maxWidth: 560, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <h1 style={{ textAlign: "center", color: BLUE, fontWeight: 800, fontSize: 22 }}>一级管理后台</h1>
        <section style={card}>
          <div style={{ fontWeight: 800, marginBottom: 12 }}>发放二级账号</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input style={input} placeholder="二级账号名" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} />
            <input style={input} placeholder="初始密码（至少6位）" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
            <button onClick={create} style={{ borderRadius: 12, background: BLUE, color: "#fff", padding: 14, fontWeight: 700, border: "none", fontSize: 16 }}>创建并发放</button>
          </div>
        </section>
        <section style={card}>
          <div style={{ fontWeight: 800, marginBottom: 12 }}>二级账号列表（{list.length}）</div>
          {list.map((u) => (
            <div key={u.id} style={{ border: "1px solid #e8f0fe", borderRadius: 12, padding: 12, marginBottom: 10 }}>
              <div>账号：<b>{u.username}</b>　
                <span style={{
                  fontSize: 12, fontWeight: 700, borderRadius: 20, padding: "2px 10px",
                  background: u.status === "disabled" ? "#fff1f0" : "#e6f7ee",
                  color: u.status === "disabled" ? "#d4380d" : "#1a9e54",
                }}>
                  {u.status === "disabled" ? "已禁用" : "已启用"}
                </span>
              </div>
              <div>密码：<b>{u.password}</b></div>
              <div style={{ color: "#7a8bb0", fontSize: 13 }}>创建：{new Date(u.createdAt).toLocaleString()}（已创建 {u.days} 天）</div>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button
                  onClick={() => toggle(u.id, u.status)}
                  style={{
                    borderRadius: 8, padding: "8px 16px",
                    background: u.status === "disabled" ? "#e6f1ff" : "#fff7e6",
                    color: u.status === "disabled" ? "#1677ff" : "#d48806",
                    border: `1px solid ${u.status === "disabled" ? "#91caff" : "#ffd591"}`,
                  }}
                >
                  {u.status === "disabled" ? "启用" : "禁用"}
                </button>
                <button onClick={() => del(u.id, u.username)} style={{ borderRadius: 8, background: "#fff1f0", color: "#d4380d", border: "1px solid #ffb4ab", padding: "8px 16px" }}>删除</button>
              </div>
            </div>
          ))}
          {list.length === 0 && <div style={{ color: "#7a8bb0" }}>暂无二级账号</div>}
        </section>
        {msg && <div style={{ textAlign: "center", color: BLUE }}>{msg}</div>}
      </div>
    </main>
  );
}
