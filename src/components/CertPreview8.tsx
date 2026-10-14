/**
 * 河北省食品药品从业人员健康合格证明（模板8“三通保定”）。
 * 按样张还原：顶部证套（红字两行 + 黑字“沿刻痕处向后掰开” + 左右竖排黑字）+
 * 白底正文（蓝标题 + 姓名性别同行/类别/编号/有效期限/体检单位 + 中部红章）+
 * 右侧照片与二维码（二维码在左、照片在右）。
 * 编号为日期+序号的12位纯数字，由办证接口生成；章上弧按确认的“白沟新城航天医院”绘制。
 */

interface Props {
  certNo: string;
  name: string;
  gender: string;
  photo: string;
  qr: string;
  to: string;
}

const FONT = "'PingFang SC','Hiragino Sans GB','Microsoft YaHei','Heiti SC',sans-serif";
const TITLE_INK = "#2f55a5";
const UNIT = "保定市疾病预防控制中心";

/**
 * 红色公章：上弧“白沟新城航天医院”（确认文字），中间五角星，下方「体检专用章」。
 * 尺寸 104 与位置是按手机预览宽度反推的，放大后会压到照片。
 */
function BaodingStamp() {
  return (
    <svg width={104} height={104} viewBox="0 0 116 116" style={{ display: "block" }}>
      <defs>
        <path id="stStampArc" d="M 18,58 A 40,40 0 0 1 98,58" />
      </defs>
      <circle cx="58" cy="58" r="54" fill="none" stroke="rgba(206,32,32,.85)" strokeWidth="2.5" />
      <text fill="rgba(206,32,32,.9)" fontSize="12" fontWeight="700" fontFamily={FONT}>
        <textPath href="#stStampArc" startOffset="50%" textAnchor="middle">
          白沟新城航天医院
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

export default function CertPreview8(p: Props) {
  const rowStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1.72,
    color: "#111",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };
  /** 证套左右竖排字 */
  const sideStyle: React.CSSProperties = {
    writingMode: "vertical-rl",
    fontSize: 17,
    fontWeight: 800,
    color: "#111",
    letterSpacing: 6,
    whiteSpace: "nowrap",
    flexShrink: 0,
    alignSelf: "stretch",
    display: "flex",
    alignItems: "center",
  };

  return (
    <div
      id="cert-pic"
      style={{
        width: "100%",
        maxWidth: 440,
        margin: "0 auto",
        background: "#fff",
        border: "1px solid #d5dbe5",
        borderRadius: 10,
        overflow: "hidden",
        fontFamily: FONT,
        WebkitTextSizeAdjust: "100%",
        textSizeAdjust: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ========== 证套：红字标语 + 黑字撕口线 + 左右竖排 ========== */}
      <div style={{ display: "flex", padding: "10px 8px 8px" }}>
        <div style={sideStyle}>沿刻痕处向后掰开</div>
        <div style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
          <div style={{ fontSize: "min(20px, 4.8vw)", fontWeight: 900, color: "#c02020", letterSpacing: 6, whiteSpace: "nowrap" }}>
            关注民生健康
          </div>
          <div style={{ fontSize: "min(20px, 4.8vw)", fontWeight: 900, color: "#c02020", letterSpacing: 4, whiteSpace: "nowrap", marginTop: 8, paddingLeft: "18%" }}>
            共筑和谐社会
          </div>
          <div style={{ fontSize: "min(16px, 3.8vw)", fontWeight: 800, color: "#111", letterSpacing: 8, whiteSpace: "nowrap", marginTop: 10 }}>
            沿刻痕处向后掰开
          </div>
        </div>
        <div style={sideStyle}>沿刻痕处向后掰开</div>
      </div>
      <div style={{ borderTop: "1px dashed #c8cfda", margin: "0 6px" }} />

      {/* ========== 正文：蓝标题 + 信息 + 章 + 二维码照片 ========== */}
      <div style={{ padding: "10px 12px 14px" }}>
        <div
          style={{
            fontSize: "min(17px, 4.1vw)",
            fontWeight: 900,
            color: TITLE_INK,
            textAlign: "center",
            letterSpacing: 1,
            whiteSpace: "nowrap",
            marginBottom: 8,
          }}
        >
          河北省食品药品从业人员健康合格证明
        </div>

        <div style={{ display: "flex", position: "relative" }}>
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
            <div style={{ ...rowStyle, display: "flex", gap: 14 }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>姓 名：{p.name}</span>
              <span style={{ flexShrink: 0 }}>性 别：{p.gender}</span>
            </div>
            <div style={rowStyle}>从业类别：食品</div>
            <div style={rowStyle}>编 号：{p.certNo}</div>
            <div style={rowStyle}>有效期限：{p.to}</div>
            <div style={{ ...rowStyle, display: "flex" }}>
              <span style={{ flexShrink: 0 }}>体检单位：</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{UNIT}</span>
            </div>
          </div>

          {/* 红章：压在编号/有效期行尾部上方（与样张一致，本就盖在字上），右缘留到二维码之外 */}
          <div style={{ position: "absolute", right: 142, top: 44, zIndex: 2, pointerEvents: "none" }}>
            <BaodingStamp />
          </div>

          {/* 右：二维码在左、照片在右（与样张一致） */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 4, flexShrink: 0, position: "relative", zIndex: 3 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {p.qr ? <img src={p.qr} alt="qr" style={{ width: 60, height: 60, display: "block", background: "#fff", marginTop: 30 }} /> : null}
            <div style={{ width: 88, height: 112, border: "1px solid #8a9bb0", background: "#e8e4da", overflow: "hidden", borderRadius: 6, flexShrink: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.photo ? (
                <img src={p.photo} alt="photo" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
