# Supabase 云数据库初始化脚本

请按照以下步骤配置您的云端数据库，以实现 iPad 独立使用。

## 第一步：打开 SQL 编辑器
1. 登录 [Supabase 控制台](https://supabase.com/)。
2. 在左侧菜单栏点击 **SQL Editor** (图标像是一个带有 `>_` 的方框)。
3. 点击 **"+ New query"**。

## 第二步：复制并运行以下代码
请完整复制下方代码块中的内容，粘贴到编辑器中，然后点击右下角的 **"Run"** 按钮。

```sql
-- 1. 创建掌握度记录表 (如果已存在则跳过)
create table if not exists mastery_records (
  id text primary key, 
  history jsonb default '[]'::jsonb, 
  last_status text, 
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. 开启行级安全策略 (RLS)
alter table mastery_records enable row level security;

-- 3. 创建所有人可读写的权限策略 (方便个人 iPad 随时同步)
-- 如果之前创建过同名策略，先删除再创建
drop policy if exists "Allow all access" on mastery_records;

create policy "Allow all access" 
on mastery_records 
for all 
using (true) 
with check (true);
```

## 第三步：验证是否成功
1. 运行后，下方应出现 **"Success. No rows returned."** 的提示。
2. 点击左侧菜单的 **Table Editor** (表格图标)，确认列表中出现了 `mastery_records` 表。
3. 如果 App 提示找不到表，请进入 **Settings -> API -> PostgREST Config**，点击 **"Reload PostgREST Schema"**。

---
配置完成后，您的 iPad 就可以随时随地通过互联网同步听写进度了！
