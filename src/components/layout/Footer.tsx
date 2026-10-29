/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SchoolSettings } from '../../types';
import { ExternalLink, ShieldCheck, Heart } from 'lucide-react';

interface FooterProps {
  schoolSettings: SchoolSettings;
  onOpenLogin: () => void;
  isAdminLoggedIn: boolean;
  onGoToRoom: (roomId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  schoolSettings,
  onOpenLogin,
  isAdminLoggedIn,
  onGoToRoom,
}) => {
  return (
    <footer className="bg-stone-900 text-stone-300 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Unit identity */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-red-600 text-amber-300 flex items-center justify-center font-bold text-sm">
                ★
              </span>
              <span className="font-serif text-lg font-bold text-white tracking-wide">
                PHÒNG TRUYỀN THỐNG ĐỘI ẢO 4.0
              </span>
            </div>
            <p className="text-sm font-medium text-stone-200">
              {schoolSettings.unionName}
            </p>
            <p className="text-xs text-stone-400 leading-relaxed">
              Địa bàn: {schoolSettings.commune} – {schoolSettings.province}
            </p>
            <p className="text-xs italic text-amber-400 font-medium pt-1">
              "{schoolSettings.slogan}"
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-stone-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Bảo vệ quyền riêng tư và an toàn dữ liệu học sinh theo tiêu chuẩn giáo dục</span>
            </div>
          </div>

          {/* Col 2: Direct Room Navigation */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3">
              Không Gian Trưng Bày
            </h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li>
                <button
                  onClick={() => onGoToRoom('room_1')}
                  className="hover:text-white transition-colors"
                >
                  Phòng 1: Sảnh Truyền Thống
                </button>
              </li>
              <li>
                <button
                  onClick={() => onGoToRoom('room_2')}
                  className="hover:text-white transition-colors"
                >
                  Phòng 2: Lịch Sử Đội TNTP
                </button>
              </li>
              <li>
                <button
                  onClick={() => onGoToRoom('room_3')}
                  className="hover:text-white transition-colors"
                >
                  Phòng 3: Bác Hồ Với Thiếu Nhi
                </button>
              </li>
              <li>
                <button
                  onClick={() => onGoToRoom('room_4')}
                  className="hover:text-white transition-colors"
                >
                  Phòng 4: Gương Sáng Anh Hùng
                </button>
              </li>
              <li>
                <button
                  onClick={() => onGoToRoom('room_5')}
                  className="hover:text-white transition-colors"
                >
                  Phòng 5: Liên Đội Chiến Thắng
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Official References & Management */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3">
              Nguồn Tư Liệu Xác Thực
            </h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li>
                <a
                  href="https://thieunhivietnam.vn/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white inline-flex items-center gap-1 transition-colors"
                >
                  <span>Hội đồng Đội Trung ương</span>
                  <ExternalLink className="w-3 h-3 text-stone-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://baotanglichsu.vn/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white inline-flex items-center gap-1 transition-colors"
                >
                  <span>Bảo tàng Lịch sử Quốc gia</span>
                  <ExternalLink className="w-3 h-3 text-stone-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://vule.langson.gov.vn/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white inline-flex items-center gap-1 transition-colors"
                >
                  <span>Cổng thông tin xã Vũ Lễ</span>
                  <ExternalLink className="w-3 h-3 text-stone-500" />
                </a>
              </li>
              <li className="pt-2 border-t border-stone-800">
                <span className="block text-stone-300 font-medium">
                  Phụ trách nội dung: {schoolSettings.managerName}
                </span>
                <span className="text-[11px] text-stone-500 block">
                  {schoolSettings.managerRole}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>© 2026 Liên đội Trường Tiểu học và THCS Chiến Thắng – Xã Vũ Lễ, Tỉnh Lạng Sơn.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              Xây dựng với lòng tự hào <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> công tác Đội
            </span>
            <button
              onClick={onOpenLogin}
              className="text-stone-400 hover:text-white underline transition-colors"
            >
              {isAdminLoggedIn ? 'Bàn Quản trị' : 'Đăng nhập Quản trị viên'}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
