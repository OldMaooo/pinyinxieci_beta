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
        // 增加一个简单的 API 接口来读写本地文件
        server.middlewares.use((req, res, next) => {
          // 处理保存请求
          if (req.url === '/api/save-mastery' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', () => {
              try {
                // 确保存储目录存在
                const dir = path.resolve(__dirname, 'storage');
                if (!fs.existsSync(dir)) fs.mkdirSync(dir);
                
                // 将数据写入 storage/mastery.json
                fs.writeFileSync(path.join(dir, 'mastery.json'), body);
                res.statusCode = 200;
                res.end(JSON.stringify({ status: 'success' }));
              } catch (err) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err.message }));
              }
            });
            return;
          }

          // 处理读取请求
          if (req.url === '/api/load-mastery' && req.method === 'GET') {
            const filePath = path.resolve(__dirname, 'storage', 'mastery.json');
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
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  }
})
