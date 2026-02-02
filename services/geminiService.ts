import { GoogleGenAI, Modality } from "@google/genai";
import { VoiceName } from "../types";
import { base64ToUint8Array, createWavBlob } from "../utils/wavUtils";

const API_KEY = process.env.API_KEY;

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
  speed: number = 1
): Promise<Blob> => {
  if (!API_KEY) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  // Prepend speed instruction to the text
  // Gemini TTS follows instructions like "Say cheerfully: ..." or "Speak fast: ..."
  const instruction = getSpeedInstruction(speed);
  const finalPrompt = instruction ? `${instruction}${text}` : text;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: finalPrompt }] }],
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
      throw new Error("No audio data received from Gemini.");
    }

    const pcmData = base64ToUint8Array(base64Audio);
    
    // Gemini 2.5 Flash TTS typically outputs 24kHz audio
    const wavBlob = createWavBlob(pcmData, 24000);
    
    return wavBlob;

  } catch (error) {
    console.error("Error generating speech:", error);
    throw error;
  }
};
