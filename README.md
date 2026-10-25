# VietVoice Studio — Chuyển văn bản thành giọng nói tiếng Việt

Ứng dụng chạy **ngay trên máy**, không cần tên miền hay hosting.

## Hai bộ đọc

| Bộ đọc | Cần mạng | Xuất file | Ghi chú |
|---|---|---|---|
| **Gemini AI** | Có | `.wav` | Chất lượng cao, 5 giọng. Nhập API key ở mục *Cài đặt*. |
| **Giọng của máy** | Không | Không (chỉ nghe) | Dùng giọng tiếng Việt cài sẵn của Windows/macOS. |

Cài giọng tiếng Việt cho Windows: *Cài đặt → Thời gian & ngôn ngữ → Giọng nói → Thêm giọng → Tiếng Việt*.

Các file tạo bằng Gemini được lưu trong **Thư viện** (IndexedDB của trình duyệt), nghe lại và tải xuống được cả khi mất mạng.

## Chạy khi phát triển

```bash
npm install
npm run dev          # mở http://localhost:3000
```

## Đóng gói bản offline (1 file HTML)

```bash
npm run build:offline
```

Kết quả: `dist-offline/index.html` — toàn bộ mã, giao diện và phông chữ nằm trong một file.
Chỉ cần nhấp đúp để mở bằng Chrome/Edge, chép sang máy khác qua USB/Zalo vẫn chạy.

Khi có tên miền và host: `npm run build` rồi tải thư mục `dist/` lên.

## API key

Có hai cách:
- Nhập trong mục **Cài đặt** của ứng dụng (lưu ở trình duyệt máy đó).
- Hoặc tạo file `.env.local` có dòng `GEMINI_API_KEY=...` trước khi build.

> Lưu ý: nếu build kèm key trong `.env.local`, key sẽ nằm trong file HTML — đừng chia sẻ file đó ra ngoài.
