import type { Metadata } from "next";
import { findCertByToken } from "@/lib/repo";

/** 验真页不希望被搜索引擎收录 */
export const metadata: Metadata = {
  title: "健康证验真",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ token: string }> };

/**
 * 公开验真页（验真子域名）：凭随机 token 只读查询，不登录、不鉴权、不写库。
 * 只展示脱敏后的必要信息，绝不返回完整身份证号、数据库 id 等敏感字段。
 * 有效性沿用原业务规则：verifyExpireAt（办证后 3 天）过期即显示无效。
 */
export default async function VerifyByToken({ params }: Props) {
  const { token } = await params;
  const c = await findCertByToken(token);
  if (!c) {
    return (
      <main className="mx-auto max-w-md p-8 text-center">
        <h1 className="text-lg font-bold">健康证验真</h1>
        <p className="mt-4 text-red-600 font-bold">验真失败</p>
        <p className="mt-2 text-sm text-gray-600">未找到对应的健康证信息，请确认二维码是否有效。</p>
      </main>
    );
  }
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
  const useOrgan = c.template === "lz" || c.template === "hz" || c.template === "fs" || c.template === "sl";
  const isHz = c.template === "hz";
  const isFoodCert = c.template === "fs" || c.template === "sl";
  const isSl = c.template === "sl";
  return (
    <main className="mx-auto max-w-md p-4 space-y-2">
      <h1 className="text-center text-lg font-bold">
        {isSl ? "从业人员预防性健康检查合格证明验真" : c.template === "fs" ? "食品从业人员健康体检合格证验真" : isHz ? "从业人员健康体检卫生培训合格证验真" : c.template === "lz" ? "兰州新区从业人员电子健康证验真" : c.template === "e" ? "从业人员健康证明验真" : "广东省食品从业人员健康证明验真"}
      </h1>
      <p className={expired ? "text-red-600 font-bold" : "text-green-600 font-bold"}>
        {expired ? "✗ 证件已过期" : "✓ 证件有效"}
      </p>
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
      {isFoodCert ? <p>从业类别：食品</p> : null}
      {isHz || isFoodCert ? <p>检查结果：合格</p> : null}
      <p>{useOrgan ? "发证机构" : "单位"}：{c.unitName}</p>
      <p>{isFoodCert ? "发证日期" : "体检日期"}：{c.examDate}</p>
      {isFoodCert ? <p>有效期限：一年</p> : null}
      {isHz ? <p>到期日期：{toDate}</p> : null}
      <p className="text-sm text-gray-500">该证件信息与系统记录一致</p>
    </main>
  );
}
