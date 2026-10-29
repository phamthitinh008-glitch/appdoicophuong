/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MediaItem } from '../../types';
import {
  Image,
  Video,
  FileText,
  Search,
  ExternalLink,
  Plus,
  Play,
  Filter,
  Eye,
  Calendar,
  X,
} from 'lucide-react';

interface MediaLibraryProps {
  mediaList: MediaItem[];
  onAddMedia: (media: MediaItem) => void;
  isAdminLoggedIn: boolean;
}

export const MediaLibrary: React.FC<MediaLibraryProps> = ({
  mediaList,
  onAddMedia,
  isAdminLoggedIn,
}) => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMediaPreview, setActiveMediaPreview] = useState<MediaItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New media form state
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'image' | 'video' | 'audio' | 'document'>('image');
  const [newUrl, setNewUrl] = useState('');
  const [newCategory, setNewCategory] = useState('Hoạt động Đội');
  const [newDesc, setNewDesc] = useState('');

  const filteredMedia = mediaList.filter((item) => {
    const matchType = selectedType === 'all' || item.type === selectedType;
    const matchSearch =
      searchQuery.trim() === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchSearch;
  });

  const handleCreateMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) {
      alert('Vui lòng nhập tiêu đề và đường dẫn hợp lệ.');
      return;
    }

    const newItem: MediaItem = {
      id: 'med_' + Date.now(),
      title: newTitle,
      type: newType,
      url: newUrl,
      academicYear: '2026-2027',
      category: newCategory,
      description: newDesc,
      sourceNote: 'Ban biên tập tải lên',
      date: new Date().toISOString().split('T')[0],
      facebookRefUrl: newUrl.includes('facebook.com') ? newUrl : undefined,
    };

    onAddMedia(newItem);
    setIsAddModalOpen(false);
    setNewTitle('');
    setNewUrl('');
    setNewDesc('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-widest">
            <Image className="w-4 h-4" />
            <span>Kho Tư Liệu Số Hóa Liên Đội Chiến Thắng</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
            THƯ VIỆN ẢNH & PHIM TƯ LIỆU MĂNG NON
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Lưu giữ hình ảnh các kỳ Đại hội Liên đội, Lễ chào cờ, Kết nạp đội viên và các hoạt động giáo dục truyền thống.
          </p>
        </div>

        {isAdminLoggedIn && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tải Lên Tư Liệu Mới</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Type Tabs */}
        <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'image', label: 'Hình ảnh' },
            { id: 'video', label: 'Video clip' },
            { id: 'document', label: 'Tài liệu' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                selectedType === tab.id ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên tư liệu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMedia.map((item) => (
          <div
            key={item.id}
            onClick={() => setActiveMediaPreview(item)}
            className="group bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="relative aspect-video bg-stone-900 overflow-hidden">
                {item.type === 'image' ? (
                  <img
                    src={item.url}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-stone-900 text-stone-400 p-4">
                    <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center mb-2 shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 ml-0.5" />
                    </div>
                    <span className="text-xs font-medium text-stone-300 text-center line-clamp-1">
                      {item.title}
                    </span>
                  </div>
                )}
                <div className="absolute top-2.5 left-2.5 bg-stone-900/80 backdrop-blur text-white text-[10px] font-semibold px-2 py-0.5 rounded">
                  {item.category}
                </div>
              </div>

              <div className="p-4 space-y-1.5">
                <h4 className="font-serif text-sm font-bold text-stone-900 group-hover:text-red-700 transition-colors leading-snug">
                  {item.title}
                </h4>
                <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>

            <div className="px-4 py-2.5 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
              <span>{item.date}</span>
              <span className="font-medium text-red-700 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                <span>Xem chi tiết</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Media Detail & Video Player Modal */}
      {activeMediaPreview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-stone-200">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between">
              <span className="text-xs font-bold text-red-600 uppercase">
                {activeMediaPreview.category} · {activeMediaPreview.academicYear}
              </span>
              <button
                onClick={() => setActiveMediaPreview(null)}
                className="p-1.5 text-stone-400 hover:text-stone-900 rounded-lg hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {activeMediaPreview.type === 'video' ? (
                <div className="space-y-3">
                  <div className="aspect-video bg-stone-900 rounded-2xl flex flex-col items-center justify-center text-white p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-2xl mb-3 shadow-lg">
                      ▶
                    </div>
                    <h3 className="font-serif text-lg font-bold">
                      {activeMediaPreview.title}
                    </h3>
                    <p className="text-xs text-stone-400 mt-1 max-w-md">
                      Tư liệu hoạt động Đội trường học do nhà trường cung cấp.
                    </p>
                    {activeMediaPreview.facebookRefUrl && (
                      <a
                        href={activeMediaPreview.facebookRefUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <span>Xem video tham khảo trên Facebook</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl overflow-hidden aspect-video bg-stone-100 border border-stone-200">
                  <img
                    src={activeMediaPreview.url}
                    alt={activeMediaPreview.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div>
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  {activeMediaPreview.title}
                </h3>
                <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                  {activeMediaPreview.description}
                </p>
                <p className="text-[11px] text-stone-400 mt-2">
                  Nguồn xác thực: {activeMediaPreview.sourceNote}
                </p>
              </div>
            </div>

            <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
              <button
                onClick={() => setActiveMediaPreview(null)}
                className="px-4 py-2 bg-stone-900 text-white text-xs font-bold rounded-xl"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Media Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateMedia}
            className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-stone-200"
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Thêm Tư Liệu Vào Thư Viện
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-stone-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Tiêu đề tư liệu *
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="VD: Lễ chào cờ thứ Hai tuần 8..."
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Loại tư liệu
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              >
                <option value="image">Hình ảnh (JPG, PNG)</option>
                <option value="video">Video (MP4 hoặc link)</option>
                <option value="document">Tài liệu (PDF, Văn bản)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Đường dẫn tệp (URL) *
              </label>
              <input
                type="text"
                required
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://... hoặc /src/assets/images/..."
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Chuyên mục
              </label>
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Mô tả ngắn gọn
              </label>
              <textarea
                rows={2}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl"
              >
                Lưu Tư Liệu
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
