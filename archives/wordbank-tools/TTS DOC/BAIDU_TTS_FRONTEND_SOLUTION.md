# 前端集成百度TTS API 完整解决方案

## 📌 问题概述

前端直接调用百度TTS API时遇到的核心问题：
- **CORS跨域错误** - 浏览器禁止直接调用百度API的Token端点
- **"Failed to fetch" 错误** - 网络请求失败，通常与CORS有关
- **安全风险** - 在前端暴露API Key和Secret Key

---

## ✅ 解决方案总结

### 方案对比表

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|---------|
| **方案1：后端代理** | ✅ 安全，符合最佳实践 | 需要后端支持 | **推荐** - 生产环境 |
| **方案2：前端直接调用** | ✅ 无需后端，开发简单 | ❌ 暴露密钥，CORS问题 | 开发/测试 |
| **方案3：本地代理服务器** | ✅ 本地开发无CORS问题 | 需要本地服务 | 本地开发调试 |
| **方案4：Vercel/云函数代理** | ✅ 无服务器，成本低 | 需要部署 | 小型项目 |

---

## 🔧 详细解决方案

### 方案1：后端代理（推荐）✅

#### 问题原因
百度OAuth Token端点不允许浏览器直接跨域访问：
```
前端请求: https://aip.baidubce.com/oauth/2.0/token
浏览器拦截: CORS error - No 'Access-Control-Allow-Origin' header
```

#### 解决方法
创建后端代理服务，代理请求并添加CORS头。

#### 后端实现 (Vercel Serverless Function)

```javascript
// api/baidu-proxy.js
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

  // 直接调用百度API（后端可以跨域）
  const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${encodeURIComponent(apiKey)}&client_secret=${encodeURIComponent(secretKey)}`;
  const resp = await fetch(url, { method: 'POST' });
  const data = await resp.json();
  if (!resp.ok || data.error) {
    throw new Error(`Baidu token error: ${data.error_description || data.error}`);
  }
  cachedToken = data.access_token;
  // expires_in seconds, refresh 1 hour earlier
  cachedExpiry = now + Math.max(0, (data.expires_in - 3600)) * 1000;
  return cachedToken;
}

export default async function handler(req, res) {
  // 处理OPTIONS预检请求
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Max-Age', '86400');
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
    res.status(204).end();
    return;
  }

  try {
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));

    if (req.method === 'GET') {
      // 健康检查
      res.status(200).json({ ok: true, message: 'baidu-proxy ok' });
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed' });
      return;
    }

    const { imageBase64, options } = req.body || {};
    
    // 获取Token（缓存以减少API调用）
    const accessToken = await getAccessToken();
    
    // 调用百度OCR/TTS API
    const baiduUrl = 'https://aip.baidubce.com/rest/2.0/ocr/v1/handwriting';
    const resp = await fetch(baiduUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        access_token: accessToken,
        image: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
        ...(options || {})
      })
    });

    const result = await resp.json();
    res.status(resp.status).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

#### 环境变量配置 (.env.local)
```bash
BAIDU_API_KEY=your_api_key_here
BAIDU_SECRET_KEY=your_secret_key_here
```

#### 前端使用

```javascript
// 前端请求后端代理（无CORS问题）
async function getTTSAudio(text) {
  const response = await fetch('/api/baidu-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      options: { speed: 5, pitch: 5, volume: 5 }
    })
  });
  
  if (!response.ok) throw new Error('TTS failed');
  return await response.arrayBuffer();
}
```

#### 优点
- ✅ 密钥安全（不暴露在前端）
- ✅ 完全解决CORS问题
- ✅ 可以在后端做Token缓存和速率限制
- ✅ 符合安全最佳实践

---

### 方案2：前端直接调用（仅限开发）

#### 警告
⚠️ **不推荐用于生产环境**（安全风险）

#### 实现代码

```javascript
// src/hooks/useBaiduTTS.js
export function useBaiduTTS() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const audioRef = useRef(null);

  // 获取API配置（通过localStorage或环境变量）
  const getApiConfig = useCallback(() => {
    const apiKey = localStorage.getItem('baidu_api_key') || '';
    const secretKey = localStorage.getItem('baidu_secret_key') || '';
    const accessToken = localStorage.getItem('baidu_access_token') || '';
    return { apiKey, secretKey, accessToken };
  }, []);

  // 第一步：获取Access Token
  const fetchAccessToken = useCallback(async () => {
    const { apiKey, secretKey, accessToken } = getApiConfig();
    
    // 检查缓存的token是否有效
    if (accessToken && accessToken.length > 50) {
      const expiry = localStorage.getItem('baidu_token_expire_time');
      if (expiry && Date.now() < parseInt(expiry)) {
        return accessToken;
      }
    }

    if (!apiKey || !secretKey) {
      throw new Error('Please set Baidu API Key and Secret Key');
    }

    try {
      // ⚠️ 注意：这会导致CORS错误（仅在开发环境可能有效）
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
      localStorage.setItem('baidu_token_expire_time', 
        Date.now() + data.expires_in * 1000);

      return data.access_token;
    } catch (err) {
      if (err.message.includes('Failed to fetch')) {
        throw new Error('CORS Error: Use backend proxy instead');
      }
      throw err;
    }
  }, [getApiConfig]);

  // 第二步：调用TTS API（相对安全，因为使用了Token）
  const play = useCallback(async (text, options = {}) => {
    if (!text || text.trim().length === 0) {
      setError('Text cannot be empty');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const accessToken = await fetchAccessToken();
      
      // 构建TTS请求参数
      const params = new URLSearchParams();
      params.append('tex', text);
      params.append('tok', accessToken);
      params.append('cuid', options.cuid || 'web_' + Math.random().toString(36).substr(2, 9));
      params.append('ctp', '1'); // web client
      params.append('lan', 'zh'); // chinese
      params.append('spd', options.speed || '5'); // speed 0-15
      params.append('pit', options.pitch || '5'); // pitch 0-15
      params.append('vol', options.volume || '5'); // volume 0-15
      params.append('per', options.voiceId || '4003'); // voice id
      params.append('aue', '3'); // mp3 format

      // ✅ TTS API调用（通常不会有CORS问题）
      const response = await fetch('https://tsn.baidu.com/text2audio', {
        method: 'POST',
        body: params.toString(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const contentType = response.headers.get('content-type');
      
      if (!response.ok || !contentType?.startsWith('audio')) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.err_msg || `TTS failed: ${response.status}`);
      }

      const audioData = await response.arrayBuffer();
      const blob = new Blob([audioData], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      audioRef.current.src = url;
      await audioRef.current.play();

    } catch (err) {
      setError(err.message);
      console.error('TTS Error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchAccessToken]);

  return {
    play,
    isLoading,
    error,
    stop: () => audioRef.current?.pause()
  };
}
```

#### React组件使用示例

```jsx
import { useBaiduTTS } from './hooks/useBaiduTTS';

export function MyComponent() {
  const baiduTTS = useBaiduTTS();
  
  const handleSpeak = async () => {
    try {
      await baiduTTS.play('你好，世界', {
        speed: 5,
        pitch: 5,
        volume: 5,
        voiceId: 4003
      });
    } catch (error) {
      console.error('Speech error:', error);
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div>
      <button onClick={handleSpeak} disabled={baiduTTS.isLoading}>
        {baiduTTS.isLoading ? 'Processing...' : 'Speak'}
      </button>
      {baiduTTS.error && <p style={{ color: 'red' }}>{baiduTTS.error}</p>}
    </div>
  );
}
```

#### 缺点
- ❌ CORS错误（Token获取失败）
- ❌ API密钥暴露在客户端代码中
- ❌ 密钥可能被外泄
- ❌ 无法进行权限控制

---

### 方案3：本地代理服务器（开发调试）

#### 问题
开发过程中想要测试，但不想部署后端。

#### 解决方案
在本地运行Node.js代理服务器。

#### 实现代码

```javascript
// scripts/proxy-server.js
#!/usr/bin/env node
const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');

const PORT = 3001;
const PROJECT_ROOT = path.resolve(__dirname, '..');

const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    if (req.method !== 'POST' && req.method !== 'GET') {
        res.writeHead(405, { 'Content-Type': 'text/plain' });
        res.end('Method Not Allowed');
        return;
    }
    
    let requestPath = url.parse(req.url).pathname;
    
    // Handle static files
    if (req.method === 'GET' && !requestPath.startsWith('/api/')) {
        const filePath = requestPath === '/' 
            ? path.join(PROJECT_ROOT, 'index.html')
            : path.join(PROJECT_ROOT, requestPath.slice(1));
        
        if (!filePath.startsWith(PROJECT_ROOT)) {
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            res.end('Forbidden');
            return;
        }
        
        fs.stat(filePath, (err, stats) => {
            if (err || !stats.isFile()) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not Found');
                return;
            }
            
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    res.writeHead(500);
                    res.end('Internal Server Error');
                    return;
                }
                
                const ext = path.extname(filePath).toLowerCase();
                const mimeTypes = {
                    '.html': 'text/html',
                    '.js': 'application/javascript',
                    '.json': 'application/json',
                    '.css': 'text/css',
                };
                
                res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
                res.end(data);
            });
        });
        return;
    }
    
    // Handle API: GET /api/oauth/token
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
            
            // Forward to Baidu API
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
    
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
});

server.listen(PORT, () => {
    console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
    console.log(`📖 Open browser: http://localhost:${PORT}`);
});
```

#### 使用方法

```bash
# 1. 安装依赖
npm install

# 2. 启动本地代理
node scripts/proxy-server.js
# Output: 🚀 Proxy server running on http://localhost:3001

# 3. 在浏览器中访问
# http://localhost:3001
```

#### 前端调用代理

```javascript
// 调用本地代理获取Token
async function getTokenFromLocalProxy(apiKey, apiSecret) {
  const proxyUrl = `http://localhost:3001/api/oauth/token?client_id=${apiKey}&client_secret=${apiSecret}`;
  const response = await fetch(proxyUrl, { mode: 'cors' });
  return await response.json();
}

// 在getBaiduAccessToken中使用
async getBaiduAccessToken() {
    const cachedToken = localStorage.getItem('baidu_access_token');
    const cachedExpiry = localStorage.getItem('baidu_token_expiry');
    
    if (cachedToken && cachedExpiry && Date.now() < parseInt(cachedExpiry)) {
        return cachedToken;
    }
    
    if (!this.apiConfig.apiKey || !this.apiConfig.apiSecret) {
        throw new Error('Please configure Baidu API credentials');
    }
    
    try {
        // 使用本地代理
        const proxyUrl = `http://localhost:3001/api/oauth/token?client_id=${this.apiConfig.apiKey}&client_secret=${this.apiConfig.apiSecret}`;
        const response = await fetch(proxyUrl, { mode: 'cors' });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Token fetch failed`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(`Token error: ${data.error_description}`);
        }
        
        // Cache token
        const expiry = Date.now() + (data.expires_in - 3600) * 1000;
        localStorage.setItem('baidu_access_token', data.access_token);
        localStorage.setItem('baidu_token_expiry', expiry.toString());
        
        return data.access_token;
    } catch (error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
            throw new Error('Proxy error: Please start local proxy server (node proxy-server.js)');
        }
        throw error;
    }
}
```

#### 优点
- ✅ 解决本地开发的CORS问题
- ✅ 密钥不需要硬编码在前端
- ✅ 可以轻松切换到生产后端代理

---

### 方案4：Vercel/云函数代理（无服务器）

#### 优点
- ✅ 无需维护服务器
- ✅ 自动扩展
- ✅ 按使用量付费

#### 环境变量配置

```bash
# .env.local
BAIDU_API_KEY=your_key
BAIDU_SECRET_KEY=your_secret
```

#### 前端调用

```javascript
// 使用相对路径调用API
async function getTTSToken() {
  const response = await fetch('/api/baidu-proxy', {
    method: 'GET'
  });
  return await response.json();
}
```

---

## 🎯 "Failed to fetch" 错误排查表

| 错误消息 | 原因 | 解决方案 |
|---------|------|---------|
| `Failed to fetch` | CORS被浏览器拦截 | 使用方案1/3/4（后端代理） |
| `Network error` | DNS/网络连接问题 | 检查网络，确保能访问aip.baidubce.com |
| `err_code: 280001` | 参数错误 | 检查API Key/Secret格式 |
| `err_code: 280003` | Token无效或过期 | 重新获取Token或检查缓存逻辑 |
| `err_code: 110` | 没有开通服务 | 在百度云控制台开通文字转语音服务 |
| `Content-Type: text/html` | API返回错误页面 | 检查Token是否正确 |

---

## 🔑 百度TTS API 参数详解

### Token获取

```http
GET https://aip.baidubce.com/oauth/2.0/token
  ?grant_type=client_credentials
  &client_id=YOUR_API_KEY
  &client_secret=YOUR_SECRET_KEY
```

### TTS合成请求

```http
POST https://tsn.baidu.com/text2audio
Content-Type: application/x-www-form-urlencoded

参数:
- tex: 合成文本（必填，≤1024个GBK字节）
- tok: Access Token（必填）
- cuid: 客户端唯一标识（可选）
- ctp: 客户端类型，web填1（可选）
- lan: 语言，zh为中文（可选）
- spd: 语速，0-15，默认5（可选）
- pit: 音调，0-15，默认5（可选）
- vol: 音量，0-15，默认5（可选）
- per: 发音人ID（可选）
  - 4003: 度逍遥（臻品）
  - 4106: 度博文（臻品）
  - 4105: 度灵儿（臻品）
- aue: 音频格式，3为MP3（可选）
```

### 返回值

**成功（200 OK）：**
```
Content-Type: audio/mpeg
[二进制音频数据]
```

**错误（200 OK，但内容是JSON）：**
```json
{
  "err_no": 110,
  "err_msg": "service not open",
  "sn": ""
}
```

---

## 🏗️ 完整架构建议

### 开发环境
```
┌─────────────────┐
│   React App     │
│  (localhost)    │
└────────┬────────┘
         │
    POST /api/oauth/token (local proxy)
         │
    http://localhost:3001
         │
┌────────▼────────┐
│ Local Proxy     │ (node proxy-server.js)
│ (node.js)       │
└────────┬────────┘
         │
    HTTPS (no CORS issue on server side)
         │
┌────────▼────────────────────┐
│ Baidu API                   │
│ aip.baidubce.com            │
│ tsn.baidu.com               │
└─────────────────────────────┘
```

### 生产环境
```
┌─────────────────┐
│   React App     │
│  (vercel.com)   │
└────────┬────────┘
         │
    POST /api/baidu-proxy
         │
┌────────▼────────────────┐
│ Vercel Serverless       │
│ Function                │
│ (api/baidu-proxy.js)    │
└────────┬────────────────┘
         │
    HTTPS (env vars: BAIDU_API_KEY, BAIDU_SECRET_KEY)
         │
┌────────▼────────────────────┐
│ Baidu API                   │
│ aip.baidubce.com            │
│ tsn.baidu.com               │
└─────────────────────────────┘
```

---

## 🔐 安全最佳实践

### ✅ 推荐做法
1. **永远不要在前端代码中硬编码API密钥**
2. **使用后端代理获取Token**
3. **在后端缓存Token（有效期30天）**
4. **设置速率限制防止滥用**
5. **使用HTTPS加密传输**
6. **定期轮换API密钥**

### ❌ 避免做法
1. 在localStorage中存储Secret Key
2. 在git中提交真实的API密钥
3. 在生产环境使用前端直接调用
4. 不实现Token缓存机制

---

## 📦 完整工作代码示例

### React Hook实现（带本地代理支持）

```javascript
// hooks/useBaiduTTS.js
import { useState, useCallback, useRef } from 'react';

export function useBaiduTTS(useLocalProxy = false) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const audioRef = useRef(null);

  const getApiConfig = useCallback(() => {
    const apiKey = localStorage.getItem('baidu_api_key') || '';
    const secretKey = localStorage.getItem('baidu_secret_key') || '';
    const accessToken = localStorage.getItem('baidu_access_token') || '';
    return { apiKey, secretKey, accessToken };
  }, []);

  const fetchAccessToken = useCallback(async () => {
    const { apiKey, secretKey, accessToken } = getApiConfig();
    
    // 检查缓存
    if (accessToken && accessToken.length > 50) {
      const expiry = localStorage.getItem('baidu_token_expire_time');
      if (expiry && Date.now() < parseInt(expiry)) {
        return accessToken;
      }
    }

    if (!apiKey || !secretKey) {
      throw new Error('Please set Baidu API Key and Secret Key');
    }

    try {
      let tokenUrl;
      
      if (useLocalProxy) {
        // Use local proxy server
        tokenUrl = `http://localhost:3001/api/oauth/token?client_id=${apiKey}&client_secret=${secretKey}`;
      } else {
        // Use backend proxy (production)
        tokenUrl = `/api/baidu-proxy?action=getToken&client_id=${apiKey}&client_secret=${secretKey}`;
      }

      const response = await fetch(tokenUrl, {
        method: 'GET',
        mode: useLocalProxy ? 'cors' : 'same-origin'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Token fetch failed`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Token error: ${data.error_description}`);
      }

      // Cache token
      localStorage.setItem('baidu_access_token', data.access_token);
      localStorage.setItem('baidu_token_expire_time', 
        Date.now() + data.expires_in * 1000);

      return data.access_token;
    } catch (err) {
      if (err.message.includes('Failed to fetch')) {
        throw new Error(useLocalProxy 
          ? 'Local proxy error: Start node proxy-server.js'
          : 'Backend proxy error: Check environment variables');
      }
      throw err;
    }
  }, [getApiConfig, useLocalProxy]);

  const play = useCallback(async (text, options = {}) => {
    if (!text?.trim()) {
      setError('Text cannot be empty');
      return;
    }

    if (isLoading || isPlaying) return;

    setIsLoading(true);
    setError('');

    try {
      const accessToken = await fetchAccessToken();
      
      const params = new URLSearchParams();
      params.append('tex', text);
      params.append('tok', accessToken);
      params.append('cuid', options.cuid || 'app_' + Date.now());
      params.append('ctp', '1');
      params.append('lan', 'zh');
      params.append('spd', String(options.speed || 5));
      params.append('pit', String(options.pitch || 5));
      params.append('vol', String(options.volume || 5));
      params.append('per', String(options.voiceId || 4003));
      params.append('aue', '3');

      const response = await fetch('https://tsn.baidu.com/text2audio', {
        method: 'POST',
        body: params.toString(),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const contentType = response.headers.get('content-type');
      
      if (!response.ok || !contentType?.startsWith('audio')) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.err_msg || `TTS failed: ${response.status}`);
      }

      const audioData = await response.arrayBuffer();
      const blob = new Blob([audioData], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      audioRef.current.src = url;
      setIsPlaying(true);

      audioRef.current.onended = () => {
        setIsPlaying(false);
      };

      await audioRef.current.play();
    } catch (err) {
      setError(err.message);
      setIsPlaying(false);
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

## 🎓 总结表

| 需求 | 推荐方案 | 理由 |
|------|---------|------|
| 生产环境安全部署 | 方案1：后端代理 | 密钥安全，支持Token缓存 |
| 快速开发测试 | 方案3：本地代理 | 无需部署后端，解决CORS |
| 无服务器部署 | 方案4：Vercel函数 | 低成本，自动扩展 |
| 学习/演示 | 方案2：前端直接调用 | 简单，但仅限开发 |

---

## 📚 相关资源

- [百度TTS官方文档](https://cloud.baidu.com/doc/SPEECH/s/mlbxh7xie)
- [百度OAuth 2.0文档](https://cloud.baidu.com/doc/Reference/s/9jwvz2egb)
- [CORS跨域资源共享](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)

