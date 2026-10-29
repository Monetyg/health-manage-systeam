import type { Metadata } from "next";
import { notFound } from "next/navigation";
import VerifyCert from "@/components/VerifyCert";

/** 验真页不希望被搜索引擎收录 */
export const metadata: Metadata = {
  title: "健康证验真",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ file: string }> };

/**
 * 新版验真地址：/img/mob10/{32位token}.html
 * 形如 /img/mob10/179325641801536.html；.html 只是外观，去掉后按 token 查库。
 */
export default async function VerifyByHtml({ params }: Props) {
  const { file } = await params;
  const token = decodeURIComponent(file).replace(/\.html?$/i, "");
  if (!/^[0-9a-f]{32}$/i.test(token)) notFound();
  return <VerifyCert token={token} />;
}
