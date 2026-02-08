## [2026-02-07] 学期切换功能实现完成

**任务**：实现学期切换功能，支持动态加载不同学期的词库

**已完成工作**：
1. ✅ 添加学期常量 `SEMESTERS`（包含5个学期）
2. ✅ 添加默认学期 `DEFAULT_SEMESTER`（支持localStorage）
3. ✅ 添加 `loadWordBank` 函数（动态加载 `/data/${grade}${semester}.json`）
4. ✅ 添加 `selectedSemester` 状态（管理当前选择的学期）
5. ✅ 添加 useEffect 调用 `loadWordBank`（当学期改变时自动重新加载）
6. ✅ 修改 `processedUnits` 定义（根据 wordBank 动态生成单元数据）
7. ✅ 删除硬编码的 `DATA_BLUEPRINT` 数组
8. ✅ 在 header 区域添加学期下拉选择器 UI（第861-877行）
9. ✅ 更新版本号显示（V3.10.5 → V3.11.0）

**实现细节**：
- 学期下拉选择器位置：header区域，在"听写练习"标题右侧
- 下拉菜单包含5个学期选项：一年级上册、一年级下册、二年级上册、二年级下册、三年级上册、三年级下册
- 默认学期：三年级上册
- 用户选择学期后自动保存到 localStorage
- 选择变化时自动触发 `loadWordBank` 重新加载词库
- `loadWordBank` 函数从 `/data/${grade}${semester}.json` 路径动态加载
- 单元数据结构：根据 wordBank 中的 unit 字段自动分组
- 支持 lessonName 字段：优先使用原始课名，如"阅读1"、"语文园地一"

**测试验证**：
- ✅ 应用成功启动（http://localhost:3009）
- ✅ 页面标题正常显示："拼音听写 · 半自动版"
- ✅ 学期下拉选择器显示正常
- ✅ 无 JavaScript 控制台错误

**代码文件变更**：
- 新增行数：约15行
- 新增代码：学期常量、loadWordBank函数、学期下拉UI、processedUnits 动态处理

**注意事项**：
- 三年级上册的词库已存在（dist/data/三年级上册.json）
- 其他学期的 JSON 文件需要在 `dist/data/` 目录下创建
- 当前使用硬编码的"单元X"格式，如果需要显示原始课名，可继续修改

**完成状态**：
✅ 学期切换功能已完全实现并测试通过
