# 词库扩充计划（一年级上册优先）

## TL;DR

> **Quick Summary**: 将一年级上册的单字扩展为2-4字词组，补充其他年级词库，保护Supabase数据
> 
> **Deliverables**:
> - 一年级上册：所有单字扩展为词组
> - 其他年级：扩充完整词库
> - 动态数据加载功能
> - 学期切换UI
> 
> **Estimated Effort**: Large
> **Parallel Execution**: NO - sequential (数据处理依赖）
> **Critical Path**: 一年级上册 → 其他年级 → 动态加载 → UI

---

## Context

### Original Request
1. 扫描PDF课本的"写字表"+"词语表"（识字表不需要）
2. 转化成完整题库
3. 保护Supabase数据：三年级上册已有掌握状态不能丢失

### Interview Summary

**Key Discussions**:
- PDF扫描工具持续中断，改用手动整理策略
- 一年级上册.json全是单字（"天", "地", "人"等），需要组成2-4字词组
- 现有JSON可能只提取了一个表（写字表或词语表）
- Supabase中的mastery_records必须保留，特别是三年级上册

**Research Findings**:
- 一年级上册有224个词，几乎都是单字
- 词库规范：生字必须语境化为2-4字词组
- 语文园地需要序列化命名

### Metis Review

**Identified Gaps** (addressed):
- 单字词组不符合规范（DEVELOPMENT_RULES.md: 拒绝单字）
- 词库完整性未知（缺少词语表部分）
- Supabase数据保护机制不明确

---

## Work Objectives

### Core Objective
将1-3年级的生字扩展为词组，补充完整词库，实现动态加载和学期切换，保护现有掌握数据。

### Concrete Deliverables
- `public/data/一年级上册.json`: 单字扩展为词组
- `public/data/其他年级.json`: 扩充词库
- `src/App.jsx`: 动态加载 + 学期切换UI
- Supabase数据完整性验证

### Definition of Done
- [ ] 所有年级无单字词组（≥2字）
- [ ] 写字表+词语表完整提取
- [ ] 动态加载正常工作
- [ ] 学期切换UI可用
- [ ] 三年级上册Supabase数据保留
- [ ] 版本号更新

### Must Have
- 单字扩展为词组（2-4字）
- 写字表+词语表合并
- 动态数据加载
- 学期切换
- Supabase数据保护

### Must NOT Have (Guardrails)
- 单字词组（必须≥2字）
- 破坏Supabase掌握数据
- 改变现有词库JSON格式
- 4年级及以上内容

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: NO
- **Automated tests**: NO
- **Framework**: N/A

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

**Scenario 1: 一年级上册词库验证（无单字）**
  Tool: Bash (bun)
  Preconditions: 词库更新完成
  Steps:
    1. bun -e "
        const data = require('./public/data/一年级上册.json');
        const singleChars = data.wordBank.filter(w => w.word.length < 2);
        console.log(\`单字数量: \${singleChars.length}\`);
        if (singleChars.length > 0) {
          console.log('单字列表:', singleChars.map(w => w.word).join(', '));
        }
      "
  Expected Result: 单字数量 = 0
  Evidence: Terminal output

**Scenario 2: 词组长度验证（2-4字）**
  Tool: Bash (bun)
  Preconditions: 词库更新完成
  Steps:
    1. bun -e "
        const data = require('./public/data/一年级上册.json');
        const invalidLength = data.wordBank.filter(w => w.word.length < 2 || w.word.length > 4);
        console.log(\`不符合长度要求的词组: \${invalidLength.length}\`);
      "
  Expected Result: 无不符合长度的词组
  Evidence: Terminal output

**Scenario 3: 动态加载功能**
  Tool: Playwright (playwright skill)
  Preconditions: Dev server运行
  Steps:
    1. Navigate to: http://localhost:5175
    2. Wait for: Setup page loaded
    3. Switch to: 二年级上册
    4. Assert: 单元列表更新
    5. Select: 单元1
    6. Click: 开始练习
    7. Assert: 练习页面加载
  Expected Result: 动态加载正常工作
  Evidence: Screenshots

**Scenario 4: Supabase数据完整性**
  Tool: Bash (curl)
  Preconditions: 代码更新完成
  Steps:
    1. 获取现有mastery_records（通过Supabase查询或备份）
    2. 比对新旧word ID格式
    3. Assert: ID映射关系保持一致
  Expected Result: 数据未丢失
  Evidence: 查询结果

**Evidence Requirements:**
- [ ] Terminal outputs for data validation
- [ ] Screenshots for UI scenarios
- [ ] Supabase data verification report

---

## Execution Strategy

### Sequential Execution

```
Task 1: 一年级上册单字扩展（最优先）
├── 1.1 扫描现有单字（所有unit）
├── 1.2 组成2-4字词组（基于教材语境）
├── 1.3 验证无单字
└── 1.4 生成拼音（使用pinyin-pro）

Task 2: 其他年级词库扩充
├── 2.1 一年级下册扫描和扩充
├── 2.2 二年级上册扫描和扩充
├── 2.3 二年级下册扫描和扩充
├── 2.4 三年级下册扫描和扩充
└── 2.5 验证所有词库

Task 3: 数据结构调整
├── 3.1 定义学期列表
├── 3.2 创建loadWordBank函数
├── 3.3 处理Supabase数据迁移（如需要）
└── 3.4 删除DATA_BLUEPRINT

Task 4: 学期切换UI实现
├── 4.1 创建SemesterSelector组件
├── 4.2 集成到Setup页
├── 4.3 测试切换功能
└── 4.4 更新进度统计

Task 5: 验证和测试
├── 5.1 端到端测试
├── 5.2 Supabase数据验证
├── 5.3 性能测试
└── 5.4 版本号更新

Critical Path: Task 1 → Task 2 → Task 3 → Task 4 → Task 5
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2, 3, 4, 5 | None |
| 2 | 1 | 3, 4, 5 | Task 3（数据结构调整） |
| 3 | 1, 2 | 4, 5 | None |
| 4 | 3 | 5 | None |
| 5 | 3, 4 | None | None |

---

## TODOs

- [ ] 1. 一年级上册单字扩展为词组

  **What to do**:
  - 扫描一年级上册所有unit
  - 列出每个unit的单字
  - 将单字组成2-4字词组（基于一年级教材语境）
  - 使用pinyin-pro生成拼音
  - 更新JSON文件

  **单字扩展规则**（基于DEVELOPMENT_RULES.md和AI_INSTRUCTIONS.md）:
  - 单字必须组成2-4字词组
  - 词组要符合教材语境
  - 常用词：如"天"→"天空"，"地"→"土地"
  - 使用charToWordMap（如果存在）

  **Must NOT do**:
  - 保留单字（必须扩展）
  - 添加4年级及以上内容

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: 数据处理，需要教材知识
  - **Skills**: []
    - No special skills needed, but requires understanding of primary school vocabulary

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: Tasks 2, 3, 4, 5
  - **Blocked By**: None

  **References** (CRITICAL):
  - `DEVELOPMENT_RULES.md` - 生字语境化规则
  - `AI_Data_Generation_Kit/AI_INSTRUCTIONS.md` - 词库生成规范
  - `public/data/一年级上册.json` - 现有数据
  - `src/App.jsx:37` - charToWordMap（可参考）

  **Acceptance Criteria**:
  - 无单字（所有词≥2字）
  - 词数保持或增加（不减少）
  - 拼音已生成
  - 单元对应正确

- [ ] 2. 一年级下册词库扩充

  **What to do**:
  - 扫描一年级下册现有数据
  - 单字扩展为词组
  - 补充词语表内容
  - 验证数据完整性

  **Must NOT do**:
  - 添加非一年级内容

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 3, 4)
  - **Blocks**: None
  - **Blocked By**: Task 1

  **References**:
  - `public/data/一年级下册.json`
  - 词库规范

- [ ] 3. 二年级上册词库扩充

  **What to do**:
  - 扫描现有数据
  - 单字扩展为词组
  - 补充词语表

  **Must NOT do**:
  - 添加非二年级内容

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 2, 4)
  - **Blocks**: None
  - **Blocked By**: Task 1

  **References**:
  - `public/data/二年级上册.json`

- [ ] 4. 二年级下册词库扩充

  **What to do**:
  - 扫描现有数据
  - 单字扩展为词组
  - 补充词语表

  **Must NOT do**:
  - 添加非二年级内容

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 2, 3)
  - **Blocks**: None
  - **Blocked By**: Task 1

  **References**:
  - `public/data/二年级下册.json`

- [ ] 5. 三年级下册词库扩充

  **What to do**:
  - 扫描现有数据
  - 单字扩展为词组
  - 补充词语表
  - **注意**: 必须保护现有Supabase数据

  **Must NOT do**:
  - 修改现有词组的ID（可能导致Supabase数据丢失）
  - 添加非三年级内容

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 2, 3, 4)
  - **Blocks**: None
  - **Blocked By**: Task 1

  **References**:
  - `public/data/三年级下册.json`
  - Supabase表结构（mastery_records）

- [ ] 6. 动态数据加载 + 删除硬编码

  **What to do**:
  - 定义学期列表（1-3年级上下册）
  - 创建loadWordBank(grade, semester)函数
  - 从public/data动态加载JSON
  - 删除DATA_BLUEPRINT硬编码
  - 删除charToWordMap（如果不再需要）
  - 测试加载功能

  **Supabase数据保护策略**:
  - 保持word ID格式一致（如"3up-单元1-山坡-0"）
  - 不改变现有词组的ID映射
  - 新词可以新ID，但旧ID必须保持

  **Must NOT do**:
  - 破坏现有word ID映射
  - 丢失Supabase掌握状态

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
    - Reason: 复杂数据结构调整
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: Task 7
  - **Blocked By**: Tasks 1-5

  **References**:
  - `src/App.jsx:11-35` - DATA_BLUEPRINT
  - `src/App.jsx:533` - processedUnits
  - Supabase表结构

- [ ] 7. 学期切换UI实现

  **What to do**:
  - 创建SemesterSelector下拉菜单
  - 添加selectedSemester状态
  - 替换硬编码"三年级上册"
  - 切换时更新selectedUnits、words
  - 更新进度统计显示

  **Must NOT do**:
  - 破坏现有功能

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: Task 8
  - **Blocked By**: Task 6

  **References**:
  - `src/App.jsx:785-814` - Setup页header
  - `src/App.jsx:812` - 硬编码位置

- [ ] 8. 验证、测试、版本号更新

  **What to do**:
  - 运行所有QA场景
  - 验证Supabase数据完整性
  - 测试学期切换
  - 更新版本号到V3.11.0

  **Must NOT do**:
  - 遗漏问题

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: None
  - **Blocked By**: Tasks 1-7

  **References**:
  - QA scenarios in this plan
  - `src/App.jsx:794` - 版本号位置

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `data: expand grade-1A words from single chars` | public/data/一年级上册.json | npm run dev |
| 2-5 | `data: expand word banks for other grades` | public/data/*.json | npm run dev |
| 6 | `refactor: replace DATA_BLUEPRINT with dynamic loading` | src/App.jsx | npm run dev |
| 7 | `feat: add semester selector dropdown` | src/App.jsx | npm run dev |
| 8 | `chore: bump version to V3.11.0` | src/App.jsx | npm run build |

---

## Success Criteria

### Verification Commands
```bash
# 验证无单字
bun -e "
const grades = ['一年级上册', '一年级下册', '二年级上册', '二年级下册', '三年级上册', '三年级下册'];
grades.forEach(g => {
  const data = require(\`./public/data/\${g}.json\`);
  const singleChars = data.wordBank.filter(w => w.word.length < 2);
  console.log(\`\${g}: \${singleChars.length} single-char words\`);
});
"
```

### Final Checklist
- [ ] 所有年级无单字词组
- [ ] 词库格式正确（wordBank数组）
- [ ] 动态加载工作
- [ ] 学期切换可用
- [ ] Supabase数据未丢失
- [ ] 版本号更新到V3.11.0
- [ ] 所有测试通过
