# Beta 与正式版数据库分离方案

## TL;DR

> **核心目标**：Beta 和正式版使用不同的 Supabase 数据库，实现数据隔离
> - **本地开发**：使用 Beta 数据库，避免污染正式数据
> - **Beta 部署**：Vercel Beta 项目连接 Beta 数据库
> - **正式部署**：Vercel 正式项目连接正式数据库
> 
> **工作流程**：本地开发 → GitHub Beta → Vercel Beta → 测试 → GitHub 正式 → Vercel 正式

---

## 背景与需求

### 当前问题
1. **数据污染风险**：Beta 测试时可能产生错误数据，影响正式用户
2. **无法隔离测试**：无法在 Beta 环境做破坏性测试
3. **回滚困难**：Beta 的 bug 可能已写入正式数据
4. **调试困难**：难以区分数据来源（Beta vs 正式）

### 解决方案
通过环境变量配置，让不同环境连接不同的数据库：
- **本地开发**：`.env.local` → Beta 数据库
- **Vercel Beta**：项目环境变量 → Beta 数据库
- **Vercel 正式**：项目环境变量 → 正式数据库

---

## 完整工作流程

```
┌─────────────────────────────────────────────────────────────┐
│ 1. 本地开发阶段                                               │
│    - 代码修改                                                 │
│    - .env.local 配置 → 连接 Beta 数据库                     │
│    - npm run dev (自动读取 .env.local)                        │
│    - 本地测试通过                                             │
└─────────────────────────────────────────────────────────────┘
                        ↓ 测试通过
┌─────────────────────────────────────────────────────────────┐
│ 2. 推送到 GitHub Beta                                         │
│    git push beta main                                         │
│    - GitHub Beta 仓库更新                                     │
└─────────────────────────────────────────────────────────────┘
                        ↓ 自动触发
┌─────────────────────────────────────────────────────────────┐
│ 3. Vercel Beta 自动部署                                       │
│    - Vercel Beta 项目读取环境变量 → Beta 数据库               │
│    - 部署到 pinyinxieci-beta.vercel.app                      │
│    - 测试 2-3 天                                              │
└─────────────────────────────────────────────────────────────┘
                        ↓ 确认无问题
┌─────────────────────────────────────────────────────────────┐
│ 4. 推送到 GitHub 正式版                                       │
│    git push origin main                                       │
│    - GitHub 正式仓库更新                                      │
└─────────────────────────────────────────────────────────────┘
                        ↓ 自动触发
┌─────────────────────────────────────────────────────────────┐
│ 5. Vercel 正式版自动部署                                      │
│    - Vercel 正式项目读取环境变量 → 正式数据库                 │
│    - 部署到 pinyinxieci.vercel.app                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 技术实现

### 1. 代码修改

**文件**: `src/App.jsx`

```javascript
// Supabase 配置 - 支持环境变量，默认使用正式版数据库
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ynasoxvdalcmrrsxxmjr.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ap2IKSLCxabTzVTQNbw45Q_iFBUaNJW';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

**关键点**:
- 使用 `import.meta.env.VITE_*` 读取环境变量（Vite 要求必须以 `VITE_` 开头）
- 提供默认值（正式数据库），确保向后兼容
- 如果没有环境变量，自动使用正式数据库

### 2. 环境变量配置

#### 本地开发（`.env.local`）

创建 `.env.local` 文件（已在 `.gitignore` 中，不会被提交）：

```bash
# Beta 数据库配置（用于本地开发和测试）
VITE_SUPABASE_URL=https://your-beta-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-beta-anon-key-here
```

**使用场景**:
- 本地开发时 (`npm run dev`)
- 测试新功能时
- 避免污染正式数据

#### Vercel Beta 项目

1. 登录 [Vercel Dashboard](https://vercel.com)
2. 进入 **Beta 项目** (`pinyinxieci-beta`)
3. 进入 **Settings** → **Environment Variables**
4. 添加以下变量：
   - `VITE_SUPABASE_URL` = Beta 数据库 URL
   - `VITE_SUPABASE_ANON_KEY` = Beta 数据库 Key
5. 选择环境：**Production**, **Preview**, **Development**（全选）
6. 点击 **Save**

#### Vercel 正式项目

1. 进入 **正式项目** (`pinyinxieci`)
2. Settings → Environment Variables
3. 添加：
   - `VITE_SUPABASE_URL` = 正式数据库 URL
   - `VITE_SUPABASE_ANON_KEY` = 正式数据库 Key
4. 选择所有环境
5. Save

---

## 创建 Beta 数据库

### 步骤 1：创建 Supabase 项目

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 点击 **New Project**
3. 填写项目信息：
   - Name: `pinyinxieci-beta`（或任意名称）
   - Database Password: 设置强密码
   - Region: 选择与正式版相同的区域（推荐）
4. 点击 **Create new project**

### 步骤 2：初始化数据库结构

1. 在 Supabase Dashboard 中，点击左侧菜单的 **SQL Editor**
2. 点击 **"+ New query"**
3. 复制并运行以下 SQL（与正式数据库相同的结构）：

```sql
-- 1. 创建掌握度记录表
create table if not exists mastery_records (
  id text primary key, 
  history jsonb default '[]'::jsonb, 
  temp_state jsonb default '{}'::jsonb,
  last_history_update_date text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. 开启行级安全策略 (RLS)
alter table mastery_records enable row level security;

-- 3. 创建所有人可读写的权限策略
drop policy if exists "Allow all access" on mastery_records;

create policy "Allow all access" 
on mastery_records 
for all 
using (true) 
with check (true);
```

4. 点击 **Run** 执行

### 步骤 3：获取连接信息

1. 在 Supabase Dashboard，点击左侧菜单的 **Settings** → **API**
2. 复制以下信息：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `sb_publishable_xxxxx`

3. 将这些信息配置到：
   - 本地 `.env.local`（开发用）
   - Vercel Beta 项目的环境变量（部署用）

---

## 验证配置

### 本地验证

```bash
# 启动开发服务器
npm run dev

# 在浏览器控制台检查（F12 → Console）
# 应该能看到 Supabase URL 指向 Beta 数据库
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
```

### Vercel 验证

部署后，在浏览器控制台检查：
- **Beta 站点** (`pinyinxieci-beta.vercel.app`) 应该连接到 Beta 数据库
- **正式站点** (`pinyinxieci.vercel.app`) 应该连接到正式数据库

---

## 配置文件说明

### `.env.example`

模板文件，说明如何配置环境变量：

```bash
# Supabase 环境变量配置模板
# 
# 使用方法：
# 1. 复制此文件为 .env.local（已在 .gitignore 中，不会被提交）
# 2. 取消注释并填入对应的值
# 3. 本地开发时会自动读取 .env.local 中的配置

# 本地开发配置（推荐使用 Beta 数据库）
# VITE_SUPABASE_URL=https://your-beta-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-beta-anon-key-here
```

### `.gitignore`

确保 `.env.local` 不会被提交：

```
.env*.local
```

---

## 优势与注意事项

### 优势

1. **数据隔离**：Beta 测试不会影响正式用户数据
2. **安全测试**：可以在 Beta 环境做破坏性测试
3. **易于回滚**：Beta 出问题不影响正式版
4. **调试清晰**：可以明确区分数据来源

### 注意事项

1. **`.env.local` 不要提交到 Git**（已在 `.gitignore` 中）
2. **环境变量必须以 `VITE_` 开头**才能在客户端使用
3. **Vercel 环境变量设置后需要重新部署**才能生效
4. **Beta 和正式数据库结构必须一致**（使用相同的 SQL 脚本）
5. **数据库迁移时**：需要同时更新两个数据库的结构

### 回退方案

如果不想分离数据库，可以：
- 删除 `.env.local` 文件
- 删除 Vercel 环境变量
- 代码会使用硬编码的默认值（正式数据库）

---

## 相关文件

- `src/App.jsx` - Supabase 客户端配置
- `.env.example` - 环境变量模板
- `.env.local` - 本地开发配置（不提交）
- `ENV_SETUP.md` - 详细配置文档
- `SUPABASE_SETUP.md` - Supabase 数据库初始化脚本

---

## 实施检查清单

- [ ] 创建 Beta Supabase 项目
- [ ] 在 Beta 数据库中运行初始化 SQL
- [ ] 创建本地 `.env.local` 文件，配置 Beta 数据库
- [ ] 在 Vercel Beta 项目中配置环境变量
- [ ] 在 Vercel 正式项目中配置环境变量（如果还没有）
- [ ] 验证本地开发连接到 Beta 数据库
- [ ] 验证 Beta 部署连接到 Beta 数据库
- [ ] 验证正式部署连接到正式数据库
- [ ] 测试完整工作流程：本地 → Beta → 正式

---

## 更新记录

- **2026-01-28**: 创建文档，定义完整工作流程和配置方案