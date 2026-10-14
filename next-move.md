# 发给 workbuddy：本次增量部署（7 个提交，一次上线）

> 直接复制本文件全文发给 workbuddy。密码相关留了【待填】，发出前填好。

---

## 一、环境不变的东西（不用动，检查即可）

- 服务器 38.55.146.127，站点根目录 `/www/wwwroot/monetyg-health.com`，Node 必须 20.x。
- 主站 `https://monetyg-health.com` + 备站 `https://asxniuqw-xqjx.lol` + 验真站 `https://verify.monetyg-health.com`，反代都指向 `http://127.0.0.1:3000`（已配好，检查即可）。
- Cloudflare 相关记录保持橙色云朵，SSL 模式 Full (strict)。
- 双域名是故意保留的：A 域名办的证过不了审就换 B 办（已验证可行）。**不要做 301 跳转，不要合并站点。**

## 二、部署步骤（按顺序）

```bash
cd /www/wwwroot/monetyg-health.com
git pull
```

`git log --oneline -7` 应看到（从新到旧）：`de61abc / cde9985 / d3f4bec / 0b12fc6 / b17aab8 / 3d563f1 / 5a794a9`。

```bash
mysql -uhealth -p health_cert < db/mysql_verify_token.sql
mysql -uhealth -p health_cert < db/mysql_notices.sql
mysql -uhealth -p -e "SHOW COLUMNS FROM health_cert.certs LIKE 'verify_token%'; SHOW TABLES FROM health_cert LIKE 'notices';"
```

确认 `verify_token` 列存在（含 `uk_verify_token` 唯一键）+ `notices` 表存在。

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
PORT=3000
UPLOAD_DIR=/www/wwwroot/health-data/uploads
```

```bash
npm ci --registry=https://registry.npmmirror.com
npm run build
```

看到 `✓ Compiled successfully` 才算成。然后 PM2 重启项目（只 build 不 restart 跑的还是旧代码）：

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/
```

返回 `200`。

## 三、本次更新内容（7 个提交）

1. `5a794a9` 小鸟商洛模板（第 6 个按钮，编号=身份证号）。
2. `3d563f1` 验真子域名改造：二维码指向 `https://verify.monetyg-health.com/v/{token}`；新增 `/v/[token]` 公开验真页；**删除旧 `/verify` 页**（历史旧二维码失效，预期内）。
3. `b17aab8` token 64 位→32 位（二维码变稀好扫，老 64 位码继续兼容）。
4. `0b12fc6` 美团乐山模板（第 7 个按钮，无二维码）。
5. `d3f4bec` 三通保定模板（第 8 个按钮，12 位数字编号）。
6. `cde9985` 广东版二维码 150px→170px。
7. `de61abc` 公告功能：一级后台可发布/修改/删除，二/三级页面展示。

## 四、验证清单（逐项过）

1. `https://monetyg-health.com` 和 `https://asxniuqw-xqjx.lol` 都能打开，小锁无警告。
2. 一级后台登录 → 发二级账号 → 显示"发放成功"。
3. 一级后台最下方发一条测试公告 → 主页标题下和二级后台出现该公告 → 修改 → 删除（删干净，别留测试公告）。
4. 二级登录 → 生成卡密 → 主页输卡密 → 8 个模板按钮都在。
5. 选"三通保定"办一张证：编号是 12 位纯数字，有效期=办证+365 天，二维码在左照片在右。
6. 手机扫上一步的码：地址是 `https://verify.monetyg-health.com/v/` + 32 位字符，显示"证件有效"。
7. 用错 token（如 64 个 0）打 `/v/` 页显示"验真失败"。
8. PM2 日志无报错。

## 五、已知坑点

- Node 18 不行，必须 20.x；PM2 项目的 Node 版本单独选。
- 任何一步报错先停，把报错原文给我，不要猜着往下走。
