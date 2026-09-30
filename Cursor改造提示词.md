# Cursor 改造提示词：Mongoose → CloudBase Node SDK（v3 云托管鉴权修正版）

> ⚠️ **v3 相对 v2 的决定性修正**：v2 用的 `SYMBOL_DEFAULT_ENV` 是**云函数专用**常量，
> **在本项目的云托管（容器）环境里取不到值，会导致鉴权失败**（报 `getCredential failed`）。
> 本版改为**云托管可用的 API Key 鉴权**。这是能否跑通的关键差异。
>
> 使用方法：整段复制「提示词正文」给 Cursor。开工前先 `git add -A && git commit -m "chore: before cloudbase migration"`。

---

## 提示词正文（从下一行开始整段复制）

---

# 任务：把本项目的数据库层从 Mongoose 迁移到腾讯云 CloudBase Node SDK

## 0. 背景与目标

Next.js 16（App Router）+ TypeScript 健康证管理系统，原用 Mongoose 连 MongoDB。
现部署到**腾讯云 CloudBase 云托管（容器运行，不是云函数）**，改用官方 Node SDK（`@cloudbase/node-sdk`）访问文档型数据库。

**改造目标**：业务逻辑、接口签名、返回 JSON 结构**完全不变**，只替换数据访问层。

## 1. 硬性约束（违反即算失败）

1. **不改业务逻辑**：卡密规则（8位大写字母数字）、时长（1小时/1天/1周/1月）、身份证18位弱校验（`checkIdCard/genderOf/maskId` @ `src/lib/biz.ts`）、脱敏、编号规则（`code2+day+4位序号`）、年龄计算、二维码（`qrcode`）、验真3天有效期（`verifyExpireAt`）、北京时间取天（`bjDay()` UTC+8）——全部原样保留。**`esc()` / `bjDay()` 函数体一行不许动。**
2. **不改 API 签名和返回 JSON**：前端零改动。
3. **页面文件原则不动**：仅允许改 `src/app/verify/[code]/page.tsx` 的数据获取那一行，其余 `page.tsx` 和 `src/components/*` 禁止触碰。
4. 环境变量名不变：新增 `CLOUDBASE_ENV_ID`、`CLOUDBASE_APIKEY`；`MONGODB_URI` 废弃但保留读取兼容；`JWT_SECRET/DOMAIN/ADMIN_PASSWORD/COS_*` 完全不动。
5. `npx tsc --noEmit` 零错误，`npm run build` 成功。
6. 只新增依赖 `@cloudbase/node-sdk`，不引入其他依赖，不升级 next/react。
7. 不确定的 SDK 写法**先停下问我，不许臆造 API**。

## 2. CloudBase Node SDK 标准用法（照抄，不许自创）

### 2.1 安装

```bash
npm install @cloudbase/node-sdk
```

### 2.2 初始化 —— ⚠️ 本项目跑在【云托管】，鉴权必须用 API Key

**关键背景（这是最容易错、且错了本地看不出、上线必挂的地方）**：

- `tcb.SYMBOL_DEFAULT_ENV` 是**云函数专用**常量。**在云托管容器里它取不到值**，会导致鉴权失败，报 `getCredential failed` 或 `secretId or secretKey not found`，**所有数据库调用全部失败**。
- 云托管的正确做法：**显式传 `env`（环境 ID）+ `accessKey`（服务端 API Key）**。
- 官方原文（服务端 API Key 鉴权）：「用户在 init 中无需传入，自动从环境变量读取 `CLOUDBASE_APIKEY`」。

**新建 `src/lib/cloudbase.ts`，按此实现（懒加载单例，防止 build 期初始化崩溃）：**

```ts
import cloudbase from "@cloudbase/node-sdk";

/** CloudBase App 单例缓存. */
let _app: ReturnType<typeof cloudbase.init> | null = null;

/**
 * 获取 CloudBase App 单例（懒加载）。
 * 云托管环境用 env + accessKey 鉴权；accessKey 从环境变量 CLOUDBASE_APIKEY 读取。
 * ⚠️ 只能在请求处理函数内部调用，禁止在模块顶层调用（否则 next build 阶段会崩）。
 */
export function getApp() {
  if (!_app) {
    _app = cloudbase.init({
      env: process.env.CLOUDBASE_ENV_ID,        // 环境 ID，如 tnt-7y965qmm
      accessKey: process.env.CLOUDBASE_APIKEY,  // 服务端 API Key
    });
  }
  return _app;
}

/** 获取数据库实例（同样只能在请求处理函数内调用）. */
export function getDb() {
  return getApp().database();
}
```

> ⚠️ **铁律**：`getApp()` / `getDb()` **只能在 API route 的处理函数、或 Server Component 的渲染函数内部调用**。
> **绝对禁止**在模块顶层、或模块级常量里调用，否则 `next build` 静态分析阶段会触发初始化并导致构建崩溃。

### 2.3 API 对照表（右边是唯一正确写法）

| 原 Mongoose | CloudBase SDK（必须照此） |
|---|---|
| `await dbConnect()` | 保留调用点，函数体改为空（见 §3.3），不许删文件 |
| `Model.find(c).sort({createdAt:-1}).lean()` | `(await getDb().collection("X").where(c).orderBy("createdAt","desc").get()).data` |
| `... .limit(100)` | `(await getDb().collection("X").where(c).orderBy("createdAt","desc").limit(100).get()).data` |
| `Model.findOne(c)` | `(await getDb().collection("X").where(c).limit(1).get()).data[0] ?? null` |
| `Model.findById(id)` | `try { return (await getDb().collection("X").doc(String(id)).get()).data[0] ?? null; } catch { return null; }` |
| `Model.create(doc)` | `await getDb().collection("X").add({ ...doc, createdAt: getDb().serverDate(), updatedAt: getDb().serverDate() })` |
| `Model.countDocuments(c)` | `(await getDb().collection("X").where(c).count()).total` |
| `Model.updateMany(f,u)` | `await getDb().collection("X").where(f).update(u)` |
| `Model.deleteOne({_id:id})` | `await getDb().collection("X").doc(String(id)).remove()` |
| `doc.save()`（改字段后存） | `await getDb().collection("X").doc(String(doc._id)).update({ 仅改动字段, updatedAt: getDb().serverDate() })` |
| `new RegExp(esc(x))` 模糊匹配 | `.where({k: getDb().RegExp({ regexp: esc(x), options: "i" })})` |
| `new RegExp("^"+p)` 前缀计数 | `.where({k: getDb().RegExp({ regexp: "^"+p })})` —— **不加 options，保持大小写敏感，与原行为一致** |
| 自增 / 服务端时间 | `getDb().command.inc(1)` / `getDb().serverDate()` |
| 日期比较 | SDK 回来的可能是 `{ $date: number }` / ISO 字符串 / Date，统一 `new Date(v as unknown as string)` 后再比较，**禁止直接 `v as Date`** |

> ⚠️ `.doc().get()` 在文档不存在时会**抛错**，必须 try/catch 包裹。
> ⚠️ `add()` 返回 `{ id }`（部分版本 `{ _id }`）。**不要依赖返回值取字段**，需要什么字段用入参变量。

### 2.4 集合名（保持大小写，与原 model 名一致）

`User` / `CardKey` / `RegionUnit` / `Cert`，用 `COLL` 常量集中管理，禁止硬编码散落。

## 3. 文件级改造清单（共 10 处）

### 3.1 新增 `src/lib/cloudbase.ts`

见 §2.2 模板，**原样创建，JSDoc 必留**。

### 3.2 `src/lib/models.ts` —— 完全重写为「类型 + 集合名」，不再 export mongoose model

```ts
/** 集合名常量. */
export const COLL = {
  User: "User",
  CardKey: "CardKey",
  RegionUnit: "RegionUnit",
  Cert: "Cert",
} as const;

/** 基础文档类型（CloudBase 的 _id 是字符串）. */
export type DbDoc = { _id: string; createdAt?: unknown; updatedAt?: unknown; [k: string]: unknown };
/** 用户文档. */
export type UserDoc = DbDoc & { username: string; passwordHash: string; plainPwd?: string; role: "L1" | "L2"; status?: string; createdBy?: string };
/** 卡密文档. */
export type CardKeyDoc = DbDoc & { code: string; type: "HOUR_1" | "DAY_1" | "WEEK_1" | "MONTH_1"; status: string; createdByL2?: string; usedAt?: unknown; expireAt?: unknown };
/** 地区映射文档. */
export type RegionUnitDoc = DbDoc & { regionKeyword: string; unitName: string; regionCode?: string };
/** 健康证文档. */
export type CertDoc = DbDoc & { certNo: string; [k: string]: unknown };
```

> ⚠️ **不要** `import type { Database } from "@cloudbase/node-sdk"` —— 该类型名未必是 SDK 公开导出，会导致 tsc 报错。

### 3.3 `src/lib/db.ts` —— 改为空兼容函数

```ts
/**
 * 历史调用点兼容函数。CloudBase SDK 内部自动管理连接，无需手动建连。
 */
export async function dbConnect(): Promise<void> {
  return;
}
```

全项目保留 `await dbConnect()` 调用亦可，零风险，不许删文件。

### 3.4 `src/app/api/admin/l2/route.ts`

- 列表：`where({role:"L2"}).orderBy("createdAt","desc").get()` → 取 `.data`
- 用户名查重：`where({username}).limit(1).get()` → 取 `data[0]`，**禁止依赖 `e.code===11000`**
- 新增：`add({ username, passwordHash, plainPwd, role:"L2", status:"ok", createdBy, createdAt: serverDate(), updatedAt: serverDate() })`
- 查单条：`doc(String(id)).get()` + try/catch，再校验 `role === "L2"`
- 改状态：`doc(String(id)).update({ status, updatedAt: serverDate() })`
- 联动撤销卡密：`where({createdByL2: username, status:"unused"}).update({status:"revoked"})`
- 删除：`doc(String(id)).remove()`

### 3.5 ~ 3.9 其余 API

涉及文件：`src/app/api/l2/keys/route.ts`、`src/app/api/auth/login/route.ts`、`src/app/api/me/route.ts`、`src/app/api/pass/redeem/route.ts`、`src/app/api/pass/status/route.ts`

- 一律 `where(...).limit(1).get()` 取 `data[0] ?? null`
- `findById` 一律 `doc(String(uid)).get()` + try/catch
- `redeem`：`usedAt` 用 `serverDate()`；`expireAt` 用本地算好的 `Date`（**时长逻辑不动**）；过期判断先 `new Date(k.expireAt)` 转换
- `status`：只读，不写时间
- `keys` 列表：`where({createdByL2}).orderBy("createdAt","desc").limit(100).get()`

### 3.10 `src/app/api/certs/route.ts`（改动最多，务必仔细）

- `User.findById` → `doc(String(uid)).get()` + try/catch；禁用判断 `status==="disabled"` 保留
- `RegionUnit.findOne({regionKeyword: new RegExp(esc(region))})` → `where({regionKeyword: getDb().RegExp({ regexp: esc(region.trim()), options:"i" })}).limit(1).get()`
- 计数：`where({certNo: getDb().RegExp({ regexp: "^"+code2+day })}).count()` → 取 `.total`
- `Cert.create` → `add({ ...全部原字段, createdAt: serverDate(), updatedAt: serverDate() })`
  - 重试循环保留 3 次，catch 改为**捕获任意错误后 `cert = null; continue`**（不再判断 `e.code === 11000`）
  - `add` 返回值不可靠，**后续只用本地已算好的 `certNo` 变量**拼二维码，禁止依赖返回值字段
- `esc()` / `bjDay()` / 年龄 / organ / to / tpl / qrcode 逻辑**逐行保留**

### 3.11 `src/app/verify/[code]/page.tsx`（唯一允许动的页面）

只改数据获取这一行：

```ts
const c = (await getDb().collection(COLL.Cert).where({ certNo: code }).limit(1).get()).data[0] as any;
```

其余 JSX 一行不动。此页是 Server Component，在渲染函数内调用 `getDb()` 合法。

## 4. 类型与 Lint 红线

- 全项目删除 `mongoose`、`ObjectId`、`new mongoose.Types`、`.lean()`、`.save()`、`e.code===11000`、`SYMBOL_DEFAULT_ENV`
- 所有 `doc().get()` 必须 try/catch
- 所有 `.get()` 取 `.data` / `.data[0] ?? null`；所有 `.count()` 取 `.total`
- 所有 `add()` 必须带 `createdAt/updatedAt: serverDate()`
- `any` 仅允许在 catch 与 SDK 回包处，用 `as unknown as` 中转
- **禁止在模块顶层调用 `getApp()` / `getDb()`**

## 5. 验证与交付

1. `npx tsc --noEmit` 零错误；`npm run build` 成功
2. `rg -n "mongoose|ObjectId|\.lean\(|\.save\(|11000|SYMBOL_DEFAULT_ENV" src` **无命中**
3. 输出：改动文件清单 + 每文件关键 diff 摘要 + `package.json` 依赖变化
4. 有拿不准的 SDK 签名，停下提问，不许编造

---

## 提示词正文结束

---

## 附：改造完成后，云侧必做（人工操作，非 Cursor 任务）

### A. 生成服务端 API Key（数据库鉴权用）

1. CloudBase 控制台 → 左下角【**环境管理**】→ 左侧菜单【**API Key 配置**】
2. 找到【**服务端 API Key**】区域（上方那个是「客户端 Publishable Key」，**不要用错**）
3. 点【创建 API Key】→ 填名称如 `health-server` → 创建
4. **立即复制完整 Key 值**（明文只显示一次，关掉就看不到了）
   > ⚠️ 该 Key 拥有本环境资源读写权限，**只配到云托管环境变量，绝不写进代码仓库**

### B. 手动建唯一索引（SDK 不会自动建，原 `unique:true` 已失效）

路径：文档型数据库 → 集合管理 → 索引管理，为以下字段建**唯一索引**：

- `User.username`
- `CardKey.code`
- `Cert.certNo`

> ⚠️ 不建的话会出现重复用户名、重复卡密、重复证件号。

### C. 云托管新增环境变量

| 变量名 | 值 |
|---|---|
| `CLOUDBASE_ENV_ID` | `tnt-7y965qmm` |
| `CLOUDBASE_APIKEY` | 步骤 A 生成的完整 Key |

（其余变量 `JWT_SECRET` / `DOMAIN` / `ADMIN_PASSWORD` / `COS_*` 照旧；`MONGODB_URI` 可留可删，已不再使用）
