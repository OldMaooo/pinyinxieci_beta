# 项目状态记录 - 看音写字应用

**项目名称：** kanpinyinxieci_semiauto
**最后更新：** 2026年1月16日
**维护人：** Sisyphus AI Agent

---

## 当前状态

### ✅ 已解决

1. **移除调试信息**
   - 删除了练习页面的调试日志面板
   - 移除了"强制语音测试"按钮
   - `addLog` 改为空函数

2. **修复自动播放逻辑**
   - 点击"开启听写"后，设置 `activeVoiceIndex = 0`
   - 延迟300ms后自动播放第一个词
   - 定时器正常启动

3. **添加 Keep-Alive 机制**
   - 每14秒播放静音保持语音引擎活跃
   - 解决 Chrome/macOS 15秒超时 bug
   - 听写模式启动时自动开启

4. **调整语音参数**
   - 语速改为 60%（rate = 0.6）
   - 音量默认为最大（15/15）

5. **简化音频播放逻辑**
   - 使用和闪卡模式"你好"相同的直接调用方式
   - 移除复杂的语音选择逻辑
   - 移除重试机制
   - 使用浏览器默认中文语音

6. **浏览器兼容性记录**
   - Dia 浏览器：不支持 speechSynthesis
   - Chrome：需要 Keep-Alive 机制
   - Safari：完全正常

---

## ⚠️ 当前问题

### 1. Chrome 浏览器 TTS 无声

**症状：**
- 闪卡模式：能听到"你好"的测试音，但播放词汇时无声音
- 练习页面：点击"开启听写"能听到"你好"测试音，但自动播放词汇无声音
- 手动点击"测试当前声音"：无声音

**已尝试的方案：**
1. ❌ 语音选择（Tingting/婷婷/Yue）
2. ❌ 重试机制（最多3次）
3. ❌ 复杂的状态检查和延迟
4. ✅ 简化为直接调用（和"你好"相同）
5. ✅ 移除所有语音选择逻辑

**当前方案：**
```javascript
// 完全简化，使用浏览器默认语音
const utterance = new SpeechSynthesisUtterance(text);
utterance.lang = 'zh-CN';
utterance.volume = 1.0;
utterance.rate = 0.6;  // 60%语速
window.speechSynthesis.speak(utterance);
```

**控制台日志：**
- `[AudioBridge] Starting TTS for: <text>`
- `[AudioBridge] Created utterance for: <text>`
- `[AudioBridge] speak() called`
- `❌ 但是没有 onstart 事件触发`

**根因分析：**
- "你好"能播放 → 语音引擎本身工作
- 词汇不能播放 → 可能是：
  1. `playFlashcardAudio` 函数的 Promise 包装导致问题
  2. `utterance.onstart` 事件没有被触发
  3. Chrome 对连续播放或特定语境下的调用有限制

**需要进一步调查：**
- 为什么同一个调用方式，"你好"能工作但词汇不能？
- `unlockAudio` 中的调用和 `playFlashcardAudio` 的调用有什么区别？
- 是否需要完全移除 Promise 包装？

---

## 📁 关键文件状态

### `src/App.jsx`
- **行数：** ~650行
- **听写模式：** 已实现自动播放、Keep-Alive
- **闪卡模式：** 已实现交互解锁、自动播放
- **调试状态：** 已移除所有调试UI

### `shared/flashcardAudioBridge.js`
- **当前版本：** 简化版（无语音选择、无重试）
- **行数：** ~110行
- **核心函数：**
  - `playFlashcardTTS()` - 简化版直接调用
  - `playFlashcardAudio()` - 统一接口
  - `stopFlashcardAudio()` - 停止播放

### `tmp/TTS DOC/TTS_BROWSER_COMPATIBILITY.md`
- **内容：** 浏览器兼容性问题记录
- **已记录：** Dia 浏览器不支持 speechSynthesis

### `tmp/CODING_ERRORS.md`
- **内容：** 编码错误记录和教训
- **已记录：**
  - 变量重复声明
  - 服务意外停止
  - 自动播放逻辑未启动
  - Chrome TTS 无声问题

---

## 🔧 技术栈

### 前端框架
- **React** (v18+)
- **Vite** (v5.4.21)
- **JavaScript** (无 TypeScript)

### 核心依赖
- `react`, `react-dom`
- `pinyin-pro` - 拼音转换
- `@supabase/supabase-js` - 云端数据同步
- `lucide-react` - 图标库
- `tailwindcss` - 样式

### 音频相关
- **Web Speech API** (`speechSynthesis`) - 主流方案
- **Web Audio API** - 音频解锁
- **HanziWriter** - 笔画动画

---

## 🚀 启动命令

```bash
# 开发模式
npm run dev

# 指定端口
npm run dev -- --host 0.0.0.0 --port 5175

# 生产构建
npm run build

# 预览构建
npm run preview
```

**当前运行端口：** http://localhost:5175/

---

## 📝 待办事项

### 高优先级
- [ ] **修复 Chrome TTS 无声问题**
  - 调查为什么"你好"能播放但词汇不能
  - 考虑完全移除 Promise 包装
  - 考虑使用和 `unlockAudio` 完全相同的调用方式

### 中优先级
- [ ] 添加浏览器检测和降级提示
- [ ] 完善 Keep-Alive 机制（可选开关）
- [ ] 添加语音引擎状态显示（调试用）

### 低优先级
- [ ] 优化构建体积（当前 ~600KB）
- [ ] 添加单元测试
- [ ] 完善错误日志系统

---

## 💡 关键发现

### 1. 简化的重要性
**复杂方案不等于好方案**
- 移除语音选择后，反而更稳定
- 移除重试机制后，减少了不确定性
- "你好"的简单调用方式最可靠

### 2. 浏览器差异
**API ≠ 实现方式**
- Safari 和 Chrome 的 `speechSynthesis` 有不同行为
- 相同代码在不同浏览器结果不同
- 需要跨浏览器测试

### 3. 调试信息的价值
**日志是调试的关键**
- 没有日志无法定位问题
- 需要记录每个关键步骤
- 用户反馈 + 日志 = 快速定位问题

### 4. 用户交互的重要性
**浏览器音频策略**
- 必须有用户交互才能播放音频
- `unlockAudio` 非常重要
- 需要在首次点击时解锁

---

## 📊 测试清单

### ✅ 已验证
- [x] Safari 浏览器语音播放正常
- [x] 闪卡模式"你好"测试音正常
- [x] 练习页面"你好"测试音正常
- [x] 自动播放逻辑启动
- [x] Keep-Alive 机制工作
- [x] 60% 语速应用

### ⏳ 待验证
- [ ] Chrome 浏览器词汇播放
- [ ] 练习页面自动播放
- [ ] 听写模式完整流程
- [ ] 闪卡模式完整流程

---

## 🔗 相关文档

- `AGENTS.md` - 开发规范
- `tmp/TTS DOC/` - TTS 相关文档集
- `tmp/CODING_ERRORS.md` - 编码错误记录
- `tmp/TTS DOC/TTS_BROWSER_COMPATIBILITY.md` - 浏览器兼容性

---

## 📞 支持信息

**用户：** 老毛
**角色：** 小学三年级学生家长
**主要场景：**
1. 看音写字（听写模式）
2. 闪卡学习（闪卡模式）
3. 成绩管理（云端同步）

**关键需求：**
- 稳定的语音播放
- 简单易用的界面
- 准确的进度跟踪
- 多设备数据同步

---

**最后更新人：** Sisyphus AI Agent
**文档状态：** 活跃维护中
