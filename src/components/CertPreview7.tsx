/**
 * 从业人员健康检查合格证（模板7“美团乐山”）。
 * 按样张还原：白卡 + 左上绿徽标 + 绿标题 + 左侧5行（编号/姓名性别同行/从业类别美团外卖/发证日期/有效期限=发证+1年-1天）
 * + 中部红章 + 右侧证件照 + 底部绿条地址。
 * 本模板不要二维码：不生成验真 token，组件也没有 qr 属性。
 * 徽标环字按确认的“乐山老年病专科医院”绘制（样张原字模糊，近似还原）。
 */

interface Props {
  certNo: string;
  name: string;
  gender: string;
  photo: string;
  from: string;
  to: string;
}

const FONT = "'PingFang SC','Hiragino Sans GB','Microsoft YaHei','Heiti SC',sans-serif";
const GREEN = "#0d7a3f";
const BAR_GREEN = "#1e8a49";
/** 底栏地址固定不变（发证单位乐山老年病专科医院只存库，用于验真页） */
const ADDR = "乐山市市中区人民西路283号";

/**
 * 红色公章：上弧“疾病预防控制中心”（确认文字），中间五角星，下方「体检专用章」。
 * 尺寸 116 与位置是按手机预览宽度反推的，放大后会压到照片。
 */
function LeshanStamp() {
  return (
    <svg width={100} height={100} viewBox="0 0 116 116" style={{ display: "block" }}>
      <defs>
        <path id="mlStampArc" d="M 18,58 A 40,40 0 0 1 98,58" />
      </defs>
      <circle cx="58" cy="58" r="54" fill="none" stroke="rgba(206,32,32,.85)" strokeWidth="2.5" />
      <text fill="rgba(206,32,32,.9)" fontSize="11" fontWeight="700" fontFamily={FONT}>
        <textPath href="#mlStampArc" startOffset="50%" textAnchor="middle">
          疾病预防控制中心
        </textPath>
      </text>
      <text x="58" y="76" textAnchor="middle" fill="rgba(206,32,32,.95)" fontSize="30">
        ★
      </text>
      <text x="58" y="96" textAnchor="middle" fill="rgba(206,32,32,.95)" fontSize="11" fontWeight="700" fontFamily={FONT}>
        体检专用章
      </text>
    </svg>
  );
}

/** 左上绿徽标：双环 + “乐山老年病专科医院”环字 + 中心绿十字（样张原徽标模糊，近似还原） */
function LeshanEmblem() {
  return (
    <svg width={64} height={64} viewBox="0 0 64 64" style={{ display: "block", flexShrink: 0 }}>
      <defs>
        <path id="mlEmblemArc" d="M 8,32 A 24,24 0 0 1 56,32" />
      </defs>
      <circle cx="32" cy="32" r="30" fill="#fff" stroke={GREEN} strokeWidth="2.5" />
      <circle cx="32" cy="32" r="24" fill="none" stroke={GREEN} strokeWidth="1" />
      <text fill={GREEN} fontSize="7" fontWeight="700" fontFamily={FONT}>
        <textPath href="#mlEmblemArc" startOffset="50%" textAnchor="middle">
          乐山老年病专科医院
        </textPath>
      </text>
      <rect x="28" y="22" width="8" height="20" rx="1" fill={GREEN} />
      <rect x="22" y="28" width="20" height="8" rx="1" fill={GREEN} />
    </svg>
  );
}

/** 正文底衬：淡紫灰弧形水印（样张底纹近似还原） */
function SwooshBackdrop() {
  return (
    <svg
      width={260}
      height={120}
      viewBox="0 0 260 120"
      style={{ position: "absolute", left: 0, top: 24, opacity: 0.14, pointerEvents: "none", overflow: "hidden" }}
    >
      <path d="M 0,95 C 60,60 140,100 250,30" fill="none" stroke="#8a7fb5" strokeWidth="16" />
      <path d="M 0,110 C 60,75 140,115 250,45" fill="none" stroke="#8a7fb5" strokeWidth="6" />
    </svg>
  );
}

export default function CertPreview7(p: Props) {
  const rowStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 1.75,
    color: "#111",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  return (
    <div
      id="cert-pic"
      style={{
        width: "100%",
        maxWidth: 420,
        margin: "0 auto",
        background: "#fff",
        border: "1px solid #cfe0d4",
        borderRadius: 10,
        overflow: "hidden",
        fontFamily: FONT,
        WebkitTextSizeAdjust: "100%",
        textSizeAdjust: "100%",
      }}
    >
      {/* 顶：徽标 + 绿标题 */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px 6px" }}>
        <LeshanEmblem />
        <div
          style={{
            fontSize: "min(21px, 5vw)",
            fontWeight: 900,
            color: GREEN,
            letterSpacing: 1,
            whiteSpace: "nowrap",
          }}
        >
          从业人员健康检查合格证
        </div>
      </div>

      <div style={{ display: "flex", position: "relative", overflow: "hidden", padding: "6px 14px 12px" }}>
        <SwooshBackdrop />
        {/* 左：信息栏 */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={rowStyle}>编 号：{p.certNo}</div>
          <div style={{ ...rowStyle, display: "flex", gap: 18 }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>姓 名：{p.name}</span>
            <span style={{ flexShrink: 0 }}>性 别：{p.gender}</span>
          </div>
          <div style={rowStyle}>从业类别：美团外卖</div>
          <div style={rowStyle}>发证日期：{p.from}</div>
          <div style={rowStyle}>有效期限：{p.to}</div>
        </div>

        {/* 红章：靠右压在文字尾部上方（与样张一致，红章本就盖在字上），右缘留到照片之外 */}
        <div style={{ position: "absolute", right: 124, top: 34, zIndex: 2, pointerEvents: "none" }}>
          <LeshanStamp />
        </div>

        {/* 右：证件照（本模板无二维码） */}
        <div style={{ width: 104, flexShrink: 0, display: "flex", justifyContent: "center", position: "relative", zIndex: 3 }}>
          <div style={{ width: 100, height: 128, border: "1px solid #8a9bb0", background: "#3a7bd5", overflow: "hidden", borderRadius: 4, flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {p.photo ? (
              <img src={p.photo} alt="photo" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            ) : null}
          </div>
        </div>
      </div>

      {/* 底：绿条地址 */}
      <div
        style={{
          background: BAR_GREEN,
          color: "#fff",
          fontSize: 14,
          fontWeight: 800,
          textAlign: "center",
          padding: "8px 10px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        地址：{ADDR}
      </div>
    </div>
  );
}
