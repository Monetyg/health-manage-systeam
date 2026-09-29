/** 电子认证版健康证（重做）：对标样图，左7行虚线条目 + 右照片/码 + 防伪标 + 彩虹底 */

interface Props {
  certNo: string;
  name: string;
  gender: string;
  age: string;
  category: string;
  organ: string;
  from: string;
  to: string;
  photo: string;
  qr: string;
}

const FONT = "-apple-system,'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif";
const INK = "#222";
const GRAY = "#8b9096";

/**
 * 16:9 横版电子长图（id=cert-pic 供下载导出）。
 * 左列7行等分撑满，标签定宽、虚线对齐；人像框完整显示不裁剪。
 */
export default function CertPreview2(p: Props) {
  const rows: Array<[string, React.ReactNode]> = [
    ["编号：", <span key="n" style={{ letterSpacing: 1 }}>{p.certNo}</span>],
    ["姓名：", <span key="m" style={{ fontSize: 11.5 }}>{p.name}</span>],
    ["性别：", p.gender],
    ["年龄：", p.age],
    ["类别：", p.category],
    ["体检机构：", <span key="o" style={{ fontSize: 10 }}>{p.organ}</span>],
    ["有效期：", <span key="v" style={{ fontSize: 9.5 }}><b style={{ color: "#1a9e54" }}>{p.from}</b> <span style={{ color: INK }}>至</span> <b style={{ color: "#1a9e54" }}>{p.to}</b></span>],
  ];
  return (
    <div id="cert-pic" style={{ width: "100%", maxWidth: 720, margin: "0 auto", aspectRatio: "16/9", background: "#fff", borderRadius: 10, overflow: "hidden", display: "flex", flexDirection: "column", fontFamily: FONT, WebkitTextSizeAdjust: "100%", textSizeAdjust: "100%" }}>
      {/* 深蓝头 */}
      <div style={{ background: "#1e3f5f", color: "#fff", display: "flex", alignItems: "center", padding: "6px 14px", borderBottom: "2px solid #2f9be8", flexShrink: 0 }}>
        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#fff", color: "#1e3f5f", fontWeight: 900, fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>卫</div>
        <div style={{ flex: 1, textAlign: "center", fontSize: 17, fontWeight: 800, letterSpacing: 2, marginLeft: -30, whiteSpace: "nowrap" }}>从业人员健康证明</div>
      </div>
      {/* 体 */}
      <div style={{ flex: 1, display: "flex", minHeight: 0, position: "relative" }}>
        <span style={{ position: "absolute", top: "30%", left: 0, right: 0, textAlign: "center", transform: "rotate(-14deg)", color: "rgba(30,63,95,.06)", fontSize: 46, fontWeight: 900, whiteSpace: "nowrap", pointerEvents: "none" }}>健康证明</span>
        {/* 左：7行等分 */}
        <div style={{ flex: 1.9, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column", padding: "2px 6px 4px 12px" }}>
          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            {rows.map(([lab, val], i) => (
              <div key={i} style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", borderBottom: "1px dashed #c4c4c4", overflow: "hidden" }}>
                <span style={{ color: "#d33", fontSize: 10, marginRight: 6, flexShrink: 0 }}>•</span>
                <span style={{ color: GRAY, width: 68, flexShrink: 0, fontSize: 10, whiteSpace: "nowrap", overflow: "hidden" }}>{lab}</span>
                <span style={{ color: INK, fontWeight: 700, fontSize: 10, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0, flex: 1 }}>{val}</span>
              </div>
            ))}
          </div>
          {/* 防伪标：固定左下 */}
          <div style={{ display: "flex", gap: 10, paddingTop: 5, flexShrink: 0 }}>
            {[["防", "#2f9be8"], ["伪", "#1a9e54"], ["标", "#7b4fc9"]].map(([t, c]) => (
              <span key={t} style={{ width: 28, height: 28, borderRadius: "50%", background: c as string, color: "#fff", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>{t}</span>
            ))}
          </div>
        </div>
        {/* 右：照片 + 码 */}
        <div style={{ width: "30%", flexShrink: 0, minHeight: 0, display: "flex", flexDirection: "column", padding: "6px 10px 6px 2px" }}>
          <div style={{ flex: 1.25, minHeight: 0, background: "#fff", overflow: "hidden" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {p.photo
              ? <img src={p.photo} alt="photo" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
              : <div style={{ width: "100%", height: "100%", border: "1px dashed #999" }} />}
          </div>
          <div style={{ flex: 1, minHeight: 0, position: "relative", marginTop: 6 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {p.qr && <img src={p.qr} alt="qr" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />}
            <div style={{ position: "absolute", left: -24, bottom: -8, width: 38, height: 38, borderRadius: "50%", border: "1.5px solid rgba(200,30,30,.7)", color: "rgba(200,30,30,.85)", fontSize: 8.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,.9)", zIndex: 2 }}>电子认证</div>
          </div>
        </div>
      </div>
      {/* 彩虹底边 */}
      <div style={{ height: 7, background: "linear-gradient(90deg,#e33,#e80,#3a3,#39e,#93c)", flexShrink: 0 }} />
    </div>
  );
}
