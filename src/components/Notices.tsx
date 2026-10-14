"use client";
import { useEffect, useState } from "react";

const BLUE = "#1677ff";

interface Notice {
  id: string;
  content: string;
  createdAt: string;
}

const card: React.CSSProperties = { background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #e8f0fe", boxShadow: "0 2px 12px rgba(22,119,255,.08)" };
const input: React.CSSProperties = { width: "100%", borderRadius: 12, border: "1px solid #d0ddf5", padding: "14px", fontSize: 16, background: "#fff", color: "#111" };

/** 公开展示用：二级后台下方 / 三级主页下方共用，无需登录即可查看 */
export function NoticeBoard({ title }: { title: string }) {
  const [list, setList] = useState<Notice[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/notices");
        if (r.ok) setList(await r.json());
      } catch { /* 公告加载失败不挡主流程 */ }
    })();
  }, []);
  if (list.length === 0) return null;
  return (
    <section style={card}>
      <div style={{ fontWeight: 800, marginBottom: 12 }}>{title}</div>
      {list.map((n) => (
        <div key={n.id} style={{ border: "1px solid #e8f0fe", borderRadius: 12, padding: 12, marginBottom: 10 }}>
          <div style={{ fontWeight: 700 }}>公告：{n.content}</div>
          <div style={{ color: "#7a8bb0", fontSize: 13, marginTop: 4 }}>{new Date(n.createdAt).toLocaleString()}</div>
        </div>
      ))}
    </section>
  );
}

/** 一级管理用：发布 + 修改 + 删除 */
export function NoticeManager() {
  const [list, setList] = useState<Notice[]>([]);
  const [draft, setDraft] = useState("");
  const [msg, setMsg] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  async function load() {
    const r = await fetch("/api/notices");
    if (r.ok) setList(await r.json());
  }
  useEffect(() => { load(); }, []);

  async function publish() {
    setMsg("");
    if (!draft.trim()) { setMsg("公告内容不能为空"); return; }
    const r = await fetch("/api/admin/notices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: draft.trim() }) });
    if (r.ok) { setDraft(""); setMsg("发布成功"); load(); }
    else setMsg("发布失败");
  }
  async function saveEdit(id: string) {
    if (!editText.trim()) { setMsg("公告内容不能为空"); return; }
    const r = await fetch("/api/admin/notices", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, content: editText.trim() }) });
    if (r.ok) { setEditing(null); setMsg("修改成功"); load(); }
    else setMsg("修改失败");
  }
  async function del(id: string) {
    if (!confirm("删除这条公告？")) return;
    const r = await fetch(`/api/admin/notices?id=${id}`, { method: "DELETE" });
    if (r.ok) { setMsg("已删除"); load(); }
    else setMsg("删除失败");
  }

  return (
    <section style={card}>
      <div style={{ fontWeight: 800, marginBottom: 12 }}>发布公告</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <textarea style={{ ...input, minHeight: 80, resize: "vertical" }} placeholder="输入公告内容" value={draft} onChange={(e) => setDraft(e.target.value)} />
        <button onClick={publish} style={{ borderRadius: 12, background: BLUE, color: "#fff", padding: 14, fontWeight: 700, border: "none", fontSize: 16 }}>发布</button>
      </div>
      {msg ? <div style={{ marginTop: 8, color: "#7a8bb0", fontSize: 14 }}>{msg}</div> : null}
      <div style={{ fontWeight: 800, margin: "16px 0 12px" }}>已发公告（{list.length}）</div>
      {list.length === 0 ? <div style={{ color: "#7a8bb0" }}>暂无公告</div> : null}
      {list.map((n) => (
        <div key={n.id} style={{ border: "1px solid #e8f0fe", borderRadius: 12, padding: 12, marginBottom: 10 }}>
          {editing === n.id ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <textarea style={{ ...input, minHeight: 60, resize: "vertical" }} value={editText} onChange={(e) => setEditText(e.target.value)} />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => saveEdit(n.id)} style={{ borderRadius: 8, padding: "8px 16px", background: "#e6f1ff", color: BLUE, border: "1px solid #91caff" }}>保存</button>
                <button onClick={() => setEditing(null)} style={{ borderRadius: 8, padding: "8px 16px", background: "#fff", color: "#7a8bb0", border: "1px solid #d0ddf5" }}>取消</button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontWeight: 700 }}>{n.content}</div>
              <div style={{ color: "#7a8bb0", fontSize: 13, marginTop: 4 }}>{new Date(n.createdAt).toLocaleString()}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button onClick={() => { setEditing(n.id); setEditText(n.content); }} style={{ borderRadius: 8, padding: "8px 16px", background: "#e6f1ff", color: BLUE, border: "1px solid #91caff" }}>修改</button>
                <button onClick={() => del(n.id)} style={{ borderRadius: 8, padding: "8px 16px", background: "#fff1f0", color: "#d4380d", border: "1px solid #ffa39e" }}>删除</button>
              </div>
            </>
          )}
        </div>
      ))}
    </section>
  );
}
