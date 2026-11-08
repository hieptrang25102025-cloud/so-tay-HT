/**
 * SỔ TAY HT - BACKEND SPEECH-TO-TEXT PROCESSING ENGINE
 * Xử lý âm thanh đa nền tảng và gọi các dịch vụ AI nhận diện tiếng Việt chính xác.
 */

// API Key mặc định đọc từ biến môi trường của máy chủ
export const DEFAULT_GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';

export async function processSpeechToText(payload) {
  const { audioBase64, mimeType, apiKey: clientApiKey, provider: clientProvider } = payload;

  if (!audioBase64) {
    return { success: false, error: 'EMPTY_AUDIO', message: 'Dữ liệu âm thanh trống.' };
  }

  const provider = clientProvider || 'gemini';
  
  // Resolve API Key: client provided > environment variable > DEFAULT_KEY
  let apiKey = clientApiKey || '';
  if (!apiKey) {
    if (provider === 'gemini') {
      apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || DEFAULT_GEMINI_API_KEY;
    } else if (provider === 'groq') {
      apiKey = process.env.GROQ_API_KEY || '';
    } else if (provider === 'openai') {
      apiKey = process.env.OPENAI_API_KEY || '';
    }
  }

  if (!apiKey) {
    return {
      success: false,
      error: 'NO_API_KEY',
      message: 'Chưa có API Key nhận diện giọng nói.'
    };
  }

  // Normalize MIME type for both audio and video inputs (iOS may produce audio/mp4 or video/mp4)
  let cleanMime = mimeType ? mimeType.split(';')[0].trim().toLowerCase() : 'audio/webm';
  if (cleanMime === 'audio/aac' || cleanMime === 'audio/m4a') {
    cleanMime = 'audio/mp4';
  } else if (cleanMime === 'video/quicktime' || cleanMime === 'video/mov') {
    cleanMime = 'video/mp4';
  }

  if (provider === 'gemini') {
    return await transcribeWithGemini(audioBase64, cleanMime, apiKey);
  } else if (provider === 'groq') {
    return await transcribeWithGroq(audioBase64, cleanMime, apiKey);
  } else if (provider === 'openai') {
    return await transcribeWithOpenAI(audioBase64, cleanMime, apiKey);
  }

  return { success: false, error: 'UNKNOWN_PROVIDER', message: `Nhà cung cấp STT "${provider}" không hợp lệ.` };
}

/**
 * Transcribe using Google Gemini Multimodal Audio/Video API
 * NOTE: For Google AI Studio "AQ." Auth Keys, key MUST be sent via 'x-goog-api-key' header,
 * NOT via '?key=...' in URL query params.
 */
async function transcribeWithGemini(mediaBase64, mimeType, apiKey) {
  try {
    const candidateModels = [
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-2.5-flash',
      'gemini-1.5-flash-latest'
    ];

    let lastError = null;

    for (const model of candidateModels) {
      try {
        // Correct endpoint for AQ. Auth Keys: No query string key, use x-goog-api-key header
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

        const requestBody = {
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: mediaBase64
                  }
                },
                {
                  text: `Bạn là trợ lý chuyển âm thanh/video sang văn bản tiếng Việt cực kỳ chính xác cho ứng dụng quản lý vật tư của người thợ SỔ TAY HT.
Nhiệm vụ: Hãy nghe đoạn âm thanh này và chép lại CHÍNH XÁC những gì người nói đã nói bằng tiếng Việt có dấu.

QUY TẮC QUAN TRỌNG:
1. Giữ nguyên mã sản phẩm, mã linh kiện và tên kỹ thuật (ví dụ: "CORO A123", "CORO A125", "LED 20W", "LED 12W", "dây COGO", "CV 2.5", "M6", "M8"). Tuyệt đối không tự ý dịch hoặc sửa mã sản phẩm.
2. Nhận diện chính xác tên khách hàng (ví dụ: "anh Tuấn", "chú Minh", "bác Hùng", "chị Lan", "em Nam").
3. Nhận diện đúng số lượng và đơn vị (ví dụ: "2 sợi", "5 cái", "10 mét", "1 bộ", "3 cuộn").
4. Chỉ xuất ra DUY NHẤT một câu văn bản tiếng Việt hoàn chỉnh, không thêm lời chào, không thêm giải thích hay dấu ngoặc kép.`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 256
          }
        };

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
          },
          body: JSON.stringify(requestBody)
        });

        if (!res.ok) {
          const errText = await res.text();
          if (res.status === 404) {
            lastError = `Model ${model} không tồn tại (404)`;
            continue; // Thử model tiếp theo
          }
          return {
            success: false,
            error: `GEMINI_API_ERROR_${res.status}`,
            message: `Lỗi kết nối Gemini (${res.status}): ${errText.slice(0, 180)}`
          };
        }

        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const cleanText = rawText.trim().replace(/^["']|["']$/g, '');

        if (!cleanText) {
          return {
            success: false,
            error: 'NO_SPEECH_DETECTED',
            message: 'Không phát hiện giọng nói rõ ràng. Vui lòng nói to và rõ hơn.'
          };
        }

        return {
          success: true,
          text: cleanText
        };
      } catch (innerErr) {
        lastError = innerErr.message;
      }
    }

    return {
      success: false,
      error: 'GEMINI_MODELS_UNAVAILABLE',
      message: `Không thể kết nối đến Gemini AI: ${lastError || 'Lỗi không xác định'}`
    };
  } catch (err) {
    return {
      success: false,
      error: 'GEMINI_EXCEPTION',
      message: `Lỗi xử lý Gemini: ${err.message}`
    };
  }
}

/**
 * Transcribe using Groq Whisper large-v3 API
 */
async function transcribeWithGroq(audioBase64, mimeType, apiKey) {
  try {
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    const extension = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';
    
    const formData = new FormData();
    const audioBlob = new Blob([audioBuffer], { type: mimeType });
    formData.append('file', audioBlob, `recording.${extension}`);
    formData.append('model', 'whisper-large-v3');
    formData.append('language', 'vi');
    formData.append('prompt', 'Hôm nay gắn cho anh Tuấn 2 sợi dây CORO A123 và bóng đèn LED 20W');

    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: `GROQ_ERROR_${res.status}`, message: `Lỗi Groq: ${errText.slice(0, 150)}` };
    }

    const data = await res.json();
    return { success: true, text: (data.text || '').trim() };
  } catch (err) {
    return { success: false, error: 'GROQ_EXCEPTION', message: `Lỗi Groq: ${err.message}` };
  }
}

/**
 * Transcribe using OpenAI Whisper API
 */
async function transcribeWithOpenAI(audioBase64, mimeType, apiKey) {
  try {
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
    
    const formData = new FormData();
    const audioBlob = new Blob([audioBuffer], { type: mimeType });
    formData.append('file', audioBlob, `recording.${extension}`);
    formData.append('model', 'whisper-1');
    formData.append('language', 'vi');

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: `OPENAI_ERROR_${res.status}`, message: `Lỗi OpenAI: ${errText.slice(0, 150)}` };
    }

    const data = await res.json();
    return { success: true, text: (data.text || '').trim() };
  } catch (err) {
    return { success: false, error: 'OPENAI_EXCEPTION', message: `Lỗi OpenAI: ${err.message}` };
  }
}
