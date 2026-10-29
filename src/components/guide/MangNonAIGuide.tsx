/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { apiService } from '../../services/api';
import { speechService } from '../../utils/speech';
import {
  Sparkles,
  Send,
  X,
  Volume2,
  VolumeX,
  MessageSquare,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';

interface MangNonAIGuideProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoomTitle: string;
}

interface ChatMessage {
  sender: 'ai' | 'user';
  text: string;
  time: string;
}

export const MangNonAIGuide: React.FC<MangNonAIGuideProps> = ({
  isOpen,
  onClose,
  currentRoomTitle,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'ai',
      text: 'Xin chào các bạn! Mình là Măng Non AI – Hướng dẫn viên ảo của Trường Tiểu học và THCS Chiến Thắng. Chào mừng các bạn đến với không gian truyền thống Đội! Hôm nay, chúng mình cùng khám phá những câu chuyện lịch sử thật ý nghĩa nhé!',
      time: 'Vừa xong',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState<number | null>(null);

  const quickQuestions = [
    'Anh Kim Đồng hy sinh vào ngày nào?',
    'Năm Điều Bác Hồ dạy có ý nghĩa gì?',
    'Liên đội trường Chiến Thắng ở đâu?',
    'Năm đội viên đầu tiên của Đội là ai?',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputValue;
    if (!query.trim()) return;

    // Stop any existing speech before handling new message
    speechService.stop();
    setSpeakingMessageIndex(null);

    const userMsg: ChatMessage = {
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await apiService.chatWithGuide({
        message: query,
        currentRoomTitle,
      });

      const replyText = res.reply || 'Măng Non AI luôn đồng hành cùng các bạn trên con đường rèn luyện và học tập!';
      const aiMsg: ChatMessage = {
        sender: 'ai',
        text: replyText,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => {
        const next = [...prev, aiMsg];
        const newIndex = next.length - 1;
        // Automatically speak latest AI answer
        speechService.stop();
        speechService.speak(replyText, {
          title: 'Câu trả lời của Măng Non AI',
          onStart: () => setSpeakingMessageIndex(newIndex),
          onEnd: () => setSpeakingMessageIndex(null),
          onError: () => setSpeakingMessageIndex(null),
        });
        return next;
      });
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'Măng Non AI đang kiểm tra lại kết nối. Bạn có thể khám phá thêm các hiện vật tại phòng truyền thống nhé!',
          time: 'Vừa xong',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSpeech = (text: string, msgIndex: number) => {
    if (speechService.isSpeaking && speakingMessageIndex === msgIndex) {
      speechService.stop();
      setSpeakingMessageIndex(null);
    } else {
      speechService.stop();
      setSpeakingMessageIndex(msgIndex);
      speechService.speak(text, {
        title: 'Câu trả lời của Măng Non AI',
        onStart: () => setSpeakingMessageIndex(msgIndex),
        onEnd: () => setSpeakingMessageIndex(null),
        onError: () => setSpeakingMessageIndex(null),
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[92vw] max-w-sm sm:max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 flex flex-col h-[520px] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-red-600 to-amber-600 text-white flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-lg shadow-sm">
            🌱
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-serif font-bold text-sm tracking-tight">
                MĂNG NON AI
              </h3>
              <span className="text-[10px] bg-amber-400 text-red-900 px-1.5 py-0.2 rounded font-bold">
                HDV ẢO
              </span>
            </div>
            <p className="text-[11px] text-red-100">
              Trường TH & THCS Chiến Thắng – Xã Vũ Lễ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => speechService.stop()}
            title="Dừng giọng đọc"
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
          >
            <VolumeX className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-stone-50">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-red-600 text-white rounded-tr-none'
                  : 'bg-white text-stone-800 border border-stone-200 shadow-xs rounded-tl-none'
              }`}
            >
              {msg.text}
            </div>
            <div className="flex items-center gap-1.5 mt-1 px-1">
              <span className="text-[10px] text-stone-400">{msg.time}</span>
              {msg.sender === 'ai' && (
                <button
                  onClick={() => toggleSpeech(msg.text, idx)}
                  className={`flex items-center gap-1 text-[11px] font-medium transition-colors ${
                    speakingMessageIndex === idx
                      ? 'text-red-600 font-bold animate-pulse'
                      : 'text-stone-500 hover:text-red-600'
                  }`}
                  title={speakingMessageIndex === idx ? 'Dừng đọc' : 'Nghe đọc câu trả lời này'}
                >
                  <Volume2 className={`w-3.5 h-3.5 ${speakingMessageIndex === idx ? 'text-red-600' : 'text-stone-400'}`} />
                  <span>{speakingMessageIndex === idx ? 'Đang đọc...' : 'Nghe'}</span>
                </button>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-stone-200 text-xs text-stone-500 max-w-[70%]">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-bounce" />
            <span>Măng Non AI đang suy nghĩ...</span>
          </div>
        )}
      </div>

      {/* Suggested Quick Questions */}
      <div className="p-2.5 bg-white border-t border-stone-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {quickQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            className="px-2.5 py-1 text-[11px] bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg whitespace-nowrap transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-white border-t border-stone-200 flex items-center gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Hỏi Măng Non AI về lịch sử Đội, Bác Hồ..."
          className="flex-1 px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-stone-900"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={!inputValue.trim() || isLoading}
          className="p-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Safety Notice Footer */}
      <div className="px-4 py-1.5 bg-stone-100 text-[10px] text-stone-500 flex items-center justify-between border-t border-stone-200">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span>Nội dung chuẩn mực giáo dục thiếu nhi</span>
        </span>
        <span>Phụ trách: Cô Lương Quỳnh Phương</span>
      </div>
    </div>
  );
};
