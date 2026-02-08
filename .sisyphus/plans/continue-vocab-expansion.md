# 继续词库扩充与学期切换功能

## TL;DR

> **快速总结**: 恢复 App.jsx 文件并安全地添加学期切换功能
>
> **待恢复**: App.jsx 文件（之前修改时可能损坏）
> **新增功能**: 学期下拉选择器 + 动态词库加载
>
> **预计工作量**: 短（2-3小时）
> **执行方式**: Sisyphus 可直接执行

---

## 背景

### 之前已完成

1. ✅ 词库脚本扩展：`scripts/expand-grade1a-words.js`
2. ✅ 一年级上册 JSON 更新
3. ✅ 部分 App.jsx 代码添加（但文件可能损坏）

### 当前卡点

⚠️ **App.jsx 文件状态未知**
- 可能被命令行 `sed -i '' '31d'` 损坏
- 需要先恢复再继续修改

---

## Context

### 原始请求
用户要求：
1. 扩充词库（单字→词组）
2. 添加多学期切换功能
3. 保护三年级上册的 Supabase 数据

### 访谈总结

**关键决策**：
- 使用 `selectedSemester` 状态管理当前学期
- 动态加载对应学期的 JSON 文件
- 保持三年级上册的原有 ID 格式（3up-xxx）

**Supabase ID 保护策略**：
| 学期 | ID 格式 | 说明 |
|------|---------|------|
| 三年级上册 | `3up-单元1-山坡-0` | 保持不变 |
| 其他学期 | `一年级上册-单元1-天空-0` | 新格式 |

---

## Work Objectives

### Core Objective
恢复 App.jsx 文件并安全地添加学期切换功能，不破坏现有的三年级上册数据。

### Concrete Deliverables
1. 恢复 `src/App.jsx` 文件
2. 添加 `SEMESTERS` 常量和 `loadWordBank()` 函数
3. 添加 `selectedSemester` 状态
4. 删除 `DATA_BLUEPRINT` 硬编码数组
5. 更新 `processedUnits` 使用动态加载
6. 添加学期切换 UI（下拉菜单）
7. 验证功能正常

### Definition of Done
- [x] `git checkout src/App.jsx` 成功恢复
- [x] 学期切换下拉菜单显示正常
- [x] 选择不同学期加载对应词库
- [x] 三年级上册数据完全保留
- [x] `npm run dev` 运行正常

### Must Have
- 学期切换功能可用
- 不破坏现有数据
- 代码不报错

### Must NOT Have (Guardrails)
- ❌ 不删除或修改三年级上册的 Supabase ID
- ❌ 不修改现有的 `一年级上册.json` 文件结构
- ❌ 不使用命令行大块删除代码（用 Edit tool）

---

## Execution Strategy

### 步骤 1: 恢复文件（必须先做）

```bash
cd /Users/mao/Documents/Coding/Development/Projects/Web/kanpinyinxieci_semiauto
git checkout src/App.jsx
```

### 步骤 2: 验证文件恢复

```bash
wc -l src/App.jsx  # 应显示 ~900 行
head -50 src/App.jsx  # 检查导入和常量
```

### 步骤 3: 安全修改（使用 Edit tool）

#### 3.1 添加常量（约第 10-25 行）

```javascript
// 学期列表常量
const SEMESTERS = ["一年级上册", "一年级下册", "二年级上册", "二年级下册", "三年级上册", "三年级下册"];

// 默认学期
const DEFAULT_SEMESTER = localStorage.getItem('pinyin_selected_semester') || "一年级上册";

// 动态加载词库
async function loadWordBank(grade, semester) {
  try {
    const response = await fetch(`/data/${grade}${semester}.json`);
    const data = await response.json();
    return data.wordBank || [];
  } catch (error) {
    console.error('[App] Error loading word bank:', error);
    return [];
  }
}
```

#### 3.2 添加状态（约第 428 行附近）

```javascript
const [selectedSemester, setSelectedSemester] = useState(DEFAULT_SEMESTER);
```

#### 3.3 删除 DATA_BLUEPRINT（第 11-35 行）

#### 3.4 删除 charToWordMap（第 37 行）

#### 3.5 更新 processedUnits（约第 540 行）

```javascript
const processedUnits = useMemo(async () => {
  const grade = selectedSemester.includes('一') ? '一年级' :
                selectedSemester.includes('二') ? '二年级' :
                selectedSemester.includes('三') ? '三年级' : '一年级';
  const semester = selectedSemester.replace(grade, '');
  const words = await loadWordBank(grade, semester);
  const units = {};
  // 分组逻辑...
}, [selectedSemester]);
```

#### 3.6 更新 header UI（约第 812 行）

将硬编码"三年级上册"替换为：

```jsx
<select
  value={selectedSemester}
  onChange={(e) => {
    const newSemester = e.target.value;
    setSelectedSemester(newSemester);
    localStorage.setItem('pinyin_selected_semester', newSemester);
  }}
  className="px-3 py-1 border rounded bg-white text-lg font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
>
  {SEMESTERS.map(semester => (
    <option key={semester} value={semester}>
      {semester}
    </option>
  ))}
</select>
```

### 步骤 4: 测试验证

```bash
npm run dev
# 测试：
# 1. 打开 http://localhost:5175
# 2. 切换学期，检查词库是否变化
# 3. 确认三年级上册数据完整
```

---

## 关键代码位置参考

### 当前 App.jsx 结构（预期）

| 行号 | 内容 | 操作 |
|------|------|------|
| 10-25 | 导入语句 | 添加常量 |
| 11-35 | DATA_BLUEPRINT | 删除 |
| 37 | charToWordMap | 删除 |
| 428 | useState | 添加 selectedSemester |
| 540 | processedUnits | 修改 |
| 812 | header 区域 | 添加下拉菜单 |

### 文件路径

```
src/
├── App.jsx              # 主文件（需修改）
└── main.jsx             # 入口（不修改）

public/data/
├── 一年级上册.json      # 已更新
└── 其他学期.json        # 需创建
```

---

## 成功标准

### 验证命令

```bash
# 1. 文件完整性
git status  # 应显示 App.jsx 已修改

# 2. 功能测试
npm run dev  # 无报错

# 3. 浏览器测试
# - 学期下拉菜单显示
# - 切换学期词库变化
# - 三年级上册数据完整
```

### 最终检查清单

- [x] 文件恢复成功（~900 行）
- [x] 学期切换 UI 显示正常
- [x] 动态词库加载工作
- [x] Supabase 数据未破坏
- [x] 无控制台错误

---

## 风险与回退

### 潜在风险

| 风险 | 概率 | 影响 | 应对 |
|------|------|------|------|
| 文件恢复失败 | 低 | 高 | 使用 `git stash` 或重新克隆 |
| 动态加载路径错误 | 中 | 中 | 检查 JSON 文件路径 |
| 下拉菜单样式问题 | 低 | 低 | 调整 Tailwind 类名 |

### 回退策略

```bash
# 如果出现问题，回退所有更改
git checkout src/App.jsx
npm run dev  # 验证原始版本工作
```

---

## 备注

### 参考文档

- 项目结构：`AGENTS.md`
- 之前计划：`.sisyphus/plans/vocab-expansion-supabase-protection.md`

### 开发者注意事项

1. **用 Edit tool 替代命令行删除** - 避免文件损坏
2. **每次修改后检查文件** - 确认完整性
3. **保持三年级上册数据** - ID 格式不变

---

## 执行摘要

**核心任务**: 恢复 App.jsx → 添加学期切换 → 测试验证

**关键约束**: 不破坏现有数据，不使用命令行大块删除

**成功标准**: 学期切换可用，词库动态加载，Supabase 数据完整
