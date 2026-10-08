请先完整阅读并理解 背景信息.md，再检查实际项目代码。

当前项目已经完成：

Cloudflare DNS 已添加：
verify.monetyg-health.com
指向服务器：
38.55.146.127
verify.monetyg-health.com 已在宝塔/Nginx 配置完成，并能够反向代理到：
http://127.0.0.1:3000
verify.monetyg-health.com 已配置 HTTPS。

因此现在主要任务是：修改项目代码，让健康证二维码不再指向主站，而是指向验真子域名，并增加通过随机 Token 验证健康证的公开页面。

二、核心目标

最终架构：

主站：

https://monetyg-health.com

负责：

登录
管理员功能
制作健康证
健康证管理
生成健康证图片
其他原有业务

验真站：

https://verify.monetyg-health.com

负责：

扫描二维码后的健康证真实性验证
只提供公开、只读的验真页面
不需要登录
不暴露敏感信息

二维码最终应该类似：

https://verify.monetyg-health.com/v/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

其中最后的 Token 是随机生成的唯一 Token。

三、非常重要：先检查代码，不要直接乱改

在开始修改之前：

阅读 背景信息.md
检查项目目录结构
找到实际的 Sequelize Cert/健康证 Model
找到实际创建健康证的 API / Server Action / Service
找到当前二维码生成代码
找到当前健康证详情/验证相关代码
找到数据库初始化、迁移或者建表相关代码
确认当前 certs 表实际字段名称

不要假设字段名。

例如，不要直接假设一定叫：

certs
verify_token
certificate_number
status

必须先根据项目实际代码确定。

如果发现项目实际结构和背景信息.md不一致，以实际代码为准。

四、数据库改造

需要给健康证增加一个唯一的随机验真 Token。

目标字段：

verify_token
VARCHAR(64)
UNIQUE

如果项目已经有数据库迁移机制，请按照项目现有迁移方式增加字段。

不要直接破坏现有数据库。

如果项目使用 Sequelize migration：

创建新的 migration
增加 verify_token
添加 UNIQUE INDEX
rollback 时能够删除该字段/index

如果项目没有 migration 机制，请根据项目当前数据库管理方式实现，并告诉我应该执行什么 SQL。

五、Token 生成

使用 Node.js 原生 crypto：

import crypto from "crypto";

const verifyToken = crypto.randomBytes(32).toString("hex");

得到：

64位十六进制字符串

要求：

随机
不可预测
全局唯一
不使用自增 ID
不使用身份证号
不使用证书编号作为 Token
不允许用户自行指定 Token

如果项目已经存在合适的工具函数，可以复用，但必须保证安全随机。

六、健康证创建流程

找到项目当前“创建健康证”的完整流程。

在创建健康证时：

自动生成 verifyToken
保存到数据库
保证 Token 与该健康证一一对应
后续二维码直接使用这个 Token

例如：

const verifyToken = crypto.randomBytes(32).toString("hex");

然后保存：

verify_token = verifyToken

注意：

如果当前项目创建健康证的流程涉及：

Sequelize Model
API Route
Service
Server Action
Transaction

必须按照现有架构修改。

不要重新设计整个创建健康证流程。

只在必要的位置增加 Token。

七、修改二维码生成逻辑

找到项目当前二维码生成代码。

目前二维码很可能指向主站或者某个证书详情 URL。

现在统一改成：

https://verify.monetyg-health.com/v/{verifyToken}

例如：

const verifyDomain =
  process.env.VERIFY_DOMAIN || "https://verify.monetyg-health.com";

const verifyUrl = `${verifyDomain}/v/${verifyToken}`;

二维码内容应该是：

https://verify.monetyg-health.com/v/随机Token

而不是：

https://monetyg-health.com/...

也不要：

https://verify.monetyg-health.com/v/{certificateId}

必须使用随机 Token。

八、增加环境变量

检查项目当前环境变量管理方式。

生产环境增加：

VERIFY_DOMAIN=https://verify.monetyg-health.com

如果项目有 .env.example，同步增加：

VERIFY_DOMAIN=https://verify.monetyg-health.com

代码中优先使用：

process.env.VERIFY_DOMAIN

不要把域名散落硬编码到多个业务文件。

可以在统一配置文件中管理，但要遵循当前项目已有的配置方式。

九、增加公开验真页面

创建：

src/app/v/[token]/page.tsx

如果项目实际目录结构不同，请按照项目当前 Next.js App Router 结构创建。

页面访问：

https://verify.monetyg-health.com/v/{token}

例如：

https://verify.monetyg-health.com/v/abc123...

这个页面：

不需要登录
不需要 JWT
不需要管理员权限
不允许修改数据
只查询对应健康证
只展示必要的验真信息
十、验真逻辑

页面拿到：

token

然后查询数据库：

WHERE verify_token = token

如果不存在：

显示：

验真失败

未找到对应的健康证信息。
请确认二维码是否有效。

如果存在：

继续检查健康证状态和有效期。

按照项目当前实际字段判断：

是否已经作废
是否过期
是否有效

不要擅自改变原有业务状态定义。

十一、验真页面展示内容

验真页面不要把数据库中的所有信息全部返回给前端。

只展示必要的信息。

建议包含：

健康证验真

✓ 证件有效

姓名：张**
证件编号：********1234

发证机构：XXX
有效期：2026-01-01 至 2027-01-01

验真状态：
该证件信息与系统记录一致

如果项目实际字段名称不同，根据实际代码映射。

隐私要求

不要公开：

完整身份证号
完整手机号
完整住址
数据库 ID
JWT
内部 Token
数据库字段中其他不必要的敏感信息

尤其不能因为 Token 查询接口是公开的，就把整个健康证数据库对象直接 JSON 返回。

十二、重要安全要求

验真接口是公网接口。

因此必须考虑：

1. Token 不可预测

使用：

crypto.randomBytes(32)
2. 不允许通过 ID 查询

不要：

/v/1
/v/2
/v/3
3. 不暴露数据库完整对象

不要：

return cert;

只返回页面真正需要的数据。

4. 不允许修改

验真页面只能 GET 查询。

5. 不绕过原有状态逻辑

如果证书已经被注销、作废或者过期，应该按照项目原来的业务规则显示无效。

十三、Next.js 版本兼容

这是 Next.js 16 项目。

如果使用 App Router 动态路由：

src/app/v/[token]/page.tsx

注意 Next.js 16 的 params 类型和异步处理方式。

例如：

type Props = {
  params: Promise<{
    token: string;
  }>;
};

export default async function Page({ params }: Props) {
  const { token } = await params;

  // ...
}

具体以项目当前 Next.js 16 写法为准。

不要为了这个功能升级或降级 Next.js。

十四、数据库查询层

如果项目使用 Sequelize：

优先使用当前项目已有的 Model。

类似：

const cert = await Cert.findOne({
  where: {
    verify_token: token,
  },
});

但是：

不要直接复制这段代码。

必须先确认项目实际：

Model 名称
字段名称
Sequelize 初始化方式
数据库连接方式

然后按照项目现有代码风格实现。

十五、不要破坏现有功能

这是一个正在使用的医院项目。

因此：

禁止大规模重构。

不要：

更换数据库
更换 ORM
更换 Next.js
更换 UI 框架
重写认证系统
重写健康证创建逻辑
重写二维码库
删除现有接口
删除已有字段
修改无关页面
修改无关 API

只实现本次需求所需要的最小改动。

十六、兼容历史健康证

请先检查项目当前是否已经存在历史健康证数据。

如果存在：

不要让历史数据因为新增 verify_token 直接全部失效。

请设计兼容方案。

优先方案：

新创建的健康证自动生成 Token
历史健康证如果需要继续验真，可以提供一次性 Token 回填/迁移方案
不要自动生成大量 Token 后却不知道对应关系
不要破坏已有健康证

如果项目目前没有历史数据，则按最简单方案实现即可。

十七、二维码生成时的容错

二维码生成时，如果：

verifyToken

不存在：

不要静默生成错误二维码。

应该明确报错，例如：

该健康证缺少验真 Token，无法生成二维码

这样可以避免生成一个用户扫描后无法验真的二维码。

十八、页面 SEO / 搜索引擎

验真页面属于公开页面，但不希望被搜索引擎大量收录。

请考虑：

robots: noindex, nofollow

具体按照项目当前 Next.js metadata 写法实现。

十九、代码质量要求

完成后：

TypeScript 类型不能报错
ESLint 如果项目有配置，不能新增明显错误
不允许使用 any 来逃避类型问题
不允许留下 TODO
不允许写死数据库密码
不允许写死 JWT_SECRET
不允许把 Token 打到生产日志
不允许把完整身份证号打印到日志
二十、完成后必须自检

修改代码后，不要只告诉我“改好了”。

请实际检查：

代码检查

确认：

数据库字段存在
↓
创建健康证
↓
生成 verifyToken
↓
保存 verifyToken
↓
生成二维码
↓
二维码 URL = verify.monetyg-health.com/v/{token}
↓
访问 /v/{token}
↓
数据库查询
↓
判断证件状态/有效期
↓
展示验真页面

整条链路必须闭环。

二十一、运行检查

根据项目实际 package.json 执行：

npm run build

如果项目有 lint：

npm run lint

如果项目有 typecheck：

npm run typecheck

如果这些 script 不存在，不要自行添加无意义的 script。

请使用项目现有命令。

二十二、最终向我汇报

完成后，请按照下面格式告诉我：

1. 修改了哪些文件

逐个列出：

文件路径
修改内容
2. 数据库改了什么

明确告诉我：

表名
字段名
字段类型
索引
3. 二维码现在指向什么

给出一个实际格式：

https://verify.monetyg-health.com/v/{verifyToken}
4. 验真页面在哪里

明确告诉我：

src/app/v/[token]/page.tsx

或者实际路径。

5. 环境变量

告诉我需要增加什么：

VERIFY_DOMAIN=https://verify.monetyg-health.com
6. 是否存在历史数据兼容问题

明确告诉我：

有 / 没有

如果有，给出处理方案。

7. 执行了哪些检查

例如：

npm run build       PASS
npm run lint        PASS
8. 最后给我一份“服务器上还需要做什么”的清单

因为 Cloudflare、宝塔/Nginx、HTTPS 我已经配置好了。

你只需要告诉我代码修改完成后：

是否需要执行数据库 SQL / migration
是否需要 npm install
是否需要 npm run build
是否需要 pm2 restart
是否需要其他操作
最重要的要求

先读背景信息.md，再读实际代码。

不要假设项目结构。

不要大改项目。

不要重构无关代码。

不要擅自修改数据库业务逻辑。

这次改造的核心只有一句话：

主站负责制证，verify 子域名负责验真，二维码只携带随机 Token，验真页面通过 Token 查询对应健康证。

请现在开始检查项目并实施修改。