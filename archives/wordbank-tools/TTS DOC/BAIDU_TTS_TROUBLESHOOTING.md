# 百度TTS集成 - 常见问题排查指南

## 📋 目录

1. [CORS和跨域问题](#cors和跨域问题)
2. [Token获取失败](#token获取失败)
3. [TTS合成失败](#tts合成失败)
4. [音频播放问题](#音频播放问题)
5. [性能和缓存问题](#性能和缓存问题)
6. [生产环境部署问题](#生产环境部署问题)

---

## CORS和跨域问题

### 问题1: "Failed to fetch" 或 "No 'Access-Control-Allow-Origin' header"

#### 症状
```javascript
// 前端代码
fetch('https://aip.baidubce.com/oauth/2.0/token?...')
  .catch(e => console.error(e))
  // 错误: TypeError: Failed to fetch
  // 或: Access to XMLHttpRequest has been blocked by CORS policy
```

#### 根本原因
- 百度OAuth Token端点不允许浏览器跨域访问
- 浏览器的CORS安全策略阻止了请求
- 这是服务器端的限制，前端无法绕过

#### 解决方案 ✅

**方案A：使用后端代理（推荐）**

```javascript
// ❌ 错误的做法
fetch('https://aip.baidubce.com/oauth/2.0/token?...')

// ✅ 正确的做法
fetch('/api/baidu-token')  // 调用自己的后端API
```

后端代码：
```javascript
// api/baidu-token.js (Next.js/Vercel)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // 后端可以跨域调用百度API
  const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${process.env.BAIDU_API_KEY}&client_secret=${process.env.BAIDU_SECRET_KEY}`;
  const data = await fetch(tokenUrl, { method: 'POST' }).then(r => r.json());
  
  res.json(data);
}
```

**方案B：使用本地代理开发**

```bash
# 启动本地Node.js代理
node proxy-server.js
# 然后前端调用: http://localhost:3001/api/token?...
```

---

### 问题2: CORS预检请求失败

#### 症状
```
OPTIONS /api/token 405 Method Not Allowed
```

#### 原因
代理服务器没有处理OPTIONS预检请求

#### 解决方案 ✅

```javascript
const server = http.createServer((req, res) => {
    // 添加CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // ✅ 关键：处理OPTIONS请求
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // 处理实际请求...
});
```

---

### 问题3: "No 'Access-Control-Allow-Credentials'"错误

#### 症状
```
Access to XMLHttpRequest has been blocked by CORS policy: 
The value of the 'Access-Control-Allow-Credentials' header 
in the response is '' which must be either 'true' or 'false'
```

#### 原因
使用了`credentials: 'include'`但服务器没有设置正确的CORS头

#### 解决方案 ✅

```javascript
// 前端：移除credentials或设置为'omit'
fetch(url, {
  credentials: 'omit'  // ✅ 不发送凭证
});

// 后端：如果不需要凭证，不要设置Access-Control-Allow-Credentials
// ❌ res.setHeader('Access-Control-Allow-Credentials', 'true');
// ✅ 简单设置：
res.setHeader('Access-Control-Allow-Origin', '*');
```

---

## Token获取失败

### 问题1: "err_code: 280001" (参数错误)

#### 症状
```json
{
  "error": "invalid_client",
  "error_description": "The client_id or client_secret is invalid"
}
```

#### 原因
- API Key格式错误
- Secret Key格式错误
- 环境变量没有设置
- 复制时包含了额外的空格或特殊字符

#### 解决方案 ✅

```bash
# 1. 检查环境变量
echo "API Key: |${BAIDU_API_KEY}|"   # 检查是否有多余空格
echo "Secret: |${BAIDU_SECRET_KEY}|"

# 2. 验证格式
# - API Key: 应该是26-40个字母数字
# - Secret Key: 应该是32-50个字母数字

# 3. 重新检查百度云控制台
# 访问: https://console.bce.baidu.com
# 找到应用 → 应用详情 → 复制API Key和Secret Key
```

```javascript
// 代码中验证
const apiKey = process.env.BAIDU_API_KEY?.trim();
const secretKey = process.env.BAIDU_SECRET_KEY?.trim();

if (!apiKey || apiKey.length < 20) {
    throw new Error('Invalid BAIDU_API_KEY');
}
if (!secretKey || secretKey.length < 30) {
    throw new Error('Invalid BAIDU_SECRET_KEY');
}
```

---

### 问题2: "err_code: 110" (服务未开通)

#### 症状
```json
{
  "error_code": 110,
  "error_msg": "service not open"
}
```

#### 原因
在百度云控制台没有开通"文字转语音"服务

#### 解决方案 ✅

```
1. 访问: https://console.bce.baidu.com
2. 选择左侧菜单 → 应用管理 → 你的应用
3. 点击 "应用详情"
4. 向下滑动找到 "语音技术"
5. 点击 "文字转语音" 旁的 "开通"
6. 同意服务条款并确认
7. 等待5-10分钟生效
8. 重新测试
```

---

### 问题3: Token过期

#### 症状
```
TTS合成返回err_code: 280007 (token过期)
```

#### 原因
- Token有效期为30天
- 缓存的Token已过期
- 没有正确检查过期时间

#### 解决方案 ✅

```javascript
// 正确的Token缓存机制
async function getAccessToken() {
  // 1. 检查缓存
  const cachedToken = localStorage.getItem('baidu_access_token');
  const cachedExpiry = localStorage.getItem('baidu_token_expiry');
  
  // 2. 检查过期时间
  if (cachedToken && cachedExpiry) {
    const expiryTime = parseInt(cachedExpiry);
    const now = Date.now();
    
    if (now < expiryTime) {
      return cachedToken;  // ✅ 缓存仍然有效
    }
  }
  
  // 3. 获取新Token
  const response = await fetch('/api/baidu-token');
  const data = await response.json();
  
  // 4. 缓存新Token和过期时间
  const expiryTime = Date.now() + data.expires_in * 1000;
  localStorage.setItem('baidu_access_token', data.access_token);
  localStorage.setItem('baidu_token_expiry', expiryTime.toString());
  
  // 5. 考虑提前刷新（在过期前1小时）
  // const refreshTime = expiryTime - 3600 * 1000;
  
  return data.access_token;
}
```

---

### 问题4: "Failed to connect to baidu server"

#### 症状
```
Network error / Cannot reach Baidu API
```

#### 原因
- 网络连接问题
- DNS解析失败
- 百度API服务临时不可用
- 防火墙阻止

#### 解决方案 ✅

```bash
# 1. 检查网络连接
ping aip.baidubce.com

# 2. 检查DNS
nslookup aip.baidubce.com

# 3. 测试HTTPS连接
curl -I https://aip.baidubce.com/oauth/2.0/token

# 4. 检查代理设置（如果在公司网络）
# 确保没有代理拦截
```

```javascript
// 前端：添加重试逻辑
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetch(url, options);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

---

## TTS合成失败

### 问题1: "err_code: 3300" (文本过长)

#### 症状
```json
{
  "err_no": 3300,
  "err_msg": "text too long"
}
```

#### 原因
- 输入文本超过1024个GBK字节
- 约等于500个汉字

#### 解决方案 ✅

```javascript
// 验证和分割文本
function splitText(text, maxBytes = 1024) {
  const encoder = new TextEncoder();
  
  // 计算GBK字节数（近似值）
  const gbkBytes = text.length * 3; // 中文通常3字节
  
  if (gbkBytes <= maxBytes) {
    return [text];
  }
  
  // 分割文本
  const chunks = [];
  let currentChunk = '';
  
  for (let char of text) {
    const charBytes = new TextEncoder().encode(char).length * 1.5;
    
    if ((new TextEncoder().encode(currentChunk).length * 1.5 + charBytes) > maxBytes) {
      chunks.push(currentChunk);
      currentChunk = char;
    } else {
      currentChunk += char;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

// 使用
const textChunks = splitText(longText);
for (let chunk of textChunks) {
  await playTTS(chunk);
}
```

---

### 问题2: "Content-Type: text/html" 而不是 "audio/mpeg"

#### 症状
```
TTS API返回HTML而不是音频
通常是错误页面（504 Gateway Timeout 等）
```

#### 原因
- Token无效或过期
- API Key/Secret Key错误
- 百度服务临时故障
- 参数格式错误

#### 解决方案 ✅

```javascript
// ✅ 检查Response Content-Type
async function playTTS(text, token) {
  const response = await fetch('https://tsn.baidu.com/text2audio', {
    method: 'POST',
    body: new URLSearchParams({
      tex: text,
      tok: token,
      aue: '3'
    }).toString()
  });
  
  const contentType = response.headers.get('content-type');
  
  // 检查是否真的是音频
  if (!contentType?.startsWith('audio')) {
    // 这是错误响应，读取错误信息
    try {
      const error = await response.json();
      throw new Error(`TTS Error: ${error.err_msg} (${error.err_no})`);
    } catch (e) {
      throw new Error(`TTS returned non-audio content-type: ${contentType}`);
    }
  }
  
  const audioData = await response.arrayBuffer();
  return audioData;
}
```

---

### 问题3: 某些中文字符无法合成

#### 症状
```
合成失败或返回空音频
特别是多音字、生僻字、繁体字
```

#### 原因
- 百度TTS API不支持某些字符
- 需要转换为简体中文
- 某些标点符号可能有问题

#### 解决方案 ✅

```javascript
// 清理文本
function cleanText(text) {
  // 1. 繁体转简体
  // 使用 opencc-js 库
  // npm install opencc-js
  const openCC = require('opencc');
  text = openCC.transform(text, { from: 'cn', to: 'tw' });
  
  // 2. 移除某些特殊字符
  text = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9，。！？：；""''（）\s]/g, '');
  
  // 3. 规范化空白
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

// 使用
const cleanedText = cleanText(userInput);
await playTTS(cleanedText, token);
```

---

## 音频播放问题

### 问题1: 音频无法播放 (音量为0)

#### 症状
```
Audio element显示，但没有声音
```

#### 原因
- 浏览器自动播放策略（需要用户交互）
- 系统音量关闭
- 浏览器权限问题
- 音频数据损坏

#### 解决方案 ✅

```javascript
async function playAudio(audioBlob) {
  const audio = new Audio();
  
  // ✅ 检查blob是否有效
  if (!audioBlob || audioBlob.size === 0) {
    throw new Error('Invalid audio blob');
  }
  
  audio.src = URL.createObjectURL(audioBlob);
  
  // ✅ 处理播放Promise
  try {
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      await playPromise;
      console.log('Audio started playing');
    }
  } catch (error) {
    // 用户尚未交互，无法自动播放
    if (error.name === 'NotAllowedError') {
      console.log('Autoplay prevented. User interaction required.');
      // 显示"点击播放"按钮给用户
      return;
    }
    throw error;
  }
}

// HTML5 Audio标签方式
function playAudioElement(audioBlob) {
  const audio = document.getElementById('audioPlayer');
  audio.src = URL.createObjectURL(audioBlob);
  
  // 必须响应用户交互（点击按钮等）
  document.getElementById('playBtn').onclick = () => {
    audio.play().catch(e => console.error('Play failed:', e));
  };
}
```

---

### 问题2: "NotAllowedError: play() failed"

#### 症状
```
Uncaught (in promise) DOMException: play() failed because 
the user didn't interact with the document first
```

#### 原因
浏览器自动播放策略要求用户交互才能播放音频

#### 解决方案 ✅

```javascript
// ❌ 错误的做法：页面加载时直接播放
window.onload = () => {
  audio.play();  // 会被浏览器拦截
};

// ✅ 正确的做法：响应用户点击
button.onclick = async () => {
  try {
    await audio.play();
  } catch (error) {
    console.error('Autoplay prevented:', error);
  }
};

// ✅ 或者在useEffect中处理React
useEffect(() => {
  // 不要在这里调用play()
  return () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };
}, []);

// 在事件处理器中调用
const handlePlayClick = async () => {
  try {
    await audioRef.current?.play();
  } catch (error) {
    console.error('Play failed:', error);
  }
};
```

---

### 问题3: 音频播放中途停止

#### 症状
```
音频播放几秒后停止
或者播放多个音频时冲突
```

#### 原因
- 创建的Audio对象被垃圾回收
- 同时播放多个音频冲突
- blob URL没有正确保持

#### 解决方案 ✅

```javascript
// ❌ 错误的做法
function playTTS(text) {
  const audio = new Audio();  // 局部变量，可能被GC
  audio.src = URL.createObjectURL(blob);
  audio.play();
}

// ✅ 正确的做法
class AudioPlayer {
  constructor() {
    this.audio = new Audio();  // 保持引用
  }
  
  async play(blob) {
    // 停止之前的音频
    this.audio.pause();
    this.audio.currentTime = 0;
    
    // 释放旧的blob URL
    if (this.currentUrl) {
      URL.revokeObjectURL(this.currentUrl);
    }
    
    // 播放新音频
    this.currentUrl = URL.createObjectURL(blob);
    this.audio.src = this.currentUrl;
    
    return this.audio.play();
  }
  
  stop() {
    this.audio.pause();
    if (this.currentUrl) {
      URL.revokeObjectURL(this.currentUrl);
    }
  }
}

// React中的做法
function useAudioPlayer() {
  const audioRef = useRef(new Audio());  // 保持引用
  
  const play = useCallback(async (blob) => {
    const audio = audioRef.current;
    audio.pause();
    
    const url = URL.createObjectURL(blob);
    audio.src = url;
    await audio.play();
  }, []);
  
  return { play, audioRef };
}
```

---

## 性能和缓存问题

### 问题1: 频繁获取Token导致速率限制

#### 症状
```
err_code: 6: 超过次数限制
```

#### 原因
- 没有缓存Token
- 每次请求都获取新Token
- 并发请求太多

#### 解决方案 ✅

```javascript
// ✅ 正确的Token缓存
class TokenManager {
  constructor() {
    this.token = null;
    this.expiryTime = 0;
    this.fetchingPromise = null;  // 防止并发请求
  }
  
  async getToken() {
    // 1. 检查有效缓存
    if (this.token && Date.now() < this.expiryTime) {
      return this.token;
    }
    
    // 2. 如果正在获取，等待
    if (this.fetchingPromise) {
      return this.fetchingPromise;
    }
    
    // 3. 获取新Token
    this.fetchingPromise = this._fetchNewToken();
    const token = await this.fetchingPromise;
    this.fetchingPromise = null;
    
    return token;
  }
  
  async _fetchNewToken() {
    const response = await fetch('/api/baidu-token');
    const data = await response.json();
    
    this.token = data.access_token;
    this.expiryTime = Date.now() + (data.expires_in - 600) * 1000;  // 提前10分钟
    
    return this.token;
  }
}

// 全局单例
const tokenManager = new TokenManager();
```

---

### 问题2: 音频blob体积大导致播放延迟

#### 症状
```
获取到音频数据后有明显延迟才开始播放
```

#### 原因
- 没有使用流式播放
- Blob太大
- JavaScript处理时间过长

#### 解决方案 ✅

```javascript
// ✅ 使用MediaSource优化大文件
async function playTTSWithStreaming(text, token) {
  const response = await fetch('https://tsn.baidu.com/text2audio', {
    method: 'POST',
    body: new URLSearchParams({
      tex: text,
      tok: token,
      aue: '3'
    }).toString()
  });
  
  // 直接使用response的blob
  const blob = await response.blob();
  const audio = new Audio(URL.createObjectURL(blob));
  
  // 立即播放（浏览器会缓冲）
  await audio.play();
}

// 或者使用chunks处理大文件
async function processAudioChunks(text, token) {
  const response = await fetch('https://tsn.baidu.com/text2audio', {
    method: 'POST',
    body: ...
  });
  
  const reader = response.body.getReader();
  const chunks = [];
  
  while(true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  
  const blob = new Blob(chunks, { type: 'audio/mpeg' });
  return blob;
}
```

---

## 生产环境部署问题

### 问题1: Vercel部署后 "502 Bad Gateway"

#### 症状
```
/api/baidu-token 返回502
但本地开发工作正常
```

#### 原因
- 环境变量未设置
- Node.js版本不兼容
- 超时设置太短
- 依赖缺失

#### 解决方案 ✅

```bash
# 1. 检查环境变量
vercel env list

# 确保有：
# BAIDU_API_KEY
# BAIDU_SECRET_KEY

# 2. 如果没有，添加
vercel env add BAIDU_API_KEY your_key
vercel env add BAIDU_SECRET_KEY your_secret

# 3. 重新部署
vercel --prod

# 4. 检查日志
vercel logs
```

```javascript
// api/baidu-token.js
export default async function handler(req, res) {
  // ✅ 检查环境变量
  if (!process.env.BAIDU_API_KEY) {
    return res.status(500).json({ 
      error: 'Missing BAIDU_API_KEY' 
    });
  }
  
  // ✅ 设置超时
  const timeout = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout')), 25000)  // Vercel限制30秒
  );
  
  try {
    const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?...`;
    const response = await Promise.race([
      fetch(tokenUrl, { method: 'POST' }),
      timeout
    ]);
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      hint: 'Check env vars and logs'
    });
  }
}
```

---

### 问题2: CORS错误仍然出现在生产环境

#### 症状
```
生产环境仍然有CORS错误
但本地和后端日志显示没问题
```

#### 原因
- 前端代码仍在直接调用百度API
- 构建时没有更新API端点
- 缓存的旧版本

#### 解决方案 ✅

```javascript
// 使用环境变量切换API端点
const API_BASE = process.env.REACT_APP_API_BASE || '';

async function getTTSToken() {
  const url = API_BASE 
    ? `${API_BASE}/api/baidu-token`
    : 'http://localhost:3001/api/token';
    
  return fetch(url);
}
```

```bash
# .env.development
REACT_APP_API_BASE=http://localhost:3000

# .env.production
REACT_APP_API_BASE=https://your-domain.com
```

```bash
# 构建时指定环境
npm run build -- --mode production
```

---

### 问题3: 跨域凭证问题

#### 症状
```
The CORS protocol does not allow specifying a wildcard 
for credentials: Access-Control-Allow-Credentials: true, 
Access-Control-Allow-Origin: *
```

#### 原因
不能同时设置 `Access-Control-Allow-Origin: *` 和 `Access-Control-Allow-Credentials: true`

#### 解决方案 ✅

```javascript
// ❌ 不能这样
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Credentials', 'true');

// ✅ 应该这样
res.setHeader('Access-Control-Allow-Origin', 'https://yourdomain.com');
res.setHeader('Access-Control-Allow-Credentials', 'true');

// 或者完全移除credentials
res.setHeader('Access-Control-Allow-Origin', '*');
// 不设置 Access-Control-Allow-Credentials

// 前端也要配合
fetch(url, {
  method: 'POST',
  credentials: 'omit'  // 不发送凭证
});
```

---

## 📊 快速诊断流程

```
问题出现
    ↓
1. 检查控制台错误信息 → console.log/error
    ↓
2. 确定错误类型：
   - CORS错误？ → 使用后端代理
   - Token错误？ → 检查API Key/Secret
   - TTS错误？ → 检查参数和文本
   - 播放错误？ → 检查blob和权限
    ↓
3. 检查相应的问题章节
    ↓
4. 按照解决方案步骤操作
    ↓
5. 重新测试
```

---

## 🔗 参考资源

- [百度智能云控制台](https://console.bce.baidu.com)
- [百度文字转语音API文档](https://cloud.baidu.com/doc/SPEECH/s/mlbxh7xie)
- [CORS详解 - MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [浏览器自动播放策略](https://developer.chrome.com/articles/autoplay/)

