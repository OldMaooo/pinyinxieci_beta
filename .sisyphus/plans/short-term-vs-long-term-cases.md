# 短期 vs 长期掌握区分 - 案例验证

## 核心规则

### 短期标记（本轮练习）
- **用途**：标记本轮练习中不会的题目
- **展示**：本轮练习中显示红勾标记
- **触发**：本轮「家长终测」中标记的红色
- **清空**：新的一天开始时，清空所有短期标记

### 长期记录（历史掌握）
- **规则**：连续 5 天每天都答对一次 → 标记为「掌握」
- **触发**：每天第一次答题的结果写入长期记录
- **重置**：某一天第一次答错 → 连续天数重置为 0

### 关键行为（最终确认）
1. **本轮结果判定**：只看「家长终测」保存的结果（markFinal）
2. **当天结果判定**：检查该词组在今天所有测试中是否标记过红色
   - 标记过一次 → 当天 "red"，打断连胜
   - 没标记过 → 当天 "green"，连续 +1
3. **保存时机**：点击「存档并结束」按钮时写入长期记录
4. **退出保护**：未保存退出时弹窗提示
5. **红色优先**：一旦标记过红色，今天结果就是 "red"（不可逆）

---

## 案例验证（最终版）

### 案例 1：连续 5 天答对 → 掌握

| 日期 | 测试 | markFinal | today_red_marked | 行为 | history | 连续天数 | 掌握状态 |
|------|------|-----------|------------------|------|---------|----------|----------|
| D1 | 第1轮 | green | false | 写入新记录 | `["green"]` | 1 | WEAK |
| D2 | 第1轮 | green | false | 写入新记录 | `["green", "green"]` | 2 | WEAK |
| D3 | 第1轮 | green | false | 写入新记录 | `["green", "green", "green"]` | 3 | WEAK |
| D4 | 第1轮 | green | false | 写入新记录 | `["green", "green", "green", "green"]` | 4 | WEAK |
| D5 | 第1轮 | green | false | 写入新记录 | `["green", "green", "green", "green", "green"]` | 5 | **MASTERED** |

**说明**：连续 5 天每天都答对 → 掌握状态

---

### 案例 2：中途答错 → 打断连胜

| 日期 | 测试 | markFinal | today_red_marked | 行为 | history | 连续天数 | 掌握状态 |
|------|------|-----------|------------------|------|---------|----------|----------|
| D1 | 第1轮 | green | false | 写入新记录 | `["green"]` | 1 | WEAK |
| D2 | 第1轮 | red | **true** | 写入新记录 | `["green", "red"]` | **0** | WEAK |
| D3 | 第1轮 | green | false | 写入新记录 | `["green", "red", "green"]` | **1** | WEAK |

**说明**：D2 标记红色 → 打断连胜，连续天数重置为 0

---

### 案例 3：红色优先于绿色（同一天多次测试）

| 日期 | 测试 | markFinal | today_red_marked | 行为 | history | 连续天数 | 说明 |
|------|------|-----------|------------------|------|---------|----------|------|
| D1 | 第1轮 | green | false | 写入新记录 | `["green"]` | 1 | - |
| D1 | 第2轮 | red | **true** | **覆盖今天** | `["red"]` | **0** | 红色覆盖绿色 |
| D1 | 第3轮 | green | **true** | **保持红色** | `["red"]` | **0** | 绿色不能覆盖红色 |
| D2 | 第1轮 | green | false | 写入新记录 | `["red", "green"]` | **1** | 明天重新开始 |

**关键规则**：红色优先于绿色
- 一旦今天标记过红色，今天结果就是 "red"
- 即使后面都答对，今天结果也不会变成 "green"
- 只有明天才是新的机会

---

### 案例 4：仅错题筛选

| 长期状态 | 进入时是否显示在「仅错题」？ | 说明 |
|----------|------------------------------|------|
| MASTERED (连续5天) | ❌ 不显示 | 已掌握，不算错题 |
| WEAK (最近一次 red) | ✅ 显示 | 错题，需要练习 |
| NEW (无历史) | ✅ 显示 | 新词，默认显示 |
| NEW (有历史但都 green) | ❌ 不显示 | 都对了，不用练 |

---

## 数据结构

### 长期记录（mastery 表）
```javascript
{
  id: "wordId",                    // 词组唯一标识
  history: ["green", "green", "red", "green", "green"],  // 历史记录（每天的结果）
  consecutive_green: 3,            // 当前连续绿色天数（>=5 = 掌握）
  last_practice_date: "2026-01-29", // 最后练习日期
  today_red_marked: false          // 追踪今天是否标记过红色（内存中）
}
```

### 短期标记（本轮练习状态）
```javascript
{
  id: "wordId",
  word: "词语",
  pinyin: "pīn yīn",
  temp_practice: "white" | "red",   // 本轮自由练习标记
  temp_self: "white" | "red",       // 本轮自测标记
  temp_final: "white" | "red" | "green"  // 本轮终测标记（决定性）
}
```

---

## 核心逻辑

### 1. 进入练习时（start 函数）
```javascript
const today = new Date().toISOString().split('T')[0];

if (last_practice_date !== today) {
  // 新的一天，开始新的一天记录
  setMarkPractice('white');
  setMarkSelf('white');
  setMarkFinal('white');
  setTodayRedMarked(false);  // 重置今天红色标记追踪
}

if (onlyWrong) {
  // 筛选条件：status === 'WEAK' 或没有历史记录
  filter(words => status === 'WEAK' || !history.length);
}
```

### 2. 本轮练习中
```javascript
// 短期标记（显示用）
答错 -> setMarkXxx('red')    // 短期标记变红
答对 -> setMarkXxx('green')  // 短期标记变绿

// 追踪今天红色标记
当 markXxx 变为 'red' 时 -> today_red_marked = true;
```

### 3. 保存/结束练习时（save 函数）
```javascript
const today = new Date().toISOString().split('T')[0];

if (last_practice_date !== today) {
  // 新的一天，写入新记录
  const todayResult = today_red_marked ? 'red' : 'green';
  history.push(todayResult);

  if (todayResult === 'green') {
    consecutive_green += 1;
  } else {
    consecutive_green = 0;
  }

  last_practice_date = today;
} else {
  // 同一天：红色优先于绿色
  if (today_red_marked && history.slice(-1)[0] !== 'red') {
    history[history.length - 1] = 'red';
    consecutive_green = 0;
  }
}

today_red_marked = false;
```

### 4. 状态判断（getStatus 函数）
```javascript
if (consecutive_green >= 5) {
  return 'MASTERED';
} else if (history.length > 0 && history.slice(-1)[0] === 'red') {
  return 'WEAK';
} else {
  return 'NEW';
}
```

---

## 关键规则总结

| 场景 | 行为 | 短期标记 | 长期记录 |
|------|------|----------|----------|
| 进入练习（日期不同） | 清空 | ✅清空 | - |
| 进入练习（日期相同） | 保留 | ✅保留 | - |
| 本轮答错 | 变红 | ✅变红 | today_red_marked = true |
| 本轮答对 | 变绿 | ✅变绿 | - |
| 保存时（新的一天） | 写入 | - | ✅写入 today_result |
| 保存时（同一天，red优先） | 覆盖 | - | ✅覆盖为 "red" |
| 保存时（同一天，绿色不覆盖） | 保持 | - | ❌不更新 |

---

## 状态判断表

| 条件 | 状态 |
|------|------|
| consecutive_green >= 5 | MASTERED（掌握）|
| history.length > 0 && 最后一次是 "red" | WEAK（弱）|
| 其他 | NEW（新词）|

---

**生成时间**：2026-01-29
