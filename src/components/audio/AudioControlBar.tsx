/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { speechService, PlaybackState } from '../../utils/speech';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Settings,
  X,
} from 'lucide-react';

interface AudioControlBarProps {
  onOpenSettings?: () => void;
  className?: string;
  compact?: boolean;
}

export const AudioControlBar: React.FC<AudioControlBarProps> = ({
  onOpenSettings,
  className = '',
  compact = false,
}) => {
  const [playbackState, setPlaybackState] = useState<PlaybackState>(speechService.getState());

  useEffect(() => {
    const handleUpdate = (state: PlaybackState) => {
      setPlaybackState(state);
    };
    speechService.addListener(handleUpdate);
    return () => speechService.removeListener(handleUpdate);
  }, []);

  if (!playbackState.isSpeaking && !playbackState.isPaused) {
    return null;
  }

  const rates = [0.75, 0.9, 1.0, 1.2];

  return (
    <div
      className={`bg-stone-900/95 backdrop-blur-md text-white border border-stone-700/80 rounded-2xl p-3 sm:p-4 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200 ${className}`}
    >
      {/* Left: Status info and animated voice indicator */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-red-600/90 text-white flex items-center justify-center shrink-0 shadow-sm shadow-red-900/50">
          <Volume2 className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/50">
              {playbackState.engineUsed === 'online' ? 'Giọng Tiếng Việt chuẩn' : 'Giọng Thiết Bị'}
            </span>
            <span className="text-xs text-stone-400">
              {playbackState.isPaused ? 'Đã tạm dừng' : 'Đang thuyết minh...'}
            </span>
          </div>
          <p className="text-xs font-semibold text-stone-200 truncate mt-0.5 max-w-xs sm:max-w-md">
            {playbackState.title || playbackState.currentText.slice(0, 45) + '...'}
          </p>
        </div>
      </div>

      {/* Center & Right: Player controls */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-stone-800">
        {/* Play/Pause Button */}
        {playbackState.isPaused ? (
          <button
            onClick={() => speechService.resume()}
            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 text-xs font-bold"
            title="Tiếp tục nghe"
          >
            <Play className="w-4 h-4 fill-white" />
            <span className="hidden sm:inline">Tiếp tục</span>
          </button>
        ) : (
          <button
            onClick={() => speechService.pause()}
            className="p-2 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 text-xs font-bold"
            title="Tạm dừng"
          >
            <Pause className="w-4 h-4 fill-stone-950" />
            <span className="hidden sm:inline">Tạm dừng</span>
          </button>
        )}

        {/* Replay Button */}
        <button
          onClick={() => speechService.replay()}
          className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-xl transition-colors text-xs flex items-center gap-1"
          title="Nghe lại từ đầu"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">Nghe lại</span>
        </button>

        {/* Stop Button */}
        <button
          onClick={() => speechService.stop()}
          className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-xl transition-colors text-xs flex items-center gap-1"
          title="Dừng thuyết minh"
        >
          <Square className="w-4 h-4" />
          <span className="hidden sm:inline">Dừng</span>
        </button>

        {/* Speed Multiplier Pills */}
        <div className="flex items-center gap-1 bg-stone-950/80 p-1 rounded-xl border border-stone-800">
          {rates.map((r) => {
            const isSelected = Math.abs(playbackState.rate - r) < 0.05;
            return (
              <button
                key={r}
                onClick={() => speechService.setRate(r)}
                className={`px-2 py-0.5 text-[11px] font-bold rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                }`}
              >
                {r}x
              </button>
            );
          })}
        </div>

        {/* Settings button if provided */}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-xl transition-colors"
            title="Cài đặt âm thanh"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}

        {/* Close Button */}
        <button
          onClick={() => speechService.stop()}
          className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800"
          title="Đóng thanh điều khiển"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
