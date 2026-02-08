# 词汇表生成工作流程

## 概述

本项目用于从人教版语文课本PDF中提取词汇数据，生成结构化的词库JSON文件。

## 核心规则：最终总表 = 词语表 ∪ 写字表

**词语表**：保留全部（都是多字词）
**写字表**：只添加"尚未在词语表中出现"的字 → 转成词

## 目录结构

```
AI_Data_Generation_Kit/
├── AI_INSTRUCTIONS.md          # AI指令文件（给LLM使用的说明）
├── scripts/
│   ├── merge-final-table.cjs   # 词库合并脚本（含一年级特殊模式）
│   └── MERGE_METHOD.md         # 合并方法文档
├── intermediate_data/          # 中间数据（Markdown格式）
│   ├── 一年级上册.md ✅
│   ├── 一年级下册.md ✅
│   ├── 二年级上册.md ✅
│   ├── 二年级下册.md ✅
│   └── 三年级上册.md ⏳
└── existing_data/              # 已生成的词库数据
    ├── 一年级上册.json
    ├── 一年级下册.json (194词)
    ├── 二年级上册.json (372词)
    ├── 二年级下册.json (353词)
    └── ...
```

## 生成流程

### 步骤1：准备输入
1. PDF教材文件 → `AI_Data_Generation_Kit/intermediate_data/`
2. 手动整理为Markdown格式（包含写字表和词语表）

### 步骤2：生成最终词库
```bash
cd kanpinyinxieci_semiauto

# 生成纯净版MD和JSON（一年级自动使用仅写字表模式）
node scripts/merge-final-table.cjs AI_Data_Generation_Kit/intermediate_data/[年级册次].md [年级册次]

# 示例：生成一年级下册（仅写字表）
node scripts/merge-final-table.cjs AI_Data_Generation_Kit/intermediate_data/一年级下册.md 一年级下册
```

### 步骤3：验证
用 `json-wordbank-viewer.html` 拖入生成的JSON文件检查

## 数据处理逻辑

| 写字表中的字 | 是否已在词语表中 | 处理 |
|-------------|-----------------|------|
| "诗" | ❌ | 转成词 "古诗" |
| "冲" | ✅ "冲动"中 | 跳过 |
| "碧" | ✅ "碧绿"中 | 跳过 |

## 已完成

- ✅ 一年级上册.json (229词)
- ✅ 一年级下册.json (194词) - 一年级特殊模式
- ✅ 二年级上册.json (372词)
- ✅ 二年级下册.json (353词)
- ✅ merge-final-table.cjs 合并脚本（含一年级模式支持）
- ✅ MERGE_METHOD.md 方法文档

## 待处理

- ⏳ 三年级上册.md 中间数据
- ⏳ 三年级上册.json (需生成)
- ⏳ 三年级下册.json (需生成)
