/**
 * SỔ TAY HT - VERCEL SERVERLESS FUNCTION
 * Endpoint: POST /api/transcribe
 * Tự động xử lý âm thanh tiếng Việt và lọc mã vật tư qua Google Gemini 2.0 Flash / Whisper.
 */

import { processSpeechToText } from '../server/sttBackend.js';

export default async function handler(req, res) {
  // Bật CORS cho toàn bộ thiết bị
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Chỉ chấp nhận phương thức POST' });
  }

  try {
    let payload = req.body;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch (e) {
        payload = {};
      }
    }

    if (!payload || !payload.audioBase64) {
      return res.status(400).json({
        success: false,
        error: 'EMPTY_AUDIO',
        message: 'Dữ liệu âm thanh trống hoặc không hợp lệ.'
      });
    }

    const result = await processSpeechToText(payload);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Lỗi API /api/transcribe:', error);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: error.message || 'Lỗi xử lý âm thanh trên máy chủ.'
    });
  }
}
