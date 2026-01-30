# 数据库迁移 SQL - 添加新字段

## 在 Supabase SQL Editor 中运行以下 SQL

### 步骤 1：添加新字段

```sql
-- 添加 consecutive_green 字段（连续绿色天数）
ALTER TABLE mastery_records 
ADD COLUMN IF NOT EXISTS consecutive_green INTEGER DEFAULT 0;

-- 添加 last_practice_date 字段（最后练习日期）
-- 注意：字段名是 last_practice_date（practice 正确拼写）
ALTER TABLE mastery_records 
ADD COLUMN IF NOT EXISTS last_practice_date DATE;
```

### 步骤 2：验证字段是否添加成功

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'mastery_records' 
  AND column_name IN ('consecutive_green', 'last_practice_date');
```

**预期结果**：
```
column_name          | data_type | column_default
---------------------|-----------|----------------
consecutive_green    | integer   | 0
last_practice_date   | date      | null
```

## 如果 SQL Editor 不可用

使用 Supabase Dashboard 的 Table Editor：
1. 进入 Table Editor
2. 点击 mastery_records 表
3. 点击 "Add new column"
4. 添加 consecutive_green（类型：integer，默认值：0）
5. 再次点击 "Add new column"
6. 添加 last_practice_date（类型：date）
