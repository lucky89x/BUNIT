export enum VoiceName {
  Puck = 'Puck',
  Charon = 'Charon',
  Kore = 'Kore',
  Fenrir = 'Fenrir',
  Zephyr = 'Zephyr',
}

export interface VoiceOption {
  id: VoiceName;
  name: string;
  gender: 'Nam' | 'Nữ';
  description: string;
}

export const VOICE_OPTIONS: VoiceOption[] = [
  { id: VoiceName.Puck, name: 'Puck', gender: 'Nam', description: 'Giọng trầm, ổn định' },
  { id: VoiceName.Charon, name: 'Charon', gender: 'Nam', description: 'Giọng sâu, kể chuyện' },
  { id: VoiceName.Kore, name: 'Kore', gender: 'Nữ', description: 'Giọng nhẹ nhàng, thư giãn' },
  { id: VoiceName.Fenrir, name: 'Fenrir', gender: 'Nam', description: 'Giọng mạnh mẽ, dứt khoát' },
  { id: VoiceName.Zephyr, name: 'Zephyr', gender: 'Nữ', description: 'Giọng trong trẻo, tự nhiên' },
];

/** gemini: chất lượng cao, cần Internet + API key. browser: giọng có sẵn của máy, chạy offline. */
export type Engine = 'gemini' | 'browser';

export type Page = 'studio' | 'library' | 'settings';

export interface AppSettings {
  apiKey: string;
  defaultEngine: Engine;
  defaultVoice: VoiceName;
  browserVoiceURI: string;
}

export interface HistoryItem {
  id: string;
  createdAt: number;
  title: string;
  text: string;
  voice: string;
  engine: Engine;
  speed: number;
  duration: number;
  size: number;
  blob: Blob;
}
