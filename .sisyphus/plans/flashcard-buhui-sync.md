# 闪卡「不会」标记同步与持久化

## TL;DR

> **Quick Summary**: 修复「不会」按钮标记同步问题，实现持久化和双模式同步
>
> **Deliverables**:
> - 「不会」标记保存到 Supabase（持久化）
> - 闪卡模式标记同步到普通模式（框内标红）
> - 退出再进入闪卡，标记依然存在
>
> **Estimated Effort**: Quick
> **Critical Path**: 复用 toggleWrongMark 函数 → 同步验证

---

## Context

### Original Request (用户反馈)
- 点击「不会」时，系统要记住这个标记
- 退出闪卡再进入，标记依然得有
- 在闪卡模式标记的同时，普通模式下也要在框内标红
- 两边是同步的

### 问题分析

**当前实现问题**：
- 「不会」按钮手动操作 `markedWrong` 状态
- 没有调用 `toggleWrongMark` 函数
- 导致：
  - ❌ 没有同步到 Supabase（不持久化）
  - ❌ 没有调用 `onSyncMarks`（不同步到普通模式）

**现有函数已实现**：
- `toggleWrongMark(currentWord.id)` 已包含：
  - ✅ 更新本地 `markedWrong` 状态
  - ✅ 调用 `onSyncMarks` 同步到普通模式
  - ✅ 同步到 Supabase `mastery_records` 表

---

## Work Objectives

### Core Objective
实现「不会」标记的持久化和双模式同步。

### Concrete Deliverables
### Concrete Deliverables
- [x] 「不会」标记保存到 Supabase（持久化）
- [x] 闪卡模式标记同步到普通模式（框内标红）
- [x] 退出再进入闪卡，标记依然存在
- [x] 取消标记时两边同步取消

### Definition of Done
- [ ] 闪卡中标记「不会」，Supabase 有记录
- [ ] 退出闪卡再进入，标记依然显示
- [ ] 普通模式下对应词条的框内标红
- [ ] 取消标记时两边同步取消

---

## Implementation Plan

### 核心修改

**「不会」按钮点击逻辑**：

```jsx
onClick={(e) => {
  e.stopPropagation();
  handleInteraction();

  // 检查当前是否已标记
  const isCurrentlyMarked = markedWrong.has(currentWord.id);

  if (isCurrentlyMarked) {
    // 取消标记：调用 toggleWrongMark（会设置为 white）
    toggleWrongMark(currentWord.id);
    setIsPausedForViewingAnswer(false);
    setIsPlaying(true);
  } else {
    // 标记：调用 toggleWrongMark（会设置为 red）
    toggleWrongMark(currentWord.id);
    setShowChinese(true);
    setIsPausedForViewingAnswer(true);
    setIsPlaying(false);
  }
}}
```

**关键点**：
1. 调用 `toggleWrongMark(currentWord.id)` - 复用现有函数
2. `toggleWrongMark` 内部会根据当前状态自动切换
3. 只需要根据标记结果决定是否显示汉字和暂停

---

## Verification Strategy

### Agent-Executed QA Scenarios

**Scenario 1: 「不会」标记持久化到 Supabase**
  Tool: Bash
  Preconditions: 闪卡模式运行中
  Steps:
    1. curl 查询 Supabase mastery_records 表
    2. 找到当前词条 ID
    3. 验证 temp_state.practice 为 'red'
  Expected Result: Supabase 中有标记记录

**Scenario 2: 退出再进入闪卡，标记依然存在**
  Tool: Playwright
  Preconditions: Supabase 有标记记录
  Steps:
    1. 关闭闪卡模式
    2. 重新进入闪卡模式
    3. 验证之前标记的词条仍显示红色
  Expected Result: 标记持久化，退出再进入依然存在

**Scenario 3: 闪卡标记同步到普通模式**
  Tool: Playwright
  Preconditions: 闪卡模式中标记了词条
  Steps:
    1. 在闪卡模式中点击「不会」标记某词条
    2. 关闭闪卡模式
    3. 进入普通模式查看该词条
    4. 验证练习框内显示红色（markPractice 为 'red'）
  Expected Result: 普通模式下框内标红

**Scenario 4: 取消标记同步**
  Tool: Playwright
  Preconditions: 词条已标记
  Steps:
    1. 在闪卡模式中点击「不会」取消标记
    2. 验证汉字颜色恢复正常
    3. 进入普通模式查看该词条
    4. 验证练习框内显示白色（markPractice 为 'white'）
  Expected Result: 取消标记时两边同步取消

---

## Execution

### 修改「不会」按钮逻辑

**文件**: `src/App.jsx`（FlashCardView 组件）

**位置**: 约第 399-424 行

**修改前**：
```jsx
onClick={(e) => {
  e.stopPropagation();
  handleInteraction();
  // 修复Bug：先判断是否已标记，优先取消
  if (markedWrong.has(currentWord.id)) {
    // 取消标记
    setMarkedWrong(prev => {
      const newSet = new Set(prev);
      newSet.delete(currentWord.id);
      return newSet;
    });
    setIsPausedForViewingAnswer(false);
    setIsPlaying(true);
  } else {
    // 标记：显示红色汉字并暂停
    setShowChinese(true);
    setIsPausedForViewingAnswer(true);
    setIsPlaying(false);
    setMarkedWrong(prev => new Set(prev).add(currentWord.id));
  }
}}
```

**修改后**：
```jsx
onClick={(e) => {
  e.stopPropagation();
  handleInteraction();

  // 检查当前是否已标记
  const isCurrentlyMarked = markedWrong.has(currentWord.id);

  if (isCurrentlyMarked) {
    // 取消标记：调用 toggleWrongMark（会设置为 white）
    toggleWrongMark(currentWord.id);
    setIsPausedForViewingAnswer(false);
    setIsPlaying(true);
  } else {
    // 标记：调用 toggleWrongMark（会设置为 red）
    toggleWrongMark(currentWord.id);
    setShowChinese(true);
    setIsPausedForViewingAnswer(true);
    setIsPlaying(false);
  }
}}
```

---

## Success Criteria

### Verification Commands
```bash
cd /Users/mao/Documents/Coding/Development/Projects/Web/kanpinyinxieci_flashcard
npm run build
# 无报错
```

### Final Checklist
- [x] 「不会」按钮调用 toggleWrongMark
- [x] 标记同步到 Supabase（持久化）
- [x] 标记同步到普通模式（框内标红）
- [x] 退出闪卡再进入，标记依然存在
- [x] 取消标记时两边同步取消
- [x] 构建通过
