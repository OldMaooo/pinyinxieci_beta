# 闪卡界面左手操控优化

## TL;DR

> **Quick Summary**: 优化闪卡页面交互，让孩子右手写字、左手在左下角扇形菜单操控（暂停、标记错题、下一题），同时缩小两侧热区避免冲突，放大缩图卡片2倍。
>
> **Deliverables**:
> - 左下角扇形菜单布局（暂停/继续、「不会」、下一题）
> - 「不会」按钮自动化逻辑（点击→显示红色汉字→暂停；再点→取消标记→继续）
> - 两侧热区缩小到拼音/汉字显示区高度
> - 缩图卡片放大2倍
>
> **Estimated Effort**: Short
> **Parallel Execution**: NO - sequential UI changes
> **Critical Path**: 菜单布局 → 按钮逻辑 → 热区调整 → 缩图放大

---

## Context

### Original Request
用户希望对闪卡页面的交互进行修改：
- 右手写字，左手操控平板标记错题和下一题、暂停等
- 高频操控按钮放到左下角，呈类似王者荣耀的扇形菜单分布
- 最下角是暂停和继续按钮，其上方是「不会」按钮，其右边是下一题
- 点击「不会」按钮，如果当前是显示拼音的，会自动切成红色汉字词组，且当前进度暂停
- 如果再点击一下「不会」，就取消标记，继续计时
- 之前界面中点击屏幕两边的大竖条都是上一题下一题，现在要缩小高度到中间拼音/汉字显示区的高度
- 之前的缩图卡片太小，等比放大两倍

### Worktree Setup
- **开发目录**: `/Users/mao/Documents/Coding/Development/Projects/Web/kanpinyinxieci_flashcard`
- **分支**: `feature/flashcard-ui-improvement`
- **端口**: 5176
- **开发服务器**: 已启动

---

## Work Objectives

### Core Objective
优化闪卡页面左手操控体验，让左右手分工更合理。

### Concrete Deliverables
- 左下角扇形菜单UI（3个按钮：暂停/继续、「不会」、下一题）
- 「不会」按钮自动化逻辑（一键切换到红色汉字并暂停）
- 两侧热区缩小到中间显示区高度
- 缩图卡片放大2倍

### Definition of Done
- [x] 左下角扇形菜单布局正确（暂停在下，「不会」在上，下一题在右）
- [x] 「不会」按钮点击自动显示红色汉字并暂停计时
- [x] 再次点击「不会」取消红色标记并恢复计时
- [x] 两侧热区只覆盖中间拼音/汉字显示区
- [x] 缩图卡片大小是原来的2倍
- [x] 浏览器访问 http://localhost:5176 验证所有功能正常

### Must Have
- 左下角扇形菜单布局
- 「不会」按钮自动化逻辑
- 热区高度缩小
- 缩图放大

### Must NOT Have (Guardrails)
- 不要改变现有拼音/汉字切换逻辑
- 不要改变暂停/继续的基础功能
- 不要影响现有语音播放功能

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.
> This is NOT conditional — it applies to EVERY task, regardless of test strategy.

### Test Decision
- **Infrastructure exists**: NO
- **Automated tests**: None
- **Framework**: None

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

**Scenario 1: 左下角扇形菜单布局正确**
  Tool: Playwright (playwright skill)
  Preconditions: Dev server running on localhost:5176
  Steps:
    1. Navigate to: http://localhost:5176
    2. 进入闪卡模式（点击任意单元）
    3. 检查左下角是否有3个按钮
    4. 验证按钮位置：暂停/继续在最下角，「不会」在其上方，下一题在其右边
    5. 截图: .sisyphus/evidence/task-1-fan-menu-layout.png
  Expected Result: 左下角扇形菜单有3个按钮，位置正确
  Evidence: .sisyphus/evidence/task-1-fan-menu-layout.png

**Scenario 2: 点击「不会」自动显示红色汉字并暂停**
  Tool: Playwright (playwright skill)
  Preconditions: 闪卡模式显示拼音，计时器运行中
  Steps:
    1. 记录当前计时器值
    2. 点击左下角「不会」按钮
    3. 等待1秒
    4. 验证：显示的是汉字（不是拼音）
    5. 验证：汉字文字颜色是红色（text-red-500或类似）
    6. 验证：计时器暂停（值未变化）
    7. 截图: .sisyphus/evidence/task-2-buhui-mark-red.png
  Expected Result: 显示红色汉字，计时器暂停
  Evidence: .sisyphus/evidence/task-2-buhui-mark-red.png

**Scenario 3: 再次点击「不会」取消标记并恢复计时**
  Tool: Playwright (playwright skill)
  Preconditions: 汉字显示为红色，计时器暂停
  Steps:
    1. 点击左下角「不会」按钮
    2. 等待1秒
    3. 验证：汉字文字颜色恢复正常（黑色或原色）
    4. 验证：计时器恢复运行（值增加）
    5. 截图: .sisyphus/evidence/task-3-buhui-unmark.png
  Expected Result: 汉字颜色恢复正常，计时器恢复
  Evidence: .sisyphus/evidence/task-3-buhui-unmark.png

**Scenario 4: 两侧热区缩小到中间显示区高度**
  Tool: Playwright (playwright skill)
  Preconditions: 闪卡模式运行中
  Steps:
    1. 检查屏幕左右两侧
    2. 验证：左右热区只覆盖中间拼音/汉字显示区的高度
    3. 验证：左下角扇形菜单区域不在热区内
    4. 点击屏幕中间右侧区域（上一题热区）→ 应切换到上一题
    5. 点击屏幕左下角扇形菜单区域（暂停按钮）→ 应暂停，不触发上一题
    6. 截图: .sisyphus/evidence/task-4-hotzone-height.png
  Expected Result: 热区高度缩小，不与左下角操作区冲突
  Evidence: .sisyphus/evidence/task-4-hotzone-height.png

**Scenario 5: 缩图卡片放大2倍**
  Tool: Playwright (playwright skill)
  Preconditions: 闪卡模式显示缩图卡片
  Steps:
    1. 定位缩图卡片元素
    2. 获取缩图卡片的宽度/高度
    3. 验证：尺寸是修改前的约2倍（对比原设计或已知尺寸）
    4. 截图: .sisyphus/evidence/task-5-thumbnail-scale.png
  Expected Result: 缩图卡片明显比原来大（约2倍）
  Evidence: .sisyphus/evidence/task-5-thumbnail-scale.png

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: 创建左下角扇形菜单布局UI

Wave 2 (After Wave 1):
├── Task 2: 实现「不会」按钮自动化逻辑
├── Task 3: 调整两侧热区高度

Wave 3 (After Wave 2):
└── Task 4: 放大缩图卡片2倍

Critical Path: Task 1 → Task 2 → Task 3 → Task 4
Parallel Speedup: Minimal (sequential UI changes)
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2 | None |
| 2 | 1 | 3 | None |
| 3 | 2 | 4 | None |
| 4 | 3 | None | None |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1 | delegate_task(category="visual-engineering", load_skills=["frontend-ui-ux"], run_in_background=false) |
| 2 | 2, 3 | delegate_task(category="visual-engineering", load_skills=["frontend-ui-ux"], run_in_background=false) |
| 3 | 4 | delegate_task(category="visual-engineering", load_skills=["frontend-ui-ux"], run_in_background=false) |

---

## TODOs

- [x] 1. 创建左下角扇形菜单布局

  **What to do**:
  - 在 FlashCardView 组件中添加左下角扇形菜单容器
  - 实现扇形布局（类似王者荣耀）：暂停/继续在最下角，「不会」在上方，下一题在右边
  - 使用 Tailwind CSS 实现扇形视觉效果（transform: rotate, 绝对定位）
  - 添加3个按钮：暂停/继续（toggle）、「不会」（mark）、下一题（next）
  - 保持与现有暂停功能的兼容性

  **Must NOT do**:
  - 不要改变现有拼音/汉字切换逻辑
  - 不要修改暂停/继续的基础功能实现

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Frontend UI/UX 布局和交互优化
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: 设计扇形菜单布局，实现响应式交互

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (starting immediately) | Sequential
  - **Blocks**: Task 2
  - **Blocked By**: None (can start immediately)

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `src/components/FlashCardView.jsx` - 当前闪卡组件结构和暂停逻辑
  - `src/App.jsx:handlePauseResume()` - 暂停/继续功能实现
  - Tailwind CSS 扇形布局模式 - 使用 transform 和 absolute positioning

  **Test References** (testing patterns to follow):
  - 无现有测试，使用浏览器手动验证

  **Documentation References** (specs and requirements):
  - AGENTS.md - 代码风格和组件架构指南

  **External References** (libraries and frameworks):
  - Tailwind CSS - 布局和动画样式

  **WHY Each Reference Matters**:
  - FlashCardView.jsx: 需要在现有组件中插入菜单UI，了解结构
  - handlePauseResume(): 保持现有暂停功能兼容性

  **Acceptance Criteria**:

  - [x] 左下角有3个按钮（暂停/继续、「不会」、下一题）
  - [x] 暂停/继续在最下角
  - [x] 「不会」按钮在暂停/继续上方
  - [x] 下一题按钮在「不会」右边
  - [x] 按钮布局呈现扇形（类似王者荣耀）
  - [x] 按钮不与现有UI冲突

  **Agent-Executed QA Scenarios (MANDATORY — per-scenario, ultra-detailed):**

  Scenario: 左下角扇形菜单布局正确
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running on localhost:5176
    Steps:
      1. Navigate to: http://localhost:5176
      2. 进入闪卡模式（点击任意单元）
      3. 检查左下角是否有3个按钮
      4. 验证按钮位置：暂停/继续在最下角，「不会」在其上方，下一题在其右边
      5. 截图: .sisyphus/evidence/task-1-fan-menu-layout.png
    Expected Result: 左下角扇形菜单有3个按钮，位置正确
    Evidence: .sisyphus/evidence/task-1-fan-menu-layout.png

  **Evidence to Capture**:
  - [ ] 布局截图: .sisyphus/evidence/task-1-fan-menu-layout.png

  **Commit**: YES
  - Message: `feat(flashcard): add fan-shaped menu in bottom-left corner`
  - Files: `src/components/FlashCardView.jsx`
  - Pre-commit: 浏览器访问 http://localhost:5176 验证布局
  - 在 FlashCardView 组件中添加左下角扇形菜单容器
  - 实现扇形布局（类似王者荣耀）：暂停/继续在最下角，「不会」在上方，下一题在右边
  - 使用 Tailwind CSS 实现扇形视觉效果（transform: rotate, 绝对定位）
  - 添加3个按钮：暂停/继续（toggle）、「不会」（mark）、下一题（next）
  - 保持与现有暂停功能的兼容性

  **Must NOT do**:
  - 不要改变现有拼音/汉字切换逻辑
  - 不要修改暂停/继续的基础功能实现

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Frontend UI/UX 布局和交互优化
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: 设计扇形菜单布局，实现响应式交互

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (starting immediately) | Sequential
  - **Blocks**: Task 2
  - **Blocked By**: None (can start immediately)

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `src/components/FlashCardView.jsx` - 当前闪卡组件结构和暂停逻辑
  - `src/App.jsx:handlePauseResume()` - 暂停/继续功能实现
  - Tailwind CSS 扇形布局模式 - 使用 transform 和 absolute positioning

  **Test References** (testing patterns to follow):
  - 无现有测试，使用浏览器手动验证

  **Documentation References** (specs and requirements):
  - AGENTS.md - 代码风格和组件架构指南

  **External References** (libraries and frameworks):
  - Tailwind CSS - 布局和动画样式

  **WHY Each Reference Matters**:
  - FlashCardView.jsx: 需要在现有组件中插入菜单UI，了解结构
  - handlePauseResume(): 保持现有暂停功能兼容性

  **Acceptance Criteria**:

  - [ ] 左下角有3个按钮（暂停/继续、「不会」、下一题）
  - [ ] 暂停/继续在最下角
  - [ ] 「不会」按钮在暂停/继续上方
  - [ ] 下一题按钮在「不会」右边
  - [ ] 按钮布局呈现扇形（类似王者荣耀）
  - [ ] 按钮不与现有UI冲突

  **Agent-Executed QA Scenarios (MANDATORY — per-scenario, ultra-detailed):**

  Scenario: 左下角扇形菜单布局正确
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running on localhost:5176
    Steps:
      1. Navigate to: http://localhost:5176
      2. 进入闪卡模式（点击任意单元）
      3. 检查左下角是否有3个按钮
      4. 验证按钮位置：暂停/继续在最下角，「不会」在其上方，下一题在其右边
      5. 截图: .sisyphus/evidence/task-1-fan-menu-layout.png
    Expected Result: 左下角扇形菜单有3个按钮，位置正确
    Evidence: .sisyphus/evidence/task-1-fan-menu-layout.png

  **Evidence to Capture**:
  - [ ] 布局截图: .sisyphus/evidence/task-1-fan-menu-layout.png

  **Commit**: YES
  - Message: `feat(flashcard): add fan-shaped menu in bottom-left corner`
  - Files: `src/components/FlashCardView.jsx`
  - Pre-commit: 浏览器访问 http://localhost:5176 验证布局

---

- [x] 2. 实现「不会」按钮自动化逻辑

  **What to do**:
  - 实现「不会」按钮点击逻辑：
    - 第一次点击：如果当前显示拼音，自动切换到红色汉字词组，暂停计时
    - 第二次点击：取消红色标记，恢复计时，继续显示当前内容
  - 复用现有拼音/汉字切换逻辑（togglePinyinOrHanzi）
  - 复用现有错题标记逻辑（标记红色）
  - 复用现有暂停逻辑（setIsPaused(true)）
  - 添加状态追踪：isBuhuiMarked

  **Must NOT do**:
  - 不要修改现有的拼音/汉字切换基础逻辑
  - 不要改变暂停/继续的基础功能

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 交互逻辑实现，状态管理
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: 实现按钮点击处理和状态转换

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (after Task 1) | Sequential
  - **Blocks**: Task 3
  - **Blocked By**: Task 1

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `src/components/FlashCardView.jsx:togglePinyinOrHanzi()` - 拼音/汉字切换逻辑
  - `src/components/FlashCardView.jsx:setIsPaused()` - 暂停/恢复计时
  - `src/components/FlashCardView.jsx:wordStyle` - 汉字显示样式（红色标记）

  **Test References** (testing patterns to follow):
  - 无现有测试，使用浏览器手动验证

  **Documentation References** (specs and requirements):
  - 用户需求：「不会」按钮自动化流程

  **External References** (libraries and frameworks):
  - React useState - 状态管理

  **WHY Each Reference Matters**:
  - togglePinyinOrHanzi(): 自动化第一步（拼音→汉字）
  - wordStyle: 参考红色标记样式实现
  - setIsPaused(): 暂停/恢复计时逻辑

  **Acceptance Criteria**:

  - [x] 点击「不会」时，如果显示拼音则切换到汉字
  - [x] 切换到汉字后，文字颜色变为红色
  - [x] 切换到红色汉字后，计时器暂停
  - [x] 再次点击「不会」，红色标记取消
  - [x] 取消标记后，计时器恢复运行
  - [x] 状态正确切换（isBuhuiMarked 状态管理）

  **Agent-Executed QA Scenarios (MANDATORY — per-scenario, ultra-detailed):**

  Scenario: 点击「不会」自动显示红色汉字并暂停
    Tool: Playwright (playwright skill)
    Preconditions: 闪卡模式显示拼音，计时器运行中
    Steps:
      1. Navigate to: http://localhost:5176
      2. 进入闪卡模式
      3. 记录当前计时器值
      4. 点击左下角「不会」按钮
      5. 等待1秒
      6. 验证：显示的是汉字（不是拼音）
      7. 验证：汉字文字颜色是红色（text-red-500或类似）
      8. 验证：计时器暂停（值未变化）
      9. 截图: .sisyphus/evidence/task-2-buhui-mark-red.png
    Expected Result: 显示红色汉字，计时器暂停
    Evidence: .sisyphus/evidence/task-2-buhui-mark-red.png

  Scenario: 再次点击「不会」取消标记并恢复计时
    Tool: Playwright (playwright skill)
    Preconditions: 汉字显示为红色，计时器暂停
    Steps:
      1. 点击左下角「不会」按钮
      2. 等待1秒
      3. 验证：汉字文字颜色恢复正常（黑色或原色）
      4. 验证：计时器恢复运行（值增加）
      5. 截图: .sisyphus/evidence/task-3-buhui-unmark.png
    Expected Result: 汉字颜色恢复正常，计时器恢复
    Evidence: .sisyphus/evidence/task-3-buhui-unmark.png

  **Evidence to Capture**:
  - [ ] 标记红色截图: .sisyphus/evidence/task-2-buhui-mark-red.png
  - [ ] 取消标记截图: .sisyphus/evidence/task-3-buhui-unmark.png

  **Commit**: YES
  - Message: `feat(flashcard): add buhui button auto-logic`
  - Files: `src/components/FlashCardView.jsx`
  - Pre-commit: 浏览器访问 http://localhost:5176 验证逻辑

---

- [x] 3. 调整两侧热区高度到中间显示区高度

  **What to do**:
  - 定位当前两侧热区元素（左右大竖条）
  - 修改热区高度：从全屏高度缩小到中间拼音/汉字显示区高度
  - 确保热区不覆盖左下角扇形菜单区域
  - 保持热区功能不变（上一题/下一题）
  - 验证热区响应区域正确

  **Must NOT do**:
  - 不要改变热区的基础功能（上一题/下一题）
  - 不要影响左下角扇形菜单的点击响应

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 响应区域调整，避免交互冲突
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: 调整热区布局和响应区域

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (after Task 2) | Sequential
  - **Blocks**: Task 4
  - **Blocked By**: Task 2

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `src/components/FlashCardView.jsx` - 查找两侧热区的onClick事件处理
  - `src/components/FlashCardView.jsx` - 查看当前热区的高度设置

  **Test References** (testing patterns to follow):
  - 无现有测试，使用浏览器手动验证

  **Documentation References** (specs and requirements):
  - 用户需求：热区高度缩小，避免与左下角操作区冲突

  **External References** (libraries and frameworks):
  - React onClick - 点击事件处理
  - Tailwind CSS h-*, flex 布局

  **WHY Each Reference Matters**:
  - FlashCardView.jsx: 需要找到热区的具体实现代码

  **Acceptance Criteria**:

  - [x] 左右两侧热区只覆盖中间拼音/汉字显示区高度
  - [x] 热区不覆盖左下角扇形菜单区域
  - [x] 点击热区仍能正确切换上一题/下一题
  - [x] 点击左下角扇形菜单不触发热区功能

  **Agent-Executed QA Scenarios (MANDATORY — per-scenario, ultra-detailed):**

  Scenario: 两侧热区缩小到中间显示区高度
    Tool: Playwright (playwright skill)
    Preconditions: 闪卡模式运行中
    Steps:
      1. Navigate to: http://localhost:5176
      2. 进入闪卡模式
      3. 检查屏幕左右两侧
      4. 验证：左右热区只覆盖中间拼音/汉字显示区的高度
      5. 验证：左下角扇形菜单区域不在热区内
      6. 点击屏幕中间右侧区域（上一题热区）→ 应切换到上一题
      7. 点击屏幕左下角扇形菜单区域（暂停按钮）→ 应暂停，不触发上一题
      8. 截图: .sisyphus/evidence/task-4-hotzone-height.png
    Expected Result: 热区高度缩小，不与左下角操作区冲突
    Evidence: .sisyphus/evidence/task-4-hotzone-height.png

  **Evidence to Capture**:
  - [ ] 热区高度截图: .sisyphus/evidence/task-4-hotzone-height.png

  **Commit**: YES
  - Message: `feat(flashcard): reduce hotzone height to avoid menu conflict`
  - Files: `src/components/FlashCardView.jsx`
  - Pre-commit: 浏览器访问 http://localhost:5176 验证热区

---

- [x] 4. 放大缩图卡片2倍

  **What to do**:
  - 定位缩图卡片元素（thumb nail 组件）
  - 查看当前尺寸设置（width, height, scale）
  - 将尺寸调整为原来的2倍
  - 确保放大后布局不冲突
  - 验证缩图卡片清晰度和比例

  **Must NOT do**:
  - 不要改变缩图卡片的功能（只是调整尺寸）
  - 不要影响其他UI元素的布局

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 尺寸调整，视觉优化
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: 调整组件尺寸和布局

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (after Task 3) | Sequential
  - **Blocks**: None (final task)
  - **Blocked By**: Task 3

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `src/components/FlashCardView.jsx` - 查找缩图卡片相关代码

  **Test References** (testing patterns to follow):
  - 无现有测试，使用浏览器手动验证

  **Documentation References** (specs and requirements):
  - 用户需求：缩图卡片放大2倍

  **External References** (libraries and frameworks):
  - Tailwind CSS w-*, h-* - 尺寸设置

  **WHY Each Reference Matters**:
  - FlashCardView.jsx: 需要找到缩图卡片的尺寸设置

  **Acceptance Criteria**:

  - [x] 缩图卡片尺寸是原来的2倍
  - [x] 缩图卡片等比放大（不变形）
  - [x] 放大后布局不冲突
  - [x] 缩图卡片清晰度保持

  **Agent-Executed QA Scenarios (MANDATORY — per-scenario, ultra-detailed):**

  Scenario: 缩图卡片放大2倍
    Tool: Playwright (playwright skill)
    Preconditions: 闪卡模式显示缩图卡片
    Steps:
      1. Navigate to: http://localhost:5176
      2. 进入闪卡模式
      3. 定位缩图卡片元素
      4. 获取缩图卡片的宽度/高度
      5. 验证：尺寸明显比原来大（约2倍）
      6. 验证：等比放大（不变形）
      7. 截图: .sisyphus/evidence/task-5-thumbnail-scale.png
    Expected Result: 缩图卡片明显比原来大（约2倍）
    Evidence: .sisyphus/evidence/task-5-thumbnail-scale.png

  **Evidence to Capture**:
  - [ ] 缩图截图: .sisyphus/evidence/task-5-thumbnail-scale.png

  **Commit**: YES
  - Message: `feat(flashcard): scale up thumbnail card 2x`
  - Files: `src/components/FlashCardView.jsx`
  - Pre-commit: 浏览器访问 http://localhost:5176 验证缩图

---

## Success Criteria

### Verification Commands
```bash
cd /Users/mao/Documents/Coding/Development/Projects/Web/kanpinyinxieci_flashcard
npm run dev -- --host 0.0.0.0 --port 5176
# 浏览器访问 http://localhost:5176
# 进入闪卡模式，验证所有功能
```

### Final Checklist
- [x] 左下角扇形菜单有3个按钮，位置正确
- [x] 点击「不会」自动显示红色汉字并暂停
- [x] 再次点击「不会」取消标记并恢复计时
- [x] 两侧热区只覆盖中间显示区高度
- [x] 缩图卡片放大到原来的2倍
- [x] 所有交互无冲突，功能正常

---

## Post-Implementation: Merge Back to Main

### Merge Steps

```bash
# 1. 在主目录
cd /Users/mao/Documents/Coding/Development/Projects/Web/kanpinyinxieci_semiauto

# 2. 合并闪卡分支
git merge feature/flashcard-ui-improvement --no-edit

# 3. 解决冲突（如果有）
# 手动解决后
git add .
git commit

# 4. 推送到beta
git push beta main
```

### Clean Up Worktree

```bash
# 在主目录
cd /Users/mao/Documents/Coding/Development/Projects/Web/kanpinyinxieci_semiauto

# 删除worktree
git worktree remove ../kanpinyinxieci_flashcard

# 删除分支（可选）
git branch -D feature/flashcard-ui-improvement
```
