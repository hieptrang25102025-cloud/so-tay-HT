/**
 * SỔ TAY HT - PRODUCTION NODE.JS SERVER
 * Phục vụ ứng dụng tĩnh và API nhận diện giọng nói khi deploy lên Hosting / VPS / Cloud.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { processSpeechToText } from './sttBackend.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

const PORT = process.env.PORT || 5173;
const HOST = '0.0.0.0';

const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // 1. API: Transcribe Audio
  if (req.url === '/api/transcribe' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });

    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const result = await processSpeechToText(payload);
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = result.success ? 200 : 400;
        res.end(JSON.stringify(result));
      } catch (err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // 2. Static File Serving from dist/
  let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);

  // If path has no extension or doesn't exist, fallback to index.html (SPA routing)
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  try {
    const content = fs.readFileSync(filePath);
    res.setHeader('Content-Type', contentType);
    res.statusCode = 200;
    res.end(content);
  } catch (err) {
    res.statusCode = 404;
    res.end('Not Found');
  }
});

server.listen(PORT, HOST, () => {
  console.log(`====================================================`);
  console.log(`  SỔ TAY HT - Máy chủ đã sẵn sàng!`);
  console.log(`  Truy cập cục bộ:    http://localhost:${PORT}`);
  console.log(`  Truy cập điện thoại: http://${HOST}:${PORT}`);
  console.log(`====================================================`);
});
