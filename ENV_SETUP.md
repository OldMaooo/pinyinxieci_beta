# 环境变量配置指南

本文档说明如何在不同环境（本地开发、Beta、正式版）配置 Supabase 数据库连接。

## 环境变量说明

项目使用以下环境变量来控制 Supabase 连接：

- `VITE_SUPABASE_URL`: Supabase 项目 URL
- `VITE_SUPABASE_ANON_KEY`: Supabase 匿名访问密钥

> **注意**: Vite 要求环境变量必须以 `VITE_` 开头才能在客户端代码中使用。

## 配置方式

### 1. 本地开发（使用 Beta 数据库）

创建 `.env.local` 文件（已添加到 `.gitignore`，不会被提交）：

```bash
# Beta 数据库配置（用于本地开发和测试）
VITE_SUPABASE_URL=https://your-beta-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-beta-anon-key-here
```

**使用场景**: 
- 本地开发时 (`npm run dev`)
- 测试新功能时
- 避免污染正式数据

### 2. GitHub Beta 仓库 → Vercel Beta 项目

**在 Vercel Beta 项目中设置环境变量**：

1. 登录 [Vercel Dashboard](https://vercel.com)
2. 进入 **Beta 项目** (`pinyinxieci-beta`)
3. 进入 **Settings** → **Environment Variables**
4. 添加以下变量：
   - `VITE_SUPABASE_URL` = Beta 数据库 URL
   - `VITE_SUPABASE_ANON_KEY` = Beta 数据库 Key
5. 选择环境：**Production**, **Preview**, **Development**（全选）
6. 点击 **Save**

**自动部署**: 推送到 GitHub Beta 仓库后，Vercel 会自动使用这些环境变量部署。

### 3. GitHub 正式仓库 → Vercel 正式项目

**在 Vercel 正式项目中设置环境变量**：

1. 登录 [Vercel Dashboard](https://vercel.com)
2. 进入 **正式项目** (`pinyinxieci`)
3. 进入 **Settings** → **Environment Variables**
4. 添加以下变量：
   - `VITE_SUPABASE_URL` = 正式数据库 URL
   - `VITE_SUPABASE_ANON_KEY` = 正式数据库 Key
5. 选择环境：**Production**, **Preview**, **Development**（全选）
6. 点击 **Save**

## 完整工作流程

```
┌─────────────────────────────────────────────────────────────┐
│ 1. 本地开发                                                 │
│    - 修改代码                                               │
│    - .env.local 配置 Beta 数据库                            │
│    - npm run dev (自动读取 .env.local)                      │
│    - 本地测试通过                                           │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. 推送到 GitHub Beta                                       │
│    git push beta main                                       │
└─────────────────────────────────────────────────────────────┘
                        ↓ 自动触发
┌─────────────────────────────────────────────────────────────┐
│ 3. Vercel Beta 自动部署                                     │
│    - 读取 Vercel Beta 项目的环境变量                        │
│    - 连接到 Beta 数据库                                     │
│    - 部署到 pinyinxieci-beta.vercel.app                    │
│    - 测试 2-3 天                                            │
└─────────────────────────────────────────────────────────────┘
                        ↓ 确认无问题
┌─────────────────────────────────────────────────────────────┐
│ 4. 推送到 GitHub 正式版                                     │
│    git push origin main                                     │
└─────────────────────────────────────────────────────────────┘
                        ↓ 自动触发
┌─────────────────────────────────────────────────────────────┐
│ 5. Vercel 正式版自动部署                                    │
│    - 读取 Vercel 正式项目的环境变量                         │
│    - 连接到正式数据库                                       │
│    - 部署到 pinyinxieci.vercel.app                         │
└─────────────────────────────────────────────────────────────┘
```

## 创建 Beta 数据库（如果还没有）

如果你还没有创建 Beta 数据库，需要：

1. 在 [Supabase Dashboard](https://supabase.com/dashboard) 创建新项目
2. 复制项目的 URL 和 Anon Key
3. 运行与正式数据库相同的 SQL 初始化脚本（见 `SUPABASE_SETUP.md`）
4. 将 URL 和 Key 配置到：
   - 本地 `.env.local`（开发用）
   - Vercel Beta 项目的环境变量（部署用）

## 验证配置

### 本地验证

```bash
# 启动开发服务器
npm run dev

# 在浏览器控制台检查（F12）
# 应该能看到 Supabase URL 指向 Beta 数据库
```

### Vercel 验证

部署后，在浏览器控制台检查：
- Beta 站点应该连接到 Beta 数据库
- 正式站点应该连接到正式数据库

## 注意事项

1. **`.env.local` 不要提交到 Git**（已在 `.gitignore` 中）
2. **环境变量必须以 `VITE_` 开头**才能在客户端使用
3. **Vercel 环境变量设置后需要重新部署**才能生效
4. **Beta 和正式数据库结构必须一致**（使用相同的 SQL 脚本）

## 回退方案

如果不想分离数据库，可以：
- 删除 `.env.local` 文件
- 删除 Vercel 环境变量
- 代码会使用硬编码的默认值（正式数据库）
