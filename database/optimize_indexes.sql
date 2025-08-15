-- 数据库索引优化脚本
-- 用于优化 /api/vehicles/featured 和 /api/vehicles/latest 接口的查询性能

-- 为 featured 接口优化的复合索引
-- 查询条件：vehicle_type=1, year范围, current_price范围, original_price不为空且大于current_price
CREATE INDEX IF NOT EXISTS idx_vehicles_featured 
ON vehicles (vehicle_type, year, current_price, original_price, id)
WHERE vehicle_type = 1 
  AND year >= '2017' 
  AND year <= '2025' 
  AND current_price >= 150000 
  AND current_price <= 270000 
  AND original_price IS NOT NULL;

-- 为 latest 接口优化的复合索引
-- 查询条件：year范围, current_price范围, original_price不为空且大于current_price, created_at范围
CREATE INDEX IF NOT EXISTS idx_vehicles_latest 
ON vehicles (year, current_price, original_price, created_at, id)
WHERE year >= '2017' 
  AND year <= '2025' 
  AND current_price >= 150000 
  AND current_price <= 270000 
  AND original_price IS NOT NULL;

-- 为 created_at 字段单独创建索引（如果不存在）
-- 用于优化按创建时间排序和时间范围查询
CREATE INDEX IF NOT EXISTS idx_vehicles_created_at 
ON vehicles (created_at DESC);

-- 为 vehicle_type 字段创建索引（如果不存在）
-- 用于优化车辆类型过滤
CREATE INDEX IF NOT EXISTS idx_vehicles_type 
ON vehicles (vehicle_type);

-- 为价格字段创建复合索引
-- 用于优化价格范围查询
CREATE INDEX IF NOT EXISTS idx_vehicles_price_range 
ON vehicles (current_price, original_price);

-- 查看当前表的索引状态
-- SHOW INDEX FROM vehicles;

-- 分析表统计信息（MySQL）
-- ANALYZE TABLE vehicles;

-- 优化表（MySQL，可选）
-- OPTIMIZE TABLE vehicles;