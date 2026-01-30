# 本地测试清单

## 测试环境
- 应用地址：http://localhost:3009
- 当前分支：feature/short-term-long-term-mastery

---

## 测试前准备

- [ ] Supabase 中已添加 `consecutive_green` 和 `last_practice_date` 字段
- [ ] 初始化页面已完成，所有记录的 `consecutive_green` 已计算
- [ ] 浏览器已打开应用，版本号显示为 V3.10.0

---

## 功能测试

### 1. Setup 页面状态展示

#### 测试 WEAK 词显示
- [ ] WEAK 词显示红色下划线
- [ ] 鼠标悬停在下划线上可以看到

#### 测试 MASTERED 词显示
- [ ] MASTERED 词显示绿色下划线
- [ ] 鼠标悬停在下划线上可以看到

#### 测试 NEW 词显示
- [ ] NEW 词无下划线
- [ ] 文字颜色为黑色

#### 测试统计数据
- [ ] 顶部统计显示正确（掌握数/总数/百分比）
- [ ] 百分比计算正确

---

### 2. 练习页面 - WEAK 词颜色

#### 测试 WEAK 词淡红色显示
- [ ] 进入练习，WEAK 词的拼音显示淡红色（`text-red-300`）
- [ ] WEAK 词的汉字显示淡红色

#### 测试错题筛选
- [ ] 勾选"仅错题"复选框
- [ ] 只显示 WEAK 状态的词
- [ ] MASTERED 和 NEW 状态的词不显示

#### 测试新的一天清空标记
- [ ] 进入练习，检查短期标记是否已清空
- [ ] 所有词的 markPractice、markSelf、markFinal 都是 'white'

---

### 3. 闪卡模式 - WEAK 词颜色

#### 测试 WEAK 词淡红色显示
- [ ] 进入闪卡模式（Setup 页右上角按钮）
- [ ] WEAK 词显示淡红色（`text-red-300`）
- [ ] 鼠标悬停确认颜色正确

#### 测试本轮错题显示
- [ ] 本轮标记的错题显示纯红色（`text-red-500`）
- [ ] 与 WEAK 状态的淡红色有明显区别

---

### 4. 存档功能

#### 测试新的一天写入记录
- [ ] 完成一轮练习
- [ ] 点击"存档并结束"
- [ ] `history` 数组新增一条记录
- [ ] `last_practice_date` 更新为今天日期
- [ ] `consecutive_green` 根据 result 正确计算（green+1, red+0）

#### 测试同一天红色覆盖
- [ ] 同一天内，先 green 后 red
- [ ] `history` 最后一条记录被覆盖为 red
- [ ] `consecutive_green` 被重置为 0

#### 测试同一天绿色不覆盖
- [ ] 同一天内，先 red 后 green
- [ ] `history` 最后一条记录保持 red
- [ ] `consecutive_green` 保持为 0

---

### 5. 掌握状态判断

#### 测试 MASTERED 状态（consecutive_green >= 5）
- [ ] 模拟连续 5 天都答对的词
- [ ] `consecutive_green` >= 5
- [ ] 状态显示为 MASTERED（绿色下划线）
- [ ] 筛选"仅错题"时不显示

#### 测试 WEAK 状态（最后一次是 red）
- [ ] 模拟最后一次答错的词
- [ ] `history` 最后一条是 red
- [ ] 状态显示为 WEAK（红色下划线）
- [ ] 筛选"仅错题"时显示

#### 测试 NEW 状态（无历史或最后一次不是 red）
- [ ] 无历史记录的词
- [ ] 历史记录但最后一次不是 red 的词
- [ ] 状态显示为 NEW（无下划线）
- [ ] 筛选"仅错题"时显示

---

## 数据验证

### 测试字段存在性

在浏览器控制台（F12 → Console）运行：
```javascript
// 检查 mastery state 中是否有新字段
const testId = Object.keys(mastery)[0];
console.log('Test record:', mastery[testId]);
console.log('Has consecutive_green:', 'consecutive_green' in mastery[testId]);
console.log('Has last_practice_date:', 'last_practice_date' in mastery[testId]);
```

- [ ] consecutive_green 字段存在于 state 中
- [ ] last_practice_date 字段存在于 state 中
- [ ] consecutive_green 值为数字
- [ ] last_practice_date 值为字符串日期（YYYY-MM-DD）

---

### 测试初始数据

在 Supabase SQL Editor 运行：
```sql
SELECT id, history, consecutive_green, last_practice_date
FROM mastery_records
LIMIT 5;
```

- [ ] 所有记录都有 consecutive_green 字段
- [ ] 所有记录都有 last_practice_date 字段
- [ ] consecutive_green 值已正确初始化
- [ ] last_practice_date 值已正确初始化

---

## 边界情况测试

### 测试连续 5 天掌握
- [ ] 模拟 5 条 green 记录
- [ ] 状态显示为 MASTERED
- [ ] consecutive_green = 5

### 测试中途答错打断连胜
- [ ] 模拟 green, green, red, green, green
- [ ] 状态显示为 WEAK
- [ ] consecutive_green = 1（red 之后重新计数）

### 测试红色优先
- [ ] 同一天内 green, red
- [ ] history 最后一条是 red
- [ ] consecutive_green = 0

---

## 测试通过条件

- [ ] 所有 WEAK 词正确显示淡红色或红色下划线
- [ ] 所有 MASTERED 词正确显示绿色下划线
- [ ] 所有 NEW 词正确显示无标记
- [ ] "仅错题"筛选只显示 WEAK 词
- [ ] 新的一天进入时短期标记已清空
- [ ] 存档功能正确更新 consecutive_green 和 last_practice_date
- [ ] 掌握状态判断逻辑正确

---

## 测试记录

| 测试项 | 结果 | 问题 |
|--------|------|------|
| WEAK 词显示 | ⬜ | |
| MASTERED 词显示 | ⬜ | |
| NEW 词显示 | ⬜ | |
| "仅错题"筛选 | ⬜ | |
| 新的一天清空标记 | ⬜ | |
| 存档功能 | ⬜ | |
| 掌握状态判断 | ⬜ | |

---

**测试完成后，请将此记录发送给我。**
