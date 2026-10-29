/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Compass,
  Menu,
  X,
  Shield,
  Volume2,
  VolumeX,
  Volume1,
  Pause,
  Play,
  Sparkles,
  Settings,
} from 'lucide-react';
import { speechService } from '../../utils/speech';
import { PlaybackState } from '../../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdminLoggedIn: boolean;
  onOpenLogin: () => void;
  onOpenGuide: () => void;
  onOpenAudioSettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isAdminLoggedIn,
  onOpenLogin,
  onOpenGuide,
  onOpenAudioSettings,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackState, setPlaybackState] = useState<PlaybackState>(speechService.getState());

  useEffect(() => {
    const handleUpdate = (state: PlaybackState) => {
      setPlaybackState(state);
    };
    speechService.addListener(handleUpdate);
    return () => speechService.removeListener(handleUpdate);
  }, []);

  const handleSpeakerClick = () => {
    if (playbackState.isSpeaking) {
      if (playbackState.isPaused) {
        speechService.resume();
      } else {
        speechService.pause();
      }
    } else if (isMuted) {
      setIsMuted(false);
      speechService.speak(
        'Âm thanh thuyết minh tiếng Việt đã được bật. Chúc các em có buổi tham quan bổ ích.',
        { title: 'Thông báo âm thanh' }
      );
    } else {
      // Toggle to muted or open settings
      setIsMuted(true);
      speechService.stop();
    }
  };

  const navItems = [
    { id: 'home', label: 'Trang Chủ' },
    { id: 'virtual_tour', label: 'Phòng Ảo 3D' },
    { id: 'history', label: 'Lịch Sử Đội' },
    { id: 'propaganda', label: 'Bản Tin Măng Non' },
    { id: 'games', label: 'Trò Chơi' },
    { id: 'library', label: 'Thư Viện Số' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                setActiveTab('home');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-amber-300 font-bold shadow-sm shadow-red-200 group-hover:bg-red-700 transition-colors">
                <span className="text-base tracking-tighter">★</span>
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-lg font-bold text-stone-900 tracking-tight leading-tight group-hover:text-red-700 transition-colors whitespace-nowrap">
                  MĂNG NON CHIẾN THẮNG
                </span>
                <span className="text-[11px] font-medium text-stone-500 whitespace-nowrap">
                  Liên Đội Trường TH & THCS Chiến Thắng
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Clean single-line text navigation links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-stone-600">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative py-1 transition-colors whitespace-nowrap shrink-0 hover:text-stone-900 ${
                    isActive ? 'text-red-600 font-semibold' : ''
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Audio 4-State Controller */}
            <div className="flex items-center gap-1 bg-stone-100 rounded-lg p-0.5 border border-stone-200">
              <button
                onClick={handleSpeakerClick}
                title={
                  playbackState.isSpeaking
                    ? playbackState.isPaused
                      ? 'Đã tạm dừng (Nhấn để tiếp tục)'
                      : 'Đang phát thuyết minh tiếng Việt (Nhấn để tạm dừng)'
                    : isMuted
                    ? 'Đã tắt âm thanh (Nhấn để bật)'
                    : 'Âm thanh đã bật (Nhấn để tắt)'
                }
                className={`p-1.5 rounded-md transition-all flex items-center gap-1 text-xs font-semibold ${
                  playbackState.isSpeaking
                    ? playbackState.isPaused
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-emerald-600 text-white animate-pulse shadow-xs'
                    : isMuted
                    ? 'text-red-600 hover:bg-stone-200'
                    : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200'
                }`}
              >
                {playbackState.isSpeaking ? (
                  playbackState.isPaused ? (
                    <>
                      <Pause className="w-4 h-4 text-amber-800" />
                      <span className="hidden xl:inline text-[10px] text-amber-900 font-bold">Tạm dừng</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 text-white" />
                      <span className="hidden xl:inline text-[10px] text-white font-bold">Đang đọc</span>
                    </>
                  )
                ) : isMuted ? (
                  <VolumeX className="w-4 h-4 text-red-600" />
                ) : (
                  <Volume2 className="w-4 h-4 text-stone-700" />
                )}
              </button>

              {onOpenAudioSettings && (
                <button
                  onClick={onOpenAudioSettings}
                  title="Cài đặt giọng đọc tiếng Việt"
                  className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-200 rounded-md transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Tour Guide Button */}
            <button
              onClick={onOpenGuide}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Hỏi Măng Non AI</span>
            </button>

            {/* Admin or Tour Action Button */}
            <button
              onClick={() => {
                if (isAdminLoggedIn) {
                  setActiveTab('admin');
                } else {
                  onOpenLogin();
                }
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                isAdminLoggedIn
                  ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm'
                  : 'bg-stone-900 text-white hover:bg-stone-800'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{isAdminLoggedIn ? 'Bàn Quản Trị' : 'Quản Trị'}</span>
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-stone-600 hover:text-stone-900 rounded-lg"
              aria-label="Mở menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-stone-200 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === item.id
                    ? 'bg-red-50 text-red-700 font-semibold'
                    : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                {item.label}
              </button>
            ))}
            <div className="pt-2 border-t border-stone-200 flex flex-col gap-2">
              <button
                onClick={() => {
                  onOpenGuide();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-700 bg-red-50 font-medium flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Hỏi Hướng dẫn viên Măng Non AI</span>
              </button>
              <button
                onClick={() => {
                  if (isAdminLoggedIn) {
                    setActiveTab('admin');
                  } else {
                    onOpenLogin();
                  }
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-stone-900 bg-stone-100 font-medium flex items-center gap-2"
              >
                <Shield className="w-4 h-4 text-stone-600" />
                <span>{isAdminLoggedIn ? 'Bàn Quản Trị Viên' : 'Đăng Nhập Quản Trị'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
