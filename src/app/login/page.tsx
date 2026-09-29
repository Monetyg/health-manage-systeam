"use client";
import { useState } from "react";

/**
 * 统一登录页（一级/二级）：登录成功后按角色去各自后台。
 */
export default function Login() {
  const [f, setF] = useState({ username: "", password: "" });
  const [msg, setMsg] = useState("");
  const [go, setGo] = useState("");

  async function login(e?: React.FormEvent) {
    e?.preventDefault();
    try {
      console.log("login click", f.username);
      setMsg("登录中…");
      const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      console.log("login status", r.status);
      const j = await r.json().catch(() => ({ error: "返回不是JSON，状态码" + r.status }));
      if (r.ok) {
        const url = j.role === "L1" ? "/admin" : "/level2";
        setMsg(`登录成功：${j.role}，正在进入…`);
        setGo(url);
        location.href = url;
      } else {
        setMsg(`失败：${j.error || r.status}`);
      }
    } catch (e) {
      console.error(e);
      setMsg("请求失败：" + String(e));
    }
  }
  return (
    <main className="mx-auto max-w-md space-y-3 p-4">
      <h1 className="text-center text-xl font-bold">管理登录</h1>
      <form onSubmit={login} className="space-y-3">
        <input className="w-full rounded border p-3" placeholder="账号" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} />
        <input className="w-full rounded border p-3" placeholder="密码" type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        <button type="submit" onClick={() => console.log("btn click")} className="w-full rounded bg-black p-3 text-white">登录</button>
      </form>
      {msg && <p>{msg}</p>}
      {go && <a href={go} style={{ display: "block", textAlign: "center", color: "#1677ff" }}>如果没自动跳转，点这里进入</a>}
    </main>
  );
}
