/**
 * 河北省食品药品从业人员健康合格证明（模板8“三通保定”）。
 * 按样张还原：左右竖排“沿刻痕处向后掰开”贯穿全卡高度，中间上方为证套红字标语
 * （关注民生健康 / 共筑和谐社会 + 撕口提示），下方虚线分隔白底正文
 * （蓝标题 + 姓名性别同行/从业类别/编号/有效期限/体检单位 + 中部红章）+ 右侧二维码与照片（二维码在左）。
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
 * 尺寸 86：卡宽 440 下与正文行高匹配，不压到照片也不溢出卡片。
 */
function BaodingStamp() {
  return (
    <svg width={86} height={86} viewBox="0 0 116 116" style={{ display: "block" }}>
      <defs>
        <path id="stStampArc" d="M 18,58 A 40,40 0 0 1 98,58" />
      </defs>
      <circle cx="58" cy="58" r="54" fill="none" stroke="rgba(206,32,32,.85)" strokeWidth="3" />
      <text fill="rgba(206,32,32,.9)" fontSize="13" fontWeight="700" fontFamily={FONT}>
        <textPath href="#stStampArc" startOffset="50%" textAnchor="middle">
          白沟新城航天医院
        </textPath>
      </text>
      <text x="58" y="76" textAnchor="middle" fill="rgba(206,32,32,.95)" fontSize="30">
        ★
      </text>
      <text x="58" y="96" textAnchor="middle" fill="rgba(206,32,32,.95)" fontSize="12" fontWeight="700" fontFamily={FONT}>
        体检专用章
      </text>
    </svg>
  );
}

export default function CertPreview8(p: Props) {
  const rowStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    lineHeight: 1.75,
    color: "#111",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };
  /** 证套左右竖排字：贯穿全卡高度（与样张一致） */
  const sideStyle: React.CSSProperties = {
    writingMode: "vertical-rl",
    fontSize: 14,
    fontWeight: 800,
    color: "#111",
    letterSpacing: 4,
    whiteSpace: "nowrap",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 0",
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
        alignItems: "stretch",
      }}
    >
      {/* 左竖排字 */}
      <div style={sideStyle}>沿刻痕处向后掰开</div>

      {/* 中间列：证套 + 正文 */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* 证套：红字两行 + 黑字撕口提示 */}
        <div style={{ textAlign: "center", padding: "6px 8px 5px" }}>
          <div style={{ fontSize: "min(17px, 4.2vw)", fontWeight: 900, color: "#c02020", letterSpacing: 5, whiteSpace: "nowrap" }}>
            关注民生健康
          </div>
          <div style={{ fontSize: "min(17px, 4.2vw)", fontWeight: 900, color: "#c02020", letterSpacing: 3, whiteSpace: "nowrap", marginTop: 4, paddingLeft: "16%" }}>
            共筑和谐社会
          </div>
          <div style={{ fontSize: "min(13px, 3.2vw)", fontWeight: 800, color: "#111", letterSpacing: 6, whiteSpace: "nowrap", marginTop: 6 }}>
            沿刻痕处向后掰开
          </div>
        </div>
        <div style={{ borderTop: "1px dashed #c8cfda", margin: "0 4px" }} />

        {/* 正文：蓝标题 + 信息 + 章 + 二维码照片 */}
        <div style={{ padding: "8px 10px 12px", position: "relative" }}>
          <div
            style={{
              fontSize: "min(16px, 3.9vw)",
              fontWeight: 900,
              color: TITLE_INK,
              textAlign: "center",
              letterSpacing: 0.5,
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
                paddingRight: 4,
              }}
            >
              <div style={{ ...rowStyle, display: "flex", gap: 12 }}>
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

            {/* 红章：压在编号/有效期行尾部（与样张一致，本就盖在字上），右缘与照片留间距，不溢出卡片 */}
            <div style={{ position: "absolute", right: 92, top: 16, zIndex: 2, pointerEvents: "none" }}>
              <BaodingStamp />
            </div>

            {/* 右：二维码在左、照片在右（与样张一致） */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 4, flexShrink: 0, position: "relative", zIndex: 3 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.qr ? <img src={p.qr} alt="qr" style={{ width: 50, height: 50, display: "block", background: "#fff", marginTop: 24 }} /> : null}
              <div style={{ width: 76, height: 96, border: "1px solid #8a9bb0", background: "#e8e4da", overflow: "hidden", borderRadius: 6, flexShrink: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.photo ? (
                  <img src={p.photo} alt="photo" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 右竖排字 */}
      <div style={sideStyle}>沿刻痕处向后掰开</div>
    </div>
  );
}