import { dbConnect } from "@/lib/db";
import { getDb } from "@/lib/cloudbase";
import { COLL } from "@/lib/models";

/**
 * 公开验真页：3天内有效.
 */
export default async function Verify({ params }: { params: Promise<{ code: string }> }) {
  await dbConnect();
  const { code } = await params;
  const c = (await getDb().collection(COLL.Cert).where({ certNo: code }).limit(1).get()).data[0] as any;
  if (!c) return <main className="p-8 text-center">查无此证：{code}</main>;
  const expired = new Date(c.verifyExpireAt) < new Date();
  return (
    <main className="mx-auto max-w-md p-4 space-y-2">
      <h1 className="text-center text-lg font-bold">
        {c.template === "lz" ? "兰州新区从业人员电子健康证验真" : c.template === "e" ? "从业人员健康证明验真" : "广东省食品从业人员健康证明验真"}
      </h1>
      {c.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={c.photoUrl} alt="持证人照片" style={{ width: 120, height: 160, objectFit: "cover", borderRadius: 8, border: "1px solid #ddd", display: "block", margin: "12px auto" }} />
      ) : null}
      <p>编号：{c.certNo}</p>
      {c.province ? <p>省份：{c.province}</p> : null}
      <p>姓名：{c.idCardMask ? c.name?.slice(0, 1) + "*" : c.name}</p>
      <p>性别：{c.gender}</p>
      <p>身份证：{c.idCardMask}</p>
      <p>{c.template === "lz" ? "发证机构" : "单位"}：{c.unitName}</p>
      <p>体检日期：{c.examDate}</p>
      <p className={expired ? "text-red-600 font-bold" : "text-green-600 font-bold"}>{expired ? "已过期（超过3天）" : "有效期内"}</p>
    </main>
  );
}
