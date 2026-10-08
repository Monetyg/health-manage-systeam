-- 验真子域名改造：健康证表新增随机验真 Token
-- 用法（生产和本地各执行一次）：
--   mysql -uhealth -p health_cert < db/mysql_verify_token.sql
-- 说明：
--   1. 列允许 NULL：历史已办证件没有 token，之前生成的旧二维码不再管，
--      删掉旧 /verify 页后它们自然失效，不回填。
--   2. 新办证件 token 必填（由办证接口生成），UNIQUE 保证一一对应。
--   3. db/mysql_schema.sql 已同步，新建库直接包含本列。
ALTER TABLE `certs`
  ADD COLUMN `verify_token` VARCHAR(64) NULL COMMENT '公开验真随机Token（新证必填，历史旧证为空）' AFTER `cert_no`;

ALTER TABLE `certs`
  ADD UNIQUE KEY `uk_verify_token` (`verify_token`);
