-- ============================================
-- 建表 SQL（MySQL 5.7 可用）
-- 字符集 utf8mb4：姓名、机构名里的生僻字/符号都存得下
-- 引擎 InnoDB：支持事务（编号自增必须用事务）
-- ============================================
CREATE DATABASE IF NOT EXISTS `health_cert`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_general_ci;
USE `health_cert`;

-- 账号（一级/二级，原 CloudBase User 集合）
CREATE TABLE IF NOT EXISTS `users` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增主键（替代 Mongo 的 _id）',
  `username`      VARCHAR(64)  NOT NULL COMMENT '登录账号',
  `password_hash` VARCHAR(100) NOT NULL COMMENT 'bcrypt 密文',
  `plain_pwd`     VARCHAR(64)  NULL COMMENT '明文备份（一级查看用）',
  `role`          VARCHAR(8)   NOT NULL DEFAULT 'L2' COMMENT 'L1/L2',
  `status`        VARCHAR(16)  NOT NULL DEFAULT 'ok' COMMENT 'ok=启用 disabled=禁用',
  `created_by`    VARCHAR(64)  NULL COMMENT '创建人',
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  KEY `idx_role` (`role`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='账号';

-- 卡密（三级通行证，原 CloudBase CardKey 集合）
CREATE TABLE IF NOT EXISTS `card_keys` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code`          VARCHAR(16) NOT NULL COMMENT '卡密号（大写字母数字）',
  `type`          VARCHAR(16) NOT NULL DEFAULT 'DAY_1' COMMENT 'HOUR_1/DAY_1/WEEK_1/MONTH_1',
  `status`        VARCHAR(16) NOT NULL DEFAULT 'unused' COMMENT 'unused/used/expired/revoked',
  `created_by_l2` VARCHAR(64) NULL COMMENT '发放该卡密的二级账号',
  `used_at`       DATETIME NULL COMMENT '首次兑换时间',
  `expire_at`     DATETIME NULL COMMENT '有效期截止',
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_l2` (`created_by_l2`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='卡密';

-- 地区→体检机构映射（原 CloudBase RegionUnit 集合）
CREATE TABLE IF NOT EXISTS `region_units` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `region_keyword` VARCHAR(64)  NOT NULL COMMENT '地区关键词（如 深圳）',
  `unit_name`      VARCHAR(128) NOT NULL COMMENT '体检单位全称',
  `region_code`    VARCHAR(16)  NULL COMMENT '编号前缀（如 SZ）',
  `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_keyword` (`region_keyword`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='地区机构映射';

-- 健康证（原 CloudBase Cert 集合）
CREATE TABLE IF NOT EXISTS `certs` (
  `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `cert_no`          VARCHAR(32)  NOT NULL COMMENT '证件编号（验真页 key）',
  `name`             VARCHAR(64)  NOT NULL DEFAULT '' COMMENT '持证人姓名',
  `id_card_mask`     VARCHAR(32)  NOT NULL DEFAULT '' COMMENT '脱敏身份证（如 4401********1234）',
  `gender`           VARCHAR(4)   NOT NULL DEFAULT '' COMMENT '男/女',
  `age`              VARCHAR(4)   NOT NULL DEFAULT '' COMMENT '周岁（算不出为 --）',
  `province`         VARCHAR(32)  NOT NULL DEFAULT '' COMMENT '省份（gd 模板用）',
  `region`           VARCHAR(64)  NOT NULL DEFAULT '' COMMENT '地区（gd/e 模板用）',
  `unit_name`        VARCHAR(128) NOT NULL DEFAULT '' COMMENT '体检单位',
  `organ`            VARCHAR(128) NOT NULL DEFAULT '' COMMENT '发证机构',
  `category`         VARCHAR(32)  NULL COMMENT '从业类别（lz/fs 模板为 食品）',
  `template`         VARCHAR(8)   NOT NULL DEFAULT 'gd' COMMENT 'gd/e/lz/hz/fs',
  `photo_url`        VARCHAR(255) NOT NULL DEFAULT '' COMMENT '持证人照片 URL',
  `exam_date`        DATE         NULL COMMENT '体检日期（YYYY-MM-DD）',
  `verify_expire_at` DATETIME NULL COMMENT '验真页有效期',
  `created_by`       VARCHAR(64)  NOT NULL DEFAULT '' COMMENT '办证人（L1/L2 用户名或 PASS:卡密）',
  `created_at`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cert_no` (`cert_no`),
  KEY `idx_created` (`created_by`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='健康证';

-- ============================================
-- 编号序列（新增表，原 CloudBase 里没有）
-- 为什么需要：原实现用「正则计数+insert冲突重试」防重号，
-- MySQL 里直接做成乐观序列：同一 series 一行，取号时原子 +1。
-- ============================================
CREATE TABLE IF NOT EXISTS `cert_seqs` (
  `series` VARCHAR(24) NOT NULL COMMENT '编号前缀（series）',
  `seq`    INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '已发到的序号',
  PRIMARY KEY (`series`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='编号序列';
