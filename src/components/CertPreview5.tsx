/**
 * 佛山市疾病预防控制中心 食品从业人员健康体检合格证（模板5）。
 * 按样张还原：浅蓝卡片1（CDC抬头 + 7行信息 + 右侧照片与二维码 + 中部红章）
 * + 浅蓝卡片2（注意事项四条，衬淡蓝CDC水印）。
 * 仅姓名/照片/编号/发证日期随办证变化，其余信息与文字全部固定。
 */

interface Props {
  certNo: string;
  name: string;
  photo: string;
  qr: string;
  from: string;
}

const FONT = "'PingFang SC','Hiragino Sans GB','Microsoft YaHei','Heiti SC',sans-serif";
/** 卡片底色与描边（浅蓝风格） */
const CARD_BG = "#dbeaf8";
const CARD_BORDER = "#7fb2d9";
const HEAD_BG = "linear-gradient(180deg,#f6fbff 0%,#cfe4f7 100%)";
const TITLE_INK = "#0d2f6b";
/** 发证机构固定不变 */
const ORG = "佛山市疾病预防控制中心";

/** 统一成 YYYY-MM-DD */
function fmtDate(v: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v || "");
  return m ? `${m[1]}-${m[2]}-${m[3]}` : v || "";
}

/** 左上角CDC徽标（简化绘制：上下两道蓝弧 + CDC字 + 红点）。宽度随视口收缩，窄屏不挤标题 */
function CdcLogo() {
  return (
    <svg width={78} height={34} viewBox="0 0 78 34" style={{ display: "block", flexShrink: 0, width: "min(78px, 19vw)", height: "auto" }}>
      <path d="M2,13 A 26,12 0 0 1 52,9" fill="none" stroke="#1b3f8b" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M3,27 A 26,12 0 0 0 52,29" fill="none" stroke="#2f9be8" strokeWidth="4.5" strokeLinecap="round" />
      <text
        x="32"
        y="25"
        textAnchor="middle"
        fontSize="18"
        fontWeight="900"
        fontStyle="italic"
        fill="#0d2f6b"
        fontFamily="Arial,Helvetica,sans-serif"
      >
        CDC
      </text>
      <circle cx="58" cy="17" r="4.5" fill="#d81e06" />
    </svg>
  );
}

/**
 * 红色公章：机构名沿上弧排布（SVG textPath），中间五角星，下方「体检专用章」。
 * 尺寸 116 与位置是按手机预览宽度反推的，放大后会压到照片。
 */
function OrgStamp() {
  return (
    <svg width={116} height={116} viewBox="0 0 116 116" style={{ display: "block" }}>
      <defs>
        <path id="fsStampArc" d="M 16,58 A 42,42 0 0 1 100,58" />
      </defs>
      <circle cx="58" cy="58" r="54" fill="none" stroke="rgba(206,32,32,.85)" strokeWidth="2.5" />
      <text fill="rgba(206,32,32,.9)" fontSize="10.5" fontWeight="700" fontFamily={FONT}>
        <textPath href="#fsStampArc" startOffset="50%" textAnchor="middle">
          佛山市疾病预防控制中心
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

/** 卡片2底部的淡蓝CDC水印 */
function CdcWatermark() {
  return (
    <svg
      width={150}
      height={150}
      viewBox="0 0 150 150"
      style={{ position: "absolute", left: "50%", top: "50%", marginLeft: -75, marginTop: -75, opacity: 0.14, pointerEvents: "none" }}
    >
      <circle cx="75" cy="75" r="62" fill="none" stroke="#2f6fb5" strokeWidth="6" />
      <path d="M28,68 A 44,24 0 0 1 118,60" fill="none" stroke="#1b3f8b" strokeWidth="8" strokeLinecap="round" />
      <path d="M30,92 A 44,24 0 0 0 118,98" fill="none" stroke="#2f9be8" strokeWidth="8" strokeLinecap="round" />
      <text x="75" y="88" textAnchor="middle" fontSize="30" fontWeight="900" fontStyle="italic" fill="#0d2f6b" fontFamily="Arial,Helvetica,sans-serif">
        CDC
      </text>
    </svg>
  );
}

export default function CertPreview5(p: Props) {
  const rowStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1.6,
    color: "#111",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };
  const notes = [
    "1、随身携带，持证上岗，自觉接受监督检查。",
    "2、妥善保管，如遗失或损坏及时补办。",
    "3、本证自体检（发证）起，有效期一年。",
    "4、再次体检或换证需在本证有效期满一年之前的一个月内办理，过期无效。",
  ];

  return (
    <div
      id="cert-pic"
      style={{
        width: "100%",
        maxWidth: 420,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        fontFamily: FONT,
        WebkitTextSizeAdjust: "100%",
        textSizeAdjust: "100%",
      }}
    >
      {/* ========== 卡片1：证件 ========== */}
      <div style={{ background: CARD_BG, border: `2px solid ${CARD_BORDER}`, borderRadius: 8, overflow: "hidden" }}>
        <div style={{ height: 52, background: HEAD_BG, display: "flex", alignItems: "center", gap: 8, padding: "0 10px" }}>
          <CdcLogo />
          <div style={{ flex: 1, minWidth: 0, textAlign: "center", fontSize: "min(19px, 4.4vw)", fontWeight: 900, color: TITLE_INK, letterSpacing: 0.5, whiteSpace: "nowrap" }}>
            食品从业人员健康体检合格证
          </div>
        </div>

        <div style={{ display: "flex", position: "relative", padding: "10px 12px 12px" }}>
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
            <div style={rowStyle}>发证机构：{ORG}</div>
          </div>

          {/* 红章：用 right 定位，右侧留到照片之外，避免被照片压住 */}
          <div style={{ position: "absolute", right: 148, top: 44, zIndex: 2, pointerEvents: "none" }}>
            <OrgStamp />
          </div>

          {/* 右：照片 + 二维码 */}
          <div style={{ width: 96, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 3 }}>
            <div style={{ width: 87, height: 105, border: "1px solid #8a9bb0", background: "#f4f4f4", overflow: "hidden", flexShrink: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.photo ? (
                <img src={p.photo} alt="photo" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              ) : null}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 2, marginTop: 6 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.qr ? <img src={p.qr} alt="qr" style={{ width: 72, height: 72, display: "block", background: "#fff" }} /> : null}
              <span style={{ fontSize: 8, color: "#111", writingMode: "vertical-rl", letterSpacing: 1 }}>二维码</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========== 卡片2：注意事项 ========== */}
      <div style={{ background: CARD_BG, border: `2px solid ${CARD_BORDER}`, borderRadius: 8, overflow: "hidden" }}>
        <div style={{ height: 52, background: HEAD_BG, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21, fontWeight: 900, color: "#0b2340", letterSpacing: 8 }}>
          注意事项
        </div>
        <div style={{ position: "relative", padding: "14px 18px 20px" }}>
          <CdcWatermark />
          <div style={{ position: "relative", zIndex: 1, fontSize: 12.5, fontWeight: 700, lineHeight: 1.7, color: "#0a0a0a" }}>
            {notes.map((t) => (
              <div key={t} style={{ marginBottom: 10 }}>
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
