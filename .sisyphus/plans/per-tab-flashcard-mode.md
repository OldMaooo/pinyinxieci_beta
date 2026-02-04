# 每个Tab独立闪卡模式视图

## TL;DR

> **核心目标**：每个tab都有独立的闪卡视图开关，用户可以切换闪卡视图/普通grid视图，两种视图的错题标记同步。

---

## Context

### 用户需求
1. 每个tab（自由练习、模拟自测、家长终测）都有独立的闪卡视图开关
2. 用户可以选择用闪卡视图还是普通grid视图
3. 两种视图的错题标记需要同步

### 当前代码分析
**第813行** - 当前只有一个全局闪卡按钮：
```jsx
{step === 0 && <button onClick={() => setIsFlashCardMode(true)} ...><Monitor size={18}/></button>}
```

**问题**：
- 只在step===0时显示
- 没有视图切换功能
- 闪卡模式使用独立的`FlashCardView`组件

---

## Work Objectives

### 核心目标
1. 每个tab都有独立的闪卡视图开关
2. 点击开关可以切换闪卡视图/普通grid视图
3. 两种视图共享同一个words数组和标记状态

### 关键改动
1. **添加视图模式状态**：`isFlashCardView`（每tab独立）
2. **修改闪卡按钮**：改为切换开关，而非进入闪卡模式
3. **修改主视图渲染**：根据`isFlashCardView`决定显示闪卡视图还是grid视图
4. **移除全局FlashCardView**：改为在主页面内渲染闪卡视图

---

## Execution Strategy

### 1. 添加视图模式状态

```jsx
// 添加状态
const [isFlashCardView, setIsFlashCardView] = useState([false, false, false]); // 每tab独立

// 切换指定tab的视图模式
const toggleFlashCardView = (tabIndex) => {
  setIsFlashCardView(prev => {
    const newState = [...prev];
    newState[tabIndex] = !newState[tabIndex];
    return newState;
  });
};
```

### 2. 修改闪卡按钮

将全局按钮改为每tab独立的切换开关：

```jsx
// 修改前（只在一级显示）
{step === 0 && <button onClick={() => setIsFlashCardMode(true)} ...><Monitor size={18}/></button>}

// 修改后（每个tab都有）
<button
  onClick={() => toggleFlashCardView(step)}
  className={`... ${isFlashCardView[step] ? 'bg-blue-100 text-blue-600' : 'text-slate-400'}...`}
>
  <Monitor size={18}/>
</button>
```

### 3. 修改主视图渲染逻辑

```jsx
// 根据isFlashCardView[step]决定显示哪种视图
{isFlashCardView[step] ? (
  // 闪卡视图（内联，避免使用独立的FlashCardView组件）
  <div className="...">
    {/* 闪卡内容 */}
  </div>
) : (
  // 普通grid视图
  <div className="grid grid-cols-4 ...">
    {words.map((item, index) => (
      <WordRow key={`${step}-${item.id}`} ... />
    ))}
  </div>
)}
```

### 4. 确保标记同步

两种视图共享：
- 同一个`words`数组
- 同一个`onUpdate`回调

这样标记就会自动同步。

---

## TODOs

- [x] 1. 添加视图模式状态
  - isFlashCardView数组（每tab独立）
  - toggleFlashCardView函数

- [x] 2. 修改闪卡按钮
  - 改为每tab独立的切换开关
  - 根据isFlashCardView[step]显示激活状态

- [x] 3. 修改主视图渲染
  - 根据isFlashCardView[step]切换视图
  - 将FlashCardView内容内联到主页面

- [x] 4. 版本号更新
  - V3.10.3 → V3.10.4

---

## Commit Strategy

| After Task | Message | Files |
|------------|---------|-------|
| 1-3 | `feat: add per-tab flashcard view mode with sync` | src/App.jsx |
| 4 | `chore: bump version to V3.10.4` | src/App.jsx |

---

## Success Criteria

- [x] 每个tab都有独立的闪卡视图开关
- [x] 点击开关可以切换闪卡视图/普通grid视图
- [x] 两种视图的错题标记同步
- [x] 切换视图时标记状态保持

---

## 关键代码位置

| 功能 | 行号 | 说明 |
|------|------|------|
| 闪卡按钮 | ~813 | 修改为切换开关 |
| 主视图渲染 | ~850 | 添加视图切换逻辑 |
| words状态 | ~行 | 共享状态 |

---

## 闪卡视图UI设计

闪卡视图应该与现有的`FlashCardView`组件类似：

```jsx
<div className="fixed inset-0 z-[2000] ...">
  {/* 顶部：进度 */}
  {/* 中间：当前词 */}
  {/* 底部：缩略图 + 工具栏 */}
</div>
```

主要区别：
- 不再使用独立的组件
- 直接在主页面条件渲染
- 共享words数组和onUpdate回调

---

## 视图切换时的状态处理

切换视图时不需要保存/恢复状态，因为：
- 两种视图共享同一个`words`数组
- 标记状态（markPractice, markSelf, markFinal）都存储在words中
- 切换视图时，words数组不变，只是显示方式改变
