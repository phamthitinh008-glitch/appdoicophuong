/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { normalizeVietnameseSpeechText } from './vietnameseSpeechNormalizer';

export interface TTSPreferences {
  engine: 'online' | 'device';
  rate: number;
  volume: number;
  autoPromptRoom: boolean;
}

export interface PlaybackState {
  isSpeaking: boolean;
  isPaused: boolean;
  currentText: string;
  normalizedText: string;
  title: string;
  engineUsed: 'online' | 'device';
  rate: number;
  hasDeviceViVoice: boolean;
  availableVoices: SpeechSynthesisVoice[];
}

const PREFS_STORAGE_KEY = 'mangnon_tts_prefs_v1';

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private viVoices: SpeechSynthesisVoice[] = [];
  private listeners: Set<(state: PlaybackState) => void> = new Set();

  private state: PlaybackState = {
    isSpeaking: false,
    isPaused: false,
    currentText: '',
    normalizedText: '',
    title: '',
    engineUsed: 'online',
    rate: 0.95,
    hasDeviceViVoice: false,
    availableVoices: [],
  };

  private prefs: TTSPreferences = {
    engine: 'online', // Default to crystal-clear authentic Vietnamese online voice
    rate: 0.95,
    volume: 1.0,
    autoPromptRoom: true,
  };

  constructor() {
    this.loadPreferences();

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.initVoices();
      if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
        window.speechSynthesis.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private loadPreferences() {
    try {
      const raw = localStorage.getItem(PREFS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.prefs = { ...this.prefs, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to load TTS prefs:', e);
    }
  }

  public savePreferences(newPrefs: Partial<TTSPreferences>) {
    this.prefs = { ...this.prefs, ...newPrefs };
    try {
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(this.prefs));
    } catch (e) {
      console.warn('Failed to save TTS prefs:', e);
    }
    this.notifyState();
  }

  public getPreferences(): TTSPreferences {
    return { ...this.prefs };
  }

  private initVoices() {
    if (!this.synth) return;
    try {
      const voices = this.synth.getVoices();
      this.viVoices = voices.filter(
        (v) =>
          v.lang.toLowerCase().startsWith('vi') ||
          v.lang.toLowerCase().includes('vie') ||
          v.name.toLowerCase().includes('vietnam') ||
          v.name.toLowerCase().includes('tiếng việt') ||
          v.name.toLowerCase().includes('hoaimy') ||
          v.name.toLowerCase().includes('namminh') ||
          v.name.toLowerCase().includes('linh')
      );
      this.state.hasDeviceViVoice = this.viVoices.length > 0;
      this.state.availableVoices = voices;
      this.notifyState();
    } catch (e) {
      console.warn('Failed to query voices:', e);
    }
  }

  public addListener(listener: (state: PlaybackState) => void) {
    this.listeners.add(listener);
    listener(this.getState());
  }

  public removeListener(listener: (state: PlaybackState) => void) {
    this.listeners.delete(listener);
  }

  private notifyState() {
    const currentState = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(currentState);
      } catch (err) {
        console.error('Error in speech listener:', err);
      }
    });
  }

  public getState(): PlaybackState {
    return { ...this.state };
  }

  public get isSpeaking(): boolean {
    return this.state.isSpeaking;
  }

  public get isPaused(): boolean {
    return this.state.isPaused;
  }

  /**
   * Dừng toàn bộ âm thanh đang phát ngay lập tức
   */
  public stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    if (this.synth) {
      this.synth.cancel();
    }
    this.currentUtterance = null;
    this.state.isSpeaking = false;
    this.state.isPaused = false;
    this.notifyState();
  }

  /**
   * Tạm dừng âm thanh đang phát
   */
  public pause(): void {
    if (!this.state.isSpeaking || this.state.isPaused) return;

    if (this.currentAudio) {
      this.currentAudio.pause();
      this.state.isPaused = true;
      this.notifyState();
      return;
    }

    if (this.synth && this.synth.speaking) {
      this.synth.pause();
      this.state.isPaused = true;
      this.notifyState();
    }
  }

  /**
   * Tiếp tục phát âm thanh sau khi tạm dừng
   */
  public resume(): void {
    if (!this.state.isSpeaking || !this.state.isPaused) return;

    if (this.currentAudio) {
      this.currentAudio.play().catch((err) => {
        console.warn('Failed to resume audio:', err);
      });
      this.state.isPaused = false;
      this.notifyState();
      return;
    }

    if (this.synth && this.synth.paused) {
      this.synth.resume();
      this.state.isPaused = false;
      this.notifyState();
    }
  }

  /**
   * Nghe lại từ đầu câu thuyết minh hiện tại
   */
  public replay(): void {
    const text = this.state.currentText;
    const title = this.state.title;
    if (text) {
      this.speak(text, { title });
    }
  }

  /**
   * Thay đổi tốc độ đọc khi đang phát
   */
  public setRate(newRate: number): void {
    this.prefs.rate = newRate;
    this.state.rate = newRate;
    this.savePreferences({ rate: newRate });

    if (this.currentAudio) {
      this.currentAudio.playbackRate = newRate;
    }
    this.notifyState();
  }

  /**
   * Phát âm thanh nội dung văn bản tiếng Việt
   * BẢO ĐẢM 100%: Tuyệt đối không dùng giọng tiếng Anh để đọc tiếng Việt!
   */
  public speak(
    rawText: string,
    options?: {
      title?: string;
      rate?: number;
      audioDataUrl?: string;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    }
  ): void {
    // 1. Dừng mọi tác vụ âm thanh đang phát trước đó để không bị phát chồng
    this.stop();

    if (!rawText || !rawText.trim()) return;

    // 2. Chuẩn hóa tiếng Việt (loại bỏ markdown, mở rộng ngày tháng, từ viết tắt)
    const normalized = normalizeVietnameseSpeechText(rawText);
    if (!normalized) return;

    const rate = options?.rate ?? this.prefs.rate ?? 0.95;
    const title = options?.title || 'Thuyết minh';

    this.state.currentText = rawText;
    this.state.normalizedText = normalized;
    this.state.title = title;
    this.state.rate = rate;

    // 3. Nếu người dùng chọn giọng thiết bị (Web Speech) VÀ thiết bị THỰC SỰ có giọng tiếng Việt:
    const wantsDevice = this.prefs.engine === 'device';
    const canUseDeviceVi = wantsDevice && this.viVoices.length > 0;

    if (canUseDeviceVi && this.synth) {
      this.speakViaDevice(normalized, rate, options);
      return;
    }

    // 4. Mặc định hoặc khi thiết bị KHÔNG CÓ giọng tiếng Việt:
    // Dùng dịch vụ phát thanh tiếng Việt chuẩn trực tuyến từ máy chủ (Google Tiếng Việt).
    this.speakViaOnlineStream(normalized, rate, options);
  }

  /**
   * Phát thông qua dịch vụ Stream âm thanh Tiếng Việt từ server
   */
  private speakViaOnlineStream(
    normalizedText: string,
    rate: number,
    options?: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    }
  ) {
    this.state.engineUsed = 'online';
    const streamUrl = `/api/tts/stream?text=${encodeURIComponent(normalizedText)}`;

    try {
      const audio = new Audio(streamUrl);
      audio.playbackRate = rate;
      audio.volume = this.prefs.volume;
      this.currentAudio = audio;

      audio.onplay = () => {
        this.state.isSpeaking = true;
        this.state.isPaused = false;
        this.notifyState();
        if (options?.onStart) options.onStart();
      };

      audio.onended = () => {
        this.state.isSpeaking = false;
        this.state.isPaused = false;
        this.currentAudio = null;
        this.notifyState();
        if (options?.onEnd) options.onEnd();
      };

      audio.onerror = (e) => {
        console.warn('Online stream failed, attempting device fallback if Vietnamese voice exists:', e);
        this.currentAudio = null;

        // Chỉ thử Web Speech nếu máy có giọng tiếng Việt thực sự, TUYỆT ĐỐI không đọc bằng tiếng Anh!
        if (this.viVoices.length > 0) {
          this.speakViaDevice(normalizedText, rate, options);
        } else {
          this.state.isSpeaking = false;
          this.state.isPaused = false;
          this.notifyState();
          if (options?.onError) {
            options.onError('Không thể kết nối đến máy chủ âm thanh tiếng Việt.');
          }
        }
      };

      audio.play().catch((err) => {
        console.warn('Audio play was interrupted or blocked by browser policy:', err);
        // Autoplay may need user gesture
        this.state.isSpeaking = false;
        this.state.isPaused = false;
        this.notifyState();
      });
    } catch (err) {
      console.error('Audio initialization error:', err);
      if (options?.onError) options.onError(err);
    }
  }

  /**
   * Phát thông qua Web Speech API khi thiết bị CÓ GIỌNG TIẾNG VIỆT
   */
  private speakViaDevice(
    normalizedText: string,
    rate: number,
    options?: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    }
  ) {
    if (!this.synth) {
      this.speakViaOnlineStream(normalizedText, rate, options);
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(normalizedText);
      utterance.lang = 'vi-VN';
      utterance.rate = rate;
      utterance.pitch = 1.0;
      utterance.volume = this.prefs.volume;

      // Ưu tiên chọn giọng tiếng Việt được tìm thấy
      if (this.viVoices.length > 0) {
        // Ưu tiên giọng nữ nhẹ nhàng nếu có (Google Tiếng Việt, HoaiMy, Linh)
        const femaleViVoice = this.viVoices.find(
          (v) =>
            v.name.toLowerCase().includes('hoaimy') ||
            v.name.toLowerCase().includes('linh') ||
            v.name.toLowerCase().includes('female') ||
            v.name.toLowerCase().includes('tiếng việt')
        );
        utterance.voice = femaleViVoice || this.viVoices[0];
      } else {
        // CẢNH BÁO: Không có giọng tiếng Việt thì chuyển sang online, KHÔNG BAO GIỜ đọc tiếng Anh!
        console.warn('No Vietnamese voice in device, redirecting to Online Vietnamese Voice');
        this.speakViaOnlineStream(normalizedText, rate, options);
        return;
      }

      this.state.engineUsed = 'device';

      utterance.onstart = () => {
        this.state.isSpeaking = true;
        this.state.isPaused = false;
        this.notifyState();
        if (options?.onStart) options.onStart();
      };

      utterance.onend = () => {
        this.state.isSpeaking = false;
        this.state.isPaused = false;
        this.currentUtterance = null;
        this.notifyState();
        if (options?.onEnd) options.onEnd();
      };

      utterance.onerror = (err) => {
        console.warn('Web Speech error, switching to online stream:', err);
        this.currentUtterance = null;
        this.speakViaOnlineStream(normalizedText, rate, options);
      };

      this.currentUtterance = utterance;
      this.synth.speak(utterance);
    } catch (err) {
      console.warn('Web Speech failed, fallback to online stream:', err);
      this.speakViaOnlineStream(normalizedText, rate, options);
    }
  }
}

export const speechService = new SpeechService();
