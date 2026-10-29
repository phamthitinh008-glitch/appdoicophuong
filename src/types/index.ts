/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SchoolSettings {
  schoolName: string;
  unionName: string;
  commune: string;
  province: string;
  managerName: string;
  managerRole: string;
  managerEmail: string;
  slogan: string;
  welcomeMessage: string;
  heroImageUrl: string;
  foundedInfoNote: string;
}

export interface Exhibit {
  id: string;
  roomId: string;
  title: string;
  subtitle?: string;
  historicalDate?: string;
  category: string;
  summary: string;
  detailedContent: string;
  imageUrl: string;
  audioNarrationText: string;
  keyPoints?: string[];
  interactiveQuiz?: {
    question: string;
    options: string[];
    answerIndex: number;
    explanation: string;
  };
  tags?: string[];
  status: 'published' | 'draft';
  verifiedSource?: string;
}

export interface VirtualRoom {
  id: string;
  roomNumber: number;
  title: string;
  shortTitle: string;
  subtitle: string;
  description: string;
  audioNarrationText: string;
  coverImage: string;
  accentColor: string;
  exhibits: Exhibit[];
}

export interface PropagandaTopic {
  id: string;
  title: string;
  shortDesc: string;
  iconName: string;
  colorScheme: string;
}

export interface PropagandaPost {
  id: string;
  title: string;
  topicId: string;
  topicName: string;
  targetAudience: 'all' | 'tieu_hoc' | 'thcs';
  formatType: 'bai_doc' | 'sinh_hoat_duoi_co' | 'phat_thanh' | 'ban_tin_web';
  durationMinutes: number;
  excerpt: string;
  openingMessage: string;
  mainContent: string;
  educationalScenario: string;
  interactiveQuestions: string[];
  closingMessage: string;
  suggestedImagePrompt?: string;
  imageUrl?: string;
  createdAt: string;
  author: string;
  status: 'published' | 'draft';
  audioNarrationText?: string;
  isWeeklyHighlight?: boolean;
}

export interface EventItem {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  organizer: string;
  description: string;
  status: 'ke_hoach' | 'dang_thuc_hien' | 'hoan_thanh';
  attachedMaterials?: string;
  convertedToArticleId?: string;
}

export interface QuizQuestion {
  id: string;
  category: string;
  gameType: 'rung_chuong_vang' | 'ai_hieu_doi_hon' | 'hanh_trinh_khan_quang' | 'ghep_tranh' | 'tuyen_truyen_vien';
  gradeLevel: 'tieu_hoc' | 'thcs' | 'chung';
  difficulty: 'de' | 'trung_binh' | 'nang_cao';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  historicalContext?: string;
}

export interface MediaItem {
  id: string;
  title: string;
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  academicYear: string;
  category: string;
  description: string;
  sourceNote: string;
  date: string;
  facebookRefUrl?: string;
}

export interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: 'admin' | 'editor';
}

export interface AppDatabase {
  schoolSettings: SchoolSettings;
  virtualRooms: VirtualRoom[];
  propagandaPosts: PropagandaPost[];
  events: EventItem[];
  quizzes: QuizQuestion[];
  mediaLibrary: MediaItem[];
  adminUser: AdminUser;
  lastUpdated: string;
}

export type { PlaybackState, TTSPreferences } from '../utils/speech';
