import type { Metadata } from "next";
import VerifyCert from "@/components/VerifyCert";

/** 验真页不希望被搜索引擎收录 */
export const metadata: Metadata = {
  title: "健康证验真",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ token: string }> };

/**
 * 旧版验真地址：/v/{32位token}。
 * 已经印出去的证还在用它，保留不删。
 */
export default async function VerifyByToken({ params }: Props) {
  const { token } = await params;
  return <VerifyCert token={token} />;
}
