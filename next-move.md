# 发给 workbuddy：本次增量部署（13 个提交，一次上线）

> 直接复制本文件全文发给 workbuddy。密码相关留了【待填】，发出前填好。

---

## 一、环境不变的东西（不用动，检查即可）

- 服务器 38.55.146.127，站点根目录 `/www/wwwroot/monetyg-health.com`，Node 必须 20.x。
- 三个主站域名 `https://monetyg-health.com`、`https://asxniuqw-xqjx.lol`、`https://dwafadwafadwa.xyz` + 验真站 `https://verify.monetyg-health.com`，反代都指向 `http://127.0.0.1:3000`（已配好，检查即可）。
- Cloudflare 相关记录保持橙色云朵，SSL 模式 Full (strict)。
- 多域名是故意保留的：A 域名办的证过不了审就换 B 办（已验证可行）。**不要做 301 跳转，不要合并站点。**
- 三个域名共用同一套界面，但**二维码按访客进来的域名各指各的验真地址**（见第三节第 13 条）。

## 一·B、部署前必须确认的 Nginx 反代配置（关键）

三个主站域名（monetyg-health.com / asxniuqw-xqjx.lol / dwafadwafadwa.xyz）的反代 location 里，**必须**有下面这行：

```
proxy_set_header Host $host;
```

原因：二维码域名是根据"访客进来的域名"动态生成的，靠这行把真实域名透传给后端。**缺了这行，二维码会指错域名，扫码打不开。** 逐站点检查，缺的补上，改完 `nginx -t` 再重载。

## 二、部署步骤（按顺序）

```bash
cd /www/wwwroot/monetyg-health.com
git pull
```

`git log --oneline -13` 应能看到 `b1c75d4` 在最上面（本次最新提交）。

```bash
mysql -uhealth -p health_cert < db/mysql_verify_token.sql
mysql -uhealth -p health_cert < db/mysql_notices.sql
mysql -uhealth -p health_cert < db/mysql_restricted.sql
```

三个 SQL 都是幂等/只增列或建表，重复执行不会坏数据。执行完检查：

```bash
mysql -uhealth -p -e "SHOW COLUMNS FROM health_cert.certs LIKE 'verify_token%'; SHOW COLUMNS FROM health_cert.users LIKE 'restricted'; SHOW TABLES FROM health_cert LIKE 'notices';"
```

应看到：`verify_token` 列存在、`restricted` 列存在（默认 0）、`notices` 表存在。

检查 `.env.production`，必须包含以下全部（只增改缺项，不要重建文件）：

```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=health_cert
DB_USER=health
DB_PASSWORD=【待填：宝塔建库密码】
JWT_SECRET=（64位随机串，已有就别动）
ADMIN_PASSWORD=【待填：一级后台密码】
DOMAIN=https://monetyg-health.com
VERIFY_DOMAIN=https://verify.monetyg-health.com（本次新增，没有就加上）
VERIFY_DOMAIN_MAP=monetyg-health.com=https://verify.monetyg-health.com（本次新增，没有就加上）
PORT=3000
UPLOAD_DIR=/www/wwwroot/health-data/uploads
```

```bash
npm ci --registry=https://registry.npmmirror.com
npm run build
```

看到 `✓ Compiled successfully` 才算成。然后 **PM2 必须重启**（只 build 不 restart 跑的还是旧代码）：

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/
```

返回 `200`。

## 三、本次更新内容（13 个提交）

模板类：
1. `5a794a9` 小鸟商洛模板（第 6 个按钮，编号=身份证号）。
2. `0b12fc6` 美团乐山模板（第 7 个按钮，无二维码）。
3. `d3f4bec` 三通保定模板（第 8 个按钮，12 位数字编号）。
4. `2fce09d` 三通保定排版返工：证套区压矮、正文行距放宽、红章收进卡片内。
5. `cde9985` 广东版二维码 150px→170px（对齐样张尺寸）。

验真类：
6. `3d563f1` 验真子域名改造：二维码指向 `https://verify.monetyg-health.com/v/{token}`；新增 `/v/[token]` 公开验真页；**删除旧 `/verify` 页**（历史旧二维码失效，预期内）。
7. `b17aab8` token 64 位→32 位（二维码变稀好扫，老 64 位码继续兼容）。
13. `b1c75d4` 多域名支持：二维码按访客进来的域名各指各的验真地址（靠上面一·B 的 `proxy_set_header Host` + `VERIFY_DOMAIN_MAP`）。

功能类：
8. `de61abc` 公告功能：一级后台可发布/修改/删除，二级后台与三级主页展示，未登录可见，多条并存。
9. `0789ee5` 一级看板：每个二级的累计卡密数 / 已激活卡密数 / 办出健康证数。
10. `699ec4d` 看板口径修正：二级自己登录办的证也计入该二级。
11. `9c4e81f` 看板加时间段切换：累计 / 近1天（24小时）/ 近3天（72小时）。
12. `6a2375f` 二级限制功能：一级可限制某个二级，限制后该二级及其发出的卡密**不能生成健康证**（发卡密、登录、填资料都正常），点击生成时提示“你的IP存在风险,请稍后尝试”，可随时解除。

## 四、验证清单（逐项过）

基础：
1. 三个域名 `https://monetyg-health.com`、`https://asxniuqw-xqjx.lol`、`https://dwafadwafadwa.xyz` 都能打开，小锁无警告。

账号与公告：
2. 一级后台登录（`/admin` 输入一级密码）→ 发放二级账号 → 显示成功。
3. 一级后台“发布公告”→ 发一条测试公告 → 主页“健康证办理”标题下、二级后台下方都能看到，带发布时间 → 修改 → 删除（**测完删干净，别留测试公告**）。

统计看板：
4. 一级后台最底部“二级数据统计”能看到：卡密总数 / 已激活 / 健康证数，以及每个二级的数字。
5. 点右上角“近1天”“近3天”能切换，数字应该 ≤ 累计，且近1天 ≤ 近3天。

限制功能：
6. 一级后台统计区点某个二级的“限制”→ 该账号旁出现“已限制办证”黄标，按钮变“解除限制”。
7. 用这个二级发一张卡密 → 主页用该卡密登录（应成功）→ 填资料选模板 → 点“生成健康证” → 应弹出红底红字“你的IP存在风险,请稍后尝试”，**且页面不退回卡密框、已填资料还在**。
8. 回到一级后台点“解除限制”→ 同一张卡密再点生成 → 应正常出证（**测完把这张测试证和卡密清理掉**）。

模板与二维码：
9. 二级登录 → 生成卡密 → 主页输卡密 → 8 个模板按钮都在。
10. 选“三通保定”办一张证：12 位纯数字编号、有效期=办证+365 天、上方证套区不占太多高度、红章完全在卡片内不溢出、二维码在左照片在右。
11. **多域名二维码分流（本次重点）**：分别从三个域名各办一张带二维码的证（如三通保定），检查二维码地址：
    - 从 `monetyg-health.com` 办 → `https://verify.monetyg-health.com/v/{token}`
    - 从 `asxniuqw-xqjx.lol` 办 → `https://asxniuqw-xqjx.lol/v/{token}`
    - 从 `dwafadwafadwa.xyz` 办 → `https://dwafadwafadwa.xyz/v/{token}`
    （若某个域名办出的码不是对应自己的域名，多半是那个站点缺 `proxy_set_header Host $host`，回一·B 检查）
12. 手机扫上面任一二维码，能打开对应域名、显示“证件有效”。
13. 访问 `https://verify.monetyg-health.com/v/` + 64 个 0，应显示验真失败（不是 500 白屏）。

日志：
14. `pm2 logs` 无报错、无重复崩溃重启。

## 五、已知坑点

- Node 18 不行，必须 20.x；PM2 项目的 Node 版本要单独选。
- `npm run build` 之后一定要 PM2 重启，否则跑的是旧代码（历史上踩过）。
- 三个 SQL 里 `mysql_verify_token.sql` 涉及历史数据兼容，**不要跳过**，跳过后新办证仍然能出但老证验真会异常。
- **Nginx 的 `proxy_set_header Host $host` 三站都要有**，缺了二维码会指错域名（本次新增功能的命脉）。
- 详细验证第 11 步是本次重点，务必三个域名各办一张证核对二维码域名。
- 任何一步报错先停，把报错原文发我，不要猜着往下走。
