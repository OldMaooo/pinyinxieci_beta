import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'local-storage-api',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // 处理保存修正请求
          if (req.url === '/api/save-correction' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', () => {
              try {
                const { char, colors } = JSON.parse(body);
                const dir = path.resolve(__dirname, 'storage');
                if (!fs.existsSync(dir)) fs.mkdirSync(dir);
                
                const filePath = path.join(dir, 'corrections.json');
                let allCorrections = {};
                if (fs.existsSync(filePath)) {
                    allCorrections = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                }
                
                allCorrections[char] = colors;
                fs.writeFileSync(filePath, JSON.stringify(allCorrections, null, 2));
                
                res.statusCode = 200;
                res.end(JSON.stringify({ status: 'success' }));
              } catch (err) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err.message }));
              }
            });
            return;
          }

          // 处理读取修正请求
          if (req.url === '/api/load-corrections' && req.method === 'GET') {
            const filePath = path.resolve(__dirname, 'storage', 'corrections.json');
            if (fs.existsSync(filePath)) {
              const data = fs.readFileSync(filePath);
              res.setHeader('Content-Type', 'application/json');
              res.end(data);
            } else {
              res.end(JSON.stringify({}));
            }
            return;
          }

          next();
        });
      }
    }
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    proxy: {
      '/api/baidu': {
        target: 'https://aip.baidubce.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/baidu/, '')
      },
      '/api/baidu-tts': {
        target: 'https://tsn.baidu.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/baidu-tts/, '')
      }
    }
  }
})
