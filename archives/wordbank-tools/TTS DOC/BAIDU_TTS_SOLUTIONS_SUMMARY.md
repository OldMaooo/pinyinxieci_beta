# 百度TTS 前端集成完整解决方案总结

## 📚 文档清单

| 文档 | 用途 | 阅读时间 |
|------|------|---------|
| **BAIDU_TTS_FRONTEND_SOLUTION.md** | 🔧 详细的技术方案与架构 | 15-20分钟 |
| **BAIDU_TTS_QUICK_FIX.md** | ⚡ 快速上手指南与代码示例 | 5-10分钟 |
| **BAIDU_TTS_TROUBLESHOOTING.md** | 🐛 常见问题排查与解决方案 | 按需阅读 |
| **BAIDU_TTS_FRONTEND_SOLUTION.md** (本文档) | 📋 汇总与快速导航 | 3-5分钟 |

---

## 🎯 一句话解决方案

**问题：** 前端直接调用百度OAuth端点时出现CORS错误

**解决：** 创建后端代理来获取Token，前端调用后端API而不是百度API

```
前端              后端              百度API
  │                │                  │
  ├─→ /api/token ──┤                  │
  │                ├─→ https://aip... ─┤
  │                │                  │
  │    ◄─ token ───┤ ◄─ token ────────┤
```

---

## 🚀 快速开始 (5分钟)

### 选择你的场景

#### 场景1: 我要在本地测试 ⭐ 最快

```bash
# 1. 创建 proxy.js
cat > proxy.js << 'EOF'
const http = require('http');
const https = require('https');
const url = require('url');

http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    if (req.url.startsWith('/api/token')) {
        const params = url.parse(req.url, true).query;
        const baiduUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${params.client_id}&client_secret=${params.client_secret}`;
        
        https.get(baiduUrl, (resp) => {
            res.writeHead(resp.statusCode);
            resp.pipe(res);
        }).on('error', (e) => {
            res.writeHead(500);
            res.end(JSON.stringify({ error: e.message }));
        });
        return;
    }
    
    res.writeHead(404);
    res.end('Not Found');
}).listen(3001);

console.log('✅ Proxy running at http://localhost:3001');
EOF

# 2. 运行代理
node proxy.js

# 3. 在前端调用
# fetch('http://localhost:3001/api/token?client_id=YOUR_KEY&client_secret=YOUR_SECRET')
```

#### 场景2: 我要在Vercel上部署

```javascript
// api/baidu-token.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${process.env.BAIDU_API_KEY}&client_secret=${process.env.BAIDU_SECRET_KEY}`;
  const data = await fetch(url, { method: 'POST' }).then(r => r.json());
  
  res.json(data);
}
```

```bash
# 设置环境变量
vercel env add BAIDU_API_KEY your_key
vercel env add BAIDU_SECRET_KEY your_secret
vercel --prod
```

#### 场景3: 我有自己的Express服务器

```javascript
app.get('/api/baidu-token', async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  
  const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${process.env.BAIDU_API_KEY}&client_secret=${process.env.BAIDU_SECRET_KEY}`;
  const data = await fetch(url, { method: 'POST' }).then(r => r.json());
  
  res.json(data);
});
```

---

## 📊 详细问题与解决方案速查表

### CORS相关问题

| 问题 | 症状 | 快速修复 |
|------|------|---------|
| **Direct API Call** | "Failed to fetch" | 改用后端代理 |
| **Missing CORS Headers** | "No Access-Control-Allow-Origin" | 后端返回CORS头 |
| **OPTIONS 失败** | "405 Method Not Allowed" | 处理OPTIONS请求 |

### Token相关问题

| 问题 | 症状 | 快速修复 |
|------|------|---------|
| **无效的Key/Secret** | "err_code: 280001" | 检查密钥格式和内容 |
| **服务未开通** | "err_code: 110" | 在百度云开通服务 |
| **Token过期** | "err_code: 280007" | 检查缓存过期时间 |
| **速率限制** | "err_code: 6" | 缓存Token，避免重复获取 |

### TTS相关问题

| 问题 | 症状 | 快速修复 |
|------|------|---------|
| **文本过长** | "err_code: 3300" | 将文本分割 ≤1024字节 |
| **返回HTML** | Content-Type: text/html | Token无效，重新获取 |
| **无音频** | 没有声音 | 检查blob大小和播放权限 |
| **自动播放失败** | "NotAllowedError" | 响应用户点击后播放 |

### 部署相关问题

| 问题 | 症状 | 快速修复 |
|------|------|---------|
| **Vercel 502** | /api/token 返回502 | 检查环境变量设置 |
| **仍有CORS错误** | 生产环境出现CORS | 检查前端代码调用的URL |
| **凭证冲突** | Access-Control-Credentials错误 | 移除credentials: 'include' |

---

## 🔑 核心代码模板

### 完整的前端TTS Hook (React)

```javascript
// hooks/useBaiduTTS.js
import { useState, useCallback, useRef } from 'react';

export function useBaiduTTS(proxyUrl = '/api/baidu-token') {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const audioRef = useRef(null);

  const fetchToken = useCallback(async (apiKey, secretKey) => {
    const cached = localStorage.getItem('baidu_token');
    const expiry = localStorage.getItem('baidu_token_expiry');
    
    if (cached && expiry && Date.now() < parseInt(expiry)) {
      return cached;
    }

    const response = await fetch(
      `${proxyUrl}?client_id=${apiKey}&client_secret=${secretKey}`
    );
    const data = await response.json();
    
    if (data.error) throw new Error(data.error_description);
    
    const expiryTime = Date.now() + data.expires_in * 1000;
    localStorage.setItem('baidu_token', data.access_token);
    localStorage.setItem('baidu_token_expiry', expiryTime.toString());
    
    return data.access_token;
  }, [proxyUrl]);

  const play = useCallback(async (text, apiKey, secretKey, options = {}) => {
    if (!text) return;
    
    setIsLoading(true);
    setError('');

    try {
      const token = await fetchToken(apiKey, secretKey);
      
      const response = await fetch('https://tsn.baidu.com/text2audio', {
        method: 'POST',
        body: new URLSearchParams({
          tex: text,
          tok: token,
          ctp: '1',
          lan: 'zh',
          spd: options.speed || '5',
          pit: options.pitch || '5',
          vol: options.volume || '5',
          per: options.voiceId || '4003',
          aue: '3'
        }).toString()
      });

      const contentType = response.headers.get('content-type');
      if (!contentType?.startsWith('audio')) {
        throw new Error('Invalid response from TTS API');
      }

      const audioData = await response.arrayBuffer();
      const blob = new Blob([audioData], { type: 'audio/mpeg' });
      
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      
      audioRef.current.src = URL.createObjectURL(blob);
      await audioRef.current.play();
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [fetchToken]);

  return {
    play,
    isLoading,
    error,
    stop: () => audioRef.current?.pause()
  };
}
```

### 使用示例

```jsx
function App() {
  const baiduTTS = useBaiduTTS();
  
  const handleSpeak = async () => {
    await baiduTTS.play(
      '你好，世界',
      localStorage.getItem('baidu_api_key'),
      localStorage.getItem('baidu_secret_key'),
      { speed: 5, pitch: 5, volume: 5, voiceId: 4003 }
    );
  };

  return (
    <div>
      <button onClick={handleSpeak} disabled={baiduTTS.isLoading}>
        {baiduTTS.isLoading ? '处理中...' : '播放'}
      </button>
      {baiduTTS.error && <p style={{ color: 'red' }}>{baiduTTS.error}</p>}
    </div>
  );
}
```

---

## 🎓 百度TTS API 参数详解

### Token获取请求

```
GET https://aip.baidubce.com/oauth/2.0/token
  ?grant_type=client_credentials
  &client_id=YOUR_API_KEY
  &client_secret=YOUR_SECRET_KEY
```

**响应：**
```json
{
  "access_token": "string",
  "expires_in": 2592000,  // 秒（30天）
  "scope": "audio_tts_post",
  "session_key": "string",
  "session_secret": "string"
}
```

### TTS合成请求

```
POST https://tsn.baidu.com/text2audio
Content-Type: application/x-www-form-urlencoded

参数说明：
- tex: 合成文本（必填，≤1024 GBK字节）
- tok: Access Token（必填）
- cuid: 客户端ID（可选）
- ctp: 客户端类型，web=1（可选）
- lan: 语言，zh=中文（可选）
- spd: 语速 0-15（可选）
- pit: 音调 0-15（可选）
- vol: 音量 0-15（可选）
- per: 发音人（可选）
  - 4003: 度逍遥（臻品）
  - 4106: 度博文（臻品）
  - 4105: 度灵儿（臻品）
- aue: 音频格式，3=MP3（可选）
```

### 发音人对照表

| ID | 名称 | 特点 |
|----|------|------|
| 4003 | 度逍遥 | 男性，自然，推荐 |
| 4106 | 度博文 | 男性，较慢，专业 |
| 4105 | 度灵儿 | 女性，清晰，年轻 |
| 4117 | 度小乔 | 女性，温和，温暖 |
| 4100 | 度小雯 | 女性，标准，清楚 |
| 4119 | 度小鹿 | 女性，可爱，活泼 |

---

## 🔒 安全最佳实践

### ✅ 必须做

1. **永远使用后端代理获取Token**
   ```javascript
   // ✅ 正确
   fetch('/api/baidu-token')
   
   // ❌ 错误
   fetch('https://aip.baidubce.com/oauth/2.0/token')
   ```

2. **在后端使用环境变量存储密钥**
   ```javascript
   const apiKey = process.env.BAIDU_API_KEY;  // ✅
   const apiKey = 'hardcoded_key';  // ❌
   ```

3. **实现Token缓存（有效期30天）**
   ```javascript
   const cachedToken = localStorage.getItem('baidu_token');
   const expiry = localStorage.getItem('baidu_token_expiry');
   if (cachedToken && Date.now() < parseInt(expiry)) {
     return cachedToken;
   }
   ```

4. **设置速率限制和请求超时**
   ```javascript
   const timeout = Promise.race([
     fetch(...),
     new Promise((_, r) => setTimeout(() => r(new Error('Timeout')), 5000))
   ]);
   ```

### ❌ 必须避免

1. **在git中提交真实密钥**
   ```bash
   # .gitignore
   .env
   .env.local
   .env.*.local
   ```

2. **在前端代码中硬编码密钥**
   ```javascript
   // ❌ 不要这样
   const SECRET = 'XUKDWr3RiOVG7ZxvPqQwLm8nYuT2aB5c';
   ```

3. **允许任何来源的请求**
   ```javascript
   // ❌ 不要
   res.setHeader('Access-Control-Allow-Origin', '*');
   
   // ✅ 应该限制
   res.setHeader('Access-Control-Allow-Origin', 'https://yourdomain.com');
   ```

---

## 📈 性能优化建议

### 1. Token缓存机制

```javascript
class TokenCache {
  constructor() {
    this.token = null;
    this.expiryTime = 0;
    this.isFetching = false;
  }

  async getToken(getNewToken) {
    // 有效缓存
    if (this.token && Date.now() < this.expiryTime) {
      return this.token;
    }

    // 正在获取，等待
    if (this.isFetching) {
      return new Promise(resolve => {
        const checkInterval = setInterval(() => {
          if (!this.isFetching) {
            clearInterval(checkInterval);
            resolve(this.token);
          }
        }, 100);
      });
    }

    // 获取新token
    this.isFetching = true;
    try {
      const data = await getNewToken();
      this.token = data.access_token;
      this.expiryTime = Date.now() + (data.expires_in - 600) * 1000;
      return this.token;
    } finally {
      this.isFetching = false;
    }
  }
}
```

### 2. 文本分割处理

```javascript
function splitTextForTTS(text, maxGBKBytes = 1000) {
  const chunks = [];
  let chunk = '';
  
  for (let char of text) {
    // 粗略估计GBK字节数（中文≈3字节，英文≈1字节）
    const charBytes = /[\u4e00-\u9fa5]/.test(char) ? 3 : 1;
    
    if ((chunk.length * 2 + charBytes) > maxGBKBytes) {
      chunks.push(chunk);
      chunk = char;
    } else {
      chunk += char;
    }
  }
  
  if (chunk) chunks.push(chunk);
  return chunks;
}

// 顺序播放多个块
async function playLongText(text, token, options) {
  const chunks = splitTextForTTS(text);
  
  for (let chunk of chunks) {
    await playTTS(chunk, token, options);
  }
}
```

### 3. 错误重试机制

```javascript
async function fetchWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // 指数退避
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }
}

// 使用
const token = await fetchWithRetry(() => getAccessToken());
```

---

## 🚀 部署检查清单

- [ ] API Key和Secret Key已在环境变量中设置
- [ ] 后端代理代码已部署
- [ ] CORS头设置正确
- [ ] Token缓存逻辑已实现
- [ ] 错误处理已完善
- [ ] 超时设置已配置（<30秒）
- [ ] 日志记录已启用
- [ ] 本地测试通过
- [ ] 生产环境部署完成
- [ ] 跨域测试通过

---

## 🔗 相关资源

| 资源 | 链接 |
|------|------|
| 百度TTS文档 | https://cloud.baidu.com/doc/SPEECH/s/mlbxh7xie |
| 百度OAuth 2.0 | https://cloud.baidu.com/doc/Reference/s/9jwvz2egb |
| 百度云控制台 | https://console.bce.baidu.com |
| CORS详解 | https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS |
| 自动播放策略 | https://developer.chrome.com/articles/autoplay/ |
| Vercel部署 | https://vercel.com/docs/functions/serverless-functions |

---

## 📞 获取帮助

如果遇到问题：

1. **查看对应的故障排查文档**
   - CORS问题 → BAIDU_TTS_TROUBLESHOOTING.md
   - Token问题 → BAIDU_TTS_FRONTEND_SOLUTION.md
   - 快速修复 → BAIDU_TTS_QUICK_FIX.md

2. **检查百度API错误代码**
   ```
   110: 服务未开通
   280001: 参数错误（API Key/Secret错误）
   280003: Token无效
   280007: Token过期
   3300: 文本过长
   6: 超过次数限制
   ```

3. **常见检查项**
   - 网络连接是否正常
   - API Key/Secret Key是否正确（无多余空格）
   - 是否在百度云开通了服务
   - Token是否过期
   - 文本长度是否超过限制

---

**最后更新：2026年1月13日**

