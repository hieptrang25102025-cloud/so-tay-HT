/**
 * SỔ TAY HT - SPEECH-TO-TEXT CLIENT SERVICE
 * Gửi âm thanh lên Backend để chuyển thành văn bản tiếng Việt chính xác.
 */

export interface STTConfig {
  provider: 'gemini' | 'groq' | 'openai';
  apiKey: string;
}

// Khóa API mặc định đọc từ biến môi trường Vite (nếu có cấu hình)
export const DEFAULT_GEMINI_API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';

const STORAGE_KEY_STT = 'so_tay_ht_stt_config_v1';

export function getStoredSTTConfig(): STTConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STT);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        provider: parsed.provider || 'gemini',
        apiKey: parsed.apiKey || DEFAULT_GEMINI_API_KEY
      };
    }
  } catch {}
  return {
    provider: 'gemini',
    apiKey: DEFAULT_GEMINI_API_KEY
  };
}

export function saveStoredSTTConfig(config: STTConfig): void {
  localStorage.setItem(STORAGE_KEY_STT, JSON.stringify(config));
}

export async function transcribeAudioOnBackend(params: {
  audioBase64: string;
  mimeType: string;
}): Promise<{ success: boolean; text?: string; error?: string }> {
  const config = getStoredSTTConfig();
  const apiBase = ((import.meta as any).env?.VITE_API_URL || '').replace(/\/+$/, '');

  try {
    const res = await fetch(`${apiBase}/api/transcribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        audioBase64: params.audioBase64,
        mimeType: params.mimeType,
        apiKey: config.apiKey || DEFAULT_GEMINI_API_KEY || '',
        provider: config.provider || 'gemini'
      })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.message || data.error || 'Dịch vụ nhận diện giọng nói không phản hồi.'
      };
    }

    return {
      success: true,
      text: data.text || ''
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Lỗi kết nối Backend STT: ${err.message}`
    };
  }
}
