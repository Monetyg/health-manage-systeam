/**
 * 兰州新区从业人员电子健康证（模板3）。严格按照样张还原：
 * 两张独立圆角卡片（证件 + 使用说明），头部为斜向多层蓝紫色带，正文黑体。
 * 只有姓名/身份证号/照片随办证变化，编号与日期由系统生成，其余固定。
 */

interface Props {
  certNo: string;
  name: string;
  idCard: string;
  category: string;
  organ: string;
  from: string;
  to: string;
  photo: string;
  qr: string;
}

const HEAD_FONT =
  "-apple-system,'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif";
const BODY_FONT =
  "'PingFang SC','Hiragino Sans GB','Microsoft YaHei','Heiti SC',sans-serif";

/** 2026-10-03 → 2026年10月03日 */
function cnDate(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
  if (!m) return iso || "";
  return `${m[1]}年${m[2]}月${m[3]}日`;
}

/**
 * 斜向多层横幅：浅蓝→深蓝斜带，底部叠一条紫红斜带（还原样张）。
 * 用内联 SVG 绘制，标题用 HTML 覆盖其上（不受拉伸影响）。
 */
function Band({
  uid,
  title,
  height,
  fontSize,
  letterSpacing = 1,
}: {
  uid: string;
  title: string;
  height: number;
  fontSize: number;
  letterSpacing?: number;
}) {
  const bl = Math.round(height * 0.87); // 蓝带左下高度
  const br = Math.round(height * 0.54); // 蓝带右下高度
  const pt = height - bl; // 紫带厚度
  return (
    <div style={{ position: "relative" }}>
      <svg
        viewBox={`0 0 380 ${height}`}
        width="100%"
        height={height}
        preserveAspectRatio="none"
        style={{ display: "block" }}
      >
        <defs>
          <linearGradient id={`${uid}-blue`} x1="0" y1="0" x2="1" y2="0.7">
            <stop offset="0%" stopColor="#59b0e8" />
            <stop offset="52%" stopColor="#2472c0" />
            <stop offset="100%" stopColor="#1a4a8a" />
          </linearGradient>
          <linearGradient id={`${uid}-purple`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#b33b93" />
            <stop offset="100%" stopColor="#7d2c93" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="380" height={height} fill="#ffffff" />
        <polygon points={`0,0 380,0 380,${br} 0,${bl}`} fill={`url(#${uid}-blue)`} />
        <polygon
          points={`0,${bl} 380,${br} 380,${br + pt} 0,${bl + pt}`}
          fill={`url(#${uid}-purple)`}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: Math.round(height * 0.74),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontWeight: 800,
          fontSize,
          letterSpacing,
          fontFamily: HEAD_FONT,
          textShadow: "0 1px 3px rgba(0,20,60,.35)",
        }}
      >
        {title}
      </div>
    </div>
  );
}

export default function CertPreview3(p: Props) {
  return (
    <div
      id="cert-pic"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        maxWidth: 380,
        margin: "0 auto",
        fontFamily: BODY_FONT,
        WebkitTextSizeAdjust: "100%",
        textSizeAdjust: "100%",
      }}
    >
      {/* ========== 卡片1：证件 ========== */}
      <div
        style={{
          background: "#fff",
          borderRadius: 8,
          overflow: "hidden",
          border: "1px solid #e6e6e6",
        }}
      >
        <Band
          uid="lzTop"
          title="兰州新区从业人员电子健康证"
          height={78}
          fontSize={17}
          letterSpacing={0.5}
        />

        <div style={{ padding: "14px 14px 16px" }}>
          {/* 照片 + 信息 */}
          <div style={{ display: "flex", gap: 14 }}>
            <div
              style={{
                width: 80,
                height: 105,
                flexShrink: 0,
                border: "1px solid #333",
                background: "#f4f4f4",
                overflow: "hidden",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.photo ? (
                <img
                  src={p.photo}
                  alt="photo"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              ) : null}
            </div>

            <div
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: 12,
                lineHeight: 1.95,
                color: "#1a1a1a",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
                <span style={{ whiteSpace: "nowrap" }}>姓名:{p.name}</span>
                <span style={{ whiteSpace: "nowrap" }}>作业类别:{p.category}</span>
              </div>
              <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                身份证号:{p.idCard}
              </div>
              <div style={{ display: "flex", gap: 4, fontSize: 11, whiteSpace: "nowrap" }}>
                <span>发证日期:{cnDate(p.from)}</span>
                <span>有效期限:{cnDate(p.to)}</span>
              </div>
            </div>
          </div>

          {/* 二维码 */}
          <div style={{ display: "flex", justifyContent: "flex-end", paddingRight: 6, marginTop: 4 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {p.qr ? (
              <img
                src={p.qr}
                alt="qr"
                style={{ width: 88, height: 88, display: "block", background: "#fff" }}
              />
            ) : null}
          </div>

          {/* 发证机构 + 编号（同一行） */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
              marginTop: 10,
              fontSize: 11,
              color: "#1a1a1a",
            }}
          >
            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              发证机构:{p.organ}
            </span>
            <span style={{ whiteSpace: "nowrap", flexShrink: 0 }}>编号:{p.certNo}</span>
          </div>
        </div>
      </div>

      {/* ========== 卡片2：使用说明 ========== */}
      <div
        style={{
          background: "#fff",
          borderRadius: 8,
          overflow: "hidden",
          border: "1px solid #e6e6e6",
        }}
      >
        <Band uid="lzBot" title="使用说明" height={88} fontSize={24} letterSpacing={10} />

        <div
          style={{
            padding: "20px 20px 26px 48px",
            fontSize: 11.5,
            lineHeight: 2.05,
            color: "#1a1a1a",
          }}
        >
          <div style={{ marginBottom: 6 }}>
            1、本证适用于食品、药品、保健食品、化妆品、医疗器械、公共场所、生活饮用水、消毒产品等行业从业人员。
          </div>
          <div style={{ marginBottom: 6 }}>2、从业人员必须自觉接受监督检查。</div>
          <div style={{ marginBottom: 6 }}>3、本证全新区通用。</div>
          <div>4、可通过二维码查询体检信息。</div>
        </div>
      </div>
    </div>
  );
}
