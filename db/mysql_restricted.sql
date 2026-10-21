-- 二级限制造功能：限制后该二级及其发出的卡密不能生成健康证
-- 用法（生产执行一次）：mysql -uhealth -p health_cert < db/mysql_restricted.sql
ALTER TABLE `users` ADD COLUMN `restricted` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1=已限制办证';
