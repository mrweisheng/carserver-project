-- 访客统计表
-- 用于记录每日独立访客数量和请求次数统计

DROP TABLE IF EXISTS `daily_visitors`;
CREATE TABLE `daily_visitors` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '记录ID（自增主键）',
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '访客IP地址',
  `visit_date` date NOT NULL COMMENT '访问日期（年月日）',
  `request_count` int NOT NULL DEFAULT 1 COMMENT '当日请求次数',
  `first_visit_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '首次访问时间',
  `last_visit_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后访问时间',
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '用户代理信息',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_ip_date`(`ip_address` ASC, `visit_date` ASC) USING BTREE COMMENT 'IP地址和日期的唯一索引',
  INDEX `idx_visit_date`(`visit_date` ASC) USING BTREE COMMENT '访问日期索引',
  INDEX `idx_ip_address`(`ip_address` ASC) USING BTREE COMMENT 'IP地址索引',
  INDEX `idx_request_count`(`request_count` ASC) USING BTREE COMMENT '请求次数索引'
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '每日访客统计表' ROW_FORMAT = DYNAMIC;

-- 创建视图：每日访客统计汇总
DROP VIEW IF EXISTS `daily_visitor_summary`;
CREATE VIEW `daily_visitor_summary` AS
SELECT 
  `visit_date` AS `date`,
  COUNT(*) AS `unique_visitors`,
  SUM(`request_count`) AS `total_requests`,
  AVG(`request_count`) AS `avg_requests_per_visitor`,
  MIN(`first_visit_time`) AS `first_visit_of_day`,
  MAX(`last_visit_time`) AS `last_visit_of_day`
FROM `daily_visitors`
GROUP BY `visit_date`
ORDER BY `visit_date` DESC;

-- 插入测试数据（可选）
-- INSERT INTO `daily_visitors` (`ip_address`, `visit_date`, `request_count`, `user_agent`) VALUES
-- ('192.168.1.1', CURDATE(), 5, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
-- ('192.168.1.2', CURDATE(), 3, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'),
-- ('192.168.1.3', CURDATE(), 1, 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15');
