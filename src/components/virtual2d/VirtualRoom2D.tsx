/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { VirtualRoom, Exhibit, PlaybackState } from '../../types';
import { speechService } from '../../utils/speech';
import { AudioControlBar } from '../audio/AudioControlBar';
import { AudioSettingsModal } from '../audio/AudioSettingsModal';
import { RoomAutoPromptModal } from '../audio/RoomAutoPromptModal';
import {
  Volume2,
  VolumeX,
  Compass,
  ArrowRight,
  BookOpen,
  Calendar,
  Award,
  Star,
  CheckCircle,
  HelpCircle,
  Layers,
  ChevronRight,
  ExternalLink,
  Settings,
} from 'lucide-react';

interface VirtualRoom2DProps {
  rooms: VirtualRoom[];
  selectedRoomId: string;
  onSelectRoom: (roomId: string) => void;
  onSwitchTo3D: () => void;
  onGoToPropaganda: () => void;
  onGoToGames: () => void;
}

export const VirtualRoom2D: React.FC<VirtualRoom2DProps> = ({
  rooms,
  selectedRoomId,
  onSelectRoom,
  onSwitchTo3D,
  onGoToPropaganda,
  onGoToGames,
}) => {
  const [playbackState, setPlaybackState] = useState<PlaybackState>(speechService.getState());
  const [showAutoPrompt, setShowAutoPrompt] = useState(false);
  const [isAudioSettingsOpen, setIsAudioSettingsOpen] = useState(false);
  const [selectedExhibit, setSelectedExhibit] = useState<Exhibit | null>(null);
  const [quizState, setQuizState] = useState<{ [key: string]: { selected: number; revealed: boolean } }>({});
  const lastPromptedRoomRef = useRef<string>('');

  const currentRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0];

  // Subscribe to speech service events
  useEffect(() => {
    const handleUpdate = (state: PlaybackState) => {
      setPlaybackState(state);
    };
    speechService.addListener(handleUpdate);
    return () => speechService.removeListener(handleUpdate);
  }, []);

  // Room change effect: stop old audio, check auto prompt
  useEffect(() => {
    speechService.stop();
    const prefs = speechService.getPreferences();
    if (prefs.autoPromptRoom && lastPromptedRoomRef.current !== currentRoom.id) {
      lastPromptedRoomRef.current = currentRoom.id;
      setShowAutoPrompt(true);
    }
  }, [currentRoom.id]);

  const handleSpeak = (text: string, title?: string) => {
    if (speechService.isSpeaking) {
      speechService.stop();
    } else {
      speechService.speak(text, {
        title: title || currentRoom.title,
      });
    }
  };

  const handleAnswerQuiz = (exhibitId: string, optionIndex: number) => {
    setQuizState((prev) => ({
      ...prev,
      [exhibitId]: { selected: optionIndex, revealed: true },
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Auto Prompt Modal */}
      <RoomAutoPromptModal
        isOpen={showAutoPrompt}
        roomNumber={currentRoom.roomNumber}
        roomTitle={currentRoom.title}
        onAccept={() => {
          setShowAutoPrompt(false);
          handleSpeak(currentRoom.audioNarrationText, currentRoom.title);
        }}
        onDismiss={() => setShowAutoPrompt(false)}
      />

      {/* Audio Settings Modal */}
      <AudioSettingsModal
        isOpen={isAudioSettingsOpen}
        onClose={() => setIsAudioSettingsOpen(false)}
      />

      {/* Header ribbon */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-widest">
              <Compass className="w-4 h-4" />
              <span>Phòng Trưng Bày Truyền Thống Đội 2D</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
              {currentRoom.title}
            </h1>
            <p className="text-sm text-stone-600 mt-1 max-w-3xl">
              {currentRoom.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleSpeak(currentRoom.audioNarrationText, currentRoom.title)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
                playbackState.isSpeaking
                  ? 'bg-amber-500 text-stone-900 shadow-sm'
                  : 'bg-red-600 hover:bg-red-700 text-white shadow-xs'
              }`}
            >
              {playbackState.isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-300" />}
              <span>{playbackState.isSpeaking ? 'Dừng Thuyết Minh' : 'Nghe Thuyết Minh Phòng'}</span>
            </button>

            <button
              onClick={onSwitchTo3D}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors shadow-sm"
            >
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Tham Quan 3D</span>
            </button>

            <button
              onClick={() => setIsAudioSettingsOpen(true)}
              className="p-2 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
              title="Cài đặt giọng đọc tiếng Việt"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dedicated Audio Control Bar */}
        <div className="pt-2 border-t border-stone-100">
          <AudioControlBar
            onOpenSettings={() => setIsAudioSettingsOpen(true)}
            className="w-full"
          />
        </div>
      </div>

      {/* Room Selection Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {rooms.map((room) => {
          const isSelected = room.id === currentRoom.id;
          return (
            <button
              key={room.id}
              onClick={() => onSelectRoom(room.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border ${
                isSelected
                  ? 'bg-red-600 border-red-600 text-white shadow-md'
                  : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full text-[11px] flex items-center justify-center font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                }`}
              >
                {room.roomNumber}
              </span>
              <span>{room.shortTitle}</span>
            </button>
          );
        })}
      </div>

      {/* Room Hero Spotlight Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-stone-900 border border-stone-200 shadow-sm min-h-[220px] flex items-end p-6 sm:p-8">
        <img
          src={currentRoom.coverImage}
          alt={currentRoom.title}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-35"
        />
        <div className="relative z-10 space-y-2 max-w-3xl">
          <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">
            Không Gian Số {currentRoom.roomNumber}
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white leading-tight">
            {currentRoom.shortTitle}
          </h2>
          <p className="text-sm text-stone-200 leading-relaxed">
            {currentRoom.description}
          </p>
        </div>
      </div>

      {/* Room 2 Special Timeline: Lịch sử Đội TNTP */}
      {currentRoom.roomNumber === 2 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900">
            <Calendar className="w-4 h-4 text-amber-700" />
            <span>Dòng Thời Gian Lịch Sử Đội Thiếu Niên Tiền Phong Hồ Chí Minh</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-amber-200/80 shadow-xs">
              <span className="text-xs font-bold text-red-600 block">15/05/1941</span>
              <h4 className="font-semibold text-sm text-stone-900 mt-1">Đội Nhi đồng Cứu quốc</h4>
              <p className="text-xs text-stone-600 mt-1">
                Thành lập tại thôn Nà Mạ, Cao Bằng với 5 đội viên đầu tiên do anh Kim Đồng làm đội trưởng.
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-amber-200/80 shadow-xs">
              <span className="text-xs font-bold text-red-600 block">Tháng 3/1951</span>
              <h4 className="font-semibold text-sm text-stone-900 mt-1">Đội Thiếu nhi Tháng Tám</h4>
              <p className="text-xs text-stone-600 mt-1">
                Đổi tên theo dấu mốc Cách mạng Tháng Tám hào hùng của dân tộc.
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-amber-200/80 shadow-xs">
              <span className="text-xs font-bold text-red-600 block">Tháng 11/1956</span>
              <h4 className="font-semibold text-sm text-stone-900 mt-1">Đội Thiếu niên Tiền phong</h4>
              <p className="text-xs text-stone-600 mt-1">
                Quy định nghi thức, huy hiệu măng non và bài hát Đội ca chính thức.
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-amber-200/80 shadow-xs">
              <span className="text-xs font-bold text-red-600 block">30/01/1970 - Nay</span>
              <h4 className="font-semibold text-sm text-stone-900 mt-1">Đội TNTP Hồ Chí Minh</h4>
              <p className="text-xs text-stone-600 mt-1">
                Vinh dự mang tên Chủ tịch Hồ Chí Minh vĩ đại, mở ra chặng đường vẻ vang.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Room 3 Special Interactive Cards: Năm Điều Bác Hồ Dạy */}
      {currentRoom.roomNumber === 3 && (
        <div className="bg-red-50/50 border border-red-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-900">
            <Award className="w-4 h-4 text-red-600" />
            <span>Thẻ Học Tập Tương Tác: Năm Điều Bác Hồ Dạy Thiếu Nhi</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              {
                num: 1,
                title: 'Yêu Tổ quốc, yêu đồng bào',
                detail: 'Biết ơn công lao cha anh, yêu làng quê Vũ Lễ, giúp đỡ bạn bè cùng tiến.',
              },
              {
                num: 2,
                title: 'Học tập tốt, lao động tốt',
                detail: 'Hăng hái phát biểu, làm bài đầy đủ, chăm chỉ lao động vệ sinh trường lớp.',
              },
              {
                num: 3,
                title: 'Đoàn kết tốt, kỷ luật tốt',
                detail: 'Chấp hành nghiêm nội quy, không gây gổ, luôn chan hòa cùng bè bạn.',
              },
              {
                num: 4,
                title: 'Giữ gìn vệ sinh thật tốt',
                detail: 'Rửa tay sạch sẽ, bảo vệ cảnh quan trường lớp xanh, sạch, đẹp.',
              },
              {
                num: 5,
                title: 'Khiêm tốn, thật thà, dũng cảm',
                detail: 'Không tự kiêu, thật thà trong học tập, dũng cảm nhận khuyết điểm.',
              },
            ].map((d) => (
              <div key={d.num} className="bg-white p-4 rounded-xl border border-red-200 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="w-6 h-6 rounded-full bg-red-600 text-white font-bold text-xs flex items-center justify-center mb-2">
                    {d.num}
                  </span>
                  <h4 className="font-serif font-bold text-sm text-stone-900 mb-1">
                    {d.title}
                  </h4>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    {d.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Room Exhibits Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <h3 className="font-serif text-xl font-bold text-stone-900">
            Hiện Vật & Tư Liệu Trưng Bày ({currentRoom.exhibits.length})
          </h3>
          <span className="text-xs text-stone-500">
            Nhấn vào từng hiện vật để xem bài học & kiểm tra kiến thức
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentRoom.exhibits.map((exhibit) => {
            const quizInfo = quizState[exhibit.id];
            return (
              <div
                key={exhibit.id}
                className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Exhibit Image */}
                  <div className="relative aspect-video bg-stone-100 overflow-hidden">
                    <img
                      src={exhibit.imageUrl}
                      alt={exhibit.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur text-white text-[10px] font-semibold px-2 py-0.5 rounded">
                      {exhibit.category}
                    </div>
                  </div>

                  {/* Body text */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h4 className="font-serif text-base font-bold text-stone-900 leading-snug">
                        {exhibit.title}
                      </h4>
                      {exhibit.subtitle && (
                        <p className="text-xs font-medium text-red-600 mt-0.5">
                          {exhibit.subtitle}
                        </p>
                      )}
                    </div>

                    <p className="text-xs text-stone-600 leading-relaxed line-clamp-3">
                      {exhibit.summary}
                    </p>

                    {/* Key points */}
                    {exhibit.keyPoints && exhibit.keyPoints.length > 0 && (
                      <div className="bg-stone-50 rounded-xl p-3 border border-stone-100 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                          Ghi nhớ nhanh:
                        </span>
                        <ul className="text-xs text-stone-700 space-y-1">
                          {exhibit.keyPoints.slice(0, 2).map((pt, pIdx) => (
                            <li key={pIdx} className="flex items-start gap-1.5">
                              <span className="text-red-600 font-bold text-[10px]">★</span>
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Interactive Quiz in card */}
                    {exhibit.interactiveQuiz && (
                      <div className="pt-2 border-t border-stone-100 space-y-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-red-800">
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>Câu hỏi tương tác:</span>
                        </div>
                        <p className="text-xs font-medium text-stone-800">
                          {exhibit.interactiveQuiz.question}
                        </p>
                        <div className="grid grid-cols-1 gap-1.5">
                          {exhibit.interactiveQuiz.options.map((opt, oIdx) => {
                            const isRevealed = quizInfo?.revealed;
                            const isSelected = quizInfo?.selected === oIdx;
                            const isCorrect = oIdx === exhibit.interactiveQuiz!.answerIndex;

                            let optClass = 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200';
                            if (isRevealed) {
                              if (isCorrect) {
                                optClass = 'bg-emerald-50 text-emerald-900 border-emerald-400 font-medium';
                              } else if (isSelected) {
                                optClass = 'bg-red-50 text-red-900 border-red-300';
                              }
                            }

                            return (
                              <button
                                key={oIdx}
                                onClick={() => handleAnswerQuiz(exhibit.id, oIdx)}
                                className={`text-left text-xs px-3 py-1.5 rounded-lg border transition-colors ${optClass}`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                        {quizInfo?.revealed && (
                          <p className="text-[11px] text-stone-600 italic mt-1">
                            {exhibit.interactiveQuiz.explanation}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card footer */}
                <div className="px-5 py-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() => handleSpeak(exhibit.audioNarrationText || exhibit.detailedContent, exhibit.title)}
                    className="text-stone-700 hover:text-red-700 font-semibold inline-flex items-center gap-1"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>Nghe kể</span>
                  </button>

                  <span className="text-[10px] text-stone-400">
                    {exhibit.verifiedSource ? 'Tư liệu xác thực' : 'Đang cập nhật'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Action Navigation Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
        <div
          onClick={onGoToPropaganda}
          className="bg-red-600 text-white rounded-2xl p-6 cursor-pointer hover:bg-red-700 transition-colors shadow-sm flex items-center justify-between group"
        >
          <div>
            <span className="text-xs uppercase tracking-wider text-red-200 font-bold block mb-1">
              Tính Năng Trọng Tâm Số 1
            </span>
            <h4 className="font-serif text-xl font-bold">Trung Tâm Tuyên Truyền Măng Non</h4>
            <p className="text-xs text-red-100 mt-1">
              Bản tin tuần, phát thanh AI tiếng Việt và công cụ AI soạn bài tuyên truyền
            </p>
          </div>
          <ArrowRight className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform shrink-0" />
        </div>

        <div
          onClick={onGoToGames}
          className="bg-stone-900 text-white rounded-2xl p-6 cursor-pointer hover:bg-stone-800 transition-colors shadow-sm flex items-center justify-between group"
        >
          <div>
            <span className="text-xs uppercase tracking-wider text-amber-400 font-bold block mb-1">
              Sân Chơi Thi Đua
            </span>
            <h4 className="font-serif text-xl font-bold">5 Trò Chơi Trắc Nghiệm Tương Tác</h4>
            <p className="text-xs text-stone-300 mt-1">
              Rung chuông vàng, Ghép tranh truyền thống, Nhận Giấy Chứng Nhận Đội Viên
            </p>
          </div>
          <ArrowRight className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform shrink-0" />
        </div>
      </div>
    </div>
  );
};
