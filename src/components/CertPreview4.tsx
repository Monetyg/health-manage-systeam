/**
 * 从业人员健康体检卫生培训合格证（模板4）。
 * 横向深蓝描边卡片：顶部蓝底白字抬头，左侧信息栏，右侧照片+二维码，
 * 中部叠红章与浅蓝水印。仅姓名/性别/年龄/照片/编号随办证变化，其余固定。
 */

interface Props {
  certNo: string;
  name: string;
  gender: string;
  age: string;
  organ: string;
  from: string;
  photo: string;
  qr: string;
}

const FONT = "'PingFang SC','Hiragino Sans GB','Microsoft YaHei','Heiti SC',sans-serif";
const NAVY = "#16334d";
/** 发证机构固定不变 */
const ORG = "深圳市疾病预防控制中心";

/** 统一成 YYYY-MM-DD */
function fmtDate(v: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v || "");
  return m ? `${m[1]}-${m[2]}-${m[3]}` : v || "";
}

/**
 * 到期日期 = 发证日期 +1 年 -1 天，对标样张（2026-07-22 → 2027-07-21）。
 * 用 UTC 计算避开时区偏移。
 */
function expireDate(from: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(from || "");
  if (!m) return "";
  const d = new Date(Date.UTC(Number(m[1]) + 1, Number(m[2]) - 1, Number(m[3])));
  d.setUTCDate(d.getUTCDate() - 1);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
}

export default function CertPreview4(p: Props) {
  const org = p.organ || ORG;
  const rowStyle: React.CSSProperties = {
    fontSize: 20,
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
        maxWidth: 720,
        margin: "0 auto",
        background: "#fff",
        border: `3px solid ${NAVY}`,
        borderRadius: 14,
        overflow: "hidden",
        fontFamily: FONT,
        WebkitTextSizeAdjust: "100%",
        textSizeAdjust: "100%",
      }}
    >
      {/* 抬头 */}
      <div
        style={{
          height: 92,
          background: `linear-gradient(135deg, #2f74ad 0%, #1d4a78 100%)`,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 14px",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            flexShrink: 0,
            border: "2px solid #cfe3f2",
            background: "radial-gradient(circle at 50% 45%, #f2f8ff 0 56%, #1d4a78 58% 100%)",
            color: "#1d4a78",
            fontSize: 9,
            fontWeight: 800,
            lineHeight: 1.2,
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          卫生
          <br />
          监督
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            color: "#fff",
            textShadow: "0 1px 2px rgba(0,0,0,.35)",
          }}
        >
          <span style={{ fontSize: 34, fontWeight: 900, letterSpacing: 3 }}>从业人员</span>
          <span
            style={{
              fontSize: 21,
              fontWeight: 800,
              letterSpacing: 2,
              lineHeight: 1.2,
              textAlign: "center",
            }}
          >
            健康体检
            <br />
            卫生培训
          </span>
          <span style={{ fontSize: 34, fontWeight: 900, letterSpacing: 3 }}>合格证</span>
        </div>
      </div>

      {/* 主体 */}
      <div style={{ display: "flex", position: "relative", padding: "16px 18px 16px 22px" }}>
        {/* 浅蓝水印logo */}
        <div
          style={{
            position: "absolute",
            left: 130,
            top: 34,
            width: 148,
            height: 148,
            borderRadius: "50%",
            border: "7px solid rgba(70,130,190,.14)",
            color: "rgba(70,130,190,.22)",
            fontSize: 10,
            fontWeight: 800,
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1.4,
            pointerEvents: "none",
          }}
        >
          中国卫生
          <br />
          监督协会
        </div>

        {/* 左：信息栏 */}
        <div style={{ flex: 1, minWidth: 0, position: "relative", zIndex: 1 }}>
          <div style={rowStyle}>编 号：{p.certNo}</div>
          <div style={{ ...rowStyle, display: "flex" }}>
            <span style={{ width: 250, overflow: "hidden", textOverflow: "ellipsis" }}>
              姓 名：{p.name}
            </span>
            <span>性 别：{p.gender}</span>
          </div>
          <div style={{ ...rowStyle, display: "flex" }}>
            <span style={{ width: 250, overflow: "hidden", textOverflow: "ellipsis" }}>
              检查结果：合格
            </span>
            <span>年 龄：{p.age}</span>
          </div>
          <div style={rowStyle}>发证日期：{fmtDate(p.from)}</div>
          <div style={rowStyle}>到期日期：{expireDate(p.from)}</div>
          <div style={rowStyle}>发证机构：{org}</div>
        </div>

        {/* 红章 */}
        <div
          style={{
            position: "absolute",
            left: 300,
            top: 96,
            width: 184,
            height: 184,
            borderRadius: "50%",
            border: "3px solid rgba(206,32,32,.8)",
            color: "rgba(206,32,32,.85)",
            transform: "rotate(-12deg)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 800,
            lineHeight: 1.35,
            textAlign: "center",
            pointerEvents: "none",
            zIndex: 2,
          }}
        >
          <span style={{ fontSize: 30, lineHeight: 1 }}>★</span>
          <span>{org}</span>
          <span>体检专用章</span>
        </div>

        {/* 右：照片 + 二维码 */}
        <div
          style={{
            width: 208,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
            zIndex: 3,
          }}
        >
          <div
            style={{
              width: 152,
              height: 196,
              border: "1px solid #444",
              background: "#f4f4f4",
              overflow: "hidden",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {p.photo ? (
              <img
                src={p.photo}
                alt="photo"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            ) : null}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {p.qr ? (
            <img
              src={p.qr}
              alt="qr"
              style={{
                width: 118,
                height: 118,
                marginTop: 10,
                display: "block",
                background: "#fff",
              }}
            />
          ) : null}
        </div>
      </div>

      {/* 底部深蓝条 */}
      <div style={{ height: 20, background: NAVY }} />
    </div>
  );
}
