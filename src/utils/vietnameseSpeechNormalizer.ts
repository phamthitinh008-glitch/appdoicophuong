/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Chuyển số nguyên từ 0 đến 9999 thành chữ tiếng Việt chuẩn xác
 */
export function numberToVietnameseWords(n: number): string {
  if (isNaN(n) || n < 0) return String(n);
  const units = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

  if (n < 10) return units[n];

  if (n < 20) {
    if (n === 10) return 'mười';
    if (n === 15) return 'mười lăm';
    return 'mười ' + units[n % 10];
  }

  if (n < 100) {
    const tens = Math.floor(n / 10);
    const rem = n % 10;
    let res = tens === 2 ? 'hai mươi' : tens === 3 ? 'ba mươi' : tens === 4 ? 'bốn mươi' : tens === 5 ? 'năm mươi' : units[tens] + ' mươi';
    if (rem === 1) res += ' mốt';
    else if (rem === 4) res += ' tư';
    else if (rem === 5) res += ' lăm';
    else if (rem > 0) res += ' ' + units[rem];
    return res;
  }

  if (n < 1000) {
    const h = Math.floor(n / 100);
    const rem = n % 100;
    if (rem === 0) return units[h] + ' trăm';
    if (rem < 10) return units[h] + ' trăm lẻ ' + units[rem];
    return units[h] + ' trăm ' + numberToVietnameseWords(rem);
  }

  if (n < 10000) {
    const th = Math.floor(n / 1000);
    const rem = n % 1000;
    const thWord = th === 1 ? 'một nghìn' : units[th] + ' nghìn';
    if (rem === 0) return thWord;
    return thWord + ' ' + numberToVietnameseWords(rem);
  }

  return String(n);
}

/**
 * Chuyển đổi định dạng ngày tháng năm sang từ ngữ tiếng Việt tự nhiên
 * Ví dụ: 15/5/1941 -> ngày mười lăm tháng năm năm một nghìn chín trăm bốn mươi mốt
 */
export function convertDatesToVietnameseWords(text: string): string {
  // Pattern: dd/mm/yyyy hoặc d/m/yyyy hoặc dd-mm-yyyy
  return text.replace(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/g, (_match, d, m, y) => {
    const dayNum = parseInt(d, 10);
    const monthNum = parseInt(m, 10);
    const yearNum = parseInt(y, 10);

    const dayWord = dayNum === 1 ? 'mùng một' : dayNum === 2 ? 'mùng hai' : dayNum <= 10 ? `mùng ${numberToVietnameseWords(dayNum)}` : numberToVietnameseWords(dayNum);
    const monthWord = monthNum === 4 ? 'tư' : numberToVietnameseWords(monthNum);
    const yearWord = numberToVietnameseWords(yearNum);

    return `ngày ${dayWord} tháng ${monthWord} năm ${yearWord}`;
  });
}

/**
 * Chuẩn hóa toàn diện văn bản trước khi đưa vào bộ phát âm Text-to-Speech tiếng Việt:
 * 1. Mở rộng từ viết tắt chuyên ngành Đội và giáo dục
 * 2. Chuyển đổi số ngày tháng, số phòng, số điều luật sang chữ
 * 3. Loại bỏ Markdown, HTML tags, link URL, ký tự đặc biệt gây vấp giọng
 * 4. Đảm bảo văn bản trong sáng, tự nhiên, thuần tiếng Việt
 */
export function normalizeVietnameseSpeechText(input: string): string {
  if (!input) return '';

  let text = input;

  // 1. Loại bỏ mã HTML nếu có
  text = text.replace(/<[^>]+>/g, ' ');

  // 2. Loại bỏ các đường dẫn URL
  text = text.replace(/https?:\/\/\S+/gi, ' ');

  // 3. Loại bỏ ký tự Markdown (link, in đậm, nghiêng, tiêu đề, code, quote)
  text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1'); // [text](url) -> text
  text = text.replace(/[*#_~`>+=-]/g, ' ');
  text = text.replace(/^\s*[-*+]\s+/gm, ' '); // bullet points

  // 4. Loại bỏ các biểu tượng trang trí (emoji, stars, arrows, checkmarks)
  text = text.replace(/[★🌱🏆✓▶▲▼·•\u2022\u2605\u2713\u2714\u2728\u{1F300}-\u{1F9FF}]/gu, ' ');

  // 5. Chuẩn hóa ngày tháng năm trước khi chuẩn hóa các số khác
  text = convertDatesToVietnameseWords(text);

  // 6. Mở rộng từ viết tắt chuẩn công tác Đội & Trường học
  const replacements: [RegExp, string][] = [
    [/\bĐội TNTP Hồ Chí Minh\b/gi, 'Đội Thiếu niên Tiền phong Hồ Chí Minh'],
    [/\bTNTP Hồ Chí Minh\b/gi, 'Thiếu niên Tiền phong Hồ Chí Minh'],
    [/\bĐội TNTP\b/gi, 'Đội Thiếu niên Tiền phong'],
    [/\bTNTP\b/gi, 'Thiếu niên Tiền phong'],
    [/\bTH & THCS\b/gi, 'Tiểu học và Trung học cơ sở'],
    [/\bTH và THCS\b/gi, 'Tiểu học và Trung học cơ sở'],
    [/\bTHCS\b/gi, 'Trung học cơ sở'],
    [/\bLLVTND\b/gi, 'Lực lượng Vũ trang Nhân dân'],
    [/\bNXB\b/gi, 'Nhà xuất bản'],
    [/\bPCCC\b/gi, 'Phòng cháy chữa cháy'],
    [/\bATGT\b/gi, 'An toàn giao thông'],
    [/\bTP HCM\b/gi, 'Thành phố Hồ Chí Minh'],
    [/\bTP\.HCM\b/gi, 'Thành phố Hồ Chí Minh'],
    [/\bTP\b/gi, 'Thành phố'],
    [/\bBCH\b/gi, 'Ban Chấp hành'],
    [/\bLĐ\b/gi, 'Liên đội'],
    [/\bCĐ\b/gi, 'Chi đội'],
    [/\bHDV\b/gi, 'Hướng dẫn viên'],
    [/\b4\.0\b/g, 'bốn chấm không'],
    [/\bKhóa X\b/gi, 'Khóa mười'],
    [/\bKhóa XI\b/gi, 'Khóa mười một'],
    [/\bKhóa XII\b/gi, 'Khóa mười hai'],
  ];

  for (const [pattern, repl] of replacements) {
    text = text.replace(pattern, repl);
  }

  // 7. Chuẩn hóa Phòng 1..8, Điều 1..5, Số 01..10
  text = text.replace(/\bPhòng 1\b/gi, 'Phòng một');
  text = text.replace(/\bPhòng 2\b/gi, 'Phòng hai');
  text = text.replace(/\bPhòng 3\b/gi, 'Phòng ba');
  text = text.replace(/\bPhòng 4\b/gi, 'Phòng bốn');
  text = text.replace(/\bPhòng 5\b/gi, 'Phòng năm');
  text = text.replace(/\bPhòng 6\b/gi, 'Phòng sáu');
  text = text.replace(/\bPhòng 7\b/gi, 'Phòng bảy');
  text = text.replace(/\bPhòng 8\b/gi, 'Phòng tám');

  text = text.replace(/\bĐiều 1\b/gi, 'Điều một');
  text = text.replace(/\bĐiều 2\b/gi, 'Điều hai');
  text = text.replace(/\bĐiều 3\b/gi, 'Điều ba');
  text = text.replace(/\bĐiều 4\b/gi, 'Điều bốn');
  text = text.replace(/\bĐiều 5\b/gi, 'Điều năm');

  text = text.replace(/\bSố 01\b/gi, 'Số một');
  text = text.replace(/\bSố 02\b/gi, 'Số hai');
  text = text.replace(/\bSố 03\b/gi, 'Số ba');

  // 8. Chuẩn hóa chữ "AI" (Trí tuệ nhân tạo) nếu đứng riêng hoặc trong Măng Non AI
  text = text.replace(/\bMăng Non AI\b/gi, 'Măng Non Ai');
  text = text.replace(/\bAI\b/g, 'trí tuệ nhân tạo');

  // 9. Dọn dẹp dấu câu, khoảng trắng thừa
  text = text
    .replace(/["“”«»]/g, '')
    .replace(/[()]/g, ', ')
    .replace(/\s+/g, ' ')
    .replace(/\s*([,.;:!?])\s*/g, '$1 ')
    .replace(/[,;]\s*[,;]/g, ',')
    .trim();

  return text;
}
