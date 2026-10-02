/** 健康证模板：白底 9:16 竖版，按样图还原（正面+背面+二维码）。 */

interface Props {
  name: string;
  gender: string;
  mask: string;
  province: string;
  unit: string;
  date: string;
  photo: string;
  qr: string;
  certNo: string;
}

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, "0")}月${String(d.getDate()).padStart(2, "0")}日`;
};

/**
 * 白底 9:16 健康证长图（id=cert-pic 供下载按钮导出）。
 */
export default function CertPreview(p: Props) {
  return (
    <div id="cert-pic" style={{ width: "100%", maxWidth: 360, margin: "0 auto", background: "#fff", padding: 10, paddingBottom: 14, overflow: "visible", display: "flex", flexDirection: "column", gap: 6, borderRadius: 12, WebkitTextSizeAdjust: "100%", textSizeAdjust: "100%" }}>
      {/* 正面 */}
      <div style={{ flex: "none", height: 312, border: "2px solid #111", borderRadius: 12, padding: "10px 10px 12px", position: "relative", background: "#fff", overflow: "hidden", minHeight: 0 }}>
        <h2 style={{ textAlign: "center", fontSize: 16, fontWeight: 700, margin: "0 0 6px", fontFamily: "serif" }}>
          {p.province}食品从业人员健康证明
        </h2>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1, fontSize: 12, lineHeight: 1.6, fontFamily: "serif", position: "relative" }}>
            <div>姓名：{p.name}　性别：{p.gender}</div>
            <div>身份证号码：{p.mask}<br />(或其他有效证明)</div>
            <div>体检单位盖章：</div>
            <div>单位名称：{p.unit}</div>
            <div>体检日期：{fmtDate(p.date)}(有效期壹年)</div>
            <div>编号：{p.certNo}</div>
            {/* 红章 */}
            <div style={{
              position: "absolute", left: 90, top: 52, width: 88, height: 88, borderRadius: "50%",
              border: "2px solid rgba(200,30,30,.75)", color: "rgba(200,30,30,.8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700, transform: "rotate(-8deg)", textAlign: "center", lineHeight: 1.5,
            }}>
              <span>★<br />{p.unit}体检专用章</span>
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {p.photo ? <img src={p.photo} alt="photo" style={{ width: 72, height: 96, objectFit: "cover", border: "1px solid #999" }} /> : <div style={{ width: 72, height: 96, border: "1px dashed #999" }} />}
        </div>
      </div>
      {/* 背面 */}
      <div style={{ flex: "none", height: 150, border: "2px solid #111", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", background: "#fff", minHeight: 0 }}>
        <div style={{ textAlign: "center", fontSize: 18, fontFamily: "serif", lineHeight: 1.8 }}>
          {p.province}食品从业人员<br />健康证明
        </div>
        {[0, 1].map((i) => (
          <span key={i} style={{ position: "absolute", bottom: 24 + i * 10, left: -8 + i * 130, transform: "rotate(-30deg)", color: "rgba(0,0,0,.08)", fontSize: 13, whiteSpace: "nowrap" }}>
            {p.unit}
          </span>
        ))}
      </div>
      {/* 二维码+编号 */}
      <div style={{ flexShrink: 0, textAlign: "center", border: "2px solid #111", borderRadius: 12, padding: "12px 10px 10px", background: "#fff" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {p.qr && <img src={p.qr} alt="qr" style={{ width: 150, height: 150, margin: "0 auto", display: "block" }} />}
      </div>
    </div>
  );
}
