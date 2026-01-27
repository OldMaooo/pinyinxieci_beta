# Plan: 纯拼音闪卡模式

## Context

### Original Request
在闪卡模式中增加纯拼音显示模式，让孩子可以听写练习。功能包括：
- 将中文词组替换成拼音显示
- 缩略图也变成拼音
- 点击拼音，出现中文放大
- 再次点击中文变红，加入错题（再次点击可以取消）
- 手势左滑右滑可以切换下一题

### Interview Summary
**Key Discussions**:
- 错题标记需要持久化到云端（Supabase）
- 标记错题后停留在当前词，不自动跳转
- 纯拼音模式通过底部控制栏的按钮触发
- 拼音格式使用完整拼音带声调（如：shān pō）

**Research Findings**:
- FlashCardView 组件位于 src/App.jsx:134-268
- words 数组结构：`{ id, word: '中文', pinyin: 'shān pō' }`
- pinyin-pro 库已导入，用于生成拼音
- Supabase 客户端已配置，upsert 模式存在于 save() 函数（435-453行）
- 项目无测试框架，使用手动 QA

### Metis Review
Metis 调用遇到技术问题（JSON Parse error），已跳过。计划基于当前理解生成。

**Identified Gaps (to be addressed)**:
- [RESOLVED] 错题标记的存储位置：复用 temp_state.practice 字段
  - 闪卡错题标记为 'red' 或 'white'
  - 同步到 temp_state 的 practice 字段
  - 这样主练习的"仅错题"过滤会包含闪卡错题（参见第490-508行的 updateWordsWithFilter 函数）
- [RESOLVED] 闪卡错题和主练习错题的关系：同步到自由练习
  - 闪卡错题存储在 temp_state.practice
  - 主练习的 step === 0（自由练习）过滤条件包含 `markPractice === 'red'`
  - 用户在闪卡模式标记的错题，会在主练习的"仅错题"过滤中显示

---

## Plan Summary (Self-Review)

**Auto-Resolved** (minor gaps fixed):
- 无自动解决的 gaps

**Defaults Applied** (override if needed):
- 拼音首字母提取：使用 `.split(' ').map(s => s[0]).join('')`（如：shān pō → sp）
- 错题视觉反馈：使用 text-red-500 样式（与项目现有的错误提示一致）

**Decisions Resolved** (user answered):
- 错题存储位置：复用 temp_state.practice 字段（'red' = 错题，'white' = 正常）
- 错题关系：闪卡错题同步到自由练习（主练习的"仅错题"会包含闪卡错题）

**Decisions Needed** (if any):
- 无（已全部解决）

---

## Work Objectives

### Core Objective
在 FlashCardView 组件中增加纯拼音模式，支持拼音显示、点击查看中文、错题标记和云端同步。

### Concrete Deliverables
- 修改后的 FlashCardView 组件，包含拼音模式功能
- 新增的状态管理和交互逻辑
- 错题标记的云端同步功能
- 拼音模式切换按钮和控制栏 UI

### Definition of Done
- [ ] 拼音模式切换正常
- [ ] 拼音显示正确（带声调符号）
- [ ] 点击拼音显示完整中文（放大）
- [ ] 点击中文可以标记/取消错题（变红/恢复）
- [ ] 错题标记同步到 Supabase（验证数据库记录）
- [ ] 手势滑动切换题目正常
- [ ] 缩略图显示拼音首字母（拼音模式）或首字（中文模式）
- [ ] 错题视觉反馈正确（红色背景/边框）

### Must Have
- 拼音模式切换功能
- 拼音显示（完整带声调）
- 点击拼音显示中文
- 错题标记和取消
- 错题云端同步
- 手势导航（左滑/右滑）

### Must NOT Have (Guardrails)
- 不要修改现有的中文模式行为
- 不要自动播放 TTS（仅在拼音显示时可能需要）
- 不要添加额外的错误边界（使用现有的 ErrorBoundary）
- 不要修改 mastery_records 表结构（除非确认为必要）
- 不要修改 Supabase 连接配置
- 不要修改 temp_state 的现有字段结构（practice, self, final）
- 不要混淆闪卡错题和主练习错题（需要明确区分）

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: NO (no test framework)
- **User wants tests**: Manual-only
- **Framework**: Manual QA in browser

### Manual QA Procedure

**Test 1: 拼音模式切换**
- 启动开发服务器：`npm run dev`
- 打开 http://localhost:5175
- 选择单元，开始练习
- 点击顶部"看答案"进入闪卡模式
- 点击底部控制栏新增的"拼音模式"按钮
- 验证：主显示区域显示拼音（如：shān pō）
- 验证：缩略图显示拼音首字母（如：sp）
- 再次点击"拼音模式"按钮
- 验证：恢复中文显示

**Test 2: 点击拼音显示中文**
- 进入拼音模式
- 点击主显示区域的拼音
- 验证：显示完整中文（放大效果）
- 验证：中文为黑色（正常状态）

**Test 3: 标记错题**
- 在显示中文状态下，点击中文
- 验证：中文变红（错题状态）
- 验证：错题缩略图也变红
- 再次点击中文
- 验证：中文恢复黑色（取消错题标记）

**Test 4: 错题云端同步**
- 标记一个词为错题
- 刷新浏览器
- 重新进入练习，查看该词的状态
- 验证：错题标记保持（红色）
- 打开 Supabase Dashboard 或查询数据库
- 验证：mastery_records 表中有记录，temp_state 字段包含错题标记

**Test 5: 手势导航**
- 进入拼音模式
- 在屏幕左侧区域点击
- 验证：切换到上一个词
- 在屏幕右侧区域点击
- 验证：切换到下一个词

**Test 6: 混合模式切换**
- 在拼音模式下标记一些错题
- 切换回中文模式
- 验证：错题标记保持（中文变红）
- 切换回拼音模式
- 验证：错题标记保持

**Test 7: 边界情况**
- 标记错题后，滑动到其他词，再滑回来
- 验证：错题标记保持
- 在拼音模式下，点击多个词的拼音标记错题
- 切换到中文模式
- 验证：所有错题标记正确显示

---

## Task Flow

```
Task 1 (状态管理) → Task 2 (主显示) → Task 3 (缩略图) → Task 4 (交互逻辑)
                                                ↘ Task 5 (云端同步)
                                                ↘ Task 6 (控制栏 UI)
```

## Parallelization

| Group | Tasks | Reason |
|-------|-------|--------|
| - | 无 | 所有任务都修改同一组件，需要顺序执行 |

| Task | Depends On | Reason |
|------|------------|--------|
| 2 | 1 | 需要状态变量存在 |
| 3 | 1 | 需要状态变量存在 |
| 4 | 1, 2 | 需要状态和显示逻辑 |
| 5 | 4 | 需要错题标记逻辑 |
| 6 | 1 | 需要状态变量 |

---

## TODOs

- [ ] 1. 添加拼音模式相关的状态变量

  **What to do**:
  - 在 FlashCardView 组件内添加状态：
    - `isPinyinMode`: boolean，默认 false
    - `markedWrong`: Set，存储标记为错题的 word id
    - `showChinese`: boolean，默认 false（仅在拼音模式下使用）

  **Must NOT do**:
  - 不要修改组件接收的 props（words, onClose）

  **Parallelizable**: NO (no dependencies)

  **References** (CRITICAL):

  **Pattern References**:
  - `src/App.jsx:136-147` - FlashCardView 中的状态定义模式（useState）
  - `src/App.jsx:315-316` - MainApp 中的 mastery 状态管理

  **API/Type References**:
  - 无新增 API 或类型

  **Test References**:
  - 无测试参考

  **Documentation References**:
  - `AGENTS.md` - 代码风格指南（组件状态管理部分）

  **External References**:
  - React useState 官方文档：https://react.dev/reference/react/useState

  **WHY Each Reference Matters**:
  - FlashCardView 中的现有状态定义显示了如何使用 useState
  - MainApp 中的 mastery 状态管理展示了如何使用 Set 存储错题

  **Acceptance Criteria**:

  **Manual Execution Verification**:
  - [ ] 读取 FlashCardView 组件定义（134-268行）
  - [ ] 在第136行附近添加：`const [isPinyinMode, setIsPinyinMode] = useState(false);`
  - [ ] 在第136行附近添加：`const [markedWrong, setMarkedWrong] = useState(new Set());`
  - [ ] 在第136行附近添加：`const [showChinese, setShowChinese] = useState(false);`
  - [ ] 保存文件后，检查控制台无错误
  - [ ] 启动开发服务器：`npm run dev`
  - [ ] 进入闪卡模式，打开浏览器 DevTools（F12）
  - [ ] 在 React DevTools 中检查 FlashCardView 组件状态
  - [ ] 验证：isPinyinMode 为 false，markedWrong 为空 Set，showChinese 为 false

  **Commit**: NO

- [ ] 2. 修改主显示区域，支持拼音和中文切换

  **What to do**:
  - 修改第235-237行的主显示区域
  - 根据 isPinyinMode 和 showChinese 决定显示内容：
    - 非拼音模式：显示中文（currentWord.word）
    - 拼音模式且 showChinese 为 false：显示拼音（currentWord.pinyin）
    - 拼音模式且 showChinese 为 true：显示中文（currentWord.word）
  - 添加点击事件处理：
    - 非拼音模式：无特殊处理
    - 拼音模式且 showChinese 为 false：点击设置 showChinese 为 true
    - 拼音模式且 showChinese 为 true：点击调用错题标记逻辑（Task 4）

  **Must NOT do**:
  - 不要修改现有的点击事件 handleInteraction（第226行）
  - 不要修改现有的双击事件（第227行）

  **Parallelizable**: NO (depends on Task 1)

  **References**:

  **Pattern References**:
  - `src/App.jsx:236` - 当前主显示区域实现
  - `src/App.jsx:225-228` - 现有的 onClick 和 onDoubleClick 处理

  **API/Type References**:
  - words 数组结构：`{ id, word: string, pinyin: string }`

  **Test References**:
  - 无测试参考

  **Documentation References**:
  - `AGENTS.md` - 事件处理模式

  **External References**:
  - React onClick 事件：https://react.dev/reference/react-dom/components/common#reacting-to-events

  **WHY Each Reference Matters**:
  - 主显示区域的现有实现展示了如何显示文字和添加事件处理
  - 现有的 onClick 模式展示了如何避免事件冲突

  **Acceptance Criteria**:

  **Manual Execution Verification**:
  - [ ] 定位到第235-237行的主显示区域
  - [ ] 修改为条件渲染：
    ```javascript
    <div className="flex flex-col items-center justify-center flex-1 w-full pointer-events-auto px-4">
      <div
        ref={wordElementRef}
        className={`font-kaiti font-black leading-none transition-colors cursor-pointer ${
          isPinyinMode && showChinese && markedWrong.has(currentWord.id)
            ? 'text-red-500'
            : isDarkMode
            ? 'text-white'
            : 'text-black'
        }`}
        onClick={() => {
          if (isPinyinMode) {
            if (!showChinese) {
              setShowChinese(true);
            } else {
              toggleWrongMark(currentWord.id);
            }
          }
        }}
      >
        {!isPinyinMode
          ? currentWord.word
          : showChinese
          ? currentWord.word
          : currentWord.pinyin}
      </div>
    </div>
    ```
  - [ ] 注意：将 pointer-events-none 改为 pointer-events-auto（第235行）
  - [ ] 保存文件
  - [ ] 启动开发服务器：`npm run dev`
  - [ ] 进入闪卡模式
  - [ ] 验证：默认显示中文
  - [ ] 点击底部"拼音模式"按钮
  - [ ] 验证：显示拼音（如：shān pō）
  - [ ] 点击拼音
  - [ ] 验证：显示中文（放大）
  - [ ] 刷新页面，验证默认状态（中文模式）

  **Commit**: NO

- [ ] 3. 修改缩略图显示，支持拼音首字母

  **What to do**:
  - 修改第248-254行的缩略图区域
  - 根据 isPinyinMode 决定显示内容：
    - 非拼音模式：显示首字 `w.word[0]`
    - 拼音模式：显示拼音首字母（提取 currentWord.pinyin 的首字母）
  - 更新缩略图样式，标记错题：
    - 如果 markedWrong 包含 w.id，显示红色背景

  **Must NOT do**:
  - 不要修改缩略图的点击事件（切换 index）
  - 不要修改缩略图的水平滚动功能

  **Parallelizable**: NO (depends on Task 1)

  **References**:

  **Pattern References**:
  - `src/App.jsx:251` - 当前缩略图显示实现（w.word[0]）
  - `src/App.jsx:250-253` - 缩略图的 map 循环和条件样式

  **API/Type References**:
  - words 数组结构：`{ id, word: string, pinyin: string }`
  - pinyin 格式：`shān pō`（空格分隔的音节）

  **Test References**:
  - 无测试参考

  **Documentation References**:
  - `AGENTS.md` - 条件渲染模式

  **External References**:
  - JavaScript 字符串处理：https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/charAt

  **WHY Each Reference Matters**:
  - 当前缩略图实现展示了如何遍历 words 数组并显示
  - 条件样式模式展示了如何根据状态动态改变样式

  **Acceptance Criteria**:

  **Manual Execution Verification**:
  - [ ] 定位到第248-254行的缩略图区域
  - [ ] 修改缩略图内容：
    ```javascript
    {words.map((w, i) => (
      <button
        key={i}
        onClick={() => setIndex(i)}
        className={`shrink-0 w-16 h-[100px] rounded-xl font-kaiti flex items-center justify-center transition-all ${
          index === i ? 'bg-white text-black font-black text-2xl shadow-lg' : (isDarkMode ? 'bg-white/10 text-white/40 text-xl' : 'bg-black/5 text-black/40 text-xl')
        } ${markedWrong.has(w.id) ? 'text-red-500' : ''}`}
      >
        {isPinyinMode
          ? w.pinyin
              .split(' ')
              .map((pyllable) => pyllable[0])
              .join('')
          : w.word[0]}
      </button>
    ))}
    ```
  - [ ] 保存文件
  - [ ] 启动开发服务器：`npm run dev`
  - [ ] 进入闪卡模式，点击"拼音模式"按钮
  - [ ] 验证：缩略图显示拼音首字母（如：shān pō → sp）
  - [ ] 标记一个词为错题（点击中文）
  - [ ] 验证：该词的缩略图显示红色文字

  **Commit**: NO

- [ ] 4. 实现错题标记逻辑和点击处理

  **What to do**:
  - 实现 `toggleWrongMark` 函数：
    - 接收 wordId 参数
    - 切换 markedWrong Set 中的 id
    - 调用云端同步（Task 5）
  - 修改主显示区域的点击处理（已在 Task 2 中部分实现）
  - 确保点击中文时：
    - 如果当前是错题：取消标记（从 Set 中移除）
    - 如果当前不是错题：标记为错题（添加到 Set）

  **Must NOT do**:
  - 不要修改现有的 next/prev 函数（第220-221行）
  - 不要修改现有的 handleInteraction 函数（第193行）

  **Parallelizable**: NO (depends on Task 1, 2)

  **References**:

  **Pattern References**:
  - `src/App.jsx:220-221` - next/prev 函数的 setIndex 模式
  - `src/App.jsx:435-453` - save() 函数中的 Supabase upsert 模式
  - `src/App.jsx:455-469` - markAs 函数中的错误标记模式

  **API/Type References**:
  - Set API：add, delete, has
  - words 数组结构：`{ id, word: string, pinyin: string }`

  **Test References**:
  - 无测试参考

  **Documentation References**:
  - `AGENTS.md` - Supabase 数据库操作模式

  **External References**:
  - JavaScript Set：https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set

  **WHY Each Reference Matters**:
  - next/prev 函数展示了如何修改 index 状态
- save() 函数展示了如何调用 Supabase upsert
  - markAs 函数展示了如何操作 mastery 相关的数据结构

  **Acceptance Criteria**:

  **Decision Resolved**: 错题标记同步到 temp_state.practice 字段
  - 闪卡错题标记为 'red' 或 'white'
  - 存储在 temp_state 的 practice 字段
  - 主练习的"仅错题"过滤会包含闪卡错题

  **Manual Execution Verification**:
  - [ ] 在 FlashCardView 组件内添加 `toggleWrongMark` 函数（在 useEffects 之后）
  - [ ] 实现函数：
    ```javascript
    const toggleWrongMark = async (wordId) => {
      const isWrong = markedWrong.has(wordId);
      const newMarkedWrong = new Set(markedWrong);
      if (isWrong) {
        newMarkedWrong.delete(wordId);
      } else {
        newMarkedWrong.add(wordId);
      }
      setMarkedWrong(newMarkedWrong);

      // 同步到云端（复用 temp_state.practice 字段）
      try {
        const { error } = await supabase
          .from('mastery_records')
          .upsert({
            id: wordId,
            temp_state: { practice: !isWrong ? 'red' : 'white' },
            updated_at: new Date().toISOString()
          });
        if (error) {
          console.error('[FlashCardView] Error syncing wrong mark:', error);
        }
      } catch (e) {
        console.error('[FlashCardView] Error syncing wrong mark:', e);
      }
    };
    ```
  - [ ] 保存文件
  - [ ] 启动开发服务器：`npm run dev`
  - [ ] 进入闪卡模式，点击"拼音模式"按钮
  - [ ] 点击拼音显示中文
  - [ ] 点击中文
  - [ ] 验证：中文变红（错题状态）
  - [ ] 再次点击中文
  - [ ] 验证：中文恢复黑色（取消错题）
  - [ ] 打开 React DevTools
  - [ ] 验证：markedWrong Set 包含/不包含对应的 word id

  **Commit**: NO

- [ ] 5. 实现错题标记的云端同步

  **What to do**:
  - 在 `toggleWrongMark` 函数中添加 Supabase 同步逻辑
  - 使用 Supabase upsert 更新 mastery_records 表
  - 更新 temp_state 字段，包含错题标记
  - 处理同步错误（console.error）

  **Must NOT do**:
  - 不要修改 mastery_records 表结构
  - 不要修改 Supabase 连接配置
  - 不要在同步失败时阻塞 UI（使用 console.error 记录）

  **Parallelizable**: NO (depends on Task 4)

  **References**:

  **Pattern References**:
  - `src/App.jsx:435-453` - save() 函数中的 Supabase upsert 完整实现
  - `src/App.jsx:460` - markAs 函数中的实时 upsert 示例
  - `src/App.jsx:6-8` - Supabase 客户端配置

  **API/Type References**:
  - Supabase upsert API：https://supabase.com/docs/reference/javascript/upsert
  - mastery_records 表结构：id, temp_state, updated_at

  **Test References**:
  - 无测试参考

  **Documentation References**:
  - `AGENTS.md` - Supabase 数据库操作和错误处理模式

  **External References**:
  - Supabase 官方文档：https://supabase.com/docs/reference/javascript

  **WHY Each Reference Matters**:
  - save() 函数展示了完整的 upsert 逻辑，包括错误处理
  - markAs 函数展示了实时 upsert 的模式
  - Supabase 客户端配置确保使用正确的连接

  **Acceptance Criteria**:

  **Manual Execution Verification**:
  - [ ] 修改 `toggleWrongMark` 函数，添加同步逻辑：
    ```javascript
    const toggleWrongMark = async (wordId) => {
      const newMarkedWrong = new Set(markedWrong);
      const isWrong = newMarkedWrong.has(wordId);
      if (isWrong) {
        newMarkedWrong.delete(wordId);
      } else {
        newMarkedWrong.add(wordId);
      }
      setMarkedWrong(newMarkedWrong);

      // 同步到云端
      try {
        const { error } = await supabase
          .from('mastery_records')
          .upsert({
            id: wordId,
            temp_state: { wrong: !isWrong },
            updated_at: new Date().toISOString()
          });
        if (error) {
          console.error('[FlashCardView] Error syncing wrong mark:', error);
        }
      } catch (e) {
        console.error('[FlashCardView] Error syncing wrong mark:', e);
      }
    };
    ```
  - [ ] 保存文件
  - [ ] 启动开发服务器：`npm run dev`
  - [ ] 进入闪卡模式，点击"拼音模式"按钮
  - [ ] 点击拼音显示中文，然后点击中文标记错题
  - [ ] 验证：中文变红
  - [ ] 刷新浏览器
  - [ ] 验证：错题标记保持（中文仍为红色）
  - [ ] 打开 Supabase Dashboard
  - [ ] 查询 mastery_records 表
  - [ ] 验证：该 word id 的记录中，temp_state 字段包含 `{ "wrong": true }`

  **Commit**: NO

- [ ] 6. 添加拼音模式切换按钮和控制栏 UI

  **What to do**:
  - 在底部控制栏添加"拼音模式"切换按钮
  - 按钮位置：在"缩略图"按钮（Grid 图标）旁边
  - 按钮样式：
    - 拼音模式开启：高亮显示（bg-emerald-50 text-emerald-600 或对应的 dark mode 样式）
    - 拼音模式关闭：默认样式（text-white/50 或 text-white）
  - 点击按钮切换 isPinyinMode 状态
  - 重置 showChinese 为 false（切换模式时不显示中文）

  **Must NOT do**:
  - 不要修改现有的控制栏按钮（播放/暂停、声音、缩略图）
  - 不要修改控制栏布局结构

  **Parallelizable**: NO (depends on Task 1)

  **References**:

  **Pattern References**:
  - `src/App.jsx:262` - 现有的控制栏按钮实现（缩略图按钮）
  - `src/App.jsx:261` - 现有的控制栏按钮实现（声音按钮）
  - `src/App.jsx:246-264` - 控制栏整体布局

  **API/Type References**:
  - 无新增 API

  **Test References**:
  - 无测试参考

  **Documentation References**:
  - `AGENTS.md` - Tailwind CSS 样式模式

  **External References**:
  - Lucide React 图标：https://lucide.dev/icons/

  **WHY Each Reference Matters**:
  - 现有的控制栏按钮展示了如何添加新按钮和样式
  - 控制栏布局展示了按钮之间的间距和对齐

  **Acceptance Criteria**:

  **Manual Execution Verification**:
  - [ ] 添加导入：从 lucide-react 导入 Type 或 Text 图标
    ```javascript
    import { LogOut, Check, X, Eye, EyeOff, Save, Volume2, Play, Pause, SkipBack, SkipForward, Plus, Minus, MousePointerClick, Loader2, Cloud, AlertCircle, RefreshCw, Monitor, VolumeX, Moon, Sun, Grid, Edit3, Type } from 'lucide-react';
    ```
  - [ ] 定位到第262行（缩略图按钮之后）
  - [ ] 在缩略图按钮后面添加拼音模式按钮：
    ```javascript
    <button
      onClick={(e) => {
        e.stopPropagation();
        setIsPinyinMode(!isPinyinMode);
        setShowChinese(false);
      }}
      className={`p-4 rounded-full transition-colors bg-black/20 backdrop-blur-md ${
        isPinyinMode ? 'text-emerald-400' : 'text-white/50'
      }`}
    >
      <Type size={24}/>
    </button>
    ```
  - [ ] 保存文件
  - [ ] 启动开发服务器：`npm run dev`
  - [ ] 进入闪卡模式
  - [ ] 验证：控制栏右侧有拼音模式按钮（图标显示）
  - [ ] 验证：按钮为半透明白色（isPinyinMode = false）
  - [ ] 点击拼音模式按钮
  - [ ] 验证：按钮变为翠绿色（isPinyinMode = true）
  - [ ] 验证：主显示区域显示拼音
  - [ ] 再次点击拼音模式按钮
  - [ ] 验证：按钮恢复半透明白色
  - [ ] 验证：主显示区域显示中文
  - [ ] 验证：showChinese 重置为 false（不会显示中文）

  **Commit**: NO

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| All tasks | `feat(flashcard): add pinyin mode with wrong marking and cloud sync` | src/App.jsx | Manual QA in browser |

---

## Success Criteria

### Verification Commands
```bash
npm run dev  # Expected: Server starts on http://localhost:5175
```

### Final Checklist
- [ ] 拼音模式切换功能正常
- [ ] 拼音显示正确（带声调符号）
- [ ] 点击拼音显示完整中文（放大）
- [ ] 点击中文可以标记/取消错题（变红/恢复）
- [ ] 错题标记同步到 Supabase（验证数据库记录）
- [ ] 手势滑动切换题目正常
- [ ] 缩略图显示拼音首字母（拼音模式）或首字（中文模式）
- [ ] 错题视觉反馈正确（红色文字）
- [ ] 所有测试场景通过（见 Verification Strategy）
- [ ] 控制台无错误（F12 Console）
- [ ] 浏览器兼容性正常（Chrome、Safari）
