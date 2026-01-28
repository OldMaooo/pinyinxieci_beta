# 闪卡模式拼音功能 - 修改逻辑总结

## 修改时间
2026-01-27

## 修改内容

### 1. 状态管理（Task 1）
添加三个状态变量：
- `isPinyinMode`: 拼音模式开关
- `markedWrong`: 错题标记 Set
- `showChinese`: 在拼音模式下是否显示中文

**逻辑**：独立的状态管理，不与其他功能冲突

### 2. 主显示区域（Task 2）
根据三个条件决定显示内容：
- 非拼音模式：`currentWord.word`（中文）
- 拼音模式 + `showChinese = false`：`currentWord.pinyin`（拼音）
- 拼音模式 + `showChinese = true`：`currentWord.word`（中文）

**点击逻辑**：
- 拼音模式：单击切换拼音/中文，单击中文标记错题
- 中文模式：单击直接标记错题

### 3. 缩略图显示（Task 3）
根据 `isPinyinMode` 显示不同内容：
- 拼音模式：完整拼音（如：`shān pō`）
- 中文模式：首字（如：`山`）

错题标记：缩略图文字也变红

### 4. 错题标记与同步（Task 4, 5）
`toggleWrongMark` 函数逻辑：
1. 检查 `markedWrong` 是否包含 wordId
2. 切换状态（添加/删除）
3. 更新 `markedWrong` 状态
4. 同步到 Supabase：`temp_state: { practice: 'red'/'white' }`

**关键**：错题同步到 `temp_state.practice` 字段，主练习"仅错题"会包含闪卡错题

### 5. 模式保持逻辑（修复）
在 index 变化时：
```javascript
useEffect(() => {
  speak(currentWord.word);
  if (isPinyinMode) {
    setShowChinese(false);  // 拼音模式自动切回拼音
  }
}, [index, isPinyinMode]);
```

### 6. 字体优化（修复）

**字体计算**：
- 分母系数：`0.3` → `0.6`（拼音字体更大）
- 最小字体：`24` → `12`（允许更小字体）
- 拼音模式下根据拼音长度计算字体大小

**布局样式**：
- 移除 `whiteSpace: 'nowrap'`（允许自然换行）
- 保留 `maxWidth: '100%'`（响应式）

### 7. 中文模式错题标记（新增）
```javascript
onClick={() => {
  if (isPinyinMode) {
    // 拼音模式逻辑
  } else {
    // 中文模式：直接标记错题
    toggleWrongMark(currentWord.id);
  }
}}
```

## 关键设定总结

1. **错题同步策略**：闪卡错题同步到 `temp_state.practice`，主练习"仅错题"会包含闪卡错题
2. **模式保持**：拼音模式下切换到下一题自动切回拼音
3. **字体自适应**：拼音和中文使用不同的字体计算逻辑
4. **错题标记**：两种模式下都可以标记/取消错题
5. **缩略图显示**：拼音模式显示完整拼音，中文模式显示首字

## 浏览器行为预期

- 拼音模式：单击拼音→中文，单击中文→错题（变红/恢复）
- 中文模式：单击中文→错题（变红/恢复）
- 长拼音：可以自然换行，不被裁切
- 拼音模式：下一题自动显示拼音
- 错题标记：云端同步，刷新后保持
