/**
 * 数据访问层：所有 SQL/ORM 查询集中在这里，路由只调函数。
 *
 * 由 CloudBase 文档查询改写为 MySQL 关系查询的对应关系：
 *   db.collection(X).where({a,b}).limit(1).get()   →  Model.findOne({ where: { a, b } })
 *   db.collection(X).doc(id).get()                 →  Model.findByPk(id)
 *   db.collection(X).where({...}).orderBy(c,"desc")→  Model.findAll({ where, order: [["c","DESC"]] })
 *   db.collection(X).add(doc)                      →  Model.create(doc)
 *   db.collection(X).doc(id).update(patch)         →  Model.update(patch, { where: { id } })
 *   db.collection(X).where({...}).update(patch)    →  Model.update(patch, { where })
 *   db.collection(X).doc(id).remove()              →  Model.destroy({ where: { id } })
 *   db.RegExp({ regexp, options:"i" })             →  LIKE '%...%'（utf8mb4 排序规则本身不区分大小写）
 *   db.serverDate()                                →  Sequelize 自动维护 created_at / updated_at
 *
 * 说明：model(X).create() 返回长对象，出参统一用 plain 转换后取字段，避免把 Sequelize 实例泄漏到接口层。
 */
import { Op } from "sequelize";
import { getSequelize } from "./db";
import { getModels, TABLES, type CardKeyRow, type CertRow, type NoticeRow, type RegionUnitRow, type UserRow } from "./models";

/** Sequelize 实例 + 模型行转普通对象 */
function plain<T>(m: unknown): T {
  return (m as { get: (o: { plain: true }) => T }).get({ plain: true });
}

/** 把用户输入转义成 LIKE 的字面量，避免 % _ 被当通配符 */
function likeLiteral(s: string): string {
  return s.replace(/[\\%_]/g, (c) => "\\" + c);
}

/** 账号：按用户名查（登录用） */
export async function findUserByUsername(username: string): Promise<UserRow | null> {
  const { User } = getModels();
  const row = await User.findOne({ where: { username: username.trim() } });
  return row ? plain<UserRow>(row) : null;
}

/** 账号：按主键查（token 里带的是 id 字符串） */
export async function findUserById(id: string | number): Promise<UserRow | null> {
  const n = Number(id);
  if (!Number.isFinite(n) || n <= 0) return null;
  const { User } = getModels();
  const row = await User.findByPk(n);
  return row ? plain<UserRow>(row) : null;
}

/** 账号：一级查看自己创建的二级账号（按创建时间倒序） */
export async function listL2Users(): Promise<UserRow[]> {
  const { User } = getModels();
  const rows = await User.findAll({ where: { role: "L2" }, order: [["createdAt", "DESC"]] });
  return rows.map((r) => plain<UserRow>(r));
}

/** 账号：一级发放二级账号 */
export async function createL2User(input: { username: string; passwordHash: string; plainPwd: string; createdBy: string }): Promise<void> {
  const { User } = getModels();
  await User.create({ username: input.username.trim(), passwordHash: input.passwordHash, plainPwd: input.plainPwd, role: "L2", status: "ok", createdBy: input.createdBy });
}

/** 账号：切换启用/禁用 */
export async function setUserStatus(id: string | number, status: string): Promise<void> {
  const { User } = getModels();
  await User.update({ status }, { where: { id: Number(id) } });
}

/** 一级切换二级的办证限制，返回切换后的值（1=已限制）；账号不存在或不是二级返回 null */
export async function toggleUserRestricted(id: string | number): Promise<number | null> {
  const { User } = getModels();
  const row = await User.findByPk(Number(id));
  if (!row) return null;
  const cur = row as unknown as UserRow;
  if (cur.role !== "L2") return null;
  const next = Number(cur.restricted) === 1 ? 0 : 1;
  await User.update({ restricted: next }, { where: { id: Number(id) } });
  return next;
}

/**
 * 办证限制检查：用二级账号登录办证查该账号；用卡密登录办证查发卡的那个二级。
 * 返回 true 表示已被限制，应拒绝生成。
 */
export async function isIssuerRestricted(createdBy: string): Promise<boolean> {
  const { User } = getModels();
  let username = "";
  if (createdBy.startsWith("PASS:")) {
    const key = await findCardKeyByCode(createdBy.slice(5));
    username = key?.createdByL2 || "";
  } else {
    username = createdBy;
  }
  if (!username) return false;
  const row = await User.findOne({ where: { username, role: "L2" } });
  if (!row) return false;
  return Number((row as unknown as UserRow).restricted) === 1;
}

/** 账号：删除二级账号，同时把它发出去还没用的卡密作废 */
export async function deleteL2User(id: string | number, username: string): Promise<void> {
  const { User, CardKey } = getModels();
  await CardKey.update({ status: "revoked" }, { where: { createdByL2: username, status: "unused" } });
  await User.destroy({ where: { id: Number(id) } });
}

/** 卡密：按卡密号查 */
export async function findCardKeyByCode(code: string): Promise<CardKeyRow | null> {
  const { CardKey } = getModels();
  const row = await CardKey.findOne({ where: { code: code.trim().toUpperCase() } });
  return row ? plain<CardKeyRow>(row) : null;
}

/** 卡密：新建一张 */
export async function createCardKey(input: { code: string; type: string; createdByL2: string }): Promise<void> {
  const { CardKey } = getModels();
  await CardKey.create({ code: input.code, type: input.type, status: "unused", createdByL2: input.createdByL2 });
}

/** 卡密：二级查看自己发的（最多100条，按时间倒序） */
export async function listCardKeysByL2(username: string, limit = 100): Promise<CardKeyRow[]> {
  const { CardKey } = getModels();
  const rows = await CardKey.findAll({ where: { createdByL2: username }, order: [["createdAt", "DESC"]], limit });
  return rows.map((r) => plain<CardKeyRow>(r));
}

/** 卡密：首次兑换，写入有效期并置为已使用 */
export async function markCardKeyUsed(id: number, expireAt: Date): Promise<void> {
  const { CardKey } = getModels();
  await CardKey.update({ status: "used", usedAt: new Date(), expireAt }, { where: { id } });
}

/** 卡密：置为已过期 */
export async function markCardKeyExpired(id: number): Promise<void> {
  const { CardKey } = getModels();
  await CardKey.update({ status: "expired" }, { where: { id } });
}

/**
 * 地区→体检机构映射：取第一个「regionKeyword 包含输入地区」的记录。
 * 原实现是 db.RegExp({ regexp: 输入, options: "i" })，等价于这里的模糊匹配（大小写不敏感）。
 */
export async function findRegionUnit(region: string): Promise<RegionUnitRow | null> {
  const { RegionUnit } = getModels();
  const kw = likeLiteral((region || "").trim());
  if (!kw) return null;
  const row = await RegionUnit.findOne({
    where: { regionKeyword: { [Op.like]: `%${kw}%` } },
    order: [["id", "ASC"]],
  });
  return row ? plain<RegionUnitRow>(row) : null;
}

/**
 * 取下一个编号序号（原子自增，避免并发办证撞号）。
 * 用 MySQL 的 LAST_INSERT_ID(expr) 技巧：单条语句完成「没有就建、有就+1」并回传新值，
 * 必须放在同一个事务里，保证 INSERT 和 SELECT 落到同一连接。
 */
export async function nextCertSeq(series: string): Promise<number> {
  const sequelize = getSequelize();
  return sequelize.transaction(async (t) => {
    await sequelize.query(
      `INSERT INTO \`${TABLES.certSeq}\` (series, seq) VALUES (:series, LAST_INSERT_ID(1))
       ON DUPLICATE KEY UPDATE seq = LAST_INSERT_ID(seq + 1)`,
      { replacements: { series }, transaction: t },
    );
    const [rows] = (await sequelize.query("SELECT LAST_INSERT_ID() AS n", { transaction: t })) as unknown as [Array<{ n: number | string }>, unknown];
    return Number(rows[0].n);
  });
}

/** 健康证：落库 */
export async function createCert(row: Omit<CertRow, "id" | "createdAt" | "updatedAt">): Promise<void> {
  const { Cert } = getModels();
  await Cert.create(row);
}

/**
 * 健康证：按编号 upsert（编号取自身份证号的模板同一人重复办证时直接覆盖，
 * 避免唯一键冲突导致办不出来）。
 */
export async function upsertCert(row: Omit<CertRow, "id" | "createdAt" | "updatedAt">): Promise<void> {
  const { Cert } = getModels();
  await Cert.upsert(row);
}

/** 健康证：验真页按编号查 */
export async function findCertByCertNo(certNo: string): Promise<CertRow | null> {
  const { Cert } = getModels();
  const row = await Cert.findOne({ where: { certNo } });
  return row ? plain<CertRow>(row) : null;
}

/** 健康证：公开验真按 token 查（只读，token 无匹配返回 null） */
export async function findCertByToken(token: string): Promise<CertRow | null> {
  const t = (token || "").trim();
  /** 新证 32 位，老证 64 位，两种都认，已发出去的不受影响 */
  if (!/^[0-9a-f]{32}$/i.test(t) && !/^[0-9a-f]{64}$/i.test(t)) return null;
  const { Cert } = getModels();
  const row = await Cert.findOne({ where: { verifyToken: t.toLowerCase() } });
  return row ? plain<CertRow>(row) : null;
}

/** 公告：公开列表（新发的在前，未登录也能看） */
export async function listNotices(): Promise<NoticeRow[]> {
  const { Notice } = getModels();
  const rows = await Notice.findAll({ order: [["id", "DESC"]] });
  return rows.map((r) => plain<NoticeRow>(r));
}

/** 公告：一级发布 */
export async function createNotice(content: string, createdBy: string): Promise<NoticeRow> {
  const { Notice } = getModels();
  const row = await Notice.create({ content, createdBy });
  return plain<NoticeRow>(row);
}

/** 公告：一级改内容，返回是否找到 */
export async function updateNotice(id: number, content: string): Promise<boolean> {
  const { Notice } = getModels();
  const [n] = await Notice.update({ content }, { where: { id } });
  return n > 0;
}

/** 公告：一级删除，返回是否找到 */
export async function deleteNotice(id: number): Promise<boolean> {
  const { Notice } = getModels();
  const n = await Notice.destroy({ where: { id } });
  return n > 0;
}

export interface L2Stat {
  id: string;
  username: string;
  status: string;
  /** 1=已限制办证 */
  restricted: number;
  keysTotal: number;
  keysUsed: number;
  certsTotal: number;
}

/**
 * 一级看板：每个二级的累计卡密 / 已使用卡密 / 办出健康证数。
 * 健康证归属该二级：办证时若用该二级账号登录，createdBy 记账号名；
 * 若用该二级发出的卡密登录，记 PASS:卡密——两种都归到发卡的那个二级，旧证同样计入。
 * since 传时间戳时只统计该时刻之后的数据（卡密按发出时间、已激活按激活时间、健康证按办证时间）。
 */
export async function l2Stats(since?: Date): Promise<L2Stat[]> {
  const { User, CardKey, Cert } = getModels();
  const { Op } = await import("sequelize");
  const users = await User.findAll({ where: { role: "L2" }, order: [["createdAt", "DESC"]] });
  const out: L2Stat[] = [];
  for (const u of users) {
    const name = String((u as unknown as { username: string }).username);
    const st = String((u as unknown as { status: string }).status);
    const uid = String((u as unknown as { id: number | string }).id);
    const restricted = Number((u as unknown as { restricted: number }).restricted) === 1 ? 1 : 0;
    const keyWhere: Record<string, unknown> = { createdByL2: name };
    if (since) keyWhere.createdAt = { [Op.gte]: since };
    const keys = await CardKey.findAll({ where: keyWhere, attributes: ["code", "status"] });
    const codes = keys.map((k) => String((k as unknown as { code: string }).code));
    /** 已激活：该时段内发出的卡密里已被使用的；累计视角下“作废”也算激活 */
    const used = since
      ? keys.filter((k) => (k as unknown as { status: string }).status === "used").length
      : keys.filter((k) => (k as unknown as { status: string }).status !== "unused").length;
    /** 健康证归属该二级：登录人直记的（createdBy=账号名）+ 早期用该二级卡密办的（createdBy=PASS:卡密） */
    const owners = [name, `PASS:${name}`, ...codes.map((c) => `PASS:${c}`)];
    const certWhere: Record<string, unknown> = { createdBy: owners };
    if (since) certWhere.createdAt = { [Op.gte]: since };
    const certs = await Cert.count({ where: certWhere });
    out.push({ id: uid, username: name, status: st, restricted, keysTotal: keys.length, keysUsed: used, certsTotal: certs });
  }
  return out;
}
