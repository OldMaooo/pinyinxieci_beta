# FlashCard Audio Integration Summary

## 问题
1. 闪卡无法播放声音，而练习页的声音播放功能已经正常工作
2. 切到闪卡模式后，练习页的听写功能仍在播放，会导致两个声音同时出现
3. 闪卡使用的是Mac默认语音，不是练习页的百度TTS语音

## 解决方案

### 第一阶段：创建统一音频播放系统
1. **创建共享音频播放器** (`shared/audio-player.js`)
   - 统一音频播放接口，支持Web Audio API和HTMLAudio fallback
   - 自动处理AudioContext暂停状态恢复
   - 支持音频URL播放和缓冲缓存

2. **创建闪卡音频桥接** (`shared/flashcardAudioBridge.js`)
   - 统一闪卡音频接口，支持TTS和音频URL播放
   - 优先使用全局Baidu TTS实例
   - 优雅降级到Web Speech API
   - 支持未来音频源切换

### 第二阶段：修复闪卡语音问题
3. **集成到闪卡组件**
   - 在`FlashCardView`中替换直接的`window.speechSynthesis`调用
   - 使用统一的音频桥接，确保使用百度TTS而不是Mac默认语音
   - 保持界面完全不变，只修改音频播放逻辑

4. **防止双重音频播放**
   - 在进入闪卡模式时调用`stopVoice()`停止练习页音频
   - 确保只有一个音频源在播放

## 修改的文件
- ✅ `shared/audio-player.js` (新增) - 跨页面音频播放器
- ✅ `shared/flashcardAudioBridge.js` (新增) - 闪卡音频桥接
- ✅ `src/App.jsx` - 修改FlashCardView使用桥接，添加进入闪卡模式时的音频停止
- ✅ `FLASHCARD_AUDIO_FIX.md` - 完整实施总结
- ✅ `test_flashcard_audio.html` - 简单测试页面

## 测试结果
1. ✅ 构建成功，无语法错误
2. ✅ 音频播放器已包含在构建产物中
3. ✅ 闪卡现在使用百度TTS而不是Mac默认语音
4. ✅ 进入闪卡模式时自动停止练习页音频
5. ✅ 只有一个音频源在播放，避免双重声音

## 优势
- 保持现有界面不变
- 统一音频播放逻辑
- 闪卡和练习页使用相同的高质量百度TTS语音
- 提高代码可维护性
- 支持未来音频源扩展
- 防止音频冲突，提升用户体验