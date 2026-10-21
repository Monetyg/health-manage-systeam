"use client";
import { useCallback, useEffect, useState } from "react";

const BLUE = "#1677ff";

interface Row {
  username: string;
  status: string;
  keysTotal: number;
  keysUsed: number;
  certsTotal: number;
}

type Range = "all" | "1d" | "3d";

const TABS: { key: Range; label: string }[] = [
  { key: "all", label: "累计" },
  { key: "1d", label: "近1天" },
  { key: "3d", label: "近3天" },
];

const card: React.CSSProperties = { background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #e8f0fe", boxShadow: "0 2px 12px rgba(22,119,255,.08)" };

/** 数字块 */
function Num({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div style={{ flex: 1, minWidth: 78, background: "#f5f9ff", borderRadius: 12, padding: "10px 12px" }}>
      <div style={{ color: "#7a8bb0", fontSize: 12 }}>{label}</div>
      <div style={{ color: BLUE, fontSize: 22, fontWeight: 800 }}>{value}</div>
      {hint ? <div style={{ color: "#9db1d8", fontSize: 11 }}>{hint}</div> : null}
    </div>
  );
}

/** 一级看板：各二级的卡密与办证统计，可按累计 / 近1天 / 近3天切换 */
export function StatsBoard() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [range, setRange] = useState<Range>("all");
  const [failed, setFailed] = useState(false);

  const load = useCallback(async (r: Range) => {
    try {
      const res = await fetch(`/api/admin/stats?range=${r}`);
      if (!res.ok) { setFailed(true); setRows([]); return; }
      setFailed(false);
      setRows(await res.json());
    } catch {
      setFailed(true);
      setRows([]);
    }
  }, []);

  useEffect(() => { load(range); }, [range, load]);

  /** 接口失败也保留卡片骨架，避免整块消失让人以为功能没了 */
  if (rows === null) {
    return (
      <section style={card}>
        <div style={{ fontWeight: 800, marginBottom: 12 }}>二级数据统计</div>
        <div style={{ color: "#7a8bb0" }}>加载中…</div>
      </section>
    );
  }

  const totalKeys = rows.reduce((s, r) => s + r.keysTotal, 0);
  const totalUsed = rows.reduce((s, r) => s + r.keysUsed, 0);
  const totalCerts = rows.reduce((s, r) => s + r.certsTotal, 0);

  return (
    <section style={card}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontWeight: 800 }}>二级数据统计</div>
        <div style={{ display: "flex", gap: 6 }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setRange(t.key)}
              style={{
                borderRadius: 20, padding: "6px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                border: `1px solid ${range === t.key ? BLUE : "#d0ddf5"}`,
                background: range === t.key ? BLUE : "#fff",
                color: range === t.key ? "#fff" : "#7a8bb0",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {failed ? <div style={{ color: "#d4380d", marginBottom: 12 }}>统计加载失败，请刷新重试</div> : null}

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <Num label="卡密总数" value={totalKeys} hint={range === "all" ? "全部" : range === "1d" ? "最近24小时" : "最近72小时"} />
        <Num label="已激活" value={totalUsed} />
        <Num label="健康证数" value={totalCerts} />
      </div>

      {rows.length === 0 ? <div style={{ color: "#7a8bb0" }}>还没有二级账号</div> : null}
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
            <Num label="卡密" value={r.keysTotal} />
            <Num label="已激活" value={r.keysUsed} />
            <Num label="健康证" value={r.certsTotal} />
          </div>
        </div>
      ))}
    </section>
  );
}
