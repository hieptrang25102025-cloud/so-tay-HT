/**
 * SỔ TAY HT - CROSS-PLATFORM AUDIO RECORDER SERVICE
 * Hỗ trợ ghi âm đa nền tảng: iPhone Safari/Chrome, Android Samsung/Chrome, Desktop Edge/Chrome.
 */

export interface AudioRecordingResult {
  blob: Blob;
  base64: string;
  mimeType: string;
  durationSeconds: number;
}

export type RecorderState = 
  | 'IDLE' 
  | 'REQUESTING_PERMISSION' 
  | 'RECORDING' 
  | 'PAUSED' 
  | 'PROCESSING' 
  | 'SUCCESS' 
  | 'ERROR';

/**
 * Detect the optimal supported audio MIME type across iOS Safari, Android, and Desktop
 */
export function getOptimalMimeType(): string {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    return 'audio/webm';
  }

  const candidateMimeTypes = [
    // Standard Chromium / Android / Desktop (high quality Opus)
    'audio/webm;codecs=opus',
    'audio/webm',
    // Apple iOS Safari (modern versions support mp4 or webm)
    'audio/mp4',
    'audio/aac',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/wav'
  ];

  for (const type of candidateMimeTypes) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return ''; // Browser default
}

export class CrossPlatformAudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  private mimeType: string = '';
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private animFrameId: number | null = null;
  private onVolumeChange?: (volume: number) => void;

  /**
   * Check if recording is supported on this browser
   */
  public isSupported(): boolean {
    return !!(
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function' &&
      typeof MediaRecorder !== 'undefined'
    );
  }

  /**
   * Request microphone permission and start recording
   */
  public async start(onVolume?: (volume: number) => void): Promise<string> {
    this.onVolumeChange = onVolume;
    this.audioChunks = [];

    if (!this.isSupported()) {
      throw new Error('Trình duyệt của bạn không hỗ trợ MediaRecorder. Vui lòng sử dụng Chrome, Safari hoặc Edge phiên bản mới.');
    }

    // Determine MIME type
    this.mimeType = getOptimalMimeType();

    try {
      // Cross-platform audio constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1
        }
      });

      this.audioStream = stream;

      // Initialize real-time volume visualizer
      this.initVisualizer(stream);

      // Create MediaRecorder instance
      const options: MediaRecorderOptions = {};
      if (this.mimeType) {
        options.mimeType = this.mimeType;
      }

      const recorder = new MediaRecorder(stream, options);
      this.mediaRecorder = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Request data chunks every 1000ms for continuous streaming
      recorder.start(1000);

      return this.mimeType || recorder.mimeType || 'audio/webm';
    } catch (err: any) {
      this.cleanup();
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        throw new Error('Bạn chưa cấp quyền Micro. Vui lòng nhấn vào biểu tượng ổ khóa hoặc cài đặt trình duyệt để CHO PHÉP truy cập Micro.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        throw new Error('Không tìm thấy thiết bị Micro. Vui lòng cắm hoặc kiểm tra lại Micro.');
      } else if (err.name === 'NotReadableError') {
        throw new Error('Micro đang bị một ứng dụng khác chiếm quyền sử dụng.');
      }
      throw new Error(`Không thể khởi động Micro: ${err.message || err.name}`);
    }
  }

  /**
   * Pause recording
   */
  public pause(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
    }
  }

  /**
   * Resume recording
   */
  public resume(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
    }
  }

  /**
   * Stop recording and package into final audio blob & base64
   */
  public async stop(): Promise<AudioRecordingResult> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('Chưa có phiên ghi âm nào đang chạy.'));
        return;
      }

      const recorder = this.mediaRecorder;

      recorder.onstop = async () => {
        try {
          const finalType = this.mimeType || recorder.mimeType || 'audio/webm';
          const audioBlob = new Blob(this.audioChunks, { type: finalType });

          // Convert to base64
          const base64 = await this.blobToBase64(audioBlob);

          this.cleanup();

          resolve({
            blob: audioBlob,
            base64,
            mimeType: finalType,
            durationSeconds: 0
          });
        } catch (e) {
          this.cleanup();
          reject(e);
        }
      };

      if (recorder.state !== 'inactive') {
        recorder.stop();
      } else {
        recorder.onstop(new Event('stop'));
      }
    });
  }

  /**
   * Realtime Volume Visualizer Analyzer
   */
  private initVisualizer(stream: MediaStream): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      this.audioContext = audioCtx;
      this.analyserNode = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateVolume = () => {
        if (!this.analyserNode) return;
        this.analyserNode.getByteFrequencyData(dataArray);

        // Calculate average volume (0 to 1)
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(1, avg / 128);

        if (this.onVolumeChange) {
          this.onVolumeChange(normalized);
        }

        this.animFrameId = requestAnimationFrame(updateVolume);
      };

      updateVolume();
    } catch (e) {
      console.warn('AudioContext visualization not available:', e);
    }
  }

  private cleanup(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }
    this.mediaRecorder = null;
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Strip data:audio/xyz;base64, prefix
        const base64 = result.split(',')[1] || result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

export const audioRecorder = new CrossPlatformAudioRecorder();
