# 练习入口修复：方框清空 + 长期未掌握词显示

## TL;DR

> **问题1**：每次进入练习时，方框应该都是空的（重新标记）
> **问题2**：长期未掌握的词（history中有red）应该显示浅红色，包括终测中的字

---

## Context

### 用户反馈
1. 每次进入练习时，方框应该都是空的，这样才能重新标记
2. 长期未掌握的错题应该显示为浅红色，包括终测中的字

### 当前代码问题
**start函数（第582-603行）**：
- 使用历史记录的最后状态初始化方框
- 导致进入练习时方框可能已经有颜色
- 没有传递长期未掌握状态给前端

---

## Work Objectives

### 核心目标
1. 每次进入练习时，方框始终为空的（'white'）
2. 长期未掌握的词（history中有red）应该显示浅红色
3. 包括终测中的字也需要显示浅红色状态

---

## Execution Strategy

### 修改 start 函数

**原代码**：
```javascript
pool.forEach(w => {
    const m = mastery[w.id];
    const savedTemp = m?.temp || {};
    // ... 使用历史记录初始化方框颜色

    let wordData = {
      ...w,
      markPractice: isNewDay ? lastHistoryStatus : (savedTemp.practice || 'white'),
      markSelf: isNewDay ? lastHistoryStatus : (savedTemp.self || 'white'),
      markFinal: isNewDay ? lastHistoryStatus : (savedTemp.final || 'white')
    };
});
```

**修改后**：
```javascript
pool.forEach(w => {
    const m = mastery[w.id];
    const status = getStatus(w.id);
    const isWeak = status === 'WEAK';  // 长期未掌握

    // 每次进入练习时，方框都是空的，重新标记
    let wordData = {
      ...w,
      markPractice: 'white',
      markSelf: 'white',
      markFinal: 'white',
      isWeak: isWeak  // 用于判断是否显示浅红色
    };

    if (!onlyWrong || isWeak) {
      targetWords.push(wordData);
    }
});
```

### 修改练习页面词语渲染

**查找并修改**：根据 `isWeak` 属性显示浅红色

---

## TODOs

- [x] 1. 修改start函数
  - 方框始终为'white'
  - 添加isWeak属性

- [x] 2. 修改练习页面渲染
  - 根据isWeak显示浅红色
  - 包括终测中的字

- [x] 3. 版本号更新
  - V3.10.2 → V3.10.3

---

## Commit Strategy

| After Task | Message | Files |
|------------|---------|-------|
| 1-2 | `fix: clear marks on practice entry, show weak words in light red` | src/App.jsx |
| 3 | `chore: bump version to V3.10.3` | src/App.jsx |

---

## Success Criteria

- [x] 进入练习时所有方框都是空的
- [x] 长期未掌握的词显示浅红色
- [x] 终测中的字也是浅红色
- [x] 可以正常重新标记
