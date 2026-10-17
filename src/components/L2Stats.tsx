"use client";
import { useEffect, useState } from "react";

const BLUE = "#1677ff";

interface Row {
  username: string;
  status: string;
  keysTotal: number;
  keysUsed: number;
  certsTotal: number;
}

const card: React.CSSProperties = { background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #e8f0fe", boxShadow: "0 2px 12px rgba(22,119,255,.08)" };

/** 数字块 */
function Num({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div style={{ flex: 1, minWidth: 90, background: "#f5f9ff", borderRadius: 12, padding: "12px 14px" }}>
      <div style={{ color: "#7a8bb0", fontSize: 12 }}>{label}</div>
      <div style={{ color: BLUE, fontSize: 24, fontWeight: 800 }}>{value}</div>
      {hint ? <div style={{ color: "#9db1d8", fontSize: 11 }}>{hint}</div> : null}
    </div>
  );
}

/** 一级看板：各二级的卡密与办证统计 */
export function StatsBoard() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/admin/stats");
      if (r.status === 401 || r.status === 403) { setErr(""); return; }
      if (r.ok) setRows(await r.json());
      else setErr("加载失败");
    })();
  }, []);

  if (err) return null;
  if (!rows) return null;
  if (rows.length === 0) {
    return (
      <section style={card}>
        <div style={{ fontWeight: 800, marginBottom: 12 }}>二级数据统计</div>
        <div style={{ color: "#7a8bb0" }}>还没有二级账号</div>
      </section>
    );
  }
  const totalKeys = rows.reduce((s, r) => s + r.keysTotal, 0);
  const totalUsed = rows.reduce((s, r) => s + r.keysUsed, 0);
  const totalCerts = rows.reduce((s, r) => s + r.certsTotal, 0);

  return (
    <section style={card}>
      <div style={{ fontWeight: 800, marginBottom: 12 }}>二级数据统计</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <Num label="卡密总数" value={totalKeys} />
        <Num label="已激活" value={totalUsed} />
        <Num label="健康证数" value={totalCerts} />
      </div>
      {rows.map((r) => (
        <div key={r.username} style={{ border: "1px solid #e8f0fe", borderRadius: 12, padding: 12, marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <b>{r.username}</b>
            <span
              style={{
                fontSize: 12, fontWeight: 700, borderRadius: 20, padding: "2px 10px",
                background: r.status === "disabled" ? "#fff1f0" : "#e6f7ee",
                color: r.status === "disabled" ? "#d4380d" : "#1a9e54",
              }}
            >
              {r.status === "disabled" ? "已禁用" : "已启用"}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Num label="卡密" value={r.keysTotal} hint="累计" />
            <Num label="已激活" value={r.keysUsed} />
            <Num label="健康证" value={r.certsTotal} />
          </div>
        </div>
      ))}
    </section>
  );
}