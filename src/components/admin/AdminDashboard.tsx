/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppDatabase, VirtualRoom, Exhibit, PropagandaPost, QuizQuestion, EventItem } from '../../types';
import { apiService } from '../../services/api';
import {
  Shield,
  Save,
  RotateCcw,
  Sparkles,
  Layers,
  FileText,
  Calendar,
  HelpCircle,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  Lock,
  LogOut,
  Building,
  UserCheck,
} from 'lucide-react';

interface AdminDashboardProps {
  database: AppDatabase;
  onUpdateDatabase: (newDb: AppDatabase) => void;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  database,
  onUpdateDatabase,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'school' | 'rooms' | 'posts' | 'events' | 'quizzes' | 'batch_ai' | 'backup' | 'vercel'
  >('overview');

  const [dbState, setDbState] = useState<AppDatabase>(database);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Batch AI Generator State
  const [batchType, setBatchType] = useState<'propaganda' | 'questions'>('propaganda');
  const [batchCount, setBatchCount] = useState<number>(5);
  const [batchTopic, setBatchTopic] = useState('An toàn học đường và văn hóa giao thông');
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchGeneratedCount, setBatchGeneratedCount] = useState<number | null>(null);

  // Save changes to persistent server & local database
  const handleSaveChanges = async (updatedDb?: AppDatabase) => {
    setIsSaving(true);
    setSaveMessage(null);
    const targetDb = updatedDb || dbState;
    try {
      const res = await apiService.saveDatabase(targetDb);
      onUpdateDatabase(targetDb);
      setSaveMessage(res.message || 'Đã lưu thay đổi thành công vào cơ sở dữ liệu thật.');
    } catch (e: any) {
      setSaveMessage('Lỗi khi lưu dữ liệu: ' + (e.message || 'Lỗi mạng'));
    } finally {
      setIsSaving(false);
    }
  };

  // Run Batch AI Generator (Section 8.5)
  const handleRunBatchAi = async () => {
    setIsBatchGenerating(true);
    setBatchGeneratedCount(null);
    try {
      const res = await apiService.generateBatch({
        batchType,
        count: batchCount,
        topic: batchTopic,
      });

      if (res.data && Array.isArray(res.data)) {
        if (batchType === 'questions') {
          const newQuizzes: QuizQuestion[] = res.data.map((q: any, idx: number) => ({
            id: 'q_batch_' + Date.now() + '_' + idx,
            category: q.category || 'Lịch sử Đội',
            gameType: 'rung_chuong_vang',
            gradeLevel: q.gradeLevel || 'chung',
            difficulty: q.difficulty || 'trung_binh',
            question: q.question,
            options: q.options || ['A', 'B', 'C', 'D'],
            correctIndex: q.correctIndex ?? 0,
            explanation: q.explanation || 'Kiến thức chuẩn theo Điều lệ Đội.',
          }));

          const updated = {
            ...dbState,
            quizzes: [...dbState.quizzes, ...newQuizzes],
          };
          setDbState(updated);
          await handleSaveChanges(updated);
          setBatchGeneratedCount(newQuizzes.length);
        } else {
          const newPosts: PropagandaPost[] = res.data.map((p: any, idx: number) => ({
            id: 'post_batch_' + Date.now() + '_' + idx,
            title: p.title || 'Bài tuyên truyền măng non',
            topicId: 'chude_custom',
            topicName: batchTopic,
            targetAudience: p.targetAudience || 'all',
            formatType: p.formatType || 'bai_doc',
            durationMinutes: p.durationMinutes || 5,
            excerpt: p.excerpt || (p.mainContent ? p.mainContent.slice(0, 100) + '...' : ''),
            openingMessage: p.openingMessage || '',
            mainContent: p.mainContent || '',
            educationalScenario: p.educationalScenario || '',
            interactiveQuestions: p.interactiveQuestions || [],
            closingMessage: p.closingMessage || '',
            createdAt: new Date().toISOString().split('T')[0],
            author: 'Cô Lương Quỳnh Phương (AI Bản Nháp)',
            status: 'draft', // All in draft status as strictly required by prompt
          }));

          const updated = {
            ...dbState,
            propagandaPosts: [...dbState.propagandaPosts, ...newPosts],
          };
          setDbState(updated);
          await handleSaveChanges(updated);
          setBatchGeneratedCount(newPosts.length);
        }
      }
    } catch (e: any) {
      alert('Lỗi tạo hàng loạt bằng AI: ' + (e.message || 'Lỗi mạng'));
    } finally {
      setIsBatchGenerating(false);
    }
  };

  // Export JSON Database
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dbState, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `mang_non_chien_thang_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON Database
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.schoolSettings && json.virtualRooms) {
          setDbState(json);
          await handleSaveChanges(json);
          alert('Đã phục hồi dữ liệu từ tệp JSON thành công!');
        } else {
          alert('Tệp JSON không đúng cấu trúc cơ sở dữ liệu của ứng dụng.');
        }
      } catch (err) {
        alert('Lỗi đọc tệp JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-stone-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest">
            <Shield className="w-4 h-4" />
            <span>Khu Vực Quản Trị – Bản Quyền Nội Dung</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold">
            BÀN LÀM VIỆC CÔ LƯƠNG QUỲNH PHƯƠNG
          </h1>
          <p className="text-xs sm:text-sm text-stone-300">
            Giáo viên Tổng phụ trách Đội · Liên đội Trường Tiểu học và THCS Chiến Thắng (Xã Vũ Lễ, Lạng Sơn)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSaveChanges()}
            disabled={isSaving}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Đang Ghi Vào CSDL...' : 'LƯU DỮ LIỆU THẬT'}</span>
          </button>

          <button
            onClick={onLogout}
            className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng Xuất</span>
          </button>
        </div>
      </div>

      {saveMessage && (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Tabs Menu */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'overview', label: 'Tổng Quan', icon: Shield },
          { id: 'school', label: 'Thông Tin Trường', icon: Building },
          { id: 'batch_ai', label: 'Tạo Hàng Loạt Bằng AI', icon: Sparkles, highlight: true },
          { id: 'posts', label: 'Bản Tin & Tuyên Truyền', icon: FileText },
          { id: 'events', label: 'Lịch Sự Kiện & Phong Trào', icon: Calendar },
          { id: 'quizzes', label: 'Ngân Hàng Câu Hỏi Trò Chơi', icon: HelpCircle },
          { id: 'backup', label: 'Sao Lưu & Khôi Phục', icon: Download },
          { id: 'vercel', label: 'Hướng Dẫn Vercel', icon: ExternalLink },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                isSelected
                  ? 'bg-red-600 text-white shadow-sm'
                  : tab.highlight
                  ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                  : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ===================== TAB 1: OVERVIEW ===================== */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-2">
            <span className="text-xs font-bold text-stone-500 uppercase">Phòng Trưng Bày</span>
            <div className="text-3xl font-serif font-bold text-stone-900">
              {dbState.virtualRooms.length} Phòng
            </div>
            <p className="text-xs text-stone-500">Đầy đủ 8 không gian 3D/2D</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-2">
            <span className="text-xs font-bold text-stone-500 uppercase">Bài Tuyên Truyền</span>
            <div className="text-3xl font-serif font-bold text-red-600">
              {dbState.propagandaPosts.length} Bài
            </div>
            <p className="text-xs text-stone-500">
              {dbState.propagandaPosts.filter((p) => p.status === 'published').length} đã duyệt ·{' '}
              {dbState.propagandaPosts.filter((p) => p.status === 'draft').length} bản nháp
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-2">
            <span className="text-xs font-bold text-stone-500 uppercase">Ngân Hàng Câu Hỏi</span>
            <div className="text-3xl font-serif font-bold text-amber-600">
              {dbState.quizzes.length} Câu
            </div>
            <p className="text-xs text-stone-500">Sẵn sàng cho 5 trò chơi</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-2">
            <span className="text-xs font-bold text-stone-500 uppercase">Kho Tư Liệu Số</span>
            <div className="text-3xl font-serif font-bold text-blue-600">
              {dbState.mediaLibrary.length} Mục
            </div>
            <p className="text-xs text-stone-500">Hình ảnh, video & phóng sự</p>
          </div>
        </div>
      )}

      {/* ===================== TAB 2: THÔNG TIN TRƯỜNG ===================== */}
      {activeTab === 'school' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-5 shadow-xs">
          <h3 className="font-serif text-lg font-bold text-stone-900">
            Cấu Hình Thông Tin Đơn Vị & Phụ Trách
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">Tên Trường</label>
              <input
                type="text"
                value={dbState.schoolSettings.schoolName}
                onChange={(e) =>
                  setDbState({
                    ...dbState,
                    schoolSettings: { ...dbState.schoolSettings, schoolName: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">Tên Liên Đội</label>
              <input
                type="text"
                value={dbState.schoolSettings.unionName}
                onChange={(e) =>
                  setDbState({
                    ...dbState,
                    schoolSettings: { ...dbState.schoolSettings, unionName: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">Địa bàn / Xã</label>
              <input
                type="text"
                value={dbState.schoolSettings.commune}
                onChange={(e) =>
                  setDbState({
                    ...dbState,
                    schoolSettings: { ...dbState.schoolSettings, commune: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">Tỉnh / Thành phố</label>
              <input
                type="text"
                value={dbState.schoolSettings.province}
                onChange={(e) =>
                  setDbState({
                    ...dbState,
                    schoolSettings: { ...dbState.schoolSettings, province: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">Người phụ trách nội dung</label>
              <input
                type="text"
                value={dbState.schoolSettings.managerName}
                onChange={(e) =>
                  setDbState({
                    ...dbState,
                    schoolSettings: { ...dbState.schoolSettings, managerName: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">Chức vụ</label>
              <input
                type="text"
                value={dbState.schoolSettings.managerRole}
                onChange={(e) =>
                  setDbState({
                    ...dbState,
                    schoolSettings: { ...dbState.schoolSettings, managerRole: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-stone-700 block mb-1">Khẩu hiệu Liên đội</label>
              <input
                type="text"
                value={dbState.schoolSettings.slogan}
                onChange={(e) =>
                  setDbState({
                    ...dbState,
                    schoolSettings: { ...dbState.schoolSettings, slogan: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 3: NÚT ĐẶC BIỆT TẠO HÀNG LOẠT BẰNG AI (Section 8.5) ===================== */}
      {activeTab === 'batch_ai' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-6 shadow-xs">
          <div className="p-4 bg-gradient-to-r from-amber-500 to-red-600 rounded-2xl text-white space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-200">
              Tính Năng Đặc Biệt Dành Riêng Cho Giáo Viên
            </span>
            <h2 className="font-serif text-2xl font-bold">
              TẠO NHIỀU NỘI DUNG TỰ ĐỘNG BẰNG AI
            </h2>
            <p className="text-xs text-white/90">
              Tạo tự động 5, 10 hoặc 20 bản nháp bài tuyên truyền hoặc câu hỏi trắc nghiệm Đội. Tất cả nội dung sẽ được lưu ở trạng thái bản nháp để Cô Lương Quỳnh Phương kiểm tra và duyệt trước khi công bố.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Loại nội dung muốn tạo *
              </label>
              <select
                value={batchType}
                onChange={(e) => setBatchType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl bg-white"
              >
                <option value="propaganda">Bài tuyên truyền măng non (Bản nháp)</option>
                <option value="questions">Câu hỏi trắc nghiệm lịch sử & kỹ năng</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Số lượng bản nháp *
              </label>
              <select
                value={batchCount}
                onChange={(e) => setBatchCount(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl bg-white"
              >
                <option value={5}>5 Bản nháp</option>
                <option value={10}>10 Bản nháp</option>
                <option value={20}>20 Bản nháp</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Chủ đề giáo dục trọng tâm
              </label>
              <input
                type="text"
                value={batchTopic}
                onChange={(e) => setBatchTopic(e.target.value)}
                placeholder="VD: Phòng chống đuối nước..."
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleRunBatchAi}
              disabled={isBatchGenerating}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>
                {isBatchGenerating
                  ? `AI Đang Tạo ${batchCount} Bản Nháp...`
                  : `Tạo Ngay ${batchCount} Bản Nháp Bằng AI`}
              </span>
            </button>
          </div>

          {batchGeneratedCount !== null && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Đã tạo thành công {batchGeneratedCount} bản nháp mới và lưu an toàn vào cơ sở dữ liệu thật! Cô có thể sang tab "Bản Tin & Tuyên Truyền" hoặc "Ngân Hàng Câu Hỏi" để duyệt.
              </span>
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB 4: QUẢN LÝ BÀI ĐĂNG ===================== */}
      {activeTab === 'posts' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <h3 className="font-serif text-lg font-bold text-stone-900">
              Danh Sách Bài Tuyên Truyền ({dbState.propagandaPosts.length})
            </h3>
            <span className="text-xs text-stone-500">
              Bấm để chuyển trạng thái duyệt / ẩn bài
            </span>
          </div>

          <div className="space-y-3">
            {dbState.propagandaPosts.map((post) => (
              <div
                key={post.id}
                className="p-4 rounded-xl border border-stone-200 bg-stone-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        post.status === 'published'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {post.status === 'published' ? 'Đã duyệt công khai' : 'Bản nháp chờ duyệt'}
                    </span>
                    <span className="text-xs text-stone-500">{post.createdAt}</span>
                    <span className="text-xs font-semibold text-red-700">{post.topicName}</span>
                  </div>
                  <h4 className="font-serif text-sm font-bold text-stone-900 mt-1">
                    {post.title}
                  </h4>
                  <p className="text-xs text-stone-600 line-clamp-1 mt-0.5">
                    {post.excerpt}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      const newStatus: 'published' | 'draft' = post.status === 'published' ? 'draft' : 'published';
                      const updated: AppDatabase = {
                        ...dbState,
                        propagandaPosts: dbState.propagandaPosts.map((p) =>
                          p.id === post.id
                            ? { ...p, status: newStatus }
                            : p
                        ),
                      };
                      setDbState(updated);
                      handleSaveChanges(updated);
                    }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                      post.status === 'published'
                        ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {post.status === 'published' ? 'Chuyển về nháp' : 'Duyệt bài đăng'}
                  </button>

                  <button
                    onClick={() => {
                      if (confirm('Cô có chắc chắn muốn xóa bài viết này không?')) {
                        const updated = {
                          ...dbState,
                          propagandaPosts: dbState.propagandaPosts.filter((p) => p.id !== post.id),
                        };
                        setDbState(updated);
                        handleSaveChanges(updated);
                      }
                    }}
                    className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg"
                    title="Xóa bài"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== TAB 5: LỊCH SỰ KIỆN ===================== */}
      {activeTab === 'events' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <h3 className="font-serif text-lg font-bold text-stone-900">
              Kế Hoạch & Sự Kiện Hoạt Động Đội ({dbState.events.length})
            </h3>
            <button
              onClick={() => {
                const title = prompt('Nhập tên kế hoạch / phong trào mới:');
                if (title) {
                  const newEv: EventItem = {
                    id: 'ev_' + Date.now(),
                    title,
                    date: new Date().toISOString().split('T')[0],
                    organizer: 'Cô Lương Quỳnh Phương',
                    description: 'Kế hoạch công tác Đội.',
                    status: 'ke_hoach',
                  };
                  const updated = { ...dbState, events: [...dbState.events, newEv] };
                  setDbState(updated);
                  handleSaveChanges(updated);
                }
              }}
              className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Sự Kiện</span>
            </button>
          </div>

          <div className="space-y-3">
            {dbState.events.map((ev) => (
              <div
                key={ev.id}
                className="p-4 rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-red-700">{ev.date}</span>
                    <span className="text-stone-400">·</span>
                    <span className="font-medium text-stone-700">Trạng thái: {ev.status}</span>
                  </div>
                  <h4 className="font-serif text-sm font-bold text-stone-900 mt-1">
                    {ev.title}
                  </h4>
                  <p className="text-xs text-stone-600 mt-0.5">{ev.description}</p>
                </div>

                <button
                  onClick={() => {
                    const updated = {
                      ...dbState,
                      events: dbState.events.filter((e) => e.id !== ev.id),
                    };
                    setDbState(updated);
                    handleSaveChanges(updated);
                  }}
                  className="p-1.5 text-stone-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== TAB 6: NGÂN HÀNG CÂU HỎI ===================== */}
      {activeTab === 'quizzes' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <h3 className="font-serif text-lg font-bold text-stone-900">
              Ngân Hàng Câu Hỏi Trắc Nghiệm ({dbState.quizzes.length})
            </h3>
            <button
              onClick={() => {
                const question = prompt('Nhập câu hỏi mới:');
                if (question) {
                  const newQ: QuizQuestion = {
                    id: 'q_' + Date.now(),
                    category: 'Lịch sử Đội',
                    gameType: 'rung_chuong_vang',
                    gradeLevel: 'chung',
                    difficulty: 'de',
                    question,
                    options: ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
                    correctIndex: 0,
                    explanation: 'Lời giải thích kiến thức chuẩn.',
                  };
                  const updated = { ...dbState, quizzes: [...dbState.quizzes, newQ] };
                  setDbState(updated);
                  handleSaveChanges(updated);
                }
              }}
              className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Câu Hỏi</span>
            </button>
          </div>

          <div className="space-y-3">
            {dbState.quizzes.map((q, idx) => (
              <div key={q.id} className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-2">
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span className="font-bold text-red-700">
                    Câu {idx + 1} · {q.category} · Cấp độ: {q.gradeLevel}
                  </span>
                  <button
                    onClick={() => {
                      const updated = {
                        ...dbState,
                        quizzes: dbState.quizzes.filter((item) => item.id !== q.id),
                      };
                      setDbState(updated);
                      handleSaveChanges(updated);
                    }}
                    className="text-stone-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-stone-900">{q.question}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {q.options.map((opt, oIdx) => (
                    <div
                      key={oIdx}
                      className={`p-2 rounded-lg border ${
                        oIdx === q.correctIndex
                          ? 'bg-emerald-50 border-emerald-400 font-bold text-emerald-900'
                          : 'bg-white border-stone-200 text-stone-700'
                      }`}
                    >
                      {String.fromCharCode(65 + oIdx)}. {opt}
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-stone-600 italic">Giải thích: {q.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== TAB 7: SAO LƯU & KHÔI PHỤC ===================== */}
      {activeTab === 'backup' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-6 shadow-xs">
          <div>
            <h3 className="font-serif text-lg font-bold text-stone-900">
              Sao Lưu & Phục Hồi Dữ Liệu An Toàn
            </h3>
            <p className="text-xs text-stone-600 mt-1">
              Đảm bảo toàn bộ nội dung giáo dục, bài viết và câu hỏi của Liên đội không bao giờ bị mất mát khi chuyển đổi thiết bị hoặc cập nhật phiên bản.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl border border-stone-200 bg-stone-50 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                Xuất Tệp Sao Lưu (Download JSON)
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                Tải toàn bộ cơ sở dữ liệu hiện tại (gồm 8 phòng, bài viết, sự kiện, ngân hàng câu hỏi) về máy tính của cô dưới dạng tệp JSON.
              </p>
              <button
                onClick={handleExportJson}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Tải Tệp Sao Lưu Về Máy</span>
              </button>
            </div>

            <div className="p-5 rounded-2xl border border-stone-200 bg-stone-50 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                Nhập Tệp Phục Hồi (Import JSON)
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                Tải lên tệp sao lưu JSON đã lưu từ trước để khôi phục toàn bộ nội dung mà không cần thao tác thủ công.
              </p>
              <label className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Chọn Tệp JSON Để Phục Hồi</span>
                <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 8: HƯỚNG DẪN TRIỂN KHAI VERCEL (Section 13) ===================== */}
      {activeTab === 'vercel' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-5 shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-wider">
              <ExternalLink className="w-4 h-4" />
              <span>Sổ Tay Triển Khai Thực Tế</span>
            </div>
            <h3 className="font-serif text-2xl font-bold text-stone-900 mt-1">
              HƯỚNG DẪN TRIỂN KHAI ỨNG DỤNG LÊN VERCEL
            </h3>
            <p className="text-xs text-stone-600 mt-1">
              Ứng dụng được đóng gói hoàn chỉnh, hỗ trợ build mượt mà với Vite, TypeScript và Tailwind CSS.
            </p>
          </div>

          <div className="space-y-4 text-xs text-stone-700 leading-relaxed">
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
              <h4 className="font-bold text-stone-900 text-sm">Bước 1: Kết nối kho mã nguồn GitHub / Vercel</h4>
              <p>1. Đẩy toàn bộ thư mục mã nguồn lên kho Git (GitHub hoặc GitLab).</p>
              <p>2. Truy cập <strong>https://vercel.com</strong> và bấm <strong>Add New Project</strong>, sau đó chọn kho Git của bạn.</p>
            </div>

            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
              <h4 className="font-bold text-stone-900 text-sm">Bước 2: Cấu hình Build & Output Settings</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Framework Preset:</strong> Vite</li>
                <li><strong>Build Command:</strong> <code className="bg-stone-200 px-1 py-0.5 rounded">npm run build</code></li>
                <li><strong>Output Directory:</strong> <code className="bg-stone-200 px-1 py-0.5 rounded">dist</code></li>
                <li><strong>Install Command:</strong> <code className="bg-stone-200 px-1 py-0.5 rounded">npm install</code></li>
              </ul>
            </div>

            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
              <h4 className="font-bold text-stone-900 text-sm">Bước 3: Cấu hình biến môi trường (Environment Variables)</h4>
              <p>Trong mục <strong>Settings &gt; Environment Variables</strong> trên Vercel, thêm:</p>
              <div className="bg-stone-900 text-stone-100 p-3 rounded-lg font-mono text-[11px] space-y-1">
                <div>GEMINI_API_KEY = "Khóa API của Google AI Studio (được cấu hình an toàn trên máy chủ)"</div>
                <div>NODE_ENV = "production"</div>
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1">
              <span className="font-bold">Lưu ý bảo toàn dữ liệu trên Serverless:</span>
              <p>
                Ứng dụng được thiết kế kiến trúc kép (Dual-Persistence): lưu trữ tự động trong cơ sở dữ liệu trình duyệt kết hợp đồng bộ máy chủ, kèm tính năng Xuất/Nhập tệp JSON sao lưu. Do đó khi triển khai bản mới trên Vercel, dữ liệu của cô không bị mất.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
