-- 卡密单设备登录：首次登录绑定设备标识，之后只允许该设备使用
-- 用法（生产执行一次）：mysql -uhealth -p health_cert < db/mysql_bound_device.sql
ALTER TABLE `card_keys` ADD COLUMN `bound_device` VARCHAR(64) NULL COMMENT '首次登录绑定的设备标识';
