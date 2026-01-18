# TTS 浏览器兼容性问题记录

## 🔍 问题发现记录

### 2026年1月16日 - Dia 浏览器不支持 speechSynthesis

**问题描述：**
使用 Web Speech API (`speechSynthesis`) 播放中文语音时，代码执行正确（无错误），但没有声音。

**测试环境：**
- 操作系统：macOS
- 浏览器测试结果：
  - ✅ **Chrome** - 正常工作，有声音
  - ✅ **Safari** - 正常工作，有声音
  - ❌ **Dia 浏览器** - 代码执行成功，但无声音

**诊断过程：**

1. **初始问题：** 主应用 dictation mode 的进度条正常工作，但无声音播放
2. **创建最小测试页面：** `demo-audio-test.html` - 只测试 TTS 功能
3. **系统音频测试：** 使用 Web Audio API 的 beep 音正常 → 排除系统音频问题
4. **语音引擎检测：** 语音列表正常加载（22个中文语音，包括 "Tingting"）
5. **代码执行：** `speechSynthesis.speak()` 返回 `undefined`，onstart/onend 事件未触发

**根本原因：**
**Dia 浏览器不支持或未完全实现 Web Speech API 的 `speechSynthesis` 接口。**

**验证方法：**
创建了终极诊断工具 `demo-ultimate-test.html`，包含多种解决方案：
- Keep-Alive 机制（解决 Chrome 15秒超时 bug）
- 完全重置 + 简单短语
- 延迟播放、取消后播放等多种尝试

**结论：**
- 在 Chrome/Safari 上，所有方法都正常工作
- 在 Dia 浏览器上，所有方法都无声音输出

---

## 📋 浏览器兼容性清单

| 浏览器 | speechSynthesis 支持 | 测试日期 | 备注 |
|--------|---------------------|---------|------|
| Chrome | ✅ 完全支持 | 2026-01-16 | 正常播放中文 |
| Safari | ✅ 完全支持 | 2026-01-16 | 正常播放中文 |
| Dia | ❌ 不支持 | 2026-01-16 | 代码执行无错误，但无声音 |
| Firefox | ⚠️ 需要测试 | - | 待验证 |
| Edge | ⚠️ 需要测试 | - | 待验证 |

---

## 🔧 解决方案

### 方案 1：添加浏览器检测和降级策略（推荐）

```javascript
function checkBrowserSupport() {
    if (!('speechSynthesis' in window)) {
        console.error('浏览器不支持 speechSynthesis');
        return false;
    }

    // 检测已知不支持的浏览器
    const ua = navigator.userAgent;
    if (ua.includes('Dia')) {
        console.warn('Dia 浏览器可能不支持 speechSynthesis');
        return false;
    }

    return true;
}

// 使用时
if (checkBrowserSupport()) {
    // 使用 speechSynthesis
} else {
    // 降级到百度 TTS 或其他方案
}
```

### 方案 2：在应用启动时进行音频测试

```javascript
function testAudioSupport() {
    return new Promise((resolve) => {
        if (!('speechSynthesis' in window)) {
            resolve(false);
            return;
        }

        const utterance = new SpeechSynthesisUtterance('test');
        utterance.volume = 0; // 静音测试

        let resolved = false;

        utterance.onstart = () => {
            if (!resolved) {
                resolved = true;
                speechSynthesis.cancel();
                resolve(true);
            }
        };

        utterance.onerror = () => {
            if (!resolved) {
                resolved = true;
                resolve(false);
            }
        };

        // 1秒超时
        setTimeout(() => {
            if (!resolved) {
                resolved = true;
                resolve(false);
            }
        }, 1000);

        speechSynthesis.speak(utterance);
    });
}

// 应用启动时
testAudioSupport().then(supported => {
    if (!supported) {
        // 显示警告，降级到备用方案
        alert('您的浏览器不支持语音功能，将使用备用方案');
    }
});
```

### 方案 3：使用备用 TTS 服务

对于不支持 speechSynthesis 的浏览器，使用：
- 百度 TTS API（已有实现）
- 其他第三方 TTS 服务
- 预录制的音频文件

---

## 📝 相关文件

- `demo-audio-test.html` - 初级测试页面
- `demo-ultimate-test.html` - 终极诊断工具（包含 5 种解决方案）
- `shared/flashcardAudioBridge.js` - 音频播放桥接层

---

## 🎯 经验教训

1. **不要假设所有浏览器都支持 Web Speech API**
   - 即使 API 存在，也可能不完整
   - 需要在运行时测试，而不仅仅是检查 `in` 操作符

2. **创建最小测试用例的重要性**
   - 从复杂应用中隔离问题
   - 快速验证假设

3. **多浏览器测试的必要性**
   - 开发者常用浏览器 ≠ 用户实际使用的浏览器
   - 需要考虑各种主流和边缘浏览器

4. **降级策略的重要性**
   - 总是为不支持的功能提供备选方案
   - 优雅降级比直接报错更友好

---

## 🔗 参考资料

- [Web Speech API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [speechSynthesis - MDN](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)
- [Browser Compatibility Table](https://caniuse.com/speech-synthesis)

---

**最后更新：** 2026年1月16日
**更新人：** Sisyphus AI Agent
**测试人员：** 用户（通过实际测试确认）
