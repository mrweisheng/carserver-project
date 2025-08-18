-- =====================================================
-- IP地理位置功能 - 数据库表结构修改SQL
-- 执行前请备份数据库
-- =====================================================

-- 1. 为 daily_visitors 表添加地理位置字段
ALTER TABLE `daily_visitors` 
ADD COLUMN `country` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '国家' AFTER `user_agent`,
ADD COLUMN `region` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '省份/州' AFTER `country`,
ADD COLUMN `city` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '城市' AFTER `region`,
ADD COLUMN `isp` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '网络服务商' AFTER `city`,
ADD COLUMN `timezone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '时区' AFTER `isp`,
ADD COLUMN `location_updated_at` timestamp NULL DEFAULT NULL COMMENT '地理位置更新时间' AFTER `timezone`,
ADD INDEX `idx_country` (`country` ASC) USING BTREE COMMENT '国家索引',
ADD INDEX `idx_region` (`region` ASC) USING BTREE COMMENT '省份索引',
ADD INDEX `idx_city` (`city` ASC) USING BTREE COMMENT '城市索引';

-- 2. 为 user_browsing_history 表添加地理位置字段
ALTER TABLE `user_browsing_history` 
ADD COLUMN `country` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '国家' AFTER `user_agent`,
ADD COLUMN `region` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '省份/州' AFTER `country`,
ADD COLUMN `city` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '城市' AFTER `region`,
ADD COLUMN `isp` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '网络服务商' AFTER `city`,
ADD COLUMN `timezone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '时区' AFTER `isp`,
ADD COLUMN `location_updated_at` timestamp NULL DEFAULT NULL COMMENT '地理位置更新时间' AFTER `timezone`,
ADD INDEX `idx_country` (`country` ASC) USING BTREE COMMENT '国家索引',
ADD INDEX `idx_region` (`region` ASC) USING BTREE COMMENT '省份索引',
ADD INDEX `idx_city` (`city` ASC) USING BTREE COMMENT '城市索引';

-- 3. 为 user_sessions 表添加地理位置字段
ALTER TABLE `user_sessions` 
ADD COLUMN `country` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '国家' AFTER `user_agent`,
ADD COLUMN `region` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '省份/州' AFTER `country`,
ADD COLUMN `city` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '城市' AFTER `region`,
ADD COLUMN `isp` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '网络服务商' AFTER `city`,
ADD COLUMN `timezone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '时区' AFTER `isp`,
ADD COLUMN `location_updated_at` timestamp NULL DEFAULT NULL COMMENT '地理位置更新时间' AFTER `timezone`,
ADD INDEX `idx_country` (`country` ASC) USING BTREE COMMENT '国家索引',
ADD INDEX `idx_region` (`region` ASC) USING BTREE COMMENT '省份索引',
ADD INDEX `idx_city` (`city` ASC) USING BTREE COMMENT '城市索引';

-- 4. 为 users 表添加更详细的地理位置字段
ALTER TABLE `users` 
ADD COLUMN `country` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '国家' AFTER `ip_address`,
ADD COLUMN `city` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '城市' AFTER `country`,
ADD COLUMN `isp` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '网络服务商' AFTER `city`,
ADD COLUMN `timezone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '时区' AFTER `isp`,
ADD COLUMN `location_updated_at` timestamp NULL DEFAULT NULL COMMENT '地理位置更新时间' AFTER `timezone`,
ADD INDEX `idx_country` (`country` ASC) USING BTREE COMMENT '国家索引',
ADD INDEX `idx_city` (`city` ASC) USING BTREE COMMENT '城市索引';

-- 5. 创建IP地理位置缓存表（提高性能，避免重复查询）
CREATE TABLE `ip_location_cache` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '缓存ID',
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'IP地址',
  `country` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '国家',
  `region` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '省份/州',
  `city` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '城市',
  `isp` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '网络服务商',
  `timezone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '时区',
  `latitude` decimal(10, 8) NULL DEFAULT NULL COMMENT '纬度',
  `longitude` decimal(11, 8) NULL DEFAULT NULL COMMENT '经度',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_ip_address` (`ip_address` ASC) USING BTREE COMMENT 'IP地址唯一索引',
  INDEX `idx_country` (`country` ASC) USING BTREE COMMENT '国家索引',
  INDEX `idx_region` (`region` ASC) USING BTREE COMMENT '省份索引',
  INDEX `idx_city` (`city` ASC) USING BTREE COMMENT '城市索引',
  INDEX `idx_updated_at` (`updated_at` ASC) USING BTREE COMMENT '更新时间索引'
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'IP地理位置缓存表' ROW_FORMAT = DYNAMIC;

-- 6. 创建访客地理位置统计视图
CREATE OR REPLACE VIEW `visitor_location_summary` AS
SELECT 
    `country`,
    `region`, 
    `city`,
    COUNT(*) as `visitor_count`,
    SUM(`request_count`) as `total_requests`,
    AVG(`request_count`) as `avg_requests_per_visitor`,
    MIN(`first_visit_time`) as `first_visit`,
    MAX(`last_visit_time`) as `last_visit`
FROM `daily_visitors` 
WHERE `country` IS NOT NULL
GROUP BY `country`, `region`, `city`
ORDER BY `visitor_count` DESC;

-- 7. 创建用户地理位置分布视图
CREATE OR REPLACE VIEW `user_location_summary` AS
SELECT 
    `country`,
    `region`,
    `city`,
    COUNT(*) as `user_count`,
    COUNT(CASE WHEN `status` = 1 THEN 1 END) as `active_users`,
    COUNT(CASE WHEN `role` = 2 THEN 1 END) as `admin_users`,
    MIN(`created_at`) as `first_registration`,
    MAX(`created_at`) as `last_registration`
FROM `users` 
WHERE `country` IS NOT NULL
GROUP BY `country`, `region`, `city`
ORDER BY `user_count` DESC;

-- 执行完成提示
SELECT 'IP地理位置字段添加完成！' as message;
