import { GoogleGenAI, Modality } from "@google/genai";
import { VoiceName } from "../types";
import { base64ToUint8Array, createWavBlob } from "../utils/wavUtils";
import { splitText } from "../utils/textUtils";

const SAMPLE_RATE = 24000;
// Mỗi lần gọi API chỉ gửi một đoạn vừa phải để giọng đọc ổn định
const CHUNK_SIZE = 2000;

const getSpeedInstruction = (speed: number): string => {
  if (speed <= 0.5) return "Đọc rất chậm: ";
  if (speed <= 0.75) return "Đọc chậm: ";
  if (speed < 1.0) return "Đọc hơi chậm: ";
  if (speed === 1.0) return "";
  if (speed <= 1.25) return "Đọc hơi nhanh: ";
  if (speed <= 1.5) return "Đọc nhanh: ";
  return "Đọc rất nhanh: ";
};

export const generateSpeech = async (
  text: string,
  voiceName: VoiceName,
  speed: number = 1,
  apiKey: string,
  onProgress?: (done: number, total: number) => void
): Promise<Blob> => {
  const key = apiKey || process.env.API_KEY;
  if (!key) {
    throw new Error("Chưa có API key Gemini. Vào mục Cài đặt để nhập khóa.");
  }

  const ai = new GoogleGenAI({ apiKey: key });
  const instruction = getSpeedInstruction(speed);
  const chunks = splitText(text, CHUNK_SIZE);
  const parts: Uint8Array[] = [];

  onProgress?.(0, chunks.length);
  for (let i = 0; i < chunks.length; i++) {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `${instruction}${chunks[i]}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("Gemini không trả về dữ liệu âm thanh.");
    }
    parts.push(base64ToUint8Array(base64Audio));
    onProgress?.(i + 1, chunks.length);
  }

  // Ghép PCM các đoạn, chèn 0.3s lặng giữa các đoạn cho tự nhiên
  const gap = new Uint8Array(Math.round(SAMPLE_RATE * 0.3) * 2);
  const total = parts.reduce((s, p) => s + p.length, 0) + gap.length * (parts.length - 1);
  const pcm = new Uint8Array(total);
  let offset = 0;
  parts.forEach((p, i) => {
    pcm.set(p, offset);
    offset += p.length;
    if (i < parts.length - 1) offset += gap.length;
  });

  return createWavBlob(pcm, SAMPLE_RATE);
};
