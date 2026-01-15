-- 方案 A 核心字段：记录每个词上次更新 history 状态的日期
-- 用于实现“首测定音”：同一天内后续的测试结果不改变 history（首页状态）

ALTER TABLE mastery_records 
ADD COLUMN IF NOT EXISTS last_history_update_date DATE;

-- 刷新缓存
NOTIFY pgrst, 'reload schema';
