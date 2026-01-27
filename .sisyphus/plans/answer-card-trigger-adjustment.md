# 调整答案卡片显示触发方式

## Context

### Original Request
调整答案卡片显示的触发方式：
- 点击标记框（批量操作）：不弹出答案卡片
- 点击"不会"按钮（真正做题）：弹出答案卡片

### Current Behavior
- 点击标记框（白色→红色）会显示答案卡片
- "不会"按钮在底部听写bar条上，调用 `markAs('red')`
- `markAs` 函数只更新标记状态，不显示答案卡片

### Research Findings
- `WordRow` 的 `handleBoxClick` 处理标记框点击
- `markAs` 函数位于主应用（第458行），处理"不会"和"掌握"按钮
- 当前 `handleBoxClick` 在标记为红色时会调用 `onShowAnswer`

---

## Work Objectives

### Core Objective
调整答案卡片的显示逻辑，只在点击"不会"按钮时触发，点击标记框不触发。

### Concrete Deliverables
- 修改 `WordRow` 的 `handleBoxClick`，移除答案显示逻辑
- 修改 `markAs` 函数，当 status === 'red' 时显示答案卡片
- 确保点击"不会"后，答案卡片关闭时仍能自动跳转下一题

### Definition of Done
- [ ] 点击标记框（白色→红色）：不显示答案卡片
- [ ] 点击"不会"按钮：显示答案卡片
- [ ] 点击卡片外关闭：自动读下一题
- [ ] 点击"掌握"按钮：不显示答案卡片（仅更新标记）

### Must Have
- 答案卡片只在点击"不会"按钮时显示
- 保持现有的自动跳转下一题功能
- 不影响其他交互逻辑

### Must NOT Have (Guardrails)
- 不改变 AnswerCard 组件的现有逻辑
- 不影响听写的其他功能
- 不改变其他两个阶段（模拟自测、家长终测）的行为

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: NO
- **User wants tests**: Manual-only
- **Framework**: None

### Manual QA Only

每个 TODO 包含详细的手动验证步骤。

**By Deliverable Type:**

| Type | Verification Tool | Procedure |
|------|------------------|-----------|
| **Frontend/UI changes** | Browser | Navigate, interact, verify behavior |

---

## Task Flow

```
Task 1 → Task 2
```

## Parallelization

| Group | Tasks | Reason |
|-------|-------|--------|
| A | 1, 2 | Sequential dependencies |

| Task | Depends On | Reason |
|------|------------|--------|
| 2 | 1 | Depends on WordRow behavior |

---

## TODOs

- [ ] 1. 修改 WordRow 的 handleBoxClick，移除答案显示逻辑

  **What to do**:
  - 移除 `handleBoxClick` 中调用 `onShowAnswer` 的逻辑
  - 保持标记状态更新的逻辑不变

  **Must NOT do**:
  - 不改变其他点击行为
  - 不影响标记框的状态切换（白色→红色→白色）

  **Parallelizable**: NO

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `src/App.jsx:270-280` - WordRow 组件的 handleBoxClick 函数
  - 当前逻辑在第277-279行有 `onShowAnswer` 调用

  **WHY Each Reference Matters** (explain that relevance):
  - handleBoxClick：找到需要移除的代码位置

  **Acceptance Criteria**:

  **Manual Execution Verification**:

  *For Frontend/UI changes:*
  - [ ] Navigate to: `http://localhost:3009/`
  - Action: 启动听写模式，选择单元，点击"开始练习"
  - Action: 点击第一个词的标记框（白色）
  - Verify: 标记框变为红色
  - Verify: 答案卡片**没有**弹出
  - Action: 点击第二个词的标记框
  - Verify: 标记框变为红色，答案卡片**没有**弹出

  **Evidence Required:**
  - [ ] 截图保存到 `.sisyphus/evidence/task1-1.png` - 标记框变红但不显示答案

  **Commit**: NO

---

- [ ] 2. 修改 markAs 函数，添加答案显示逻辑

  **What to do**:
  - 修改 `markAs` 函数
  - 当 `status === 'red'` 时，调用 `handleShowAnswer(words[activeVoiceIndex])` 显示答案卡片
  - 当 `status === 'red'` 时，**不**调用 `speak(activeVoiceIndex + 1)` 自动跳转（因为答案卡片关闭时会自动跳转）
  - 当 `status === 'green'` 时，保持原有逻辑不变

  **Must NOT do**:
  - 不改变 `status === 'green'` 的处理逻辑
  - 不改变 supabase upsert 的逻辑
  - 不破坏现有的标记状态更新

  **Parallelizable**: NO (depends on Task 1)

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `src/App.jsx:458-467` - markAs 函数定义
  - `src/App.jsx:334-337` - handleShowAnswer 函数实现

  **API/Type References** (contracts to implement against):
  - `words` 数组：获取当前词对象
  - `activeVoiceIndex`：当前播放的词索引

  **Documentation References** (specs and requirements):
  - 用户需求：点击"不会"按钮显示答案

  **WHY Each Reference Matters** (explain that relevance):
  - markAs 函数：了解当前实现，添加答案显示逻辑
  - handleShowAnswer：参考已有的答案显示函数

  **Acceptance Criteria**:

  **Manual Execution Verification**:

  *For Frontend/UI changes:*
  - [ ] Navigate to: `http://localhost:3009/`
  - Action: 启动听写模式，选择单元，点击"开始练习"
  - Action: 点击底部"不会"按钮
  - Verify: 标记框变为红色
  - Verify: 答案卡片弹出显示正确答案
  - Action: 点击卡片外部区域
  - Verify: 答案卡片关闭
  - Verify: 自动播放下一题的语音
  - Action: 点击"掌握"按钮
  - Verify: 标记框变为绿色
  - Verify: 答案卡片**没有**弹出

  **Evidence Required:**
  - [ ] 截图保存到 `.sisyphus/evidence/task2-1.png` - 点击"不会"显示答案
  - [ ] 截图保存到 `.sisyphus/evidence/task2-2.png` - 点击卡片外自动跳转
  - [ ] 截图保存到 `.sisyphus/evidence/task2-3.png` - 点击"掌握"不显示答案

  **Commit**: NO

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 2 | `feat: show answer card only on "不会" button click` | src/App.jsx | Manual testing |

---

## Success Criteria

### Verification Commands
```bash
# Start dev server
npm run dev

# Open browser to
open http://localhost:3009/
```

### Final Checklist
- [ ] 点击标记框不显示答案卡片
- [ ] 点击"不会"按钮显示答案卡片
- [ ] 点击卡片外自动读下一题
- [ ] 点击"掌握"按钮不显示答案卡片
- [ ] 其他功能不受影响
