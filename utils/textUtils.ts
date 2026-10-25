/** Chia văn bản thành các đoạn <= maxLen, ưu tiên cắt ở cuối câu, rồi dấu phẩy, rồi khoảng trắng. */
export const splitText = (text: string, maxLen: number): string[] => {
  const clean = text.replace(/\r/g, '').trim();
  if (clean.length <= maxLen) return clean ? [clean] : [];

  const sentences = clean.match(/[^.!?…\n]+[.!?…]*\s*|\n+/g) || [clean];
  const chunks: string[] = [];
  let cur = '';

  const push = () => {
    if (cur.trim()) chunks.push(cur.trim());
    cur = '';
  };

  for (const s of sentences) {
    if ((cur + s).length <= maxLen) {
      cur += s;
      continue;
    }
    push();
    if (s.length <= maxLen) {
      cur = s;
      continue;
    }
    // Câu quá dài: cắt tiếp theo dấu phẩy / khoảng trắng
    let rest = s;
    while (rest.length > maxLen) {
      const slice = rest.slice(0, maxLen);
      let cut = Math.max(slice.lastIndexOf(','), slice.lastIndexOf(';'));
      if (cut < maxLen * 0.4) cut = slice.lastIndexOf(' ');
      if (cut <= 0) cut = maxLen - 1;
      chunks.push(rest.slice(0, cut + 1).trim());
      rest = rest.slice(cut + 1);
    }
    cur = rest;
  }
  push();
  return chunks;
};

export const countWords = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0);

/** Ước lượng thời lượng đọc tiếng Việt (~ 150 từ/phút ở tốc độ 1x). */
export const estimateSeconds = (text: string, speed = 1) => Math.round((countWords(text) / 150) * 60 / speed);

export const formatTime = (sec: number) => {
  if (!isFinite(sec)) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const formatBytes = (b: number) =>
  b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;

export const makeTitle = (text: string) => {
  const t = text.trim().replace(/\s+/g, ' ');
  return t.length > 48 ? `${t.slice(0, 48)}…` : t || 'Bản ghi';
};

export const slugify = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40)
    .toLowerCase() || 'vietvoice';
