# 修复开始练习时误显示上次练习结束弹窗的Bug

## Context

### Original Request
修复bug：点击首页"开始练习"按钮时，有时候会显示上次练习结束后的弹窗提示。

### Bug Analysis
**根本原因：**`modalConfig` 状态没有被正确重置。

**触发流程：**
1. 上次练习结束：用户点击"存档并结束"按钮
   - 调用 `setModalConfig({ isOpen: true, type: 'FINISH_STATS', ... })`
   - Modal弹窗显示

2. 用户关闭弹窗或练习完成后：
   - 调用 `setModalConfig({ isOpen: false })`
   - 弹窗关闭

3. 用户返回首页（SETUP）：
   - 调用 `setView('SETUP')`

4. 用户再次点击"开始练习"：
   - 调用 `start()` 函数
   - **问题：** `start()` 函数**没有重置** `modalConfig` 状态
   - 如果 `modalConfig.isOpen === true`（上次状态残留），Modal 组件会立即显示

### Code Analysis

**1. modalConfig 状态定义（第311行）：**
```javascript
const [modalConfig, setModalConfig] = useState({ isOpen: false });
```

**2. start函数（第404-414行）- 缺少modalConfig重置：**
```javascript
const start = () => {
  if (isLoading) return;
  let pool = []; processedUnits.forEach(u => { if (selectedUnits.has(u.name)) pool = [...pool, ...u.words]; });
  let targetWords = [];
  pool.forEach(w => {
      const savedTemp = mastery[w.id]?.temp || {};
      const wordData = { ...w, markPractice: savedTemp.practice || 'white', markSelf: savedTemp.self || 'white', markFinal: savedTemp.final || 'white' };
      if (!onlyWrong || mastery[w.id]?.history?.includes('red')) targetWords.push(wordData);
  });
  if (targetWords.length === 0) return alert('没有符合条件的词语');
  setWords(targetWords);
  setStep(0);
  setTime(0);
  setShowAnswers(false);
  setView('RUNNING');
  // ❌ 缺少：setModalConfig({ isOpen: false })
};
```

**3. 存档按钮（第650行）：**
```javascript
<button onClick={() => setModalConfig({ isOpen: true, type: 'FINISH_STATS', title: "本次练习统计", content: "" })}>
```

**4. Modal组件（第651行）：**
```javascript
<Modal
  isOpen={modalConfig.isOpen}
  onClose={() => setModalConfig({ isOpen: false })}
  ...
/>
```

---

## Work Objectives

### Core Objective
修复bug：点击"开始练习"时误显示上次练习结束弹窗。

### Concrete Deliverables
- 修改 `start()` 函数，添加 `modalConfig` 状态重置
- 确保进入新练习时弹窗状态被清理

### Definition of Done
- [ ] 点击"开始练习"进入练习页面
- [ ] 不显示上次练习的统计弹窗
- [ ] 练习正常进行，所有功能不受影响
- [ ] 完成练习后，弹窗正常显示

### Must Have
- 在 `start()` 函数开始新练习时重置 `modalConfig`
- 保持现有弹窗功能不变

### Must NOT Have (Guardrails)
- 不改变 Modal 组件的实现
- 不影响其他使用 modalConfig 的地方（如确认进入终测弹窗）
- 不改变现有的弹窗显示逻辑

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: NO
- **User wants tests**: Manual-only
- **Framework**: None

### Manual QA Only

**Bug 复现步骤：**
1. 完成一次练习，点击"存档并结束"查看统计弹窗
2. 关闭弹窗，返回首页
3. 点击"开始练习"
4. 验证：**不应该**看到上次练习的统计弹窗

**By Deliverable Type:**

| Type | Verification Tool | Procedure |
|------|------------------|-----------|
| **Bug fix** | Browser | Follow reproduction steps, verify fix |

---

## Task Flow

```
Task 1
```

## Parallelization

| Group | Tasks | Reason |
|-------|-------|--------|
| A | 1 | Single task |

---

## TODOs

- [ ] 1. 修复 start 函数，添加 modalConfig 状态重置

  **What to do**:
  - 修改 `start()` 函数
  - 在 `setView('RUNNING')` 之前或之后添加 `setModalConfig({ isOpen: false })`
  - 确保状态重置位置合理

  **Must NOT do**:
  - 不改变 start 函数的其他逻辑
  - 不影响现有的状态更新顺序

  **Parallelizable**: NO

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `src/App.jsx:404-414` - start 函数定义
  - 状态初始化模式：在其他函数开始时重置相关状态

  **WHY Each Reference Matters** (explain that relevance):
  - start 函数：找到需要添加状态重置的位置

  **Acceptance Criteria**:

  **Manual Execution Verification**:

  *For Bug fix:*
  - [ ] Navigate to: `http://localhost:3009/`
  - Action: 选择单元，点击"开始练习"
  - Verify: 进入练习页面，无弹窗
  - Action: 完成练习，点击"存档并结束"按钮
  - Verify: 弹窗显示统计信息
  - Action: 关闭弹窗，返回首页
  - Action: 再次点击"开始练习"
  - Verify: **关键测试**：**不**显示上次练习的统计弹窗
  - Action: 再次完成练习，点击"存档并结束"
  - Verify: 弹窗正常显示统计信息

  **Evidence Required:**
  - [ ] 截图保存到 `.sisyphus/evidence/task1-1.png` - 第一次点击"开始练习"无弹窗
  - [ ] 截图保存到 `.sisyphus/evidence/task1-2.png` - 第二次点击"开始练习"无弹窗（关键）
  - [ ] 截图保存到 `.sisyphus/evidence/task1-3.png` - 弹窗正常显示统计

  **Commit**: YES
  - Message: `fix: reset modalConfig on start to prevent stale modal display`
  - Files: `src/App.jsx`
  - Pre-commit: Manual testing

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `fix: reset modalConfig on start to prevent stale modal display` | src/App.jsx | Manual testing |

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
- [ ] 点击"开始练习"不显示上次练习弹窗
- [ ] 完成练习后弹窗正常显示
- [ ] 多次练习切换无异常
- [ ] 其他弹窗功能不受影响（确认进入终测弹窗）
