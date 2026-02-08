# 闪卡UI修复：缩略图、按钮间距、「不会」按钮Bug

## TL;DR

> **Quick Summary**: 修复闪卡UI的3个问题：缩略图卡片样式、左下角按钮间距、「不会」按钮Bug
>
> **Deliverables**:
> - 缩略图卡片：长期弱项显示淡红色，未选中字与选中字一样大
> - 左下角按钮：添加16px间隙
> - 「不会」按钮：修复无限点击切换Bug
>
> **Estimated Effort**: Quick
> **Parallel Execution**: NO - sequential fixes
> **Critical Path**: 按钮间距 → 缩略图 → 「不会」按钮Bug

---

## Context

### Original Request (用户反馈)
1. **缩略图卡片**：
   - 长期弱项也要标成淡红色（无论是拼音还是汉字）
   - 未选中的缩略图中的字应和选中的字一样大，字重也一致

2. **左下角按钮间距**：
   - 按钮之间没有间隙，至少需要16px间隙

3. **「不会」按钮Bug**：
   - 点击一下标记错题，再点击消除标记正常
   - 但再点一次时就没有效果了，状态不会切换

### Worktree Info
- **开发目录**: `/Users/mao/Documents/Coding/Development/Projects/Web/kanpinyinxieci_flashcard`
- **分支**: `feature/flashcard-ui-improvement`
- **端口**: 5176

---

## Work Objectives

### Core Objective
修复闪卡UI的3个交互问题，提升用户体验。

### Concrete Deliverables
- [x] 缩略图卡片：字体大小统一，长期弱项显示淡红色
- [x] 左下角按钮：按钮之间有16px间隙
- [x] 「不会」按钮：支持无限次点击切换标记/取消

### Definition of Done
- [x] 缩略图未选中字与选中字一样大（text-2xl）
- [x] 缩略图未选中字重与选中一致（font-black）
- [x] 缩略图长期弱项显示淡红色（text-red-300）
- [x] 左下角按钮之间有16px间隙（bottom-24, left-24）
- [x] 「不会」按钮可以无限切换标记/取消
- [x] 构建通过

### Must Have
- 缩略图字体统一
- 长期弱项淡红色
- 按钮间距
- 「不会」按钮Bug修复

### Must NOT Have (Guardrails)
- 不要改变其他功能
- 不要引入新Bug

---

## Verification Strategy (MANDATORY)

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

**Scenario 1: 缩略图卡片样式正确**
  Tool: Playwright (playwright skill)
  Preconditions: Dev server running on localhost:5176
  Steps:
    1. Navigate to: http://localhost:5176
    2. 进入闪卡模式（点击任意单元）
    3. 点击缩图按钮显示缩图卡片
    4. 验证：选中缩略图的字（text-2xl）和未选中缩略图的字（text-2xl）一样大
    5. 验证：长期弱项缩略图显示淡红色（text-red-300）
    6. 截图: .sisyphus/evidence/bugfix-1-thumbnail.png
  Expected Result: 缩略图字体统一，长期弱项显示淡红色
  Evidence: .sisyphus/evidence/bugfix-1-thumbnail.png

**Scenario 2: 左下角按钮间距16px**
  Tool: Playwright (playwright skill)
  Preconditions: 闪卡模式运行中
  Steps:
    1. 检查左下角3个按钮
    2. 测量或估算按钮间距
    3. 验证：暂停/继续、「不会」、下一题按钮之间有明显间隙
    4. 截图: .sisyphus/evidence/bugfix-2-buttons.png
  Expected Result: 按钮之间有16px间隙
  Evidence: .sisyphus/evidence/bugfix-2-buttons.png

**Scenario 3: 「不会」按钮无限切换**
  Tool: Playwright (playwright skill)
  Preconditions: 闪卡模式显示拼音，计时器运行中
  Steps:
    1. 点击「不会」按钮 → 验证：显示红色汉字，计时器暂停
    2. 点击「不会」按钮 → 验证：取消红色标记，计时器恢复
    3. 点击「不会」按钮 → 验证：再次显示红色汉字，计时器暂停（之前Bug：这里没反应）
    4. 点击「不会」按钮 → 验证：再次取消红色标记，计时器恢复
    5. 截图: .sisyphus/evidence/bugfix-3-buhui-toggle.png
  Expected Result: 可以无限次点击切换标记/取消
  Evidence: .sisyphus/evidence/bugfix-3-buhui-toggle.png

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: 修复左下角按钮间距

Wave 2 (After Wave 1):
├── Task 2: 修复缩略图卡片样式

Wave 3 (After Wave 2):
└── Task 3: 修复「不会」按钮Bug

Critical Path: Task 1 → Task 2 → Task 3
Parallel Speedup: Minimal (sequential fixes)
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2 | None |
| 2 | 1 | 3 | None |
| 3 | 2 | None | None |

---

## TODOs

- [x] 1. 修复左下角按钮间距（16px）

  **What to do**:
  - 修改「不会」按钮位置：`bottom-20` → `bottom-24`
  - 修改下一题按钮位置：`left-20` → `left-24`
  - 这会在按钮之间创建16px间隙

  **Must NOT do**:
  - 不要改变按钮功能
  - 不要改变其他UI

  **Acceptance Criteria**:
  - [ ] 「不会」按钮位置从 `bottom-20` 改为 `bottom-24`
  - [ ] 下一题按钮位置从 `left-20` 改为 `left-24`
  - [ ] 按钮之间有16px间隙

  **Commit**: YES
  - Message: `fix(flashcard): add 16px gap between buttons`
  - Files: `src/App.jsx`

---

- [x] 2. 修复缩略图卡片样式

  **What to do**:
  - 在map循环开始处添加 `isCurrent` 和 `isWeakWord` 变量
  - 修改缩略图样式：未选中字体从 `text-lg` 改为 `text-2xl`
  - 添加长期弱项淡红色判断

  **Must NOT do**:
  - 不要改变缩略图功能
  - 不要影响其他UI

  **Acceptance Criteria**:
  - [ ] 未选中缩略图字体是 `text-2xl`（与选中一致）
  - [ ] 未选中缩略图字重是 `font-black`（与选中一致）
  - [ ] 长期弱项缩略图显示淡红色 `text-red-300`

  **Commit**: YES
  - Message: `fix(flashcard): unify thumbnail font size and add weak word color`
  - Files: `src/App.jsx`

---

- [x] 3. 修复「不会」按钮Bug

  **What to do**:
  - 修改点击逻辑：先判断是否已标记，优先取消
  - 删除 `isPinyinMode && !showChinese` 条件
  - 统一处理：已标记则取消，未标记则标记

  **Must NOT do**:
  - 不要改变标记/取消的功能逻辑
  - 不要影响其他按钮

  **Acceptance Criteria**:
  - [ ] 第一次点击：标记错题（显示红色汉字，暂停）
  - [ ] 第二次点击：取消标记（恢复计时）
  - [ ] 第三次点击：再次标记（显示红色汉字，暂停）
  - [ ] 可以无限次点击切换

  **Commit**: YES
  - Message: `fix(flashcard): fix buhui button toggle bug for infinite clicks`
  - Files: `src/App.jsx`

---

## Success Criteria

### Verification Commands
```bash
cd /Users/mao/Documents/Coding/Development/Projects/Web/kanpinyinxieci_flashcard
npm run build
# 无报错
```

### Final Checklist
- [x] 缩略图未选中字体是 `text-2xl`
- [x] 缩略图未选中字重是 `font-black`
- [x] 缩略图长期弱项显示淡红色
- [x] 左下角按钮之间有16px间隙
- [x] 「不会」按钮可以无限切换
- [x] 构建通过

---

## 🎉 计划完成

**执行时间**: 2026-02-06
**提交**: `5f3065e fix(flashcard): fix UI bugs - button gap, thumbnail styles, buhui toggle`

### 已修复的3个问题

| 问题 | 修复内容 | 状态 |
|------|----------|------|
| 缩略图卡片 | 字体统一（text-2xl），长期弱项淡红色（text-red-300） | ✅ |
| 按钮间距 | 16px间隙（bottom-24, left-24） | ✅ |
| 「不会」按钮Bug | 无限点击切换逻辑修复 | ✅ |

### 下一步

如需合并到主分支：
```bash
cd /Users/mao/Documents/Coding/Development/Projects/Web/kanpinyinxieci_semiauto
git merge feature/flashcard-ui-improvement
git push beta main
```
