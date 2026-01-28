# Plan: 修复闪卡模式问题

## Context

### Original Request
修复闪卡模式中的两个问题：
1. 模式保持：在拼音模式下，下一题应该自动切回拼音显示
2. 字体裁切：拼音过长时仍有被裁切的情况

### Issue Analysis

**问题 1：模式保持逻辑**

当前行为：
- 第 80-82 行有 `useEffect(() => { speak(currentWord.word); }, [index])`
- 这个 useEffect 只调用 speak，不重置 `showChinese`
- 用户期望：在拼音模式下，下一题自动切回拼音

根本原因：
- 没有在 index 变化时重置 `showChinese`
- 导致下一题显示内容跟随上一题的用户手动选择

**问题 2：字体裁切问题**

当前实现：
- `calculateFontSize` 函数使用固定的分母系数 `0.6`
- `whiteSpace: 'nowrap'` 强制不折行
- 最小字体限制为 `16px`

现象：
- 拼音较长时字体被限制在 `16px`
- 不折行导致文字被裁切

根本原因：
- 固定的分母系数不适应所有情况
- 强制不折行 + 最小字体限制 = 裁切

---

## Work Objectives

### Core Objective
修复闪卡模式的模式保持逻辑和字体裁切问题。

### Concrete Deliverables
- 修复后的模式保持逻辑（下一题自动切回拼音）
- 优化后的字体大小计算（允许折行，避免裁切）

### Definition of Done
- [ ] 拼音模式下，下一题自动显示拼音
- [ ] 长拼音可以正常显示，不被裁切
- [ ] 字体大小根据屏幕宽度自适应

### Must Have
- 模式保持：下一题自动切回拼音
- 字体不裁切
- 字体大小自适应

### Must NOT Have (Guardrails)
- 不要修改现有的播放逻辑
- 不要破坏现有的字体计算基础
- 不要影响中文模式显示

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: NO (no test framework)
- **User wants tests**: Manual-only
- **Framework**: Manual QA in browser

### Manual QA Procedure

**Test 1: 模式保持**
- 进入闪卡模式
- 点击"拼音模式"按钮
- 单击拼音显示中文
- 切换到下一个词
- 验证：自动切回拼音显示

**Test 2: 长拼音显示**
- 进入拼音模式
- 查找长拼音词组（如：`liàng jīng jīng`）
- 验证：拼音正常显示，不被裁切
- 验证：字体大小适中

**Test 3: 屏幕宽度调整**
- 在拼音模式下
- 调整浏览器窗口宽度（变窄）
- 验证：字体自动缩小
- 验证：拼音正常显示

---

## Task Flow

```
Task 1 (模式保持) → Task 2 (字体裁切)
```

## Parallelization

| Group | Tasks | Reason |
|-------|-------|--------|
| - | 无 | 顺序执行 |

| Task | Depends On | Reason |
|------|------------|--------|
| 2 | 1 | 字体优化在模式修复后进行 |

---

## TODOs

- [ ] 1. 修复模式保持逻辑

  **What to do**:
  - 修改第 80-82 行的 useEffect
  - 添加逻辑：在拼音模式下，index 变化时重置 showChinese

  **Must NOT do**:
  - 不要修改 speak 函数调用
  - 不要影响中文模式

  **Parallelizable**: NO (no dependencies)

  **References** (CRITICAL):

  **Pattern References**:
  - `src/App.jsx:80-82` - 当前的 index useEffect

  **API/Type References**:
  - 无

  **Test References**:
  - 无

  **Documentation References**:
  - `AGENTS.md` - React useEffect 使用模式

  **External References**:
  - React useEffect：https://react.dev/reference/react/useEffect

  **WHY Each Reference Matters**:
  - 当前 useEffect 展示了 index 变化的处理逻辑
  - 需要在这里添加模式保持逻辑

  **Acceptance Criteria**:

  **Manual Execution Verification**:
  - [ ] 定位到第 80-82 行的 useEffect
  - [ ] 修改函数：
    ```javascript
    useEffect(() => {
      speak(currentWord.word);
      if (isPinyinMode) {
        setShowChinese(false);
      }
    }, [index, isPinyinMode]);
    ```
  - [ ] 保存文件
  - [ ] 启动开发服务器：`npm run dev`
  - [ ] 进入闪卡模式，点击"拼音模式"按钮
  - [ ] 单击拼音显示中文
  - [ ] 切换到下一个词
  - [ ] 验证：自动切回拼音显示

  **Commit**: NO

- [ ] 2. 修复字体裁切问题

  **What to do**:
  - 移除 `whiteSpace: 'nowrap'` 样式
  - 优化 `calculateFontSize` 函数
  - 调整分母系数为 `0.7`
  - 调整最小字体为 `12`

  **Must NOT do**:
  - 不要使用固定字体大小
  - 不要隐藏溢出内容

  **Parallelizable**: NO (depends on Task 1)

  **References**:

  **Pattern References**:
  - `src/App.jsx:167-171` - 当前的 `calculateFontSize` 函数
  - `src/App.jsx:288` - 当前的 `whiteSpace: 'nowrap'` 样式

  **API/Type References**:
  - CSS whiteSpace：https://developer.mozilla.org/en-US/docs/Web/CSS/white-space
  - CSS font-size：https://developer.mozilla.org/en-US/docs/Web/CSS/font-size

  **Test References**:
  - 无

  **Documentation References**:
  - `AGENTS.md` - Tailwind CSS 样式模式

  **External References**:
  - Tailwind CSS：https://tailwindcss.com/docs/text-overflow

  **WHY Each Reference Matters**:
  - `calculateFontSize` 函数展示了字体大小计算的逻辑
  - `whiteSpace` 样式控制文本换行行为

  **Acceptance Criteria**:

  **Manual Execution Verification**:
  - [ ] 定位到第 167-171 行的 `calculateFontSize` 函数
  - [ ] 修改函数：
    ```javascript
    const calculateFontSize = (containerWidth, textLength) => {
      const baseSize = containerWidth * 0.8;
      const adjustedSize = baseSize / Math.max(1, textLength * 0.7);
      return Math.min(Math.max(adjustedSize, 12), 300);
    };
    ```
  - [ ] 定位到第 288 行
  - [ ] 移除 `whiteSpace: 'nowrap'`：
    ```javascript
    style={{ maxWidth: '100%', lineHeight: 1.2 }}
    ```
  - [ ] 保存文件
  - [ ] 刷新浏览器
  - [ ] 进入拼音模式
  - [ ] 查找长拼音词组（如：`liàng jīng jīng`）
  - [ ] 验证：拼音正常显示，不被裁切
  - [ ] 验证：字体大小适中

  **Commit**: NO

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| All tasks | `fix(flashcard): mode persistence and font clipping fixes` | src/App.jsx | Manual QA in browser |

---

## Success Criteria

### Verification Commands
```bash
npm run dev  # Expected: Server starts on http://localhost:3009
```

### Final Checklist
- [ ] 拼音模式下，下一题自动切回拼音显示
- [ ] 长拼音正常显示，不被裁切
- [ ] 字体大小自适应屏幕宽度
- [ ] 中文显示不受影响
- [ ] 所有测试场景通过
- [ ] 控制台无错误
