/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import https from 'https';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_DATABASE } from './src/data/initialData.ts';
import { normalizeVietnameseSpeechText } from './src/utils/vietnameseSpeechNormalizer.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Persistent Database Directory & File
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'database.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize database file if not present
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify(INITIAL_DATABASE, null, 2), 'utf-8');
}

function readDatabase() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading database file, fallback to initial data:', err);
    return INITIAL_DATABASE;
  }
}

function writeDatabase(data: any) {
  data.lastUpdated = new Date().toISOString();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  return data;
}

// Gemini AI Client Setup
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// ======================== API ROUTES ========================

// 1. Get entire database
app.get('/api/database', (_req: Request, res: Response) => {
  try {
    const data = readDatabase();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Save entire database
app.post('/api/database', (req: Request, res: Response) => {
  try {
    const incomingData = req.body;
    if (!incomingData || !incomingData.schoolSettings) {
      return res.status(400).json({ success: false, error: 'Dữ liệu không hợp lệ.' });
    }
    const updated = writeDatabase(incomingData);
    res.json({ success: true, message: 'Đã lưu dữ liệu thành công vào cơ sở dữ liệu thật.', data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Reset database to initial state
app.post('/api/reset-database', (_req: Request, res: Response) => {
  try {
    const fresh = writeDatabase(INITIAL_DATABASE);
    res.json({ success: true, message: 'Đã khôi phục dữ liệu ban đầu thành công.', data: fresh });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Admin Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  // Default login for Cô Lương Quỳnh Phương: coquynhphuong / chienthang2026 (or admin / 123456)
  const isMatch =
    (username === 'coquynhphuong' && (password === 'chienthang2026' || password === '123456')) ||
    (username === 'admin' && (password === 'chienthang2026' || password === '123456'));

  if (isMatch) {
    const db = readDatabase();
    res.json({
      success: true,
      user: {
        username: db.adminUser?.username || 'coquynhphuong',
        displayName: db.adminUser?.displayName || 'Cô Lương Quỳnh Phương',
        role: 'admin',
        token: 'token_admin_' + Date.now(),
      },
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Tên đăng nhập hoặc mật khẩu không chính xác. Mặc định: coquynhphuong / chienthang2026',
    });
  }
});

// 5. AI Soạn bài Tuyên truyền (Gemini API)
app.post('/api/gemini/generate-propaganda', async (req: Request, res: Response) => {
  const { topic, targetAudience, durationMinutes, formatType, teacherNotes } = req.body;

  if (!ai) {
    return res.status(200).json({
      success: false,
      isFallback: true,
      message: 'GEMINI_API_KEY chưa được cấu hình. Hệ thống đã cung cấp bài viết mẫu chất lượng cao.',
      data: {
        title: `Bài tuyên truyền: ${topic || 'An toàn giao thông đến trường'}`,
        openingMessage: 'Kính chào quý thầy cô và các bạn đội viên thân mến! Đây là chương trình phát thanh Măng Non Chiến Thắng.',
        mainContent: `Hôm nay, Liên đội Trường Tiểu học và THCS Chiến Thắng xin gửi tới toàn thể các bạn thông điệp về chủ đề: ${topic}. Các bạn hãy luôn rèn luyện tính kỷ luật, tự giác và yêu thương giúp đỡ bạn bè mỗi ngày.`,
        educationalScenario: 'Tình huống: Khi gặp một bạn học sinh gặp khó khăn trên đường đến trường, em sẽ chủ động giúp đỡ bạn như thế nào?',
        interactiveQuestions: [
          'Ý nghĩa của hành động đẹp đối với xây dựng môi trường học đường thân thiện là gì?',
          'Em hãy kể một việc tốt mà em đã làm trong tuần qua?',
        ],
        closingMessage: 'Mỗi bạn học sinh Chiến Thắng hãy là một bông hoa đẹp trong vườn hoa Cháu ngoan Bác Hồ!',
        suggestedImagePrompt: 'Vietnamese school children smiling happily under national flag',
      },
    });
  }

  try {
    const prompt = `
Bạn là chuyên gia phụ trách công tác Đội Thiếu niên Tiền phong Hồ Chí Minh và giáo dục kỹ năng sống tại Việt Nam.
Hãy soạn một bài tuyên truyền hoạt động Đội hoàn chỉnh và sinh động cho Liên đội Trường Tiểu học và THCS Chiến Thắng (xã Vũ Lễ, tỉnh Lạng Sơn), do Cô Lương Quỳnh Phương phụ trách.

THÔNG TIN ĐẦU VÀO:
- Chủ đề: "${topic}"
- Đối tượng học sinh: "${targetAudience === 'tieu_hoc' ? 'Tiểu học (Lớp 1-5)' : targetAudience === 'thcs' ? 'THCS (Lớp 6-9)' : 'Toàn trường Tiểu học & THCS'}"
- Thời lượng: ${durationMinutes || 5} phút
- Hình thức tuyên truyền: "${formatType || 'phát thanh măng non'}"
- Ghi chú thực tế của giáo viên: "${teacherNotes || 'Nêu cao tinh thần tự giác, đoàn kết và an toàn'}"

QUY TẮC BẮT BUỘC:
1. Không được bịa đặt rằng nhà trường đã tổ chức một sự kiện nào đó nếu giáo viên chưa cung cấp tư liệu. Hãy hướng tới kêu gọi hành động, giáo dục ý thức và kỹ năng.
2. Ngôn ngữ tiếng Việt trong sáng, gần gũi, ấm áp, truyền cảm hứng cho học sinh.
3. Trả về định dạng JSON thuần túy (không bọc trong \`\`\`json) với cấu trúc sau:
{
  "title": "Tiêu đề hấp dẫn, ngắn gọn",
  "openingMessage": "Lời chào và phần mở đầu cuốn hút",
  "mainContent": "Nội dung tuyên truyền chính (khoảng 3-4 đoạn mạch lạc, dễ nhớ)",
  "educationalScenario": "Một tình huống thực tế gần gũi với lứa tuổi học sinh",
  "interactiveQuestions": ["Câu hỏi giao lưu 1?", "Câu hỏi giao lưu 2?"],
  "closingMessage": "Thông điệp kết thúc và lời chúc",
  "suggestedImagePrompt": "Mô tả bằng tiếng Anh cho hình ảnh minh họa phù hợp"
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    res.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error('Error generating propaganda:', err);
    res.status(500).json({ success: false, error: err.message || 'Lỗi khi gọi Gemini API' });
  }
});

// 6. Măng Non AI Tour Guide Chatbot
app.post('/api/gemini/chat-guide', async (req: Request, res: Response) => {
  const { message, chatHistory, currentRoomTitle } = req.body;

  if (!ai) {
    return res.json({
      success: true,
      isFallback: true,
      reply: `Chào bạn! Mình là Măng Non AI – Hướng dẫn viên ảo của Trường Tiểu học và THCS Chiến Thắng. Hiện tại bạn đang ở "${currentRoomTitle || 'Phòng truyền thống'}". Hãy khám phá các hiện vật lịch sử Đội, 5 Điều Bác Hồ Dạy và tham gia các trò chơi để rèn luyện nhé!`,
    });
  }

  try {
    const systemInstruction = `
Bạn là "Măng Non AI", nhân vật hướng dẫn viên ảo thân thiện, thông minh, đại diện cho thiếu nhi Trường Tiểu học và THCS Chiến Thắng, xã Vũ Lễ, tỉnh Lạng Sơn.
Người phụ trách nội dung là Cô Lương Quỳnh Phương.
Khẩu hiệu: "Tự hào truyền thống – Tiếp bước cha anh – Măng non vững bước trong kỷ nguyên số".

NHIỆM VỤ:
- Chào đón khách tham quan, các em học sinh tiểu học, THCS và thầy cô giáo.
- Thuyết minh và giải thích về lịch sử Đội TNTP Hồ Chí Minh (thành lập 15/5/1941, 5 đội viên đầu tiên, anh Kim Đồng, chị Võ Thị Sáu, Năm Điều Bác Hồ dạy, ý nghĩa khăn quàng đỏ).
- Giải thích các câu hỏi về kỹ năng sống, an toàn giao thông, bảo vệ môi trường, phòng chống bạo lực học đường.
- Cực kỳ an toàn, lành mạnh, chuẩn mực đạo đức sư phạm. Không trả lời các nội dung không phù hợp lứa tuổi học sinh.
- Nếu được hỏi về thành tích cụ thể hoặc sự kiện của trường chưa có trong dữ liệu, hãy trả lời nhã nhặn rằng dữ liệu đang được Cô Lương Quỳnh Phương và Liên đội tiếp tục cập nhật trong mục quản trị.
- Văn phong: Lễ phép, xưng "mình" hoặc "Măng Non AI", gọi người dùng là "bạn", "các bạn" hoặc "quý thầy cô".
`;

    const contents = [
      { role: 'user', parts: [{ text: `Vị trí hiện tại: ${currentRoomTitle || 'Sảnh truyền thống'}. Câu hỏi của người tham quan: ${message}` }] },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.6,
      },
    });

    const reply = response.text || 'Măng Non AI rất vui được đồng hành cùng bạn trên hành trình khám phá truyền thống Đội!';
    res.json({ success: true, reply });
  } catch (err: any) {
    console.error('Error in Măng Non AI chat:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Tạo Nhiều Nội Dung Bằng AI (Batch Generator: 5, 10, 20 bản nháp)
app.post('/api/gemini/generate-batch', async (req: Request, res: Response) => {
  const { batchType, count, topic } = req.body;
  const numItems = Math.min(Math.max(Number(count) || 5, 1), 20);

  if (!ai) {
    return res.status(200).json({
      success: false,
      isFallback: true,
      message: 'Cần cấu hình GEMINI_API_KEY để kích hoạt tính năng tạo nhiều nội dung tự động bằng AI.',
    });
  }

  try {
    let prompt = '';
    if (batchType === 'questions') {
      prompt = `Hãy tạo ${numItems} câu hỏi trắc nghiệm kiến thức lịch sử Đội TNTP Hồ Chí Minh hoặc kỹ năng sống theo chủ đề "${topic || 'Tổng hợp'}".
Mỗi câu hỏi có 4 phương án, chỉ rõ đáp án đúng (chỉ số 0-3) và lời giải thích ngắn gọn, chính xác.
Định dạng trả về mảng JSON:
[
  {
    "category": "Lịch sử Đội / Kỹ năng",
    "gradeLevel": "chung",
    "difficulty": "de",
    "question": "Nội dung câu hỏi?",
    "options": ["Phương án A", "Phương án B", "Phương án C", "Phương án D"],
    "correctIndex": 0,
    "explanation": "Lời giải thích vì sao phương án đó đúng."
  }
]`;
    } else {
      prompt = `Hãy tạo ${numItems} bài viết tuyên truyền ngắn dạng bản nháp cho Liên đội Trường Tiểu học và THCS Chiến Thắng (xã Vũ Lễ, Lạng Sơn) theo chủ đề "${topic || 'An toàn học đường và Rèn đức luyện tài'}".
Mỗi bài có tiêu đề, mở đầu, nội dung chính ngắn gọn (150 từ), tình huống giáo dục và thông điệp kết thúc.
Định dạng trả về mảng JSON:
[
  {
    "title": "Tiêu đề bài viết",
    "excerpt": "Tóm tắt 1 câu",
    "openingMessage": "Lời chào mở đầu",
    "mainContent": "Nội dung tuyên truyền súc tích",
    "educationalScenario": "Tình huống giáo dục cụ thể",
    "interactiveQuestions": ["Câu hỏi 1?", "Câu hỏi 2?"],
    "closingMessage": "Lời kết",
    "durationMinutes": 5,
    "targetAudience": "all",
    "formatType": "bai_doc"
  }
]`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const parsed = JSON.parse(response.text || '[]');
    res.json({ success: true, count: parsed.length, data: parsed });
  } catch (err: any) {
    console.error('Error in batch generation:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Helper to split text for Google Translate TTS (limit ~180 chars per chunk)
function splitTextIntoTTSChunks(text: string, maxLen = 170): string[] {
  const sentences = text.match(/[^.!?;\n]+[.!?;\n]+/g) || [text];
  const chunks: string[] = [];
  let current = '';
  for (const s of sentences) {
    if ((current + ' ' + s).trim().length <= maxLen) {
      current = (current + ' ' + s).trim();
    } else {
      if (current) chunks.push(current);
      if (s.length > maxLen) {
        const words = s.split(' ');
        let sub = '';
        for (const w of words) {
          if ((sub + ' ' + w).trim().length <= maxLen) {
            sub = (sub + ' ' + w).trim();
          } else {
            if (sub) chunks.push(sub);
            sub = w;
          }
        }
        current = sub ? sub : '';
      } else {
        current = s.trim();
      }
    }
  }
  if (current) chunks.push(current);
  return chunks.filter((c) => c.trim().length > 0);
}

function fetchViAudioChunk(text: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=${encodeURIComponent(text)}`;
    https
      .get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
        const data: Buffer[] = [];
        res.on('data', (c) => data.push(c));
        res.on('end', () => resolve(Buffer.concat(data)));
      })
      .on('error', reject);
  });
}

// 8. Text-to-Speech Streaming Endpoint (GET /api/tts/stream?text=...)
app.get('/api/tts/stream', async (req: Request, res: Response) => {
  const rawText = String(req.query.text || '').trim();
  if (!rawText) {
    return res.status(400).send('Thiếu nội dung văn bản.');
  }

  try {
    const normalized = normalizeVietnameseSpeechText(rawText);
    const chunks = splitTextIntoTTSChunks(normalized);
    if (chunks.length === 0) {
      return res.status(400).send('Văn bản rỗng sau khi chuẩn hóa.');
    }

    const buffers = await Promise.all(chunks.map((c) => fetchViAudioChunk(c)));
    const combined = Buffer.concat(buffers);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', combined.length);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(combined);
  } catch (err: any) {
    console.error('Error generating Vietnamese TTS stream:', err);
    res.status(500).send('Lỗi máy chủ khi tạo giọng đọc tiếng Việt.');
  }
});

// 9. Text-to-Speech JSON Endpoint (POST /api/tts)
app.post('/api/tts', async (req: Request, res: Response) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ success: false, error: 'Thiếu nội dung văn bản cần đọc.' });
  }

  try {
    const normalized = normalizeVietnameseSpeechText(String(text));
    const chunks = splitTextIntoTTSChunks(normalized);
    const buffers = await Promise.all(chunks.map((c) => fetchViAudioChunk(c)));
    const combined = Buffer.concat(buffers);
    const base64Audio = combined.toString('base64');

    res.json({
      success: true,
      audioDataUrl: `data:audio/mpeg;base64,${base64Audio}`,
      streamUrl: `/api/tts/stream?text=${encodeURIComponent(normalized.slice(0, 500))}`,
      engine: 'google-vietnamese',
      message: 'Giọng đọc Tiếng Việt chuẩn xác tự nhiên đã sẵn sàng.',
    });
  } catch (err: any) {
    console.error('Error in /api/tts:', err);
    res.json({
      success: true,
      streamUrl: `/api/tts/stream?text=${encodeURIComponent(text.slice(0, 300))}`,
      engine: 'google-vietnamese-stream',
    });
  }
});

// ======================== STATIC & VITE SERVING ========================

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[Măng Non Chiến Thắng 4.0] Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
