# Manual Test Guide - 学期切换功能测试

## 测试环境
- 开发服务器：http://localhost:3009
- 生产构建：`npm run preview`

## 测试步骤

### 1. 启动服务器
```bash
cd /Users/mao/Documents/Coding/Development/Projects/Web/kanpinyinxieci_semiauto
npm run dev
```

### 2. 打开浏览器
访问：http://localhost:3009

### 3. 验证测试用例

#### ✅ 测试1：学期选择器显示
1. 在页面Header区域找到学期下拉菜单
2. 应该默认显示"三年级上册"
3. 下拉菜单应该包含6个学期选项

#### ✅ 测试2：切换学期
1. 点击下拉菜单
2. 选择"一年级上册"
3. 页面应该刷新显示一年级上册的词库

#### ✅ 测试3：localStorage 持久化
1. 打开浏览器开发者工具（F12）
2. 切换到 Application → Local Storage
3. 检查 `pinyin_selected_semester` 值
4. 刷新页面，应该保持选择的学期

#### ✅ 测试4：控制台无错误
1. 打开开发者工具 Console
2. 切换不同学期
3. 不应该看到红色错误
4. 可能看到 `[App] Error loading word bank:` 如果数据不存在

### 5. 预期数据

| 学期 | 词数 |
|------|------|
| 一年级上册 | 224 |
| 一年级下册 | 存在 |
| 二年级上册 | 468 |
| 二年级下册 | 存在 |
| 三年级上册 | 已更新 |
| 三年级下册 | 存在 |

## 已知问题

### 数据缺失
- 某些学期可能词数较少或数据不完整
- 可以运行 `scripts/expand-grade1a-words.js` 来扩展词库

### ID 格式变化
- 三年级上册使用原有 ID 格式：`3up-单元1-山坡-0`
- 其他学期使用新格式：`一年级上册-单元1-山坡-0`
- 这意味着切换学期会导致掌握记录丢失（因为 ID 不同）

## 回退方案

如果出现问题，回退所有更改：

```bash
git checkout src/App.jsx
npm run build
npm run preview
```
