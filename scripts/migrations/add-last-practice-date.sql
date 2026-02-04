-- 迁移脚本：为 mastery_records 表添加 last_practice_date 和 consecutive_green 字段
-- 作者：自动化迁移
-- 日期：2026-02-04

-- 1. 添加 last_practice_date 字段（记录最后练习日期）
ALTER TABLE mastery_records
ADD COLUMN IF NOT EXISTS last_practice_date text;

-- 2. 添加 consecutive_green 字段（连续绿色天数，>=5 = 掌握）
ALTER TABLE mastery_records
ADD COLUMN IF NOT EXISTS consecutive_green integer default 0;

-- 3. 如果字段已存在但没有值，初始化 consecutive_green
-- 这是一个可选的初始化，基于 history 计算连续绿色天数
-- 如果 history 末尾是绿色，则 consecutive_green = 末尾连续绿色的数量
-- 否则 consecutive_green = 0

-- 4. 验证字段已添加
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'mastery_records'
ORDER BY ordinal_position;

-- 运行说明：
-- 1. 打开 Supabase 控制台 -> SQL Editor
-- 2. 复制并运行整个脚本
-- 3. 确认输出中没有错误
