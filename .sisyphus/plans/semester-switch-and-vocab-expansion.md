# 词库扩充与学期切换功能

## TL;DR

> **Quick Summary**: 添加学期切换功能，扩充1-3年级词库，替换硬编码数据为动态加载
> 
> **Deliverables**:
> - 学期切换UI（设置页右上角下拉菜单）
> - 动态数据加载（从 `public/data/` 加载JSON）
> - 扩充后的完整词库（1-3年级上下册）
> - 清理硬编码的 `DATA_BLUEPRINT`
> 
> **Estimated Effort**: Large
> **Parallel Execution**: NO - sequential (UI依赖数据结构调整)
> **Critical Path**: 数据结构调整 → 动态加载 → 学期切换UI → 词库扩充

---

## Context

### Original Request
用户要求：
1. 补充其他学期的词库
2. 调整设置页UI，右上角可以切换学期
3. 词库需要按要求扩充
4. 范围在1-3年级内
5. 现有词库在 `public/data/` 目录（标记为"非完整词库"）

### Interview Summary

**Key Discussions**:
- 词库生成规范已记录在 `AI_Data_Generation_Kit/AI_INSTRUCTIONS.md` 和 `DEVELOPMENT_RULES.md`
- 现有 `DATA_BLUEPRINT` 是硬编码数据，只包含三年级上册
- `public/data/` 有6个JSON文件但未被使用
- 词库格式：`{wordBank: [{word, pinyin, grade, semester, unit}, ...]}`

**Research Findings**:
- 一年级上册词库存在大量单字（"天", "地", "人"等），需要组成2-4字词组
- `DEVELOPMENT_RULES.md` 规定：拒绝单字，生字必须语境化
- 语文园地需要序列化命名（语文园地1、语文园地2...）

### Metis Review

**Identified Gaps** (addressed):
- 数据结构不兼容：硬编码 `DATA_BLUEPRINT` vs 动态JSON格式
- 缺少学期切换状态管理
- 词库数据质量问题（一年级上册单字过多）
- 版本号需要更新（当前 V3.10.5）

---

## Work Objectives

### Core Objective
在设置页右上角添加学期切换功能，扩充并完善1-3年级词库数据，替换硬编码为动态加载。

### Concrete Deliverables
- `src/App.jsx`: 删除 `DATA_BLUEPRINT`，添加学期切换UI和动态加载逻辑
- `public/data/*.json`: 扩充/完善1-3年级词库
- 版本号更新到 V3.11.0

### Definition of Done
- [ ] 设置页右上角显示学期切换下拉菜单
- [ ] 切换学期后，单元列表和词组正确更新
- [ ] 1-3年级所有词库数据完整（无单字）
- [ ] 动态加载替代硬编码
- [ ] 旧数据 `DATA_BLUEPRINT` 已删除

### Must Have
- 学期切换下拉菜单（1-3年级上下册共6个选项）
- 动态数据加载
- 词库扩充（所有生字组成2-4字词组）
- 进度统计正确显示

### Must NOT Have (Guardrails)
- 硬编码的 `DATA_BLUEPRINT`
- 单字词组（必须2-4字）
- 破坏现有掌握状态追踪逻辑
- 性能下降（动态加载 vs 硬编码）

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: NO
- **Automated tests**: NO
- **Framework**: N/A

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

> Whether TDD is enabled or not, EVERY task MUST include Agent-Executed QA Scenarios.
> - With TDD: QA scenarios complement unit tests at integration/E2E level
> - Without TDD: QA scenarios are the PRIMARY verification method

**Verification Tool by Deliverable Type:**

| Type | Tool | How Agent Verifies |
|------|------|-------------------|
| **Frontend/UI** | Playwright (playwright skill) | Navigate, interact, assert DOM, screenshot |
| **TUI/CLI** | interactive_bash (tmux) | Run command, send keystrokes, validate output |
| **API/Backend** | Bash (curl/httpie) | Send requests, parse responses, assert fields |
| **Library/Module** | Bash (bun/node REPL) | Import, call functions, compare output |
| **Config/Infra** | Bash (shell commands) | Apply config, run state checks, validate |

**Scenario 1: 学期切换UI显示**
  Tool: Playwright (playwright skill)
  Preconditions: Dev server running on localhost:5175
  Steps:
    1. Navigate to: http://localhost:5175
    2. Wait for: Setup page loaded
    3. Assert: Dropdown visible in top-right corner
    4. Assert: Dropdown shows "一年级上册" as default
    5. Screenshot: .sisyphus/evidence/semester-dropdown-visible.png
  Expected Result: Dropdown displays correctly
  Evidence: .sisyphus/evidence/semester-dropdown-visible.png

**Scenario 2: 学期切换功能**
  Tool: Playwright (playwright skill)
  Preconditions: Setup page loaded, dropdown visible
  Steps:
    1. Click: Dropdown toggle button
    2. Assert: Menu opens with 6 options (一年级上/下, 二年级上/下, 三年级上/下)
    3. Click: "二年级上册"
    4. Wait for: Page content refreshes
    5. Assert: Header shows "二年级上册"
    6. Assert: Unit list contains 二年级上册 units
  Expected Result: Switching semesters updates UI correctly
  Evidence: .sisyphus/evidence/semester-switch-success.png

**Scenario 3: 词库数据加载**
  Tool: Bash (curl)
  Preconditions: Dev server running
  Steps:
    1. curl http://localhost:5175/data/一年级上册.json
    2. Assert: HTTP 200 status
    3. Assert: JSON contains wordBank array
    4. Assert: No single-character words (length >= 2)
    5. Assert: Words have unit numbers (1-8)
  Expected Result: JSON files load correctly and are valid
  Evidence: Response body captured

**Scenario 4: 单元选择功能**
  Tool: Playwright (playwright skill)
  Preconditions: 二年级上册 selected
  Steps:
    1. Click: First unit checkbox
    2. Assert: Unit selected (checkbox checked)
    3. Assert: "开始练习" button enabled
    4. Click: First unit again (deselect)
    5. Assert: Unit deselected
  Expected Result: Unit selection works correctly
  Evidence: .sisyphus/evidence/unit-selection-works.png

**Scenario 5: 进度统计更新**
  Tool: Playwright (playwright skill)
  Preconditions: After semester switch
  Steps:
    1. Assert: Progress pie chart visible
    2. Assert: Statistics show correct numbers for current semester
    3. Switch to different semester
    4. Assert: Statistics update to match new semester
  Expected Result: Progress stats reflect current semester
  Evidence: .sisyphus/evidence/progress-stats-update.png

**Evidence Requirements:**
- [ ] Screenshots in .sisyphus/evidence/ for UI scenarios
- [ ] Terminal output for CLI/TUI scenarios
- [ ] Response bodies for API scenarios
- [ ] Each evidence file named: task-{N}-{scenario-slug}.{ext}

---

## Execution Strategy

### Sequential Execution

```
Task 1: 数据结构调整
├── 1.1 定义学期列表常量
├── 1.2 创建动态数据加载函数
├── 1.3 删除硬编码 DATA_BLUEPRINT
└── 1.4 测试数据加载

Task 2: 学期切换UI
├── 2.1 添加学期切换下拉菜单组件
├── 2.2 添加学期状态管理
├── 2.3 集成到设置页右上角
└── 2.4 测试切换功能

Task 3: 词库扩充
├── 3.1 分析现有词库缺口
├── 3.2 扩充一年级上册（重点：单字组成词组）
├── 3.3 扩充一年级下册
├── 3.4 扩充二年级上册
├── 3.5 扩充二年级下册
├── 3.6 扩充三年级下册
└── 3.7 验证所有词库数据

Task 4: 整合测试
├── 4.1 端到端测试所有功能
├── 4.2 性能测试（加载速度）
└── 4.3 更新版本号

Critical Path: Task 1 → Task 2 → Task 3 → Task 4
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2, 3, 4 | None |
| 2 | 1 | 4 | None |
| 3 | 1 | 4 | None |
| 4 | 2, 3 | None | None |

---

## TODOs

> Implementation + Test = ONE Task. Never separate.
> EVERY task MUST have: Recommended Agent Profile + Parallelization info.

- [ ] 1. 数据结构调整（动态加载 + 删除硬编码）

  **What to do**:
  - 定义学期列表常量（1-3年级上下册）
  - 创建 `loadWordBank(grade, semester)` 函数
  - 从 `public/data/{grade}{semester}.json` 动态加载
  - 删除硬编码 `DATA_BLUEPRINT` 和 `charToWordMap`
  - 测试数据加载函数

  **Must NOT do**:
  - 不改变词库JSON格式（保持 `{wordBank: [...]}`）
  - 不修改掌握状态追踪逻辑

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `visual-engineering`
    - Reason: UI变化为主，需要理解数据流
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: 数据加载和UI更新逻辑

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Tasks 2, 3, 4
  - **Blocked By**: None (can start immediately)

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `src/App.jsx:11-35` - DATA_BLUEPRINT structure (to be removed)
  - `src/App.jsx:533` - processedUnits usage pattern

  **API/Type References** (contracts to implement against):
  - `public/data/三年级上册.json` - Target JSON format
  - `{wordBank: [{word, pinyin, grade, semester, unit}, ...]}`

  **Documentation References** (specs and requirements):
  - `AI_Data_Generation_Kit/AI_INSTRUCTIONS.md` - 词库生成规范
  - `DEVELOPMENT_RULES.md` - 生字语境化规则

  **WHY Each Reference Matters**:
  - `DATA_BLUEPRINT`: 了解现有结构，替换为动态加载
  - `processedUnits`: 理解数据消费方式

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios**:

  \`\`\`
  Scenario: 数据加载函数测试
    Tool: Bash (bun)
    Preconditions: Dev server running
    Steps:
      1. bun -e "const data = require('./public/data/三年级上册.json'); console.log(JSON.stringify(data).substring(0, 200))"
      2. Assert: Valid JSON structure
      3. Assert: wordBank array exists
      4. Assert: count matches wordBank.length
    Expected Result: JSON files are valid and loadable
    Evidence: Terminal output captured
  \`\`\`

  **Evidence to Capture:**
  - [ ] Terminal output for data validation
  - [ ] Screenshots in .sisyphus/evidence/ for UI scenarios

- [ ] 2. 学期切换UI实现

  **What to do**:
  - 创建 `SemesterSelector` 下拉菜单组件
  - 添加 `selectedSemester` 状态（默认一年级上册）
  - 替换设置页右上角的硬编码"三年级上册"
  - 切换学期时更新 `selectedUnits`、`words`、`mastery`
  - 测试切换功能

  **Must NOT do**:
  - 不修改练习页面逻辑
  - 不破坏掌握状态追踪

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `visual-engineering`
    - Reason: 下拉菜单UI实现
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: UI组件和交互逻辑

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Task 4
  - **Blocked By**: Task 1

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `src/App.jsx:785-814` - Setup page header structure
  - `src/App.jsx:812` - Current hardcoded "三年级上册" (to replace)

  **UI Component References** (components to reuse):
  - Existing dropdown patterns in the codebase

  **Documentation References** (specs and requirements):
  - `AGENTS.md` - UI风格（Tailwind CSS, 圆角卡片等）

  **WHY Each Reference Matters**:
  - Setup page header: 了解现有布局，集成新组件
  - 版本号附近: 保持UI一致性

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios**:

  \`\`\`
  Scenario: 学期切换UI显示
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running on localhost:5175
    Steps:
      1. Navigate to: http://localhost:5175
      2. Wait for: Setup page loaded
      3. Assert: Dropdown visible in top-right corner
      4. Screenshot: .sisyphus/evidence/task2-dropdown-visible.png
    Expected Result: Dropdown displays correctly
    Evidence: .sisyphus/evidence/task2-dropdown-visible.png

  Scenario: 学期切换功能
    Tool: Playwright (playwright skill)
    Preconditions: Setup page loaded, dropdown visible
    Steps:
      1. Click: Dropdown toggle button
      2. Assert: Menu opens with 6 options
      3. Click: "二年级上册"
      4. Assert: Header shows "二年级上册"
    Expected Result: Switching semesters works
    Evidence: .sisyphus/evidence/task2-semester-switch.gif
  \`\`\`

  **Evidence to Capture:**
  - [ ] Screenshots of dropdown UI
  - [ ] GIF or video of switching action

- [ ] 3. 词库扩充与完善

  **What to do**:
  - 分析每个学期的词库缺口
  - 一年级上册：补全单字为词组（如"天"→"天空"，"地"→"土地"）
  - 一年级下册：同样处理
  - 二年级上册：同样处理
  - 二年级下册：同样处理
  - 三年级下册：同样处理
  - 验证所有词库符合规范

  **Must NOT do**:
  - 不改变JSON文件格式结构
  - 不添加4年级及以上内容
  - 不删除现有有效词组

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `unspecified-low`
    - Reason: 数据处理任务，复杂度低
  - **Skills**: []
    - No special skills needed for data processing

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Task 4
  - **Blocked By**: Task 1

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `AI_Data_Generation_Kit/AI_INSTRUCTIONS.md` - 词库生成规范
  - `DEVELOPMENT_RULES.md` - 生字语境化规则

  **Existing Data References**:
  - `public/data/三年级上册.json` - 完整示例格式
  - `public/data/一年级上册.json` - 需要扩充的目标

  **Documentation References** (specs and requirements):
  - 语文园地需序列化命名（语文园地1、语文园地2...）
  - 生字必须组成2-4字词组

  **WHY Each Reference Matters**:
  - AI_INSTRUCTIONS.md: 确保扩充符合规范
  - 三年级上册: 参考完整格式

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios**:

  \`\`\`
  Scenario: 词库数据验证
    Tool: Bash (bun)
    Preconditions: None
    Steps:
      1. bun -e "
          const files = ['一年级上册', '一年级下册', '二年级上册', '二年级下册', '三年级上册', '三年级下册'];
          files.forEach(f => {
            const data = require(\`./public/data/\${f}.json\`);
            const issues = data.wordBank.filter(w => w.word.length < 2);
            console.log(\`\${f}: \${data.wordBank.length} words, \${issues.length} single-char issues\`);
          });
        "
      2. Assert: No single-character words
      3. Assert: Each file has reasonable word count
    Expected Result: All word banks are valid
    Evidence: Terminal output captured
  \`\`\`

  **Evidence to Capture:**
  - [ ] Validation report for each word bank

- [ ] 4. 整合测试与版本号更新

  **What to do**:
  - 端到端测试所有功能
  - 验证加载性能（动态加载 vs 硬编码）
  - 更新版本号到 V3.11.0
  - 测试从 `public/data/` 加载是否正常

  **Must NOT do**:
  - 不引入新的bug
  - 不破坏现有功能

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `quick`
    - Reason: 测试和版本号更新，任务简单
  - **Skills**: [`playwright`]
    - `playwright`: E2E测试验证

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (final task)
  - **Blocks**: None (final)
  - **Blocked By**: Tasks 1, 2, 3

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `src/App.jsx:794` - Current version number location

  **Documentation References** (specs and requirements):
  - `AGENTS.md` - 版本号更新规则

  **WHY Each Reference Matters**:
  - 版本号位置: 知道在哪里更新

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios**:

  \`\`\`
  Scenario: 完整功能E2E测试
    Tool: Playwright (playwright skill)
    Preconditions: All tasks completed
    Steps:
      1. Navigate to: http://localhost:5175
      2. Assert: Setup page loads with 一年级上册 selected
      3. Select: 单元1 checkbox
      4. Click: "开始练习" button
      5. Assert: Practice page loads
      6. Click: 返回 Setup
      7. Switch to: 三年级上册
      8. Assert: Data loads correctly
      9. Screenshot: .sisyphus/evidence/task4-e2e-test.png
    Expected Result: All features work together
    Evidence: .sisyphus/evidence/task4-e2e-test.png
  \`\`\`

  **Evidence to Capture:**
  - [ ] Full E2E test screenshot
  - [ ] Version number verification

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `refactor: replace DATA_BLUEPRINT with dynamic loading` | src/App.jsx | npm run dev |
| 2 | `feat: add semester selector dropdown` | src/App.jsx | npm run dev |
| 3 | `data: expand word banks for grades 1-3` | public/data/*.json | npm run dev |
| 4 | `chore: bump version to V3.11.0` | src/App.jsx | npm run build |

---

## Success Criteria

### Verification Commands
```bash
# Start dev server
npm run dev

# Verify word banks
bun -e "
const files = ['一年级上册', '一年级下册', '二年级上册', '二年级下册', '三年级上册', '三年级下册'];
files.forEach(f => {
  const data = require(\`./public/data/\${f}.json\`);
  console.log(\`\${f}: \${data.wordBank.length} words\`);
});
"
```

### Final Checklist
- [ ] Semester selector dropdown works
- [ ] All 6 word banks load correctly
- [ ] No single-character words
- [ ] Version updated to V3.11.0
- [ ] DATA_BLUEPRINT removed
- [ ] All tests pass
