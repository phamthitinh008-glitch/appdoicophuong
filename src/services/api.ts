/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppDatabase, PropagandaPost, QuizQuestion, EventItem, MediaItem } from '../types';
import { INITIAL_DATABASE } from '../data/initialData';

const STORAGE_KEY = 'mang_non_chien_thang_db_v1';

export const apiService = {
  // Fetch database with server-first + localStorage fallback
  async getDatabase(): Promise<AppDatabase> {
    try {
      const res = await fetch('/api/database');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(json.data));
          return json.data;
        }
      }
    } catch (e) {
      console.warn('Cannot fetch from server, using local cache:', e);
    }

    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (err) {
        console.error('Failed to parse cached database:', err);
      }
    }
    return INITIAL_DATABASE;
  },

  // Save database to both server and localStorage
  async saveDatabase(db: AppDatabase): Promise<{ success: boolean; message: string }> {
    db.lastUpdated = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));

    try {
      const res = await fetch('/api/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(db),
      });
      if (res.ok) {
        const json = await res.json();
        return { success: true, message: json.message || 'Đã lưu vào cơ sở dữ liệu máy chủ.' };
      }
    } catch (e) {
      console.warn('Server save failed, saved to local persistent storage:', e);
    }

    return { success: true, message: 'Đã lưu an toàn vào bộ nhớ trình duyệt (sẵn sàng đồng bộ máy chủ).' };
  },

  // Reset database to initial state
  async resetDatabase(): Promise<AppDatabase> {
    try {
      const res = await fetch('/api/reset-database', { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(json.data));
          return json.data;
        }
      }
    } catch (e) {
      console.warn('Server reset failed, resetting local store:', e);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATABASE));
    return INITIAL_DATABASE;
  },

  // Generate propaganda article via server Gemini route
  async generatePropaganda(params: {
    topic: string;
    targetAudience: 'all' | 'tieu_hoc' | 'thcs';
    durationMinutes: number;
    formatType: string;
    teacherNotes?: string;
  }) {
    const res = await fetch('/api/gemini/generate-propaganda', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return await res.json();
  },

  // Măng Non AI Guide chat
  async chatWithGuide(params: { message: string; currentRoomTitle: string }) {
    const res = await fetch('/api/gemini/chat-guide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return await res.json();
  },

  // Generate batch content (5, 10, 20 items)
  async generateBatch(params: { batchType: 'propaganda' | 'questions'; count: number; topic: string }) {
    const res = await fetch('/api/gemini/generate-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return await res.json();
  },

  // TTS audio endpoint
  async requestTTS(text: string) {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('TTS request failed:', e);
    }
    return { success: false, engine: 'web-speech' };
  },

  // Admin login check
  async loginAdmin(username: string, password: string) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      return await res.json();
    } catch (e) {
      // Offline fallback login for default credentials
      if (
        (username === 'coquynhphuong' && password === 'chienthang2026') ||
        (username === 'admin' && password === 'chienthang2026')
      ) {
        return {
          success: true,
          user: {
            username: 'coquynhphuong',
            displayName: 'Cô Lương Quỳnh Phương',
            role: 'admin',
          },
        };
      }
      return { success: false, message: 'Lỗi kết nối máy chủ.' };
    }
  },
};
