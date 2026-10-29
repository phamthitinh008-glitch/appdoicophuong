/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { speechService, TTSPreferences, PlaybackState } from '../../utils/speech';
import {
  Volume2,
  Settings,
  Sparkles,
  CheckCircle,
  X,
  Play,
  RotateCcw,
  Sliders,
  Check,
} from 'lucide-react';

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [prefs, setPrefs] = useState<TTSPreferences>(speechService.getPreferences());
  const [playbackState, setPlaybackState] = useState<PlaybackState>(speechService.getState());
  const [testStatus, setTestStatus] = useState<string | null>(null);

  useEffect(() => {
    const handleUpdate = (state: PlaybackState) => {
      setPlaybackState(state);
    };
    speechService.addListener(handleUpdate);
    return () => speechService.removeListener(handleUpdate);
  }, []);

  if (!isOpen) return null;

  const handleUpdateEngine = (engine: 'online' | 'device') => {
    const updated = { ...prefs, engine };
    setPrefs(updated);
    speechService.savePreferences(updated);
  };

  const handleUpdateRate = (rate: number) => {
    const updated = { ...prefs, rate };
    setPrefs(updated);
    speechService.savePreferences(updated);
  };

  const handleUpdateVolume = (volume: number) => {
    const updated = { ...prefs, volume };
    setPrefs(updated);
    speechService.savePreferences(updated);
  };

  const handleToggleAutoPrompt = () => {
    const updated = { ...prefs, autoPromptRoom: !prefs.autoPromptRoom };
    setPrefs(updated);
    speechService.savePreferences(updated);
  };

  const handleTestSpeech = () => {
    setTestStatus('Đang phát giọng đọc thử nghiệm...');
    speechService.speak(
      'Xin chào quý thầy cô và các em học sinh! Chúc các em có một buổi tham quan phòng truyền thống Đội thật bổ ích và nhiều niềm vui!',
      {
        title: 'Nghe thử giọng đọc Tiếng Việt',
        onEnd: () => setTestStatus('✓ Hoàn thành nghe thử!'),
        onError: () => setTestStatus('Lỗi khi nghe thử.'),
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-sm shadow-red-200">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900 leading-tight">
                Cài Đặt Giọng Đọc & Âm Thanh
              </h3>
              <p className="text-[11px] text-stone-500">
                Tùy chỉnh giọng thuyết minh tiếng Việt chuẩn giáo dục
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              speechService.stop();
              onClose();
            }}
            className="p-1.5 text-stone-400 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Setting 1: Nguồn phát âm thanh */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
            Nguồn Phát Âm Tiếng Việt
          </label>
          <div className="grid grid-cols-1 gap-2.5">
            {/* Option A: Online Google Vietnamese Voice */}
            <div
              onClick={() => handleUpdateEngine('online')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                prefs.engine === 'online'
                  ? 'bg-red-50/70 border-red-500 shadow-xs'
                  : 'bg-white border-stone-200 hover:border-stone-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                  prefs.engine === 'online'
                    ? 'border-red-600 bg-red-600 text-white'
                    : 'border-stone-300 bg-white'
                }`}
              >
                {prefs.engine === 'online' && <Check className="w-3.5 h-3.5" />}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-stone-900">
                    Giọng Tiếng Việt Chuẩn Trực Tuyến
                  </span>
                  <span className="text-[10px] bg-red-100 text-red-800 font-bold px-1.5 py-0.2 rounded">
                    Khuyên dùng
                  </span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Phát âm tiếng Việt chuẩn xác từng dấu, ngữ điệu nữ truyền cảm, tự nhiên, hoạt động ổn định trên 100% điện thoại và máy tính.
                </p>
              </div>
            </div>

            {/* Option B: Device Speech Voice */}
            <div
              onClick={() => handleUpdateEngine('device')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                prefs.engine === 'device'
                  ? 'bg-red-50/70 border-red-500 shadow-xs'
                  : 'bg-white border-stone-200 hover:border-stone-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                  prefs.engine === 'device'
                    ? 'border-red-600 bg-red-600 text-white'
                    : 'border-stone-300 bg-white'
                }`}
              >
                {prefs.engine === 'device' && <Check className="w-3.5 h-3.5" />}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-stone-900">
                    Giọng Đọc Thiết Bị (Web Speech)
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      playbackState.hasDeviceViVoice
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    {playbackState.hasDeviceViVoice ? 'Đã tìm thấy giọng Việt' : 'Thiết bị chưa có giọng Việt'}
                  </span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Sử dụng giọng đọc tích hợp sẵn trên máy (Google Tiếng Việt, Microsoft Hoài My...). Nếu thiết bị không có giọng Việt, hệ thống sẽ tự động dùng giọng trực tuyến để tuyệt đối không đọc tiếng Anh.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Setting 2: Tốc độ đọc */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-stone-700 uppercase tracking-wider">
              Tốc Độ Thuyết Minh
            </span>
            <span className="font-bold text-red-600">{prefs.rate}x</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[0.75, 0.9, 1.0, 1.2].map((r) => (
              <button
                key={r}
                onClick={() => handleUpdateRate(r)}
                className={`py-2 text-xs font-bold rounded-xl border transition-colors ${
                  Math.abs(prefs.rate - r) < 0.05
                    ? 'bg-red-600 border-red-600 text-white shadow-xs'
                    : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                {r === 0.9 ? '0.9x (Chuẩn)' : `${r}x`}
              </button>
            ))}
          </div>
        </div>

        {/* Setting 3: Âm lượng */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-stone-700 uppercase tracking-wider">
              Âm Lượng
            </span>
            <span className="font-bold text-stone-900">{Math.round(prefs.volume * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={prefs.volume}
            onChange={(e) => handleUpdateVolume(parseFloat(e.target.value))}
            className="w-full accent-red-600 cursor-pointer"
          />
        </div>

        {/* Setting 4: Tự động hỏi phát thuyết minh khi vào phòng */}
        <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
          <div>
            <span className="text-xs font-bold text-stone-900 block">
              Hỏi thuyết minh khi vào phòng mới
            </span>
            <span className="text-[11px] text-stone-500 block">
              Gợi ý học sinh nghe lời giới thiệu tự động khi chuyển phòng
            </span>
          </div>
          <button
            onClick={handleToggleAutoPrompt}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
              prefs.autoPromptRoom ? 'bg-red-600 justify-end' : 'bg-stone-300 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
          </button>
        </div>

        {/* Test Speech Action */}
        <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleTestSpeech}
            className="w-full sm:w-auto px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold inline-flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Nghe Thử Giọng Tiếng Việt</span>
          </button>

          {testStatus && (
            <span className="text-xs text-stone-600 italic">
              {testStatus}
            </span>
          )}

          <button
            onClick={() => {
              speechService.stop();
              onClose();
            }}
            className="w-full sm:w-auto px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors ml-auto"
          >
            Xong & Áp Dụng
          </button>
        </div>
      </div>
    </div>
  );
};
