# Session Summary: 词库扩充计划

## Session 信息

- **Session ID**: session_20260205_143000_vocab_expansion_supabase_protection
- **日期**: 2026-02-05
- **主题**: 词库扩充 + Supabase数据保护
- **状态**: 规划完成

---

## 关键进展

### 现状分析
- **PDF扫描工具**：多次尝试扫描PDF，但工具持续中断
- **现有词库数据**：
  - 一年级上册：224个词，几乎都是单字（"天", "地", "人", "一", "二"...）
  - 三年级上册：250个词，都是词组（"山坡", "学校", "飘扬"...）
- **词库规范**（DEVELOPMENT_RULES.md + AI_INSTRUCTIONS.md）：
  - 生字必须组成2-4字词组
  - 拒绝单字
  - 语文园地需序列化命名

### 核心需求确认
1. **词库扩充**：
   - 扫描"写字表"+"词语表"（识字表不需要）
   - 合并为完整词库
   - 单字扩展为词组

2. **动态加载**：
   - 替换硬编码DATA_BLUEPRINT
   - 从public/data加载JSON
   - 实现学期切换UI

3. **Supabase数据保护**：
   - 三年级上册已有掌握状态必须保留
   - 不改变现有word ID映射
   - 用户不需重新标记

### 计划制定
创建工作计划：`.sisyphus/plans/vocab-expansion-supabase-protection.md`

**8个任务**：
1. 一年级上册单字扩展（优先）
2. 一年级下册扩充
3. 二年级上册扩充
4. 二年级下册扩充
5. 三年级下册扩充
6. 数据结构调整（动态加载 + 删除硬编码）
7. 学期切换UI实现
8. 验证、测试、版本号更新

**关键策略**：
- 不依赖PDF扫描（工具不稳定）
- 基于现有JSON + 词库规范手动整理
- 保护Supabase数据：保持word ID格式一致

---

## 当前状态

- **位置**: 计划完成，等待执行
- **进度**: 0% 实施
- **下一步**: 执行任务1 - 一年级上册单字扩展为词组
- **问题**: PDF扫描工具不稳定

---

## 技术要点

### 词库数据结构
```json
{
  "version": "1.0",
  "buildDate": "2025-11-16T19:21:28.808977.000Z",
  "gradeSemester": "一年级上册",
  "count": 224,
  "wordBank": [
    {
      "word": "天空",
      "pinyin": "tiān kōng",
      "grade": "一年级",
      "semester": "上册",
      "unit": 1
    }
  ]
}
```

### Supabase表结构
- `mastery_records` 表包含掌握状态
- word ID格式：`{grade}{semester}-{unit}-{word}-{index}`
- 例如：`3up-单元1-山坡-0`
- 切换到动态加载时，必须保持ID格式一致

### 数据保护策略
- 旧ID保持：不修改现有词组的ID
- 新ID生成：遵循相同格式
- 避免数据丢失：word → mastery_records 关系保持

---

## 待办事项

- [x] 计划制定（完成）
- [ ] 任务1：一年级上册单字扩展
- [ ] 任务2-5：其他年级扩充
- [ ] 任务6：数据结构调整
- [ ] 任务7：学期切换UI
- [ ] 任务8：验证测试
- [ ] 版本号更新到 V3.11.0

---

## 已解决问题

- ✅ PDF扫描工具不稳定问题 → 改用手动整理策略
- ✅ 词库扩充策略制定 → 明确8个任务流程
- ✅ Supabase数据保护机制规划 → ID格式一致性方案

---

## 备注

**单字扩展示例**（基于一年级教材语境）:
- "天" → "天空"
- "地" → "土地"
- "人" → "人民"
- "你" → "你们"
- "我" → "我们"

**启动命令**:
```bash
cd /Users/mao/Documents/Coding/Development/Projects/Web/kanpinyinxieci_semiauto
npm run dev
```

**执行计划**: 按照8个任务顺序执行
**参考文档**:
- `.sisyphus/plans/vocab-expansion-supabase-protection.md` - 主计划
- `DEVELOPMENT_RULES.md` - 词库规范
- `AI_Data_Generation_Kit/AI_INSTRUCTIONS.md` - 生成规范
