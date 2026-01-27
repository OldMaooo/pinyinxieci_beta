# Plan: 修复拼音折行问题

## Context

### Original Request
修复拼音模式下长拼音会折行的问题。

### Issue Analysis
**当前问题：**
- `calculateFontSize` 函数对长拼音计算的字体会偏小
- 拼音长度（如：`liàng jīng jīng`）比中文长得多
- 字体过小导致浏览器自动折行

**根本原因：**
```javascript
const calculateFontSize = (containerWidth, textLength) => {
  const baseSize = containerWidth * 0.8;
  const adjustedSize = baseSize / Math.max(1, textLength * 0.3);
  return Math.min(Math.max(adjustedSize, 24), 300);
};
```
- 分母系数 `0.3` 对拼音来说太小
- 最小字体 `24` 对长拼音来说太大，导致必须折行

---

## Work Objectives

### Core Objective
调整字体大小计算和布局，让拼音尽可能在一行显示，不折行。

### Concrete Deliverables
- 修改后的 `calculateFontSize` 函数，优化拼音显示
- 更新文字容器样式，支持不折行显示

### Definition of Done
- [ ] 长拼音（如：`liàng jīng jīng`）在一行显示
- [ ] 拼音字体大小根据屏幕宽度自动调整
- [ ] 中文显示不受影响

### Must Have
- 拼音不折行
- 字体大小自适应
- 保持中文显示正常

### Must NOT Have (Guardrails)
- 不要使用固定字体大小
- 不要隐藏溢出内容
- 不要修改现有的中文显示逻辑

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: NO (no test framework)
- **User wants tests**: Manual-only
- **Framework**: Manual QA in browser

### Manual QA Procedure

**Test 1: 长拼音显示**
- 启动开发服务器：`npm run dev`
- 打开 http://localhost:3009
- 进入闪卡模式
- 点击"拼音模式"按钮
- 查找长拼音词组（如：`liàng jīng jīng`）
- 验证：拼音在一行显示，不折行

**Test 2: 屏幕宽度调整**
- 在拼音模式下
- 调整浏览器窗口宽度（变窄）
- 验证：字体大小自动缩小，但仍在一行
- 进一步缩小窗口，验证：拼音可能折行但保持可读

**Test 3: 短拼音显示**
- 在拼音模式下
- 查找短拼音词组（如：`shān pō`）
- 验证：字体大小适中，不会过大
- 验证：中文显示不受影响

---

## Task Flow

```
Task 1 (调整字体计算) → Task 2 (添加不折行样式)
```

## Parallelization

| Group | Tasks | Reason |
|-------|-------|--------|
| - | 无 | 顺序执行 |

| Task | Depends On | Reason |
|------|------------|--------|
| 2 | 1 | 需要新的字体计算逻辑 |

---

## TODOs

- [ ] 1. 调整字体大小计算函数

  **What to do**:
  - 修改 `calculateFontSize` 函数
  - 调整分母系数：从 `0.3` 改为 `0.6`（让字体更大）
  - 调整最小字体：从 `24` 改为 `16`（允许更小字体）
  - 优化公式以适应长拼音

  **Must NOT do**:
  - 不要使用固定字体大小

  **Parallelizable**: NO (no dependencies)

  **References** (CRITICAL):

  **Pattern References**:
  - `src/App.jsx:167-171` - 当前的 `calculateFontSize` 函数实现

  **API/Type References**:
  - 无

  **Test References**:
  - 无

  **Documentation References**:
  - `AGENTS.md` - 代码质量指南（性能优化部分）

  **External References**:
  - CSS 字体大小：https://developer.mozilla.org/en-US/docs/Web/CSS/font-size

  **WHY Each Reference Matters**:
  - 当前 `calculateFontSize` 函数展示了字体大小计算的逻辑
  - 需要理解现有公式才能调整参数

  **Acceptance Criteria**:

  **Manual Execution Verification**:
  - [ ] 定位到第 167-171 行的 `calculateFontSize` 函数
  - [ ] 修改函数：
    ```javascript
    const calculateFontSize = (containerWidth, textLength) => {
      const baseSize = containerWidth * 0.8;
      const adjustedSize = baseSize / Math.max(1, textLength * 0.6);
      return Math.min(Math.max(adjustedSize, 16), 300);
    };
    ```
  - [ ] 保存文件
  - [ ] 启动开发服务器：`npm run dev`
  - [ ] 进入闪卡模式，点击"拼音模式"按钮
  - [ ] 查找长拼音词组（如：`liàng jīng jīng`）
  - [ ] 验证：拼音在一行显示
  - [ ] 验证：字体大小适中，不会太小或太大

  **Commit**: NO

- [ ] 2. 添加不折行样式

  **What to do**:
  - 修改主显示区域的 `wordElementRef` 容器
  - 添加 `whitespace: nowrap` 强制不折行
  - 添加 `overflow: hidden` 隐藏溢出内容
  - 添加 `text-overflow: ellipsis` 显示省略号（可选）

  **Must NOT do**:
  - 不要影响中文显示
  - 不要修改点击事件处理

  **Parallelizable**: NO (depends on Task 1)

  **References**:

  **Pattern References**:
  - `src/App.jsx:265-293` - 主显示区域的 wordElementRef 容器

  **API/Type References**:
  - CSS whitespace：https://developer.mozilla.org/en-US/docs/Web/CSS/whitespace
  - CSS overflow：https://developer.mozilla.org/en-US/docs/Web/CSS/overflow

  **Test References**:
  - 无

  **Documentation References**:
  - `AGENTS.md` - Tailwind CSS 样式模式

  **External References**:
  - Tailwind CSS：https://tailwindcss.com/docs/text-overflow

  **WHY Each Reference Matters**:
  - 主显示区域的 wordElementRef 容器是样式修改的位置
  - CSS whitespace 属性控制文本换行行为

  **Acceptance Criteria**:

  **Manual Execution Verification**:
  - [ ] 定位到第 270-293 行的 wordElementRef 容器
  - [ ] 修改 style 属性：
    ```javascript
    style={{ maxWidth: '100%', lineHeight: 1.2, whitespace: 'nowrap' }}
    ```
  - [ ] 保存文件
  - [ ] 刷新浏览器
  - [ ] 进入拼音模式
  - [ ] 验证：长拼音在一行显示，不折行
  - [ ] 进一步缩小窗口，验证：文字可能被截断但不折行
  - [ ] 验证：中文显示不受影响

  **Commit**: NO

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| All tasks | `fix(flashcard): prevent pinyin line wrapping with optimized font sizing` | src/App.jsx | Manual QA in browser |

---

## Success Criteria

### Verification Commands
```bash
npm run dev  # Expected: Server starts on http://localhost:3009
```

### Final Checklist
- [ ] 长拼音在一行显示
- [ ] 拼音字体大小自适应屏幕宽度
- [ ] 中文显示不受影响
- [ ] 所有测试场景通过
- [ ] 控制台无错误
