/**
 * 从业人员预防性健康检查合格证明（模板6“小鸟商洛”）。
 * 按样张还原：实心蓝顶栏 + 浅蓝正文（7行信息，左上编号为身份证号）+ 底衬检疫徽章水印与斜排“卫检”字样
 * + 中部红章（上弧“从业人员预防性健康体检专用章”）+ 右侧照片与二维码。
 * 仅姓名/身份证号（即编号）/照片随办证变化，其余全部固定。
 */

interface Props {
  certNo: string;
  name: string;
  photo: string;
  qr: string;
  from: string;
}

const FONT = "'PingFang SC','Hiragino Sans GB','Microsoft YaHei','Heiti SC',sans-serif";
/** 顶栏实心蓝与正文浅蓝 */
const HEAD_BG = "#2378d2";
const CARD_BG = "#d7e9fa";
const CARD_BORDER = "#7fb2d9";
/** 发证机构固定不变 */
const ORG = "商洛市疾病预防控制中心";

/** 统一成 YYYY-MM-DD */
function fmtDate(v: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v || "");
  return m ? `${m[1]}-${m[2]}-${m[3]}` : v || "";
}

/**
 * 红色公章：13字上弧排布（SVG textPath），中间五角星，下方「体检专用章」。
 * 尺寸 116 与位置是按手机预览宽度反推的，放大后会压到照片。
 */
function OrgStamp() {
  return (
    <svg width={116} height={116} viewBox="0 0 116 116" style={{ display: "block" }}>
      <defs>
        <path id="slStampArc" d="M 16,58 A 42,42 0 0 1 100,58" />
      </defs>
      <circle cx="58" cy="58" r="54" fill="none" stroke="rgba(206,32,32,.85)" strokeWidth="2.5" />
      <text fill="rgba(206,32,32,.9)" fontSize="9" fontWeight="700" fontFamily={FONT}>
        <textPath href="#slStampArc" startOffset="50%" textAnchor="middle">
          从业人员预防性健康体检专用章
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

/** 正文底衬：圆形检疫徽章 + 环形英文（淡色水印） */
function InspectionWatermark() {
  return (
    <svg
      width={190}
      height={190}
      viewBox="0 0 190 190"
      style={{ position: "absolute", left: 8, top: "50%", marginTop: -95, opacity: 0.16, pointerEvents: "none" }}
    >
      <defs>
        <path id="slRingTop" d="M 25,95 A 70,70 0 0 1 165,95" />
        <path id="slRingBottom" d="M 35,95 A 60,60 0 0 0 155,95" />
      </defs>
      <circle cx="95" cy="95" r="80" fill="none" stroke="#2f6fb5" strokeWidth="5" />
      <circle cx="95" cy="95" r="66" fill="none" stroke="#2f6fb5" strokeWidth="2" />
      <text fill="#2f6fb5" fontSize="12" fontWeight="700" fontFamily="Arial,Helvetica,sans-serif" letterSpacing="2">
        <textPath href="#slRingTop" startOffset="50%" textAnchor="middle">
          HEALTH INSPECTION
        </textPath>
      </text>
      <text fill="#2f6fb5" fontSize="20" fontWeight="900" fontFamily={FONT} textAnchor="middle">
        <textPath href="#slRingBottom" startOffset="50%" textAnchor="middle">
          卫生监督
        </textPath>
      </text>
      <text x="95" y="108" textAnchor="middle" fill="#2f6fb5" fontSize="34">
        ★
      </text>
    </svg>
  );
}

/** 斜排重复的“卫检”字样（淡色底纹） */
function WeiJianBackdrop() {
  const words = [
    { left: 150, top: 6 },
    { left: 210, top: 66 },
    { left: 120, top: 126 },
    { left: 230, top: 150 },
  ];
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {words.map((w, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: w.left,
            top: w.top,
            transform: "rotate(-28deg)",
            fontSize: 26,
            fontWeight: 900,
            letterSpacing: 6,
            color: "#2f6fb5",
            opacity: 0.1,
            whiteSpace: "nowrap",
          }}
        >
          卫检
        </span>
      ))}
    </div>
  );
}

export default function CertPreview6(p: Props) {
  const rowStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1.6,
    color: "#111",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };
  /** 发证机构一行 15 字（含标点），字号收半档保证不换行（定版时按样张可换行，这里按确认意见挤进一行） */
  const organStyle: React.CSSProperties = { ...rowStyle, fontSize: 11.5 };

  return (
    <div
      id="cert-pic"
      style={{
        width: "100%",
        maxWidth: 420,
        margin: "0 auto",
        background: CARD_BG,
        border: `2px solid ${CARD_BORDER}`,
        borderRadius: 8,
        overflow: "hidden",
        fontFamily: FONT,
        WebkitTextSizeAdjust: "100%",
        textSizeAdjust: "100%",
      }}
    >
      <div
        style={{
          height: 52,
          background: HEAD_BG,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "min(19px, 4.4vw)",
          fontWeight: 900,
          color: "#fff",
          letterSpacing: 1,
          whiteSpace: "nowrap",
          padding: "0 10px",
        }}
      >
        从业人员预防性健康检查合格证明
      </div>

      <div style={{ display: "flex", position: "relative", padding: "10px 12px 12px" }}>
        <InspectionWatermark />
        <WeiJianBackdrop />
        {/* 左：信息栏（撑满主体高度并等分铺开） */}
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
          <div style={rowStyle}>姓 名：{p.name}</div>
          <div style={rowStyle}>从业类别：食品</div>
          <div style={rowStyle}>检查结果：合格</div>
          <div style={rowStyle}>发证日期：{fmtDate(p.from)}</div>
          <div style={rowStyle}>有效期限：一年</div>
          <div style={organStyle}>发证机构：{ORG}</div>
        </div>

        {/* 红章：右移避开“发证日期”一行的字形，右侧仍与照片保持间距，避免被照片压住 */}
        <div style={{ position: "absolute", right: 132, top: 44, zIndex: 2, pointerEvents: "none" }}>
          <OrgStamp />
        </div>

        {/* 右：照片 + 二维码（样张二维码旁无竖排文字） */}
        <div style={{ width: 96, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 3 }}>
          <div style={{ width: 87, height: 105, border: "1px solid #8a9bb0", background: "#f4f4f4", overflow: "hidden", flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {p.photo ? (
              <img src={p.photo} alt="photo" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            ) : null}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {p.qr ? <img src={p.qr} alt="qr" style={{ width: 84, height: 84, display: "block", background: "#fff", marginTop: 6 }} /> : null}
        </div>
      </div>
    </div>
  );
}
