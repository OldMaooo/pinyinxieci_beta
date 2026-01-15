-- 增加 last_history_update_date 字段，用于实现“当日错题累积”逻辑
-- 请务必在 Supabase 后台 SQL Editor 中点击 RUN 执行此脚本

ALTER TABLE mastery_records 
ADD COLUMN IF NOT EXISTS last_history_update_date DATE;

-- 强制刷新 API 缓存
NOTIFY pgrst, 'reload schema';
