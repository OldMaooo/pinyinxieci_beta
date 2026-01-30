# 修复：老数据兼容性初始化

## 问题描述

当前代码中 `consecutive_green` 字段被初始化为 0 或 null，忽略了老数据的实际状态。

**现状：**
- 老数据在 Supabase 中有 history 记录（红色/绿色下划线）
- 但 consecutive_green 都初始化为 0
- 导致：即使老数据最后是 green，也会被判定为 NEW 而不是 MASTERED

**期望逻辑：**
1. 老数据显示红色下划线 → 薄弱状态 → consecutive_green = 0
2. 老数据显示绿色下划线 → 已彻底掌握 → consecutive_green = 365（表示已掌握）
3. 无历史记录 → NEW → consecutive_green = 0

## 修复方案

修改 `loadCloud()` 函数中的初始化逻辑：

```javascript
// 当前代码（错误）：
data.forEach(r => {
  m[r.id] = {
    consecutive_green: r.consecutive_green,  // 可能是 null 或 0
    ...
  };
});

// 修复后：
data.forEach(r => {
  const lastResult = r.history && r.history.length > 0 ? r.history[r.history.length - 1] : null;
  const initialConsecutive = lastResult === 'green' ? 365 : 0;
  m[r.id] = {
    consecutive_green: r.consecutive_green || initialConsecutive,  // 如果数据库有值就用数据库的，否则根据历史初始化
    ...
  };
});
```

## 具体修改

### 文件：`src/App.jsx`

**位置：** `loadCloud()` 函数（约第 468 行）

**修改前：**
```javascript
useEffect(() => { async function loadCloud() { setIsLoading(true); try { const { data, error } = await supabase.from('mastery_records').select('*').range(0, 9999); if (data) { const m = {}; data.forEach(r => { m[r.id] = { history: r.history, temp: r.temp_state, lastUpdate: r.last_history_update_date, consecutive_green: r.consecutive_green, last_practice_date: r.last_practice_date }; }); setMastery(m); window.mastery = m; } } catch (e) {} finally { setIsLoading(false); } } loadCloud(); }, []);
```

**修改后：**
```javascript
useEffect(() => { localStorage.setItem('pinyin_selected_units', JSON.stringify(Array.from(selectedUnits))); }, [selectedUnits]);
useEffect(() => { async function loadCloud() { setIsLoading(true); try { const { data, error } = await supabase.from('mastery_records').select('*').range(0, 9999); if (data) { const m = {}; data.forEach(r => {
        // 根据老数据的最终状态初始化 consecutive_green
        // 如果 history 最后是 'green' → 已彻底掌握，初始化为 365
        // 如果 history 最后是 'red' 或没有历史 → 初始化为 0
        const lastResult = r.history && r.history.length > 0 ? r.history[r.history.length - 1] : null;
        const initialConsecutive = lastResult === 'green' ? 365 : 0;
        m[r.id] = { history: r.history, temp: r.temp_state, lastUpdate: r.last_history_update_date, consecutive_green: r.consecutive_green || initialConsecutive, last_practice_date: r.last_practice_date };
      }); setMastery(m); window.mastery = m; } } catch (e) {} finally { setIsLoading(false); } } loadCloud(); }, []);
```

## 逻辑说明

| 老数据状态 | history 最后 | consecutive_green 初始化值 | 新状态 |
|-----------|--------------|---------------------------|--------|
| 绿色下划线 | green | 365 | MASTERED |
| 红色下划线 | red | 0 | WEAK |
| 无历史 | null/空 | 0 | NEW |

**为什么用 365？**
- 365 ≥ 5，满足 `consecutive_green >= 5` 的掌握条件
- 表示"已彻底掌握，不需要再累计"
- 今天练了对策：标记为 red 后，consecutive_green 会重置为 0

## 验证步骤

1. 刷新页面
2. 打开调试页面 `debug-mastery.html`
3. 验证：
   - 之前绿色下划线的词 → 连续: 365天，状态: MASTERED
   - 之前红色下划线的词 → 连续: 0天，状态: WEAK
4. 测试功能：
   - 找一个 MASTERED 的词，今天答错 → 应该变成 WEAK，consecutive_green = 0
   - 找一个 WEAK 的词，今天答对 → 应该是 NEW（因为 consecutive_green < 5 且最后是 green）
