# 听写模式答案卡片优化

## Context

### Original Request
听写模式下点击标记为"不会"（红色）时，同时显示正确答案弹窗卡片。点击卡片外部时，卡片关闭并自动读下一题。

### Current Behavior
- 点击标记框可以标记为红色/白色
- 已有 AnswerCard 组件显示答案，但交互逻辑需要调整

### Research Findings
- `WordRow` 组件的 `handleBoxClick` 处理标记点击
- `AnswerCard` 组件已存在，但缺少自动跳转下一题的逻辑
- 主应用中已有 `speak(index)` 函数用于播放下一题

---

## Work Objectives

### Core Objective
优化听写模式的交互流程：标记为"不会"时显示答案，点击卡片外自动读下一题。

### Concrete Deliverables
- 修改 `handleBoxClick` 逻辑，标记红色时触发答案弹窗
- 修改 `AnswerCard` 组件，添加自动跳转下一题的回调
- 修改主应用逻辑，实现点击卡片外关闭并读下一题

### Definition of Done
- [ ] 点击标记框从白色变为红色时，答案卡片立即弹出
- [ ] 点击卡片外部区域，卡片关闭
- [ ] 卡片关闭后自动播放下一题的语音
- [ ] 测试在自由练习模式下验证完整流程

### Must Have
- 答案卡片在标记为红色时显示
- 点击卡片外自动跳转下一题
- 保持原有的听写功能不受影响

### Must NOT Have (Guardrails)
- 不改变其他两个阶段（模拟自测、家长终测）的交互逻辑
- 不影响现有的答案查看功能（"看答案"按钮）
- 不改变语音播放的其他逻辑

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: NO
- **User wants tests**: Manual-only
- **Framework**: None

### Manual QA Only

由于项目没有测试框架，每个 TODO 包含详细的手动验证步骤：

**By Deliverable Type:**

| Type | Verification Tool | Procedure |
|------|------------------|-----------|
| **Frontend/UI changes** | Playwright browser | Navigate, interact, verify state changes, check auto-play |

---

## Task Flow

```
Task 1 → Task 2 → Task 3
```

## Parallelization

| Group | Tasks | Reason |
|-------|-------|--------|
| A | 1, 2, 3 | Sequential dependencies |

| Task | Depends On | Reason |
|------|------------|--------|
| 2 | 1 | Depends on AnswerCard API change |
| 3 | 1, 2 | Depends on both components |

---

## TODOs

- [ ] 1. 修改 AnswerCard 组件，添加自动跳转回调

  **What to do**:
  - 修改 `AnswerCard` 组件的 props，添加 `onAutoNext` 回调参数
  - 修改关闭逻辑，在关闭时调用 `onAutoNext()`
  - 保持原有的答案显示样式不变

  **Must NOT do**:
  - 不改变答案卡片的样式
  - 不影响现有的点击卡片内容区域不关闭的逻辑

  **Parallelizable**: NO (depends on none)

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `src/App.jsx:111-128` - AnswerCard 组件定义，当前的关闭逻辑实现

  **API/Type References** (contracts to implement against):
  - React Props 模式：回调函数作为 prop 传递的标准模式

  **Documentation References** (specs and requirements):
  - 用户需求：点击卡片外关闭并自动读下一题

  **External References** (libraries and frameworks):
  - React 官方文档：Props 和事件处理模式

  **WHY Each Reference Matters** (explain the relevance):
  - AnswerCard 组件定义：了解当前实现，修改其 props 和关闭逻辑

  **Acceptance Criteria**:

  **Manual Execution Verification**:

  *For Frontend/UI changes:*
  - [ ] Using playwright browser automation:
    - Navigate to: `http://localhost:3009/`
    - Action: 启动听写模式，选择单元，点击"开始练习"
    - Action: 标记第一个词为红色
    - Verify: 答案卡片弹出显示正确答案
    - Action: 点击卡片外部区域（背景）
    - Verify: 答案卡片关闭
    - Verify: 自动播放下一题的语音

  **Evidence Required:**
  - [ ] 截图保存到 `.sisyphus/evidence/task1-1.png` - 标记红色时显示答案卡片
  - [ ] 截图保存到 `.sisyphus/evidence/task1-2.png` - 点击卡片外卡片关闭
  - [ ] 命令输出：确认语音播放（浏览器控制台无错误）

  **Commit**: NO

---

- [ ] 2. 修改 WordRow 组件的 handleBoxClick 逻辑

  **What to do**:
  - 修改 `handleBoxClick` 函数
  - 在 `step === 0`（自由练习阶段）且点击 `markPractice` 标记框时
  - 当标记从白色变为红色时，调用 `onShowAnswer(item)` 显示答案卡片
  - 保持原有的标记状态更新逻辑

  **Must NOT do**:
  - 不影响其他两个阶段（模拟自测、家长终测）的交互
  - 不改变其他标记框的行为

  **Parallelizable**: NO (depends on Task 1)

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `src/App.jsx:266-276` - WordRow 组件的 handleBoxClick 函数定义
  - `src/App.jsx:269-271` - 当前的答案显示逻辑

  **API/Type References** (contracts to implement against):
  - 组件 props: `onShowAnswer` 回调函数

  **Documentation References** (specs and requirements):
  - 用户需求：标记为红色时显示答案

  **External References** (libraries and frameworks):
  - React 官方文档：事件处理和状态管理

  **WHY Each Reference Matters** (explain the relevance):
  - handleBoxClick 函数：了解当前的标记逻辑，添加答案显示触发
  - step 状态：区分不同练习阶段，只在自由练习时触发答案显示

  **Acceptance Criteria**:

  **Manual Execution Verification**:

  *For Frontend/UI changes:*
  - [ ] Using playwright browser automation:
    - Navigate to: `http://localhost:3009/`
    - Action: 启动听写模式，选择单元，点击"开始练习"
    - Action: 点击第一个词的标记框（白色）
    - Verify: 标记框变为红色
    - Verify: 答案卡片同时弹出
    - Action: 标记第二个词为红色
    - Verify: 标记框变为红色且答案卡片弹出
    - Action: 进入"模拟自测"阶段
    - Verify: 标记框变红不会弹出答案卡片（保持原逻辑）

  **Evidence Required:**
  - [ ] 截图保存到 `.sisyphus/evidence/task2-1.png` - 自由练习标记红色显示答案
  - [ ] 截图保存到 `.sisyphus/evidence/task2-2.png` - 自测阶段不显示答案

  **Commit**: NO

---

- [ ] 3. 修改主应用的答案卡片处理逻辑，实现自动跳转

  **What to do**:
  - 修改 `handleShowAnswer` 函数，记录当前显示答案的词索引
  - 修改传递给 `AnswerCard` 的 props，添加 `onAutoNext` 回调
  - 在 `onAutoNext` 回调中调用 `speak(index + 1)` 播放下一题
  - 确保索引不越界（处理最后一题的情况）

  **Must NOT do**:
  - 不改变其他使用 AnswerCard 的场景
  - 不破坏现有的语音播放逻辑

  **Parallelizable**: NO (depends on Task 1, Task 2)

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `src/App.jsx:331-334` - handleShowAnswer 函数定义
  - `src/App.jsx:449-458` - speak 函数定义和实现
  - `src/App.jsx:629` - AnswerCard 组件的使用

  **API/Type References** (contracts to implement against):
  - `words` 数组和 `activeVoiceIndex` 状态

  **Documentation References** (specs and requirements):
  - 用户需求：自动读下一题

  **External References** (libraries and frameworks):
  - React 官方文档：状态管理和回调函数

  **WHY Each Reference Matters** (explain the relevance):
  - handleShowAnswer：了解当前答案显示逻辑，添加索引记录
  - speak 函数：了解语音播放逻辑，实现自动跳转
  - AnswerCard 使用：修改传递给组件的 props

  **Acceptance Criteria**:

  **Manual Execution Verification**:

  *For Frontend/UI changes:*
  - [ ] Using playwright browser automation:
    - Navigate to: `http://localhost:3009/`
    - Action: 启动听写模式，选择3个词，点击"开始练习"
    - Action: 标记第1个词为红色，点击卡片外关闭
    - Verify: 自动播放第2个词
    - Action: 标记第2个词为红色，点击卡片外关闭
    - Verify: 自动播放第3个词
    - Action: 标记第3个词为红色，点击卡片外关闭
    - Verify: 不会播放越界索引（控制台无错误）

  **Evidence Required:**
  - [ ] 命令输出：浏览器控制台检查无错误
  - [ ] 截图保存到 `.sisyphus/evidence/task3-1.png` - 完整流程验证

  **Commit**: NO

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 3 | `feat: auto-play next word after closing answer card` | src/App.jsx | Manual testing |

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
- [ ] 标记红色时答案卡片显示
- [ ] 点击卡片外卡片关闭
- [ ] 卡片关闭后自动读下一题
- [ ] 其他阶段功能不受影响
- [ ] 最后一题不会报错
