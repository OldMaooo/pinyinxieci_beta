# 百度TTS CORS问题 - 快速参考指南

## ⚡ 一句话解决方案

> **前端直接获取Token会CORS错误 → 改用后端代理 → 问题解决**

---

## 🔴 你遇到的错误

```javascript
// ❌ 这会失败：CORS error
fetch('https://aip.baidubce.com/oauth/2.0/token?...')
  .then(r => r.json())
  .catch(e => console.log('Failed to fetch'))
  // 错误: Failed to fetch (CORS issue)
```

**为什么？**
- 百度API服务器没有返回 `Access-Control-Allow-Origin: *` 头
- 浏览器安全策略阻止了跨域请求
- 这是浏览器的保护机制，服务器端无CORS限制

---

## ✅ 解决方案对比

### 快速选择（3秒钟）

| 场景 | 方案 | 代码量 | 难度 |
|-----|------|-------|------|
| 我想**马上测试** | 本地代理 | 30行 | ⭐ |
| 我想**最终部署** | Vercel代理 | 50行 | ⭐⭐ |
| 我想**简单快速** | 本地Node.js代理 | 20行 | ⭐ |

---

## 🚀 5分钟快速上手

### 第1步：启动本地代理（最快）

```bash
# 1. 创建代理脚本
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
        const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${params.client_id}&client_secret=${params.client_secret}`;
        
        https.get(tokenUrl, (resp) => {
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
```

### 第2步：前端调用代理

```javascript
// ✅ 这样就可以了
async function getToken(apiKey, secretKey) {
  const res = await fetch(`http://localhost:3001/api/token?client_id=${apiKey}&client_secret=${secretKey}`);
  return await res.json();
}

// 完整示例
async function playTTS(text, apiKey, secretKey) {
  try {
    // 第一步：获取Token（通过本地代理）
    const tokenRes = await fetch(
      `http://localhost:3001/api/token?client_id=${apiKey}&client_secret=${secretKey}`
    );
    const { access_token } = await tokenRes.json();
    
    // 第二步：调用TTS API（这个通常不会有CORS问题）
    const ttsRes = await fetch('https://tsn.baidu.com/text2audio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        tex: text,
        tok: access_token,
        ctp: '1',
        lan: 'zh',
        aue: '3' // MP3
      }).toString()
    });
    
    const audio = await ttsRes.arrayBuffer();
    const blob = new Blob([audio], { type: 'audio/mpeg' });
    new Audio(URL.createObjectURL(blob)).play();
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// 使用
playTTS('你好', 'your_api_key', 'your_secret_key');
```

### 第3步：测试

```html
<!DOCTYPE html>
<html>
<head><title>TTS Test</title></head>
<body>
    <input id="text" value="你好">
    <button onclick="test()">播放</button>
    <script>
        async function test() {
            const apiKey = 'your_api_key';
            const secretKey = 'your_secret_key';
            const text = document.getElementById('text').value;
            
            // 获取Token
            const tokenRes = await fetch(
                `http://localhost:3001/api/token?client_id=${apiKey}&client_secret=${secretKey}`
            );
            const { access_token } = await tokenRes.json();
            
            // 合成语音
            const ttsRes = await fetch('https://tsn.baidu.com/text2audio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `tex=${text}&tok=${access_token}&ctp=1&lan=zh&aue=3`
            });
            
            const audio = await ttsRes.arrayBuffer();
            new Audio(URL.createObjectURL(new Blob([audio], { type: 'audio/mpeg' }))).play();
        }
    </script>
</body>
</html>
```

---

## 🔧 根据你的开发环境选择

### 场景A：本地开发（推荐）

```javascript
// 本地运行：node proxy.js

// 前端调用本地代理
const PROXY_URL = 'http://localhost:3001';

async function getTTSToken(apiKey, secretKey) {
  const res = await fetch(`${PROXY_URL}/api/token?client_id=${apiKey}&client_secret=${secretKey}`);
  return (await res.json()).access_token;
}
```

### 场景B：Vercel/Netlify部署

```javascript
// 部署环境变量设置
// BAIDU_API_KEY=your_key
// BAIDU_SECRET_KEY=your_secret

// 前端调用自己的API路由
async function getTTSToken() {
  const res = await fetch('/api/baidu-token');
  return (await res.json()).access_token;
}
```

```javascript
// api/baidu-token.js (Vercel Function)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${process.env.BAIDU_API_KEY}&client_secret=${process.env.BAIDU_SECRET_KEY}`;
  const data = await fetch(url, { method: 'POST' }).then(r => r.json());
  
  res.json(data);
}
```

### 场景C：自己的Node.js服务器

```javascript
// express版本
app.get('/api/baidu-token', async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  
  const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${process.env.BAIDU_API_KEY}&client_secret=${process.env.BAIDU_SECRET_KEY}`;
  const data = await fetch(url, { method: 'POST' }).then(r => r.json());
  
  res.json(data);
});
```

---

## 🆘 故障排查

### 错误1: `Failed to fetch`

**原因：** CORS被浏览器拦截

**解决：**
```javascript
// ❌ 不要这样做（会被拦截）
fetch('https://aip.baidubce.com/oauth/2.0/token...')

// ✅ 要这样做（通过代理）
fetch('http://localhost:3001/api/token...')
```

### 错误2: `err_code: 280001` (Token获取失败)

**原因：** API Key或Secret Key错误

**检查：**
```bash
# 验证API Key格式
echo "API Key: ${BAIDU_API_KEY}" # 应该是26字母数字
echo "Secret: ${BAIDU_SECRET_KEY}" # 应该是32字母数字
```

### 错误3: `err_code: 110` (服务未开通)

**原因：** 未在百度云开通文字转语音服务

**解决：**
1. 访问 https://console.bce.baidu.com
2. 找到你的应用
3. 点击"应用详情" → "语音技术" → 开通"文字转语音"
4. 等待5分钟生效

### 错误4: `502 Bad Gateway` (Vercel部署)

**原因：** 环境变量未设置或代码错误

**检查：**
```bash
# 检查环境变量
vercel env list

# 确保有这两个变量
BAIDU_API_KEY=...
BAIDU_SECRET_KEY=...

# 重新部署
vercel --prod
```

---

## 📊 架构对比速查表

```
┌─────────────────────────────────────────────────────────────┐
│                    发展阶段               │    推荐方案      │
├─────────────────────────────────────────────────────────────┤
│ 1. 我正在学习如何使用TTS API     │ 本地代理 (proxy.js) │
│ 2. 我想在本地调试完整流程       │ 本地代理 + 前端代码  │
│ 3. 我想快速上线项目             │ Vercel Serverless   │
│ 4. 我有自己的Node.js服务器      │ Express 路由代理    │
│ 5. 我想完全掌控安全和缓存       │ 自建完整后端服务    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 完整工作示例（复制即用）

### 文件1：`proxy.js` (放在项目根目录)

```javascript
#!/usr/bin/env node
const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 3001;

http.createServer((req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // OPTIONS预检
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // 代理Token请求
    if (req.url.startsWith('/api/token')) {
        const params = url.parse(req.url, true).query;
        const baiduUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${params.client_id}&client_secret=${params.client_secret}`;
        
        https.get(baiduUrl, (proxyRes) => {
            res.writeHead(proxyRes.statusCode);
            proxyRes.pipe(res);
        }).on('error', (e) => {
            res.writeHead(500);
            res.end(JSON.stringify({ error: e.message }));
        });
        return;
    }
    
    res.writeHead(404);
    res.end('Not Found');
}).listen(PORT, () => {
    console.log(`✅ Proxy running at http://localhost:${PORT}`);
    console.log(`📝 Use: http://localhost:3001/api/token?client_id=YOUR_KEY&client_secret=YOUR_SECRET`);
});
```

### 文件2：`test.html` (测试页面)

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>百度TTS测试</title>
    <style>
        body { font-family: Arial; max-width: 600px; margin: 50px auto; }
        input { width: 100%; padding: 10px; margin: 10px 0; box-sizing: border-box; }
        button { background: #007bff; color: white; padding: 10px 20px; border: none; cursor: pointer; }
        button:hover { background: #0056b3; }
        .status { margin-top: 20px; padding: 10px; background: #f0f0f0; }
    </style>
</head>
<body>
    <h1>🎵 百度TTS测试</h1>
    
    <label>API Key:</label>
    <input id="apiKey" placeholder="QdZJlWRuzc2t2O2DS3ssMZGz">
    
    <label>Secret Key:</label>
    <input id="secretKey" type="password" placeholder="XUKDWr3RiOVG7ZxvPqQwLm8nYuT2aB5c">
    
    <label>文本:</label>
    <input id="text" value="你好，这是一个测试。">
    
    <button onclick="testTTS()">🎤 播放</button>
    
    <div id="status"></div>

    <script>
        async function testTTS() {
            const apiKey = document.getElementById('apiKey').value;
            const secretKey = document.getElementById('secretKey').value;
            const text = document.getElementById('text').value;
            const status = document.getElementById('status');
            
            if (!apiKey || !secretKey || !text) {
                status.textContent = '❌ 请填写所有字段';
                return;
            }
            
            try {
                status.textContent = '⏳ 获取Token中...';
                
                // 通过本地代理获取Token
                const tokenRes = await fetch(
                    `http://localhost:3001/api/token?client_id=${apiKey}&client_secret=${secretKey}`
                );
                
                if (!tokenRes.ok) {
                    throw new Error(`代理错误: ${tokenRes.status}`);
                }
                
                const tokenData = await tokenRes.json();
                
                if (tokenData.error) {
                    throw new Error(`百度错误: ${tokenData.error_description}`);
                }
                
                const token = tokenData.access_token;
                status.textContent = '⏳ 合成语音中...';
                
                // 调用TTS API
                const ttsRes = await fetch('https://tsn.baidu.com/text2audio', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                        tex: text,
                        tok: token,
                        ctp: '1',
                        lan: 'zh',
                        aue: '3'
                    }).toString()
                });
                
                if (!ttsRes.ok) {
                    throw new Error(`TTS失败: ${ttsRes.status}`);
                }
                
                const contentType = ttsRes.headers.get('content-type');
                if (!contentType?.startsWith('audio')) {
                    const error = await ttsRes.json();
                    throw new Error(`百度TTS错误: ${error.err_msg}`);
                }
                
                const audio = await ttsRes.arrayBuffer();
                const blob = new Blob([audio], { type: 'audio/mpeg' });
                const url = URL.createObjectURL(blob);
                
                const player = new Audio(url);
                player.play();
                
                status.textContent = '✅ 播放中...';
                
            } catch (error) {
                status.textContent = `❌ ${error.message}`;
                console.error(error);
            }
        }
    </script>
</body>
</html>
```

### 使用步骤：

```bash
# 1. 启动本地代理
node proxy.js
# 输出: ✅ Proxy running at http://localhost:3001

# 2. 用浏览器打开 test.html
# 3. 输入你的API Key和Secret Key
# 4. 点击"播放"按钮
# 5. 听到语音 = 成功！
```

---

## 💡 关键要点

1. **Token获取必须通过代理** - 直接调用会CORS失败
2. **TTS合成调用可以直接** - 百度服务器通常允许
3. **缓存Token能加快速度** - 有效期30天
4. **生产环境要加认证** - 防止滥用

---

## 🔗 相关链接

- 百度TTS文档: https://cloud.baidu.com/doc/SPEECH/s/mlbxh7xie
- OAuth 2.0: https://cloud.baidu.com/doc/Reference/s/9jwvz2egb
- 获取API Key: https://console.bce.baidu.com

