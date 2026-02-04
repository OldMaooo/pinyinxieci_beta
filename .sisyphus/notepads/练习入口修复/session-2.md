# 练习入口修复 - Session 1

**日期**: 2026-02-04
**状态**: 已提交到git

## 提交信息

**Commit Hash**: `d4625cd`
**Commit Message**:
```
fix: 练习入口修复

- 修改start函数：方框始终为'white'，添加isWeak属性
- 修改练习页面渲染：根据isWeak显示浅红色
- 版本号：V3.10.2 → V3.10.3
```

**Files Changed**:
- `src/App.jsx` (修改start函数 + 练习页面渲染 + 版本号更新）
- `.sisyphus/boulder.json` (更新活动计划)

**Lines Changed**: +160, -14

## Git 状态

- **分支**: main
- **领先**: beta/main 5 commits
- **测试服务器**: 未启动

## 修复效果

### 问题1：方框清空 ✓
每次进入练习时，所有方框都初始化为'white'，可以重新标记。

### 问题2：长期未掌握词显示浅红色 ✓
长期未掌握的词（history中有red）显示浅红色，包括终测中的字。

### 代码变更
1. **start函数**（第582-603行）：
   - 方框始终为'white'
   - 添加isWeak属性

2. **练习页面渲染**（第389行）：
   - 文字颜色从isWeakWord改为item.isWeak

3. **版本号更新**：
   - V3.10.2 → V3.10.3

## 下一步

需要推送到远程仓库：

```bash
# 推送到正式版
git push origin main

# 或推送到测试版
git push beta main
```
