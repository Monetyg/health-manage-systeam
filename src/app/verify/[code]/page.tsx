import { findCertByCertNo } from "@/lib/repo";

/**
 * 公开验真页：3天内有效。
 */
export default async function Verify({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const c = await findCertByCertNo(code);
  if (!c) return <main className="p-8 text-center">查无此证：{code}</main>;
  const expired = new Date(c.verifyExpireAt as unknown as string) < new Date();
  /** 合格证版：发证日期 +1 年 -1 天 为到期日期 */
  const toDate = (() => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(c.examDate || ""));
    if (!m) return "";
    const d = new Date(Date.UTC(Number(m[1]) + 1, Number(m[2]) - 1, Number(m[3])));
    d.setUTCDate(d.getUTCDate() - 1);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  })();
  /** 用发证机构还是体检单位的分支 */
  const useOrgan = c.template === "lz" || c.template === "hz" || c.template === "fs";
  const isHz = c.template === "hz";
  const isFs = c.template === "fs";
  return (
    <main className="mx-auto max-w-md p-4 space-y-2">
      <h1 className="text-center text-lg font-bold">
        {isFs ? "食品从业人员健康体检合格证验真" : isHz ? "从业人员健康体检卫生培训合格证验真" : c.template === "lz" ? "兰州新区从业人员电子健康证验真" : c.template === "e" ? "从业人员健康证明验真" : "广东省食品从业人员健康证明验真"}
      </h1>
      {c.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={c.photoUrl} alt="持证人照片" style={{ width: 120, height: 160, objectFit: "cover", borderRadius: 8, border: "1px solid #ddd", display: "block", margin: "12px auto" }} />
      ) : null}
      <p>编号：{c.certNo}</p>
      {c.province ? <p>省份：{c.province}</p> : null}
      <p>姓名：{c.idCardMask ? c.name?.slice(0, 1) + "*" : c.name}</p>
      <p>性别：{c.gender}</p>
      {c.age ? <p>年龄：{c.age}</p> : null}
      <p>身份证：{c.idCardMask}</p>
      {isFs ? <p>从业类别：食品</p> : null}
      {isHz || isFs ? <p>检查结果：合格</p> : null}
      <p>{useOrgan ? "发证机构" : "单位"}：{c.unitName}</p>
      <p>{isFs ? "发证日期" : "体检日期"}：{c.examDate}</p>
      {isFs ? <p>有效期限：一年</p> : null}
      {isHz ? <p>到期日期：{toDate}</p> : null}
      <p className={expired ? "text-red-600 font-bold" : "text-green-600 font-bold"}>{expired ? "已过期（超过3天）" : "有效期内"}</p>
    </main>
  );
}
