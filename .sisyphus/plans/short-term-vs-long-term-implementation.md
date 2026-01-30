# 短期 vs 长期掌握区分 - 实施计划

## 概述

基于 `.sisyphus/plans/short-term-vs-long-term-mastery.md` 和 `.sisyphus/plans/short-term-vs-long-term-cases.md` 两份规划文档，本计划详细说明实施步骤。

---

## 实施范围

### 包含
1. 数据库 schema 更新（添加新字段）
2. 核心逻辑修改（start、save、getStatus 函数）
3. UI 展示修改（Setup 页、练习页、闪卡模式）
4. 测试验证
5. 文档更新

### 不包含
- 闪卡模式的深层重构（仅修改颜色展示）
- 新增测试框架
- 性能优化（当前实现已满足需求）

---

## 当前代码状态分析

### 数据结构（现状）

**mastery state 结构**:
- `history`: 每天的结果数组，如 `["green", "green", "red", ...]`
- `temp`: 本轮标记，如 `{ practice: "white", self: "white", final: "white" }`
- `lastUpdate`: 最后更新时间

**数据库 (mastery_records 表)**:
- `id`: 词组唯一标识
- `history`: 历史记录数组
- `temp_state`: 本轮临时状态
- `last_history_update_date`: 最后更新日期
- `updated_at`: 更新时间戳

### 关键函数（现状）

| 函数 | 位置 | 当前逻辑 |
|------|------|----------|
| `getStatus` | App.jsx:508-512 | 检查最近3条记录是否有 red → WEAK/MASTERED |
| `save` | App.jsx:547-565 | 写入 history，按天去重，红色覆盖 |
| `start` | App.jsx:534-545 | 加载 temp 状态，筛选错题 |

### UI 展示（现状）
- Setup 页：WEAK = 红色下划线，MASTERED = 绿色下划线
- 练习页：短期标记显示在框框中
- 闪卡模式：错题显示为红色文字

---

## 详细实施步骤

### 阶段 1：数据库迁移

#### 1.1 评估现有数据库结构
- 确认 `mastery_records` 表的当前字段
- 检查是否有 `consecutive_green` 字段
- 确认 `last_history_update_date` 字段是否已存在

#### 1.2 执行数据库迁移

```sql
-- 添加 consecutive_green 字段（如果不存在）
ALTER TABLE mastery_records ADD COLUMN IF NOT EXISTS consecutive_green INTEGER DEFAULT 0;

-- 添加 last_practice_date 字段（如果不存在）
ALTER TABLE mastery_records ADD COLUMN IF NOT EXISTS last_practice_date DATE;
```

#### 1.3 验证迁移结果
- 确认新字段已添加
- 验证现有数据未丢失
- 检查默认值设置正确

---

### 阶段 2：数据初始化脚本

#### 2.1 创建迁移脚本

**文件**: `scripts/migrate-mastery-data.js`

**功能**:
- 遍历所有现有记录
- 为没有 `consecutive_green` 的记录初始化值
- 计算每个词组的连续绿色天数
- 更新 `last_practice_date`

**计算逻辑**:
```
从后往前遍历 history，计算连续 green 天数
let consecutiveGreen = 0;
for (let i = history.length - 1; i >= 0; i--) {
  if (history[i] === 'green') {
    consecutiveGreen++;
  } else {
    break;
  }
}
```

#### 2.2 执行初始化
```bash
node scripts/migrate-mastery-data.js
```

#### 2.3 验证数据完整性
- 随机抽查 10 条记录
- 验证 consecutive_green 计算正确
- 确认没有数据丢失

---

### 阶段 3：核心逻辑修改

#### 3.1 修改 `getStatus` 函数

**位置**: `src/App.jsx:508-512`

**当前代码**:
```javascript
const getStatus = (id, useTemp = false) => {
  const m = useTemp && isAdminMode ? tempMastery[id] : mastery[id];
  if (!m || !m.history || m.history.length === 0) return 'NEW';
  return m.history.slice(-3).includes('red') ? 'WEAK' : 'MASTERED';
};
```

**修改为**:
```javascript
const getStatus = (id, useTemp = false) => {
  const m = useTemp && isAdminMode ? tempMastery[id] : mastery[id];
  if (!m || !m.history || m.history.length === 0) return 'NEW';
  
  // 新逻辑：基于 consecutive_green 判断
  if ((m.consecutive_green || 0) >= 5) {
    return 'MASTERED';
  }
  
  // 基于最近一次历史记录判断
  const lastResult = m.history[m.history.length - 1];
  if (lastResult === 'red') {
    return 'WEAK';
  }
  
  return 'NEW';
};
```

**修改要点**:
- 新增 `consecutive_green >= 5` 判断 → MASTERED
- 移除 `slice(-3).includes('red')` 逻辑
- 改为检查最后一次记录是否为 'red' → WEAK

#### 3.2 修改 `save` 函数

**位置**: `src/App.jsx:547-565`

**当前代码逻辑**:
- 按 `last_history_update_date` 判断是否新的一天
- 写入新记录前检查是否是同一天
- 同一天内红色覆盖绿色

**修改要点**:
- 新增 `consecutive_green` 字段的更新逻辑
- 新增 `last_practice_date` 字段的更新逻辑
- 红色覆盖时同时重置 `consecutive_green` 为 0

**关键逻辑**:
```
如果新的一天：
  - 写入新记录到 history
  - 如果是 green，consecutive_green +1
  - 如果是 red，consecutive_green = 0
  - 更新 last_practice_date

如果是同一天：
  - 红色优先：覆盖最后一条为 red
  - 红色覆盖时，consecutive_green = 0
  - 绿色不能覆盖红色
```

#### 3.3 修改 `start` 函数

**位置**: `src/App.jsx:534-545`

**当前代码**: 基于 `history.includes('red')` 筛选错题

**修改为**:
- 新增日期判断逻辑
- 新的一天自动清空短期标记
- 筛选逻辑改为基于 `getStatus` 结果

**关键逻辑**:
```
进入练习时：
  const todayStr = new Date().toISOString().split('T')[0];
  
  如果 last_practice_date !== todayStr：
    // 新的一天
    清空 markPractice, markSelf, markFinal
    
  如果 onlyWrong === true：
    只显示 getStatus(id) === 'WEAK' 的词
```

---

### 阶段 4：UI 展示修改

#### 4.1 Setup 页词汇表

**位置**: `src/App.jsx:708` 附近

**当前实现**:
- WEAK：红色下划线
- MASTERED：绿色下划线
- NEW：无标记

**修改**: 保持不变（已符合规划要求）

#### 4.2 练习页词组列表

**位置**: `WordRow` 组件

**修改**: 新增 WEAK 词的淡红色文字显示

**修改后的样式逻辑**:
```javascript
// WordRow 组件中的文字颜色
const wordColor = status === 'WEAK' ? 'text-red-300' : 'text-black';
```

#### 4.3 闪卡模式

**位置**: `FlashCardView` 组件

**修改**: 新增 WEAK 词的淡红色文字显示

**修改后的样式逻辑**:
```javascript
// FlashCardView 中的文字颜色
const wordColor = status === 'WEAK' 
  ? 'text-red-300'  // WEAK 词：淡红色
  : markedWrong.has(currentWord.id) 
    ? 'text-red-500'  // 本轮错题：纯红色
    : isDarkMode ? 'text-white' : 'text-black';
```

#### 4.4 仅错题筛选

**修改**: 筛选逻辑已在 `start` 函数中修改为基于 `getStatus` 结果

---

### 阶段 5：测试验证

#### 5.1 单元测试（手动）

| 场景 | 操作 | 预期结果 |
|------|------|----------|
| 新的一天进入 | 修改系统日期后重新进入练习 | 短期标记已清空 |
| 连续 5 天答对 | 模拟连续 5 天 green | 第 5 天后状态变为 MASTERED |
| 中途答错 | 第 3 天标记 red | 连续天数重置为 0 |
| 红色优先 | 同一天先 green 后 red | 最终结果为 red |
| 仅错题筛选 | 筛选 WEAK 状态的词 | 只显示 WEAK 词 |

#### 5.2 UI 验证

| 页面 | 验证项 | 预期结果 |
|------|--------|----------|
| Setup 页 | WEAK = 红色下划线 | 确认 |
| Setup 页 | MASTERED = 绿色下划线 | 确认 |
| Setup 页 | NEW = 无标记 | 确认 |
| 练习页 | WEAK 词 = 淡红色字 | 需实现 |
| 闪卡模式 | WEAK 词 = 淡红色字 | 需实现 |
| 闪卡模式 | 本轮错题 = 纯红色字 | 确认 |

#### 5.3 数据验证
- 验证 `consecutive_green` 字段正确更新
- 验证 `last_practice_date` 字段正确更新
- 验证历史记录按天去重

---

### 阶段 6：文档更新

#### 6.1 更新 AGENTS.md
- 记录新的数据结构
- 记录新的逻辑规则

#### 6.2 更新错题集
- 记录本次改动的背景和原因
- 记录实现中的注意事项

#### 6.3 更新 PROJECT_STATUS.md
- 记录当前状态和进度
- 标记功能为已完成

---

## 文件修改清单

| 文件 | 修改内容 |
|------|----------|
| `src/App.jsx` | `getStatus`, `save`, `start` 函数修改，UI 样式调整 |
| `scripts/migrate-mastery-data.js` | 新增数据迁移脚本 |
| `AGENTS.md` | 记录新数据结构 |
| `info/错题集.md` | 记录改动背景 |

---

## 风险与注意事项

### 风险
1. **数据迁移失败**：现有数据的 history 字段需要正确解释
2. **边界情况**：跨时区、日期变更时的处理
3. **兼容性**：旧数据和新逻辑的兼容

### 注意事项
1. **先备份**：执行迁移脚本前，先备份数据库
2. **灰度发布**：先在小范围用户中测试
3. **回滚方案**：保留回滚到旧逻辑的能力

---

## 时间估算

| 阶段 | 预计时间 |
|------|----------|
| 数据库迁移 | 0.5 小时 |
| 数据初始化脚本 | 0.5 小时 |
| 核心逻辑修改 | 2 小时 |
| UI 展示修改 | 1 小时 |
| 测试验证 | 1 小时 |
| 文档更新 | 0.5 小时 |

**总计**: 约 5.5 小时

---

## 下一步行动

1. 确认实施计划
2. 开始阶段 1：数据库迁移
3. 执行数据初始化脚本
4. 修改核心逻辑
5. 测试验证
6. 更新文档

---

**生成时间**: 2026-01-29
