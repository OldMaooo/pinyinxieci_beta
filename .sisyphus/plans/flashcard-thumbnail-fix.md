# 闪卡模式：缩略图打开时禁止自动隐藏

## TL;DR

> **问题**：打开缩略图后，整个底部区域（包括缩略图和工具栏）仍然会在6秒后自动隐藏，但用户期望打开缩略图时底部区域一直显示不隐藏。
>
> **目标**：打开缩略图时，底部区域一直显示不自动隐藏；关闭缩略图后，恢复自动隐藏机制。

---

## Context

### 用户确认的问题
- 打开缩略图后，整个底部区域（缩略图+工具栏）一直显示不消失
- 即使6秒后也不自动隐藏
- 关闭缩略图后，才恢复自动隐藏（6秒后自动隐藏）

### 当前代码分析

**第143行** - 缩略图状态：
```jsx
const [showThumbnails, setShowThumbnails] = useState(false);
```

**第206行** - 自动隐藏逻辑：
```jsx
const handleInteraction = () => { 
  setShowControls(true); 
  if (fadeRef.current) clearTimeout(fadeRef.current); 
  fadeRef.current = setTimeout(() => setShowControls(false), 6000); 
};
```

**第329行** - 底部区域显示控制：
```jsx
<div className={`... ${showControls ? 'opacity-100' : 'opacity-0'}`}>
```

**第353行** - 缩略图开关：
```jsx
<button onClick={() => setShowThumbnails(!showThumbnails)} ...>
```

**问题根因**：
- `showControls`会在6秒无操作后自动设置为false
- 无论缩略图是否打开，都会有这个自动隐藏逻辑
- 用户期望：缩略图打开时，`showControls`应该保持true不自动隐藏

---

## Work Objectives

### Core Objective
当缩略图打开时，底部区域一直显示不自动隐藏；关闭缩略图后，恢复正常的自动隐藏机制。

### Concrete Deliverables
1. 修改`handleInteraction`逻辑：缩略图打开时，不设置自动隐藏
2. 或者添加新逻辑：缩略图打开时，强制保持`showControls`为true
3. 关闭缩略图后，恢复自动隐藏

### Definition of Done
- [ ] 打开缩略图后，底部区域一直显示不自动隐藏
- [ ] 关闭缩略图后，恢复6秒自动隐藏机制
- [ ] 切换题目不影响当前行为
- [ ] 工具栏控件功能正常

### Must Have
- 缩略图打开时底部区域一直显示
- 关闭缩略图后恢复自动隐藏

### Must NOT Have (Guardrails)
- 不要改变工具栏控件的现有功能
- 不要修改缩略图按钮的样式
- 不要影响其他功能（自动播放、计时器等）

---

## Execution Strategy

### 单任务修复

修改逻辑：当缩略图打开时，禁止自动隐藏`showControls`。

**方案1：修改handleInteraction**（推荐）

在`handleInteraction`中添加判断：如果缩略图打开，不设置自动隐藏。

**原代码（第206行）**：
```jsx
const handleInteraction = () => { 
  setShowControls(true); 
  if (fadeRef.current) clearTimeout(fadeRef.current); 
  fadeRef.current = setTimeout(() => setShowControls(false), 6000); 
};
```

**修改后**：
```jsx
const handleInteraction = () => { 
  setShowControls(true); 
  if (fadeRef.current) clearTimeout(fadeRef.current); 
  // 如果缩略图打开，不设置自动隐藏
  if (!showThumbnails) {
    fadeRef.current = setTimeout(() => setShowControls(false), 6000); 
  }
};
```

**方案2：使用独立的标志控制**

如果方案1有副作用（可能影响其他调用handleInteraction的地方），可以使用独立变量控制。

```jsx
// 新增状态
const [alwaysShowControls, setAlwaysShowControls] = useState(false);

// 修改缩略图开关
<button onClick={() => {
  setShowThumbnails(!showThumbnails);
  setAlwaysShowControls(!showThumbnails); // 缩略图打开时设为true
}} ...>

// 修改handleInteraction
const handleInteraction = () => { 
  setShowControls(true); 
  if (fadeRef.current) clearTimeout(fadeRef.current); 
  if (!alwaysShowControls) {
    fadeRef.current = setTimeout(() => setShowControls(false), 6000); 
  }
};
```

**推荐方案1**，更简洁，副作用小。

---

## Verification Strategy

### 测试场景

**场景1：打开缩略图后不自动隐藏**
1. 进入闪卡模式
2. 等待工具栏自动隐藏
3. 点击缩略图开关按钮
4. 等待10秒
5. 验证：底部区域（包括缩略图和工具栏）应该一直显示，不自动隐藏

**场景2：关闭缩略图后恢复自动隐藏**
1. 缩略图显示状态下
2. 再次点击缩略图开关按钮
3. 等待6秒
4. 验证：底部区域应该自动隐藏

**场景3：切换题目**
1. 打开缩略图
2. 点击左右区域切换上一题/下一题
3. 验证：底部区域保持显示

**场景4：手动交互不影响**
1. 打开缩略图
2. 点击页面任意位置（触发handleInteraction）
3. 验证：底部区域保持显示

---

## TODOs

- [ ] 1. 修改handleInteraction逻辑
  - 在设置自动隐藏前检查showThumbnails状态
  - 缩略图打开时不设置自动隐藏

- [ ] 2. 版本号更新
  - V3.10.1 → V3.10.2

---

## Commit Strategy

| After Task | Message | Files |
|------------|---------|-------|
| 1 | `fix: prevent auto-hide when thumbnails is open` | src/App.jsx |
| 2 | `chore: bump version to V3.10.2` | src/App.jsx |

---

## Success Criteria

### Verification Commands
```bash
# 构建验证
npm run build  # 应成功无错误

# 手动测试清单
# □ 打开缩略图后，底部区域一直显示不自动隐藏
# □ 关闭缩略图后，恢复6秒自动隐藏
# □ 切换题目不影响显示状态
# □ 工具栏控件功能正常
```

### Final Checklist
- [ ] 所有Must Have条件满足
- [ ] 没有引入新问题
- [ ] 构建成功
