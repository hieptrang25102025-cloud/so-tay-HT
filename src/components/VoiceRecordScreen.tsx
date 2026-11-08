import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  HelpCircle, 
  Mic, 
  Pause, 
  Play, 
  Check, 
  Keyboard, 
  Volume2, 
  Loader2, 
  AlertCircle, 
  RefreshCw, 
  Sparkles, 
  Settings,
  FileAudio
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { parseVoiceInput } from '../services/speechParser';
import { audioRecorder, getOptimalMimeType } from '../services/audioRecorder';
import { transcribeAudioOnBackend } from '../services/sttService';

interface VoiceRecordScreenProps {
  onConfirm: () => void;
  onOpenManualEntry: () => void;
  onBack: () => void;
  onOpenSettings?: () => void;
}

type AudioState = 
  | 'READY'                 // Sẵn sàng ghi âm
  | 'REQUESTING_PERMISSION' // Đang xin quyền micro
  | 'RECORDING'             // Đang ghi âm
  | 'PAUSED'                // Đang tạm dừng
  | 'PROCESSING'            // Đang xử lý giọng nói
  | 'SUCCESS'               // Nhận diện thành công
  | 'ERROR';                // Có lỗi và hướng dẫn khắc phục

export const VoiceRecordScreen: React.FC<VoiceRecordScreenProps> = ({
  onConfirm,
  onOpenManualEntry,
  onBack,
  onOpenSettings
}) => {
  const { materials, setVoiceDraft } = useApp();

  const [audioState, setAudioState] = useState<AudioState>('READY');
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [liveVolume, setLiveVolume] = useState<number>(0);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [detectedFormat, setDetectedFormat] = useState<string>('');

  const timerRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const webSpeechTranscriptRef = useRef<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Detect supported audio format on device mount
  useEffect(() => {
    const fmt = getOptimalMimeType();
    setDetectedFormat(fmt || 'Định dạng chuẩn iPhone / Android');
  }, []);

  // Timer counter when recording
  useEffect(() => {
    if (audioState === 'RECORDING') {
      timerRef.current = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [audioState]);

  // Start recording using MediaRecorder + optional Web Speech live preview
  const handleStartRecording = async () => {
    setErrorMessage(null);

    // If browser doesn't support MediaRecorder directly (e.g. Safari over HTTP Wi-Fi)
    if (!audioRecorder.isSupported()) {
      setAudioState('READY');
      setErrorMessage(
        'Safari trên iPhone giới hạn thu âm trực tiếp qua Wi-Fi HTTP. Bạn hãy bấm nút "⌨ Nói bằng Micro bàn phím iPhone" bên dưới nhé (cực chuẩn và tiện nhất)!'
      );
      // Auto focus textarea so keyboard with mic appears
      setTimeout(() => textareaRef.current?.focus(), 300);
      return;
    }

    setAudioState('REQUESTING_PERMISSION');
    webSpeechTranscriptRef.current = '';

    try {
      // 1. Start Cross-platform MediaRecorder
      const mime = await audioRecorder.start((volume) => {
        setLiveVolume(volume);
      });
      setDetectedFormat(mime);
      setAudioState('RECORDING');
      setTimerSeconds(0);

      // 2. Start Web Speech API as concurrent live preview if supported
      initConcurrentWebSpeech();
    } catch (err: any) {
      setAudioState('ERROR');
      const isHttp = window.location.protocol === 'http:';
      if (isHttp && /iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        setErrorMessage(
          'Safari trên iPhone cần bảo mật HTTPS để mở Micro trực tiếp. Bạn chỉ cần bấm vào ô nhập bên dưới và bấm nút Micro trên bàn phím iPhone để nói nhé!'
        );
      } else {
        setErrorMessage(err.message || 'Không thể truy cập Micro.');
      }
    }
  };

  // Concurrent Web Speech API helper for live instant text preview
  const initConcurrentWebSpeech = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'vi-VN';

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript.trim()) {
            webSpeechTranscriptRef.current = currentTranscript.trim();
            setRecognizedText(currentTranscript.trim());
          }
        };

        recognition.onerror = () => {
          // Silent fallback: MediaRecorder handles the heavy lifting
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch {}
    }
  };

  // Stop Web Speech API
  const stopConcurrentWebSpeech = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
  };

  // Pause recording
  const handlePause = () => {
    if (audioState === 'RECORDING') {
      audioRecorder.pause();
      stopConcurrentWebSpeech();
      setAudioState('PAUSED');
    }
  };

  // Resume recording
  const handleResume = () => {
    if (audioState === 'PAUSED') {
      audioRecorder.resume();
      setAudioState('RECORDING');
      initConcurrentWebSpeech();
    }
  };

  // Stop recording and send audio to Backend Speech-to-Text
  const handleStopAndTranscribe = async () => {
    stopConcurrentWebSpeech();
    setAudioState('PROCESSING');
    setLiveVolume(0);

    try {
      const audioResult = await audioRecorder.stop();

      // Send to Backend STT
      const response = await transcribeAudioOnBackend({
        audioBase64: audioResult.base64,
        mimeType: audioResult.mimeType
      });

      if (response.success && response.text) {
        setRecognizedText(response.text);
        setAudioState('SUCCESS');
      } else {
        if (webSpeechTranscriptRef.current) {
          setRecognizedText(webSpeechTranscriptRef.current);
          setAudioState('SUCCESS');
        } else {
          setAudioState('ERROR');
          setErrorMessage(response.error || 'Dịch vụ nhận diện không trả về kết quả.');
        }
      }
    } catch (err: any) {
      if (webSpeechTranscriptRef.current) {
        setRecognizedText(webSpeechTranscriptRef.current);
        setAudioState('SUCCESS');
      } else {
        setAudioState('ERROR');
        setErrorMessage(err.message || 'Lỗi khi xử lý âm thanh.');
      }
    }
  };

  // Handle native audio file (strictly audio/*, no video!)
  const handleNativeAudioFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAudioState('PROCESSING');
    setErrorMessage(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(',')[1];
        const mimeType = file.type || 'audio/mp4';

        const response = await transcribeAudioOnBackend({
          audioBase64: base64,
          mimeType: mimeType
        });

        if (response.success && response.text) {
          setRecognizedText(response.text);
          setAudioState('SUCCESS');
        } else {
          setAudioState('ERROR');
          setErrorMessage(response.error || 'Dịch vụ nhận diện không phản hồi.');
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setAudioState('ERROR');
      setErrorMessage(err.message || 'Lỗi khi đọc file âm thanh.');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleFocusTextarea = () => {
    textareaRef.current?.focus();
  };

  const handleConfirm = () => {
    if (!recognizedText.trim()) {
      alert('Vui lòng nói hoặc nhập nội dung trước khi xác nhận.');
      return;
    }
    const parsed = parseVoiceInput(recognizedText.trim(), materials);
    setVoiceDraft(parsed);
    onConfirm();
  };

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex flex-col justify-between px-4 pb-20 pt-1 max-w-md mx-auto w-full min-h-[92vh]">
      {/* Hidden Native Audio Input - ONLY AUDIO, NO VIDEO CAMERA */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleNativeAudioFile}
      />

      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between py-2 border-b border-[#22334A]/50">
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-white hover:text-[#C5A66A] transition-colors flex items-center"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="text-center">
            <h2 className="text-base font-bold text-white tracking-wide">
              Ghi nhanh bằng giọng nói
            </h2>
            <span className="text-[10px] text-[#8E9EB2] block font-mono">
              Trợ lý thông minh SỔ TAY HT
            </span>
          </div>
          <button
            onClick={() => setShowHelpModal(true)}
            className="p-2 -mr-2 text-[#94A3B8] hover:text-[#C5A66A] transition-colors"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Central Audio Recording Interface */}
        <div className="flex flex-col items-center justify-center pt-5 pb-2">
          <div className="relative flex items-center justify-center">
            {/* Ambient Wave Rings when active */}
            {audioState === 'RECORDING' && (
              <>
                <div 
                  className="absolute rounded-full border border-[#3B82F6]/30 animate-ping duration-1000"
                  style={{
                    width: `${160 + liveVolume * 60}px`,
                    height: `${160 + liveVolume * 60}px`
                  }}
                />
                <div 
                  className="absolute rounded-full border border-[#C5A66A]/40 animate-pulse duration-700"
                  style={{
                    width: `${130 + liveVolume * 40}px`,
                    height: `${130 + liveVolume * 40}px`
                  }}
                />
              </>
            )}

            {/* Glowing Center Microphone Button */}
            <button
              onClick={() => {
                if (audioState === 'READY' || audioState === 'SUCCESS' || audioState === 'ERROR') {
                  handleStartRecording();
                } else if (audioState === 'RECORDING' || audioState === 'PAUSED') {
                  handleStopAndTranscribe();
                }
              }}
              disabled={audioState === 'REQUESTING_PERMISSION' || audioState === 'PROCESSING'}
              className={`relative z-10 w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
                audioState === 'RECORDING'
                  ? 'bg-gradient-to-b from-[#2B4E80] to-[#172235] border-2 border-[#60A5FA] shadow-[#2563EB]/50 scale-105'
                  : audioState === 'PROCESSING'
                  ? 'bg-[#1E293B] border-2 border-[#C5A66A] animate-pulse'
                  : 'bg-[#1E293B] border-2 border-[#475569] hover:border-[#C5A66A] active:scale-95'
              }`}
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#1E3A8A] to-[#3B82F6] flex items-center justify-center text-white shadow-inner">
                {audioState === 'PROCESSING' ? (
                  <Loader2 className="w-9 h-9 text-[#C5A66A] animate-spin" />
                ) : (
                  <Mic className={`w-9 h-9 text-white ${audioState === 'RECORDING' ? 'animate-pulse' : ''}`} />
                )}
              </div>
            </button>
          </div>

          {/* Dynamic Status Label */}
          <div className="text-center mt-3">
            {audioState === 'READY' && (
              <span className="text-sm font-semibold text-white/90">
                Chạm micro để nói trực tiếp
              </span>
            )}
            {audioState === 'REQUESTING_PERMISSION' && (
              <span className="text-sm font-semibold text-[#38BDF8] flex items-center justify-center space-x-1.5">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang kết nối Micro...</span>
              </span>
            )}
            {audioState === 'RECORDING' && (
              <span className="text-sm font-bold text-[#10B981] flex items-center justify-center space-x-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                <span>Đang ghi âm... Chạm micro khi nói xong</span>
              </span>
            )}
            {audioState === 'PAUSED' && (
              <span className="text-sm font-semibold text-[#F59E0B]">
                Đang tạm dừng ghi âm
              </span>
            )}
            {audioState === 'PROCESSING' && (
              <span className="text-sm font-bold text-[#C5A66A] flex items-center justify-center space-x-1.5">
                <Loader2 className="w-4 h-4 animate-spin text-[#C5A66A]" />
                <span>AI Gemini đang nhận diện giọng nói...</span>
              </span>
            )}
            {audioState === 'SUCCESS' && (
              <span className="text-sm font-bold text-[#10B981] flex items-center justify-center space-x-1">
                <Sparkles className="w-4 h-4 text-[#C5A66A]" />
                <span>Nhận diện thành công!</span>
              </span>
            )}
            {audioState === 'ERROR' && (
              <span className="text-sm font-bold text-[#EF4444] flex items-center justify-center space-x-1">
                <AlertCircle className="w-4 h-4" />
                <span>Thông báo hướng dẫn</span>
              </span>
            )}
          </div>

          {/* Example Hint */}
          <p className="text-xs text-[#94A3B8] text-center max-w-[320px] mt-1 italic">
            Ví dụ: "Hôm nay gắn cho anh Tuấn 2 sợi dây CORO A123..."
          </p>

          {/* Live Timer */}
          <div className="text-base font-bold font-mono text-white mt-1 tracking-wider">
            {formatTimer(timerSeconds)}
          </div>

          {/* Pause / Resume Controls during active recording */}
          {(audioState === 'RECORDING' || audioState === 'PAUSED') && (
            <div className="flex items-center space-x-2 mt-2">
              {audioState === 'RECORDING' ? (
                <button
                  onClick={handlePause}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-[#1A2638] border border-[#2E415E] text-xs font-semibold text-white hover:border-[#C5A66A] transition-all"
                >
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Tạm dừng</span>
                </button>
              ) : (
                <button
                  onClick={handleResume}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-[#1A2638] border border-[#2E415E] text-xs font-semibold text-white hover:border-[#C5A66A] transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Tiếp tục</span>
                </button>
              )}

              <button
                onClick={handleStopAndTranscribe}
                className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-gold-gradient text-[#121A29] text-xs font-bold shadow-sm"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Hoàn tất nói</span>
              </button>
            </div>
          )}

          {/* Dynamic Audio Waveform Visualizer */}
          <div className="flex items-center justify-center space-x-1 w-full max-w-xs h-6 mt-2 px-4">
            {[4, 8, 14, 22, 18, 10, 20, 28, 22, 16, 26, 30, 20, 12, 18, 24, 14, 6, 10, 4].map((baseHeight, i) => {
              const dynamicHeight = audioState === 'RECORDING'
                ? Math.max(4, baseHeight * (0.3 + liveVolume * 1.8 + Math.sin(timerSeconds * 3 + i) * 0.2))
                : 4;

              return (
                <div
                  key={i}
                  className="w-1 bg-gradient-to-t from-[#C5A66A] to-[#DFBE82] rounded-full transition-all duration-75"
                  style={{
                    height: `${Math.min(24, dynamicHeight)}px`,
                    opacity: audioState === 'RECORDING' ? (0.6 + liveVolume * 0.4) : 0.25
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Helpful Hint Card on iOS Safari over HTTP */}
      {errorMessage && (
        <div className="bg-[#1A2638] border border-[#3B82F6]/40 rounded-2xl p-3.5 space-y-2 mb-2 text-xs text-slate-200 shadow-lg">
          <div className="flex items-start space-x-2">
            <Mic className="w-4 h-4 text-[#C5A66A] shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold text-white block">Mẹo tiện lợi trên iPhone:</span>
              <p className="mt-0.5 text-[#94A3B8] leading-relaxed">
                {errorMessage}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[#22334A]">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1.5 rounded-lg bg-[#22334A] text-slate-200 font-semibold text-xs flex items-center space-x-1 hover:bg-[#2D425E]"
            >
              <FileAudio className="w-3.5 h-3.5 text-[#C5A66A]" />
              <span>Chọn file ghi âm</span>
            </button>

            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="px-2.5 py-1.5 rounded-lg bg-[#1E293B] text-[#C5A66A] font-semibold text-xs flex items-center space-x-1"
              >
                <Settings className="w-3 h-3" />
                <span>Cài đặt</span>
              </button>
            )}

            <button
              onClick={handleFocusTextarea}
              className="px-3 py-1.5 rounded-lg bg-gold-gradient text-[#121A29] font-bold text-xs flex items-center space-x-1 shadow-sm"
            >
              <Keyboard className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Mở bàn phím nói ngay</span>
            </button>
          </div>
        </div>
      )}

      {/* Recognized Content Card & Actions */}
      <div className="space-y-3 pt-1">
        <div 
          onClick={handleFocusTextarea}
          className="bg-[#172235] border border-[#22334A] rounded-2xl p-3.5 space-y-1.5 shadow-md cursor-pointer hover:border-[#C5A66A]/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#94A3B8]">
              Nội dung (Nói qua micro hoặc gõ tại đây):
            </span>
            <span className="text-[10px] text-[#C5A66A] flex items-center space-x-1 font-medium">
              <Mic className="w-3 h-3" />
              <span>Bấm micro bàn phím để nói</span>
            </span>
          </div>
          <textarea
            ref={textareaRef}
            value={recognizedText}
            onChange={(e) => setRecognizedText(e.target.value)}
            rows={2}
            className="w-full bg-transparent text-sm font-medium text-white focus:outline-none resize-none leading-relaxed placeholder-[#475569]"
            placeholder="Chạm vào đây và bấm Micro trên bàn phím để nói..."
          />
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {/* Gold button: Xác nhận */}
          <button
            onClick={handleConfirm}
            disabled={!recognizedText.trim() || audioState === 'PROCESSING'}
            className="w-full bg-gold-gradient text-[#121A29] rounded-2xl py-3.5 px-6 flex items-center justify-center space-x-2 font-bold tracking-wide shadow-gold-button hover:brightness-105 active:scale-98 transition-all disabled:opacity-40"
          >
            <Check className="w-5 h-5 stroke-[2.5]" />
            <span>Xác nhận giao dịch</span>
          </button>

          {/* Outlined button: Nói nhanh bằng Micro bàn phím iPhone */}
          <button
            onClick={handleFocusTextarea}
            className="w-full bg-[#1A2638] border border-[#2E415E] text-[#DFBE82] rounded-2xl py-3 px-6 flex items-center justify-center space-x-2 font-semibold text-sm hover:border-[#C5A66A] active:scale-98 transition-all"
          >
            <Mic className="w-4 h-4 text-[#C5A66A]" />
            <span>Nói bằng Micro bàn phím điện thoại</span>
          </button>
        </div>
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#172235] border border-[#2E415E] rounded-3xl p-5 max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Volume2 className="w-5 h-5 text-[#C5A66A]" />
              <span>Hướng dẫn giọng nói trên iPhone</span>
            </h3>
            <div className="text-xs text-[#CBD5E1] space-y-2.5 leading-relaxed">
              <p className="font-semibold text-white">Cách nói nhanh và tiện nhất trên iPhone:</p>
              <div className="bg-[#0F172A] p-3 rounded-xl border border-[#22334A] space-y-1.5 text-[#94A3B8]">
                <p>1. Bấm vào nút <strong className="text-white">"Nói bằng Micro bàn phím"</strong>.</p>
                <p>2. Chạm vào ô nhập văn bản để bàn phím hiện lên.</p>
                <p>3. Bấm vào <strong className="text-[#C5A66A]">biểu tượng Micro ở góc dưới bàn phím iPhone</strong> để nói tiếng Việt.</p>
                <p>4. Bấm <strong className="text-[#DFBE82]">"Xác nhận giao dịch"</strong> để trừ kho tự động!</p>
              </div>
              <p className="text-[11px] text-[#8E9EB2]">
                Khi ứng dụng được đưa lên hosting có bảo mật HTTPS (tên miền chính thức), Micro trên trang web sẽ mở trực tiếp mà không cần qua bàn phím.
              </p>
            </div>
            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 rounded-xl bg-gold-gradient text-[#121A29] font-bold text-xs"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
