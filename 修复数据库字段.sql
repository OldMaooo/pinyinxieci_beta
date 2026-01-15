-- 修复同步失败问题：添加 temp_state 字段
-- 这是一个一次性修复脚本。
-- 请登录 Supabase 后台 -> SQL Editor -> New Query -> 粘贴并点击 Run。

ALTER TABLE mastery_records 
ADD COLUMN IF NOT EXISTS temp_state JSONB DEFAULT '{}'::jsonb;

NOTIFY pgrst, 'reload schema';
