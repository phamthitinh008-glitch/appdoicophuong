/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Volume2, Sparkles, X, ArrowRight } from 'lucide-react';

interface RoomAutoPromptModalProps {
  isOpen: boolean;
  roomTitle: string;
  roomNumber: number;
  onAccept: () => void;
  onDismiss: () => void;
}

export const RoomAutoPromptModal: React.FC<RoomAutoPromptModalProps> = ({
  isOpen,
  roomTitle,
  roomNumber,
  onAccept,
  onDismiss,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-40 max-w-sm w-[92vw] bg-white rounded-2xl shadow-2xl border border-stone-200 p-4 animate-in fade-in slide-in-from-top-4 duration-200">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-red-200">
          <Sparkles className="w-5 h-5 text-amber-300" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">
              HƯỚNG DẪN VIÊN MĂNG NON AI
            </span>
            <button
              onClick={onDismiss}
              className="text-stone-400 hover:text-stone-700 p-0.5 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs font-semibold text-stone-900 leading-snug">
            Bạn có muốn nghe Măng Non AI giới thiệu căn phòng này không?
          </p>
          <p className="text-[11px] text-stone-500">
            Phòng {roomNumber}: {roomTitle}
          </p>

          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={onAccept}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Bắt Đầu Nghe</span>
            </button>
            <button
              onClick={onDismiss}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Để sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
