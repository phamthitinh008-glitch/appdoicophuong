/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PropagandaPost, PropagandaTopic, EventItem, PlaybackState } from '../../types';
import { PROPAGANDA_TOPICS } from '../../data/initialData';
import { apiService } from '../../services/api';
import { speechService } from '../../utils/speech';
import { AudioControlBar } from '../audio/AudioControlBar';
import {
  Radio,
  FileText,
  Sparkles,
  Calendar,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Share2,
  Download,
  Filter,
  Search,
  CheckCircle,
  Clock,
  Layers,
  Send,
  Save,
  Palette,
  Eye,
  Plus,
  BookOpen,
  ShieldAlert,
  Flame,
  LifeBuoy,
  HeartHandshake,
  Globe,
  Leaf,
  Landmark,
  Flag,
  Award,
} from 'lucide-react';

interface PropagandaCenterProps {
  posts: PropagandaPost[];
  events: EventItem[];
  onSavePost: (post: PropagandaPost) => void;
  onSaveEvent: (event: EventItem) => void;
  isAdminLoggedIn: boolean;
}

export const PropagandaCenter: React.FC<PropagandaCenterProps> = ({
  posts,
  events,
  onSavePost,
  onSaveEvent,
  isAdminLoggedIn,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'bulletin' | 'ai_composer' | 'radio' | 'poster' | 'calendar'>('bulletin');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState<PropagandaPost | null>(posts[0] || null);

  // Radio Player State
  const [playbackState, setPlaybackState] = useState<PlaybackState>(speechService.getState());
  const [speechRate, setSpeechRate] = useState(0.95);
  const [radioScript, setRadioScript] = useState<string>(
    posts[0]?.mainContent || 'Kính chào quý thầy cô và các bạn đội viên thân mến...'
  );

  // AI Composer State
  const [composerTopic, setComposerTopic] = useState('An toàn giao thông đến trường');
  const [composerAudience, setComposerAudience] = useState<'all' | 'tieu_hoc' | 'thcs'>('all');
  const [composerDuration, setComposerDuration] = useState<number>(5);
  const [composerFormat, setComposerFormat] = useState('phát thanh măng non');
  const [composerTeacherNotes, setComposerTeacherNotes] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState<Partial<PropagandaPost> | null>(null);
  const [saveStatusMessage, setSaveStatusMessage] = useState<string | null>(null);

  // Poster Generator State
  const [posterTopic, setPosterTopic] = useState('An toàn giao thông');
  const [posterSlogan, setPosterSlogan] = useState('Đội mũ bảo hiểm – Trọn vẹn tương lai');
  const [posterColor, setPosterColor] = useState('red');
  const [posterFormat, setPosterFormat] = useState<'vertical' | 'square'>('vertical');

  useEffect(() => {
    const handleUpdate = (state: PlaybackState) => {
      setPlaybackState(state);
    };
    speechService.addListener(handleUpdate);
    return () => speechService.removeListener(handleUpdate);
  }, []);

  // Filter posts
  const filteredPosts = posts.filter((p) => {
    const matchTopic = selectedTopicId === 'all' || p.topicId === selectedTopicId;
    const matchSearch =
      searchQuery.trim() === '' ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTopic && matchSearch;
  });

  // Handle Radio Speech
  const toggleRadioPlay = (textToPlay: string, title?: string) => {
    if (speechService.isSpeaking) {
      speechService.stop();
    } else {
      speechService.speak(textToPlay, {
        title: title || 'Phát thanh Măng Non Chiến Thắng',
        rate: speechRate,
      });
    }
  };

  // Trigger AI Composer
  const handleGenerateAiPropaganda = async () => {
    setIsAiGenerating(true);
    setSaveStatusMessage(null);
    try {
      const res = await apiService.generatePropaganda({
        topic: composerTopic,
        targetAudience: composerAudience,
        durationMinutes: composerDuration,
        formatType: composerFormat,
        teacherNotes: composerTeacherNotes,
      });

      if (res.data) {
        setGeneratedDraft({
          id: 'post_gen_' + Date.now(),
          title: res.data.title,
          topicId: 'chude_custom',
          topicName: composerTopic,
          targetAudience: composerAudience,
          formatType: composerFormat as any,
          durationMinutes: composerDuration,
          excerpt: res.data.mainContent ? res.data.mainContent.slice(0, 120) + '...' : '',
          openingMessage: res.data.openingMessage || '',
          mainContent: res.data.mainContent || '',
          educationalScenario: res.data.educationalScenario || '',
          interactiveQuestions: res.data.interactiveQuestions || [],
          closingMessage: res.data.closingMessage || '',
          suggestedImagePrompt: res.data.suggestedImagePrompt,
          createdAt: new Date().toISOString().split('T')[0],
          author: 'Cô Lương Quỳnh Phương (AI Hỗ Trợ)',
          status: 'draft',
        });
      }
    } catch (e: any) {
      alert('Không thể tạo bài viết: ' + (e.message || 'Lỗi mạng'));
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Save generated post into real database
  const handlePublishDraft = (status: 'published' | 'draft') => {
    if (!generatedDraft || !generatedDraft.title) return;
    const fullPost: PropagandaPost = {
      id: generatedDraft.id || 'post_' + Date.now(),
      title: generatedDraft.title || 'Bài tuyên truyền',
      topicId: generatedDraft.topicId || 'chude_1',
      topicName: generatedDraft.topicName || composerTopic,
      targetAudience: (generatedDraft.targetAudience as any) || 'all',
      formatType: (generatedDraft.formatType as any) || 'bai_doc',
      durationMinutes: generatedDraft.durationMinutes || 5,
      excerpt: generatedDraft.excerpt || '',
      openingMessage: generatedDraft.openingMessage || '',
      mainContent: generatedDraft.mainContent || '',
      educationalScenario: generatedDraft.educationalScenario || '',
      interactiveQuestions: generatedDraft.interactiveQuestions || [],
      closingMessage: generatedDraft.closingMessage || '',
      suggestedImagePrompt: generatedDraft.suggestedImagePrompt,
      imageUrl: '/src/assets/images/chien_thang_school_1793281772110.jpg',
      createdAt: new Date().toISOString().split('T')[0],
      author: 'Cô Lương Quỳnh Phương',
      status,
      isWeeklyHighlight: false,
    };

    onSavePost(fullPost);
    setSaveStatusMessage(
      status === 'published'
        ? '✓ Đã duyệt và đăng thành công lên Bản tin Măng Non!'
        : '✓ Đã lưu nháp vào cơ sở dữ liệu để cô tiếp tục chỉnh sửa sau.'
    );
  };

  // Helper icon for topics
  const getTopicIcon = (id: string) => {
    switch (id) {
      case 'chude_1': return <Flag className="w-4 h-4 text-red-600" />;
      case 'chude_2': return <Award className="w-4 h-4 text-amber-600" />;
      case 'chude_3': return <ShieldAlert className="w-4 h-4 text-blue-600" />;
      case 'chude_4': return <HeartHandshake className="w-4 h-4 text-emerald-600" />;
      case 'chude_5': return <Globe className="w-4 h-4 text-indigo-600" />;
      case 'chude_6': return <LifeBuoy className="w-4 h-4 text-cyan-600" />;
      case 'chude_7': return <Flame className="w-4 h-4 text-orange-600" />;
      case 'chude_8': return <Leaf className="w-4 h-4 text-green-600" />;
      case 'chude_9': return <Landmark className="w-4 h-4 text-rose-600" />;
      default: return <BookOpen className="w-4 h-4 text-stone-600" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Section Header */}
      <div className="bg-gradient-to-r from-red-600 via-red-700 to-amber-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur text-xs font-semibold uppercase tracking-wider text-amber-200">
            <Radio className="w-3.5 h-3.5" />
            <span>Trung Tâm Tuyên Truyền Hoạt Động Đội 4.0</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">
            BẢN TIN MĂNG NON CHIẾN THẮNG
          </h1>
          <p className="text-amber-100 text-sm sm:text-base font-medium">
            “Mỗi tuần một thông điệp đẹp – Mỗi hoạt động một hành động ý nghĩa”
          </p>
          <p className="text-white/80 text-xs sm:text-sm leading-relaxed pt-1">
            Không gian truyền thông số của Liên đội Trường Tiểu học và THCS Chiến Thắng (xã Vũ Lễ, Lạng Sơn). Nơi giáo viên và học sinh cập nhật tin tức, nghe phát thanh măng non AI và học tập kỹ năng sống.
          </p>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveSubTab('bulletin')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeSubTab === 'bulletin'
              ? 'bg-red-600 text-white shadow-sm'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Bảng Tin & 9 Chủ Đề Tuyên Truyền</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ai_composer')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeSubTab === 'ai_composer'
              ? 'bg-red-600 text-white shadow-sm'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>AI Soạn Bài Tuyên Truyền</span>
        </button>

        <button
          onClick={() => setActiveSubTab('radio')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeSubTab === 'radio'
              ? 'bg-red-600 text-white shadow-sm'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Phát Thanh Măng Non AI</span>
        </button>

        <button
          onClick={() => setActiveSubTab('poster')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeSubTab === 'poster'
              ? 'bg-red-600 text-white shadow-sm'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Thiết Kế Poster & Pano AI</span>
        </button>

        <button
          onClick={() => setActiveSubTab('calendar')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeSubTab === 'calendar'
              ? 'bg-red-600 text-white shadow-sm'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Lịch Hoạt Động & Phong Trào</span>
        </button>
      </div>

      {/* ===================== SUBTAB 1: BẢNG TIN & 9 CHỦ ĐỀ ===================== */}
      {activeSubTab === 'bulletin' && (
        <div className="space-y-6">
          {/* 9 Topics Quick Bar */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                9 Chủ Đề Giáo Dục Chuẩn Của Đội:
              </span>
              <button
                onClick={() => setSelectedTopicId('all')}
                className={`text-xs font-semibold ${selectedTopicId === 'all' ? 'text-red-600' : 'text-stone-500 hover:text-stone-900'}`}
              >
                Xem tất cả ({posts.length})
              </button>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {PROPAGANDA_TOPICS.map((topic) => {
                const isSelected = selectedTopicId === topic.id;
                return (
                  <button
                    key={topic.id}
                    onClick={() => setSelectedTopicId(topic.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-red-50 border-red-300 text-red-800 font-bold'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {getTopicIcon(topic.id)}
                    <span>{topic.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm kiếm bài tuyên truyền..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-stone-900"
              />
            </div>

            <div className="text-xs text-stone-500 self-end sm:self-center">
              Hiển thị <span className="font-bold text-stone-900">{filteredPosts.length}</span> bài viết
            </div>
          </div>

          {/* Main 2-Column Feed: Left List / Right Reading View */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Post Cards */}
            <div className="lg:col-span-5 space-y-3">
              {filteredPosts.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-stone-200 text-center text-xs text-stone-500">
                  Không tìm thấy bài viết phù hợp với chủ đề đã chọn.
                </div>
              ) : (
                filteredPosts.map((post) => {
                  const isSelected = selectedPost?.id === post.id;
                  return (
                    <div
                      key={post.id}
                      onClick={() => setSelectedPost(post)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-red-50/70 border-red-300 shadow-sm'
                          : 'bg-white border-stone-200 hover:border-stone-300 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] text-stone-500 mb-1.5">
                        <span className="font-semibold text-red-700">
                          {post.topicName}
                        </span>
                        <span>{post.createdAt}</span>
                      </div>
                      <h4 className="font-serif text-sm font-bold text-stone-900 leading-snug">
                        {post.title}
                      </h4>
                      <p className="text-xs text-stone-600 line-clamp-2 mt-1 leading-relaxed">
                        {post.excerpt}
                      </p>
                      <div className="mt-3 flex items-center justify-between text-[11px] text-stone-500 pt-2 border-t border-stone-100">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-stone-400" />
                          <span>{post.durationMinutes} phút</span>
                        </span>
                        <span className="font-medium text-stone-700">
                          {post.author}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right Column: Detailed Reader & Audio Narration */}
            <div className="lg:col-span-7">
              {selectedPost ? (
                <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-5 shadow-xs sticky top-24">
                  <div>
                    <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
                      <span className="font-bold text-red-700 uppercase tracking-wider">
                        {selectedPost.topicName}
                      </span>
                      <span>Ngày đăng: {selectedPost.createdAt}</span>
                    </div>
                    <h2 className="font-serif text-2xl font-bold text-stone-900 leading-tight">
                      {selectedPost.title}
                    </h2>
                    <p className="text-xs text-stone-500 mt-1">
                      Người phụ trách: <span className="font-semibold text-stone-800">{selectedPost.author}</span> · Thời lượng đọc: {selectedPost.durationMinutes} phút
                    </p>
                  </div>

                  {/* Audio Player Bar */}
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-red-900">
                        <Radio className="w-4 h-4 text-red-600" />
                        <span>Nghe phát thanh bài viết này (Tiếng Việt)</span>
                      </div>
                      <button
                        onClick={() => toggleRadioPlay(selectedPost.mainContent, selectedPost.title)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                      >
                        {playbackState.isSpeaking ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        <span>{playbackState.isSpeaking ? 'Dừng đọc' : 'Phát thanh'}</span>
                      </button>
                    </div>
                    {playbackState.isSpeaking && (
                      <AudioControlBar className="mt-2 w-full" />
                    )}
                  </div>

                  {/* Opening Message */}
                  {selectedPost.openingMessage && (
                    <div className="p-3 bg-amber-50/70 border-l-4 border-amber-500 rounded-r-xl text-xs text-amber-900 italic leading-relaxed">
                      {selectedPost.openingMessage}
                    </div>
                  )}

                  {/* Main Article Body */}
                  <div className="text-sm text-stone-700 leading-relaxed whitespace-pre-line space-y-3">
                    {selectedPost.mainContent}
                  </div>

                  {/* Educational Scenario */}
                  {selectedPost.educationalScenario && (
                    <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                        Tình Huống Giáo Dục Học Đường:
                      </h4>
                      <p className="text-xs text-stone-700 italic">
                        {selectedPost.educationalScenario}
                      </p>
                    </div>
                  )}

                  {/* Interactive questions */}
                  {selectedPost.interactiveQuestions && selectedPost.interactiveQuestions.length > 0 && (
                    <div className="bg-blue-50/60 rounded-xl p-4 border border-blue-200 space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                        Câu Hỏi Thảo Luận Dành Cho Chi Đội:
                      </h4>
                      <ul className="text-xs text-blue-950 space-y-1 list-disc pl-4">
                        {selectedPost.interactiveQuestions.map((q, idx) => (
                          <li key={idx}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Closing Message */}
                  {selectedPost.closingMessage && (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs font-medium text-emerald-900">
                      ★ {selectedPost.closingMessage}
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="pt-3 border-t border-stone-200 flex items-center justify-between text-xs">
                    <button
                      onClick={() => {
                        setRadioScript(selectedPost.mainContent);
                        setActiveSubTab('radio');
                      }}
                      className="text-red-700 hover:underline font-semibold flex items-center gap-1"
                    >
                      <Radio className="w-3.5 h-3.5" />
                      <span>Chuyển sang phòng Phát thanh Măng Non</span>
                    </button>
                    <button
                      onClick={() => {
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText(`${selectedPost.title}\n\n${selectedPost.mainContent}`);
                          alert('Đã sao chép nội dung bài tuyên truyền!');
                        }
                      }}
                      className="text-stone-500 hover:text-stone-900 inline-flex items-center gap-1"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Sao chép bài</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-xs text-stone-500">
                  Chọn một bài viết ở danh sách bên trái để đọc nội dung đầy đủ.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================== SUBTAB 2: AI SOẠN BÀI TUYÊN TRUYỀN ===================== */}
      {activeSubTab === 'ai_composer' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Trợ Lý Giáo Viên: AI Soạn Bài Tuyên Truyền Tự Động</span>
              </div>
              <h2 className="font-serif text-xl font-bold text-stone-900 mt-1">
                Tạo Kịch Bản Tuyên Truyền, Phát Thanh & Bài Sinh Hoạt Dưới Cờ
              </h2>
              <p className="text-xs text-stone-600 mt-1">
                Giáo viên chỉ cần nhập chủ đề và ghi chú thực tế. Hệ thống AI sẽ xây dựng bài tuyên truyền chuẩn phong cách Đội, kèm tình huống giáo dục và câu hỏi giao lưu.
              </p>
            </div>

            {/* Input Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Chủ đề tuyên truyền *
                </label>
                <input
                  type="text"
                  value={composerTopic}
                  onChange={(e) => setComposerTopic(e.target.value)}
                  placeholder="VD: Phòng chống đuối nước..."
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Đối tượng học sinh
                </label>
                <select
                  value={composerAudience}
                  onChange={(e) => setComposerAudience(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none bg-white"
                >
                  <option value="all">Toàn trường (Tiểu học & THCS)</option>
                  <option value="tieu_hoc">Tiểu học (Lớp 1-5)</option>
                  <option value="thcs">THCS (Lớp 6-9)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Thời lượng dự kiến
                </label>
                <select
                  value={composerDuration}
                  onChange={(e) => setComposerDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none bg-white"
                >
                  <option value={3}>3 Phút (Ngắn gọn)</option>
                  <option value={5}>5 Phút (Chuẩn phát thanh)</option>
                  <option value={7}>7 Phút (Sinh hoạt chi đội)</option>
                  <option value={10}>10 Phút (Sinh hoạt dưới cờ)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Hình thức trình bày
                </label>
                <select
                  value={composerFormat}
                  onChange={(e) => setComposerFormat(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none bg-white"
                >
                  <option value="phát thanh măng non">Phát thanh măng non</option>
                  <option value="sinh hoạt dưới cờ">Sinh hoạt dưới cờ đầu tuần</option>
                  <option value="bài đọc chi đội">Bài đọc sinh hoạt chi đội</option>
                  <option value="bản tin website">Bản tin đăng website</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Ghi chú thực tế của giáo viên (tình hình trường, nhắc nhở cụ thể...)
              </label>
              <textarea
                rows={2}
                value={composerTeacherNotes}
                onChange={(e) => setComposerTeacherNotes(e.target.value)}
                placeholder="VD: Nhắc nhở các bạn học sinh xã Vũ Lễ chú ý các khúc suối ngập sau mưa to..."
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleGenerateAiPropaganda}
                disabled={isAiGenerating}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{isAiGenerating ? 'AI Đang Soạn Bài...' : 'Soạn Bài Bằng AI Ngay'}</span>
              </button>
            </div>
          </div>

          {/* Generated Result Preview */}
          {generatedDraft && (
            <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
                  Bản Thảo Do AI Đề Xuất (Đang Chờ Cô Phê Duyệt)
                </span>
                <span className="text-xs text-stone-400">Trạng thái: Bản nháp</span>
              </div>

              {saveStatusMessage && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200">
                  {saveStatusMessage}
                </div>
              )}

              <div className="space-y-3">
                <input
                  type="text"
                  value={generatedDraft.title || ''}
                  onChange={(e) => setGeneratedDraft({ ...generatedDraft, title: e.target.value })}
                  className="font-serif text-xl font-bold text-stone-900 w-full border-b border-stone-200 pb-1 focus:outline-none focus:border-red-500"
                />

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-500 uppercase">Lời mở đầu:</label>
                  <textarea
                    rows={2}
                    value={generatedDraft.openingMessage || ''}
                    onChange={(e) => setGeneratedDraft({ ...generatedDraft, openingMessage: e.target.value })}
                    className="w-full p-2.5 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-500 uppercase">Nội dung tuyên truyền:</label>
                  <textarea
                    rows={6}
                    value={generatedDraft.mainContent || ''}
                    onChange={(e) => setGeneratedDraft({ ...generatedDraft, mainContent: e.target.value })}
                    className="w-full p-2.5 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 leading-relaxed font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-500 uppercase">Tình huống giáo dục:</label>
                  <textarea
                    rows={2}
                    value={generatedDraft.educationalScenario || ''}
                    onChange={(e) => setGeneratedDraft({ ...generatedDraft, educationalScenario: e.target.value })}
                    className="w-full p-2.5 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-500 uppercase">Thông điệp kết thúc:</label>
                  <input
                    type="text"
                    value={generatedDraft.closingMessage || ''}
                    onChange={(e) => setGeneratedDraft({ ...generatedDraft, closingMessage: e.target.value })}
                    className="w-full p-2.5 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
              </div>

              {/* Action Buttons as required by Section 4.3 */}
              <div className="pt-4 border-t border-stone-200 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleGenerateAiPropaganda}
                  disabled={isAiGenerating}
                  className="px-3.5 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>TẠO LẠI</span>
                </button>

                <button
                  onClick={() => handlePublishDraft('draft')}
                  className="px-3.5 py-2 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>LƯU BẢN NHÁP</span>
                </button>

                <button
                  onClick={() => handlePublishDraft('published')}
                  className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>DUYỆT & ĐĂNG BÀI</span>
                </button>

                <button
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(
                        `${generatedDraft.title}\n\n${generatedDraft.openingMessage}\n\n${generatedDraft.mainContent}\n\n${generatedDraft.closingMessage}`
                      );
                      alert('Đã xuất và sao chép nội dung bài viết!');
                    }
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 border border-stone-200 rounded-xl transition-colors flex items-center gap-1.5 ml-auto"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>XUẤT NỘI DUNG</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== SUBTAB 3: PHÁT THANH MĂNG NON AI ===================== */}
      {activeSubTab === 'radio' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-wider">
              <Radio className="w-4 h-4" />
              <span>Chuyên Mục Phát Thanh Học Đường</span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-stone-900 mt-1">
              TIẾNG NÓI MĂNG NON CHIẾN THẮNG
            </h2>
            <p className="text-xs text-stone-600 mt-1">
              Chuyển văn bản bài tuyên truyền thành giọng đọc tiếng Việt ấm áp, phát âm tự nhiên trong giờ ra chơi và sinh hoạt dưới cờ.
            </p>
          </div>

          {/* Radio Console */}
          <div className="bg-stone-900 rounded-2xl p-6 text-white space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleRadioPlay(radioScript, 'Chuyên mục Tiếng nói Măng Non Chiến Thắng')}
                  className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-all shadow-md shadow-red-900/50 shrink-0"
                >
                  {playbackState.isSpeaking ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <div>
                  <h4 className="font-bold text-sm text-stone-100">
                    {playbackState.isSpeaking ? 'Đang phát thanh trực tiếp...' : 'Sẵn sàng phát thanh'}
                  </h4>
                  <span className="text-xs text-stone-400">
                    Ngôn ngữ: Tiếng Việt (vi-VN) · Bộ lọc phát âm tự nhiên
                  </span>
                </div>
              </div>

              {/* Speed Controls */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-400">Tốc độ đọc:</span>
                {[0.75, 0.9, 1.0, 1.2].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => {
                      setSpeechRate(rate);
                      speechService.setRate(rate);
                    }}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                      Math.abs(speechRate - rate) < 0.05
                        ? 'bg-red-600 text-white'
                        : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>

            {/* Embedded Audio Control Bar in Radio Console */}
            <AudioControlBar className="w-full bg-stone-950/80 border-stone-800 text-white" />

            {/* Script Textarea */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span>Văn bản kịch bản phát thanh:</span>
                <span>{radioScript.length} ký tự</span>
              </div>
              <textarea
                rows={6}
                value={radioScript}
                onChange={(e) => setRadioScript(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-red-500 leading-relaxed font-sans"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-stone-400 pt-2">
              <span>Đài phát thanh Măng Non Chiến Thắng – Xã Vũ Lễ</span>
              <button
                onClick={() => {
                  setRadioScript(
                    'Kính chào quý thầy cô và các bạn đội viên thân mến! Đây là chương trình Tiếng nói Măng Non Chiến Thắng. Hôm nay chúng mình cùng nhau tìm hiểu về An toàn giao thông cổng trường...'
                  );
                }}
                className="hover:text-white underline transition-colors"
              >
                Nạp kịch bản mẫu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== SUBTAB 4: THIẾT KẾ POSTER & PANO ===================== */}
      {activeSubTab === 'poster' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-wider">
              <Palette className="w-4 h-4" />
              <span>Xưởng Truyền Thông Học Đường</span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-stone-900 mt-1">
              CÔNG CỤ THIẾT KẾ POSTER & BẢN TIN PANO
            </h2>
            <p className="text-xs text-stone-600 mt-1">
              Tạo pano khẩu hiệu tuyên truyền cho Liên đội trong vài giây, sẵn sàng in ấn hoặc đăng bảng tin lớp.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Poster Configuration */}
            <div className="space-y-4 bg-stone-50 p-5 rounded-2xl border border-stone-200">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Chủ đề tuyên truyền
                </label>
                <input
                  type="text"
                  value={posterTopic}
                  onChange={(e) => setPosterTopic(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Khẩu hiệu hành động *
                </label>
                <input
                  type="text"
                  value={posterSlogan}
                  onChange={(e) => setPosterSlogan(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Tông màu chủ đạo
                </label>
                <div className="flex items-center gap-3">
                  {[
                    { id: 'red', label: 'Đỏ cờ Tổ quốc', bg: 'bg-red-600' },
                    { id: 'blue', label: 'Xanh công nghệ', bg: 'bg-blue-600' },
                    { id: 'emerald', label: 'Xanh môi trường', bg: 'bg-emerald-600' },
                    { id: 'amber', label: 'Vàng rực rỡ', bg: 'bg-amber-600' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setPosterColor(c.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${
                        posterColor === c.id ? 'border-stone-900 font-bold bg-white shadow-xs' : 'border-stone-200 bg-stone-100'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full ${c.bg}`} />
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => window.print()}
                  className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Xuất File In Ấn / Tải Về</span>
                </button>
              </div>
            </div>

            {/* Poster Live Preview */}
            <div className="flex justify-center">
              <div
                className={`w-full max-w-sm rounded-2xl p-6 text-white shadow-xl flex flex-col justify-between aspect-[3/4] relative overflow-hidden ${
                  posterColor === 'red'
                    ? 'bg-gradient-to-b from-red-600 via-red-700 to-amber-700'
                    : posterColor === 'blue'
                    ? 'bg-gradient-to-b from-blue-700 via-indigo-800 to-stone-900'
                    : posterColor === 'emerald'
                    ? 'bg-gradient-to-b from-emerald-600 via-teal-700 to-stone-900'
                    : 'bg-gradient-to-b from-amber-600 via-orange-600 to-red-800'
                }`}
              >
                {/* Poster Top */}
                <div className="space-y-1 text-center">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-amber-300 block">
                    LIÊN ĐỘI TRƯỜNG TH & THCS CHIẾN THẮNG
                  </span>
                  <span className="text-xs font-medium text-white/90">
                    Xã Vũ Lễ – Tỉnh Lạng Sơn
                  </span>
                </div>

                {/* Poster Center Star & Slogan */}
                <div className="text-center space-y-4 my-auto">
                  <div className="w-16 h-16 rounded-full bg-amber-400 text-red-700 font-bold text-3xl mx-auto flex items-center justify-center shadow-lg">
                    ★
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-widest text-amber-200 font-bold block mb-1">
                      {posterTopic}
                    </span>
                    <h3 className="font-serif text-2xl font-black text-white leading-tight drop-shadow-md">
                      “{posterSlogan}”
                    </h3>
                  </div>
                </div>

                {/* Poster Footer */}
                <div className="pt-4 border-t border-white/20 text-center space-y-0.5">
                  <p className="text-[11px] font-semibold text-amber-200">
                    MĂNG NON VỮNG BƯỚC TRONG KỶ NGUYÊN SỐ
                  </p>
                  <p className="text-[9px] text-white/70">
                    Phòng Truyền Thống Đội Ảo 4.0 · Năm học 2026 – 2027
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== SUBTAB 5: LỊCH HOẠT ĐỘNG & PHONG TRÀO ===================== */}
      {activeSubTab === 'calendar' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-wider">
                <Calendar className="w-4 h-4" />
                <span>Kế Hoạch & Phong Trào Năm Học</span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-stone-900 mt-1">
                LỊCH HOẠT ĐỘNG ĐỘI LIÊN ĐỘI CHIẾN THẮNG
              </h2>
            </div>

            {isAdminLoggedIn && (
              <button
                onClick={() => {
                  const title = prompt('Nhập tên sự kiện mới:');
                  if (title) {
                    onSaveEvent({
                      id: 'ev_' + Date.now(),
                      title,
                      date: new Date().toISOString().split('T')[0],
                      organizer: 'Cô Lương Quỳnh Phương',
                      description: 'Kế hoạch hoạt động Đội nhà trường.',
                      status: 'ke_hoach',
                    });
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Kế Hoạch Mới</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="p-5 rounded-2xl border border-stone-200 bg-stone-50/50 hover:bg-stone-50 transition-colors flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-700 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-red-600" />
                      <span>{event.date}</span>
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        event.status === 'hoan_thanh'
                          ? 'bg-emerald-100 text-emerald-800'
                          : event.status === 'dang_thuc_hien'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {event.status === 'hoan_thanh'
                        ? 'Hoàn thành'
                        : event.status === 'dang_thuc_hien'
                        ? 'Đang thực hiện'
                        : 'Kế hoạch'}
                    </span>
                  </div>

                  <h4 className="font-serif text-base font-bold text-stone-900 leading-snug">
                    {event.title}
                  </h4>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    {event.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-200 text-xs text-stone-500 flex items-center justify-between">
                  <span>Phụ trách: {event.organizer}</span>
                  {event.location && <span>{event.location}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
