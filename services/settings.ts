import { AppSettings, VoiceName } from "../types";

const KEY = 'vietvoice-settings';

const DEFAULTS: AppSettings = {
  apiKey: '',
  defaultEngine: 'gemini',
  defaultVoice: VoiceName.Zephyr,
  browserVoiceURI: '',
};

export const loadSettings = (): AppSettings => {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return DEFAULTS;
  }
};

export const saveSettings = (s: AppSettings) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // trình duyệt chặn lưu trữ: bỏ qua, cài đặt chỉ giữ trong phiên
  }
};
