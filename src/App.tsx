/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppDatabase, VirtualRoom, PropagandaPost, EventItem, MediaItem } from './types';
import { INITIAL_DATABASE } from './data/initialData';
import { apiService } from './services/api';
import { speechService } from './utils/speech';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { VirtualMuseum3D } from './components/virtual3d/VirtualMuseum3D';
import { VirtualRoom2D } from './components/virtual2d/VirtualRoom2D';
import { PropagandaCenter } from './components/propaganda/PropagandaCenter';
import { GamesHub } from './components/games/GamesHub';
import { MediaLibrary } from './components/library/MediaLibrary';
import { MangNonAIGuide } from './components/guide/MangNonAIGuide';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { LoginModal } from './components/auth/LoginModal';
import { AudioSettingsModal } from './components/audio/AudioSettingsModal';
import { PlaybackState } from './types';
import {
  Compass,
  BookOpen,
  Radio,
  Image,
  Trophy,
  Sparkles,
  Shield,
  ArrowRight,
  Volume2,
  VolumeX,
  Layers,
  ChevronRight,
  Award,
  Star,
  Clock,
  Heart,
} from 'lucide-react';

export default function App() {
  const [database, setDatabase] = useState<AppDatabase>(INITIAL_DATABASE);
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('room_1');
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');

  // Modals & Tour Guide
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isAudioSettingsOpen, setIsAudioSettingsOpen] = useState(false);

  // Audio narration state
  const [playbackState, setPlaybackState] = useState<PlaybackState>(speechService.getState());

  useEffect(() => {
    const handleUpdate = (state: PlaybackState) => {
      setPlaybackState(state);
    };
    speechService.addListener(handleUpdate);
    return () => speechService.removeListener(handleUpdate);
  }, []);

  // Fetch initial database
  useEffect(() => {
    async function loadDb() {
      try {
        const data = await apiService.getDatabase();
        setDatabase(data);
      } catch (err) {
        console.error('Failed to load database:', err);
      }
    }
    loadDb();
  }, []);

  // Update post from Propaganda Center or Admin
  const handleSavePost = async (post: PropagandaPost) => {
    const existingIndex = database.propagandaPosts.findIndex((p) => p.id === post.id);
    let updatedPosts: PropagandaPost[];
    if (existingIndex >= 0) {
      updatedPosts = [...database.propagandaPosts];
      updatedPosts[existingIndex] = post;
    } else {
      updatedPosts = [post, ...database.propagandaPosts];
    }
    const updatedDb: AppDatabase = {
      ...database,
      propagandaPosts: updatedPosts,
    };
    setDatabase(updatedDb);
    await apiService.saveDatabase(updatedDb);
  };

  // Update event
  const handleSaveEvent = async (event: EventItem) => {
    const updatedDb: AppDatabase = {
      ...database,
      events: [event, ...database.events],
    };
    setDatabase(updatedDb);
    await apiService.saveDatabase(updatedDb);
  };

  // Add media item
  const handleAddMedia = async (media: MediaItem) => {
    const updatedDb: AppDatabase = {
      ...database,
      mediaLibrary: [media, ...database.mediaLibrary],
    };
    setDatabase(updatedDb);
    await apiService.saveDatabase(updatedDb);
  };

  // Voice narration for Home introduction
  const toggleHomeNarration = () => {
    const introText =
      'Chào mừng quý thầy cô, các bạn học sinh và phụ huynh đến với Phòng truyền thống Đội ảo bốn chấm không của Liên đội Trường Tiểu học và THCS Chiến Thắng, xã Vũ Lễ, tỉnh Lạng Sơn. Khẩu hiệu: Tự hào truyền thống – Tiếp bước cha anh – Măng non vững bước trong kỷ nguyên số.';
    if (speechService.isSpeaking) {
      speechService.stop();
    } else {
      speechService.speak(introText, {
        title: 'Lời chào mừng Phòng truyền thống',
      });
    }
  };

  const currentRoom = database.virtualRooms.find((r) => r.id === selectedRoomId) || database.virtualRooms[0];

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 font-sans selection:bg-red-600 selection:text-white">
      {/* Top Bar Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          speechService.stop();
        }}
        isAdminLoggedIn={isAdminLoggedIn}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenAudioSettings={() => setIsAudioSettingsOpen(true)}
      />

      {/* Main View Controller */}
      <main className="flex-1">
        {/* ======================= VIEW: HOME ======================= */}
        {activeTab === 'home' && (
          <div className="space-y-12 pb-16">
            {/* Grand Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-b from-stone-900 via-stone-950 to-stone-900 text-white min-h-[640px] flex items-center">
              {/* Background Landscape with measured dark scrim */}
              <div className="absolute inset-0 z-0">
                <img
                  src="/src/assets/images/tradition_hall_hero_1793281771410.jpg"
                  alt="Sảnh phòng truyền thống Đội ảo"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover opacity-25 scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/70 to-stone-900/40" />
              </div>

              <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center space-y-6">
                {/* Unit Crest Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600/30 border border-red-500/40 backdrop-blur text-xs font-bold text-amber-300 uppercase tracking-widest">
                  <span className="text-sm">★</span>
                  <span>{database.schoolSettings.schoolName}</span>
                  <span className="text-white/60">·</span>
                  <span className="text-white/80">{database.schoolSettings.commune} – {database.schoolSettings.province}</span>
                </div>

                {/* Primary Hero Typography */}
                <div className="space-y-2 max-w-4xl mx-auto">
                  <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                    PHÒNG TRUYỀN THỐNG ĐỘI ẢO 4.0
                  </h1>
                  <p className="text-red-400 font-serif text-lg sm:text-2xl font-bold tracking-wide">
                    {database.schoolSettings.unionName.toUpperCase()}
                  </p>
                </div>

                {/* Slogan & Welcome prose */}
                <div className="max-w-2xl mx-auto space-y-3">
                  <p className="text-xs sm:text-sm font-semibold italic text-amber-300">
                    "{database.schoolSettings.slogan}"
                  </p>
                  <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                    {database.schoolSettings.welcomeMessage}
                  </p>
                </div>

                {/* Speech Narration Button */}
                <div className="flex justify-center">
                  <button
                    onClick={toggleHomeNarration}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
                      playbackState.isSpeaking
                        ? 'bg-amber-500 border-amber-500 text-stone-950 shadow-lg'
                        : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                    }`}
                  >
                    {playbackState.isSpeaking ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-amber-400" />
                    )}
                    <span>{playbackState.isSpeaking ? 'Dừng Thuyết Minh' : 'Nghe Lời Chào Giới Thiệu'}</span>
                  </button>
                </div>

                {/* 7 Big Action Buttons (Section 2 Requirement) */}
                <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 max-w-6xl mx-auto">
                  <button
                    onClick={() => {
                      setViewMode('3d');
                      setActiveTab('virtual_tour');
                    }}
                    className="p-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl shadow-lg shadow-red-900/40 text-xs font-bold flex flex-col items-center justify-center gap-2 transition-transform hover:-translate-y-0.5"
                  >
                    <Compass className="w-5 h-5 text-amber-300" />
                    <span>BẮT ĐẦU THAM QUAN 3D</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedRoomId('room_2');
                      setActiveTab('history');
                    }}
                    className="p-3.5 bg-stone-800/90 hover:bg-stone-800 border border-stone-700 text-stone-200 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-2 transition-transform hover:-translate-y-0.5"
                  >
                    <BookOpen className="w-5 h-5 text-red-400" />
                    <span>TÌM HIỂU LỊCH SỬ ĐỘI</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('propaganda')}
                    className="p-3.5 bg-stone-800/90 hover:bg-stone-800 border border-stone-700 text-stone-200 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-2 transition-transform hover:-translate-y-0.5"
                  >
                    <Radio className="w-5 h-5 text-amber-400" />
                    <span>TUYÊN TRUYỀN ĐỘI</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('library')}
                    className="p-3.5 bg-stone-800/90 hover:bg-stone-800 border border-stone-700 text-stone-200 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-2 transition-transform hover:-translate-y-0.5"
                  >
                    <Image className="w-5 h-5 text-blue-400" />
                    <span>THƯ VIỆN ẢNH & VIDEO</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('games')}
                    className="p-3.5 bg-stone-800/90 hover:bg-stone-800 border border-stone-700 text-stone-200 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-2 transition-transform hover:-translate-y-0.5"
                  >
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    <span>TRÒ CHƠI KIẾN THỨC</span>
                  </button>

                  <button
                    onClick={() => setIsGuideOpen(true)}
                    className="p-3.5 bg-stone-800/90 hover:bg-stone-800 border border-stone-700 text-stone-200 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-2 transition-transform hover:-translate-y-0.5"
                  >
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                    <span>HƯỚNG DẪN VIÊN AI</span>
                  </button>

                  <button
                    onClick={() => {
                      if (isAdminLoggedIn) {
                        setActiveTab('admin');
                      } else {
                        setIsLoginModalOpen(true);
                      }
                    }}
                    className="col-span-2 sm:col-span-1 p-3.5 bg-stone-800/90 hover:bg-stone-800 border border-stone-700 text-stone-200 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-2 transition-transform hover:-translate-y-0.5"
                  >
                    <Shield className="w-5 h-5 text-purple-400" />
                    <span>KHU VỰC QUẢN TRỊ</span>
                  </button>
                </div>
              </div>
            </section>

            {/* 8 Virtual Exhibition Rooms Showcase */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-stone-200 pb-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-red-600">
                    Bảo Tàng Số Trực Tuyến
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-0.5">
                    8 KHÔNG GIAN PHÒNG TRUYỀN THỐNG ĐỘI
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={() => {
                      setViewMode('3d');
                      setActiveTab('virtual_tour');
                    }}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-xs transition-colors inline-flex items-center gap-1.5"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Tham quan không gian 3D</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {database.virtualRooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => {
                      setSelectedRoomId(room.id);
                      setViewMode('3d');
                      setActiveTab('virtual_tour');
                    }}
                    className="group bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-video overflow-hidden bg-stone-900">
                        <img
                          src={room.coverImage}
                          alt={room.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2.5 left-2.5 bg-stone-900/80 backdrop-blur text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded">
                          Phòng {room.roomNumber}
                        </div>
                      </div>

                      <div className="p-4 space-y-1.5">
                        <h3 className="font-serif text-base font-bold text-stone-900 group-hover:text-red-700 transition-colors leading-snug">
                          {room.shortTitle}
                        </h3>
                        <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                          {room.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 pt-0">
                      <span className="text-xs font-semibold text-red-700 group-hover:underline inline-flex items-center gap-1">
                        <span>Vào tham quan</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Featured Propaganda Bulletin Section on Home (Section 4 Priority) */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-red-600">
                    Truyền Thông Măng Non
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-0.5">
                    BẢN TIN HOẠT ĐỘNG MỚI NHẤT
                  </h2>
                </div>
                <button
                  onClick={() => setActiveTab('propaganda')}
                  className="text-xs font-bold text-red-700 hover:underline inline-flex items-center gap-1"
                >
                  <span>Xem toàn bộ trung tâm tuyên truyền</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {database.propagandaPosts.slice(0, 3).map((post) => (
                  <div
                    key={post.id}
                    onClick={() => setActiveTab('propaganda')}
                    className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-stone-500">
                        <span className="font-bold text-red-700">{post.topicName}</span>
                        <span>{post.createdAt}</span>
                      </div>
                      <h4 className="font-serif text-base font-bold text-stone-900 leading-snug">
                        {post.title}
                      </h4>
                      <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed">
                        {post.excerpt}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                      <span>{post.durationMinutes} phút đọc</span>
                      <span className="font-semibold text-red-700">Đọc bài & nghe radio →</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ======================= VIEW: VIRTUAL TOUR (3D or 2D) ======================= */}
        {activeTab === 'virtual_tour' && (
          <div>
            {viewMode === '3d' ? (
              <VirtualMuseum3D
                rooms={database.virtualRooms}
                selectedRoomId={selectedRoomId}
                onSelectRoom={(id) => setSelectedRoomId(id)}
                onSwitchTo2D={() => setViewMode('2d')}
              />
            ) : (
              <VirtualRoom2D
                rooms={database.virtualRooms}
                selectedRoomId={selectedRoomId}
                onSelectRoom={(id) => setSelectedRoomId(id)}
                onSwitchTo3D={() => setViewMode('3d')}
                onGoToPropaganda={() => setActiveTab('propaganda')}
                onGoToGames={() => setActiveTab('games')}
              />
            )}
          </div>
        )}

        {/* ======================= VIEW: HISTORY (Room 2 Direct) ======================= */}
        {activeTab === 'history' && (
          <VirtualRoom2D
            rooms={database.virtualRooms}
            selectedRoomId="room_2"
            onSelectRoom={(id) => setSelectedRoomId(id)}
            onSwitchTo3D={() => {
              setViewMode('3d');
              setActiveTab('virtual_tour');
            }}
            onGoToPropaganda={() => setActiveTab('propaganda')}
            onGoToGames={() => setActiveTab('games')}
          />
        )}

        {/* ======================= VIEW: PROPAGANDA CENTER ======================= */}
        {activeTab === 'propaganda' && (
          <PropagandaCenter
            posts={database.propagandaPosts}
            events={database.events}
            onSavePost={handleSavePost}
            onSaveEvent={handleSaveEvent}
            isAdminLoggedIn={isAdminLoggedIn}
          />
        )}

        {/* ======================= VIEW: GAMES HUB ======================= */}
        {activeTab === 'games' && <GamesHub quizzes={database.quizzes} />}

        {/* ======================= VIEW: MEDIA LIBRARY ======================= */}
        {activeTab === 'library' && (
          <MediaLibrary
            mediaList={database.mediaLibrary}
            onAddMedia={handleAddMedia}
            isAdminLoggedIn={isAdminLoggedIn}
          />
        )}

        {/* ======================= VIEW: ADMIN DASHBOARD ======================= */}
        {activeTab === 'admin' && (
          <AdminDashboard
            database={database}
            onUpdateDatabase={(newDb) => setDatabase(newDb)}
            onLogout={() => {
              setIsAdminLoggedIn(false);
              setActiveTab('home');
            }}
          />
        )}
      </main>

      {/* Floating Tour Guide AI Trigger Button (Section 5) */}
      {!isGuideOpen && (
        <button
          onClick={() => setIsGuideOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white rounded-full p-3.5 shadow-2xl flex items-center gap-2.5 transition-transform hover:scale-105 group"
          title="Hỏi Hướng Dẫn Viên Măng Non AI"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-lg">
            🌱
          </div>
          <span className="text-xs font-bold pr-1">HỎI MĂNG NON AI</span>
        </button>
      )}

      {/* Măng Non AI Chat Assistant Modal */}
      <MangNonAIGuide
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        currentRoomTitle={currentRoom.title}
      />

      {/* Global Audio Settings Modal */}
      <AudioSettingsModal
        isOpen={isAudioSettingsOpen}
        onClose={() => setIsAudioSettingsOpen(false)}
      />

      {/* Admin Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={(user) => {
          setIsAdminLoggedIn(true);
          setActiveTab('admin');
        }}
      />

      {/* Footer */}
      <Footer
        schoolSettings={database.schoolSettings}
        isAdminLoggedIn={isAdminLoggedIn}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onGoToRoom={(roomId) => {
          setSelectedRoomId(roomId);
          setViewMode('3d');
          setActiveTab('virtual_tour');
        }}
      />
    </div>
  );
}
