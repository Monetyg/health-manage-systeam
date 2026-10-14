import { NextResponse } from "next/server";
import { listNotices } from "@/lib/repo";

/**
 * 公开公告列表：二/三级展示用，未登录也能看，只返回展示必需字段。
 */
export async function GET() {
  const list = await listNotices();
  return NextResponse.json(list.map((n) => ({
    id: String(n.id),
    content: n.content,
    createdAt: n.createdAt,
  })));
}
