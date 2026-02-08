# Flashcard 缩略图与工具栏联动修复

## TL;DR

> **Quick Summary**: 修复闪卡模式下缩略图和工具栏的联动显示逻辑
>
> **Deliverables**:
> - 缩略图打开时，缩略图和工具栏一直显示
> - 缩略图关闭时，缩略图和工具栏一直隐藏
> - 单击屏幕时，如果缩略图关闭，显示工具栏，6秒后自动隐藏
> - 左右切换时，调用 handleInteraction（已有逻辑）
>
> **Estimated Effort**: Quick
> **Parallel Execution**: NO - sequential
> **Critical Path**: 修改 handleInteraction + 添加 useEffect 依赖

---

## Context

### Original Request
闪卡模式下缩略图打开/关闭逻辑需要调整：
- 缩略图打开后，缩略图和工具栏应该一直显示（不会自动消失）
- 缩略图关闭后，缩略图和工具栏应该一直隐藏
- 左右切换时，缩略图和工具栏应该隐藏
- 单击屏幕时，如果缩略图关闭，工具栏显示一下，6秒后消失

### Current Behavior (Issue)
- 缩略图打开（`showThumbnails = true`）：工具栏可能不显示（需要检查）
- 缩略图关闭（`showThumbnails = false`）：工具栏和缩略图独立控制
- `handleInteraction` 只在 `!showThumbnails` 时才设置自动隐藏

### Expected Behavior
- 缩略图打开：缩略图 + 工具栏一直显示
- 缩略图关闭：缩略图 + 工具栏一直隐藏
- 单击屏幕：如果缩略图关闭，显示工具栏，6秒后隐藏
- 左右切换：调用 handleInteraction（会自动隐藏工具栏）

---

## Work Objectives

### Core Objective
让缩略图和工具栏形成联动，缩略图打开时一起显示，关闭时一起隐藏

### Concrete Deliverables
- FlashCardView 组件中修改 `showControls` 控制逻辑
- 添加 useEffect 监听 `showThumbnails` 变化

### Definition of Done
- [x] 缩略图打开时，工具栏自动显示
- [x] 缩略图关闭时，工具栏自动隐藏
- [x] 单击屏幕时，如果缩略图关闭，6秒后工具栏自动隐藏
- [x] 左右切换后，工具栏自动隐藏（已有逻辑）

### Must Have
- 缩略图和工具栏联动显示
- 自动隐藏逻辑正确

### Must NOT Have (Guardrails)
- 不修改缩略图本身的显示逻辑
- 不修改工具栏的功能逻辑

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**

### Test Decision
- **Infrastructure exists**: NO
- **Automated tests**: None
- **Framework**: None

### Agent-Executed QA Scenarios (MANDATORY — per-scenario, ultra-detailed):

**Scenario 1: 打开缩略图**
  Tool: Playwright (playwright skill)
  Preconditions: Dev server running, flashcard mode active
  Steps:
    1. Navigate to flashcard mode
    2. Click thumbnail toggle button (Grid icon) to open thumbnails
    3. Verify: Thumbnails are visible
    4. Verify: Control toolbar (close button, play/pause, speed, sound, grid, pinyin) is visible
    5. Wait 10 seconds
    6. Verify: Control toolbar is still visible
  Expected Result: Both thumbnails and controls stay visible when thumbnails are open
  Failure Indicators: Controls disappear after timeout
  Evidence: .sisyphus/evidence/task-1-open-thumbnails.png

**Scenario 2: 关闭缩略图**
  Tool: Playwright (playwright skill)
  Preconditions: Flashcard mode active, thumbnails open
  Steps:
    1. Click thumbnail toggle button to close thumbnails
    2. Verify: Thumbnails are hidden
    3. Verify: Control toolbar is hidden
  Expected Result: Both thumbnails and controls are hidden when thumbnails are closed
  Failure Indicators: Controls still visible
  Evidence: .sisyphus/evidence/task-2-close-thumbnails.png

**Scenario 3: 单击屏幕（缩略图关闭）**
  Tool: Playwright (playwright skill)
  Preconditions: Flashcard mode active, thumbnails closed, controls hidden
  Steps:
    1. Click anywhere on the main content area (not controls)
    2. Verify: Control toolbar appears
    3. Wait 7 seconds
    4. Verify: Control toolbar disappears
  Expected Result: Controls appear on click, auto-hide after 6 seconds
  Failure Indicators: Controls stay visible or don't appear
  Evidence: .sisyphus/evidence/task-3-click-screen.png

**Scenario 4: 左右切换**
  Tool: Playwright (playwright skill)
  Preconditions: Flashcard mode active, thumbnails open, controls visible
  Steps:
    1. Click right arrow button
    2. Verify: Index advances to next word
    3. Verify: Controls are hidden
    4. Verify: Thumbnails are still open
  Expected Result: Controls hide after navigation (left/right arrows)
  Failure Indicators: Controls stay visible
  Evidence: .sisyphus/evidence/task-4-nav-right.png

---

## Execution Strategy

### Parallel Execution Waves
Single task, no parallelization needed.

### Dependency Matrix
| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | None | None |

### Agent Dispatch Summary
| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1 | delegate_task(category="quick", load_skills=["frontend-ui-ux"], run_in_background=false) |

---

## TODOs

- [x] 1. 修改 handleInteraction 和添加 useEffect 监听 showThumbnails 变化
  - 修改 handleInteraction 逻辑，确保缩略图关闭时自动隐藏工具栏
  - 添加 useEffect 监听 `showThumbnails` 变化
  - 当 `showThumbnails = true` 时，设置 `showControls = true`
  - 当 `showThumbnails = false` 时，设置 `showControls = false`

  **Must NOT do**:
  - 不修改缩略图本身的显示逻辑
  - 不修改工具栏的功能逻辑

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `quick`
    - Reason: Small, focused code change (adding useEffect and modifying existing function)
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: State management and UI visibility logic for React hooks

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: None
  - **Blocked By**: None (can start immediately)

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `src/App.jsx:206` - handleInteraction function pattern (interaction detection + auto-hide timeout)
  - `src/App.jsx:41-42` - showControls and showThumbnails state declarations
  - `src/App.jsx:207` - useEffect with empty dependency (initial setup pattern)

  **API/Type References** (contracts to implement against):
  - React useState: State hook for managing showControls and showThumbnails boolean values
  - React useEffect: Effect hook for synchronizing showControls with showThumbnails changes

  **Test References** (testing patterns to follow):
  - None (manual testing required)

  **Documentation References** (specs and requirements):
  - None

  **External References** (libraries and frameworks):
  - React useEffect API: https://react.dev/reference/react/useEffect

  **WHY Each Reference Matters** (explain the relevance):
  - `src/App.jsx:206`: Shows existing handleInteraction pattern - modify this to keep auto-hide logic but remove thumbnail dependency
  - `src/App.jsx:41-42`: State variable declarations - need these to understand showControls and showThumbnails relationship
  - `src/App.jsx:207`: Shows useEffect pattern - add new useEffect following this pattern

  **Acceptance Criteria**:

  > **AGENT-EXECUTABLE VERIFICATION ONLY** — No human action permitted.

  **Agent-Executed QA Scenarios** (MANDATORY — per-scenario, ultra-detailed):

  **Scenario 1: 打开缩略图**
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, flashcard mode active
    Steps:
      1. Navigate to flashcard mode
      2. Click thumbnail toggle button (Grid icon) to open thumbnails
      3. Verify: Thumbnails are visible
      4. Verify: Control toolbar (close button, play/pause, speed, sound, grid, pinyin) is visible
      5. Wait 10 seconds
      6. Verify: Control toolbar is still visible
    Expected Result: Both thumbnails and controls stay visible when thumbnails are open
    Failure Indicators: Controls disappear after timeout
    Evidence: .sisyphus/evidence/task-1-open-thumbnails.png

  **Scenario 2: 关闭缩略图**
    Tool: Playwright (playwright skill)
    Preconditions: Flashcard mode active, thumbnails open
    Steps:
      1. Click thumbnail toggle button to close thumbnails
      2. Verify: Thumbnails are hidden
      3. Verify: Control toolbar is hidden
    Expected Result: Both thumbnails and controls are hidden when thumbnails are closed
    Failure Indicators: Controls still visible
    Evidence: .sisyphus/evidence/task-2-close-thumbnails.png

  **Scenario 3: 单击屏幕（缩略图关闭）**
    Tool: Playwright (playwright skill)
    Preconditions: Flashcard mode active, thumbnails closed, controls hidden
    Steps:
      1. Click anywhere on the main content area (not controls)
      2. Verify: Control toolbar appears
      3. Wait 7 seconds
      4. Verify: Control toolbar disappears
    Expected Result: Controls appear on click, auto-hide after 6 seconds
    Failure Indicators: Controls stay visible or don't appear
    Evidence: .sisyphus/evidence/task-3-click-screen.png

  **Scenario 4: 左右切换**
    Tool: Playwright (playwright skill)
    Preconditions: Flashcard mode active, thumbnails open, controls visible
    Steps:
      1. Click right arrow button
      2. Verify: Index advances to next word
      3. Verify: Controls are hidden
      4. Verify: Thumbnails are still open
    Expected Result: Controls hide after navigation (left/right arrows)
    Failure Indicators: Controls stay visible
    Evidence: .sisyphus/evidence/task-4-nav-right.png

  **Evidence to Capture**:
  - [ ] Screenshots in .sisyphus/evidence/ for all scenarios

  **Commit**: NO

---

## Success Criteria

### Verification Commands
```bash
npm run dev  # Expected: server starts on localhost:5175
```

### Final Checklist
- [x] 缩略图打开时，缩略图和工具栏一起显示
- [x] 缩略图关闭时，缩略图和工具栏一起隐藏
- [x] 单击屏幕时，工具栏显示（缩略图关闭），6秒后隐藏
- [x] 左右切换后，工具栏隐藏
