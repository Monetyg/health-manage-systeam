"use client";
import { useEffect, useState } from "react";
import { toPng } from "html-to-image";
import CertPreview from "@/components/CertPreview";
import CertPreview2 from "@/components/CertPreview2";
import CertPreview3 from "@/components/CertPreview3";

const BLUE = "#1677ff";

/**
 * 把任意图片转成浏览器一定能显示的JPG（最长边800px）。
 * 转不了（如HEIC/损坏文件）就抛错，外层提示换图。
 */
function toJpg(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const max = 800;
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * k);
        c.height = Math.round(img.height * k);
        c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL("image/jpeg", 0.85));
      } catch (e) { reject(e); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("decode")); };
    img.src = url;
  });
}

/**
 * 三级办证首页（白+蓝简约风）：
 * 步骤1卡密登录 → 步骤2填信息+拍照 → 步骤3白底模板。
 */
export default function Home() {
  const [code, setCode] = useState("");
  const [ok, setOk] = useState("");
  const [authed, setAuthed] = useState(false);
  const [expire, setExpire] = useState("");
  const [f, setF] = useState({ name: "", idCard: "", province: "广东省", region: "深圳" });
  /** 模板：gd任意地区版 / e直辖市版（少填省份） / lz兰州新区版（只填姓名+身份证+照片） */
  const [tpl, setTpl] = useState<"gd" | "e" | "lz">("gd");
  const [photo, setPhoto] = useState("");
  const [upMsg, setUpMsg] = useState("");
  const [ret, setRet] = useState<any>(null);
  const [err, setErr] = useState("");
  const [dlMsg, setDlMsg] = useState("");
  const [checking, setChecking] = useState(true);

  /** 打开/刷新页面：卡密有效期内自动保持登录，过期自动退回 */
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/pass/status");
        if (r.ok) {
          const j = await r.json();
          setAuthed(true);
          setExpire(new Date(j.expireAt).toLocaleString());
        } else {
          setAuthed(false);
        }
      } catch { setAuthed(false); }
      setChecking(false);
    })();
  }, []);

  /** 下载健康证长图（9:16），手机上会打开大图，长按存相册 */
  async function download() {
    try {
      setDlMsg("正在生成图片…");
      const node = document.getElementById("cert-pic");
      if (!node) return;
      const url = await toPng(node, { pixelRatio: 3, backgroundColor: "#ffffff" });
      const a = document.createElement("a");
      a.download = `健康证-${f.name || ret?.certNo}.png`;
      a.href = url;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setDlMsg("已下载（苹果手机请在弹出大图中长按存相册）");
    } catch {
      setDlMsg("下载失败，请截屏保存");
    }
  }

  async function redeem() {
    setErr("");
    if (code.trim().length !== 8) { setErr("请输入8位卡密"); return; }
    try {
      setOk("验证中…");
      const r = await fetch("/api/pass/redeem", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: code.trim() }) });
      const j = await r.json();
      if (r.ok) {
        setAuthed(true);
        setExpire(new Date(j.expireAt).toLocaleString());
        setOk("");
      } else { setOk(""); setErr(j.error || "卡密无效"); }
    } catch (e) { setOk(""); setErr("网络异常，请重试"); }
  }

  /** 本地相册选择上传（不强制相机）：先转成浏览器一定能显示的JPG再预览+上传 */
  async function onFile(file: File | undefined) {
    if (!file) return;
    setUpMsg("处理中…");
    try {
      const dataUrl = await toJpg(file);
      setPhoto(dataUrl);
      setUpMsg("上传中…");
      const blob = await (await fetch(dataUrl)).blob();
      const fd = new FormData();
      fd.append("photo", blob, "photo.jpg");
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const j = await r.json();
      if (r.ok) { setPhoto(j.url); setUpMsg("上传成功"); }
      else { setUpMsg("上传失败：" + (j.error || r.status) + "（已用本地图，可继续办证）"); }
    } catch {
      setUpMsg("这张图打不开（可能是HEIC/特殊格式），请换一张JPG或PNG");
    }
  }

  async function submit() {
    setErr("");
    if (!f.name.trim()) { setErr("请填写姓名"); return; }
    if (f.idCard.trim().length !== 18) { setErr("身份证号需18位"); return; }
    if (!photo) { setErr("请先拍照/上传照片"); return; }
    try {
      setOk("生成中…");
      const payload = tpl === "lz"
        ? { name: f.name, idCard: f.idCard, photoUrl: photo, template: tpl }
        : tpl === "e"
          ? { name: f.name, idCard: f.idCard, region: f.region, photoUrl: photo, template: tpl }
          : { ...f, photoUrl: photo, template: tpl };
      const r = await fetch("/api/certs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const j = await r.json();
      setOk("");
      if (r.ok) setRet(j);
      else if (r.status === 401 || r.status === 403) {
        // 卡密过期/作废：自动退出登录，退回卡密框
        setAuthed(false);
        setRet(null);
        setErr("卡密已失效，请用新卡密重新登录");
      }
      else setErr(j.error || "生成失败");
    } catch { setOk(""); setErr("网络异常，请重试"); }
  }

  const card: React.CSSProperties = { background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 2px 12px rgba(22,119,255,.08)", border: "1px solid #e8f0fe" };
  const input: React.CSSProperties = { width: "100%", borderRadius: 12, border: "1px solid #d0ddf5", padding: "14px", fontSize: 16, outline: "none", background: "#fff", color: "#111" };
  const btn: React.CSSProperties = { width: "100%", borderRadius: 12, background: BLUE, color: "#fff", padding: "14px", fontSize: 17, fontWeight: 700, border: "none" };

  return (
    <main style={{ background: "#f2f6ff", minHeight: "100vh", padding: "20px 16px 60px", color: "#111" }}>
      <style>{`input::placeholder{color:#8a9cc5 !important;opacity:1 !important;}input{color:#111 !important;-webkit-text-fill-color:#111;}`}</style>
      <div style={{ maxWidth: 440, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <header style={{ textAlign: "center", padding: "8px 0 0" }}>
          <div style={{ color: BLUE, fontWeight: 800, fontSize: 22 }}>健康证办理</div>
          <div style={{ color: "#7a8bb0", fontSize: 13, marginTop: 4 }}>食品从业人员健康证明</div>
        </header>

        {/* 步骤条 */}
        <div style={{ display: "flex", gap: 6, fontSize: 12 }}>
          {["卡密登录", "填写信息", "生成证明"].map((s, i) => {
            const active = authed ? (ret ? 2 : 1) : 0;
            return (
              <div key={s} style={{ flex: 1, textAlign: "center", padding: "8px 0", borderRadius: 10, background: i <= active ? BLUE : "#fff", color: i <= active ? "#fff" : "#9db1d8", fontWeight: 700 }}>
                {i + 1}. {s}
              </div>
            );
          })}
        </div>

        {/* 步骤1：卡密登录（已登录且有效期内不显示） */}
        {!authed && !checking && (
        <section style={card}>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>卡密登录</div>
          <div style={{ color: "#7a8bb0", fontSize: 13, marginBottom: 12 }}>请输入二级发放的8位卡密，有效期内可办理多张</div>
          <input style={{ ...input, letterSpacing: 4, textAlign: "center", textTransform: "uppercase", fontWeight: 700, fontSize: 20 }} placeholder="8位卡密" maxLength={8} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
          <div style={{ height: 12 }} />
          <button style={btn} onClick={redeem}>验证并登录</button>
          {ok && <div style={{ color: BLUE, fontSize: 13, marginTop: 8 }}>{ok}</div>}
        </section>
        )}
        {checking && <div style={{ textAlign: "center", color: "#7a8bb0" }}>正在确认登录状态…</div>}

        {/* 登录成功提示 */}
        {authed && (
          <div style={{ ...card, borderLeft: `4px solid ${BLUE}` }}>
            <div style={{ color: BLUE, fontWeight: 700 }}>✓ 登录成功，有效期至 {expire}</div>
          </div>
        )}

        {/* 步骤2：填信息（登录后才显示） */}
        {authed && !ret && (
          <section style={card}>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 12 }}>填写信息</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {(["gd", "e", "lz"] as const).map((t) => (
                <button key={t} onClick={() => setTpl(t)} style={{ flex: 1, borderRadius: 10, padding: "10px 4px", fontSize: 13, fontWeight: 700, border: tpl === t ? `2px solid ${BLUE}` : "1px solid #d0ddf5", background: tpl === t ? "#e8f1ff" : "#fff", color: tpl === t ? BLUE : "#7a8bb0" }}>
                  {t === "gd" ? "任意地区版" : t === "e" ? "直辖市版" : "兰州新区版"}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input style={input} placeholder="姓名" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
              <input style={input} placeholder="身份证号（18位）" maxLength={18} inputMode="numeric" value={f.idCard} onChange={(e) => setF({ ...f, idCard: e.target.value })} />
              {tpl === "gd" && <input style={input} placeholder="省份（如广东省）" value={f.province} onChange={(e) => setF({ ...f, province: e.target.value })} />}
              {tpl !== "lz" && <input style={input} placeholder={tpl === "e" ? "直辖市（如北京）" : "地区（如深圳）"} value={f.region} onChange={(e) => setF({ ...f, region: e.target.value })} />}
              <label style={{ ...btn, textAlign: "center", background: "#fff", color: BLUE, border: `2px dashed ${BLUE}`, display: "block" }}>
                {photo ? "重新选择照片" : "从相册选择照片"}
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
              </label>
              {upMsg && <div style={{ color: upMsg.includes("成功") ? BLUE : "#d4380d", fontSize: 13 }}>{upMsg}</div>}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {photo && <img src={photo} alt="photo" onError={() => setUpMsg("照片加载失败，请重新选择")} style={{ width: 96, height: 128, objectFit: "cover", borderRadius: 8, border: "1px solid #d0ddf5", background: "#fff" }} />}
              {photo && <div style={{ fontSize: 11, color: "#7a8bb0", wordBreak: "break-all" }}>地址：{photo.length > 120 ? photo.slice(0, 120) + "…" : photo}</div>}
              <button style={btn} onClick={submit}>生成健康证</button>
            </div>
          </section>
        )}

        {err && <div style={{ background: "#fff1f0", color: "#d4380d", borderRadius: 12, padding: "12px 16px", fontSize: 14 }}>{err}</div>}

        {/* 步骤3：白底模板 */}
        {ret?.certNo && (
          <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {ret.template === "lz" ? (
              <CertPreview3 certNo={ret.certNo} name={f.name} idCard={f.idCard} category={ret.category || "食品"} organ={ret.organ} from={ret.from} to={ret.to} photo={photo} qr={ret.qr} />
            ) : ret.template === "e" ? (
              <CertPreview2 certNo={ret.certNo} name={f.name} gender={ret.gender} age={ret.age} category="食品生产经营" organ={ret.organ} from={ret.from} to={ret.to} photo={photo} qr={ret.qr} />
            ) : (
              <CertPreview name={f.name} gender={ret.gender} mask={ret.mask} province={ret.province || f.province} unit={ret.unitName} date={new Date().toISOString()} photo={photo} qr={ret.qr} certNo={ret.certNo} />
            )}
            <button style={{ ...btn }} onClick={download}>下载图片存相册</button>
            {dlMsg && <div style={{ textAlign: "center", fontSize: 13, color: BLUE }}>{dlMsg}</div>}
            <a style={{ ...btn, textAlign: "center", textDecoration: "none", display: "block", background: "#fff", color: BLUE, border: `1px solid ${BLUE}` }} href={`/verify/${ret.certNo}`}>打开验真页</a>
            <button style={{ ...btn, background: "#fff", color: BLUE, border: `1px solid ${BLUE}` }} onClick={() => { setRet(null); setF({ name: "", idCard: "", province: "广东省", region: "深圳" }); setPhoto(""); }}>继续办下一张</button>
          </section>
        )}
      </div>
    </main>
  );
}
