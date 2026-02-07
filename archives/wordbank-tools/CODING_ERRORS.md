# 编码错误记录

## 错误1: 变量/函数重复声明

**日期：** 2026年1月16日
**严重程度：** 中等
**错误类型：** 语法错误 - 重复声明

### 错误描述

在同一个作用域内声明了同名的函数 `handleInteraction`，导致 Vite/React Babel 编译报错：

```
[plugin:vite:react-babel] /Users/mao/Documents/Coding/Development/Projects/Web/kanpinyinxieci_semiauto/src/App.jsx: Identifier 'handleInteraction' has already been declared. (203:8)
```

### 根本原因

1. 编辑代码时，先在第189行声明了 `handleInteraction`
2. 然后在第203行又添加了一个 `handleInteraction` 声明
3. 修改第二个声明时，没有完全删除第一个声明
4. 导致代码中存在两个同名函数声明

### 如何避免

1. **删除代码前，先搜索所有引用**
   ```bash
   grep -n "handleInteraction" src/App.jsx
   ```
   确认所有声明位置

2. **使用编辑器的"查找所有引用"功能**
   - 在 VSCode 中：Cmd+Shift+F
   - 搜索函数名，查看所有出现位置

3. **删除旧声明时，一次性完整删除**
   - 不要分多次编辑同一行
   - 确保删除后没有残留代码

4. **每次编辑后立即构建检查**
   ```bash
   npm run build
   ```
   在继续其他工作前，确保没有编译错误

5. **使用 LSP 检查**
   - 利用编辑器的实时语法检查
   - 关注红色波浪线错误提示

### 正确的编辑流程

```javascript
// 错误方式（分多次编辑，容易遗漏）
const handleInteraction = () => { ... }; // 第189行
const handleInteraction = () => { ... }; // 第203行 - 重复！

// 正确方式
// 1. 先搜索确认所有声明位置
// 2. 一次性删除旧声明
// 3. 添加新声明
// 4. 立即构建检查
```

### 经验教训

- **每次删除/重命名变量/函数时，必须全局搜索确认**
- **不要在同一作用域内声明多个同名实体**
- **编辑代码要保持原子性，一次完成一个完整的修改**
- **编辑后立即验证，不要假设"应该没问题"**

---

## 错误2: 服务意外停止

**日期：** 2026年1月16日
**严重程度：** 低
**错误类型：** 操作流程问题

### 错误描述

开发服务器 (`npm run dev`) 被意外中断，导致无法访问 http://localhost:5175/

显示 "Tool execution aborted"

### 根本原因

命令被中断（可能是用户按 Ctrl+C 或终端关闭），但我在尝试启动服务前没有先检查端口是否被占用。

### 如何避免

1. **启动服务前，先清理端口**
   ```bash
   lsof -ti:5175 | xargs kill -9 2>/dev/null
   ```

2. **使用后台运行方式**
   ```bash
   # 使用 tmux 或 screen
   tmux new -s dev -d 'npm run dev'
   ```

3. **检查服务是否正在运行**
   ```bash
   lsof -ti:5175
   # 如果有输出，说明服务在运行
   ```

4. **使用日志记录**
   ```bash
   npm run dev > /tmp/dev.log 2>&1 &
   ```
   便于排查问题

---

## 通用规则

### 代码编辑规则

1. **搜索优先** - 删除/重命名前先全局搜索
2. **原子操作** - 一次完成一个完整的修改
3. **立即验证** - 编辑后立即构建/测试
4. **使用工具** - 利用编辑器的 LSP 和查找功能

### 服务管理规则

1. **清理端口** - 启动前先清理
2. **后台运行** - 使用 tmux/screen 保持服务
3. **日志记录** - 记录输出便于调试
4. **状态检查** - 定期检查服务是否运行

---

**最后更新：** 2026年1月16日
**维护人：** Sisyphus AI Agent

---

## 错误3: 自动播放逻辑未启动

**日期：** 2026年1月16日
**严重程度：** 高（影响核心功能）
**错误类型：** 逻辑错误 - 条件判断错误

### 错误描述

点击"开启听写"按钮后，能听到"你好"的测试语音（说明音频解锁成功），但是没有自动播放词组。

### 根本原因

**定时器启动条件错误：**

```javascript
useEffect(() => {
  if (!isVoiceActive || isPaused || activeVoiceIndex < 0) {
    // 如果 activeVoiceIndex === -1，直接返回，不启动定时器
    return;
  }

  // 设置定时器，每隔 voiceInterval 秒播放下一个词
  timerRef.current = setInterval(() => {
    if (progressRef.current >= 100) {
      speak(activeVoiceIndex + 1);
    }
  }, 100);
}, [isVoiceActive, isPaused, activeVoiceIndex, voiceInterval, speak]);
```

**问题流程：**
1. 用户点击"开启听写"按钮
2. 执行：`setActiveVoiceIndex(-1)` // 设置为-1表示等待开始
3. useEffect 检查：`activeVoiceIndex < 0` → true
4. 条件满足，直接 return，定时器不启动
5. 因此永远不会自动播放

### 如何避免

1. **理解业务逻辑的初始状态**
   - `-1` 表示"等待用户点击第一个词"
   - `0` 表示"从第一个词开始"
   - 如果需要自动播放，应该设为 `0`

2. **检查 useEffect 的依赖和条件**
   - 仔细阅读条件判断逻辑
   - 确认每个分支的行为是否符合预期
   - 特别注意 `< 0`、`<= 0` 等边界条件

3. **添加手动触发逻辑**
   ```javascript
   // 方案1：设置正确的初始索引
   onClick={() => {
     unlockAudio();
     setIsVoiceActive(true);
     setActiveVoiceIndex(0); // 设置为0而不是-1
   }}

   // 方案2：手动触发第一次播放
   onClick={() => {
     unlockAudio();
     setIsVoiceActive(true);
     setActiveVoiceIndex(-1);
     setTimeout(() => speak(0), 300); // 延迟后播放第一个词
   }}
   ```

4. **完整测试用户流程**
   - 点击按钮 → 观察是否自动开始
   - 检查定时器是否启动
   - 验证播放逻辑是否符合预期

### 修复方案

采用"方案2" - 手动触发第一次播放，保持 `activeVoiceIndex = -1` 的语义清晰：

```javascript
onClick={() => {
  unlockAudio();
  setIsVoiceActive(true);
  setIsFlashCardMode(false);
  setActiveVoiceIndex(0);
  setTimeout(() => speak(0), 300);
}}
```

### 经验教训

- **特殊值（如-1）的含义要明确**：文档注释或代码注释说明
- **条件判断要考虑所有分支**：特别是"初始状态"的处理
- **用户交互后应有明确反馈**：点击按钮后应该立即看到/听到结果
- **不要假设"应该没问题"**：必须完整测试用户流程

---

## 错误4: Chrome浏览器TTS无声

**日期：** 2026年1月16日
**严重程度：** 高（影响用户体验）
**错误类型：** 浏览器兼容性 - Chrome TTS不工作

### 错误描述

- Safari浏览器：TTS正常工作
- Chrome浏览器：TTS不播放声音，但代码执行正常
- 闪卡模式：能听到"你好"的测试音，但播放词汇时无声

### 根本原因

**Chrome和Safari的speechSynthesis实现有差异：**

1. **语音选择差异**：Chrome的语音列表与Safari不同，相同的语音名称可能在Chrome中不存在
2. **延迟机制**：Chrome需要更长的延迟才能真正播放
3. **事件触发时机**：Chrome的onstart/onend事件触发时机不同
4. **重试机制**：Chrome需要多次重试才能成功播放

### 解决方案

**1. 改进语音选择优先级**
```javascript
// 优先使用"婷婷"音色（兼容中英文命名）
vlist.find(v => v.lang.includes('zh-CN') && v.name.includes('Tingting')) ||
vlist.find(v => v.lang.includes('zh-CN') && v.name.includes('婷婷')) ||
vlist.find(v => v.lang.includes('zh-CN') && (v.name.includes('Yue') || v.name.includes('月')))
```

**2. 调整语速参数**
```javascript
// 改为60%语速（原来是90%）
utterance.rate = 0.6;
```

**3. 添加重试机制**
```javascript
const speakWithRetry = (attempt = 1) => {
  window.speechSynthesis.speak(utterance);

  setTimeout(() => {
    if (!window.speechSynthesis.speaking && attempt < 3) {
      window.speechSynthesis.cancel();
      setTimeout(() => speakWithRetry(attempt + 1), 200);
    }
  }, 500);
};
```

**4. 增加调试日志**
```javascript
console.log('[AudioBridge] Engine state:', {
  speaking: window.speechSynthesis.speaking,
  paused: window.speechSynthesis.paused,
  pending: window.speechSynthesis.pending
});
```

### 如何避免

1. **跨浏览器测试**
   - 开发时在Chrome和Safari都测试
   - 不要假设"在一个浏览器能用=在所有浏览器都能用"

2. **查阅MDN兼容性表**
   - [speechSynthesis - MDN](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)
   - 了解不同浏览器的差异

3. **使用渐进增强**
   - 先检测浏览器能力
   - 根据浏览器类型选择不同策略
   - 提供降级方案

4. **添加详细的错误日志**
   - 记录每个关键步骤的状态
   - 记录引擎的speaking/paused状态
   - 记录使用的语音名称

### 经验教训

- **浏览器API不是统一的**：即使API名称相同，内部实现可能完全不同
- **Safari能工作不代表Chrome也能工作**：需要分别测试
- **重试机制很重要**：特别是对于不稳定的API
- **详细日志是调试关键**：没有日志无法定位问题
