/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { QuizQuestion } from '../../types';
import { speechService } from '../../utils/speech';
import {
  Trophy,
  Award,
  CheckCircle,
  XCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Download,
  Volume2,
  VolumeX,
  Puzzle,
  ShieldCheck,
  Compass,
} from 'lucide-react';

interface GamesHubProps {
  quizzes: QuizQuestion[];
}

export const GamesHub: React.FC<GamesHubProps> = ({ quizzes }) => {
  const [selectedGame, setSelectedGame] = useState<
    'rung_chuong_vang' | 'ai_hieu_doi_hon' | 'hanh_trinh_khan_quang' | 'ghep_tranh' | 'tuyen_truyen_vien'
  >('rung_chuong_vang');

  // Quiz Play State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);

  // Certificate State
  const [studentName, setStudentName] = useState('');
  const [showCertificate, setShowCertificate] = useState(false);

  // Puzzle State for "Ghép Tranh Truyền Thống"
  const [puzzlePieces, setPuzzlePieces] = useState<number[]>([3, 1, 0, 2]);
  const [isPuzzleSolved, setIsPuzzleSolved] = useState(false);

  // Filter quizzes for the active game mode
  const gameQuizzes = quizzes.filter((q) => {
    if (selectedGame === 'rung_chuong_vang') return q.gameType === 'rung_chuong_vang' || q.gameType === 'ai_hieu_doi_hon';
    if (selectedGame === 'ai_hieu_doi_hon') return q.gameType === 'ai_hieu_doi_hon' || q.gradeLevel === 'thcs';
    if (selectedGame === 'hanh_trinh_khan_quang') return q.gameType === 'hanh_trinh_khan_quang' || q.gradeLevel === 'tieu_hoc';
    if (selectedGame === 'tuyen_truyen_vien') return q.gameType === 'tuyen_truyen_vien';
    return true;
  });

  const activeQuestion = gameQuizzes[currentQuestionIndex] || quizzes[0];

  const handleSelectOption = (index: number) => {
    if (isAnswerChecked) return;
    setSelectedOption(index);
    setIsAnswerChecked(true);

    const isCorrect = index === activeQuestion.correctIndex;
    if (isCorrect) {
      setScore((prev) => prev + 10);
      confetti({ particleCount: 30, spread: 60, origin: { y: 0.7 } });
      speechService.speak('Hoan hô bạn! Câu trả lời hoàn toàn chính xác.');
    } else {
      speechService.speak('Rất tiếc chưa chính xác, bạn hãy đọc phần giải thích nhé.');
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < gameQuizzes.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerChecked(false);
    } else {
      setIsQuizCompleted(true);
      confetti({ particleCount: 100, spread: 90, origin: { y: 0.6 } });
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setScore(0);
    setIsQuizCompleted(false);
    setShowCertificate(false);
  };

  // Swap pieces for Puzzle Game
  const handleSwapPuzzle = (index: number) => {
    if (isPuzzleSolved) return;
    const newPieces = [...puzzlePieces];
    const targetIdx = (index + 1) % 4;
    const temp = newPieces[index];
    newPieces[index] = newPieces[targetIdx];
    newPieces[targetIdx] = temp;
    setPuzzlePieces(newPieces);

    if (newPieces.every((val, idx) => val === idx)) {
      setIsPuzzleSolved(true);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      speechService.speak('Chúc mừng bạn đã hoàn thành bức tranh Huy hiệu Đội truyền thống!');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold uppercase tracking-wider">
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          <span>Sân Chơi Học Tập & Thi Đua Đội Viên</span>
        </div>
        <h1 className="font-serif text-3xl font-bold text-stone-900">
          ĐẤU TRƯỜNG KIẾN THỨC & TRẢI NGHIỆM ĐỘI VIÊN
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 max-w-2xl mx-auto">
          Cùng ôn luyện lịch sử Đội, Nghi thức Đội, 5 Điều Bác Hồ Dạy và kỹ năng sống để nhận Giấy Chứng Nhận Đội Viên Xuất Sắc.
        </p>
      </div>

      {/* 5 Game Mode Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {[
          { id: 'rung_chuong_vang', title: '1. Rung Chuông Vàng' },
          { id: 'ai_hieu_doi_hon', title: '2. Ai Hiểu Đội Hơn' },
          { id: 'hanh_trinh_khan_quang', title: '3. Khăn Quàng Đỏ' },
          { id: 'ghep_tranh', title: '4. Ghép Tranh Đội' },
          { id: 'tuyen_truyen_vien', title: '5. Em Là Tuyên Truyền' },
        ].map((tab) => {
          const isSelected = selectedGame === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedGame(tab.id as any);
                handleRestartQuiz();
              }}
              className={`p-3 rounded-xl text-xs font-bold transition-all text-center border ${
                isSelected
                  ? 'bg-red-600 border-red-600 text-white shadow-md'
                  : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
            >
              {tab.title}
            </button>
          );
        })}
      </div>

      {/* GAME 4: Ghép Tranh Truyền Thống */}
      {selectedGame === 'ghep_tranh' ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-6 shadow-xs text-center">
          <div>
            <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
              Trò Chơi Số 4: Ghép Tranh Biểu Trưng Đội
            </span>
            <h3 className="font-serif text-2xl font-bold text-stone-900 mt-1">
              Ghép Đúng Hình Ảnh Huy Hiệu Đội TNTP Hồ Chí Minh
            </h3>
            <p className="text-xs text-stone-600 mt-1">
              Bấm vào các mảnh ghép để hoán đổi vị trí sao cho hoàn chỉnh bức tranh búp măng non trên nền cờ đỏ sao vàng.
            </p>
          </div>

          <div className="max-w-xs mx-auto grid grid-cols-2 gap-2 aspect-square p-2 bg-stone-100 rounded-2xl border-2 border-dashed border-stone-300">
            {puzzlePieces.map((pieceNum, idx) => {
              const isCorrectPosition = pieceNum === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleSwapPuzzle(idx)}
                  className={`rounded-xl aspect-square flex flex-col items-center justify-center font-bold text-white transition-all shadow-sm ${
                    pieceNum === 0
                      ? 'bg-red-600'
                      : pieceNum === 1
                      ? 'bg-amber-500'
                      : pieceNum === 2
                      ? 'bg-emerald-600'
                      : 'bg-blue-600'
                  }`}
                >
                  <span className="text-3xl">
                    {pieceNum === 0 ? '★' : pieceNum === 1 ? '🌱' : pieceNum === 2 ? 'SẴN SÀNG' : '🇻🇳'}
                  </span>
                  <span className="text-[11px] mt-1 opacity-80">Mảnh số {pieceNum + 1}</span>
                </button>
              );
            })}
          </div>

          {isPuzzleSolved && (
            <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold max-w-sm mx-auto border border-emerald-200">
              🎉 Xuất sắc! Bạn đã ghép chính xác hình tượng Huy hiệu Đội với búp măng non và khẩu hiệu SẴN SÀNG!
            </div>
          )}

          <div className="flex justify-center gap-3">
            <button
              onClick={() => {
                setPuzzlePieces([3, 1, 0, 2]);
                setIsPuzzleSolved(false);
              }}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-colors inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Chơi Lại Tranh Ghép</span>
            </button>
          </div>
        </div>
      ) : (
        /* QUIZ GAME CONTAINER */
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-6 shadow-xs">
          {!isQuizCompleted ? (
            <div className="space-y-6">
              {/* Question Header */}
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-red-600 text-white font-bold text-xs flex items-center justify-center">
                    {currentQuestionIndex + 1}
                  </span>
                  <span className="text-xs text-stone-500">
                    Câu hỏi {currentQuestionIndex + 1} / {gameQuizzes.length}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs font-semibold">
                  <span className="text-stone-500">
                    Chủ đề: <span className="text-stone-900">{activeQuestion.category}</span>
                  </span>
                  <span className="bg-amber-100 text-amber-900 px-2.5 py-1 rounded-lg">
                    Điểm: {score}
                  </span>
                </div>
              </div>

              {/* Question Text */}
              <div className="space-y-1">
                <h3 className="font-serif text-xl font-bold text-stone-900 leading-snug">
                  {activeQuestion.question}
                </h3>
                {activeQuestion.historicalContext && (
                  <p className="text-xs text-stone-500 italic">
                    Gợi ý: {activeQuestion.historicalContext}
                  </p>
                )}
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeQuestion.options.map((option, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === activeQuestion.correctIndex;

                  let style = 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-200';
                  if (isAnswerChecked) {
                    if (isCorrect) {
                      style = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold';
                    } else if (isSelected) {
                      style = 'bg-red-50 border-red-400 text-red-900';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(idx)}
                      disabled={isAnswerChecked}
                      className={`p-4 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all flex items-start gap-3 ${style}`}
                    >
                      <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-800 text-xs font-bold flex items-center justify-center shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{option}</span>
                    </button>
                  );
                })}
              </div>

              {/* Explanation Card */}
              {isAnswerChecked && (
                <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Giải Thích Kiến Thức:</span>
                  </div>
                  <p className="text-stone-700 leading-relaxed">
                    {activeQuestion.explanation}
                  </p>
                </div>
              )}

              {/* Next Button */}
              {isAnswerChecked && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleNextQuestion}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    {currentQuestionIndex < gameQuizzes.length - 1 ? 'Câu Tiếp Theo →' : 'Xem Kết Quả & Nhận Chứng Nhận'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Quiz Completion & Certificate Award */
            <div className="text-center space-y-6 py-4">
              <div className="w-20 h-20 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto text-4xl shadow-inner">
                🏆
              </div>
              <div className="space-y-2">
                <h3 className="font-serif text-3xl font-bold text-stone-900">
                  CHÚC MỪNG BẠN ĐÃ HOÀN THÀNH XUẤT SẮC!
                </h3>
                <p className="text-sm text-stone-600">
                  Bạn đã đạt được <span className="font-bold text-red-600 text-base">{score}</span> điểm trong thử thách kiến thức Đội.
                </p>
              </div>

              {/* Student Name Input for Certificate */}
              <div className="max-w-md mx-auto bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-3">
                <label className="text-xs font-semibold text-stone-700 block">
                  Nhập họ và tên hoặc Chi đội của em để nhận Giấy Chứng Nhận:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="VD: Nguyễn Văn An - Chi đội 5A"
                    className="flex-1 px-3.5 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <button
                    onClick={() => {
                      if (!studentName.trim()) {
                        alert('Vui lòng nhập tên của em để ghi vào giấy chứng nhận nhé!');
                        return;
                      }
                      setShowCertificate(true);
                      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold whitespace-nowrap"
                  >
                    Cấp Chứng Nhận
                  </button>
                </div>
              </div>

              {/* Printable Certificate Preview */}
              {showCertificate && (
                <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-amber-50/50 border-4 border-amber-500 text-stone-900 shadow-xl space-y-4 text-center relative overflow-hidden">
                  <div className="flex items-center justify-center gap-2 text-red-700 font-bold text-xs uppercase tracking-widest">
                    <span>★ HỘI ĐỒNG ĐỘI – LIÊN ĐỘI TRƯỜNG TH & THCS CHIẾN THẮNG ★</span>
                  </div>
                  <h2 className="font-serif text-3xl font-black text-red-700">
                    GIẤY CHỨNG NHẬN
                  </h2>
                  <p className="text-xs uppercase tracking-widest font-bold text-amber-800">
                    DANH HIỆU: ĐỘI VIÊN THÔNG THÁI KỶ NGUYÊN SỐ
                  </p>
                  <p className="text-xs text-stone-600">Trao tặng cho:</p>
                  <p className="font-serif text-2xl font-bold text-stone-900 underline decoration-red-500 decoration-2">
                    {studentName}
                  </p>
                  <p className="text-xs text-stone-600 max-w-lg mx-auto leading-relaxed">
                    Đã hoàn thành xuất sắc các chặng thử thách kiến thức Lịch sử Đội TNTP Hồ Chí Minh, 5 Điều Bác Hồ Dạy và rèn luyện kỹ năng an toàn học đường.
                  </p>
                  <div className="pt-4 flex items-center justify-between text-xs text-stone-500 border-t border-amber-200">
                    <span>Xã Vũ Lễ, Tỉnh Lạng Sơn</span>
                    <span className="font-semibold text-stone-800">
                      Tổng phụ trách: Cô Lương Quỳnh Phương
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={handleRestartQuiz}
                  className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Chơi Lại Thử Thách</span>
                </button>
                {showCertificate && (
                  <button
                    onClick={() => window.print()}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>In / Tải Giấy Khen</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
