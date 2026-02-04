# 创建跨天逻辑测试工具

## 需求概述

用户需要创建一个可视化测试工具，用于验证「短期 vs 长期掌握」的状态变化逻辑。

## 功能需求

### 1. 测试数据管理
- 表格形式展示，一行 = 一天的测试记录
- 可新增/删除/修改测试数据
- 字段：日期、册数、标记(红/绿/白)

### 2. 预设案例（4个）
| 案例 | 场景 | 数据 |
|------|------|------|
| 案例1 | 连续5天答对 → 掌握 | D1-D5 全部 green |
| 案例2 | 中途答错打断连胜 | D1 green, D2 red, D3 green |
| 案例3 | 红色优先（同一天多次） | D1-1 green, D1-2 red, D1-3 green, D2 green |
| 案例4 | 新词起点 | D1 white, D2 green, D3 green |

### 3. 实时计算
- 每行显示累计的 history 和 consecutive
- 实时显示每行的状态（掌握/薄弱/新词）
- 最终结果显示总状态

### 4. 核心计算逻辑
```javascript
function calculate(data) {
  // 按日期分组
  // 红色优先：同一天有red则用red
  // 连续天数：green +1, red/white 重置为 0
  // 状态判断：
  //   consecutive >= 5 → MASTERED
  //   history 最后是 red → WEAK
  //   其他 → NEW
}
```

## 实现方案

### 文件位置
```
test-cross-day.html
```

### 代码结构
```html
<!-- 顶部：规则说明 -->
<div class="rules">核心规则说明</div>

<!-- 案例选择 -->
<div class="case-buttons">
  <button onclick="loadCase(1)">案例1</button>
  <button onclick="loadCase(2)">案例2</button>
  <button onclick="loadCase(3)">案例3</button>
  <button onclick="loadCase(4)">案例4</button>
</div>

<!-- 测试表格 -->
<table>
  <thead>日期 | 册数 | 标记 | 历史 | 连续 | 状态 | 操作</thead>
  <tbody>动态生成</tbody>
</table>

<!-- 添加新行 -->
<div>
  <input type="date">
  <input type="number" value="1">
  <select><option>绿色</option><option>红色</option></select>
  <button onclick="addDay()">+ 添加</button>
</div>

<!-- 最终结果 -->
<div id="result-display">
  状态卡片：掌握/薄弱/新词
  history: [...]
</div>

<script>
// 预设案例数据
const cases = {
  1: { name: '连续5天答对', data: [...] },
  2: { name: '中途答错', data: [...] },
  3: { name: '红色优先', data: [...] },
  4: { name: '新词起点', data: [...] }
};

// 核心计算逻辑（同上）
function calculate(data) { ... }

// 渲染表格
function render() { ... }

// 添加/删除/修改行
function addDay() { ... }
function removeRow(i) { ... }
function updateRow(i, field, value) { ... }
</script>
```

## 使用方法

1. 打开 `test-cross-day.html`
2. 点击预设案例加载测试数据，或自定义输入词组
3. 修改表格中的数据（日期、册数、标记）
4. 观察「历史」和「连续」列的实时变化
5. 查看底部「最终状态」

## 验证场景

- 连续5天 green → 状态变为「掌握」
- 中途有 red → 连续天数重置
- 同一天先绿后红 → 结果是红色（红色优先）
- 有 red 历史但最近都是 green → 仍然是「薄弱」（红色历史不能轻易洗白）
