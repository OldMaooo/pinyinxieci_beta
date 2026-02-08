# 闪卡标记同步修复

## 问题

1. **闪卡标记不同步**：在闪卡模式下标记红色，退出后grid视图没有同步显示红色
2. **第三个tab没有淡红色**：长期错题在前两个tab显示淡红色，但第三个tab没有

## 原因分析

### 问题1：标记同步问题
- FlashCardView使用内部`markedWrong`状态
- `toggleWrongMark`只更新内部状态和Supabase
- 关闭时没有同步到MainApp的words状态

### 问题2：第三个tab淡红色
- 需要检查WordRow是否正确使用`item.isWeak`
- 第三个tab的词也应该有`isWeak`属性

## 修复方案

### 1. 修改FlashCardView的onClose回调

```jsx
// 修改前
<FlashCardView words={words} onClose={() => toggleFlashCardView(step)} getStatus={getStatus} />

// 修改后 - 添加onSyncMarks回调
<FlashCardView
  words={words}
  onClose={() => toggleFlashCardView(step)}
  onSyncMarks={(markedIds) => {
    setWords(prev => prev.map(w =>
      markedIds.has(w.id) ? { ...w, [getMarkType(step)]: 'red' } : w
    ));
  }}
  getStatus={getStatus}
/>
```

### 2. 修改FlashCardView的onClose逻辑

```jsx
// 在FlashCardView中，修改close逻辑
const handleClose = () => {
  if (onSyncMarks && markedWrong.size > 0) {
    onSyncMarks(markedWrong);
  }
  onClose();
};
```

### 3. 确保第三个tab显示淡红色

检查WordRow是否正确使用`item.isWeak`：
- 如果`item.isWeak`为true，显示淡红色
- 这应该由start函数传递的`isWeak`属性决定

## TODOs

- [ ] 1. 修改FlashCardView：添加onSyncMarks回调参数
- [ ] 2. 修改FlashCardView：关闭时调用onSyncMarks同步标记
- [ ] 3. 修改MainApp：传递onSyncMarks回调到FlashCardView
- [ ] 4. 检查第三个tab的淡红色显示
- [ ] 5. 版本号更新：V3.10.4 → V3.10.5
