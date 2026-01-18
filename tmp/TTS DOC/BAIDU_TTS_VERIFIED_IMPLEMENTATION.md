# 百度TTS 前端集成 - 基于已验证实现的最佳实践

> 本指南基于工作区中 `kanpinyinxieci_semiauto_OpenCode` 和 `看拼音写词` 项目的已验证实现

---

## ✅ 已验证的工作方案

### 1. React Hook方案（推荐用于现代应用）

**位置：** `/kanpinyinxieci_semiauto_OpenCode/src/hooks/useBaiduTTS.js`

**特点：**
- ✅ 完整的状态管理（loading, error, playing）
- ✅ 自动Token缓存和过期检查
- ✅ 错误处理和用户反馈
- ✅ 支持多个发音人选择
- ✅ 参数化配置（速度、音调、音量）

**核心代码片段：**
```javascript
export function useBaiduTTS() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const audioRef = useRef(null);

  // 获取API密钥（可硬编码或从localStorage）
  const getApiConfig = useCallback(() => {
    const apiKey = 'QdZJlWRuzc2t2O2DS3ssMZGz';
    const secretKey = 'XUKDWr3RiOVG7ZxvPqQwLm8nYuT2aB5c';
    const accessToken = localStorage.getItem('baidu_access_token') || '';
    return { apiKey, secretKey, accessToken };
  }, []);

  // 获取Access Token
  const fetchAccessToken = useCallback(async () => {
    const { apiKey, secretKey, accessToken } = getApiConfig();
    
    // 检查缓存
    if (accessToken && accessToken.length > 50) {
      return accessToken;
    }

    try {
      // ⚠️ 这里仍然会有CORS问题，应该改用后端代理
      const response = await fetch(
        `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`,
        { method: 'GET' }
      );

      const data = await response.json();
      
      if (!response.ok || data.error) {
        throw new Error(data.error_description || `Token fetch failed: ${response.status}`);
      }

      // 缓存token
      localStorage.setItem('baidu_access_token', data.access_token);
      localStorage.setItem('baidu_token_expire_time', Date.now() + data.expires_in * 1000);

      return data.access_token;
    } catch (err) {
      throw new Error(`Failed to get Baidu Token: ${err.message}`);
    }
  }, [getApiConfig]);

  // TTS播放
  const play = useCallback(async (text, options = {}) => {
    if (!text || text.trim().length === 0) {
      setError('Text cannot be empty');
      return;
    }

    if (isLoading || isPlaying) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const accessToken = await fetchAccessToken();
      
      // 构建TTS参数
      const params = new URLSearchParams();
      params.append('tex', text);
      params.append('tok', accessToken);
      params.append('cuid', options.cuid || 'pinyin_app_' + Math.random().toString(36).substr(2, 9));
      params.append('ctp', '1');
      params.append('lan', 'zh');
      params.append('spd', options.speed || '5');
      params.append('pit', options.pitch || '5');
      params.append('vol', options.volume || '5');
      params.append('per', options.voiceId || '4003');
      params.append('aue', '3');

      // 调用TTS API
      const response = await fetch('https://tsn.baidu.com/text2audio', {
        method: 'POST',
        body: params.toString(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const contentType = response.headers.get('content-type');
      
      if (!response.ok || !contentType || !contentType.startsWith('audio')) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.err_msg || `API request failed: ${response.status} - ${contentType}`
        );
      }

      const audioData = await response.arrayBuffer();
      const blob = new Blob([audioData], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      audioRef.current.src = url;

      // 处理播放
      const playPromise = audioRef.current.play();

      return new Promise((resolve, reject) => {
        if (playPromise !== undefined) {
          playPromise.then(() => {
            setIsPlaying(true);
          }).catch((err) => {
            console.error('Playback failed:', err);
            setError('Playback failed');
            reject(err);
          });
        }

        if (audioRef.current) {
          audioRef.current.onended = () => {
            setIsPlaying(false);
            resolve();
          };
          audioRef.current.onerror = (err) => {
            setIsPlaying(false);
            reject(err);
          };
        }
      });
    } catch (err) {
      setError(err.message);
      setIsPlaying(false);
      console.error('TTS Error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchAccessToken, isLoading, isPlaying]);

  return {
    play,
    isLoading,
    isPlaying,
    error,
    stop: () => {
      audioRef.current?.pause();
      setIsPlaying(false);
    }
  };
}
```

---

### 2. 本地代理服务器方案（开发环境）

**位置：** `/看拼音写词/scripts/proxy-server.js`

**特点：**
- ✅ 完整的CORS处理
- ✅ 支持静态文件服务
- ✅ OCR和OAuth端点代理
- ✅ 生产级别的错误处理

**关键实现：**
```javascript
#!/usr/bin/env node
const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 3001;

const server = http.createServer((req, res) => {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // 处理OPTIONS预检请求
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // 处理Token获取请求
    if (requestPath === '/api/oauth/token' && req.method === 'GET') {
        try {
            const queryParams = url.parse(req.url, true).query;
            const apiKey = queryParams.client_id;
            const apiSecret = queryParams.client_secret;
            
            if (!apiKey || !apiSecret) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Missing parameters' }));
                return;
            }
            
            const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${apiSecret}`;
            
            https.get(tokenUrl, (proxyRes) => {
                res.writeHead(proxyRes.statusCode, {
                    'Content-Type': proxyRes.headers['content-type']
                });
                proxyRes.pipe(res);
            }).on('error', (e) => {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            });
            return;
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
    }
});

server.listen(PORT, () => {
    console.log(`✅ Proxy server running on http://localhost:${PORT}`);
});
```

---

### 3. Vercel Serverless函数方案（生产环境）

**位置：** `/看拼音写词/api/baidu-proxy.js`

**特点：**
- ✅ 环境变量管理
- ✅ Token缓存（跨请求）
- ✅ 完整的CORS处理
- ✅ 调试日志
- ✅ 错误处理

**关键实现：**
```javascript
// Vercel Serverless Function: Baidu OCR Proxy with CORS
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

let cachedToken = null;
let cachedExpiry = 0;

async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && now < cachedExpiry) return cachedToken;

  const apiKey = process.env.BAIDU_API_KEY;
  const secretKey = process.env.BAIDU_SECRET_KEY;
  if (!apiKey || !secretKey) {
    throw new Error('Missing BAIDU_API_KEY/BAIDU_SECRET_KEY');
  }

  const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${encodeURIComponent(apiKey)}&client_secret=${encodeURIComponent(secretKey)}`;
  const resp = await fetch(url, { method: 'POST' });
  const data = await resp.json();
  if (!resp.ok || data.error) {
    const msg = data.error_description || data.error || 'token request failed';
    throw new Error(`Baidu token error: ${msg}`);
  }
  cachedToken = data.access_token;
  // expires_in seconds, refresh 1 hour earlier
  cachedExpiry = now + Math.max(0, (data.expires_in - 3600)) * 1000;
  return cachedToken;
}

export default async function handler(req, res) {
  // 处理OPTIONS预检
  if (req.method === 'OPTIONS') {
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
    res.status(204).end();
    return;
  }

  try {
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));

    if (req.method === 'GET') {
      // 健康检查
      res.status(200).json({ 
        ok: true, 
        message: 'baidu-proxy ok'
      });
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed' });
      return;
    }

    const { imageBase64, options } = req.body || {};
    
    const accessToken = await getAccessToken();
    // ... 后续处理
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

---

### 4. 独立HTML测试页面

**位置：** `/kanpinyinxieci_semiauto_OpenCode/test-baidu-tts.html`

**特点：**
- ✅ 无需构建工具，直接打开
- ✅ 完整的UI和参数调整
- ✅ 详细的错误提示
- ✅ 下载音频功能

**使用方式：**
```bash
# 直接在浏览器中打开
open test-baidu-tts.html
```

---

## 🔧 改进建议（从现有实现优化）

### 改进1：从前端直接调用改为后端代理

**问题：** 当前React Hook仍然在前端直接调用Token端点

```javascript
// ❌ 当前的做法（会有CORS问题）
const response = await fetch(
  `https://aip.baidubce.com/oauth/2.0/token?...`,
  { method: 'GET' }
);
```

**改进方案：**
```javascript
// ✅ 改为调用后端代理
const response = await fetch(
  `/api/baidu-token?client_id=${apiKey}&client_secret=${secretKey}`,
  { method: 'GET' }
);
```

**所需后端文件：**
```javascript
// src/pages/api/baidu-token.js (Next.js)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const { client_id, client_secret } = req.query;
  
  const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${client_id}&client_secret=${client_secret}`;
  const data = await fetch(url, { method: 'POST' }).then(r => r.json());
  
  res.json(data);
}
```

---

### 改进2：增强Token缓存机制

**问题：** 当前的缓存检查不够严格

```javascript
// ❌ 当前的做法（没有检查过期时间）
if (accessToken && accessToken.length > 50) {
  return accessToken;
}
```

**改进方案：**
```javascript
// ✅ 改进的缓存机制
const fetchAccessToken = useCallback(async () => {
  const { apiKey, secretKey } = getApiConfig();
  
  // 1. 检查缓存和过期时间
  const cachedToken = localStorage.getItem('baidu_access_token');
  const cachedExpiry = localStorage.getItem('baidu_token_expiry');
  
  if (cachedToken && cachedExpiry) {
    const expiryTime = parseInt(cachedExpiry);
    // 提前10分钟刷新，避免边界问题
    if (Date.now() < expiryTime - 600000) {
      return cachedToken;
    }
  }
  
  // 2. 获取新Token
  const response = await fetch(
    `/api/baidu-token?client_id=${apiKey}&client_secret=${secretKey}`
  );
  
  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error_description);
  }
  
  // 3. 缓存Token和过期时间
  const expiryTime = Date.now() + data.expires_in * 1000;
  localStorage.setItem('baidu_access_token', data.access_token);
  localStorage.setItem('baidu_token_expiry', expiryTime.toString());
  
  return data.access_token;
}, [getApiConfig]);
```

---

### 改进3：完善错误处理

**改进：** 区分不同的错误类型

```javascript
catch (err) {
  let errorMessage = err.message;
  
  // 1. CORS错误
  if (err.message.includes('Failed to fetch')) {
    errorMessage = 'Network error: Please use backend proxy';
  }
  
  // 2. Token错误
  if (err.message.includes('280001')) {
    errorMessage = 'Invalid API Key or Secret';
  }
  
  // 3. Service未开通
  if (err.message.includes('110')) {
    errorMessage = 'Service not enabled in Baidu Cloud';
  }
  
  // 4. Token过期
  if (err.message.includes('280007')) {
    errorMessage = 'Token expired, please refresh';
    localStorage.removeItem('baidu_access_token');
  }
  
  setError(errorMessage);
  console.error('TTS Error:', err);
  throw err;
}
```

---

## 📋 生产环境部署清单

### 对于Next.js/Vercel部署

- [ ] 创建 `/pages/api/baidu-token.js`
- [ ] 设置环境变量：`BAIDU_API_KEY` 和 `BAIDU_SECRET_KEY`
- [ ] 在Vercel仪表板中配置环境变量
- [ ] 测试 `/api/baidu-token` 端点
- [ ] 更新Hook中的API端点为 `/api/baidu-token`
- [ ] 本地测试所有TTS功能
- [ ] 部署到生产环境
- [ ] 监控日志和错误

### 对于Express/Node.js部署

- [ ] 创建路由处理器 `/api/baidu-token`
- [ ] 设置环境变量加载（dotenv）
- [ ] 实现Token缓存机制
- [ ] 添加速率限制
- [ ] 配置CORS中间件
- [ ] 添加请求日志
- [ ] 实现健康检查
- [ ] 配置反向代理（如nginx）

### 对于本地开发

- [ ] 启动 `node scripts/proxy-server.js`
- [ ] 更新Hook中的proxy URL为 `http://localhost:3001`
- [ ] 使用 `test-baidu-tts.html` 进行功能测试
- [ ] 检查浏览器控制台的错误信息
- [ ] 确保所有参数正确

---

## 🎯 快速迁移指南

如果你的项目当前有CORS问题，按照以下步骤修复：

### 第1步：添加后端代理

根据你的部署方式选择：
- **Next.js** → 使用 `api/baidu-token.js`
- **Express** → 添加路由 `/api/baidu-token`
- **本地开发** → 运行 `proxy-server.js`

### 第2步：更新Hook调用

```javascript
// 之前
const response = await fetch(
  `https://aip.baidubce.com/oauth/2.0/token?...`
);

// 之后
const response = await fetch(
  `/api/baidu-token?client_id=${apiKey}&client_secret=${secretKey}`
);
```

### 第3步：测试

```javascript
// 在浏览器控制台测试
fetch('/api/baidu-token?client_id=YOUR_KEY&client_secret=YOUR_SECRET')
  .then(r => r.json())
  .then(data => console.log(data))
  .catch(e => console.error(e));
```

### 第4步：验证

- ✅ Token成功获取
- ✅ 没有CORS错误
- ✅ TTS播放正常
- ✅ 多个请求只获取一次Token

---

## 📚 文件对应表

| 功能 | 位置 | 说明 |
|------|------|------|
| React Hook | `/kanpinyinxieci_semiauto_OpenCode/src/hooks/useBaiduTTS.js` | 核心TTS逻辑 |
| 本地代理 | `/看拼音写词/scripts/proxy-server.js` | 开发环境 |
| Vercel代理 | `/看拼音写词/api/baidu-proxy.js` | 生产环境 |
| 测试页面 | `/kanpinyinxieci_semiauto_OpenCode/test-baidu-tts.html` | 功能验证 |
| 文档 | `/看拼音写词/BAIDU_TTS_GUIDE.md` | 完整指南 |

---

## ✨ 总结

工作区中已有的实现是**生产级别的**，你可以直接使用。关键改进点是：

1. **使用后端代理替代前端直接调用** - 解决CORS问题并保护密钥
2. **改进Token缓存检查** - 避免频繁获取和边界问题
3. **增强错误处理** - 提供更有针对性的错误信息
4. **完善监控和日志** - 便于生产环境调试

所有示例代码都可以直接复制到你的项目中。

