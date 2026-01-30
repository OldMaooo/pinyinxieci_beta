# 数据库迁移和初始化指南

## 📋 现状

- **当前分支**：`feature/short-term-long-term-mastery`
- **代码修改**：✅ 完成
- **版本号**：V3.10.0

---

## 🚀 需要完成的操作

### 操作 1：在 Supabase 中添加新字段

**Supabase SQL Editor 应该已经打开**（在新的标签页）

在编辑器中运行以下 SQL：

```sql
ALTER TABLE mastery_records 
ADD COLUMN IF NOT EXISTS consecutive_green INTEGER DEFAULT 0;

ALTER TABLE mastery_records 
ADD COLUMN IF NOT EXISTS last_practice_date DATE;

SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'mastery_records' 
  AND column_name IN ('consecutive_green', 'last_practice_date');
```

**验证方法**：
点击 **Run** 后，应该看到类似结果：
```
column_name              | data_type | column_default
-----------------------|-----------|---------------
consecutive_green       | integer   | 0
last_practice_date      | date      | null
```

**完成标志**：
- ✅ 看到 `consecutive_green` 和 `last_practice_date` 两行结果
- ✅ 数据类型正确（integer 和 date）
- ✅ 默认值正确（0）

---

### 操作 2：运行初始化页面

**初始化页面应该已经打开**（在新的标签页）

页面会自动：
1. 获取所有 408 条记录
2. 计算每个词组的连续绿色天数
3. 逐个更新到数据库

**预期过程**：
```
开始初始化 consecutive_green 字段...

成功获取 408 条记录

正在更新... 已完成 50 / 408
正在更新... 已完成 100 / 408
...

✓ 初始化完成！

统计:
  - 总记录数: 408
  - 成功更新: 408
  - 已有值（跳过）: 0
  - 更新失败: 0
```

**完成标志**：
- ✅ 看到 "✓ 初始化完成！"
- ✅ 显示统计数据
- ✅ 所有记录都已更新

---

## 🧪 本地测试

完成上述两个操作后，在应用页面（http://localhost:3009）进行测试。

**测试清单文件**：
`.sisyphus/plans/test-checklist.md`

### 测试顺序

#### 1. Setup 页面测试

1. 打开应用（http://localhost:3009）
2. 检查 WEAK 词是否显示红色下划线
3. 检查 MASTERED 词是否显示绿色下划线
4. 检查 NEW 词是否无下划线
5. 检查顶部统计是否正确

#### 2. 练习页面测试

1. 选择任意单元，点击"开始练习"
2. 检查 WEAK 词是否显示淡红色
3. 标记一个错题，检查框框是否变红
4. 标记一个正确题，检查框框是否变绿
5. 点击"仅错题"筛选，检查是否只显示 WEAK 词

#### 3. 闪卡模式测试

1. 点击 Setup 页右上角的闪卡按钮
2. 检查 WEAK 词是否显示淡红色
3. 检查本轮错题是否显示纯红色
4. 区分两种红色（淡红色 vs 纯红色）

#### 4. 新的一天清空测试

1. 完成一轮练习，点击"存档并结束"
2. 重新进入练习
3. 检查短期标记是否已清空
4. 检查 long-term 数据是否已保存

#### 5. 掌握状态判断测试

1. 在浏览器控制台运行代码（F12 → Console）
2. 模拟不同的 history 和 consecutive_green
3. 验证状态判断是否正确

**在控制台粘贴并运行**：
```javascript
// 获取一个测试记录
const testId = Object.keys(window.mastery)[0];
const record = window.mastery[testId];

// 测试 1：MASTERED（连续 5 天 green）
console.log('Test 1 - MASTERED (5 consecutive green):');
const test1 = { ...record, history: ['green', 'green', 'green', 'green', 'green'], consecutive_green: 5 };
console.log('  consecutive_green:', 5);
console.log('  Expected: MASTERED');
console.log('  Status:', test1.consecutive_green >= 5 ? 'MASTERED' : (test1.history[test1.history.length-1] === 'red' ? 'WEAK' : 'NEW'));

// 测试 2：WEAK（最后一次 red）
console.log('\nTest 2 - WEAK (last result red):');
const test2 = { ...record, history: ['green', 'green', 'green', 'green', 'red'], consecutive_green: 0 };
console.log('  consecutive_green:', 0);
console.log('  Expected: WEAK');
console.log('  Status:', test2.consecutive_green >= 5 ? 'MASTERED' : (test2.history[test2.history.length-1] === 'red' ? 'WEAK' : 'NEW'));

// 测试 3：NEW（无历史或最后不是 red）
console.log('\nTest 3 - NEW (no red in history):');
const test3 = { ...record, history: ['green', 'green', 'green'], consecutive_green: 3 };
console.log('  consecutive_green:', 3);
console.log('  Expected: NEW');
console.log('  Status:', test3.consecutive_green >= 5 ? 'MASTERED' : (test3.history[test3.history.length-1] === 'red' ? 'WEAK' : 'NEW'));

// 测试 4：红色优先
console.log('\nTest 4 - Red priority (green then red on same day):');
const test4 = { ...record, history: ['green'], consecutive_green: 1 };
console.log('  consecutive_green:', 1);
console.log('  If red on same day: should reset to 0');
```

#### 6. 数据验证测试

1. 在 Supabase SQL Editor 中运行：
```sql
SELECT id, history, consecutive_green, last_practice_date
FROM mastery_records
LIMIT 5;
```

2. 检查返回的数据：
   - 所有记录都有 `consecutive_green` 字段
   - 所有记录都有 `last_practice_date` 字段
   - `consecutive_green` 值已正确计算
   - `last_practice_date` 值已正确设置

---

## ✅ 完成后

完成上述所有操作和测试后，告诉我：

1. **数据库迁移**：字段添加成功了吗？
2. **数据初始化**：初始化完成了吗？更新了多少条记录？
3. **本地测试**：发现了什么问题？或者都通过了？
4. **是否继续**：确认一切正常后，我会帮你提交代码到新分支

---

## 📝 相关文件

- 测试清单：`.sisyphus/plans/test-checklist.md`
- 备份数据：`backups/mastery-backup-2026-01-29-09-02-12.json`
- 当前分支：`feature/short-term-long-term-mastery`

---

**生成时间**：2026-01-29
