-- 公告功能：一级发布，多条并存可改可删，二/三级公开只读展示
-- 用法（生产执行一次，本地已执行）：
--   mysql -uhealth -p health_cert < db/mysql_notices.sql
-- 说明：db/mysql_schema.sql 已同步，新建库直接包含本表。
CREATE TABLE IF NOT EXISTS `notices` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `content`    TEXT NOT NULL COMMENT '公告内容（不限制字数）',
  `created_by` VARCHAR(64) NOT NULL DEFAULT 'admin' COMMENT '发布人',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='公告';
